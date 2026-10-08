# ATTRIBUTION

NIGHT AUDIT uses **zero external art, audio, text, or code assets** beyond
its declared runtime dependencies. Everything the player sees and hears in
M1 is generated at runtime:

- **Visuals**: all geometry is procedural meshes; all textures are
  `DynamicTexture` canvases drawn by `src/world/generation/textures.ts`
  (terrazzo, panels, signage, clock, posters — all original fictional
  copy in `src/data/signage.ts`).
- **Audio**: all sound is synthesized WebAudio in
  `src/audio/audioSystem.ts` (noise-burst footsteps, HVAC bed, hum,
  rumble, chimes). No samples.
- **Fiction**: Alder City / Civic Works Authority / Route Integrity
  Division are original. No real transit signage, pictograms, brands, or
  copy from any game.

## Design boundary

Genre inspiration only — observe a repeating place, detect changes, commit
to continue/retreat. NIGHT AUDIT does not copy any commercial game's title,
setting, layout, signs, posters, NPCs, anomaly list, sounds, text, UI,
models, textures, code, or branding.

## Runtime dependencies (npm, MIT unless noted)

- `@babylonjs/core`, `@babylonjs/loaders` — Apache-2.0. Bundled glslang /
  twgsl wasm shipped inside that package is copied to `public/webgpu/` for
  offline WebGPU shader translation.
- `vite`, `typescript`, `vitest`, `playwright`, `eslint`,
  `typescript-eslint`, `prettier` — dev tooling.

When third-party assets land (M2+), each entry goes here with source,
license, and the file paths it ships under. Unverifiable license = rejected.
