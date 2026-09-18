import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodeConnectome,
  expectedNeuronCount,
  photoreceptorRates,
  simulateCircuit,
} from "./visual-pathway.mjs";
import { driveScore, flyScore, flyTier, normalizeLuminance } from "../src/lib/fly-score.mjs";

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
for (let d = 0.3; d <= 0.5; d += 0.001) {
  const points = flyScore(d);
  if (!Number.isInteger(points) || points < 40 || points > 99) throw new Error(`fly score ${points} out of 40..99 at ${d}`);
  if (points > prev) throw new Error(`fly score not monotonic at ${d}`);
  prev = points;
  tiers.add(flyTier(points));
}
if (tiers.size !== 5) throw new Error(`fly score reaches only ${tiers.size}/5 tiers`);

// The looks score must not rank by exposure or skin tone: the same face, dimmed, scores the same.
const dimFace = face.map((v) => v * 0.6);
const looks = (lum) =>
  flyScore(driveScore(simulateCircuit(circuit, photoreceptorRates(normalizeLuminance(lum), circuit), 0xface01)));
const looksBright = looks(face);
const looksDim = looks(dimFace);
if (looksBright !== looksDim) throw new Error(`fly score depends on brightness: ${looksBright} vs ${looksDim}`);

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
      looksScore: looksBright,
      dark: loom,
      bright: approach,
    },
    null,
    2,
  ),
);
