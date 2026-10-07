# Benchmark — fixed route capture

Perf capture on the deterministic `bench7` seed, Low quality tier,
`?e2e=1`. Measured via `window.__nightaudit.draws()` — **the counter is
cumulative**: sample twice two frames apart and diff. Tris are the
renderer-visible count for that frame.

> FPS below is captured under SwiftShader (software rasterizer) — it
> measures relative frame cost, not real-device speed. Draw calls and
> tris are the honest, rasterizer-independent numbers.

## Route capture (post static-merge)

| Waypoint          | draws/frame | tris  |
| ----------------- | ----------- | ----- |
| spawn — airlock N | 562         | 11446 |
| corridor entry    | 506         | 10394 |
| mid corridor      | 348         | 8870  |
| records bank      | 282         | 3654  |
| junction gallery  | 184         | 3140  |
| lift wall         | 130         | 2120  |
| south airlock     | 52          | 992   |
| look back (north) | 162         | 2272  |

**Worst case: the spawn view** — the whole corridor plus both airlock
interiors sits in frustum at once (~562 draws). It collapses to ~350 by
mid-corridor and ~50–190 inside the airlocks/gallery where culling cuts
the corridor.

## Where the draws go

The post-merge floor (~340 corridor draws) is anomaly-reachable mesh —
walls, troffer housings + shafts, cabinet banks, posters, signage,
scatter. All of it must stay discrete: any mesh a `requires` entry,
registry anchor, or `getMeshByName` path can reach may not be folded
into a merged static mesh. The `dress.*`/`conduit.*`/`baseboard.*`/
`junction.pipe.*` families that could merge safely already do
(`src/world/merge.ts`, −22% draws, ~160 meshes folded).

## Reproduce

```bash
npm run dev -- --port 5199 --strictPort
# ?e2e=1&seed=bench7, then per waypoint:
__nightaudit.teleport(x, y, z, yaw);
const d0 = __nightaudit.draws();   // wait 2 frames
__nightaudit.draws() - d0;         // draws/frame
```

Budget table and rationale: [OPTIMIZATION.md](OPTIMIZATION.md).
