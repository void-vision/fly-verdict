import { mulberry32 } from "../rng";

export function generateCNS(n: number): Float32Array {
  const rnd = mulberry32(20260917);
  const ell = (
    x: number,
    y: number,
    z: number,
    cx: number,
    cy: number,
    cz: number,
    rx: number,
    ry: number,
    rz: number,
  ) => {
    const a = (x - cx) / rx;
    const b = (y - cy) / ry;
    const c = (z - cz) / rz;
    return (Math.sqrt(a * a + b * b + c * c) - 1) * Math.min(rx, ry, rz);
  };
  const cap = (
    x: number,
    y: number,
    z: number,
    x0: number,
    y0: number,
    z0: number,
    x1: number,
    y1: number,
    z1: number,
    r: number,
  ) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dz = z1 - z0;
    const px = x - x0;
    const py = y - y0;
    const pz = z - z0;
    const t = Math.max(0, Math.min(1, (px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz)));
    return Math.hypot(px - dx * t, py - dy * t, pz - dz * t) - r;
  };
  const smin = (a: number, b: number, k: number) => {
    const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
    return b + (a - b) * h - k * h * (1 - h);
  };
  const field = (x: number, y: number, z: number): [number, number] => {
    const az = Math.abs(z);
    let head = ell(x, y, z, -0.7, 0.11, 0, 0.16, 0.16, 0.15);
    head = smin(head, cap(x, y, z, -0.74, -0.02, 0, -0.82, -0.2, 0, 0.055), 0.05);
    const eye = ell(x, y, az, -0.73, 0.14, 0.1, 0.145, 0.145, 0.085);
    let body = ell(x, y, z, -0.3, 0.1, 0, 0.29, 0.25, 0.23);
    body = smin(body, ell(x, y, z, -0.35, 0.26, 0, 0.2, 0.14, 0.17), 0.09);
    body = smin(body, head, 0.055);
    let abd = ell(x, y, z, 0.08, 0.02, 0, 0.26, 0.2, 0.19);
    abd = smin(abd, ell(x, y, z, 0.36, -0.04, 0, 0.2, 0.16, 0.15), 0.1);
    abd = smin(abd, ell(x, y, z, 0.58, -0.1, 0, 0.11, 0.1, 0.09), 0.08);
    abd = smin(abd, ell(x, y, z, 0.7, -0.13, 0, 0.06, 0.06, 0.055), 0.05);
    const tw = 0.13;
    const wcx = 0.2;
    const wcy = 0.33;
    const wu = (x - wcx) * Math.cos(tw) + (y - wcy) * Math.sin(tw);
    const wv = -(x - wcx) * Math.sin(tw) + (y - wcy) * Math.cos(tw);
    const wing = ell(wu, wv, az, 0, 0, 0.055, 0.6, 0.115, 0.045);
    let legs = cap(x, y, az, -0.46, -0.08, 0.07, -0.64, -0.34, 0.12, 0.022);
    legs = Math.min(legs, cap(x, y, az, -0.64, -0.34, 0.12, -0.44, -0.54, 0.14, 0.017));
    legs = Math.min(legs, cap(x, y, az, -0.3, -0.11, 0.07, -0.3, -0.4, 0.12, 0.022));
    legs = Math.min(legs, cap(x, y, az, -0.3, -0.4, 0.12, -0.08, -0.56, 0.14, 0.017));
    legs = Math.min(legs, cap(x, y, az, -0.14, -0.11, 0.07, 0.06, -0.36, 0.12, 0.022));
    legs = Math.min(legs, cap(x, y, az, 0.06, -0.36, 0.12, 0.3, -0.54, 0.14, 0.017));
    let d = smin(body, abd, 0.09);
    d = smin(d, eye, 0.016);
    d = Math.min(d, wing);
    d = Math.min(d, legs);
    const reg =
      legs < 0.004 ? 7 : wing < 0.004 ? 6 : eye <= Math.min(body, abd) ? (z < 0 ? 0 : 1) : x > -0.16 ? 5 : 2;
    return [d, reg];
  };

  const out: number[] = [];
  const shellT = 0.04;
  const target = Math.round(n);
  let guard = 0;
  while (out.length < target * 4 && guard < target * 140) {
    guard++;
    const x = -0.92 + rnd() * 1.8;
    const y = 0.5 - rnd() * 1.14;
    const z = (rnd() - 0.5) * 0.56;
    const [d, reg] = field(x, y, z);
    if (d > 0) continue;
    if (reg === 5) {
      const p = ((x + 0.16) % 0.145) / 0.145;
      if (p < 0.13) continue;
    }
    if (d < -shellT && rnd() > 0.28) continue;
    const keep = reg === 2 ? 0.5 : reg === 5 ? 0.45 : 1;
    if (keep < 1 && rnd() > keep) continue;
    out.push(x, y, z, reg);
  }
  return Float32Array.from(out);
}

const WAY = [
  [-0.88, 0.16, 0.1],
  [-0.73, 0.14, 0.07],
  [-0.56, 0.12, 0.02],
  [-0.34, 0.11, 0],
  [-0.2, 0.06, 0],
  [0.04, 0.02, 0],
  [0.18, 0.24, 0.04],
  [0.4, 0.3, 0.05],
] as const;

function spikePos(t: number): [number, number, number] {
  const s = Math.min(0.9999, Math.max(0, t)) * (WAY.length - 1);
  const i = Math.floor(s);
  const f = s - i;
  const a = WAY[i]!;
  const b = WAY[Math.min(WAY.length - 1, i + 1)]!;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

export function drawCloud(
  canvas: HTMLCanvasElement,
  pts: Float32Array,
  now: number,
  opts: {
    light: boolean;
    reduced: boolean;
    mouseX: number;
    mouseY: number;
    scrollY: number;
    gutterLeft: number;
  },
  bufRef: { current: ImageData | null },
) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (!w || !h) return;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    bufRef.current = null;
  }
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  if (!bufRef.current || bufRef.current.width !== w) bufRef.current = ctx.createImageData(w, h);
  const img = bufRef.current;
  const d = img.data;
  d.fill(0);

  const sp = Math.min(1, opts.scrollY / Math.max(1, window.innerHeight * 1.25));
  const zoom = 0.95 + sp * 0.55;
  const panX = sp * 0.22;
  const panY = 0.16 * sp;
  const yaw = opts.reduced ? 0.22 : Math.sin(now * 0.000115) * 0.62 + opts.mouseX * 0.26;
  const pitch = opts.reduced ? 0.12 : -0.08 + opts.mouseY * 0.14;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const spi = Math.sin(pitch);
  const stacked = opts.gutterLeft * dpr > w * 0.62;
  const gl = stacked ? w * 0.08 : opts.gutterLeft * dpr;
  const avail = Math.max(120, w - gl - 18 * dpr);
  const S = Math.min(avail / (stacked ? 1.55 : 2.16), h * (stacked ? 0.38 : 0.46)) * zoom;
  const cxp = stacked ? w * 0.72 : gl + avail / 2 + panX * S * 0.5;
  const cyp = stacked ? h * 0.52 : Math.max(S * 0.7, h * 0.44 + panY * S);
  const cyc = 5200;
  const ph = (now % cyc) / cyc;
  const spikeT = ph < 0.34 ? ph / 0.34 : -1;
  const sPos = spikeT >= 0 ? spikePos(spikeT) : null;
  const A = opts.light ? [30, 26, 22] : [236, 228, 214];
  const acc = [
    [110, 214, 178],
    [176, 152, 228],
    [234, 180, 116],
  ];
  const n = pts.length / 4;
  for (let i = 0; i < n; i++) {
    const px = pts[i * 4]!;
    const py = pts[i * 4 + 1]!;
    const pz = pts[i * 4 + 2]!;
    const reg = pts[i * 4 + 3]!;
    const x = px * cy - pz * sy;
    let z = px * sy + pz * cy;
    const y = py * cp - z * spi;
    z = py * spi + z * cp;
    const persp = 2.6 / (2.6 + z);
    const sx = (cxp + x * S * persp) | 0;
    const syp = (cyp - (y + 0.04) * S * persp) | 0;
    if (sx < 0 || syp < 0 || sx >= w || syp >= h) continue;
    let a = opts.light ? 26 + persp * 30 : 46 + persp * 62;
    let r = A[0]!;
    let g = A[1]!;
    let b = A[2]!;
    if (reg === 0 || reg === 1) {
      r = acc[2]![0] * 0.9 + r * 0.1;
      g = acc[2]![1] * 0.85 + g * 0.15;
      b = acc[2]![2] * 0.8 + b * 0.2;
      a *= 1.3;
    } else if (reg === 6) {
      r = (r + acc[1]![0]) / 2;
      g = (g + acc[1]![1]) / 2;
      b = (b + acc[1]![2] * 1.05) / 2;
      a *= 0.62;
    } else if (reg === 7) {
      a *= 1.05;
    } else if (reg === 5) {
      r = r * 0.82 + acc[2]![0] * 0.18;
      g = g * 0.86 + acc[2]![1] * 0.14;
      b = g * 0.92;
    }
    if (sPos) {
      const dx = px - sPos[0];
      const dy = py - sPos[1];
      const dz = pz - sPos[2];
      const dd = dx * dx + dy * dy + dz * dz;
      if (dd < 0.028) {
        const k = 1 - dd / 0.028;
        a = Math.min(255, a + 210 * k * k);
        r = r * (1 - k) + acc[0]![0] * k;
        g = g * (1 - k) + 255 * k;
        b = b * (1 - k) + acc[0]![2] * k;
      }
    }
    const big = persp > 1.02 ? 1 : 0;
    for (let dy = 0; dy <= big; dy++) {
      for (let dx = 0; dx <= big; dx++) {
        const xx = sx + dx;
        const yy = syp + dy;
        if (xx >= w || yy >= h) continue;
        const f = dx || dy ? 0.55 : 1;
        const o = (yy * w + xx) * 4;
        d[o] = Math.min(255, d[o]! + r * (a / 255) * f);
        d[o + 1] = Math.min(255, d[o + 1]! + g * (a / 255) * f);
        d[o + 2] = Math.min(255, d[o + 2]! + b * (a / 255) * f);
        d[o + 3] = Math.min(255, d[o + 3]! + a * f);
      }
    }
  }
  ctx.clearRect(0, 0, w, h);
  ctx.putImageData(img, 0, 0);
}
