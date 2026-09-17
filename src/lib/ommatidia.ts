import type { OmmatidiaFrame } from "./types";

const SQRT3 = Math.sqrt(3);

export const HEX_RINGS = 16;
export const OMMATIDIA_COUNT = 3 * HEX_RINGS * (HEX_RINGS + 1) + 1;

export type HexCell = { q: number; r: number; u: number; v: number };

let cachedCells: HexCell[] | null = null;
let cachedCoords: Int16Array | null = null;

export function hexCells(rings = HEX_RINGS): HexCell[] {
  if (cachedCells && rings === HEX_RINGS) return cachedCells;
  const cells: HexCell[] = [];
  for (let q = -rings; q <= rings; q++) {
    for (let r = Math.max(-rings, -q - rings); r <= Math.min(rings, -q + rings); r++) {
      const ax = 1.5 * q;
      const ay = SQRT3 * (r + q / 2);
      const rad = Math.hypot(ax, ay) / (rings + 0.15);
      const zc = Math.sqrt(Math.max(0, 1 - Math.min(1, rad * rad)));
      const scale = 0.82 + 0.18 * zc;
      cells.push({ q, r, u: ax / (rings + 0.15) / scale, v: ay / (rings + 0.15) / scale });
    }
  }
  if (rings === HEX_RINGS) cachedCells = cells;
  return cells;
}

export function hexCoords(rings = HEX_RINGS): Int16Array {
  if (cachedCoords && rings === HEX_RINGS) return cachedCoords;
  const cells = hexCells(rings);
  const coords = new Int16Array(cells.length * 2);
  cells.forEach((cell, i) => {
    coords[i * 2] = cell.q;
    coords[i * 2 + 1] = cell.r;
  });
  if (rings === HEX_RINGS) cachedCoords = coords;
  return coords;
}

/** Sample a face-aligned canvas (origin center, +x right, +y down) into ~817 ommatidia. */
export function encodeOmmatidia(
  image: ImageData,
  rings = HEX_RINGS,
): OmmatidiaFrame {
  const cells = hexCells(rings);
  const luminance = new Float32Array(cells.length);
  const { width, height, data } = image;
  const cx = width / 2;
  const cy = height / 2;
  const R = Math.min(width, height) * 0.48;

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]!;
    const sx = Math.round(cx + cell.u * R);
    const sy = Math.round(cy + cell.v * R);
    if (sx < 0 || sy < 0 || sx >= width || sy >= height) {
      luminance[i] = 0;
      continue;
    }
    const o = (sy * width + sx) * 4;
    const r = data[o]! / 255;
    const g = data[o + 1]! / 255;
    const b = data[o + 2]! / 255;
    luminance[i] = Math.max(0, Math.min(1, 0.2126 * r + 0.7152 * g + 0.0722 * b));
  }

  return {
    rings,
    count: cells.length,
    coords: hexCoords(rings),
    luminance,
    width,
    height,
  };
}

/** Placeholder portrait used by the design stills and idle eye. */
export function faceField(u: number, v: number): number {
  const oval = Math.exp(-((u / 0.52) ** 2 + ((v + 0.04) / 0.68) ** 2) * 1.9);
  let brightness = 0.1 + oval * 0.82;
  const eye = (ex: number) =>
    Math.exp(-(((u - ex) / 0.13) ** 2 + ((v + 0.16) / 0.07) ** 2) * 1.5);
  brightness -= 0.55 * (eye(-0.21) + eye(0.21));
  brightness -= 0.22 * Math.exp(-((u / 0.2) ** 2 + ((v - 0.3) / 0.055) ** 2) * 1.6);
  brightness += 0.1 * Math.exp(-(((u + 0.16) / 0.2) ** 2 + ((v - 0.02) / 0.26) ** 2) * 1.4);
  return Math.max(0, Math.min(1, brightness));
}
