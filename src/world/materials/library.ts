/** PBR material library for the slice. All procedural textures. */
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
  clockFace: StandardMaterial;
  clockHand: StandardMaterial;
  cabinetRed: StandardMaterial;
  sign: Map<string, StandardMaterial>;
  poster: StandardMaterial[];
  terminal: StandardMaterial;
  condensation: StandardMaterial;
  anomalousRoom: StandardMaterial;
}

export function buildMaterials(scene: Scene, tex: TextureSet): MaterialSet {
  const wallPanel = new PBRMaterial("mat.wallPanel", scene);
  wallPanel.albedoTexture = tex.wallPanel;
  wallPanel.roughness = 0.55;
  wallPanel.metallic = 0.02;
  wallPanel.environmentIntensity = 0.5;

  const terrazzo = new PBRMaterial("mat.terrazzo", scene);
  terrazzo.albedoTexture = tex.terrazzo;
  tex.terrazzo.uScale = 3;
  tex.terrazzo.vScale = 3;
  terrazzo.roughness = 0.38;
  terrazzo.metallic = 0.05;
  terrazzo.environmentIntensity = 0.7;

  const ceiling = new PBRMaterial("mat.ceiling", scene);
  ceiling.albedoTexture = tex.ceilingTile;
  ceiling.roughness = 0.9;
  ceiling.metallic = 0;
  ceiling.environmentIntensity = 0.3;

  const steel = new PBRMaterial("mat.steel", scene);
  steel.albedoTexture = tex.steel;
  steel.roughness = 0.34;
  steel.metallic = 0.88;
  steel.environmentIntensity = 1.0;

  const shutter = new PBRMaterial("mat.shutter", scene);
  shutter.albedoTexture = tex.shutter;
  shutter.roughness = 0.5;
  shutter.metallic = 0.7;
  shutter.environmentIntensity = 0.6;

  const concrete = new PBRMaterial("mat.concrete", scene);
  concrete.albedoTexture = tex.concrete;
  concrete.roughness = 0.85;
  concrete.metallic = 0;
  concrete.environmentIntensity = 0.3;

  const darkGlass = new PBRMaterial("mat.darkGlass", scene);
  darkGlass.albedoColor = new Color3(0.05, 0.06, 0.08);
  darkGlass.roughness = 0.08;
  darkGlass.metallic = 0.9;
  darkGlass.alpha = 0.45;
  darkGlass.environmentIntensity = 1.6;

  // Troffer fixtures: emissive rectangles read as lit panels.
  const trofferLit = new StandardMaterial("mat.trofferLit", scene);
  trofferLit.emissiveColor = new Color3(1.0, 0.94, 0.82).scale(1.6);
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
    m.emissiveColor = new Color3(0.22, 0.22, 0.22);
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
    clockFace,
    clockHand,
    cabinetRed,
    sign,
    poster,
    terminal,
    condensation,
    anomalousRoom,
  };
}
