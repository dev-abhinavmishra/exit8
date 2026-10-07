#!/usr/bin/env node
/**
 * Asset optimization stage (M5 pipeline, real today):
 *   - .gltf/.glb under public/models → gltfpack (meshopt) if available
 *   - .png/.jpg/.ktx2 under public/textures → toktx KTX2 if available
 * With an all-procedural slice there's nothing to pack — that is reported
 * truthfully rather than stubbed.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const walk = (dir, exts) => {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((x) => e.toLowerCase().endsWith(x))) out.push(p);
  }
  return out;
};

const has = (cmd) => {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const models = walk(join(root, "public/models"), [".gltf", ".glb"]);
const textures = walk(join(root, "public/textures"), [".png", ".jpg", ".jpeg", ".ktx2"]);

let work = 0;
if (models.length > 0) {
  if (has("gltfpack")) {
    for (const m of models) {
      const out = m.replace(/\.(gltf|glb)$/i, ".packed.glb");
      execFileSync("gltfpack", ["-i", m, "-o", out, "-cc", "-tc"], { stdio: "inherit" });
      work++;
    }
  } else {
    console.log("optimize:assets — gltfpack not installed; models left unoptimized (install for M5)");
  }
}
if (textures.length > 0) {
  if (has("toktx")) {
    for (const t of textures) {
      if (t.endsWith(".ktx2")) continue;
      const out = t.replace(/\.\w+$/, ".ktx2");
      execFileSync("toktx", ["--genmipmap", "--encode", "etc1s", out, t], { stdio: "inherit" });
      work++;
    }
  } else {
    console.log("optimize:assets — toktx not installed; textures left unoptimized (install for M5)");
  }
}
if (work === 0)
  console.log(
    `optimize:assets — nothing to optimize (${models.length} models, ${textures.length} textures; slice is procedural)`,
  );
else console.log(`optimize:assets — optimized ${work} file(s)`);
