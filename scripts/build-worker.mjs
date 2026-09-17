import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL(".", import.meta.url)));
const entry = join(root, "src/workers/brain.worker.ts");
const outfile = join(root, "public/brain.worker.js");

function resolveEsbuild() {
  const require = createRequire(import.meta.url);
  try {
    return require.resolve("esbuild/bin/esbuild");
  } catch {
    try {
      return require.resolve("esbuild/bin/esbuild", { paths: [join(root, "node_modules/next")] });
    } catch {
      return null;
    }
  }
}

const bin = resolveEsbuild();
const args = [entry, "--bundle", "--format=esm", "--outfile=" + outfile, "--target=es2022"];
const result = bin
  ? spawnSync(process.execPath, [bin, ...args], { stdio: "inherit" })
  : spawnSync("npx", ["--yes", "esbuild", ...args], { stdio: "inherit" });

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
console.log("wrote", outfile);
