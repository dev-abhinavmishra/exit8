# EXIT 8

An original first-person **anomaly-detection psychological-horror game** for
the browser. You are the night-shift Route Integrity Inspector for the Alder
City Civic Works Authority, walking **Inspection Loop 7** — a municipal
concourse that exists only to be checked. Memorize what normal looks like.
File each pass: **route clear** (proceed) or **divergence** (retreat).
Your judgment moves the **Stability Index** — secure the route at 100.

Inspired only by the broad "observe a repeating place, detect changes,
choose whether to continue or retreat" genre. All setting, fiction, signage,
anomalies, geometry, and audio are original (see `ATTRIBUTION.md`).

## Setup

```bash
npm ci
npm run dev        # http://localhost:5173
```

Node 20+ required. No backend, no accounts, no trackers — the build is a
static bundle.

## Controls

| Action          | Input                                                                                |
| --------------- | ------------------------------------------------------------------------------------ |
| Move            | `W A S D`                                                                            |
| Look            | Mouse (pointer lock) — drag also works                                               |
| Interact        | `E` (airlock terminals)                                                              |
| Pause           | `Esc`                                                                                |
| Commit judgment | Cross an airlock inspection stripe — **south = route clear**, **north = divergence** |

Touch: left half of the screen is a virtual stick, right half drags look.

## How a run works

Each loop the corridor is either _clear_ or _divergent_. Learn the baseline;
if anything is off — an object changed, space lies, sound doesn't belong —
turn back through the north airlock. Otherwise proceed south. Judgment
locks when you cross the inspection stripe; the terminal reports your
stability. Correct: +12. Mistake: −16. Reach 100 → **ROUTE SECURED**;
hit 0 → **ROUTE LOST**.

## Architecture

- **Babylon.js 9** (`@babylonjs/core`) — WebGPU when fully available
  (self-hosted glslang/twgsl — no CDN calls), WebGL 2 fallback.
- **TypeScript strict + Vite** — `src/` organized per
  `docs/IMPLEMENTATION_PLAN.md`; fixed-step 60 Hz sim decoupled from render.
- **Determinism** — every random draw flows through named seeded streams
  (`src/game/state/rng.ts`); a run reproduces from `seed` + `loopIndex`.
- **Anomalies** — data-driven modules (`src/game/anomalies/`); each declares
  chapter/category/rarity/range/required world nodes/exclusions/hooks/
  testSeed. Weighted bag + recent-history suppression picks per loop.
- **Saves** — versioned `localStorage` schema v1, corruption-quarantine +
  migration (`src/game/state/save.ts`).
- **All assets procedural** — DynamicTexture surfaces/signage and
  synthesized WebAudio; zero external files to license.

## Tests

```bash
npm run test          # vitest: rng, selection, progression, saves, quality, anomaly rules
npm run test:e2e      # playwright: boot, decisions, pause, saves, settings, base-path
npm run validate:assets
npm run lint && npm run typecheck && npm run build
```

E2E runs the WebGL2 path (headless has no WebGPU); both renderer paths are
runtime-selectable via `?engine=webgl|webgpu`.

## Debug / dev surface

`?debug` overlay + `window.__nightaudit` console handle:
`seed`, `loop()`, `anomaly()`, `stability()`, `pos()`, `teleport(x,y,z)`,
`forceAnomaly(id|"none")`, `setStability(n)`, `key(code,down)`, `fps()`,
`draws()`, `screenshot()`, `registry()`.
URL params: `?seed=`, `?anomaly=`, `?engine=`, `?quality=`, `?e2e=1`.

## Content pipeline

Current state: all-procedural slice (M1). Blender 5.x source/generator
scripts land in `tools/blender/` at M2; KTX2 + meshopt packing at M5
(`npm run optimize:assets` already performs the real pass when assets +
tools exist). Docs: `docs/GAME_DESIGN.md`, `ART_BIBLE.md`,
`AUDIO_BIBLE.md`, `ANOMALY_CATALOG.md`, `OPTIMIZATION.md`, `HANDOFF.md`.

## Deployment

`npm run build` → `dist/` (base `./`, works from any sub-path). Ships with
`vercel.json` (Vercel static). GitHub Pages / Netlify / Cloudflare Pages
work identically: publish `dist/` as the site root.

## Troubleshooting

- **Black screen after boot splash** — open the console; the boot fault is
  rendered into the splash. WebGPU unavailable? It auto-falls back to
  WebGL 2 (a note appears on the start screen if you forced `webgpu`).
- **No audio** — the engine unlocks on your first click/keypress
  (browser autoplay policy); check the mute toggle in Settings → Audio.
- **Save looks wrong** — corrupted blobs quarantine to
  `nightaudit.save.corrupt`; wipe via Settings → Access → Reset All Data.
