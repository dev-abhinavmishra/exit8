# HANDOFF — NIGHT AUDIT

Read this first in a new session. Then docs/IMPLEMENTATION_PLAN.md.

## Where we are

- M0 (docs + scaffold) and M1 (vertical slice) landed on PR #1
  (`devin/night-audit-vertical-slice`) — reviewed commit 943be24, fixes at
  86acf2a. Devin Review: all 10 findings fixed + triaged. NOT yet merged.
- Playable slice: WebGPU→WebGL2 fallback, quality tiers, FPS controller
  (collision via `camera.cameraDirection` + `collisionCoordinator` import),
  Loop 7 concourse (procedural), commit thresholds, stability index,
  **43 anomalies** (was 3 — 24 target passed) registered via
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
- **Gamepad live** (this commit): `pollPadAxes` in the sim step
  (left stick move, right stick look, quadratic deadzone, shares
  sensitivity/invertY), `pollPadButtons` in the RENDER loop — buttons
  must edge-fire while the sim is frozen in pause or resume can't
  fire (the stuck-pause bug the e2e caught). A=focused interactable,
  Start=pause toggle. `player.onPadButton(i, fn)` registers edges.
  `view()` added to the debug handle (yaw/pitch getter; `look()` is
  a setter). e2e stubs `navigator.getGamepads` via addInitScript.
- **Route archive live** (bde5a73): ROUTE ARCHIVE on the start
  screen — stats table + DIVERGENCE REGISTER of all 43 defs sorted by
  chapter; discovered ids render name/chapter/category/detectability,
  unfound ones show redacted rows. `ui.setArchiveData(stats, ids)`
  populates from save at boot. NOTE: seeded saves in e2e must carry
  `version: 1` or the blob is quarantined as corrupt.
- **Practice mode live** (46a05f0): PRACTICE ROUTE button →
  `?practice=1`, judgments still score but a SECURED/LOST bounds-hit
  clamps stability to 85/15 and keeps running. Each judgment captions
  the truth (DIVERGENCE FILED — <name> / MISSED — <name> / FALSE
  FILING / ROUTE CLEAR). ABANDON SHIFT ends into a "PRACTICE SHIFT"
  report. LoopManager gains `training` ctor flag + `endTraining()`,
  `onEnd` outcome widened to "secure"|"lost"|"practice".
- **Catalog validator**: `tests/unit/catalog.spec.ts` (run via
  `npm run validate:catalog`) — unique ids, def contract, ≥24 defs,
  per-chapter entries, sane detectability spread (≥4 each, subtle
  largest — the ⅓ rule in ANOMALY_CATALOG is per-loop weight mix).
- **Daily route live** (770a5ee): DAILY ROUTE button → seed
  `daily-YYYY-MM-DD` (UTC), completion stamped in
  `save.progression.dailies`, button flips to 'already filed'. Results
  screen shows FILED DIVERGENCES (name + chapter per correct retreat).
- **Field notes / evidence live** (cefd961): 6 diegetic memos in
  `src/game/progression/evidence.ts`; unfiled ones spawn seeded per run
  (cap 3, `evidence` rng stream) as paper planes `evidence.<id>`;
  [E] files them → `progression.discoveries[]`, chime, caption. Archive
  gains FIELD NOTES (full text filed / redacted unfiled); results shows
  a FIELD NOTES row; all 6 + SECURED → "DOSSIER COMPLETE" stamp and
  `endings[]` records "investigative" (second ending — M4 groundwork).
  HUD use-prompt (`setUsePrompt`) now renders the focus label under the
  reticle for notes AND terminals — it existed but was never drawn.
  Traps learned: wall-mounted planes sit at |x|=1.735 — wall boxes are
  0.12 thick so the inner face is 1.74 (1.78 embeds them invisible);
  `look(yaw,pitch)` needed `player.setView()` — the sim rewrites
  `camera.rotation.x` from controller pitch every update so the debug
  setter was a no-op; positive pitch looks DOWN.
- **Services + wear dressing** (42d21fa): ceiling cable trays +
  conduit both sides w/ hangers, junction boxes (left wall only in
  the gallery span), floor expansion seams every 6z, drain grates,
  translucent `grime` decals under vents — all baseline-fixed so any
  change reads as anomaly. Big density lift toward M2's benchmark.
- **Per-loop scatter** (579d955): `src/world/generation/scatter.ts` —
  7 ephemera variants re-place 0–3 per rebaseline from
  `loop.dressing` scoped `loop<N>` — the corridor is never
  pixel-identical so drift != divergence. Never registered; evidence
  notes never sit on bare floor so papers can't be mistaken for them.
  ConcourseWorld gains `scatter`; rebaseline() calls refresh.
- **Texture density pass**: uScale/vScale on wallPanel (u8), terrazzo
  (u4/v20 brass grid), ceilingTile, steel, concrete — surfaces were
  unstretched across 20m runs so every baked seam blurred.
- **Audio mix pass**: `startAmbience` opts gained `troffers` + `clockPos`
  (world anchors extended to match). 120Hz hum at 3 troffer rows, 1Hz
  clock tick via `update()`, `playEnding(kind)` tails wired in `onEnd`.
- **Touch controls**: `.touch-ui` HUD overlay (USE + PAUSE) shown only
  under `@media (pointer: coarse)`; USE arms via `setUsePrompt`; taps
  stopPropagation so look/move sticks don't claim them. Verify with a
  Playwright `hasTouch` context — desktop shows `display:none`.
- **Endings + credits**: `COPY.results.epilogues` (standard /
  investigative / lost / practice one-liners under the stamp), CREDITS
  button → 'credits' screen (M4's credits box).
- **Wall-base AO + dust** (2eb70ea, 3b953fc): fade-strip decal strips at
  both wall bases (`aoStrip` material, `drawFadeStrip` 256×64 alpha
  gradient) ground the walls; 400-cap ADD-blend ParticleSystem dust
  motes drift in troffer rows (skipped under reducedMotion). NOTE: a
  radial-glow "light pool" decal experiment was tried and REVERTED —
  the terrazzo's own specular already draws natural pools; a white
  blob duplicates it.
- **Ambient inspector + walker anomalies** (3c21ab8, c39f3f8):
  `src/world/generation/ambientWalker.ts` — a second figure patrols
  z 7↔48 at 1.05 m/s, 5 s end pauses, stride bob; slate coat + skin
  head + emissive hi-vis stripe (staff, not silhouette). reset() puts
  him mid-corridor EVERY rebaseline so he's part of baseline normal.
  `setMode("backwards"|"stare")` feeds two new ch2 defs
  (walker.backwards moonwalk, walker.stare mid-hold) — catalog **33**.
- Walker anomalies batch 2 + fixtures (**35**): `walker.absent` (new
  WalkerMode disables the group; reset() re-enables), `fire.open` (hides
  fire.point.glass), slat.missing now picks EITHER bench + any slat seeded.
  TRAP: registry.mesh(name) needs an explicit registry.register() —
  kit.plane() does NOT register (kit.box/bench/wallSign do); a missing
  name makes requires-validation pass but the anomaly a silent no-op.
  FIXTURES: bench.south z≈33 left, bin z≈51.5 right, fire point glass +
  FIRE POINT sign over the existing cabinet z≈18.
- Batch (**38**): `poster.swapped` (redraws two posters with each other's
  defs — physical planes don't move), `sign.drift` (wall sign slides
  −0.55y + 0.045 cant), `terminal.glitch` (1.4s after rebaseline the
  shared terminal texture repaints with a wrong FILED row — next
  updateTerminals call restores it). CUSTOM ROUTE: start-screen seed
  input → ?seed=<code> (customRoute() in app.ts).
  TRAP: kit.wallSign registers `sign.${specId}` and specIds already carry
  the prefix — registry names are `sign.sign.gallery` etc. requires must
  use the double prefix (see signFlip's `sign.${SPEC_ID}`).
- `memory.persist` (**39**): scatter gains a `dress.scatter` registered
  anchor node + `repeatLast(idx)` — each variant records last loop's
  spot in `last`; the anomaly re-places one at that exact spot even if
  this loop's draw excluded it. buildScatter gained an optional
  registry param.
- `light.delay` (**40**): LightZone gains z0/z1 extents; the anomaly
  tracks which zone the player's z sits in and dims the zone they LEFT
  1.5s after crossing (holds 1.0s). Zones named entry/gallery/clinic/
  junction; excludes tags are per-zone ("zone.gallery" etc).
- Batch (**42**): `route.reacts` (records player footsteps by sim-time;
  after 2.6s idle replays them at original cadence from their own
  positions — playback suspends if the player steps, steps pushed while
  not playing). `sightline.impossible`: fixtures.buildImpossibleFacade
  prebuilds a DISABLED airlock facade at z=38 (side walls + lintel +
  sealed slidingDoor + shared exit-south sign mat + collider child);
  anomaly setEnabled(true)s it. TRAP: kit.wallSign AND kit.slidingDoor
  auto-register — reusing a specId or kit.name twice crashes boot with
  "registry duplicate"; borrow art via mats.sign.get() + kit.plane
  instead. PlayerController.onFootstep(cb) → unsub.
- `depth.mismatch` (**43**): world.depthRoom/depthSpill join extraRoom —
  a 12m gallery (ribs every 3m + lit far door + glow light) prebuilt
  disabled at z=46 east; def clones doorwayExtra's stub/header/guard
  wall-swap pattern. ConcourseWorld gained depthRoom: TransformNode +
  depthSpill: PointLight fields.
  `ambient.walker` registered in WorldRegistry; update() runs in
  app.sim. Trap: e2e archive spec had "0 OF 31 FILED" hardcoded — now
  regex-matched; specs CANNOT import src/game/anomalies (Node can't
  resolve Babylon deep subpaths — extensionless builders 404 in node).
- Lift lobby at z=49.5 east wall (junction): `lift.lobby` TransformNode,
  `lift.door.-1`/`lift.door.1` leaves, `lift.panel`, `lift.panel.lamp`
  all registered — anchors for a future `lift.arrives`/`door.ajar` def.
  Materials trap: mats.steel/mats.door are metallic — with the weak env
  reflection they render near-black as door leaves; wallPanel on a box
  reads as pale steel doors framed by the dark rubber `lift.reveal`.
  Sign spec `sign.lift` added to SIGNS (required or wallSign throws).
- Airlock sign bug FIXED: both `al.${side}` overhead signs were
  back-face culled — rotations were swapped (south had π, north had 0;
  correct is south 0 facing -z approach, north π facing +z into the
  corridor). Both INSPECTION POINT and NOTICE now render; anything
  keying on them (gaze.shift, terminal.notice) is legible.
- `pace.dissolves` (**46**): player.speedScale (new controller field,
  multiplies WALK_SPEED) eases 1→0.55 inside z 16–48 — the loop takes
  longer; footstep cadence follows automatically (speed-driven). Probe:
  `__nightaudit.speedScale()` exposed. Note: e2e sim runs on real dt —
  at ~2fps frames the ease is under-sampled but still deterministic.
- `gaze.shift` (**45**): SignSpec gained `figure: "left"|"right"` and
  drawSign draws an original walking-person glyph (drawFigure, mirrored
  by dir) left of the title — sign.exit.south carries it. Def redraws
  the shared spec texture with the figure flipped like poster.swapped.
- Tactile guide strip + `guide.missing` (**47**): amber tactile channel
  down the floor right-of-centre (x=0.72, z 3–54.2) in 8 registered
  `guide.seg.N` boxes (6.4 m each) — texture `tex.guideStrip` /
  `mats.guideStrip` (vScale 8 per segment). The anomaly hides 1–3
  adjacent middle segments via setEnabled(false). Strip is the
  corridor's memorization line — it can also anchor guide.misaligned /
  guide.reversed later.
- `guide.misaligned` (**48**): 3 adjacent `guide.seg.N` yaw ±~0.1
  (middle larger) — an S-bend, unmistakable at range. Restore in
  cleanup keeps orig rotation.
- Volumetric shafts + `shaft.glow` (**49**): every troffer gets a
  crossed-plane additive shaft (`shaft.<trofferName>` TransformNode,
  `mat.lightShaft`/`tex.lightShaft` ALPHA_ADD). LightZone gained
  `shafts: TransformNode[]`; lightOut/lightDelay/lightFlicker toggle
  them with the lamps. shaft.glow dims one panel via
  `shaftNode.name.slice(6)` → troffer name.
- `watcher.follows` (**50**): figure STARTs INSIDE the north airlock
  (z=-3.4) behind spawn (player re-enters at z=-2.4 facing +z — the
  corridor loops south→north). Vanish check requires figZ>0.8 so it
  doesn't insta-despawn while still in the airlock. Facing check reads
  ctx.player.camera.rotation.y (no player.view() — that's the debug
  handle's); forward = (sin yaw, cos yaw).
- `posters.mirror` (**51**): drawPoster gained a `mirror` param
  (translate+scale(-1) inside the border) — def redraws every
  poster.N texture mirrored, restores on cleanup.
- `clock.missing` (**52**): hides the whole `clock` root via
  `registry.get("clock.face").parent` (root itself is unregistered —
  face+rim+pin+hands all die together).
- `bin.wanders` (**53**), `bench.moved` (**55**): plain position drifts
  on registered nodes. Fixture `WALL_X = 1.74` (NOT the corridor
  xHalf=1.8 — baseline bin.x=1.5, bench.south.x=-1.29; bench.south has
  no collider so it slides freely).
- `notice.amends` (**54**): drawSign with a cloned spec — the
  `sign.notice.board` DynamicTexture is shared; redraw in place and
  restore the original spec on cleanup.
- `airlock.breach` (**56**): `al.${side}.cap` had to be registered
  explicitly (kit.box does NOT auto-register — only bench/wallSign/
  hangingSign/slidingDoor/troffer/clock do). Cap colliders are NOT in
  the registry — find them via `world.colliders.find(c => c.name ===
"al.north.capCol")`. Throat boxes get `checkCollisions = true`
  directly; `ctx.player.position` (not getPosition).
- Probe timing learned: after teleport-commit, `anomaly()` still reads
  the PREVIOUS loop until JUDGE_DELAY (0.55 sim-s — many real seconds
  at e2e ~2fps) elapses. Poll `loop() >= 2` before sampling.
- `tracks.wet` (**57**): CreatePlane prints, `rotation.x=π/2` lays them
  flat facing +y (same as scatter papers), `rotation.z` sets march yaw.
  New StandardMaterial inside activate() — must dispose on cleanup.
- `chalk.marks` (**59**): the WEST wall z 12–32 is the records cabinet
  bank — it protrudes to x=-1.55, so decals at the panel face (-1.74)
  are INSIDE it. Wall decals belong on z 33–55 (requires
  wall.left.2/3). Thin CreateBoxes, not planes (no facing question).
- `figure.south` (**58**): figure inside the south airlock at z=58.7;
  the inner doors part at player z>53.8 revealing it centered through
  the gap. Rubber boxes + a small head-tilt (rotation.z) sell it.
- Next up per the attached brief: M2 visual benchmark (baked lighting /
  KTX2 / richer kit), full accessibility audit, ambient dressing depth.

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
