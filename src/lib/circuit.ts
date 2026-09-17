import { HEX_RINGS, hexCells, OMMATIDIA_COUNT } from "./ommatidia";

export const LPLC2_COUNT = 77;
export const MAX_RATE_HZ = 150;
export const WINDOW_MS = 200;
export const DT_MS = 0.5;
export const SIM_STEPS = Math.round(WINDOW_MS / DT_MS);

/** Cartridge / column cell-type counts. Must match scripts/visual-pathway.mjs. */
export const LAYOUT = {
  columnCount: OMMATIDIA_COUNT,
  photoPerColumn: 6,
  laminaTypes: 6,
  interTypes: 5,
  medullaTypes: 4,
  t45Types: 8,
  lobulaTypes: 4,
  wideTypes: 2,
  lplc2Count: LPLC2_COUNT,
  readoutCount: 4,
} as const;

export function expectedNeuronCount(): number {
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

export type Synapse = { pre: number; post: number; w: number };

export type VisualCircuit = {
  neuronCount: number;
  pre: Int32Array;
  post: Int32Array;
  w: Float32Array;
  outStart: Int32Array;
  outPost: Int32Array;
  outW: Float32Array;
  photoCount: number;
  photoPerColumn: number;
  columnCount: number;
  l1Start: number;
  l2Start: number;
  lplc2Start: number;
  lplc2Count: number;
  gf: number;
  dnp09: number;
  dna02L: number;
  dna02R: number;
};

/** CSR by presynaptic id so LIF only walks axons that just spiked. */
export function indexOutgoing(circuit: VisualCircuit): VisualCircuit {
  const n = circuit.neuronCount;
  const synN = circuit.pre.length;
  const counts = new Uint32Array(n);
  for (let i = 0; i < synN; i++) counts[circuit.pre[i]!]!++;
  const outStart = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) outStart[i + 1] = outStart[i]! + counts[i]!;
  const outPost = new Int32Array(synN);
  const outW = new Float32Array(synN);
  const cursor = outStart.slice();
  for (let i = 0; i < synN; i++) {
    const src = circuit.pre[i]!;
    const at = cursor[src]!;
    cursor[src] = at + 1;
    outPost[at] = circuit.post[i]!;
    outW[at] = circuit.w[i]!;
  }
  circuit.outStart = outStart;
  circuit.outPost = outPost;
  circuit.outW = outW;
  return circuit;
}

function hexDistance(aq: number, ar: number, bq: number, br: number): number {
  const dq = aq - bq;
  const dr = ar - br;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

function packed(q: number, r: number): number {
  return ((q + 32) << 8) | (r + 32);
}

/** MaleCNS-inspired optic-lobe subgraph, retinotopic, not the 166k whole brain. */
export function buildVisualCircuit(): VisualCircuit {
  const cells = hexCells(HEX_RINGS);
  const cols = cells.length;
  if (cols !== OMMATIDIA_COUNT) {
    throw new Error(`ommatidia mismatch ${cols} != ${OMMATIDIA_COUNT}`);
  }

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

  const indexByQR = new Map<number, number>();
  for (let i = 0; i < cols; i++) {
    const cell = cells[i]!;
    indexByQR.set(packed(cell.q, cell.r), i);
  }

  const nbs: number[][] = Array.from({ length: cols }, () => []);
  const dirs: [number, number][] = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
  ];
  for (let i = 0; i < cols; i++) {
    const cell = cells[i]!;
    const row = nbs[i]!;
    for (const [dq, dr] of dirs) {
      const j = indexByQR.get(packed(cell.q + dq, cell.r + dr));
      if (j !== undefined) row.push(j);
    }
  }

  const pre: number[] = [];
  const post: number[] = [];
  const w: number[] = [];
  const add = (a: number, b: number, weight: number) => {
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

    const laterality = cells[i]!.u < 0 ? dna02L : dna02R;
    const approach = 0.024 * (0.4 + Math.hypot(cells[i]!.u, cells[i]!.v));
    add(Tm2 + i, laterality, approach);
    add(L2 + i, laterality, approach * 0.55);
    add(T4a + i, laterality, approach * 0.35);

    for (const j of nbs[i]!) {
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
    .slice()
    .sort((a, b) => Math.hypot(a.u, a.v) - Math.hypot(b.u, b.v) || a.q - b.q)
    .slice(0, LPLC2_COUNT);

  coarse.forEach((unit, j) => {
    const dest = P0 + j;
    for (let i = 0; i < cols; i++) {
      const cell = cells[i]!;
      const d = hexDistance(cell.q, cell.r, unit.q * 3, unit.r * 3);
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
    outStart: new Int32Array(0),
    outPost: new Int32Array(0),
    outW: new Float32Array(0),
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

export function photoreceptorRates(luminance: Float32Array, circuit: VisualCircuit): Float32Array {
  const rates = new Float32Array(circuit.neuronCount);
  const cols = Math.min(luminance.length, circuit.columnCount);
  const per = circuit.photoPerColumn;
  for (let i = 0; i < cols; i++) {
    const light = luminance[i]!;
    const base = i * per;
    for (let r = 0; r < per; r++) rates[base + r] = light * MAX_RATE_HZ;
    rates[circuit.l1Start + i] = (1 - light) * MAX_RATE_HZ * 0.85;
    rates[circuit.l2Start + i] = light * MAX_RATE_HZ * 0.55;
  }
  return rates;
}
