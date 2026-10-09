/** PBR material library for the slice. All procedural textures. */
import { Engine } from "@babylonjs/core/Engines/engine";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import type { TextureSet } from "../generation/textures";

export interface MaterialSet {
  wallPanel: PBRMaterial;
  terrazzo: PBRMaterial;
  ceiling: PBRMaterial;
  steel: PBRMaterial;
  shutter: PBRMaterial;
  concrete: PBRMaterial;
  darkGlass: PBRMaterial;
  trofferLit: StandardMaterial;
  trofferDim: StandardMaterial;
  commitmentStripe: StandardMaterial;
  door: PBRMaterial;
  rubber: StandardMaterial;
  grime: StandardMaterial;
  /** black fade strip for fake ambient occlusion */
  aoStrip: StandardMaterial;
  clockFace: StandardMaterial;
  clockHand: StandardMaterial;
  cabinetRed: StandardMaterial;
  sign: Map<string, StandardMaterial>;
  poster: StandardMaterial[];
  terminal: StandardMaterial;
  condensation: StandardMaterial;
  anomalousRoom: StandardMaterial;
  guideStrip: StandardMaterial;
  lightShaft: StandardMaterial;
  /** truncated-dome tactile warning pads at the airlock thresholds */
  domePad: StandardMaterial;
  /** dark terrazzo border band — shares the floor's polish so it reads as stone, not void */
  fborder: PBRMaterial;
  blinds: StandardMaterial;
  puddle: StandardMaterial;
}

export function buildMaterials(scene: Scene, tex: TextureSet): MaterialSet {
  const wallPanel = new PBRMaterial("mat.wallPanel", scene);
  wallPanel.albedoTexture = tex.wallPanel;
  // repeat so the baked seam lines read as a panel module — unscaled it
  // stretches across 20m walls and every seam blurs away
  tex.wallPanel.uScale = 8;
  tex.wallPanel.vScale = 1;
  // glazed-tile specular — the reference passage reads polished, not
  // matte; lockers/radiator/lift doors share this material and gain
  // the same enamelled sheen
  wallPanel.roughness = 0.4;
  wallPanel.metallic = 0.02;
  wallPanel.environmentIntensity = 0.65;
  // grout relief: the bump map shares the albedo's groove layout and
  // tiling, so seams catch the zone lights as real recesses up close
  wallPanel.bumpTexture = tex.wallPanelBump;
  tex.wallPanelBump.uScale = 8;
  tex.wallPanelBump.vScale = 1;

  const terrazzo = new PBRMaterial("mat.terrazzo", scene);
  terrazzo.albedoTexture = tex.terrazzo;
  // brass divider strips every ~1m across / ~2.75m along the corridor —
  // a bay rhythm that keeps the 55m floor from reading as one slab
  tex.terrazzo.uScale = 4;
  tex.terrazzo.vScale = 20;
  // polished-wax sheen: roughness just low enough for point lights to smear
  // into visible streaks down the corridor (the genre's wet-tile read)
  terrazzo.roughness = 0.27;
  terrazzo.metallic = 0.05;
  terrazzo.environmentIntensity = 0.85;
  // recessed joint relief matching the baked brass-strip edges
  terrazzo.bumpTexture = tex.terrazzoBump;
  tex.terrazzoBump.uScale = 4;
  tex.terrazzoBump.vScale = 20;

  // the wall-base border band: same polished-terrazzo recipe, tinted
  // down — at grazing angles it must still read as stone (mats.rubber
  // here collapsed to void)
  const fborder = new PBRMaterial("mat.fborder", scene);
  fborder.albedoTexture = tex.terrazzo;
  fborder.albedoColor = new Color3(0.16, 0.16, 0.175);
  fborder.roughness = 0.3;
  fborder.metallic = 0.05;
  fborder.environmentIntensity = 0.8;

  const ceiling = new PBRMaterial("mat.ceiling", scene);
  ceiling.albedoTexture = tex.ceilingTile;
  tex.ceilingTile.uScale = 6;
  tex.ceilingTile.vScale = 60;
  ceiling.bumpTexture = tex.ceilingBump;
  tex.ceilingBump.uScale = 6;
  tex.ceilingBump.vScale = 60;
  ceiling.roughness = 0.9;
  ceiling.metallic = 0;
  ceiling.environmentIntensity = 0.6;

  const steel = new PBRMaterial("mat.steel", scene);
  steel.albedoTexture = tex.steel;
  tex.steel.uScale = 2;
  tex.steel.vScale = 2;
  steel.roughness = 0.34;
  steel.metallic = 0.88;
  steel.environmentIntensity = 1.0;

  const shutter = new PBRMaterial("mat.shutter", scene);
  shutter.albedoTexture = tex.shutter;
  shutter.bumpTexture = tex.shutterBump;
  shutter.roughness = 0.5;
  shutter.metallic = 0.7;
  shutter.environmentIntensity = 0.6;

  const concrete = new PBRMaterial("mat.concrete", scene);
  concrete.albedoTexture = tex.concrete;
  tex.concrete.uScale = 4;
  tex.concrete.vScale = 4;
  concrete.roughness = 0.85;
  concrete.metallic = 0;
  concrete.environmentIntensity = 0.3;

  const darkGlass = new PBRMaterial("mat.darkGlass", scene);
  darkGlass.albedoColor = new Color3(0.05, 0.06, 0.08);
  darkGlass.roughness = 0.08;
  darkGlass.metallic = 0.9;
  darkGlass.alpha = 0.45;
  darkGlass.environmentIntensity = 1.6;

  // Troffer fixtures: emissive rectangles read as lit panels; the
  // louver-cell face keeps them from reading as flat glow slabs.
  const trofferLit = new StandardMaterial("mat.trofferLit", scene);
  trofferLit.emissiveColor = new Color3(1.0, 0.94, 0.82).scale(0.62);
  trofferLit.emissiveTexture = tex.trofferFace;
  trofferLit.disableLighting = true;

  const trofferDim = new StandardMaterial("mat.trofferDim", scene);
  trofferDim.emissiveColor = new Color3(0.45, 0.44, 0.4);
  trofferDim.disableLighting = true;

  const commitmentStripe = new StandardMaterial("mat.commitStripe", scene);
  commitmentStripe.emissiveColor = new Color3(0.9, 0.62, 0.24).scale(0.9);
  commitmentStripe.diffuseColor = new Color3(0.36, 0.3, 0.2);
  commitmentStripe.disableLighting = false;

  const door = new PBRMaterial("mat.door", scene);
  door.albedoTexture = tex.steel;
  door.roughness = 0.42;
  door.metallic = 0.85;
  door.environmentIntensity = 0.8;

  const rubber = new StandardMaterial("mat.rubber", scene);
  rubber.diffuseColor = new Color3(0.03, 0.03, 0.035);
  rubber.specularColor = new Color3(0.02, 0.02, 0.02);

  // tactile guide strip — dim amber channel with raised bars; slightly
  // emissive-free but warmer than the terrazzo so the line reads
  const guideStrip = new StandardMaterial("mat.guideStrip", scene);
  guideStrip.diffuseTexture = tex.guideStrip;
  tex.guideStrip.uScale = 1;
  tex.guideStrip.vScale = 8; // ~0.8 m bar pitch along a 6.4 m segment

  // tactile warning pad — amber truncated-dome field, unlit texture so
  // the dots keep their painted highlight under any zone lighting
  const domePad = new StandardMaterial("mat.domePad", scene);
  domePad.diffuseTexture = tex.domePad;
  domePad.emissiveTexture = tex.domePad;
  domePad.emissiveColor = new Color3(0.42, 0.4, 0.34);
  domePad.specularColor = new Color3(0.02, 0.02, 0.02);

  // venetian blinds behind the gallery glass — alpha slats, unlit so
  // they read pale against the dark interior
  tex.blinds.hasAlpha = true;
  const blinds = new StandardMaterial("mat.blinds", scene);
  blinds.diffuseTexture = tex.blinds;
  blinds.opacityTexture = tex.blinds;
  blinds.emissiveColor = new Color3(0.55, 0.53, 0.46);
  blinds.specularColor = Color3.Black();

  // floor damp patch — dark radial wash with a sheen, nearly flat
  tex.puddle.hasAlpha = true;
  const puddle = new StandardMaterial("mat.puddle", scene);
  puddle.diffuseTexture = tex.puddle;
  puddle.opacityTexture = tex.puddle;
  puddle.specularColor = new Color3(0.5, 0.5, 0.5);
  puddle.specularPower = 48;

  // fake volumetric shaft under each troffer — additive, unlit
  const lightShaft = new StandardMaterial("mat.lightShaft", scene);
  lightShaft.diffuseTexture = tex.lightShaft;
  lightShaft.emissiveTexture = tex.lightShaft;
  lightShaft.opacityTexture = tex.lightShaft;
  lightShaft.disableLighting = true;
  lightShaft.backFaceCulling = false;
  lightShaft.alphaMode = Engine.ALPHA_ADD;

  // damp staining / wall wear — translucent dark wash decal
  const grime = new StandardMaterial("mat.grime", scene);
  grime.diffuseColor = new Color3(0.05, 0.045, 0.04);
  grime.specularColor = new Color3(0, 0, 0);
  grime.emissiveColor = new Color3(0.05, 0.045, 0.04);
  grime.alpha = 0.3;

  const aoStrip = new StandardMaterial("mat.aoStrip", scene);
  aoStrip.diffuseTexture = tex.fadeStrip;
  aoStrip.useAlphaFromDiffuseTexture = true;
  aoStrip.disableLighting = true;
  aoStrip.diffuseColor = new Color3(0, 0, 0);
  aoStrip.alphaMode = 2;
  aoStrip.backFaceCulling = false;

  const clockFace = new StandardMaterial("mat.clockFace", scene);
  clockFace.diffuseTexture = tex.clockFace;
  clockFace.emissiveColor = new Color3(0.18, 0.18, 0.17);

  const clockHand = new StandardMaterial("mat.clockHand", scene);
  clockHand.diffuseColor = new Color3(0.16, 0.17, 0.19);
  clockHand.specularColor = new Color3(0.05, 0.05, 0.05);

  const cabinetRed = new StandardMaterial("mat.cabinetRed", scene);
  cabinetRed.diffuseColor = new Color3(0.42, 0.13, 0.13);
  cabinetRed.specularColor = new Color3(0.2, 0.2, 0.2);

  const sign = new Map<string, StandardMaterial>();
  for (const [id, t] of tex.signs) {
    const m = new StandardMaterial(`mat.${id}`, scene);
    m.diffuseTexture = t;
    m.emissiveColor = new Color3(0.45, 0.45, 0.45);
    m.specularColor = new Color3(0.02, 0.02, 0.02);
    sign.set(id, m);
  }

  const poster = tex.posters.map((t, i) => {
    const m = new StandardMaterial(`mat.poster.${i}`, scene);
    m.diffuseTexture = t;
    m.emissiveTexture = t;
    m.emissiveColor = new Color3(0.3, 0.3, 0.3);
    m.specularColor = new Color3(0.03, 0.03, 0.03);
    return m;
  });

  const terminal = new StandardMaterial("mat.terminal", scene);
  terminal.diffuseTexture = tex.terminal;
  terminal.emissiveTexture = tex.terminal;
  terminal.emissiveColor = new Color3(0.9, 0.9, 0.9);
  terminal.disableLighting = true;

  const condensation = new StandardMaterial("mat.condensation", scene);
  condensation.diffuseTexture = tex.condensation;
  condensation.opacityTexture = tex.condensation;
  condensation.emissiveTexture = tex.condensation;
  condensation.emissiveColor = new Color3(0.5, 0.5, 0.5);
  condensation.disableLighting = true;

  // The room beyond doorway.extra — a just-off shade of the wall language.
  const anomalousRoom = new StandardMaterial("mat.anomalousRoom", scene);
  anomalousRoom.diffuseColor = new Color3(0.35, 0.3, 0.24);
  anomalousRoom.emissiveColor = new Color3(0.16, 0.13, 0.09);

  return {
    wallPanel,
    terrazzo,
    fborder,
    ceiling,
    steel,
    shutter,
    concrete,
    darkGlass,
    trofferLit,
    trofferDim,
    commitmentStripe,
    door,
    rubber,
    grime,
    aoStrip,
    clockFace,
    clockHand,
    cabinetRed,
    sign,
    poster,
    terminal,
    condensation,
    anomalousRoom,
    guideStrip,
    lightShaft,
    domePad,
    blinds,
    puddle,
  };
}
