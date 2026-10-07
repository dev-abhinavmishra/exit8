# NIGHT AUDIT — Art Bible

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
  fixtures fractionally dimmer — baseline, not anomaly)
- Airlocks: warmer 3200 K pools
- Service junction: slightly greener institutional cast
- Anomaly lighting uses _changes_ (temperature drift, delayed response,
  shadow from nothing) — never full dark-outs as a default

## Geometry language

Modular kit on a 600 mm grid: 3.0 m ceilings, 3.6 m corridor width,
600×600 ceiling grid with recessed troffers, wall panels 1200 mm modules,
radius corners on counters, brushed-steel door frames, skirting + shadow
gap details. Everything reads manufactured and repeatable — anomalies
break that repetition.

## Procedural texture strategy (M1)

DynamicTexture-generated: terrazzo speckle + brass strips, panel micro-
noise, signage/pictograms (original fictional copy from `src/data/signage.ts`),
clock face. M2: Blender-authored kit + KTX2 + lightmaps replace the hero
surfaces; procedural set remains as fallback tier.

## Do / Don't

- DO: quiet repetition, honest wear (scuffs at skirting, finger-gloss on
  push plates), asymmetry only where a human put it (corkboard flyers).
- DON'T: grunge everywhere, horror-red mood lighting as baseline, copied
  transit pictograms or real-brand signage, visual noise that hides
  anomalies unfairly (anomaly readability outranks dressing density).
