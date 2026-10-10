# EXIT 8 — Optimization & Budgets

## Quality tiers

`Low | Medium | High | Ultra | Auto` (Auto = detected, always overridable).
Resolution scale, shadow size/casters, post chain, texture budget, max
lights per zone vary per tier (`src/engine/quality.ts`).

## Targets

- Desktop: 60 FPS @1920×1080 midrange dGPU on High; 60 FPS iGPU Medium;
  30 FPS floor on Low.
- Mobile (M3+): 30 FPS capable phones on Low/Medium + touch UI.
- Load: branded splash immediately; only baseline loop assets before play;
  real progress only; chapter-scoped streaming later.

## Operational budgets (verified at milestones)

| Metric                  | Low         | Medium  | High    | Ultra   |
| ----------------------- | ----------- | ------- | ------- | ------- |
| Draw calls              | ≤40         | ≤60     | ≤90     | ≤140    |
| Visible tris            | ≤120k       | ≤220k   | ≤400k   | ≤700k   |
| Shadow-casting lights   | 0           | 1       | 2       | 3       |
| Texture memory          | ≤64 MB      | ≤128 MB | ≤256 MB | ≤512 MB |
| JS frame p95            | ≤6 ms       | ≤8 ms   | ≤10 ms  | ≤12 ms  |
| Initial transfer (gzip) | ≤4 MB slice |

**Measured (procedural slice, Low tier, mid-corridor worst case):**
~340 draw calls / ~8.6k visible tris per frame post-merge (was ~440
before `src/world/merge.ts` folded ~160 static dressing meshes — trays,
hangers, seams, grime, conduit, baseboards, pipes — into per-material
merged meshes; ~22% draw cut). `window.__nightaudit.draws()` reads the
engine's _cumulative_ counter — sample twice a frame apart and diff. The
budget table above is the merged-kit target for M2; the remaining draws
are anomaly-reachable meshes that must stay discrete (walls, troffers,
cabinets, posters, signage — anything a `requires`/`getMeshByName` path
can reach). Bundle: 2.8 MB babylon chunk (645 kB gzip) + 164 kB app
(49 kB gzip).

Audio: decoded buffers ≤ 48 MB total; looped beds are generated nodes,
not samples.

## Techniques

Instanced/thin instances for repeated kit pieces, merged static geometry
per zone, frustum culling, LODs on complex props (M2+), KTX2 textures
(M2+), Meshopt/gltfpack final stage (M5), object pooling for transient
meshes, strict `dispose()` on scene rebuild, dynamic resolution scaling on
Auto when frame p95 exceeds budget.

## Never optimize by

making anomalies unreadable, removing baseline asymmetry that players use
to memorize the route, or hiding asset weakness under post.

## Tooling

Dev-only: Babylon Inspector, perf overlay (`?debug`), `window.__nightaudit`
console handle (seed/loop/anomaly/FPS/draws/tris). Benchmark route:
`tools/validation/benchmark` (M3) records FPS percentiles, draws, tris,
memory where exposed.
