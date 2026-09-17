import { faceField, hexCells } from "../ommatidia";

const SQRT3 = Math.sqrt(3);
import type { OmmatidiaFrame, StageKey, VerdictKind } from "../types";

const ACCENT: Record<VerdictKind, [number, number, number]> = {
  escape: [232, 168, 96],
  approach: [110, 214, 178],
  hesitate: [178, 150, 230],
};

export function fitCanvas(canvas: HTMLCanvasElement): [CanvasRenderingContext2D, number, number, number] {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(canvas.clientWidth * dpr) || 320;
  const h = Math.round(canvas.clientHeight * dpr) || 200;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  return [ctx, w, h, dpr];
}

export function drawOmmatidiaEye(
  canvas: HTMLCanvasElement,
  now: number,
  opts: {
    light: boolean;
    reduced: boolean;
    stage: StageKey;
    scan: number;
    kind: VerdictKind;
    frame?: OmmatidiaFrame | null;
    faceCount?: number;
  },
) {
  const [ctx, w, h, dpr] = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  const R = Math.min(w, h) * 0.47;
  const cx = w / 2;
  const cy = h / 2;
  const rings = 16;
  const hr = R / (rings + 1.1);
  const live =
    opts.stage === "scanning" ||
    opts.stage === "result" ||
    opts.stage === "live" ||
    opts.stage === "noface" ||
    opts.stage === "multiface";
  const accent = ACCENT[opts.kind];
  const cells = hexCells(rings);
  const lum = opts.frame?.luminance;

  ctx.strokeStyle = opts.light ? "rgba(35,31,28,.18)" : "rgba(242,236,226,.14)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R + hr * 0.9, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]!;
    const ax = hr * 1.5 * cell.q;
    const ay = hr * SQRT3 * (cell.r + cell.q / 2);
    const rad = Math.hypot(ax, ay) / R;
    if (rad > 1.02) continue;
    const zc = Math.sqrt(Math.max(0, 1 - Math.min(1, rad * rad)));
    const px = cx + ax * (0.86 + 0.14 * zc);
    const py = cy + ay * (0.86 + 0.14 * zc);
    const size = hr * 0.92 * (0.55 + 0.45 * zc);
    let val: number;
    if (live && lum && lum[i] !== undefined) {
      const reveal = opts.stage === "scanning" ? opts.scan * 1.25 - (cell.v + 1) / 2 : 1;
      val = reveal > 0 ? lum[i]! * Math.min(1, reveal * 2.2) : 0.04;
    } else if (live) {
      const reveal = opts.stage === "scanning" ? opts.scan * 1.25 - (cell.v + 1) / 2 : 1;
      val = reveal > 0 ? faceField(cell.u, cell.v) * Math.min(1, reveal * 2.2) : 0.04;
    } else {
      const brz = opts.reduced ? 0.5 : 0.5 + 0.5 * Math.sin(now * 0.0013 - rad * 3.2);
      val = 0.06 + 0.16 * brz * (0.4 + 0.6 * zc);
    }
    const dim = 0.35 + 0.65 * zc;
    let rr: number;
    let gg: number;
    let bb: number;
    if (opts.light) {
      const k = 1 - val * 0.85;
      rr = 235 * k * dim + 18;
      gg = 228 * k * dim + 16;
      bb = 214 * k * dim + 14;
    } else {
      rr = (28 + val * 210) * dim;
      gg = (26 + val * 202) * dim;
      bb = (24 + val * 186) * dim;
    }
    if (live) {
      rr = rr * 0.82 + accent[0] * val * 0.22;
      gg = gg * 0.82 + accent[1] * val * 0.22;
      bb = bb * 0.82 + accent[2] * val * 0.22;
    }
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 180) * (60 * k);
      const hx = px + size * Math.cos(a);
      const hy = py + size * Math.sin(a);
      if (k) ctx.lineTo(hx, hy);
      else ctx.moveTo(hx, hy);
    }
    ctx.closePath();
    ctx.fillStyle = `rgb(${rr | 0},${gg | 0},${bb | 0})`;
    ctx.fill();
    if (val > 0.42) {
      ctx.fillStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${0.1 + val * 0.18})`;
      ctx.beginPath();
      ctx.arc(px - size * 0.28, py - size * 0.3, size * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (opts.stage === "scanning" && !opts.reduced) {
    const y = cy + (opts.scan * 2.3 - 1.15) * R;
    const grd = ctx.createLinearGradient(cx - R, y, cx + R, y);
    grd.addColorStop(0, "rgba(110,214,178,0)");
    grd.addColorStop(0.5, "rgba(110,214,178,.85)");
    grd.addColorStop(1, "rgba(110,214,178,0)");
    ctx.strokeStyle = grd;
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(cx - R, y);
    ctx.lineTo(cx + R, y);
    ctx.stroke();
  }

  if (opts.stage === "noface" || opts.stage === "multiface") {
    ctx.strokeStyle = opts.stage === "noface" ? "rgba(232,168,96,.9)" : "rgba(178,150,230,.9)";
    ctx.lineWidth = 1.2 * dpr;
    if (opts.stage === "noface") {
      ctx.setLineDash([6 * dpr, 6 * dpr]);
      ctx.strokeRect(cx - R * 0.3, cy - R * 0.36, R * 0.6, R * 0.72);
      ctx.setLineDash([]);
    } else {
      const boxes = [
        [-0.34, -0.1, 0.34],
        [0.3, 0.06, 0.28],
      ];
      for (const [bx, by, bs] of boxes) {
        ctx.strokeRect(cx + bx! * R - (bs! * R) / 2, cy + by! * R - (bs! * R) / 2, bs! * R, bs! * R);
      }
    }
  }
}

export function drawStep1(canvas: HTMLCanvasElement, light: boolean) {
  const [ctx, w, h] = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  const ink = light ? "35,31,28" : "242,236,226";
  const hr = h / 13;
  for (let q = -14; q <= 14; q++) {
    for (let r = -9; r <= 9; r++) {
      const ax = hr * 1.5 * q;
      const ay = hr * SQRT3 * (r + q / 2);
      if (Math.abs(ax) > w / 2 - hr || Math.abs(ay) > h / 2 - hr) continue;
      const v = faceField((ax / (h * 0.42)) * 0.8, ay / (h * 0.42));
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 180) * 60 * k;
        const x = w / 2 + ax + hr * 0.88 * Math.cos(a);
        const y = h / 2 + ay + hr * 0.88 * Math.sin(a);
        if (k) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(${ink},${0.06 + v * 0.62})`;
      ctx.fill();
    }
  }
}

export function drawStep2(canvas: HTMLCanvasElement, light: boolean) {
  const [ctx, w, h, dpr] = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  const ink = light ? "35,31,28" : "242,236,226";
  const M = 22;
  ctx.strokeStyle = `rgba(${ink},.30)`;
  ctx.lineWidth = 1 * dpr;
  for (let i = 0; i < M; i++) {
    const t = i / (M - 1);
    const y = h * 0.08 + t * h * 0.84;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, y);
    ctx.quadraticCurveTo(w * 0.58, y, w * 0.85, h * 0.5);
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(${ink},.72)`;
  for (let i = 0; i < M; i++) {
    const y = h * 0.08 + (i / (M - 1)) * h * 0.84;
    ctx.fillRect(w * 0.07, y - 1 * dpr, 3.5 * dpr, 2 * dpr);
  }
  ctx.fillStyle = "rgba(178,150,230,.95)";
  ctx.beginPath();
  ctx.arc(w * 0.85, h * 0.5, 5 * dpr, 0, Math.PI * 2);
  ctx.fill();
}

export function drawStep3(canvas: HTMLCanvasElement, light: boolean) {
  const [ctx, w, h, dpr] = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  const ink = light ? "35,31,28" : "242,236,226";
  const trace = (color: string, amp: number, seed: number, base: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.3 * dpr;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const t = x / w;
      let v = Math.sin(t * 26 + seed) * 0.12;
      const burst = Math.exp(-((t - 0.62) ** 2) / 0.004);
      v += burst * amp * (Math.sin(t * 190 + seed) > 0.2 ? 1 : 0.1);
      const y = base - v * h * 0.38;
      if (x) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
  };
  trace("rgba(232,168,96,.95)", 1, 0, h * 0.34);
  trace("rgba(110,214,178,.95)", 0.45, 2.1, h * 0.78);
  ctx.strokeStyle = `rgba(${ink},.14)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.62, 0);
  ctx.lineTo(w * 0.62, h);
  ctx.stroke();
}

export function drawShareMosaic(canvas: HTMLCanvasElement, kind: VerdictKind, light: boolean) {
  const [ctx, w, h] = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  const cols = ACCENT[kind];
  const R = Math.min(w, h) * 0.46;
  const cx = w / 2;
  const cy = h / 2;
  const rings = 11;
  const hr = R / (rings + 1.1);
  for (let q = -rings; q <= rings; q++) {
    for (let r = Math.max(-rings, -q - rings); r <= Math.min(rings, -q + rings); r++) {
      const ax = hr * 1.5 * q;
      const ay = hr * SQRT3 * (r + q / 2);
      const rad = Math.hypot(ax, ay) / R;
      if (rad > 1.02) continue;
      const zc = Math.sqrt(Math.max(0, 1 - Math.min(1, rad * rad)));
      const px = cx + ax * (0.88 + 0.12 * zc);
      const py = cy + ay * (0.88 + 0.12 * zc);
      const size = hr * 0.9 * (0.6 + 0.4 * zc);
      const v = faceField(ax / R / (0.85 + 0.15 * zc), ay / R / (0.85 + 0.15 * zc));
      const dim = 0.4 + 0.6 * zc;
      let rr: number;
      let gg: number;
      let bb: number;
      if (light) {
        const t = 1 - v * 0.8;
        rr = 226 * t * dim + 20;
        gg = 219 * t * dim + 18;
        bb = 206 * t * dim + 16;
      } else {
        rr = (26 + v * 200) * dim;
        gg = (24 + v * 194) * dim;
        bb = (22 + v * 178) * dim;
      }
      rr = rr * 0.8 + cols[0] * v * 0.26;
      gg = gg * 0.8 + cols[1] * v * 0.26;
      bb = bb * 0.8 + cols[2] * v * 0.26;
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const a = (Math.PI / 180) * 60 * j;
        ctx[j ? "lineTo" : "moveTo"](px + size * Math.cos(a), py + size * Math.sin(a));
      }
      ctx.closePath();
      ctx.fillStyle = `rgb(${rr | 0},${gg | 0},${bb | 0})`;
      ctx.fill();
    }
  }
}
