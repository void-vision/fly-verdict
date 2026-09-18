import { cachedFetch } from "./asset-cache";
import { photoreceptorRates, type VisualCircuit } from "./circuit";
import { decodeConnectome } from "./connectome-codec";
import { simulateCircuit } from "./lif";
import { verdictFromReadout, type BrainVerdict } from "./verdict";

let circuit: VisualCircuit | null = null;

export async function simulateOnMain(seed: number, luminance: Float32Array): Promise<BrainVerdict> {
  if (!circuit) {
    const bytes = await cachedFetch("/connectome.bin");
    circuit = decodeConnectome(bytes);
  }
  const rates = photoreceptorRates(luminance, circuit);
  return { ...verdictFromReadout(simulateCircuit(circuit, rates, seed), seed), engine: "main" };
}
