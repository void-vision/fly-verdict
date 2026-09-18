import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodeConnectome,
  expectedNeuronCount,
  photoreceptorRates,
  simulateCircuit,
} from "./visual-pathway.mjs";
import { faceGeometry, geometryScore } from "../src/lib/face-geometry.mjs";
import { flyTier } from "../src/lib/fly-score.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bytes = readFileSync(join(root, "public/connectome.bin"));
const circuit = decodeConnectome(bytes);

if (circuit.neuronCount !== expectedNeuronCount()) {
  throw new Error(`decoded neurons ${circuit.neuronCount} != ${expectedNeuronCount()}`);
}
if (circuit.neuronCount < 20000) {
  throw new Error(`visual pathway too small: ${circuit.neuronCount}`);
}
if (circuit.outStart.length !== circuit.neuronCount + 1) {
  throw new Error("outgoing CSR missing");
}

const bright = new Float32Array(circuit.columnCount);
const dark = new Float32Array(circuit.columnCount);
const face = new Float32Array(circuit.columnCount);
for (let i = 0; i < circuit.columnCount; i++) {
  bright[i] = 0.92;
  dark[i] = 0.08;
  const u = (i % 31) / 30 - 0.5;
  const v = Math.floor(i / 31) / 30 - 0.5;
  face[i] = Math.max(0, Math.min(1, 0.55 + 0.35 * Math.cos(u * 6) - 0.25 * Math.exp(-(u * u + (v + 0.1) * (v + 0.1)) * 8)));
}

let prev = Infinity;
const tiers = new Set();
for (let badness = 0; badness <= 2; badness += 0.005) {
  const points = geometryScore({ asymmetry: 0, proportion: 0, badness });
  if (!Number.isInteger(points) || points < 40 || points > 99) throw new Error(`looks score ${points} out of 40..99`);
  if (points > prev) throw new Error(`looks score not monotonic at badness ${badness}`);
  prev = points;
  tiers.add(flyTier(points));
}
if (tiers.size !== 5) throw new Error(`looks score reaches only ${tiers.size}/5 tiers`);

// A mirror-symmetric synthetic face: moving it closer, tilting it or changing the image
// size must not change the looks score; making it lopsided must lower it.
const MESH = [[33, 263], [133, 362], [159, 386], [145, 374], [70, 300], [105, 334], [107, 336], [129, 358],
  [61, 291], [37, 267], [84, 314], [234, 454], [172, 397], [58, 288], [136, 365], [150, 379], [468, 473]];
const base = [];
let r = 7;
const rnd = () => ((r = (r * 1103515245 + 12345) >>> 0) / 2 ** 32);
for (const [a, b] of MESH) {
  const p = { x: -0.2 - rnd() * 0.8, y: -0.3 + rnd() * 1.6 };
  base[a] = p;
  base[b] = { x: -p.x, y: p.y };
}
base[468] = { x: -0.5, y: 0 };
base[473] = { x: 0.5, y: 0 };
[10, 168, 6, 1, 2, 0, 17, 152].forEach((i, k) => (base[i] = { x: 0, y: -0.9 + k * 0.3 }));
const place = (pts, { scale, angle, cx, cy, w, h }) =>
  pts.map((p) => p && {
    x: (cx + scale * (p.x * Math.cos(angle) - p.y * Math.sin(angle))) / w,
    y: (cy + scale * (p.x * Math.sin(angle) + p.y * Math.cos(angle))) / h,
  });
const near = { scale: 300, angle: 0, cx: 640, cy: 360, w: 1280, h: 720 };
const far = { scale: 70, angle: 0.3, cx: 900, cy: 1500, w: 3000, h: 4000 };
const gNear = faceGeometry(place(base, near), near.w, near.h);
const gFar = faceGeometry(place(base, far), far.w, far.h);
if (!gNear || !gFar) throw new Error("synthetic face rejected");
if (Math.abs(gNear.badness - gFar.badness) > 1e-9) {
  throw new Error(`looks score depends on distance/tilt: ${gNear.badness} vs ${gFar.badness}`);
}
if (gNear.asymmetry > 1e-9) throw new Error(`mirror-symmetric face reads asymmetric: ${gNear.asymmetry}`);
// Only points outside the proportion ratios move, so this isolates the symmetry term.
const lopsided = base.map((p, i) => (p && [454, 397, 288, 300].includes(i) ? { x: p.x + 0.15, y: p.y + 0.1 } : p));
const gLop = faceGeometry(place(lopsided, near), near.w, near.h);
if (!gLop || gLop.asymmetry < 0.05 || gLop.badness <= gNear.badness) throw new Error("a lopsided face must read worse");
const looksScore = geometryScore(gNear);

const t0 = Date.now();
const a = simulateCircuit(circuit, photoreceptorRates(face, circuit), 0xface01);
const b = simulateCircuit(circuit, photoreceptorRates(face, circuit), 0xface01);
const elapsed = Date.now() - t0;
if (JSON.stringify(a) !== JSON.stringify(b)) {
  throw new Error(`non-deterministic readout ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
}

const loom = simulateCircuit(circuit, photoreceptorRates(dark, circuit), 7);
const approach = simulateCircuit(circuit, photoreceptorRates(bright, circuit), 7);
if (loom.lplc2 === approach.lplc2 && loom.dna02 === approach.dna02) {
  throw new Error("bright vs dark collapsed to the same readout");
}

console.log(
  JSON.stringify(
    {
      neurons: circuit.neuronCount,
      synapses: circuit.pre.length,
      bytes: bytes.length,
      msTwoRuns: elapsed,
      sameFace: a,
      looksScore,
      dark: loom,
      bright: approach,
    },
    null,
    2,
  ),
);
