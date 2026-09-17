import { mulberry32 } from "./rng";
import { DT_MS, SIM_STEPS, WINDOW_MS, type VisualCircuit } from "./circuit";
import type { SpikeReadout } from "./types";

const TAU_MS = 10;
const V_REST = -65;
const V_TH = -50;
const V_RESET = -65;
const T_REF_STEPS = Math.round(2 / DT_MS);
const I_SCALE = 14;

export function simulateCircuit(
  circuit: VisualCircuit,
  rates: Float32Array,
  seed: number,
): SpikeReadout {
  const rng = mulberry32(seed || 1);
  const n = circuit.neuronCount;
  const v = new Float32Array(n);
  const ref = new Int16Array(n);
  const spikes = new Uint16Array(n);
  const I = new Float32Array(n);
  v.fill(V_REST);

  const driven: number[] = [];
  const pFire: number[] = [];
  for (let i = 0; i < n; i++) {
    const rate = rates[i] ?? 0;
    if (rate > 0) {
      driven.push(i);
      pFire.push(1 - Math.exp((-rate * DT_MS) / 1000));
    }
  }

  const { outStart, outPost, outW } = circuit;
  const leak = 1 - DT_MS / TAU_MS;
  let firstEscape = -1;
  const gf = circuit.gf;
  const firedIds = new Int32Array(n);
  let firedN = 0;

  for (let step = 0; step < SIM_STEPS; step++) {
    I.fill(0);
    for (let d = 0; d < driven.length; d++) {
      if (rng() < pFire[d]!) I[driven[d]!] += I_SCALE;
    }
    for (let f = 0; f < firedN; f++) {
      const src = firedIds[f]!;
      const begin = outStart[src]!;
      const end = outStart[src + 1]!;
      for (let s = begin; s < end; s++) I[outPost[s]!] += outW[s]! * I_SCALE;
    }

    firedN = 0;
    for (let i = 0; i < n; i++) {
      if (ref[i]! > 0) {
        ref[i]!--;
        v[i] = V_RESET;
        continue;
      }
      const next = V_REST + (v[i]! - V_REST) * leak + I[i]!;
      if (next >= V_TH) {
        v[i] = V_RESET;
        ref[i] = T_REF_STEPS;
        spikes[i]!++;
        firedIds[firedN++] = i;
        if (firstEscape < 0 && i === gf && spikes[i]! >= 12) {
          firstEscape = step * DT_MS;
        }
      } else {
        v[i] = next;
      }
    }
  }

  let lplc2 = 0;
  const start = circuit.lplc2Start;
  for (let i = 0; i < circuit.lplc2Count; i++) lplc2 += spikes[start + i]!;

  return {
    lplc2,
    gf: spikes[circuit.gf]!,
    dnp09: spikes[circuit.dnp09]!,
    dna02: spikes[circuit.dna02L]! + spikes[circuit.dna02R]!,
    windowMs: WINDOW_MS,
    latencyMs: firstEscape < 0 ? WINDOW_MS : Math.max(8, Math.round(firstEscape)),
  };
}
