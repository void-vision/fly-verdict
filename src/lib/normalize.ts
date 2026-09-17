import type { Landmark, Point2 } from "./types";

const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const LEFT_EYE_INNER = 133;
const RIGHT_EYE_INNER = 362;

export const CANONICAL_SIZE = 256;
export const TARGET_IPD = 0.28;

function eyeCenter(landmarks: Landmark[], iris: number, a: number, b: number): Point2 {
  const irisPt = landmarks[iris];
  if (irisPt) return { x: irisPt.x, y: irisPt.y };
  const pa = landmarks[a];
  const pb = landmarks[b];
  if (!pa || !pb) return { x: 0.5, y: 0.5 };
  return { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
}

export function eyePair(landmarks: Landmark[]): { left: Point2; right: Point2 } {
  return {
    left: eyeCenter(landmarks, LEFT_IRIS, LEFT_EYE_OUTER, LEFT_EYE_INNER),
    right: eyeCenter(landmarks, RIGHT_IRIS, RIGHT_EYE_OUTER, RIGHT_EYE_INNER),
  };
}

/**
 * Rotate so the eye line is horizontal, scale to a fixed IPD, then crop.
 * MediaPipe coords are normalized 0..1 with +y down.
 */
export function alignFace(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  landmarks: Landmark[],
  dest: HTMLCanvasElement,
): HTMLCanvasElement {
  dest.width = CANONICAL_SIZE;
  dest.height = CANONICAL_SIZE;
  const ctx = dest.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");

  const { left, right } = eyePair(landmarks);
  const lx = left.x * srcW;
  const ly = left.y * srcH;
  const rx = right.x * srcW;
  const ry = right.y * srcH;
  const angle = Math.atan2(ry - ly, rx - lx);
  const ipd = Math.hypot(rx - lx, ry - ly) || 1;
  const midX = (lx + rx) / 2;
  const midY = (ly + ry) / 2;
  const scale = (TARGET_IPD * CANONICAL_SIZE) / ipd;

  ctx.save();
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(0, 0, CANONICAL_SIZE, CANONICAL_SIZE);
  ctx.translate(CANONICAL_SIZE / 2, CANONICAL_SIZE * 0.42);
  ctx.scale(scale, scale);
  ctx.rotate(-angle);
  ctx.translate(-midX, -midY);
  ctx.drawImage(source, 0, 0, srcW, srcH);
  ctx.restore();
  return dest;
}

export function canvasImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
