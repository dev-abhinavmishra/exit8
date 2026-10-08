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
57. ★ `door.lit` — warm light leaks from the service room around the
    door's edge. Someone left a light on — or someone is in there.
    Moderate. (slice)
58. ★ `bucket.tipped` — the janitorial bucket is on its side, mop
    fallen across the floor, water pooled. Nobody heard it go over.
    Moderate. (slice)
59. ★ `cab.gone` — the fire point's red wall cabinet is not there. The
    sign, the extinguisher, the bracket shadow all remain. Subtle.
    (slice)
60. ★ `rad.leaks` — the heating convector is leaking: a puddle spreads
    under the valve end, a dark drip trail feeds it. Subtle. (slice)
61. ★ `locker.ajar` — one staff locker hangs open on its hinge, dark
    interior showing. Every door on the route was shut. Moderate.
    (slice)
62. ★ `exit.wrongway` — the green EXIT ROUTE sign's running figure and
    arrow now point back up the corridor, away from the inspection
    point. Subtle. (slice)
63. ★ `walker.faceless` — the other inspector walks his usual route,
    but his face is smooth skin. No eyes, no mouth — only the cap's
    shadow where a face should be. Moderate. (slice)
64. ★ `walker.crawl` — he still walks his route, but at a fifth of his
    pace with a slowed, heavy stride. He will not reach the end of the
    corridor this shift. Moderate. (slice)
65. ★ `sign.loop8` — the mid-route totem still hangs where it always
    does, but it reads INSPECTION LOOP 8. Subtle. (slice)
66. ★ `guide.short` — the tactile guide strip still runs south, but it
    stops metres short of the inspection-point doors. Moderate.
    (slice)
67. ★ `rad.gone` — the panel radiator on the east wall, the one you
    pass in the first quarter of the route, is simply not there.
    Subtle. (slice)
68. ★ `lockers.all` — not one locker but all four stand open on their
    hinges, dark interiors showing down the whole run. Moderate.
    (slice)
69. ★ `phone.gone` — the corridor phone on the east wall, handset and
    all, is simply not there. Subtle. (slice)
70. ★ `mop.gone` — the mop bucket that always leans by the west wall
    in the last stretch is simply not there. Subtle. (slice)
71. ★ `poster.dup` — two spots on the notice row carry the same
    poster. Not swapped, not missing — duplicated. Subtle. (slice)
72. ★ `exit.dark` — the green EXIT ROUTE sign still hangs in the last
    stretch, but its lamp is dead: the letters don't glow. Subtle.
    (slice)
73. ★ `fountain.gone` — the drinking fountain by the east wall is
    simply not there. Bare panels where the basin stood. Subtle.
    (slice)
74. ★ `poster.tilted` — one poster in the notice row hangs crooked in
    its frame, leaned a few degrees off level. Subtle. (slice)
75. ★ `hatch.gone` — the maintenance hatch plate on the east wall is
    not there — painted-over wall where the access panel was. Subtle.
    (slice)
76. ★ `guide.red` — the tactile guide strip still runs the full
    corridor, but the amber bars run red. Subtle. (slice)
77. ★ `dir.gone` — the ROUTE DIRECTORY wall sign over the radiator is
    simply not there. Subtle. (slice)
78. ★ `machine.dead` — the status lamp on the junction machine is out;
    the unit still hums but its eye is dark. Subtle. (slice)
79. ★ `bench.gone` — the mid-corridor bench is simply not there. The
    wall run where it sat is bare. Moderate. (slice)
80. ★ `totem.gone` — the mid-route hanging totem is simply not there;
    the empty rod hangs over bare corridor. Moderate. (slice)
81. ★ `arrows.gone` — every route decal ground into the terrazzo is
    gone; the floor carries no marks at all. Subtle. (slice)
82. ★ `cctv.drooped` — one dome camera hangs tilted straight down,
    dead. The other three still sweep. Subtle. (slice)
83. ★ `phone.lit` — the corridor phone's LINE lamp, dead since your
    first shift, glows a dull red. Subtle. (slice)
84. ★ `exit.sign.gone` — the overhead sign over the south airlock
    doors is simply not there; the door that decides your run goes
    unmarked. Moderate. (slice)
85. ★ `intake.gone` — the NORTH INTAKE sign over the spawn stretch is
    simply not there; bare wall where the branding panel hung.
    Subtle. (slice)
86. ★ `bell.gone` — the service bell on the clinic counter is simply
    not there. Subtle. (slice)
87. ★ `notice.gone` — the NOTICE sign overhead inside the north
    airlock is simply not there. Subtle. (slice)
88. ★ `light.red` — one zone's point light turns a deep red and its
    troffers burn blood-lit. The corridor stretch you know is the
    color of a warning lamp. Unmistakable. (slice)
89. ★ `walker.fast` — the inspector walks his route at nearly twice
    his usual pace; same path, same stride shape, wrong speed.
    Subtle. (slice)
90. ★ `ceiling.crack` — a hairline fracture has crawled across the
    ceiling tiles overhead, a jagged dark vein between the troffers.
    Subtle. (slice)
91. ★ `floor.flood` — one zone's floor is under still black water, a
    dark mirrored sheet where the terrazzo and guide strip should
    be. Unmistakable. (slice)
92. ★ `walker.charge` — the inspector breaks off his route and sprints
    down his lane to a step behind you, then holds at your shoulder.
    Unmistakable. (slice)
93. ★ `poster.hollow` — Inspector Vance's staff portrait stares back
    with two void sockets where his eyes were. Subtle. (slice)
94. ★ `troffer.falls` — one ceiling light panel has broken loose and
    hangs tilted into the corridor, still burning, swaying on its
    dead edge. Subtle. (slice)
95. ★ `walker.wait` — the inspector is not on his route; he stands at
    the south airlock mouth, squared up the corridor, waiting on the
    threshold you have to pass. Unmistakable. (slice)
96. ★ `doors.open` — the south airlock doors stand already parted when
    you arrive; the cycle ran without you. Unmistakable. (slice)
97. ★ `fountain.blood` — the drinking fountain runs dark and rust-red;
    the basin face and a floor spill are wet gloss, not water.
    Unmistakable. (slice)
98. ★ `phone.rings` — the dead internal handset rings by itself, a
    warbling double-burst trill, LINE lamp blinking red in time.
    Unmistakable. (slice)
99. ★ `poster.grin` — Inspector Vance's engraved smile widens past
    where a mouth should reach, teeth catching the light. Subtle.
    (slice)
100. ★ `vend.empty` — the cold dispense unit stays lit and humming,
     but every shelf behind the glass is bare; OUT OF STOCK — CWA.
     Moderate. (slice)
101. ★ `pitch.sags` — the junction machinery thrum drifts flat over
     the loop, a slow quarter-tone sag that never resolves. Subtle.
     (slice)
102. ★ `ceiling.weeps` — a ceiling seam drips onto the walk line,
     plink by plink, a wet circle spreading on the terrazzo. Moderate.
     (slice)
103. ★ `poster.watches` — Inspector Vance's engraved face gains real
     eyes whose pupils slide to follow you down the corridor.
     Moderate. (slice)
104. ★ `sign.mirror` — the mid-route INSPECTION LOOP 7 totem reads
     backwards, every glyph mirrored, arrow reversed. Moderate.
     (slice)
105. ★ `doors.slam` — the south leaves part for your commit walk, then
     crash shut in your face, hold a breath, and open again.
     Unmistakable. (slice)
106. ★ `gallery.occupied` — a dark figure sits at the monitor desk
     behind the observation glass, facing the corridor. Moderate.
     (slice)
107. ★ `walker.midstep` — the inspector is frozen mid-stride, legs
     split and arms mid-swing, facing his direction of travel. Subtle.
     (slice)
108. ★ `hatch.knocks` — a soft knock-knock comes through the always-shut
     service hatch while you stand near it, the plate shuddering.
     Moderate. (slice)
109. ★ `map.wrong` — the route map's YOU ARE HERE marker points at a
     different stop; the LOOP 7 schematic is otherwise identical.
     Moderate. (slice)
110. ★ `blinds.open` — the venetian blind always drawn over one gallery
     bay is open; that stretch reads the room like every other bay.
     Subtle. (slice)
111. ★ `rota.stamped` — the duty board carries a big red UNDER REVIEW
     stamp across the staffing table where only the amber AUDITED mark
     belongs. Moderate. (slice)
112. ★ `sheets.added` — the notice board's five typed memos have become
     six, the fresh sheet slightly crooked among them. Subtle. (slice)
113. ★ `terminal.advisory` — a beat into the loop the airlock terminals
     print a row the paperwork never issues: ADVISORY — LOOK BEHIND
     YOU / COUNT AGAIN / NOT YOUR LOOP. Unmistakable. (slice)
114. ★ `hatch.scratched` — fresh score marks radiate from under the
     sealed hatch's rim onto the wall panels; nothing opened it —
     something tried to. Moderate. (slice)
115. ★ `shadow.figure` — a person's shadow stands on the east wall,
     cast long toward the floor by nobody and nothing. Unmistakable
     once seen. (slice)
116. ★ `figure.corridor` — a dark figure stands mid-route, squared on
     the center line; close the distance and it is simply gone.
     Unmistakable while it lasts. (slice)
117. `bench.flipped` — the west-wall bench lies overturned: seat face
     to the floor, legs in the air. Moderate. (slice)

118. ★ `walker.hum` — the other inspector is whistling: a loose, slightly
     off-key tune wanders his route with him, phrases resting between.
     You hear it before you see him. Unmistakable. (slice)

119. ★ `figure.wall` — a dark figure stands at the east wall, nose to the
     panels, arms at its sides; it does not move while watched, but once
     you have walked well past it the next glance back finds it turned
     to face up-corridor. Unmistakable. (slice)

120. ★ `rats.scurry` — once, as you come up on it, a rat sprints wall to
     wall ahead of you; no sound, gone in under a second, easy to doubt
     you saw anything at all. Subtle. (slice)

121. ★ `draft.sheet` — a lone paper sheet on open terrazzo slides half a
     metre in a draft that touches nothing else; the scrape gives it
     away if you are close enough to hear. Subtle. (slice)
122. `pa.deadair` — a PA horn keys up on dead air: relay click, the
     carrier hiss held a beat, click off. No announcement follows.
     Moderate. (slice)
123. `glass.hands` — handprints pressed into the observation glass's
     condensation sheen from inside; one sharp at shoulder height, one
     dragged and streaked. Moderate. (slice)
124. `vent.sigh` — a high wall grille exhales once, a low airy swell
     rising and dying over seconds, pitch sagging as the breath runs
     out. The ductwork breathes. Subtle. (slice)
125. `duct.clang` — somewhere far down the system metal strikes metal:
     one hard snap and a long dull ring down the ducts. Sound-only.
     Moderate. (slice)
126. `cable.hangs` — a cable is down from the ceiling tray in a loose J,
     swaying like it parted a moment ago. Nothing else in the corridor
     hangs. Moderate. (slice)
127. `jacket.drapes` — a work jacket lies folded over the mid-corridor
     bench, collar roll up, one sleeve hanging off the edge. Nobody
     sits here on this route. Moderate. (slice)
128. `shaft.gone` — one troffer keeps burning but its light shaft
     never falls; the air under it is empty. The inverse of
     shaft.glow. Subtle. (slice)
129. `walker.eyeless` — the inspector patrols on schedule, face intact,
     but where his eyes should sit there are only hollow sockets.
     Worse than faceless: the face is all there, the eyes are the only
     thing missing. Subtle. (slice)
130. `shadow.moves` — the figure-shadow on the east wall, cast by
     nobody, and this one drifts: a slow half-metre slide and faint
     lean over half a minute. You catch it on the second glance.
     Moderate. (slice)
131. `lights.buzz` — one troffer's ballast starts chattering: a mains
     hum with a slow flutter, looped until judgment. The light is
     fine; the sound is wrong. Moderate. (slice)
132. `mop.bucket` — a mop leaning against the west wall and a bucket
     at its base, abandoned mid-shift. Nobody cleans this loop.
     Moderate. (slice)
133. `counter.bell` — the service bell on the clinic counter rings
     once, on its own, and sways for a second after. Nobody is at the
     counter to press it. Moderate. (slice)
134. `records.voice` — pages turn behind the records bank: four soft,
     irregular rustles as if someone works the archive on the far
     side of the cabinets. There is no far side. Subtle. (slice)
135. `door.rattle` — the sealed service door shakes once in its
     frame: three quick thuds, the latch chattering, the leaf
     juddering. Something pushed from the other side. Moderate.
     (slice)

Slice count: **196 implemented — the full catalog**. New hooks:
`audio.playKnock(pos)`; `drawRouteMap(t, hereStop)`, `drawRotaBoard(t, stamped)`;
`audio.setMachineGainScale(fn)`, `audio.playChime(pos)`,
`audio.playGroan(pos)`, `audio.playDrip(pos)`, `audio.setMachinePitch(fn)`, `audio.playSlam(pos)`, `audio.playWhistle(pos, freq, dur)`, `audio.playScrape(pos)`,
`audio.playPaDeadAir(pos)`; `drawClockFace(t, numerals?)`, `drawSign(t, spec)`,
`drawPoster(t, def)` + `POSTER_DEFS`.

Balance: per-loop exposure aims for roughly thirds across subtle /
moderate / unmistakable — enforced by weights, not catalog counts (the
catalog is quiet-first by design: 15 subtle / 12 moderate / 4
unmistakable at 31 defs). ≤2 major shocks per first run. Every
sound-led anomaly carries a visual cue path.
