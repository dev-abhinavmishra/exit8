#!/usr/bin/env node
/**
 * Asset gate: verifies every runtime-referenced file under public/ exists,
 * signage data parses, and required npm scripts are present. Fast, honest —
 * it fails loudly rather than faking coverage.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const failures = [];
const notes = [];

function check(cond, msg) {
  if (!cond) failures.push(msg);
}

// 1. package.json scripts the brief requires
const pkg = JSON.parse((await import("node:fs")).readFileSync(join(root, "package.json"), "utf8"));
for (const s of [
  "dev",
  "build",
  "preview",
  "lint",
  "typecheck",
  "test",
  "test:e2e",
  "validate:assets",
  "optimize:assets",
]) {
  check(pkg.scripts?.[s], `missing npm script: ${s}`);
}

// 2. public asset dirs exist and every file inside is non-empty
const pubDir = join(root, "public");
if (existsSync(pubDir)) {
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else check(statSync(p).size > 0, `empty asset file: ${p}`);
    }
  };
  walk(pubDir);
  notes.push("public/ present");
} else {
  notes.push("public/ absent — slice ships zero external assets");
}

// 3. signage data + anomaly modules parse as TS-importable source
const { readFileSync } = await import("node:fs");
const signage = readFileSync(join(root, "src/data/signage.ts"), "utf8");
check(signage.includes("CIVIC WORKS AUTHORITY"), "signage.ts missing authority fiction");
check(!/exit\s*8/i.test(signage), "signage.ts must not reference the inspiring title");
const anomalyDir = join(root, "src/game/anomalies");
const modules = readdirSync(anomalyDir).filter(
  (f) => f.endsWith(".ts") && !["types.ts", "registry.ts", "index.ts"].includes(f),
);
check(modules.length >= 3, `expected ≥3 anomaly modules, found ${modules.length}`);
for (const m of modules) {
  const src = readFileSync(join(anomalyDir, m), "utf8");
  check(/testSeed:\s*"[^"]+"/.test(src), `${m} missing testSeed`);
  check(/requires:\s*\[/.test(src), `${m} missing requires`);
}
notes.push(`${modules.length} anomaly module(s) validated`);

// 4. merge-prefix silent-death guard: meshes whose names match a
//    STATIC_PREFIXES entry fold into merged.static.* batches, so a
//    registry.register on one leaves anomalies animating a dead object.
//    Check both directions: registered meshes named inside a prefix, and
//    requires/registry lookups whose literal matches a prefix directly.
const mergeSrc = readFileSync(join(root, "src/world/merge.ts"), "utf8");
const prefixes = [...mergeSrc.matchAll(/^\s*"([^"]+)",\s*$/gm)].map((m) => m[1]);
check(prefixes.length > 10, "could not read STATIC_PREFIXES from merge.ts");
const worldDirs = ["src/world", "src/world/generation"];
const varNames = new Map(); // var -> mesh name literal
const registered = []; // [registryName, var, file]
for (const d of worldDirs) {
  const dir = join(root, d);
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
    const p = join(dir, f);
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const c = line.match(/(\w+)\s*=\s*kit\.\w+\(`?"([^"`]+)"`?/);
      if (c) varNames.set(c[1], c[2]);
      const r = line.match(/registry\.register\("([^"]+)",\s*(\w+)/);
      if (r) registered.push([r[1], r[2], `${d}/${f}`]);
    }
  }
}
for (const [reg, v, file] of registered) {
  const mesh = varNames.get(v);
  if (mesh && prefixes.some((p) => mesh.startsWith(p)))
    failures.push(`${file}: registered "${reg}" wraps mesh "${mesh}" which matches a merge prefix`);
}
// literals: requires entries and registry.get/mesh lookups that are mesh names
for (const m of modules) {
  const src = readFileSync(join(anomalyDir, m), "utf8");
  for (const r of src.matchAll(/requires:\s*\[([^\]]*)\]/gs)) {
    for (const lit of r[1].matchAll(/"([^"]+)"/g)) {
      if (prefixes.some((p) => lit[1].startsWith(p)))
        failures.push(`${m}: requires "${lit[1]}" matches a merge prefix`);
    }
  }
  for (const g of src.matchAll(/registry\.(?:get|mesh)\(`([^`$]+)`/g)) {
    if (prefixes.some((p) => g[1].startsWith(p)))
      failures.push(`${m}: registry lookup "${g[1]}" matches a merge prefix`);
  }
}
notes.push("merge-prefix guard: no anomaly-reachable mesh folds into a batch");

if (failures.length > 0) {
  console.error("validate:assets FAILED");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("validate:assets OK");
for (const n of notes) console.log(`  · ${n}`);
