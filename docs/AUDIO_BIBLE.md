# NIGHT AUDIT — Audio Bible

## Role

Sound is a mechanic, not garnish: the genre demands memorizing an
environment, and several anomalies are sound-led. All meaningful sounds
have captions + optional direction indicators (accessibility).

## Bus graph

`master` → `ambience`, `footsteps`, `machinery`, `voices`, `anomaly`, `ui`
(each with gain, later ducking: `anomaly` sidechains `ambience` −4 dB).

## Baseline bed (all procedural in M1 — no external samples)

- HVAC: filtered brown noise, slow LFO on cutoff; location-attached vents
- Electrical: 120 Hz fluorescent hum at troffer rows, ±flutter
- Structure: rare distant low rumble (city), randomized 45–120 s intervals
- Footsteps: filtered noise bursts, surface-variant (terrazzo click vs
  vestibule mat thud), speed-synced from the controller — never a looped
  track, so players hear _their own_ cadence (and notice when it isn't)
- Clock: faint mechanical tick near the master clock
- Airlock cycle: servo + pressure seals on loop transitions

## Spatialization

Positional emitters on vents, troffers, clock, glass gallery hum, junction
machinery; distance rolloff + occlusion low-pass approximation across
closed shutters. Anomaly audio (e.g. extra footstep cadence, spatially
inconsistent announcement) emits from physically plausible positions.

## Rules

- No autoplay before a user gesture: start screen unlocks the audio engine.
- Original or properly licensed only (M1 is 100 % synthesized — see
  ATTRIBUTION.md).
- Reduced-flash/motion settings also offer "reduced startling audio"
  (softens anomaly stingers, keeps informational cues).
