# NIGHT AUDIT — Game Design

## Logline

You are the night-shift **Route Integrity Inspector** for the Alder City
Civic Works Authority. Your job is to walk **Inspection Loop 7** — a
municipal concourse that only exists to be checked — and file each pass:
**route clear** or **divergence logged**. The building changes when the
lights are low. Your logbook is the only thing that remembers the truth.

## Core loop

1. Spawn in the **North Airlock** of Loop 7. The concourse ahead is a fixed,
   learnable route (~55 m): entry vestibule → records wall → observation
   gallery → clinic intake → service junction → **South Airlock**.
2. Observe. Compare against memorized baseline (and your field log).
3. Commit:
   - **Proceed** through the South Airlock = file _route clear_.
   - **Retreat** through the North Airlock = file _divergence logged_.
     Crossing an airlock's inner line locks the judgment; confirmation plays
     only after the lock.
4. Judgment resolves: correct raises the **Stability Index**, wrong lowers
   it. The airlock cycles and a new loop begins (same corridor, new
   baseline roll).

Stability: start 40. Correct +12 (chapter-weighted). Wrong −18 and a
chapter-scaled consequence (early: stability loss only; later: escalation,
chapter reset). Reaching 100 completes the route (standard ending);
dangerous anomalies can hard-reset only when clearly telegraphed.

Fairness contract: every anomaly is detectable before either commit line by
≥1 visual or auditory cue. No random guessing. Adaptive selection picks
difficulty _bands_ before a loop starts and never mutates mid-loop.

## Chapters (M3+)

1. **Calibration** — teaches baseline + binary rule. 35–50 % anomaly rate.
2. **Contamination** — paired minor changes, moving anomalies, env story.
3. **Protocol Failure** — rare rule modifiers (protocol exceptions),
   cross-loop memory, finale shaped by prior observations.

## Systems

- **Anomaly framework** — data-driven modules with id, chapter, category,
  rarity, progression range, required baseline nodes, exclusion tags,
  activation/cleanup hooks, detectability spec, threat/failure rule,
  audio/light/post deltas, accessibility fallbacks, test seed. Seeded
  weighted-bag selection with recent-history suppression and impossible-
  combination pruning. Full catalog plan: docs/ANOMALY_CATALOG.md.
- **Cross-loop memory** — selected harmless details persist between loops,
  making players doubt whether a change is anomaly or consequence.
- **Evidence archive** — optional discoveries unlock diegetic documents;
  finding enough across runs unlocks the investigative ending.
- **Modes** — Inspection (campaign), Practice (category filters, no
  progression loss), Daily Route (date-seeded, offline), Custom Seed.
- **Saves** — localStorage schema v1: settings, progression, discoveries,
  best results, daily history, accessibility choices. Versioned migrations;
  corrupt blobs quarantine + reset with confirmation.

## UX contract

- HUD nearly diegetic: stability shown on the airlock wall terminal at loop
  transitions; optional minimal overlay in accessibility settings.
- Start screen captures input to unlock audio (no autoplay before gesture).
- Pause, settings (video/motion/audio/controls/accessibility), controls
  remap, evidence archive, catalog (post-first-completion), results.
- Keyboard-navigable menus; remappable controls; gamepad later (M3).
- Teen-friendly dread: ≤2 major shocks in a first run; recognition over
  jumpscares; no graphic violence.

## Fiction (all original — never copy real transit/game signage)

City: **Alder City**. Authority: **Civic Works Authority (CWA)**, Route
Integrity Division. Player-facing role: **Inspector (badge N-117)**.
Loop 7 fixtures: Records Wall, Public Counter (shuttered), Observation
Gallery (dark glass), Clinic Intake B (closed 22:00–06:00), Service
Junction S-2, analog "master" clock, AED/first-aid cabinet, wayfinding
totems ("ARCHIVES →", "SERVICE JUNCTION S-2", "LIFT LOBBY"), inspection
terminal at each airlock. Copy lives in `src/data/signage.ts`.
