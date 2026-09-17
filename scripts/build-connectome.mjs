import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildVisualCircuit, encodeConnectome, expectedNeuronCount } from "./visual-pathway.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const circuit = buildVisualCircuit();
if (circuit.neuronCount !== expectedNeuronCount()) {
  throw new Error(`neuron count ${circuit.neuronCount} != ${expectedNeuronCount()}`);
}
const bytes = encodeConnectome(circuit);
mkdirSync(join(root, "public"), { recursive: true });
const dest = join(root, "public/connectome.bin");
writeFileSync(dest, bytes);
console.log(
  `wrote ${dest} (${bytes.length} bytes, ${circuit.neuronCount} neurons, ${circuit.pre.length} synapses)`,
);
