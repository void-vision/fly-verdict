import { indexOutgoing, type VisualCircuit } from "./circuit";

export const CONNECTOME_MAGIC = 0x4656434e; // FVCN
export const CONNECTOME_VERSION = 2;
export const CONNECTOME_HEADER_BYTES = 64;

function writeLeb128(out: number[], value: number) {
  let v = value >>> 0;
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v);
}

function readLeb128(view: Uint8Array, offset: { i: number }): number {
  let result = 0;
  let shift = 0;
  while (offset.i < view.length) {
    const byte = view[offset.i++]!;
    result |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) return result >>> 0;
    shift += 7;
  }
  throw new Error("truncated LEB128");
}

function writeHeader(circuit: VisualCircuit): Uint8Array {
  const bytes = new Uint8Array(CONNECTOME_HEADER_BYTES);
  const h = new DataView(bytes.buffer);
  h.setUint32(0, CONNECTOME_MAGIC, false);
  h.setUint8(4, CONNECTOME_VERSION);
  h.setUint32(8, circuit.neuronCount, false);
  h.setUint32(12, circuit.pre.length, false);
  h.setUint32(16, circuit.photoCount, false);
  h.setUint16(20, circuit.photoPerColumn, false);
  h.setUint16(22, circuit.columnCount, false);
  h.setUint32(24, circuit.l1Start, false);
  h.setUint32(28, circuit.l2Start, false);
  h.setUint32(32, circuit.lplc2Start, false);
  h.setUint16(36, circuit.lplc2Count, false);
  h.setUint32(40, circuit.gf, false);
  h.setUint32(44, circuit.dnp09, false);
  h.setUint32(48, circuit.dna02L, false);
  h.setUint32(52, circuit.dna02R, false);
  return bytes;
}

function readHeader(bytes: Uint8Array): Omit<VisualCircuit, "pre" | "post" | "w" | "outStart" | "outPost" | "outW"> & {
  synapseCount: number;
} {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, false) !== CONNECTOME_MAGIC) throw new Error("bad connectome magic");
  if (view.getUint8(4) !== CONNECTOME_VERSION) throw new Error("unsupported connectome version");
  return {
    neuronCount: view.getUint32(8, false),
    synapseCount: view.getUint32(12, false),
    photoCount: view.getUint32(16, false),
    photoPerColumn: view.getUint16(20, false),
    columnCount: view.getUint16(22, false),
    l1Start: view.getUint32(24, false),
    l2Start: view.getUint32(28, false),
    lplc2Start: view.getUint32(32, false),
    lplc2Count: view.getUint16(36, false),
    gf: view.getUint32(40, false),
    dnp09: view.getUint32(44, false),
    dna02L: view.getUint32(48, false),
    dna02R: view.getUint32(52, false),
  };
}

/** CSR by post: incoming pres sorted, delta-coded LEB128, per-row sign bitmask, q8 weights. */
export function encodeConnectome(circuit: VisualCircuit): Uint8Array {
  const incoming: { pre: number; w: number }[][] = Array.from(
    { length: circuit.neuronCount },
    () => [],
  );
  for (let i = 0; i < circuit.pre.length; i++) {
    incoming[circuit.post[i]!]!.push({ pre: circuit.pre[i]!, w: circuit.w[i]! });
  }

  const body: number[] = [];
  for (let post = 0; post < circuit.neuronCount; post++) {
    const row = incoming[post]!.sort((a, b) => a.pre - b.pre);
    writeLeb128(body, row.length);
    const signs = new Uint8Array(Math.ceil(row.length / 8) || 0);
    const deltas: number[] = [];
    const weights: number[] = [];
    let prev = 0;
    row.forEach((edge, i) => {
      if (edge.w < 0) signs[i >> 3]! |= 1 << (i & 7);
      deltas.push(edge.pre - prev);
      prev = edge.pre;
      weights.push(Math.max(0, Math.min(127, Math.round(Math.abs(edge.w) * 100))));
    });
    for (const byte of signs) body.push(byte);
    for (const d of deltas) writeLeb128(body, d);
    for (const mag of weights) body.push(mag);
  }

  const header = writeHeader(circuit);
  const out = new Uint8Array(header.length + body.length);
  out.set(header, 0);
  out.set(body, header.length);
  return out;
}

export function decodeConnectome(bytes: Uint8Array): VisualCircuit {
  const meta = readHeader(bytes);
  const cursor = { i: CONNECTOME_HEADER_BYTES };
  const pre = new Int32Array(meta.synapseCount);
  const post = new Int32Array(meta.synapseCount);
  const w = new Float32Array(meta.synapseCount);
  let n = 0;

  for (let dest = 0; dest < meta.neuronCount; dest++) {
    const count = readLeb128(bytes, cursor);
    const signBytes = Math.ceil(count / 8);
    const signs = bytes.subarray(cursor.i, cursor.i + signBytes);
    cursor.i += signBytes;
    let src = 0;
    const pres = new Int32Array(count);
    for (let i = 0; i < count; i++) {
      src += readLeb128(bytes, cursor);
      pres[i] = src;
    }
    for (let i = 0; i < count; i++) {
      const mag = bytes[cursor.i++]! / 100;
      const neg = ((signs[i >> 3] ?? 0) & (1 << (i & 7))) !== 0;
      pre[n] = pres[i]!;
      post[n] = dest;
      w[n] = neg ? -mag : mag;
      n++;
    }
  }

  if (n !== meta.synapseCount) {
    throw new Error(`synapse count mismatch ${n} != ${meta.synapseCount}`);
  }

  return indexOutgoing({
    neuronCount: meta.neuronCount,
    pre,
    post,
    w,
    outStart: new Int32Array(0),
    outPost: new Int32Array(0),
    outW: new Float32Array(0),
    photoCount: meta.photoCount,
    photoPerColumn: meta.photoPerColumn,
    columnCount: meta.columnCount,
    l1Start: meta.l1Start,
    l2Start: meta.l2Start,
    lplc2Start: meta.lplc2Start,
    lplc2Count: meta.lplc2Count,
    gf: meta.gf,
    dnp09: meta.dnp09,
    dna02L: meta.dna02L,
    dna02R: meta.dna02R,
  });
}
