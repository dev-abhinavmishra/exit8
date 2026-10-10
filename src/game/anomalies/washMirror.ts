/**
 * wash.mirror — the washroom mirror already shows a dim smear of the
 * room (painted reflection, no RTT). The anomaly repaints it with a
 * pale figure standing dead-center — someone is behind you in the
 * glass who is not in the room. Moderate: it reads the moment you
 * face the vanity, and again on the way out.
 */
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const washMirror: AnomalyDef = {
  id: "wash.mirror",
  displayName: "Someone in the Glass",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [16, 100],
  requires: ["wash.mirror"],
  excludes: ["corridor.mirror", "corridor.long", "corridor.narrow"],
  testSeed: "test.wash.mirror",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const mirror = world.registry.mesh("wash.mirror");
    const mat = mirror.material as StandardMaterial;
    const baseDiffuse = mat.diffuseTexture;
    const baseEmissive = mat.emissiveTexture;
    const t = new DynamicTexture("anomaly.wash.mirrorface", { width: 128, height: 160 }, scene, false);
    const mc = t.getContext() as unknown as CanvasRenderingContext2D;
    // same painted smear as the baseline mirror — identical until the
    // eye lands on the figure (the reflection should look CORRECT except
    // for the one thing that cannot be correct)
    const g = mc.createLinearGradient(0, 0, 0, 160);
    g.addColorStop(0, "#1c2226");
    g.addColorStop(0.55, "#171d21");
    g.addColorStop(1, "#10151a");
    mc.fillStyle = g;
    mc.fillRect(0, 0, 128, 160);
    for (const sx of [30, 88]) {
      const f = mc.createLinearGradient(sx - 6, 0, sx + 6, 0);
      f.addColorStop(0, "rgba(190,215,220,0)");
      f.addColorStop(0.5, "rgba(190,215,220,0.14)");
      f.addColorStop(1, "rgba(190,215,220,0)");
      mc.fillStyle = f;
      mc.fillRect(sx - 6, 8, 12, 120);
    }
    mc.fillStyle = "rgba(150,160,158,0.09)";
    mc.fillRect(0, 96, 128, 10);
    mc.fillStyle = "rgba(200,215,215,0.12)";
    mc.fillRect(14, 140, 100, 7);
    // the figure — dead-center and a little too close: dark coat
    // widening down the frame, a pale face with the features washed
    // out to a blank. Bolder than subtlety wants — the smear dulls it
    // back down, and "not there" is the failure mode that matters
    mc.fillStyle = "rgba(10,11,12,0.95)";
    mc.beginPath();
    mc.moveTo(38, 160);
    mc.lineTo(44, 104);
    mc.quadraticCurveTo(47, 90, 55, 86);
    mc.lineTo(73, 86);
    mc.quadraticCurveTo(81, 90, 84, 104);
    mc.lineTo(90, 160);
    mc.closePath();
    mc.fill();
    // head — pale oval hovering over the coat, washed bright like a
    // face catching the room's strip light
    mc.fillStyle = "rgba(214,204,188,0.92)";
    mc.beginPath();
    mc.ellipse(64, 72, 13, 17, 0, 0, Math.PI * 2);
    mc.fill();
    // dark pits where eyes should read — oversized, hollow
    mc.fillStyle = "rgba(10,10,12,0.85)";
    mc.beginPath();
    mc.ellipse(59, 70, 2.4, 3.4, 0, 0, Math.PI * 2);
    mc.ellipse(69, 70, 2.4, 3.4, 0, 0, Math.PI * 2);
    mc.fill();
    // mouth a small dark notch — slack, not screaming
    mc.fillStyle = "rgba(16,14,14,0.8)";
    mc.fillRect(62, 82, 4, 3);
    t.update();
    mat.diffuseTexture = t;
    mat.emissiveTexture = t;
    return {
      update() {},
      cleanup() {
        mat.diffuseTexture = baseDiffuse;
        mat.emissiveTexture = baseEmissive;
        t.dispose();
      },
    };
  },
};
