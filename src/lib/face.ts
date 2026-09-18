import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { cachedFetch, wasmSimdSupported } from "./asset-cache";
import SIZES from "./mediapipe-sizes.json";
import type { FaceBox, Landmark } from "./types";

type VisionModule = typeof import("@mediapipe/tasks-vision");

let visionPromise: Promise<VisionModule> | null = null;
let landmarkerPromise: Promise<FaceLandmarker> | null = null;

/** The tasks-vision JS is a lazy chunk; on a flaky link it can fail like any download. */
async function vision(): Promise<VisionModule> {
  visionPromise ??= (async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await import("@mediapipe/tasks-vision");
      } catch (err) {
        if (attempt >= 3) throw err;
        await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
      }
    }
  })().catch((err) => {
    visionPromise = null; // Let the next tap try again instead of replaying this failure.
    throw err;
  });
  return visionPromise;
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

type Asset = { url: string; bytes: number };

/** The three files the landmarker needs, sized for progress (see mediapipe-sizes.json). */
function engineAssets(): Asset[] {
  const stem = wasmSimdSupported() ? "vision_wasm_internal" : "vision_wasm_nosimd_internal";
  const sized = (file: keyof typeof SIZES) => ({ url: `/mediapipe/${file}`, bytes: SIZES[file] ?? 0 });
  return [sized(`wasm/${stem}.js`), sized(`wasm/${stem}.wasm`), sized("face_landmarker.task")];
}

/** Download all engine files in parallel, reporting their combined progress. */
function downloadEngine(onBytes?: (received: number, total: number) => void): Promise<Uint8Array[]> {
  const assets = engineAssets();
  const got = assets.map(() => 0);
  const total = assets.reduce((sum, a) => sum + a.bytes, 0);
  return Promise.all(
    assets.map((asset, i) =>
      cachedFetch(
        asset.url,
        (_fraction, received) => {
          got[i] = received;
          onBytes?.(
            got.reduce((a, b) => a + b, 0),
            total,
          );
        },
        asset.bytes,
      ),
    ),
  );
}

/**
 * Start downloading in the background so the files are (mostly) here before anyone taps
 * a button. Safe to call repeatedly; a later `loadFaceLandmarker` joins the same downloads.
 */
export function prefetchFaceAssets(): void {
  // The real load retries again and reports errors.
  void vision().catch(() => {});
  void downloadEngine().catch(() => {});
}

export async function loadFaceLandmarker(
  onProgress?: (fraction: number, label: string) => void,
): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      onProgress?.(0.02, "tasks-vision");
      const [{ FaceLandmarker }, [loader, wasm, modelBytes]] = await Promise.all([
        vision(),
        downloadEngine((received, total) => {
          // Percent, not MB: these are decoded bytes, about twice what actually crosses the network.
          const share = total ? Math.min(1, received / total) : 0.5;
          onProgress?.(0.02 + 0.9 * share, `${Math.round(share * 100)}% · fly eyes + face model`);
        }),
      ]);
      onProgress?.(0.94, "compiling face model");
      // Hand MediaPipe the bytes we already have instead of letting it fetch them again.
      const fileset = {
        wasmLoaderPath: URL.createObjectURL(new Blob([loader!.slice()], { type: "text/javascript" })),
        wasmBinaryPath: URL.createObjectURL(new Blob([wasm!.slice()], { type: "application/wasm" })),
      };
      const options = {
        runningMode: "IMAGE" as const,
        numFaces: 3,
        minFaceDetectionConfidence: 0.4,
        minFacePresenceConfidence: 0.4,
        minTrackingConfidence: 0.4,
      };
      const buffer = modelBytes!.slice();
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
