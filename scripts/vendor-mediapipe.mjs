import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
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
