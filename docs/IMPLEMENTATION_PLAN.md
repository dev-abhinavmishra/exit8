# NIGHT AUDIT — Implementation Plan

Status: M0–M4 complete on PR #1 (89 anomalies — the full catalog); M5 in
flight — static merge, benchmark route, a11y audit, cross-browser QA
done; deploy pending.
Last updated: session devin-d97050964c444f44940cef29c8bf3e9a (2026-10-07)

## Product

Original first-person anomaly-detection psychological-horror game for the web.
The player is a night-shift Route Integrity Inspector for the fictional
Alder City Civic Works Authority, walking **Inspection Loop 7** — a
late-night research-and-civic-services concourse beneath the city.
Each traversal is either _clear_ (continue forward is correct) or _divergent_
(retreat is correct). Decisions are locked by physically crossing a commit
threshold. Judgments move a **Stability Index** (0–100).

Not a clone of any commercial game. All names, signage, anomaly definitions,
geometry, audio, and fiction are original to this project (see
docs/GAME_DESIGN.md, ATTRIBUTION.md).

## Architecture

- **Babylon.js 9** (`@babylonjs/core`, ES modules) — rendering, scene, audio.
- **TypeScript ~5.9 strict** — all game and tooling code.
- **Vite 7** — dev server and static production bundle (`dist/`).
- Renderer: **WebGPU** (`WebGPUEngine`) when `navigator.gpu` + engine init
  succeed; **WebGL 2** (`Engine`) fallback. Capability detection at bootstrap,
  overridable via `?engine=webgl|webgpu` and settings.
- Fixed-step simulation (60 Hz) decoupled from render; anomalies and the
  player mutate sim state, the scene reads it.
- Seeded RNG (mulberry32 + named streams) everywhere; every run reproducible
  from `seed` + `loopIndex`.
- Saves: versioned `localStorage` (schema v1), migration + corruption-safe.
- No backend, no analytics, no network calls. `dist/` deploys to static hosts.

### Source tree (per brief)

```
src/
  app/           bootstrap, capability detection, shell wiring
  engine/        renderer selection, quality tiers, scene lifecycle, stepper
  game/
    state/       run state, save schema/migrations
    loop/        loop manager, direction-commit, consequence model
    anomalies/   anomaly registry, seeded selection, modules
    interaction/ interaction ray / focus rules
    progression/ stability index, chapters, endings
  world/
    generation/  modular kit, baseline concourse builder, procedural textures
    lighting/    light rig, quality-tier light budgets
    materials/   PBR material library
  player/        FPS controller, collision capsule, head motion
  audio/         bus graph, procedural sound sources, spatial emitters
  ui/            screens (start/pause/settings/results), HUD
  accessibility/ settings model (motion, captions, FOV, contrast)
  telemetry/     perf counters (dev only)
  debug/         dev overlay, deterministic-seed console handle
  data/          static data (signage copy, anomaly data tables)
tests/unit       vitest
tests/e2e        playwright
tools/           asset validation / optimization scripts
docs/            this file + design docs + HANDOFF.md
```

## Package list

runtime: `@babylonjs/core`, `@babylonjs/loaders` (glTF for M2+ assets)
dev: `typescript@~5.9`, `vite@^7`, `vitest@^3`, `@playwright/test`,
`eslint@9`, `typescript-eslint`, `prettier`, `@types/node`

No React: the DOM layer is a thin settings/menu shell over the canvas.

## Milestones

- **M0 — Preproduction (done)**: this doc + GAME_DESIGN / ART_BIBLE /
  AUDIO_BIBLE / ANOMALY_CATALOG / OPTIMIZATION, repo scaffold, gates wired.
- **M1 — Vertical slice (done this session)**: renderer fallback, quality
  tiers, FPS controller, one seamless loop with commit thresholds, stability
  index + consequence model, 3 anomalies (clock, doorway, footsteps),
  procedural audio bed, start/pause/settings/results screens, versioned
  save, vitest + playwright suites, production build, Vercel config.
- **M2 — Visual benchmark (done, procedural interpretation)**: the
  Blender/KTX2 route never materialized (no authoring pipeline), so depth
  came from the procedural kit — services/wear dressing, AO strips,
  grime decals, dust, volumetric shafts, bay plates, route decals — plus
  the high-tier post pipeline (bloom/grain/CA/vignette/tone mapping).
  Benchmark route + capture shipped as `docs/BENCHMARK.md`.
- **M3 — Systems complete (done)**: all 3 chapters, evidence/archive,
  daily+custom seeds, practice mode, anomaly catalog, full accessibility
  pass (`docs/ACCESSIBILITY.md`), gamepad, anomaly validator, mobile
  controls.
- **M4 — Content complete (done)**: 89 anomalies across the 6 groups —
  far past the ≥24 target — three endings (secure/lost/dossier),
  audio mix with anomaly-bus ducking, credits screen.
- **M5 — Optimization & release (mostly done)**: static-mesh merge
  (`src/world/merge.ts`, −22% draws), profiling vs budgets
  (BENCHMARK.md), cross-browser QA (`XB=1` firefox/webkit smoke, 4/4
  green), a11y + postfx e2e coverage. Meshopt/KTX2 N/A (no external
  assets); LODs assessed — at ≤11k visible tris the binding constraint
  is draw calls, which LOD can't reduce. Remaining: deploy.

## Task graph (M1 dependencies)

bootstrap/capabilities → engine/quality → materials/textures → concourse
builder → player controller → loop/commit → anomalies → audio → UI → saves
→ tests → build/deploy. Anomaly modules depend on the concourse's named
node registry (`world.registry`).

## Risks and mitigations

- **WebGPU unavailable in CI/headless**: WebGL2 is the tested path; WebGPU
  is opt-in at runtime and only used when init fully succeeds. Any partial
  init failure falls back and is logged.
- **SwiftShader software GL in test VMs**: keep the baseline scene cheap
  (instanced panels, merged statics, ≤~50 draw calls on Medium), and use
  in-engine `Tools.CreateScreenshot` for captures instead of page.screenshot.
- **No Blender on build agents**: slice assets are procedural meshes +
  DynamicTexture signage (zero external assets). Blender scripts arrive in
  M2 as reproducible generators; absence never blocks the build.
- **Scope**: 24+ anomalies is multi-session. The anomaly framework is
  data-driven so new anomalies are data + small hooks, not refactors.
  docs/HANDOFF.md relays state between sessions.
- **Asset licensing**: procedural/generated-only for now; any third-party
  asset later lands in ATTRIBUTION.md with license proof or is rejected.

## Test plan

Unit (vitest): RNG reproducibility, weighted selection / repeat prevention,
progression rules, save migration + corrupted save, quality resolution,
anomaly exclusion/compatibility.
E2E (playwright, WebGL2): boot → start → pointer-lock fallback → correct
forward & retreat decisions via debug seed → pause/resume → save/reload →
settings persistence → keyboard menu nav → reduced-motion/subtitles flags →
build served from non-root base path.
Asset gate: `npm run validate:assets` checks runtime-referenced files exist
and named-node registry integrity.

## Performance budgets

See docs/OPTIMIZATION.md. Headline: 60 FPS @1080p midrange dGPU on High,
60 FPS iGPU on Medium, 30 FPS low-end on Low; initial compressed transfer
≤ 4 MB for the slice (all-procedural target ≪1 MB).
