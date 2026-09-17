import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { cachedFetch, wasmSimdSupported } from "./asset-cache";
import type { FaceBox, Landmark } from "./types";

type VisionModule = typeof import("@mediapipe/tasks-vision");

let visionPromise: Promise<VisionModule> | null = null;
let landmarkerPromise: Promise<FaceLandmarker> | null = null;

async function vision(): Promise<VisionModule> {
  visionPromise ??= import("@mediapipe/tasks-vision");
  return visionPromise;
}

function mbLabel(received: number, total: number, name: string): string {
  return total
    ? `${(received / 1e6).toFixed(1)} / ${(total / 1e6).toFixed(1)} MB · ${name}`
    : `${(received / 1e6).toFixed(1)} MB · ${name}`;
}

function hushMediaPipeNoise<T>(fn: () => T): T {
  const error = console.error;
  console.error = (...args: unknown[]) => {
    const text = args.map(String).join(" ");
    if (/XNNPACK|OpenGL error checking|INFO:/i.test(text)) return;
    error.apply(console, args as []);
  };
  try {
    return fn();
  } finally {
    console.error = error;
  }
}

async function hushMediaPipeNoiseAsync<T>(fn: () => Promise<T>): Promise<T> {
  const error = console.error;
  console.error = (...args: unknown[]) => {
    const text = args.map(String).join(" ");
    if (/XNNPACK|OpenGL error checking|INFO:/i.test(text)) return;
    error.apply(console, args as []);
  };
  try {
    return await fn();
  } finally {
    console.error = error;
  }
}

export async function loadFaceLandmarker(
  onProgress?: (fraction: number, label: string) => void,
): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      onProgress?.(0.04, "tasks-vision");
      const { FaceLandmarker, FilesetResolver } = await vision();
      const stem = wasmSimdSupported() ? "vision_wasm_internal" : "vision_wasm_nosimd_internal";
      onProgress?.(0.1, `${stem}.wasm`);
      await cachedFetch(`/mediapipe/wasm/${stem}.wasm`, (fraction, received, total) => {
        onProgress?.(0.1 + fraction * 0.38, mbLabel(received, total, "vision wasm"));
      });
      await cachedFetch(`/mediapipe/wasm/${stem}.js`);
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      const modelBytes = await cachedFetch("/mediapipe/face_landmarker.task", (fraction, received, total) => {
        onProgress?.(0.5 + fraction * 0.42, mbLabel(received, total, "face landmarker"));
      });
      const options = {
        runningMode: "IMAGE" as const,
        numFaces: 3,
        minFaceDetectionConfidence: 0.4,
        minFacePresenceConfidence: 0.4,
        minTrackingConfidence: 0.4,
      };
      const buffer = modelBytes.slice();
      let model: FaceLandmarker;
      try {
        model = await hushMediaPipeNoiseAsync(() =>
          FaceLandmarker.createFromOptions(fileset, {
            ...options,
            baseOptions: { modelAssetBuffer: buffer, delegate: "GPU" },
          }),
        );
      } catch {
        model = await hushMediaPipeNoiseAsync(() =>
          FaceLandmarker.createFromOptions(fileset, {
            ...options,
            baseOptions: { modelAssetBuffer: buffer, delegate: "CPU" },
          }),
        );
      }
      onProgress?.(1, "landmarker ready · 468+ points");
      return model;
    })().catch((err) => {
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

function boxOf(landmarks: Landmark[], id: number): FaceBox {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const p of landmarks) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { id, landmarks, landmarkCount: landmarks.length, minX, minY, maxX, maxY };
}

export function detectFaces(
  landmarker: FaceLandmarker,
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
): FaceBox[] {
  let source: HTMLImageElement | HTMLCanvasElement = image as HTMLImageElement | HTMLCanvasElement;
  if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    ctx.drawImage(image, 0, 0);
    source = canvas;
  }
  const result = hushMediaPipeNoise(() => landmarker.detect(source));
  return (result.faceLandmarks ?? []).map((pts, id) =>
    boxOf(
      pts.map((p) => ({ x: p.x, y: p.y, z: p.z })),
      id,
    ),
  );
}
