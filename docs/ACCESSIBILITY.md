# Accessibility audit

What EXIT 8 ships for accessibility, verified against the code —
not aspirational.

## Controls & input

- **Pointer-lock fallback**: movement/look keys work without pointer
  lock (e2e `boot.spec.ts` covers this).
- **Keyboard-only menus**: start/pause/settings/results reachable and
  operable by keyboard (e2e `boot.spec.ts`).
- **Gamepad**: left stick move, right stick look, start = pause
  (e2e `gamepad.spec.ts`).
- **Remappable-feel settings**: mouse sensitivity ×0.2–3, FOV 60–100.

## Motion & photosensitivity

- **Reduced-motion setting** (`settings.accessibility.reducedMotion`):
  disables head bob and softens camera-follow motion.
- **Flicker budget**: `light.flicker` (the only strobe-class anomaly)
  uses seeded spans ≥ 0.17 s, so a full off+on cycle never exceeds
  ~3 flashes/s — the WCAG photosensitive-seizure threshold.

## Audio → visual equivalents

- **Captions on by default** (`captions: true`): every directional or
  meaning-bearing sound emits a `CaptionEvent` rendered in the HUD —
  "footsteps — not yours", "vent groan", "PA chime", "distant rumble",
  "airlock cycling", "the corridor settles".
- **Direction indicators**: captions carry `left | right | behind`
  arrows from the emitter's stereo position.
- **Per-sound-led-anomaly visual cue** is a design contract
  (`GAME_DESIGN.md`): no anomaly is audio-only.

## Readability

- HUD stability is numeric **and** a bar — not color-only.
- Route log / missed-divergence report names each anomaly by display
  name and chapter; errors render in `--bad` red on near-black panels
  (amber `#d8a24a` family accents on `#101013`-dark UI).
- All UI text is real DOM text (not baked into textures), so browser
  zoom and OS text scaling apply to screens.

## Known limits (honest list)

- Audio is required for full parity on a few cues — captions cover
  them, but the _atmosphere_ of sound design isn't translatable.
- Fine view adjustments on touch devices are coarser than mouse-look.
- No spoken/dialogue content, so no transcript is needed.
