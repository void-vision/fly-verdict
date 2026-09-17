export const ASSET_CACHE = "fly-verdict-v5";

export async function cachedFetch(
  url: string,
  onProgress?: (fraction: number, received: number, total: number) => void,
): Promise<Uint8Array> {
  if (typeof caches !== "undefined") {
    const cache = await caches.open(ASSET_CACHE);
    const hit = await cache.match(url);
    if (hit) {
      const buf = new Uint8Array(await hit.arrayBuffer());
      onProgress?.(1, buf.byteLength, buf.byteLength);
      return buf;
    }
    const fresh = await fetchWithProgress(url, onProgress);
    await cache.put(url, new Response(fresh.slice(), { headers: { "Cache-Control": "public, max-age=31536000" } }));
    return fresh;
  }
  return fetchWithProgress(url, onProgress);
}

async function fetchWithProgress(
  url: string,
  onProgress?: (fraction: number, received: number, total: number) => void,
): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  const total = Number(res.headers.get("content-length") ?? 0);
  if (!res.body) {
    const buf = new Uint8Array(await res.arrayBuffer());
    onProgress?.(1, buf.byteLength, buf.byteLength);
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
    onProgress?.(total ? received / total : 0.5, received, total);
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  onProgress?.(1, received, total || received);
  return out;
}

/** WASM SIMD probe used to prefetch only the MediaPipe variant this device will run. */
export function wasmSimdSupported(): boolean {
  try {
    return WebAssembly.validate(
      new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11,
      ]),
    );
  } catch {
    return false;
  }
}

export function registerOfflineWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register("/sw.js");
}
