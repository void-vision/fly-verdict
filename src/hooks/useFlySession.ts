"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefetchAllowed, registerOfflineWorker } from "@/lib/asset-cache";
import { simulateOnMain } from "@/lib/brain-main";
import { createBrainClient, type BrainClient } from "@/lib/brain-client";
import { detectFaces, loadFaceLandmarker, prefetchFaceAssets } from "@/lib/face";
import { hashFloat32 } from "@/lib/hash";
import { alignFace, canvasImageData, CANONICAL_SIZE } from "@/lib/normalize";
import { encodeOmmatidia } from "@/lib/ommatidia";
import { faceGeometry, geometryScore, MIN_IPD_PX } from "@/lib/face-geometry.mjs";
import type { FaceBox, OmmatidiaFrame, StageKey, Verdict } from "@/lib/types";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

class Cancelled extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer = 0;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]).finally(() => window.clearTimeout(timer));
}

export function useFlySession() {
  const [stage, setStage] = useState<StageKey>("empty");
  const [load, setLoad] = useState(0);
  const [loadNote, setLoadNote] = useState("idle");
  const [scan, setScan] = useState(0);
  const [fps, setFps] = useState(60);
  const [faces, setFaces] = useState<FaceBox[]>([]);
  const [frame, setFrame] = useState<OmmatidiaFrame | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [circuitInfo, setCircuitInfo] = useState<{ neurons: number; synapses: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const alignRef = useRef<HTMLCanvasElement | null>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const brainRef = useRef<BrainClient | null>(null);
  const lastBitmap = useRef<ImageBitmap | null>(null);
  const lastFaces = useRef<FaceBox[]>([]);
  const lastPicked = useRef(0);
  // Bumped by reset and every new run so stale async work cannot overwrite newer state.
  const runRef = useRef(0);

  const beginRun = useCallback(() => {
    const run = ++runRef.current;
    return () => {
      if (runRef.current !== run) throw new Cancelled();
    };
  }, []);

  const report = useCallback((err: unknown, fallback: string, next: StageKey) => {
    if (err instanceof Cancelled) return;
    setError(err instanceof Error ? err.message : fallback);
    setStage(next);
  }, []);

  const setBitmap = useCallback((bitmap: ImageBitmap | null) => {
    if (lastBitmap.current && lastBitmap.current !== bitmap) lastBitmap.current.close();
    lastBitmap.current = bitmap;
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    registerOfflineWorker();
    // Start the ~6 MB model download while the visitor reads the page, not after they tap.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const prefetch = idle(() => {
      if (prefetchAllowed()) prefetchFaceAssets();
    });
    const runs = runRef;
    return () => {
      cancelIdle(prefetch);
      runs.current++;
      stopCamera();
      brainRef.current?.terminate();
      lastBitmap.current?.close();
      lastBitmap.current = null;
    };
  }, [stopCamera]);

  const ensureEngine = useCallback(async (live: () => void) => {
    if (!brainRef.current) {
      brainRef.current = createBrainClient((label, fraction) => {
        setLoad(0.58 + fraction * 0.38);
        setLoadNote(label);
      });
    }
    setStage("loading");
    setLoad(0.04);
    setLoadNote("waking fly");
    const [landmarker, info] = await Promise.all([
      loadFaceLandmarker((fraction, label) => {
        setLoad(0.06 + fraction * 0.5);
        setLoadNote(label);
      }),
      withTimeout(brainRef.current.ready, 8000, "brain ready timed out").then((meta) => {
        setCircuitInfo(meta);
        return meta;
      }).catch(() => {
        brainRef.current?.terminate();
        brainRef.current = null;
        return null;
      }),
    ]);
    live();
    setLoad(1);
    setLoadNote(
      info
        ? `${info.neurons.toLocaleString("en-US")} neurons · visual pathway`
        : "worker unavailable · main-thread LIF",
    );
    return { landmarker, brain: brainRef.current };
  }, []);

  const runPipeline = useCallback(async (bitmap: ImageBitmap, face: FaceBox, live: () => void) => {
    live();
    const geometry = faceGeometry(face.landmarks, bitmap.width, bitmap.height);
    if (geometry && geometry.ipdPx < MIN_IPD_PX) {
      setStage("toosmall");
      return;
    }
    setStage("scanning");
    setScan(0);
    const source = sourceRef.current ?? document.createElement("canvas");
    sourceRef.current = source;
    source.width = bitmap.width;
    source.height = bitmap.height;
    const sctx = source.getContext("2d");
    if (!sctx) throw new Error("2d context unavailable");
    sctx.drawImage(bitmap, 0, 0);

    const dest = alignRef.current ?? document.createElement("canvas");
    alignRef.current = dest;
    dest.width = CANONICAL_SIZE;
    dest.height = CANONICAL_SIZE;
    alignFace(source, bitmap.width, bitmap.height, face.landmarks, dest);
    const image = canvasImageData(dest);
    const ommatidia = encodeOmmatidia(image);
    setFrame(ommatidia);

    const seed = await hashFloat32(ommatidia.luminance);
    live();
    setScan(0.42);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 0);
    });
    live();
    const brain = brainRef.current;
    let next;
    let engine: "worker" | "main" = "main";
    if (brain) {
      try {
        next = await withTimeout(brain.simulate(seed, ommatidia.luminance), 8000, "simulate timed out");
        engine = "worker";
      } catch {
        live();
        next = await simulateOnMain(seed, ommatidia.luminance);
      }
    } else {
      next = await simulateOnMain(seed, ommatidia.luminance);
    }
    live();
    setScan(1);
    setVerdict({
      ...next,
      // Unusable landmarks are rare (the face was just detected); give a middling score.
      flyScore: geometry ? geometryScore(geometry) : 70,
      geometry: geometry && { asymmetry: geometry.asymmetry, proportion: geometry.proportion },
      landmarkCount: face.landmarks.length,
      engine,
    });
    setStage("result");
  }, []);

  const inspectBitmap = useCallback(async (bitmap: ImageBitmap, live: () => void) => {
    setBitmap(bitmap);
    try {
      const { landmarker } = await ensureEngine(live);
      const found = detectFaces(landmarker, bitmap);
      setFaces(found);
      lastFaces.current = found;
      lastPicked.current = 0;
      if (found.length === 0) {
        setStage("noface");
        return;
      }
      if (found.length > 1) {
        setStage("multiface");
        return;
      }
      await runPipeline(bitmap, found[0]!, live);
    } catch (err) {
      report(err, "inspect failed", "empty");
    }
  }, [ensureEngine, report, runPipeline, setBitmap]);

  const captureVideoFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) throw new Error("camera not ready");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    sourceRef.current = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    ctx.drawImage(video, 0, 0);
    return createImageBitmap(canvas);
  }, []);

  const attachStream = useCallback(
    async (stream: MediaStream, live: () => void) => {
      stopCamera();
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("camera element missing");
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;
      video.setAttribute("playsinline", "");
      video.srcObject = stream;
      await new Promise<void>((resolve, reject) => {
        const onReady = () => {
          video.play().then(() => resolve()).catch(reject);
        };
        if (video.readyState >= 2 && video.videoWidth > 0) {
          onReady();
          return;
        }
        video.onloadedmetadata = onReady;
        video.onerror = () => reject(new Error("camera element failed"));
      });
      if (video.videoWidth < 2 || video.videoHeight < 2) {
        throw new Error("camera produced an empty frame");
      }
      // The preview needs no model; keep downloading it while the user lines up the shot.
      prefetchFaceAssets();
      live();
      setStage("live");
    },
    [stopCamera],
  );

  const startCamera = useCallback(async () => {
    const live = beginRun();
    setError(null);
    setStage("permission");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("camera unavailable (needs HTTPS and a supported browser)");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      try {
        live();
      } catch (err) {
        stream.getTracks().forEach((t) => t.stop());
        throw err;
      }
      await attachStream(stream, live);
    } catch (err) {
      if (!(err instanceof Cancelled)) stopCamera();
      report(err, "camera failed", "permission");
    }
  }, [attachStream, beginRun, report, stopCamera]);

  const capture = useCallback(async () => {
    const live = beginRun();
    setError(null);
    try {
      const bitmap = await captureVideoFrame();
      live();
      stopCamera();
      await inspectBitmap(bitmap, live);
    } catch (err) {
      report(err, "capture failed", "live");
    }
  }, [beginRun, captureVideoFrame, inspectBitmap, report, stopCamera]);

  useEffect(() => {
    if (stage !== "live") return;
    let raf = 0;
    let n = 0;
    const preview = previewRef.current ?? document.createElement("canvas");
    previewRef.current = preview;
    preview.width = 160;
    preview.height = 160;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      n++;
      if (n % 4 !== 0) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      const ctx = preview.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, 160, 160);
      setFrame(encodeOmmatidia(ctx.getImageData(0, 0, 160, 160)));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  const ingestFile = useCallback(async (file: File) => {
    const live = beginRun();
    setError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("file larger than 12MB");
      return;
    }
    stopCamera();
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      report(new Error("could not decode this image (try JPG / PNG / WEBP)"), "decode failed", "empty");
      return;
    }
    try {
      live();
    } catch {
      bitmap.close();
      return;
    }
    await inspectBitmap(bitmap, live);
  }, [beginRun, inspectBitmap, report, stopCamera]);

  const rerun = useCallback(async (face: FaceBox | undefined) => {
    const bitmap = lastBitmap.current;
    if (!bitmap || !face) return;
    const live = beginRun();
    setError(null);
    try {
      await runPipeline(bitmap, face, live);
    } catch (err) {
      report(err, "simulate failed", lastFaces.current.length > 1 ? "multiface" : "empty");
    }
  }, [beginRun, report, runPipeline]);

  const pickFace = useCallback(async (id: number) => {
    lastPicked.current = id;
    await rerun(lastFaces.current.find((f) => f.id === id));
  }, [rerun]);

  const replay = useCallback(async () => {
    await rerun(lastFaces.current.find((f) => f.id === lastPicked.current) ?? lastFaces.current[0]);
  }, [rerun]);

  const reset = useCallback(() => {
    runRef.current++;
    setStage("empty");
    setLoad(0);
    setScan(0);
    setFaces([]);
    setFrame(null);
    setVerdict(null);
    setError(null);
    stopCamera();
  }, [stopCamera]);

  return {
    stage,
    load,
    loadNote,
    scan,
    fps,
    setFps,
    faces,
    frame,
    verdict,
    error,
    circuitInfo,
    videoRef,
    startCamera,
    capture,
    ingestFile,
    pickFace,
    replay,
    reset,
  };
}
