import { indexOutgoing, photoreceptorRates } from "../lib/circuit";
import { decodeConnectome } from "../lib/connectome-codec";
import { simulateCircuit } from "../lib/lif";
import { verdictFromReadout } from "../lib/verdict";
import type { VisualCircuit } from "../lib/circuit";

let circuit: VisualCircuit | null = null;
let connectomeUrl = "/connectome.bin";

export type BrainRequest =
  | { type: "warmup"; connectomeUrl: string }
  | { type: "simulate"; id: number; seed: number; luminance: Float32Array };

export type BrainResponse =
  | { type: "progress"; label: string; fraction: number; received: number; total: number }
  | { type: "ready"; neurons: number; synapses: number }
  | { type: "verdict"; id: number; verdict: ReturnType<typeof verdictFromReadout> }
  | { type: "error"; id?: number; message: string };

function mb(n: number): string {
  return `${(n / 1e6).toFixed(1)} MB`;
}

async function cachedGet(
  url: string,
  post: (msg: BrainResponse) => void,
): Promise<Uint8Array> {
  const report = (fraction: number, received: number, total: number) => {
    post({
      type: "progress",
      label: total ? `${mb(received)} / ${mb(total)} · connectome.bin` : `${mb(received)} · connectome.bin`,
      fraction,
      received,
      total,
    });
  };

  return fetchWithProgress(url, report);
}

async function fetchWithProgress(
  url: string,
  report: (fraction: number, received: number, total: number) => void,
): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  const total = Number(res.headers.get("content-length") ?? 0);
  if (!res.body) {
    const buf = new Uint8Array(await res.arrayBuffer());
    report(1, buf.byteLength, buf.byteLength);
    return buf;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    report(total ? received / total : 0.5, received, total);
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  report(1, received, total || received);
  return out;
}

let loading: Promise<VisualCircuit> | null = null;

function loadCircuit(post: (msg: BrainResponse) => void): Promise<VisualCircuit> {
  if (circuit) return Promise.resolve(circuit);
  loading ??= (async () => {
    post({ type: "progress", label: "connectome.bin", fraction: 0.05, received: 0, total: 0 });
    const bytes = await cachedGet(connectomeUrl, post);
    circuit = indexOutgoing(decodeConnectome(bytes));
    return circuit;
  })().finally(() => {
    loading = null;
  });
  return loading;
}

self.onmessage = (event: MessageEvent<BrainRequest>) => {
  const msg = event.data;
  const post = (reply: BrainResponse) => self.postMessage(reply);
  if (msg.type === "warmup") {
    connectomeUrl = msg.connectomeUrl;
    void loadCircuit(post)
      .then((graph) => {
        post({ type: "ready", neurons: graph.neuronCount, synapses: graph.pre.length });
      })
      .catch((err: unknown) => {
        post({ type: "error", message: err instanceof Error ? err.message : "connectome failed" });
      });
    return;
  }
  if (msg.type === "simulate") {
    void loadCircuit(post)
      .then((graph) => {
        const luminance =
          msg.luminance instanceof Float32Array
            ? msg.luminance
            : new Float32Array(msg.luminance as ArrayLike<number>);
        post({ type: "progress", label: "LIF 200ms window", fraction: 0.7, received: 0, total: 0 });
        const rates = photoreceptorRates(luminance, graph);
        const readout = simulateCircuit(graph, rates, msg.seed);
        post({ type: "verdict", id: msg.id, verdict: verdictFromReadout(readout, msg.seed) });
      })
      .catch((err: unknown) => {
        post({ type: "error", id: msg.id, message: err instanceof Error ? err.message : "simulate failed" });
      });
  }
};
