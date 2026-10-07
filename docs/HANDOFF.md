# HANDOFF — NIGHT AUDIT

Read this first in a new session. Then docs/IMPLEMENTATION_PLAN.md.

## Where we are

- M0 (docs + scaffold) and M1 (vertical slice) landed on branch
  `devin/…-vertical-slice` → merged to main (check `git log`).
- Playable slice: WebGPU→WebGL2 fallback, quality tiers, FPS controller,
  Loop 7 concourse (procedural), commit thresholds, stability index,
  3 anomalies (`clock.reverse`, `doorway.extra`, `footsteps.extra`),
  procedural audio, start/pause/settings/results, v1 saves, vitest +
  playwright suites, Vercel-ready `vercel.json`.
- Next up per the attached brief: M2 visual benchmark (Blender kit /
  baked lighting / KTX2) or M3 systems (chapters, evidence, practice +
  daily seed modes, catalog, validator, gamepad, mobile). Expand the
  anomaly count toward 24 — new anomalies are data + hooks, not refactors.

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
  `?seed=`, `?anomaly=`, `?e2e=1` (stable clock/no random idle rumbles).

## User-context notes (from prior sessions)

- Abhinav merges fast and often; uses "audit and merge" as the close.
  Design bar is "human, not AI slop" — original fiction/copy, real polish.
  No placeholder/demo data; empty states over fake content.
- Long sessions crash: keep THIS FILE current (what shipped, what's next,
  traps learned). Sibling sessions may work the same repo — branch fresh
  off `origin/main`, expect `origin/main` to move mid-session.
- SwiftShader test box: playwright `browser.newContext` can flake on first
  try (retry passes); in-engine screenshot > `page.screenshot` on WebGL
  pages; kill orphan chromes before debugging a "hang".
