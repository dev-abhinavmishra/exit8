# EXIT 8 — Art Bible

## Identity

Sterile late-night municipal interior: immaculate, empty, over-lit in the
wrong places. **Liminal civic dread** — a building maintained for a public
that never arrives.

## Palette

- Walls: off-white `E8E6DF` panels, subtle warm variance
- Floor: aged terrazzo — warm grey `9A958C` aggregate field, brass divider
  strips `8A7B4F`
- Metals: brushed stainless `B8BCBE`, dark anodized frames `3A3D40`
- Glass: smoked `10141A` (observation gallery), faint reflectance
- Wayfinding: restrained amber `E8A33D` + cyan `4FA8B8` on charcoal panels
- Accent intrusions (anomaly): desaturated arterial red `7A2226`, organic
  amber-green `6E6B3A`

## Lighting

- Baseline: cool-neutral troffer field ~4200 K, gently uneven (a few
  fixtures fractionally dimmer — baseline, not anomaly). Per-zone tint
  variation in `zoneDefs` — the clinic stretch runs subtly cooler,
  junction warmer; hemisphere ambient ~1.14 keeps mid-tones between
  light pools honest.
- Airlocks: warmer 3200 K pools, and a status dome over each inner
  door — amber sealed, teal open, pulsing mid-travel.
- Volumetrics: crossed-plane shafts under each troffer plus one
  corridor-wide points cloud of drifting dust motes (zone-coherent —
  a dead zone's motes die with its lamps).
- Procedural IBL: a painted 128px cubemap (troffer bars up-face, warm
  floor bounce down-face) feeds every `environmentIntensity` — metals
  and terrazzo hold their specular in dim zones.
- Anomaly lighting uses _changes_ (temperature drift, delayed response,
  shadow from nothing) — never full dark-outs as a default

## Geometry language

Modular kit on a 600 mm grid: 3.0 m ceilings, 3.6 m corridor width,
600×600 ceiling grid with recessed troffers, wall panels 1200 mm modules,
radius corners on counters, brushed-steel door frames, skirting + shadow
gap details. Everything reads manufactured and repeatable — anomalies
break that repetition.

## Procedural texture strategy

DynamicTexture-generated, zero external assets: terrazzo speckle +
brass strips, panel micro-noise, signage/pictograms (original fictional
copy from `src/data/signage.ts`), clock face, emissive troffer louver
faces (scale ~0.62 — higher washes the fin detail to white). Height-
field→Sobel normal maps (`normalsFromHeight`) on wall panels, terrazzo,
shutter, and ceiling tile turn grout/brass/slat/tee-bar lines into lit
relief. Emissive textures live on `disableLighting` materials; a lit
emissive-material StandardMaterial either washes out or — without
texture — reads as a blown slab.

Shadows are real, not painted: the inspection-rig spot casts walls,
figure parts, and hero props; anomaly-spawned meshes self-register as
casters. Figures also carry fake contact blobs so feet never float.

## Do / Don't

- DO: quiet repetition, honest wear (scuffs at skirting, finger-gloss on
  push plates), asymmetry only where a human put it (corkboard flyers).
- DON'T: grunge everywhere, horror-red mood lighting as baseline, copied
  transit pictograms or real-brand signage, visual noise that hides
  anomalies unfairly (anomaly readability outranks dressing density).
