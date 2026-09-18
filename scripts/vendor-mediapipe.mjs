import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL(".", import.meta.url)));
const src = join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const dest = join(root, "public/mediapipe/wasm");

if (existsSync(src)) {
  mkdirSync(join(root, "public/mediapipe"), { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log("vendored MediaPipe wasm → public/mediapipe/wasm");
} else {
  console.warn("MediaPipe wasm not found; skip vendor");
}

const model = join(root, "public/mediapipe/face_landmarker.task");
if (!existsSync(model)) {
  const url =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
  console.log(`downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`face_landmarker.task download failed: ${res.status}`);
  } else {
    mkdirSync(join(root, "public/mediapipe"), { recursive: true });
    writeFileSync(model, Buffer.from(await res.arrayBuffer()));
    console.log(`wrote ${model}`);
  }
}

// The face-blendshapes model (~0.95 MB) is only loaded when blendshapes are requested,
// which this app never does. Dropping it is a quarter of the model download.
if (existsSync(model)) {
  const zip = spawnSync("zip", ["-d", model, "face_blendshapes.tflite"], { encoding: "utf8" });
  if (zip.status === 0) console.log("stripped face_blendshapes.tflite from face_landmarker.task");
  else if (zip.error) console.warn("zip not available; keeping face_blendshapes.tflite");
}

// Decoded sizes for download progress: a gzip/br Content-Length is the compressed size.
const sizes = {};
for (const file of [
  "wasm/vision_wasm_internal.wasm",
  "wasm/vision_wasm_internal.js",
  "wasm/vision_wasm_nosimd_internal.wasm",
  "wasm/vision_wasm_nosimd_internal.js",
  "face_landmarker.task",
]) {
  const path = join(root, "public/mediapipe", file);
  if (existsSync(path)) sizes[file] = statSync(path).size;
}
writeFileSync(join(root, "src/lib/mediapipe-sizes.json"), JSON.stringify(sizes, null, 2) + "\n");
