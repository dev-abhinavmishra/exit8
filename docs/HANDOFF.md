# HANDOFF — NIGHT AUDIT

Read this first in a new session. Then docs/IMPLEMENTATION_PLAN.md.

## Where we are

- PR #1 (`devin/night-audit-vertical-slice`) carries M0–M5:
  **215 anomalies** (the full catalog — ANOMALY_CATALOG.md), chapters,
  daily/custom routes, practice mode, route archive, field notes +
  dossier ending, gamepad, ambient walker + watcher, missed-divergence
  report. NOT yet merged. Current gates: 236 unit, 27/27 e2e (~13m;
  anomalies.spec forces all 208 ids, ~7-8m alone — it navigates to
  about:blank between ids to drop dead GL contexts, which was the
  cause of a previous 8m "timeout" misdiagnosis; suite cap is 35m).
- 2026-10-08 consequence/fidelity pass: dangerous QUARTET complete —
  figure.rush approach, walker.charge arrival (0.9s telegraph),
  floor.flood soak, lights.blackout STANDOFF (zone kills → emlights +
  backlit silhouette at z49, head-track <6.5m, contact −5; ambient
  walker goes absent so the dark holds ONE figure). PASS counter =
  consecutive-correct STREAK (resets on wrong call), plate + terminal
  - report BEST PASS + archive career `progression.bestPass` (migrates
    v1 saves). North airlock sign swapped NOTICE→`sign.diverge.north`
    (← DIVERGENCE POINT, mirrors south — notice.gone retargeted).
    Secure-ending reveal rebuilt: radial-gradient glow (not a card),
    stair flight + handrail/newel silhouettes, spill 4.4/range 11.
    **Trap**: the reveal plays at the cap the player FILED at
    (retreat→north, continue→south) — probes must look the right way.
- 2026-10-08 second pass: rats.scurry (sub-second wall-crossing, once),
  draft.sheet (`audio.playScrape` — a lone sheet slides in an unseen
  draft), pa.deadair (`audio.playPaDeadAir` — relay click + carrier
  hiss, no voice); anomaly odds now RAMP with depth — base 0.5/0.55/0.6
  - 2.5% per loop past 2, capped 0.8 (`loopManager`); sign titles
    fit-to-width (`drawSign` measures the string, shrinks font before it
    can reach the pictogram — INSPECTION POINT was colliding since M1);
    perf re-measured: spawn 461 / mid 270 draws (merge holding, _drawCalls
    is cumulative — divide delta by fps).
- 2026-10-08 payoff batch: secure ending walks INTO the light
  (capCol disabled, white veil, `endingSide/endingCrossZ` in
  loopManager); corridor brown-out on commit (`dipLights`/`applyBrown`
  snapshot zone intensities + trofferLit emissive + lightShaft alpha);
  lost ending `audio.hushAmbience()` before the groan; menu parks the
  camera at the corridor mouth; `audio.drip` RngStream schedules vent
  plinks; new anomalies walker.hum (`audio.playWhistle` sine+vibrato,
  phrase scheduler) + figure.wall (nose-to-panel, turns once passed);
  footsteps got a slap-echo send (0.115s delay × 0.3 fb, LP 1500, wet
  0.22 — constructor `unlock()` block); pause/titlecard bleed fixed in
  `show()` (live `.na-titlecard`s removed when any screen opens).
- 2026-10-08 world-tic pass: `world.fanSpeed` knob (0..1+) + the
  junction extraction fan (registered `junction.machine.fan` TransformNode
  with TWO crossed blades — per-blade pivots read wrong) spun by
  `world.update(dt)` (called from app after ambientWalker). machine.silence
  / fan.dead / lights.blackout throttle it to 0, fan.racing 4.2× + gain
  1.5. `world.dust` (ParticleSystem|null, null under reducedMotion) —
  blackout stops the motes so "the dark holds nothing moving". New:
  fan.dead, fan.racing, gallery.dark (lamp mats trofferLit→trofferDim
  on the 3 registered gallery lamp nodes), pane.face (face + fingers
  pressed into south door's wired pane — see traps below).
- 2026-10-08 fidelity pass 2: terrazzo roughness 0.38→0.27 +
  envIntensity 0.85 (wet-tile light smear under troffer rows — verified
  pool, not blob); ceiling envIntensity 0.45→0.6 (tile read between
  zones). Audio coherence: `startAmbience` opts now take live getters —
  `fanScale` (world.fanSpeed whoosh) and `zoneLight(pos)` (zone
  point.intensity/7.6) so troffer hums die with their zone (zone kills /
  light.delay / blackout / commit brown-out). Vents stay on their own
  feed by design. New: poster.backs (material-swap to card backs,
  dynamic `registry.has('poster.N')` count — there are 4 posters not 3),
  pass.stuck (corridor-side counter `sign.attempt.face` at
  (−1.54,1.72,54.93) shares the repainted sign.attempt texture;
  `ctx.streak` added to AnomalyContext — plate paints PASS{streak}
  instead of {streak+1}), sign.safety placard west wall z41.5.
  TRAP: teleport yaw +π/2 = EAST wall, −π/2 = WEST (posters/records).
  Catalog **215**.
- 2026-10-08 fix batch: `notice.amends` was dead code — requires pointed
  at `sign.sign.notice.board` (double prefix, never registered → silent
  skip; the forced sweep caught it) AND it repainted a sign material
  applied to no mesh. Now it restamps one pinned rota sheet via
  `drawNote` + a StandardMaterial swap (sheets are children of
  `notice.board`, `notice.sheet.${i}`). sheets.cleared/sheets.added
  exclude it. Door vision panes: `doorGlassMat` specular 0.2→0.06 —
  they caught a blown white highlight that read as lit windows at any
  distance.
- **E2E sweep flake**: the 4-lane forced-activation sweep can stall a
  lane (poster.*/pitch.sags timed out once at 16m — re-probed fine in a
  serial mini-sweep). It's GL-context contention on SwiftShader, not a
  product bug: re-probe ids serially before believing a sweep timeout.
- **Sealed-box trap (proven, fire cabinet)**: contents placed INSIDE a
  solid box are occluded by its own front face forever — a "window" on
  a solid box shows the face, not the interior. A lit material inside a
  closed box also renders black (no light). Pattern that works: glass
  stands proud of the face (+ bezel + pull handle), contents live in
  the face→glass gap and are self-illuminated (disableLighting +
  low emissive) so they silhouette through the smoke.
- **Decal/plate traps (proven)**: (a) `backFaceCulling = false` is
  REQUIRED on any plane whose facing is uncertain — a culled plane is
  invisible with visible+enabled true; (b) a plate inside leaf-local
  geometry hides INSIDE the win box (leaf face z ±0.06 vs plate -0.064)
  — parent to world.root at an absolute position instead; (c) debug an
  invisible mesh with `meshInfo(name)` → {pos,rot,visible,enabled}, then
  a baseline screenshot with a DIFFERENT anomaly to separate scene
  artifacts from your mesh (the "white pane" was lamp specular in
  baseline, not the plate).
- Working mode (user, latest): QUALITY over quantity — replica parity
  with the Exit 8 corridor, not catalog count. Same subway loop, many
  anomaly versions of it. Test only after MAJOR additions: quick probe
  - unit/build per change, e2e suite deferred for small anomalies.
- 2026-10-08 render-fidelity pass 5 (this stretch): airlock status
  domes (amber sealed → teal open, pulsing mid-travel, driven in
  loopManager's door-slide block); troffer louver faces
  (emissiveTexture at 0.62 scale — the >0.8 blowout rule); records-bank
  card labels; real figure/prop shadows under the inspection spot
  (caster allowlist + onNewMeshAdded self-registration); per-zone
  light tints (`zoneDefs` — clinic cool, junction warm); hemi ambient
  1.32→1.14 for genre contrast; env-cubemap down-face floor bounce
  (lifts ceilings/undersides); dust motes via ONE corridor
  PointsCloudSystem (zone-coherent through groupId→zone intensity);
  walker inspect beat faces west (−π/2) not east; scuff decals
  aoStrip→grime (the large-slab trap — black shards at thresholds).
  Verified live: cold open, watcher.follows, lights.blackout (motes
  cluster in the surviving pool), gallery.mirror, inspector face.
- IBL trap (fidelity pass 4, the big one): `environmentIntensity` was
  set on 8 PBR materials but `scene.environmentTexture` never existed —
  every env knob was a silent no-op and metals went black in dim zones.
  `buildEnvironmentTexture()` (textures.ts) now paints a 128px 6-face
  cubemap (troffer bars on +Y so the terrazzo smears lamps into streaks).
  CHECK envTexture exists FIRST when a PBR surface reads wrong; the
  pale-material workarounds for steel-in-dim predated this and still
  look right, so they stay.
- SSAO2 dead-end (fidelity pass 4): `SSAO2RenderingPipeline` renders a
  fully BLACK frame under SwiftShader-webgl (with or without an explicit
  `enableGeometryBufferRenderer()`) — no page errors, just dead output.
  Reverted unverified; retest on real GPU before retrying.
- Procedural normal maps: `normalsFromHeight(scene,name,height,s,
strength)` (textures.ts) — rebuild the albedo's grooves in a
  Float32Array height field, get a tangent-space RGB map. Currently:
  wallPanel grout (4.5), terrazzo brass joints (3.0), shutter slats
  (5.0). Bump texture tiling MUST match the albedo's uScale/vScale.
- Material traps, both directions (fidelity pass 3): (a) LIT
  StandardMaterials WASH OUT to blown pale under zone lights —
  `elec.panel.leaf` read as a glowing slab until `disableLighting =
true` on elecPaint/elecDark (diffuse 0.16 / 0.03); use unlit matte
  for dark hardware that must STAY dark. (b) Steel still goes
  near-black in dim zones — same fix, pale/unlit material instead.
- Walker give-way: `ambientWalker.update(dt, playerPos)` — playerPos
  optional; patrol halts when the player stands ahead on his lane
  (decays limb swing, faces travel dir). Scare modes unaffected.
- Walker block uses LANE-relative test: |px−LANE_X|<0.85 and player
  0.25–1.15 m AHEAD along travel dir — him walking away or player
  behind does not block (verified: teleporting onto the lane behind
  him correctly does NOT freeze him).
- records bank hardware: pulls+labels now on ALL 4 drawer rows
  (`dress.cabpull.<y>.<z>`, `dress.cablabel.<y>.<z>`) — merges fine;
  one-row-only reads as flat slab at arm's length.
- M5 landed this pass: `src/world/merge.ts` folds ~160 static dressing
  meshes into per-material merged meshes (440→342 draws/frame measured —
  BENCHMARK.md has the 8-waypoint route capture); ACCESSIBILITY.md audit
  - `light.flicker` capped ≤3 flashes/s; `XB=1 npx playwright test` adds
    firefox/webkit smoke (4/4 green) — it caught a real unhandled
    `requestPointerLock()` rejection, now caught at all call sites.
- Playable slice: WebGPU→WebGL2 fallback, quality tiers, FPS controller
  (collision via `camera.cameraDirection` + `collisionCoordinator` import),
  Loop 7 concourse (procedural), commit thresholds, stability index,
  anomalies registered via `anomalies/index.ts` (`ALL_ANOMALIES` —
  register there, not in app.ts), procedural audio, start/pause/settings/
  results/credits, v1 saves, vitest + playwright suites, vercel.json.
- Gates (run before every push): `npm run lint && npm run typecheck &&
npm run test && npm run test:e2e && npm run validate:assets &&
npm run build` — currently 186 unit + 26/26 e2e green; per the quality
  directive, run e2e only after major additions, unit/lint/tsc each push.
- **Chapters are live** (b3d517f): `1 + floor(correct/2)` cap 3, HUD shows
  CH I/II/III. Tiering: ch1 = quiet 17 (signs/posters/props/stills), ch2 =
  motion + watchers (sways, spins, breathes, groans, watcher.far,
  counter.worker, cctv.gaze), ch3 = building-lying (light.out,
  machine.silence, temp.drift, air.haze, announce.spatial). Rates
  0.5/0.55/0.6, stability gain 12/10/9 → a clean win is 6 loops.
- 2026-10-07 quality batch (per "quality over quantity" directive):
  **loop 1 is now always clean** (`loopManager` rate forced to 0 on
  loopIndex 1 — Exit 8's clean-baseline contract); chapter advance is
  announced (`audio.playAdvance` + "clearance raised" caption — was a
  silent HUD tick). Figure close-ups fixed: face plate uses oval-alpha
  (`t.hasAlpha` + `clearRect` + `ctx.clip()` before painting — the
  plate edges are transparent so the face reads painted ON the skull),
  lapels angled into a V meeting at the sternum, walker clipboard is a
  drawn audit sheet. New anomalies: vend.empty, pitch.sags
  (`audio.setMachinePitch(fn)` — multiplies the machine thrum's 55 Hz),
  ceiling.weeps (`audio.playDrip`), poster.watches (`drawPoster` 5th
  `gaze` arg — bright `#efe9d8` whites or they're invisible vs the
  pale face), sign.mirror (`drawSign` 2nd `mirror` arg), doors.slam
  (`audio.playSlam` — triggers on `rig.open01` so the leaves part then
  crash, `done` flag or it retriggers every update), gallery.occupied
  (seated body copied from benchSit, mirrored toward −x), walker.midstep
  (new WalkerMode — limbs held mid-stride), hatch.knocks
  (`audio.playKnock` + plate.position.x shudder).
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
  kit.box does NOT register either (2026-10-08: `dress.emlight.*` lamps
  registered explicitly so anomalies can wake them).
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
- Anomalies 60–64 (cctv.all, guide.cross, shutter.ajar, records.breach,
  gallery.frost) landed together. Traps hit: `world.materials` NOT
  `world.mats`; AnomalyInstance requires `update` (no-op ok); cctv.N is
  a TransformNode (meshInfo null) — probe `cctv.N.lens` absolute pos
  instead; records.cabinets face x=-1.55 (drawer proud at -1.48);
  guide segs all home at x=+0.72; `?anomaly=<id>` URL param applies the
  anomaly at LOOP 1 — much faster than forceAnomaly+commit for probes.
- Anomalies 65–68 (door.stuck, walker.crowd, light.follows, glass.eyes):
  door leaves are `door.<side>.inner.L/R` (NOT al.*); anomaly update()
  runs AFTER the rig writes leaf x each frame — override there to hold
  a leaf. `instantiateHierarchy` needs the InstancedMesh side-effect
  import. Behind-glass silhouettes need a faint emissive (~0.05) to read
  through alpha-0.45 darkGlass.
- Anomalies 69–73 (sign.wrongway, terminal.black, bin.flipped,
  hatch.open, strip.grows): sign retexture = `materials.sign.get(specId)
.diffuseTexture` + drawSign(clone); airlock terminals are
  `al.<side>.terminal` planes; hanging signs live at x=0 (not walls).
- Anomalies 74–86 (catalog now COMPLETE at 86): `airlock.south` is a
  single TransformNode — `al.position.z += n` slides the whole assembly
  (doors, cap, stripe, terminal, sign, ALL child colliders) so
  hall.stretch = move node + shift `LAYOUT.southAirlock/commitSouthZ`
  (mutable via `as { z0: number }` cast — LAYOUT is `as const` readonly)
  - filler floor/walls + pushed wall colliders into `world.colliders`.
    Camera at `ctx.player.camera` (NOT world.camera). Sign-material
    recipe that reads like built-ins: `diffuseTexture` + flat
    `emissiveColor 0.45` + `specularColor 0.02`, `t.hasAlpha = false`,
    NO disableLighting. CreatePlane fronts draw textures MIRRORED —
    `p.scaling.x = -1` fixes; a box's back face shows texture dark/faint —
    dual-face hanging signs need two flipped planes, not one box.
    kit.box does NOT register — mullions/vents/pipes exist only via
    `scene.getMeshByName`.
- 87–89 use the new dressing anchors (floor.arrow.\*, bay.plate.\*,
  ceiling.vent.\*). More traps: `mesh.rotate(Axis.Y, π, Space.WORLD)`
  writes the quaternion — `meshInfo().rot` reads `0,0,0` for it (verify
  flipped geometry by screenshot, not euler). `look(yaw, pitch)`: POSITIVE
  pitch looks DOWN. `draws()`/`_drawCalls.current` is CUMULATIVE — diff two
  samples a frame apart (~440 draws/frame actual). `requires` names must be
  REAL registry entries or forceAnomaly silently can't activate (vent
  grilles had to be registered for vent.slats). Shift report tracks
  `filed` + `missed` registers in app.ts (deduped by displayName).
- Signature batch 88–92 (this pass): `ceiling.crack` (live-drawn
  DynamicTexture vein), `floor.flood` (black water zone), `walker.fast`
  - `walker.charge` (pace 1.9 / sprint-to-player). Traps:
    alpha decals MUST use `mat.useAlphaFromDiffuseTexture = true` +
    `alphaMode=2` + `backFaceCulling=false` (the aoStrip pattern) —
    opacityTexture alone renders invisible; `ctx()`/drawFace RESET the
    canvas transform or repaints compound scale; RngStream has
    `rng.range(min,max)` + `rng.pick(arr)`; `clinic.counter.bell` is NOT
    registered (scene.getMeshByName); zone PointLights live at
    `world.lightZones.<name>.point` + `.troffers` — light.red swaps
    troffer materials to a fresh StandardMaterial and DISPOSES it on
    cleanup (never mutate shared mats.trofferLit); faceplate must be a
    single-sided CreatePlane (a box maps the face texture to all 6
    faces); WalkerMode "charge" + `chargeAt(playerZ)` drives the sprint.
    e2e sim runs ~0.6× real-time under SwiftShader frame clamp —
    verify motion by meshInfo position deltas, not wall-clock waits.
- Signature batch 93–99 (this pass): `walker.wait` (stations him at
  the south mouth via new `ambientWalker.holdAt(z)` — stare mode
  drives position from the INTERNAL z, external position.set gets
  stomped), `doors.open` (preset `rig.open01`/`target01` = 1 and the
  rig's own easing holds it), `fountain.blood` (swap basin material —
  spawned decals alone don't read in shadow), `phone.rings` (new
  `audio.playRing(pos)` double-burst trill + LINE lamp swap),
  `poster.grin` (drawPoster gained a 4th `grin` flag — wide dark
  crescent + teeth strip + narrowed eyes).
- Signature batch 100–104: `vend.empty` (drawVendingFace(t, empty)
  variant — bare shelves + OUT OF STOCK strip), `pitch.sags` (new
  `audio.setMachinePitch(fn)` detunes the 55Hz junction thrum over
  ~80s), `ceiling.weeps` (falling drop + growing wet disc + new
  `audio.playDrip(pos)`), `poster.watches` (drawPoster gained 5th
  `gaze` param — pale whites + pupils offset by player z; whites MUST
  be bright against the pale face or it reads as baseline),
  `sign.mirror` (drawSign gained a `mirror` param — whole sign flips
  glyphs + arrow).
- **Loop 1 is now always clean** (rate forced 0 when loopIndex===1) —
  the first corridor teaches the baseline like Exit 8's; anomalies
  roll from loop 2. Chapter rates ~50/55/60% keep clean loops mixed in.
- Yaw note (verified): `look(yaw)` — yaw ≈ -1.57 faces the west wall
  square-on, +1.57 east; yaw 0 = +z (south, toward the commit doors),
  π = -z (north, toward spawn). To aim at a target: yaw = atan2(dx,dz).
  Verify pupil direction visually when touching drawPoster gaze.
- **REQUIRES TRAP (critical, caught this pass):** `requires` entries
  must name `registry.register()` ids — a typo silently SKIPS the
  anomaly (console warn only, loop runs clean). `ambient.walker.faceplate`
  is NOT registered (only `ambient.walker` is) — walker.fast/charge
  never fired before the fix. Same class: `sign.junction` vs the real
  `sign.sign.junction` (kit.hangingSign prepends "sign."). Guard:
  `tests/e2e/anomalies.spec.ts` forces every catalog id and asserts activation.
- **East-wall decal faces**: planes on the east wall (+x) use
  `rotation.y = +Math.PI / 2` to face −x into the corridor (−π/2 points
  into the wall and is backface-culled — the glassWriting convention).
  Transparent decal materials use diffuse+emissive+opacity textures
  (all three bound to the same DynamicTexture), `disableLighting`,
  `backFaceCulling=false`, `parent = world.root`. Runtime-drawn marks
  go on `anomaly.*` named planes disposed in cleanup.
- **index.ts insert dedupe**: python `.replace()` inserts duplicate
  `import`/`ALL_ANOMALIES` entries when the anchor appears twice —
  the boot check throws `duplicate anomaly: <id>` and `ready` never
  fires. After scripted inserts, grep the index for the new name.
- `meshInfo()` returns undefined for TransformNodes (figure roots);
  query a child mesh (`<name>.head`) for enabled/pos instead.
- **`teleport(x,y,z)` resets the camera to yaw 0** unless you pass the
  4th arg — `look()` called BEFORE a teleport is silently discarded and
  every screenshot faces +z (the sealed door). Either pass
  `teleport(x,y,z,yaw)` or `look()` after. Cost me ~6 iterations chasing
  an "invisible" figure that was behind the camera the whole time.
- Endings now have payoff beats in `loopManager` (`beginSecureEnding` /
  `beginLostEnding` + `updateEnding`): secure drops the filed-at cap
  onto a stair silhouette + warm glow; lost drowns all zones to 5% and
  stands a cold-emissive silhouette at the cap. In a drowned corridor
  lit materials read black and new PointLights get crowded out of
  StandardMaterial's 4-light cap — use `disableLighting` + faint
  `emissiveColor` for things that must read in the dark.

  `__nightaudit.anomaly()` equals it — run it after touching requires.

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
- 2026-10-08 audio/polish pass (this branch, after the 158 catalog):
  endings have payoff beats (secure = cap drops onto daylight stairwell,
  lost = zones drown to 5% + silhouette at the cap, `disableLighting` +
  faint `emissiveColor` — PointLights get crowded out of
  StandardMaterial's 4-simultaneous-lights cap in the dark corridor);
  station PA (`playAnnouncement` — chime + formant-syllable horn speech
  from `world.anchors.paHorns`, scheduled 40-85s on the `audio.pa`
  stream); distant train (`playTrainPass` — rumble + wheel-clatter +
  brake whistle, 90-150s, `audio.train` stream); doors finally sound
  (`playDoorSlide` fires on every `target01` flip via a
  `prevDoorTargets` map in update()); guide-strip footsteps thud
  (x≈0.72 z 3-54.2 → lower bandpass); vend compressor hum
  (`anchors.vend` + `setVendGainScale` — vend.dead silences it);
  walker reads his clipboard at the north-end pause (deterministic —
  `inspectT` in ambientWalker, faces +x east, armPivot -1.05, head 0.34);
  cold-open title card (`ui.titleCard`, .na-titlecard keyframes,
  `.fast` under reducedMotion); start menu fits 800px
  (`@media max-height:860px` density). **teleport(x,y,z) RESETS YAW
  to 0** — pass the 4th arg or look() afterwards; an invisible-figure
  saga was just the camera facing the wrong way.
- 2026-10-08 payoff/menu pass: secure ending is now WALKABLE — after
  the cap drops (`endingT>2.9`) player re-enables, `al.<side>.capCol`
  collider disables, and crossing ~0.55m past the cap plane fires a
  WHITE veil (`onFade(1,null,"light")`, `.na-veil.light`) → report;
  `onEnd` now always `veilOff()`s. Corridor brown-out: `dipLights`
  snapshots zone intensities + `trofferLit.emissiveColor` +
  `lightShaft.alpha` and eases `brown01` 0↔1 each frame (down ~0.7s
  on commit, back ~1.1s after the veil; endings leave it dipped).
  Start screen parks the camera at the corridor mouth
  (`Vector3(-0.45,0,6.5),0.1`) so the menu + attract drift sit over
  the lit passage; `startRun` teleports back to `LAYOUT.spawn` first —
  the loop's cold open is untouched.
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
  posters shipped invisible for 3 commits before catching this; the
  same bug hid the airlock terminal screen for the whole slice — fixed
  2026-10-07). On local-transform children (phone, fountain) the
  corridor-facing side is local −x for RIGHT-wall mounts → `rotation.y
= +π/2`; texture-only materials in dark zones need `emissiveTexture`
  bound, not just flat `emissiveColor`. `__nightaudit.meshInfo(name)`
  dumps pos/rot/visibility for probes.
- Detail-pass material lessons (2026-10-07): `mats.steel` renders
  near-black anywhere the junction's weak reflections dominate — use
  `mats.wallPanel` when the look should be stainless (lift doors,
  fountain). `mats.aoStrip` (disableLighting) renders SOLID at any
  meaningful size — thin AO/cove strips only; soft stains use
  `mats.grime` (alpha ~0.3). New wall/prop dressing must either parent
  to an anomaly target or fold into STATIC_PREFIXES in `merge.ts`
  (`dress.*` families are registered there).
- More traps (later same pass): `world.scene` does NOT exist on
  ConcourseWorld — use `const { scene, world } = ctx`.
  `registry.get(name)` returns a TransformNode (rotation/position/
  getChildMeshes); `registry.mesh(name)` returns the mesh (.material,
  .setEnabled). A mesh that an anomaly moves/hides MUST NOT match a
  STATIC_PREFIXES prefix or merge.ts folds it (south pilot lamp was
  renamed `dress.doorlight.s.lamp` → `pilot.south` + registered).
  There is no `mats.amber` — use `mats.guideStrip` for amber accents.
  `mats.wallPanel` reads pale in lit zones but near-black in the
  z45–55 dark stretch — dark-span fixtures want a dedicated material
  with diffuse ~0.2–0.4 + tiny emissive (mat.elec.paint, mat.mop.yellow,
  mat.firstaid.white pattern). drawSign figure glyph: cx 32, title
  x-offset +18 when spec.figure set.
- Fastest probe recipe: `?e2e=1&seed=<s>&anomaly=<id>` arms that
  anomaly for loop 1 — no forceAnomaly call needed; then teleport +
  look + 600 ms + screenshot. TWO more traps learned the hard way on
  cap.leaks: **CreatePlane's normal faces −z** — a corridor-facing
  plane at world rotation.y=0 renders INVISIBLE (back-face culled);
  needs `rotation.y = π`. Lying a plane flat for a floor decal is
  `rotation.x = +π/2` (not −π/2 — that's face-down). And **teleport
  z ≤ −2.9 north (or ≥ 57.9 south) CROSSES THE COMMIT LINE** in a
  probe — the loop advances under you and the screenshot shows the
  wrong loop; stay ≥ −2.8 to inspect the north cap.
- 2026-10-08: `ctx.penalize(amount)` — docks stability, floored at 1 so
  a contact scare can never skip the verdict flow (endings stay
  commit-plane verdicts). Dangerous trio: `figure.rush` (wakes <6.5 m,
  sprints 4.6 m/s leaning in, contact −6 then vanishes), `walker.charge`
  (arrival <1.35 m −6 — he halts ~0.9 s first, the routine visibly
  breaking before the sprint; charge leans like the rusher and resets
  on setMode/reset), `floor.flood` (wading plinks; soaking >2 s −4 —
  the flood spans the corridor so entry is often forced, only
  lingering costs); `lights.blackout` makes it a quartet — the feed
  dies zone-by-zone, a backlit figure waits under the far airlock
  pool, its head tracks inside 6.5 m, arm's reach (<2.2 m) costs −5.
  Standoff, not a chase: the right play is turning back. South cap
  carries `sign.attempt`, the repainted PASS 0N plate
  (diegetic loop counter); loopManager repaints it via drawSign at every
  roll. **Anomalies only `update()` while phase === "open"** — a chase
  could otherwise dock a player already frozen mid-judgment.
- 2026-10-07 additions: `AnomalyDef` requires ALL of `progressionRange`,
  `testSeed`, `dangerous` (TS2739 missing them). `update(dt)` gets
  `ctx` closure — `ctx.player.position`, `ctx.audio.play*`,
  `world.registry.mesh(id)` are all reachable. LAYOUT.corridor.xHalf =
  1.8 (gallery chair x = xHalf+1.12 = 2.92, desks x+0.72, monitor desk
  z=26.5). `meshInfo(name)` pos floats work for audio-adjacent probes
  (knock = plate.position.x deviating). **yaw convention**: `look(yaw)`
  — yaw 0 = +z SOUTH (commit doors), π = −z north (spawn), −1.57 west
  wall, +1.57 east; aim at target = atan2(dx, dz); +pitch looks DOWN.

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
- Cross-browser QA: `XB=1 npx playwright test` adds firefox + webkit
  projects running only `crossbrowser.spec.ts` (boot + move + one
  judgment). Requires `npx playwright install firefox webkit` once —
  the blueprint installs chromium only. Found a real bug: headless
  WebKit rejects `requestPointerLock()` — every call site now wraps it
  in `Promise.resolve(...).catch(() => {})` since the fallback input
  path covers the denial anyway.

## Fidelity-pass traps (2026-10)

- **Emissive blowout swallows texture detail**: an emissiveColor scale
  > ~0.8 on a StandardMaterial washes any emissiveTexture to a white
  > slab under the post pipeline. Keep textured emissive fixtures at
  > ~0.62 scale (troffer louver face) — verified by point-blank probe.
- `__nightaudit.matInfo(name)` returns { mat, emissiveTex, emissiveR }
  for registry/scope meshes — material audit helper.
- Shadow rig: `buildInspectionRig` casts walls + figure parts
  (.leg./.coat./.chest/etc.) + big props (bench., bin, prop.vend.,
  prop.fountain., junction.machine, sign.totem., dress.caution.) under
  the camera spot; anomaly figures self-register via
  onNewMeshAddedObservable. The spot is a headlamp — figure shadows
  land on whatever is BEHIND the figure; verify silhouettes against
  lit faces (cap face, gallery), not head-on.
- Status domes `al.<side>.statusdome` are registry meshes driven from
  loopManager's door-slide block (amber sealed → teal open, pulse
  mid-travel) — NOT dress.* so they stay discrete.
- **PointsCloudSystem pointSize is PIXELS, not world units** — `new
PointsCloudSystem(name, size, scene)` feeds gl_PointSize; sizes like
  0.017 render as subpixels (invisible). The dust motes use 2.8px.
  Per-particle color needs `p.color` set in addPoints AND re-set in
  updateParticle (it's the fade channel); `p.groupId` (not groupID)
  carries the zone index; `p.idx` indexes your own base-position array.
- **Env cubemap faces**: the down face is what ceilings/undersides
  sample — a black down face leaves every overhead surface in void.
  Ours now carries a warm radial floor-bounce; up face keeps the
  troffer bars (what floor speculars smear).
- Zone light tints live in `zoneDefs` (`clinic` runs cool) —
  `baseDiffuse` snapshots feed anomaly restore, so keep the base color
  in the def, not patched after creation.

## S-2 machinery bay (2026-10, PR #2)

- Walkable recess in the WEST wall, mouth z46.2–49.4, `BAY_DEPTH=1.15`
  (back-face x −2.95). Constants `BAY_Z0/BAY_Z1/BAY_DEPTH/BAY_ZC` at the
  top of `buildConcourse`. Shell = `junction.bay.*` (merges); colliders
  `headerCol/cheekCol/backCol/floorCol`.
- **`LightZone.extraLights: PointLight[]`** — non-troffer lights inside a
  zone's footprint join EVERY dim path via it (brown-out snapshot tuple,
  blackout setLit, light.delay setLit, lost-ending ×0.05). Adding a light
  inside a zone: push it to `<zone>.extraLights`; emissive fixture →
  `<zone>.troffers` (material swap) — and keep that mesh OFF the
  `junction.bay.` merge prefix (`junction.baylamp` is the pattern).
- Wall/collider/AO/baseboard/rail/tray/conduit/cove/hangers all split
  around the mouth via `${i?".s":""}` spans; `wall.left.4` is the run
  south of the mouth (corridor.breathes reaches it). `dress.fborder`
  intentionally continuous through the opening.
- The machine + pipe run live INSIDE the bay now (anchors.junctionMachine
  = −xHalf−BAY_DEPTH+0.38). Lockers at z≈51 south of the mouth.
- Pallets/pole vignette east z≈53.4-54 (dress.pallet.*/dress.pole/
  dress.mophead) — floor dressing, no surgery.
- Footstep surface hook: `inBay` (x<−1.75, z 46-49.6) → concrete timbre.
- `bay.occupied` — the bay's own anomaly (silhouette at the machine).
- **File-clobber lesson**: a stray paste overwrote concourse.ts with
  fixtures.ts content; recovered by splicing HEAD's head/tail around a
  dumped `cat -n` span from the overflow dir
  (`~/.devin-files/devin-remote-overflows-*`). When a file dies
  uncommitted, grep those dumps before retyping.

### follow-on dressing (same PR)

- Soffit beam bands `dress.soffit.{clinic,gallery}` at z32/z14 —
  `C.xHalf*2 × 0.3 × 0.6` wallPanel + rubber lip; marks zone thresholds.
- Vestibule staff doors `dress.sdoor.{north|south}.*` — frame/panel/
  handle/plaque on alternating side walls (north = west, south = east).
- Conduit branch `junction.bay.cond.{drop,jbox,run}` — feeds the bay so
  the gapped tray reads plumbed-in.
- `mat.baylamp` — dimmer dedicated emissive for `junction.baylamp`
  (trofferLit blows white at arm's length).
- Pause kicker shows live context: `ui.setPauseContext()` in app.pause().

## arc3 — lift lobby, egress strip, merge-prefix revival (PR #3)

### lift lobby (east wall z48.4-50.6, merged in PR #2 lineage)

- Recess constants LOB_Z0=48.4 / LOB_Z1=50.6 / LOB_ZC=49.5;
  `lback` (lobby back wall) = 2.35, `sback` (shaft back) = 2.85,
  `doorHW` = 0.8. Lobby occupies x 1.8→2.35; shaft behind to 2.85.
- `lift.reveal` void plate (fixtures.ts ~L568): black plate at x≈2.76
  fills the door opening — anything anomaly-built deeper than x≈2.76 is
  permanently occluded. Anomaly interiors park x<2.76.
- Leaf colliders: `lift.door.${sx}.col` parented to each leaf (fixtures
  ~L570) — the sealed doors were visual-only; you could ghost into the
  shaft. Colliders ride the slide so parted anomalies still leave a gap.

### egress strip (west wall, z10-52)

- `dress.egress.{0-9}` — 0.5×0.19 photoluminescent boards, y=0.4.
- **kit.plane faces −z at identity**: west-wall planes face +x corridor
  with `rotation.y = −π/2` (same lesson as the airlock terminal). With
  that facing, texture-right maps to −z.
- Mount heights: −1.72 proud of the wall face; −1.53 on the records-bank
  cabinet face (bank occupies z13-31, face −1.55). Boards inside the
  bank span must sit on the bank, not the wall.
- `egress.reversed` (#220) mirrors `dress.egress.4` via `scaling.x=−1`;
  `egress.gone` (#221) hides all ten — requires them literally.

### THE merge-prefix silent-death class (validator now guards it)

- `mergeStaticDressing` folds every mesh whose NAME starts with a
  `STATIC_PREFIXES` entry into `merged.static.N` — AFTER anomaly
  `requires:` resolution. The registry keeps a stale ref: `requires:`
  passes, `meshInfo`/`getMeshByName` return null, and the anomaly
  animates a dead object FOREVER.
- Convention: rename anomaly-reachable meshes OFF the prefix by
  dropping the dot — `junction.bay.` → `junction.baylamp` /
  `junction.bayvalve*`; `dress.gal.` → `dress.galcove/galmonitor/
gallamp`; `dress.emlight.` lamp heads → `dress.emlamp.*`.
- The trap bit 3× (bay valve spokes, gallery cove/monitor/lamp →
  gallery.dark dead; blackout emergency lamps → rim-light never lit).
- `validate:assets` now fails if: a `registry.register` wraps a
  mesh whose name matches a prefix, or a `requires:`/`registry.get`
  literal matches a prefix. This class cannot regress silently.

### also fixed in arc3

- `gallery.dark` cleanup restored all lamps to trofferLit — would have
  wiped the monitor's `mats.terminal` forever; now restores captured
  per-mesh materials.
- `mat.fborder` (PBR albedoTexture=tex.terrazzo, albedo 0.16/0.16/0.175)
  replaced the rubber-void floor border band.
- `walker.drop` (#222): `ambient.walker.clip` disabled + a flat copy on
  the terrazzo (box is ALREADY flat by construction — do NOT rotate.x;
  that stands it on edge).
- Fire extinguisher vignette at z42.4 west wall (`dress.ext.*`).
- bay.valve (#219): `junction.bayvalve` + `junction.bayvalvespoke.{0-3}`.
- shaft.occupied (#218): silhouette in the shaft at (2.56,0.02,49.5) +
  cold glow; leaves parked open 0.32-0.4.
- Catalog: 222. Egress/egress.gone/walker.drop verified by seeded probe.

## arc4 (PR #4 — enterable observation gallery)

- Gallery glass run splits around a staff-door bay **z 27.5–28.7**
  (`GDOOR_Z0/GDOOR_Z1` consts): `wall.gallery.glass` (z20–27.5, keeps the
  registered name) + `wall.gallery.glass.b` (z28.7–32), jambs at both
  bay edges, mullions unchanged at z20/23/26/29/32.
- Leaf = `wall.gallery.door` (TransformNode at z27.56, hinge north):
  stiles/rails/`wall.gallery.doorlite`/kick/levers both sides/steel
  sill (`dress.gal.sill` merges)/plaque `wall.gallery.door.plaque`
  (`sign.gallery` texture, rotation.y=+π/2 faces −x corridor).
  `gallery.door` (223) rotates leaf.rotation.y → ~1.62 rad over 2.4 s
  with playDoorSlide; drops paper-trail sheets corridor→room.
- **Colliders**: east wall collider splits `[z0,27.5],[28.7,LOB_Z0],
[LOB_Z1,z1]`; leaf collider parented to the leaf rotates with it
  (verified: closed blocks x≈1.42, open admits x≈2.74 inside); room
  sealed by `gal.col.back/side.*/furn.*` except the z27.3–28.9 pocket.
- **Interior-material trap**: shared `mats.steel`/`mats.rubber` inside
  the room = void — the room has dedicated `mat.gal.wall`/`mat.gal.enamel`
  (StandardMaterial, real diffuse; records-bank pale-enamel precedent).
- Interior lamp `light.gallery` (PointLight x2.5,y1.9,z27, int 2.3,
  range 5.2) rides `galleryZone.extraLights`; `gcove`+`glamp` join
  `zone.troffers` (both trofferLit — restore path writes trofferLit to
  every member unconditionally, so the `mat.terminal`/`dimMonMat`
  monitors MUST stay out or they lose their material on zone kills).
- Ripple fixes: `galleryFrost` frosts all 3 panes; `mullionExtra`
  dropped the z27.5 jamb candidate; `faceGlass`/`glassHands`/
  `glassWriting`/`galleryDoor` mutually exclude (decals would hang in
  the open gap). Footsteps in the gallery pocket = concrete timbre.
- Dressing (`dress.gal.` merge prefix): binder shelf + 7 binders, coat
  rail + coat, waste bin, red mug on desk.
- Verified: closed leaf reads as another bay; open swing + walk-in;
  inside-out corridor view through the glass is the payoff frame.

## arc5 — interactive lost ending

- Lost ending is now a walk, not a cut: `beginLostEnding` parts the
  commit-side inner door (`doors.{side}Inner.target01 = 1`), so the
  drowned vestibule opens and the figure at the cap becomes reachable.
  `updateEnding` re-enables the player at endingT>1.4, head-tracks the
  figure (`headPivot`, s-sign flips the atan2 for north vs south), and
  contact <1.35m → jolt + groan + dark fade → onEnd. 16s sim fallback.
- Figure type import: `buildFigure` returns `Figure` (headPivot field).
- No spec reaches ROUTE LOST — verified live via probe (stability 5 →
  wrong retreat → walk north → contact → ROUTE LOST report).

## arc6 — corridor.mirror (#225)

- Whole-loop mirror: `world.root.scaling.x = -1` flips every fixture,
  collider, and the walker's lane (all local under root) — plus every
  material's `sideOrientation` (0↔1, default ??1) so faces still render
  out. Sign textures mirror WITH the geometry = the anomaly's point.
- Positional audio anchors are ABSOLUTE Vector3s, not parented —
  negate `anchors.{clock,vend,troffers[],vents[],paHorns[]}.x` on
  activate + cleanup or sound localizes to the pre-mirror side.

- figure.threshold yield pattern: buildFigure at the commit spot facing
  north (rotation.y=π, same atan2 sign flip as the lost figure), slide
  ASIDE on <2.1m — files fine, never chases.
- lift.car trap: step into the cab (x>2.32, |z-49.5|<.55) → leaves home
  over .9s, glow gutters 5s, release ~7.5s total. Dread not damage.
- corridor.flicker recipe: per-zone intensity = base*(0.16+0.84*v) with
  v=|sin(t*9.5-i*2.1)*sin(t*3.7+i*1.4)|; troffer lit/dim swap at v>0.42,
  shafts at v>0.3 — mirrors lightDelay's setLit channel set.
- light.cold: swap every zone point.diffuse/extraLights diffuse to
  (0.55,0.72,1.0) + troffers to a dedicated cold emissive mat; restore
  captured colors on cleanup (never assume trofferLit — capture).
- walker.follow mode: target = player.z ± 2.7 by travel dir (lastPz),
  clamp z 3..52, 1.55*dt pace (1.8x catchup >1m); same legs/arms swing
  block as charge but 0.55/0.35 amplitude.
- gauntlet head-track: east-side figure (x>0, faces -x after turn) uses
  s=-1 in atan2(s*dx,s*dz); west uses s=+1.
- Unit spec invariant: every def needs requires>0 anchored to a
  registered always-present mesh (ambient.walker, light.zone.entry,
  wall.left.0, service.door.leaf all work).

## Arc 7 notes (2026-10-08)

- **Probe handle name**: the debug surface is `window.__nightaudit`
  (there is no `window.NA` — `NA` in specs is a const holding that
  string). Probes MUST click "BEGIN SHIFT" after `ready === true` —
  `state() === "playing"` never fires on its own. A probe that waits
  for state without clicking burns its whole timeout; this cost a
  full session stretch once.
- **wall.right.0 split**: east wall z0–15 = `wall.right.0`, z16–20 =
  `wall.right.0b`, with `service.door.header` lintel over the
  service-door reveal at z15–16. corridorBreathes SEGMENTS gained
  `wall.right.0b`; any east-wall anomaly needing the whole run must
  require both.
- **serviceStair room** (`world.serviceStair` + `serviceStairLamp`):
  prebuilt-disabled like depthRoom/clinicAlcove — landing + 9 steps
  - endwall + fardoor/farslit + rail + caged bulb east of the
    service door. `setEnabled(true)` only inside service.stairwell.
- **Scene-level lights do not follow world.root**: corridor.mirror
  flips geometry under the root but PointLights are created on the
  scene directly — the fix iterates `scene.lights`, negates
  `position.x` for `|x| > 0.01`, restores on cleanup. Any future
  root-space transform anomaly must handle lights the same way.
- **Desktop Chrome can starve probes**: the Devin browser's GPU
  process (SwiftShader) has been observed at 260%+ CPU for the whole
  session — if probes stall while nothing else runs, check
  `top -bn1` and kill the gpu-process/chrome parent, not vite.
- **Stoppable loop-audio pattern**: `startDialTone(pos)` pushes an
  updater into `ventUpdaters` and returns a stop fn that splices +
  ramps + stops oscillators — reuse for future sustained tones.

## Arc 8 notes (2026-10-09)

- rng API: `rng.chance(p)` / `rng.int` / `rng.range` / `rng.draw` — there is no `rng.bool` (src/game/state/rng.ts).
- Vestibule staff-door panels are `sdoor.north.panel` / `sdoor.south.panel` (registered, off the `dress.` merge prefix). To swing them ajar: `leaf.rotation.y = sx*π/2 - θ` and re-center to `x0 - sx·sin(θ)·half, z0 - half + cos(θ)·half` — the hinge pins at z0−0.42 for both walls.
- corridor.long: scene-level audio anchors must be rescaled manually (like lights in corridor.mirror) — `world.anchors.{clock,vend,troffers,vents,paHorns}` are NOT under world.root.

## Arc 9 notes (2026-10-10)

- **West-wall collider is segmented** (`wall.col.{sx}.{i}`): recess mouths need
  a gap in the spans list — the archives doorway got `[C.z0, ARCH_Z0] /
  [ARCH_Z1, BAY_Z0] / [BAY_Z1, C.z1]`. Missing this silently bricks entry even
  when every other collider is right (player corks at the wall plane).
- **Door frame must be rails, never a solid box** — a frame box filling the
  opening reads as a steel slab at glancing angle and makes the "room" a void.
  Header rail + two jamb boxes; the leaf collider (parented to the leaf) owns
  the doorway when shut.
- **Inward swing beats outward**: leaf `rotation.y = -OPEN_TH` with hinge at
  the north end (`pos.x = LEAF_X - sin(TH)*0.53`, `pos.z = LEAF_Z - 0.53 +
  cos(TH)*0.53`) sweeps the leaf into the room and leaves the mouth open.
  Swinging out corks the mouth diagonally at ~60°.
- `teleport` resets yaw — pass the 4th arg or look() AFTER teleporting,
  always (re-bitten this arc).
