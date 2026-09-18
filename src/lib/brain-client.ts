import type { BrainVerdict } from "./verdict";
import type { BrainRequest, BrainResponse } from "@/workers/brain.worker";

export type BrainClient = {
  ready: Promise<{ neurons: number; synapses: number }>;
  simulate: (seed: number, luminance: Float32Array) => Promise<BrainVerdict>;
  terminate: () => void;
};

type Pending = {
  resolve: (verdict: BrainVerdict) => void;
  reject: (err: Error) => void;
};

export function createBrainClient(
  onProgress?: (label: string, fraction: number) => void,
): BrainClient {
  const worker = new Worker(new URL("/brain.worker.js", globalThis.location.origin), {
    type: "module",
  });

  let readyResolve!: (info: { neurons: number; synapses: number }) => void;
  let readyReject!: (err: Error) => void;
  let readySettled = false;
  const ready = new Promise<{ neurons: number; synapses: number }>((resolve, reject) => {
    readyResolve = (info) => {
      readySettled = true;
      resolve(info);
    };
    readyReject = (err) => {
      readySettled = true;
      reject(err);
    };
  });

  let pending: (Pending & { id: number }) | null = null;
  let nextId = 0;

  worker.onmessage = (event: MessageEvent<BrainResponse>) => {
    const msg = event.data;
    if (msg.type === "progress") {
      onProgress?.(msg.label, msg.fraction);
      return;
    }
    if (msg.type === "ready") {
      readyResolve({ neurons: msg.neurons, synapses: msg.synapses });
      return;
    }
    if (msg.type === "error") {
      const err = new Error(msg.message);
      if (msg.id !== undefined) {
        if (pending?.id !== msg.id) return;
        const current = pending;
        pending = null;
        current.reject(err);
        return;
      }
      if (pending) {
        const current = pending;
        pending = null;
        current.reject(err);
        return;
      }
      if (!readySettled) readyReject(err);
      return;
    }
    if (msg.type === "verdict") {
      // A late reply to a timed-out request must not resolve the next one.
      if (pending?.id !== msg.id) return;
      const current = pending;
      pending = null;
      current?.resolve(msg.verdict);
    }
  };

  worker.onerror = (event) => {
    const err = new Error(event.message || "brain worker crashed");
    if (pending) {
      const current = pending;
      pending = null;
      current.reject(err);
    } else if (!readySettled) {
      readyReject(err);
    }
  };

  worker.onmessageerror = () => {
    const err = new Error("brain worker message could not be cloned");
    if (pending) {
      const current = pending;
      pending = null;
      current.reject(err);
    } else if (!readySettled) {
      readyReject(err);
    }
  };

  worker.postMessage({
    type: "warmup",
    connectomeUrl: new URL("/connectome.bin", globalThis.location.origin).href,
  } satisfies BrainRequest);

  let dead = false;

  return {
    ready,
    simulate(seed, luminance) {
      if (dead) return Promise.reject(new Error("brain worker terminated"));
      const copy = new Float32Array(luminance);
      const id = ++nextId;
      pending?.reject(new Error("simulate superseded"));
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          if (pending?.id === id) pending = null;
          reject(new Error("simulate timed out"));
        }, 4000);
        pending = {
          id,
          resolve(verdict) {
            clearTimeout(timer);
            resolve(verdict);
          },
          reject(err) {
            clearTimeout(timer);
            reject(err);
          },
        };
        worker.postMessage({ type: "simulate", id, seed, luminance: copy } satisfies BrainRequest);
      });
    },
    terminate() {
      dead = true;
      if (pending) {
        const current = pending;
        pending = null;
        current.reject(new Error("brain worker terminated"));
      }
      worker.terminate();
    },
  };
}
