const SQRT3 = Math.sqrt(3);
export const HEX_RINGS = 16;
export const OMM = 3 * HEX_RINGS * (HEX_RINGS + 1) + 1;
export const LPLC2_COUNT = 77;
export const MAX_RATE_HZ = 150;
export const WINDOW_MS = 200;
export const DT_MS = 0.5;
export const SIM_STEPS = Math.round(WINDOW_MS / DT_MS);
export const MAGIC = 0x4656434e;
export const VERSION = 2;
export const HEADER_BYTES = 64;

export const LAYOUT = {
  columnCount: OMM,
  photoPerColumn: 6,
  laminaTypes: 6,
  interTypes: 5,
  medullaTypes: 4,
  t45Types: 8,
  lobulaTypes: 4,
  wideTypes: 2,
  lplc2Count: LPLC2_COUNT,
  readoutCount: 4,
};

export function expectedNeuronCount() {
  const c = LAYOUT.columnCount;
  return (
    c * LAYOUT.photoPerColumn +
    c * LAYOUT.laminaTypes +
    c * LAYOUT.interTypes +
    c * LAYOUT.medullaTypes +
    c * LAYOUT.t45Types +
    c * LAYOUT.lobulaTypes +
    c * LAYOUT.wideTypes +
    LAYOUT.lplc2Count +
    LAYOUT.readoutCount
  );
}

function hexCells(rings = HEX_RINGS) {
  const cells = [];
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
  return cells;
}

function hexDistance(aq, ar, bq, br) {
  const dq = aq - bq;
  const dr = ar - br;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

function packed(q, r) {
  return ((q + 32) << 8) | (r + 32);
}

export function buildVisualCircuit() {
  const cells = hexCells();
  const cols = cells.length;
  const R0 = 0;
  const L0 = cols * LAYOUT.photoPerColumn;
  const I0 = L0 + cols * LAYOUT.laminaTypes;
  const M0 = I0 + cols * LAYOUT.interTypes;
  const T0 = M0 + cols * LAYOUT.medullaTypes;
  const B0 = T0 + cols * LAYOUT.t45Types;
  const W0 = B0 + cols * LAYOUT.lobulaTypes;
  const P0 = W0 + cols * LAYOUT.wideTypes;
  const gf = P0 + LPLC2_COUNT;
  const dnp09 = gf + 1;
  const dna02L = gf + 2;
  const dna02R = gf + 3;
  const neuronCount = dna02R + 1;

  const L1 = L0;
  const L2 = L0 + cols;
  const L3 = L0 + cols * 2;
  const C2 = L0 + cols * 3;
  const C3 = L0 + cols * 4;
  const T1 = L0 + cols * 5;
  const Mi1 = I0;
  const Mi4 = I0 + cols;
  const Mi9 = I0 + cols * 2;
  const Tm3 = I0 + cols * 3;
  const TmY5 = I0 + cols * 4;
  const Tm1 = M0;
  const Tm2 = M0 + cols;
  const Tm4 = M0 + cols * 2;
  const Tm9 = M0 + cols * 3;
  const T4a = T0;
  const T4b = T0 + cols;
  const T4c = T0 + cols * 2;
  const T4d = T0 + cols * 3;
  const T5a = T0 + cols * 4;
  const T5b = T0 + cols * 5;
  const T5c = T0 + cols * 6;
  const T5d = T0 + cols * 7;
  const LC4 = B0;
  const LC11 = B0 + cols;
  const LC15 = B0 + cols * 2;
  const LPLC1 = B0 + cols * 3;
  const Lawf1 = W0;
  const Lawf2 = W0 + cols;

  const indexByQR = new Map();
  for (let i = 0; i < cols; i++) indexByQR.set(packed(cells[i].q, cells[i].r), i);
  const nbs = Array.from({ length: cols }, () => []);
  const dirs = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
  ];
  for (let i = 0; i < cols; i++) {
    const cell = cells[i];
    for (const [dq, dr] of dirs) {
      const j = indexByQR.get(packed(cell.q + dq, cell.r + dr));
      if (j !== undefined) nbs[i].push(j);
    }
  }

  const pre = [];
  const post = [];
  const w = [];
  const add = (a, b, weight) => {
    pre.push(a);
    post.push(b);
    w.push(weight);
  };

  for (let i = 0; i < cols; i++) {
    for (let r = 0; r < LAYOUT.photoPerColumn; r++) {
      const pr = R0 + i * LAYOUT.photoPerColumn + r;
      add(pr, L1 + i, 0.55);
      add(pr, L2 + i, 0.72);
      add(pr, L3 + i, 0.38);
      add(pr, T1 + i, 0.12);
    }
    add(L1 + i, Tm1 + i, 0.82);
    add(L1 + i, Tm9 + i, 0.6);
    add(L1 + i, Mi1 + i, 0.7);
    add(L1 + i, Mi9 + i, 0.48);
    add(L2 + i, Tm2 + i, 0.78);
    add(L2 + i, Tm4 + i, 0.55);
    add(L2 + i, Tm3 + i, 0.4);
    add(L3 + i, Tm9 + i, 0.48);
    add(L3 + i, Mi4 + i, 0.62);
    add(L3 + i, Mi9 + i, 0.35);
    add(L1 + i, C2 + i, 0.4);
    add(L2 + i, C3 + i, 0.4);
    add(C2 + i, L1 + i, -0.22);
    add(C3 + i, L2 + i, -0.22);
    add(Mi1 + i, Tm3 + i, 0.66);
    add(Mi1 + i, T4a + i, 0.5);
    add(Mi4 + i, Tm1 + i, 0.28);
    add(Mi9 + i, Tm9 + i, 0.32);
    add(Tm2 + i, T4a + i, 0.7);
    add(Tm2 + i, T4b + i, 0.55);
    add(Tm4 + i, T4c + i, 0.5);
    add(Tm4 + i, T4d + i, 0.45);
    add(Tm3 + i, T4b + i, 0.42);
    add(Tm3 + i, TmY5 + i, 0.38);
    add(Tm1 + i, T5a + i, 0.7);
    add(Tm1 + i, T5b + i, 0.55);
    add(Tm9 + i, T5c + i, 0.5);
    add(Tm9 + i, T5d + i, 0.45);
    add(TmY5 + i, T5a + i, 0.3);
    add(T4a + i, LC4 + i, 0.3);
    add(T4b + i, LC4 + i, 0.24);
    add(T4c + i, LC4 + i, 0.2);
    add(T4d + i, LPLC1 + i, 0.28);
    add(T5a + i, LC11 + i, 0.34);
    add(T5b + i, LC11 + i, 0.26);
    add(T5c + i, LC15 + i, 0.4);
    add(T5d + i, LC15 + i, 0.28);
    add(T5a + i, LPLC1 + i, 0.22);

    const laterality = cells[i].u < 0 ? dna02L : dna02R;
    const approach = 0.024 * (0.4 + Math.hypot(cells[i].u, cells[i].v));
    add(Tm2 + i, laterality, approach);
    add(L2 + i, laterality, approach * 0.55);
    add(T4a + i, laterality, approach * 0.35);

    for (const j of nbs[i]) {
      add(Tm1 + i, Tm1 + j, 0.08);
      add(Tm2 + i, Tm2 + j, 0.08);
      add(T4a + i, T4a + j, 0.1);
      add(T5a + i, T5a + j, 0.12);
      add(L2 + j, Lawf1 + i, 0.09);
      add(L1 + j, Lawf2 + i, 0.08);
    }
    add(Lawf1 + i, Tm2 + i, -0.12);
    add(Lawf2 + i, Tm1 + i, -0.1);
  }

  const coarse = hexCells(5)
    .sort((a, b) => Math.hypot(a.u, a.v) - Math.hypot(b.u, b.v) || a.q - b.q)
    .slice(0, LPLC2_COUNT);

  coarse.forEach((unit, j) => {
    const dest = P0 + j;
    for (let i = 0; i < cols; i++) {
      const d = hexDistance(cells[i].q, cells[i].r, unit.q * 3, unit.r * 3);
      if (d > 4) continue;
      const center = Math.exp(-d * d * 0.18);
      add(T5a + i, dest, 0.42 * center);
      add(T5b + i, dest, 0.28 * center);
      add(LC11 + i, dest, 0.35 * center);
      add(L1 + i, dest, 0.22 * center);
      add(L2 + i, dest, -0.08 * center);
    }
    add(dest, gf, 0.42);
  });
  add(gf, dnp09, 1.15);

  return indexOutgoing({
    neuronCount,
    pre: Int32Array.from(pre),
    post: Int32Array.from(post),
    w: Float32Array.from(w),
    photoCount: cols * LAYOUT.photoPerColumn,
    photoPerColumn: LAYOUT.photoPerColumn,
    columnCount: cols,
    l1Start: L1,
    l2Start: L2,
    lplc2Start: P0,
    lplc2Count: LPLC2_COUNT,
    gf,
    dnp09,
    dna02L,
    dna02R,
  });
}

export function indexOutgoing(circuit) {
  const n = circuit.neuronCount;
  const synN = circuit.pre.length;
  const counts = new Uint32Array(n);
  for (let i = 0; i < synN; i++) counts[circuit.pre[i]]++;
  const outStart = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) outStart[i + 1] = outStart[i] + counts[i];
  const outPost = new Int32Array(synN);
  const outW = new Float32Array(synN);
  const cursor = outStart.slice();
  for (let i = 0; i < synN; i++) {
    const src = circuit.pre[i];
    const at = cursor[src];
    cursor[src] = at + 1;
    outPost[at] = circuit.post[i];
    outW[at] = circuit.w[i];
  }
  circuit.outStart = outStart;
  circuit.outPost = outPost;
  circuit.outW = outW;
  return circuit;
}

function writeLeb128(out, value) {
  let v = value >>> 0;
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v);
}

function readLeb128(view, offset) {
  let result = 0;
  let shift = 0;
  while (offset.i < view.length) {
    const byte = view[offset.i++];
    result |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) return result >>> 0;
    shift += 7;
  }
  throw new Error("truncated LEB128");
}

export function encodeConnectome(circuit) {
  const incoming = Array.from({ length: circuit.neuronCount }, () => []);
  for (let i = 0; i < circuit.pre.length; i++) {
    incoming[circuit.post[i]].push({ pre: circuit.pre[i], w: circuit.w[i] });
  }
  const body = [];
  for (let dest = 0; dest < circuit.neuronCount; dest++) {
    const row = incoming[dest].sort((a, b) => a.pre - b.pre);
    writeLeb128(body, row.length);
    const signs = new Uint8Array(Math.ceil(row.length / 8) || 0);
    const deltas = [];
    const weights = [];
    let prev = 0;
    row.forEach((edge, i) => {
      if (edge.w < 0) signs[i >> 3] |= 1 << (i & 7);
      deltas.push(edge.pre - prev);
      prev = edge.pre;
      weights.push(Math.max(0, Math.min(127, Math.round(Math.abs(edge.w) * 100))));
    });
    for (const byte of signs) body.push(byte);
    for (const d of deltas) writeLeb128(body, d);
    for (const mag of weights) body.push(mag);
  }
  const header = Buffer.alloc(HEADER_BYTES);
  header.writeUInt32BE(MAGIC, 0);
  header.writeUInt8(VERSION, 4);
  header.writeUInt32BE(circuit.neuronCount, 8);
  header.writeUInt32BE(circuit.pre.length, 12);
  header.writeUInt32BE(circuit.photoCount, 16);
  header.writeUInt16BE(circuit.photoPerColumn, 20);
  header.writeUInt16BE(circuit.columnCount, 22);
  header.writeUInt32BE(circuit.l1Start, 24);
  header.writeUInt32BE(circuit.l2Start, 28);
  header.writeUInt32BE(circuit.lplc2Start, 32);
  header.writeUInt16BE(circuit.lplc2Count, 36);
  header.writeUInt32BE(circuit.gf, 40);
  header.writeUInt32BE(circuit.dnp09, 44);
  header.writeUInt32BE(circuit.dna02L, 48);
  header.writeUInt32BE(circuit.dna02R, 52);
  return Buffer.concat([header, Buffer.from(body)]);
}

export function decodeConnectome(bytes) {
  if (bytes.readUInt32BE(0) !== MAGIC) throw new Error("bad connectome magic");
  if (bytes[4] !== VERSION) throw new Error("unsupported connectome version");
  const neuronCount = bytes.readUInt32BE(8);
  const synapseCount = bytes.readUInt32BE(12);
  const meta = {
    neuronCount,
    photoCount: bytes.readUInt32BE(16),
    photoPerColumn: bytes.readUInt16BE(20),
    columnCount: bytes.readUInt16BE(22),
    l1Start: bytes.readUInt32BE(24),
    l2Start: bytes.readUInt32BE(28),
    lplc2Start: bytes.readUInt32BE(32),
    lplc2Count: bytes.readUInt16BE(36),
    gf: bytes.readUInt32BE(40),
    dnp09: bytes.readUInt32BE(44),
    dna02L: bytes.readUInt32BE(48),
    dna02R: bytes.readUInt32BE(52),
  };
  const raw = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const cursor = { i: HEADER_BYTES };
  const pre = new Int32Array(synapseCount);
  const post = new Int32Array(synapseCount);
  const w = new Float32Array(synapseCount);
  let n = 0;
  for (let dest = 0; dest < neuronCount; dest++) {
    const count = readLeb128(raw, cursor);
    const signBytes = Math.ceil(count / 8);
    const signs = raw.subarray(cursor.i, cursor.i + signBytes);
    cursor.i += signBytes;
    let src = 0;
    const pres = new Int32Array(count);
    for (let i = 0; i < count; i++) {
      src += readLeb128(raw, cursor);
      pres[i] = src;
    }
    for (let i = 0; i < count; i++) {
      const mag = raw[cursor.i++] / 100;
      const neg = ((signs[i >> 3] ?? 0) & (1 << (i & 7))) !== 0;
      pre[n] = pres[i];
      post[n] = dest;
      w[n] = neg ? -mag : mag;
      n++;
    }
  }
  if (n !== synapseCount) throw new Error(`synapse count mismatch ${n} != ${synapseCount}`);
  return indexOutgoing({ ...meta, pre, post, w });
}

export function photoreceptorRates(luminance, circuit) {
  const rates = new Float32Array(circuit.neuronCount);
  const cols = Math.min(luminance.length, circuit.columnCount);
  const per = circuit.photoPerColumn;
  for (let i = 0; i < cols; i++) {
    const light = luminance[i];
    const base = i * per;
    for (let r = 0; r < per; r++) rates[base + r] = light * MAX_RATE_HZ;
    rates[circuit.l1Start + i] = (1 - light) * MAX_RATE_HZ * 0.85;
    rates[circuit.l2Start + i] = light * MAX_RATE_HZ * 0.55;
  }
  return rates;
}

export function mulberry32(seed) {
  let q = seed >>> 0;
  return () => {
    q = (q + 0x6d2b79f5) >>> 0;
    let t = Math.imul(q ^ (q >>> 15), 1 | q);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulateCircuit(circuit, rates, seed) {
  const rng = mulberry32(seed || 1);
  const n = circuit.neuronCount;
  const v = new Float32Array(n);
  const ref = new Int16Array(n);
  const spikes = new Uint16Array(n);
  const I = new Float32Array(n);
  v.fill(-65);
  const driven = [];
  const pFire = [];
  for (let i = 0; i < n; i++) {
    const rate = rates[i] ?? 0;
    if (rate > 0) {
      driven.push(i);
      pFire.push(1 - Math.exp((-rate * DT_MS) / 1000));
    }
  }
  const { outStart, outPost, outW } = circuit;
  const leak = 1 - DT_MS / 10;
  let firstEscape = -1;
  const firedIds = new Int32Array(n);
  let firedN = 0;
  for (let step = 0; step < SIM_STEPS; step++) {
    I.fill(0);
    for (let d = 0; d < driven.length; d++) {
      if (rng() < pFire[d]) I[driven[d]] += 14;
    }
    for (let f = 0; f < firedN; f++) {
      const src = firedIds[f];
      for (let s = outStart[src]; s < outStart[src + 1]; s++) I[outPost[s]] += outW[s] * 14;
    }
    firedN = 0;
    for (let i = 0; i < n; i++) {
      if (ref[i] > 0) {
        ref[i]--;
        v[i] = -65;
        continue;
      }
      const next = -65 + (v[i] + 65) * leak + I[i];
      if (next >= -50) {
        v[i] = -65;
        ref[i] = 4;
        spikes[i]++;
        firedIds[firedN++] = i;
        if (firstEscape < 0 && i === circuit.gf && spikes[i] >= 12) firstEscape = step * DT_MS;
      } else {
        v[i] = next;
      }
    }
  }
  let lplc2 = 0;
  for (let i = 0; i < circuit.lplc2Count; i++) lplc2 += spikes[circuit.lplc2Start + i];
  return {
    lplc2,
    gf: spikes[circuit.gf],
    dnp09: spikes[circuit.dnp09],
    dna02: spikes[circuit.dna02L] + spikes[circuit.dna02R],
    windowMs: WINDOW_MS,
    latencyMs: firstEscape < 0 ? WINDOW_MS : Math.max(8, Math.round(firstEscape)),
  };
}
