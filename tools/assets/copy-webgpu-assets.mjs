#!/usr/bin/env node
/** Copy Babylon's bundled glslang/twgsl assets into public/webgpu so the
 *  WebGPU path is fully self-hosted (offline, no CDN). Runs predev/prebuild. */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const src = join(root, "node_modules/@babylonjs/core/assets");
const dst = join(root, "public/webgpu");
const files = ["glslang/glslang.js", "glslang/glslang.wasm", "twgsl/twgsl.js", "twgsl/twgsl.wasm"];

let copied = 0;
for (const f of files) {
  const from = join(src, f);
  const to = join(dst, f);
  if (!existsSync(from)) {
    console.warn(`missing ${from} — WebGPU path will need CDN or will fallback to WebGL2`);
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  copied++;
}
console.log(`webgpu assets: ${copied}/${files.length} copied to public/webgpu/`);
