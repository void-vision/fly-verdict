/**
 * Model files (MediaPipe wasm + face model) live here, not in the service worker's cache:
 * the SW cache is replaced on every deploy, and these files only change when
 * @mediapipe/tasks-vision or the model is bumped. Bump the suffix when they do.
 */
export const ASSET_CACHE = "fly-verdict-assets-v1";

type Progress = (fraction: number, received: number, total: number) => void;

const MAX_ATTEMPTS = 4;
/** Abort and resume a download that has received nothing for this long (flaky mobile / cross-border links). */
const STALL_MS = 20_000;

/** One download per URL: a second caller (prefetch, then the real load) joins it and gets progress too. */
const inflight = new Map<string, { promise: Promise<Uint8Array>; listeners: Set<Progress>; last: [number, number, number] }>();

/**
 * Fetch with the Cache API as a persistent store, retries, resume and shared progress.
 * `expectedBytes` is the decoded size; the Content-Length of a gzip/br response is the
 * compressed size and cannot be used as the total.
 */
export function cachedFetch(url: string, onProgress?: Progress, expectedBytes = 0): Promise<Uint8Array> {
  const running = inflight.get(url);
  if (running) {
    if (onProgress) {
      running.listeners.add(onProgress);
      onProgress(...running.last);
    }
    return running.promise;
  }
  const listeners = new Set<Progress>(onProgress ? [onProgress] : []);
  const entry: { promise: Promise<Uint8Array>; listeners: Set<Progress>; last: [number, number, number] } = {
    promise: Promise.resolve(new Uint8Array()),
    listeners,
    last: [0, 0, expectedBytes],
  };
  const report: Progress = (fraction, received, total) => {
    entry.last = [fraction, received, total];
    for (const l of listeners) l(fraction, received, total);
  };
  entry.promise = load(url, report, expectedBytes).finally(() => inflight.delete(url));
  inflight.set(url, entry);
  return entry.promise;
}

async function load(url: string, report: Progress, expectedBytes: number): Promise<Uint8Array> {
  if (typeof caches === "undefined") return fetchWithRetry(url, report, expectedBytes).then((r) => r.bytes);
  const cache = await caches.open(ASSET_CACHE);
  const hit = await cache.match(url);
  if (hit) {
    const buf = new Uint8Array(await hit.arrayBuffer());
    report(1, buf.byteLength, buf.byteLength);
    return buf;
  }
  const { bytes, type } = await fetchWithRetry(url, report, expectedBytes);
  await cache
    .put(url, new Response(bytes.slice(), { headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000" } }))
    .catch(() => {}); // Quota errors only cost the next visit a re-download.
  return bytes;
}

async function fetchWithRetry(
  url: string,
  report: Progress,
  expectedBytes: number,
): Promise<{ bytes: Uint8Array; type: string }> {
  let chunks: Uint8Array[] = [];
  let received = 0;
  let total = expectedBytes;
  let type = "application/octet-stream";
  for (let attempt = 0; ; attempt++) {
    const abort = new AbortController();
    let stall = setTimeout(() => abort.abort(), STALL_MS);
    try {
      // Resume where the last attempt stopped; a server that ignores Range sends 200 and we start over.
      const res = await fetch(url, {
        headers: received ? { Range: `bytes=${received}-` } : undefined,
        signal: abort.signal,
      });
      if (res.status === 200 && received) {
        chunks = [];
        received = 0;
      } else if (!res.ok) {
        throw new Error(`fetch ${url} failed: ${res.status}`);
      }
      type = res.headers.get("content-type") ?? type;
      if (!total && !res.headers.get("content-encoding") && res.status === 200) {
        total = Number(res.headers.get("content-length") ?? 0);
      }
      if (!res.body) {
        const buf = new Uint8Array(await res.arrayBuffer());
        chunks.push(buf);
        received += buf.byteLength;
      } else {
        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          clearTimeout(stall);
          stall = setTimeout(() => abort.abort(), STALL_MS);
          chunks.push(value);
          received += value.byteLength;
          report(total ? Math.min(0.99, received / total) : 0.5, received, total);
        }
      }
      clearTimeout(stall);
      const out = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.byteLength;
      }
      report(1, received, received);
      return { bytes: out, type };
    } catch (err) {
      clearTimeout(stall);
      if (attempt + 1 >= MAX_ATTEMPTS) throw err;
      await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
    }
  }
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

/** Skip background downloads for users who asked to save data or are on 2G. */
export function prefetchAllowed(): boolean {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !conn?.saveData && !/(^|-)2g$/.test(conn?.effectiveType ?? "");
}

export function registerOfflineWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register("/sw.js");
}
