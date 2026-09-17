import { cachedFetch } from "./asset-cache";
import { photoreceptorRates, type VisualCircuit } from "./circuit";
import { decodeConnectome } from "./connectome-codec";
import { simulateCircuit } from "./lif";
import { verdictFromReadout } from "./verdict";
import type { Verdict } from "./types";

let circuit: VisualCircuit | null = null;

export async function simulateOnMain(seed: number, luminance: Float32Array): Promise<Verdict> {
  if (!circuit) {
    const bytes = await cachedFetch("/connectome.bin");
    circuit = decodeConnectome(bytes);
  }
  const rates = photoreceptorRates(luminance, circuit);
  return { ...verdictFromReadout(simulateCircuit(circuit, rates, seed), seed), engine: "main" };
}
