# NIGHT AUDIT — Anomaly Catalog

Registry lives in `src/game/anomalies/` (definitions + modules). Selection:
seeded weighted bag, recent-history suppression, exclusion tags, chapter +
progression-range gates. Every anomaly must expose `testSeed` and run
through the deterministic validator (M3: `tools/validation/`).

Target ≥ 24 across six groups. ★ = implemented.

## Group A — object/property (6)

1. ★ `clock.reverse` — master clock hands sweep counter-clockwise at ~8×,
   tick audibly doubled. Moderate. Cue: motion + doubled tick. (slice)
2. `clock.wrong-face` — clock face numerals reorder. Subtle.
3. ★ `sign.flip` — junction totem's arrow points the wrong way; copy
   unchanged. Subtle. (slice)
4. ★ `slat.missing` — one of the bench's five seat slats vanishes.
   Subtle. (slice)
5. `prop.displaced` — fire cabinet relocates to opposite wall. Moderate.
6. `material.swap` — one wall panel renders as dark glass. Subtle.
7. ★ `poster.missing` — middle notice-board poster gone. Subtle. (slice)
8. ★ `cctv.gaze` — clinic-bend CCTV lens tracks the player in range.
   Subtle. (slice)

## Group B — spatial/architectural (5)

1. ★ `doorway.extra` — an extra open doorway with a lit room beyond on a
   wall that is solid in baseline. Unmistakable. Cue: sightline + light
   spill. (slice)
2. `hall.stretch` — corridor segment subtly lengthens (+4 m). Moderate.
3. `depth.mismatch` — a doorway's visible depth exceeds available space.
4. `sightline.impossible` — looking back, the airlock appears twice.
5. `vanish.misaligned` — perspective vanishing point offset (camera-space
   skew < 3 %). Subtle.
6. ★ `door.ajar` — right-wall service door slid a hand's width open, dark
   service void behind. Moderate. (slice)

## Group C — lighting/shadow (4)

1. `temp.drift` — one troffer zone migrates to 6500 K over ~20 s. Subtle.
2. `light.delay` — lights respond late to player passage (~1.5 s lag).
3. `shadow.sourceless` — a shadow with no caster crosses the floor.
4. `light.avoids` — one object stays lit while its zone dims. Moderate.
5. ★ `light.out` — clinic zone's fixture run dies outright, z 32–46 falls
   dark. Unmistakable. (slice)
6. ★ `light.flicker` — gallery zone strobes on a seeded irregular
   cadence. Moderate. (slice)

## Group D — sound-led (3)

1. ★ `footsteps.extra` — a second footstep cadence trailing the player's,
   offset ~0.4 s; stops when the player stops. Visual accessibility cue:
   faint condensation on the glass gallery in time with steps. Moderate.
   (slice)
2. `announce.spatial` — PA chime from a speaker that isn't there; caption
   direction mismatch. Subtle.
3. `machine.silence` — junction machinery goes silent only when unobserved;
   resumes on look-away. Moderate. Cue: audio + subtle status lamp.
4. ★ `machine.rattle` — junction machine over-revs into a fast low rattle.
   Moderate. (slice)

## Group E — character/creature (3, all original designs)

1. ★ `watcher.far` — motionless dark figure at the junction end; gone
   (with a single soft step) by the time you reach z≈43. Unmistakable.
   (slice)
2. `counter.worker` — a hand-only silhouette slides paperwork under the
   shuttered counter. Moderate.
3. `gaze.shift` — pictogram figures' facing changes between loops. Subtle.

## Group F — systemic (3)

1. `memory.persist` — a harmless detail the player "logged" persists when
   it should have reset (cross-loop memory signature).
2. `ui.disagree` — the airlock terminal shows last loop's judgment wrong.
3. `route.reacts` — the corridor repeats a sound the player made last loop
   (e.g. their knock on glass).
4. ★ `air.haze` — fog density roughly doubles, hemi drops a notch; the far
   end stops resolving. Moderate. (slice)
5. ★ `terminal.notice` — a handbill on the south airlock terminal
   misdirects inspectors to the north point. Subtle. (slice)

Slice count: **14 implemented** of 24 target.

Balance: ≥⅓ subtle, ⅓ moderate, ⅓ unmistakable/threatening. ≤2 major
shocks per first run. Every sound-led anomaly carries a visual cue path.
