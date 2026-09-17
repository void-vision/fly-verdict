import { seedFromBytes } from "./rng";

/** SHA-256 when SubtleCrypto exists; FNV-1a fallback for workers without it. */
export async function hashSeed(data: BufferSource): Promise<number> {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.subtle) {
    const digest = await cryptoObj.subtle.digest("SHA-256", data as ArrayBuffer);
    return new DataView(digest).getUint32(0, false);
  }
  const bytes =
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return seedFromBytes(bytes);
}

export function hashFloat32(values: Float32Array): Promise<number> {
  const copy = new Uint8Array(values.byteLength);
  copy.set(new Uint8Array(values.buffer, values.byteOffset, values.byteLength));
  return hashSeed(copy);
}
