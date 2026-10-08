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
2. ★ `hall.stretch` — the south airlock has slid four metres back;
   the corridor continues four unlit metres past the last troffer.
   Unmistakable. (slice)
3. ★ `depth.mismatch` — a service door at z≈46 opens onto a gallery
   ~12 m deep inside a 12 cm wall. Unmistakable. (slice)
4. ★ `sightline.impossible` — a second airlock, sealed and signed, walls
   the corridor at z≈38 where it always continued. Unmistakable. (slice)
5. ★ `vanish.misaligned` — the frame rolls a fraction of a degree off
   level and the corridor's depth breathes on incommensurate cycles,
   always inside 3 %. Subtle. (slice)
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
11. ★ `watcher.follows` — a figure stands in the north airlock behind
    you at loop start; it gains ~1.4 m/s only while unobserved (soft
    dragging steps), freezes under gaze, yields like watcher.far if
    you retreat past it inside the corridor. Unmistakable. (slice)
12. ★ `posters.mirror` — every poster on the board flips horizontally:
    same paper, same order, every word backwards. Subtle. (slice)
13. ★ `clock.missing` — the master clock is simply gone: face, rim,
    hands, all of it. Moderate. (slice)
14. ★ `bin.wanders` — the service bin at the south end sits a stride
    into the walkway, a metre off its wall berth. Moderate. (slice)
15. ★ `notice.amends` — the NOTICE board above the north inner door now
    reads "INSPECTIONS SUSPENDED UNTIL FURTHER NOTICE". Same paper,
    same type — only the bulletin changed. Subtle. (slice)
16. ★ `bench.moved` — the mid-corridor bench has been dragged nearly a
    metre into the left walkway. Moderate. (slice)
17. ★ `airlock.breach` — the steel cap sealing the north end is gone;
    where a blank wall closed the loop, an unlit concrete throat runs
    three metres past the survey line and stops dead. One distant point
    of light. Only visible from inside the north airlock looking back —
    the groan fires when you step across the missing threshold.
    Unmistakable. (slice)
18. ★ `tracks.wet` — footprints print themselves onto the terrazzo one
    step at a time, marching down-corridor with nobody making them;
    each lands with a wet squelch. Unmistakable. (slice)
19. ★ `chalk.marks` — tally gates scratched into the west panels past
    the records bank, counting something nobody will name. Subtle.
    (slice)
20. ★ `figure.south` — when the south doors part for the commit
    approach, a dark figure stands dead centre in the airlock beyond
    the threshold — the judgment resolves before you reach it.
    Unmistakable. (slice)
21. ★ `cctv.all` — every dome in the corridor tracks you at once; they
    hand you off down the line as you walk. Unmistakable. (slice)
22. ★ `guide.cross` — the tactile guide strip jumps the corridor:
    right-of-centre south of the junction, LEFT of centre north of it.
    Moderate. (slice)
23. ★ `shutter.ajar` — the clinic shutter sits a hand's width off the
    counter; the gap beneath shows only dark. Moderate. (slice)
24. ★ `records.breach` — one records drawer gapes open, proud of the
    cabinet face, hollow and unlit inside. Subtle. (slice)
25. ★ `gallery.frost` — the observation glass has gone blind: panes
    fogged solid, nothing on the other side to see. Moderate. (slice)
26. ★ `door.stuck` — the south inner doors part for the approach, but
    only the left leaf travels; the right is dead to the motor.
    Unmistakable. (slice)
27. ★ `walker.crowd` — there are two of him: a second inspector walks
    the same route in the left lane from the far end. Unmistakable.
    (slice)
28. ★ `light.follows` — the corridor only keeps light where you stand;
    every zone you leave dies behind you. Unmistakable. (slice)
29. ★ `glass.eyes` — a dim shape paces the observation gallery behind
    the glass; nobody has gallery access on this shift. Moderate.
    (slice)
30. ★ `sign.wrongway` — the junction sign's arrow flips to point at a
    lift lobby that isn't there. Subtle. (slice)
31. ★ `terminal.black` — both airlock judgment terminals are dead
    unlit glass. Moderate. (slice)
32. ★ `bin.flipped` — the service bin lies knocked on its side, slid
    from its spot. Subtle. (slice)
33. ★ `hatch.open` — a service hatch stands open in the east wall,
    door ajar, revealing an unlit maintenance void. Moderate. (slice)
34. ★ `strip.grows` — the tactile guide strip continues through the
    north airlock to the cap; the line leads somewhere it never led.
    Subtle. (slice)
35. ★ `mullion.extra` — a sixth steel mullion stands mid-bay where
    there were always five. Subtle. (slice)
36. ★ `glass.writing` — a word is fingered into the condensation on
    the observation glass, written from the corridor side.
    Unmistakable. (slice)
37. ★ `totem.reversed` — the hanging totem has been turned around;
    its face reads only to the records wall. Moderate. (slice)
38. ★ `door.slow` — the south inner doors still open, but they crawl
    fourteen seconds where there used to be two. Subtle. (slice)
39. ★ `cabinet.rows` — the whole records bank gapes: every drawer
    mouth open at a different depth, all dark. Unmistakable. (slice)
40. ★ `mullion.missing` — one upright in the glass run is gone;
    twelve metres of unsupported glazing. Subtle. (slice)
41. ★ `gallery.lit` — the observation room behind the dark glass has
    its lights on; an empty lit office watching the corridor.
    Moderate. (slice)
42. ★ `lift.calls` — the dead lift is being called: lamp burning,
    chime answering, leaves shut. Moderate. (slice)
43. ★ `bench.sit` — someone is sitting on the waiting bench, facing
    the records wall. Unmistakable. (slice)
44. ★ `stain.spread` — a spill has crept out from under the records
    wall onto the terrazzo. Subtle. (slice)
45. ★ `sign.ghost` — a hanging sign you have never read hangs
    mid-corridor, in perfect institutional lettering. Unmistakable.
    (slice)
46. ★ `arrow.points` — one worn route decal is re-painted to point
    north. Only wrong if you remember it was right. Subtle. (slice)
47. ★ `bayplate.gone` — one of the six records-bank bay plates is
    simply not there. Subtle. (slice)
48. ★ `vent.slats` — every louvre in one ceiling grille is gone; a
    bare dark slot. Look up. Subtle. (slice)
49. ★ `ext.missing` — the extinguisher beside the fire point is gone;
    the cabinet, sign, and bracket shadow all remain. Subtle. (slice)
50. ★ `vend.dead` — the cold-dispense unit's lit face is dark: no brand
    band, no product rows, no hum. Unmistakable. (slice)
51. ★ `sheets.cleared` — every memo on the notice board is gone; bare
    cork, pins and all. Subtle. (slice)
52. ★ `aid.gone` — the first-aid cabinet before the lift lobby is not
    there; blank wall where the green cross used to be. Subtle. (slice)
53. ★ `phone.offhook` — the corridor phone's handset is off the cradle,
    dangling by its cord. Nobody hung it up. Subtle. (slice)
54. ★ `fountain.runs` — the drinking fountain runs by itself: bubbler
    raised, water column standing, pools in the basin and on the floor.
    Moderate. (slice)
55. ★ `panel.open` — the breaker panel on the west wall hangs open on
    its hinge, dark bus and breaker rows inside. It was shut. Subtle.
    (slice)
56. ★ `pilot.dead` — the amber pilot lamp beside the south airlock
    mouth is out; an empty socket where the route-open light was.
    Subtle. (slice)

Slice count: **97 implemented — the full catalog**. New hooks:
`audio.setMachineGainScale(fn)`, `audio.playChime(pos)`,
`audio.playGroan(pos)`; `drawClockFace(t, numerals?)`, `drawSign(t, spec)`,
`drawPoster(t, def)` + `POSTER_DEFS`.

Balance: per-loop exposure aims for roughly thirds across subtle /
moderate / unmistakable — enforced by weights, not catalog counts (the
catalog is quiet-first by design: 15 subtle / 12 moderate / 4
unmistakable at 31 defs). ≤2 major shocks per first run. Every
sound-led anomaly carries a visual cue path.
