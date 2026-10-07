# NIGHT AUDIT — Anomaly Catalog

Registry lives in `src/game/anomalies/` (definitions + modules). Selection:
seeded weighted bag, recent-history suppression, exclusion tags, chapter +
progression-range gates. Every anomaly must expose `testSeed` and run
through the deterministic validator (M3: `tools/validation/`).

Target ≥ 24 across six groups. ★ = implemented.

## Group A — object/property (6)

1. ★ `clock.reverse` — master clock hands sweep counter-clockwise at ~8×,
   tick audibly doubled. Moderate. Cue: motion + doubled tick. (slice)
2. ★ `clock.wrong-face` — two numerals trade places (seeded pair). Subtle.
   (slice)
3. ★ `sign.flip` — junction totem's arrow points the wrong way; copy
   unchanged. Subtle. (slice)
4. ★ `slat.missing` — one of the bench's five seat slats vanishes.
   Subtle. (slice)
5. ★ `prop.displaced` — fire cabinet relocates to the opposite wall.
   Moderate. (slice)
6. ★ `material.swap` — first poster renders as black glass. Subtle. (slice)
7. ★ `poster.missing` — middle notice-board poster gone. Subtle. (slice)
8. ★ `cctv.gaze` — clinic-bend CCTV lens tracks the player in range.
   Subtle. (slice)
9. ★ `poster.changed` — REPORT DRIFT poster's copy is rewritten. Subtle.
   (slice)
10. ★ `cctv.sleeps` — clinic-bend camera's red lens is dead. Subtle. (slice)
11. ★ `stripe.wrong` — south commit stripe glows red, not amber. Subtle.
    (slice)
12. ★ `lift.arrives` — the out-of-service lift wakes: call lamp lit,
    leaves open a hand's width onto a dark shaft, a chime sounds.
    Moderate. (slice)

## Group B — spatial/architectural (5)

1. ★ `doorway.extra` — an extra open doorway with a lit room beyond on a
   wall that is solid in baseline. Unmistakable. Cue: sightline + light
   spill. (slice)
2. `hall.stretch` — corridor segment subtly lengthens (+4 m). Moderate.
3. ★ `depth.mismatch` — a service door at z≈46 opens onto a gallery
   ~12 m deep inside a 12 cm wall. Unmistakable. (slice)
4. ★ `sightline.impossible` — a second airlock, sealed and signed, walls
   the corridor at z≈38 where it always continued. Unmistakable. (slice)
5. `vanish.misaligned` — perspective vanishing point offset (camera-space
   skew < 3 %). Subtle.
6. ★ `door.ajar` — right-wall service door hinged open, dark
   service void behind. Moderate. (slice)
7. ★ `door.breathes` — service leaf presses a few cm out and settles on a
   long uneven rhythm. Subtle. (slice)

## Group C — lighting/shadow (4)

1. ★ `temp.drift` — gallery zone migrates ~3500 K → ~6500 K over ~20 s.
   Subtle. (slice)
2. ★ `light.delay` — lights respond late to player passage (~1.5 s lag);
   the zone you just left drops dark after you cross. Moderate. (slice)
3. ★ `shadow.sourceless` — a soft shadow blob sweeps the clinic floor,
   no caster. Moderate. (slice)
4. ★ `light.avoids` — one gallery troffer sits dark in a lit run. Subtle.
   (slice)
5. ★ `light.out` — clinic zone's fixture run dies outright, z 32–46 falls
   dark. Unmistakable. (slice)
6. ★ `light.flicker` — gallery zone strobes on a seeded irregular
   cadence. Moderate. (slice)

Also: ★ `totem.sways` — junction totem swings gently on its hangers
(object group). ★ `clock.spins` — clock hands whirl forward
(object group).

## Group D — sound-led (3)

1. ★ `footsteps.extra` — a second footstep cadence trailing the player's,
   offset ~0.4 s; stops when the player stops. Visual accessibility cue:
   faint condensation on the glass gallery in time with steps. Moderate.
   (slice)
2. ★ `announce.spatial` — two-tone PA chime from above the gallery where
   no speaker exists; seeded 30–60 s cadence. Subtle. (slice)
3. ★ `machine.silence` — junction hum sounds only while the machine is
   inside ~40° of view; face away and it isn't running. Moderate. (slice)
4. ★ `machine.rattle` — junction machine over-revs into a fast low rattle.
   Moderate. (slice)
5. ★ `footsteps.ahead` — your step is repeated ~0.9 s later from ~5 m in
   FRONT of you. Moderate. (slice)
6. ★ `vent.groan` — gallery vent exhales a pressure groan when you pass
   within ~4 m. Moderate. (slice)

## Group E — character/creature (5, all original designs)

1. ★ `watcher.far` — motionless dark figure at the junction end; gone
   (with a single soft step) by the time you reach z≈45. Unmistakable.
   (slice)
2. ★ `counter.worker` — a dark hand slides a paper slip out from under
   the clinic shutter, holds, withdraws. Moderate. (slice)
3. ★ `walker.backwards` — the other inspector keeps his route and pace
   but faces away from travel — he moonwalks the loop. Moderate.
4. ★ `walker.stare` — the other inspector has stopped mid-corridor,
   squared up toward your approach, dead still the whole loop. Moderate.
5. ★ `walker.absent` — he simply isn't there this loop. Subtle —
   you have to have learned he's always there.
6. ★ `poster.swapped` — two notice-board posters trade artwork. Subtle.
7. ★ `sign.drift` — a big wall sign has slid half a metre and cants.
   Subtle.
8. ★ `gaze.shift` — the walking pictogram on the south inspection sign
   turns around and walks back up the corridor, against its arrow.
   Subtle. (slice)

## Group F — systemic (3)

1. ★ `memory.persist` — a scatter detail placed last loop returns at the
   exact same spot while everything else re-dresses. Subtle. (slice)
2. `ui.disagree` — superseded by `terminal.glitch` (the terminals lie
   about your last filing) — dropped as a separate def.
   ★ `pace.dissolves` — the corridor hasn't stretched; your pace bleeds
   to ~55 % in the mid-span (z 16–48) and your own footstep cadence
   drags with it. The loop takes longer than it ever has. Moderate.
   (slice)
3. ★ `route.reacts` — after 2.6s of stillness the corridor replays your
   last few footsteps at your own cadence, from where you took them.
   Moderate. (slice)
4. ★ `air.haze` — fog density roughly doubles, hemi drops a notch; the far
   end stops resolving. Moderate. (slice)
5. ★ `terminal.notice` — a handbill on the south airlock terminal
   misdirects inspectors to the north point. Subtle. (slice)
6. ★ `fire.open` — the fire cabinet's dark-glass window is gone; the
   cabinet stands open on its bare red face. Subtle. (slice)
7. ★ `terminal.glitch` — both airlock terminals briefly insist a
   divergence was filed and stability reads 0. Subtle. (slice)
8. ★ `guide.missing` — a run of the tactile guide strip is absent mid-
   corridor: the amber channel breaks for six metres and resumes.
   Moderate. (slice)
9. ★ `guide.misaligned` — three adjacent strip segments yaw out of
   true: the amber line jogs mid-run then straightens. Unmistakable.
   (slice)
10. ★ `shaft.glow` — one troffer panel goes dark while the light shaft
    it poured keeps hanging under it. Subtle. (slice)

Slice count: **49 implemented** — past the 24 target. New hooks:
`audio.setMachineGainScale(fn)`, `audio.playChime(pos)`,
`audio.playGroan(pos)`; `drawClockFace(t, numerals?)`, `drawSign(t, spec)`,
`drawPoster(t, def)` + `POSTER_DEFS`.

Balance: per-loop exposure aims for roughly thirds across subtle /
moderate / unmistakable — enforced by weights, not catalog counts (the
catalog is quiet-first by design: 15 subtle / 12 moderate / 4
unmistakable at 31 defs). ≤2 major shocks per first run. Every
sound-led anomaly carries a visual cue path.
