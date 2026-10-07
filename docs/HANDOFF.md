# HANDOFF — NIGHT AUDIT

Read this first in a new session. Then docs/IMPLEMENTATION_PLAN.md.

## Where we are

- M0 (docs + scaffold) and M1 (vertical slice) landed on PR #1
  (`devin/night-audit-vertical-slice`) — reviewed commit 943be24, fixes at
  86acf2a. Devin Review: all 10 findings fixed + triaged. NOT yet merged.
- Playable slice: WebGPU→WebGL2 fallback, quality tiers, FPS controller
  (collision via `camera.cameraDirection` + `collisionCoordinator` import),
  Loop 7 concourse (procedural), commit thresholds, stability index,
  **30 anomalies** (was 3 — 24 target passed) registered via
  `anomalies/index.ts` (`ALL_ANOMALIES` — register there, not in app.ts),
  procedural audio (seeded `audio.synth`/`audio.ambient` streams),
  start/pause/settings/results, v1 saves, vitest + playwright suites,
  Vercel-ready `vercel.json`.
- **Chapters are live** (b3d517f): `1 + floor(correct/2)` cap 3, HUD shows
  CH I/II/III. Tiering: ch1 = quiet 17 (signs/posters/props/stills), ch2 =
  motion + watchers (sways, spins, breathes, groans, watcher.far,
  counter.worker, cctv.gaze), ch3 = building-lying (light.out,
  machine.silence, temp.drift, air.haze, announce.spatial). Rates
  0.5/0.55/0.6, stability gain 12/10/9 → a clean win is 6 loops.
- Baseline props anomalies hang on: `light.zone.<name>` point lights,
  service door recess (right z≈15.5), vent grilles, CCTV `cctv.N.lens`,
  baseboards, `floor`, posters `poster.0-2`. See ANOMALY_CATALOG.md.
- E2E-verified live: direction probe, wall clamps, commit judging,
  SECURED@100 + LOST@0, per-anomaly forced screenshots (?anomaly=<id>),
  chapter ladder (2 correct → CH II). 13/13 e2e green (~5m — SECURED
  spec now needs 6 loops).
- **Daily route live** (770a5ee): DAILY ROUTE button → seed
  `daily-YYYY-MM-DD` (UTC), completion stamped in
  `save.progression.dailies`, button flips to 'already filed'. Results
  screen shows FILED DIVERGENCES (name + chapter per correct retreat).
- Next up per the attached brief: M2 visual benchmark (Blender kit /
  baked lighting / KTX2) or rest of M3 (evidence/archive UI, practice
  mode, catalog validator, gamepad, mobile).

## Conventions this repo already follows

- Seeded everything: `RngStream` names over raw `Math.random()`; a run is
  `seed` + `loopIndex`. Add new draws as NEW streams (see
  `src/game/state/rng.ts`), never reorder existing draws.
- Every anomaly: deterministic `testSeed`, `requires` node names from the
  world registry, `excludes` tags, accessibility fallback. Validator runs
  them all (M3; until then vitest covers registry invariants).
- Text/signage is original fiction from `src/data/signage.ts` — never
  paste real transit copy or brand pictograms.
- No external assets yet: all visuals procedural (DynamicTexture) and all
  audio synthesized (WebAudio nodes). Third-party assets → ATTRIBUTION.md
  or reject.
- Gates before any PR: `npm run lint && npm run typecheck && npm run test
&& npm run test:e2e && npm run validate:assets && npm run build`.
- E2E runs the WebGL2 path (headless has no WebGPU). Debug surface:
  `window.__nightaudit` (see `src/debug/handle.ts`), `?debug`, `?engine=`,
  `?seed=`, `?anomaly=`, `?e2e=1`.
- `?e2e=1` pins `TIERS.low` + no rumble — REQUIRED under SwiftShader (~1 fps
  at high tier starves the 60 Hz stepper and timeouts look like hangs).
- Babylon traps learned: `camera.cameraDirection` is WORLD-space (don't
  un-rotate; position writes bypass collision); `_collideWithWorld` needs
  `import "@babylonjs/core/Collisions/collisionCoordinator"` or the first
  move throws and silently kills the RAF loop; `applyQuality()` re-resolves
  the tier — tier overrides belong inside it.
- Anomaly gotchas: lights aren't meshes — `registry.register` accepts
  `as unknown as AbstractMesh` casts; sign copy lives in a shared
  DynamicTexture (`drawSign`/`drawPoster`/`drawClockFace` rewrite in
  place, `excludes` tag groups keep anomalies from stacking);
  `g.dispose(false, true)` cleanup kills children too — snapshot every
  field you mutate and restore it in `cleanup()`; zone troffer swaps are
  `materials.trofferLit ↔ trofferDim`; **Babylon CreatePlane front face
  is −z**: a wall plane on x<0 needs `rotation.y = −π/2` to face the
  room (+π/2 turns it into the wall → backface-culled, invisible —
  posters shipped invisible for 3 commits before catching this);
  texture-only materials in dark zones need `emissiveTexture` bound,
  not just flat `emissiveColor`. `__nightaudit.meshInfo(name)` dumps
  pos/rot/visibility for probes.

## User-context notes (from prior sessions)

- Abhinav merges fast and often; uses "audit and merge" as the close.
  Design bar is "human, not AI slop" — original fiction/copy, real polish.
  No placeholder/demo data; empty states over fake content.
- Long sessions crash: keep THIS FILE current (what shipped, what's next,
  traps learned). Sibling sessions may work the same repo — branch fresh
  off `origin/main`, expect `origin/main` to move mid-session.
- SwiftShader test box: playwright `browser.newContext` can flake on first
  try (retry passes); in-engine screenshot > `page.screenshot` on WebGL
  pages; kill orphan chromes before debugging a "hang"; `fuser -k 4177/tcp`
  kills stale previews that shadow the strictPort suite; a saved
  `night-audit-e2e-testing` skill documents the debug handle + probes.
