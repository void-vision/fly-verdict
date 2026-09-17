/** mulberry32 — same family as the raw hero cloud, stable across reloads. */
export function mulberry32(seed: number) {
  let q = seed >>> 0;
  return () => {
    q = (q + 0x6d2b79f5) >>> 0;
    let t = Math.imul(q ^ (q >>> 15), 1 | q);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromBytes(bytes: ArrayBuffer | Uint8Array): number {
  const view =
    bytes instanceof Uint8Array
      ? bytes
      : new Uint8Array(bytes);
  let h = 2166136261;
  for (let i = 0; i < view.length; i++) {
    h ^= view[i]!;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
