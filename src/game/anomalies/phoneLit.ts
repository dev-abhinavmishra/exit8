/**
 * phone.lit — the corridor phone's LINE lamp, dead since before your
 * first shift, glows a dull red. Nobody's calling, but the line is
 * up. Subtle object-class anomaly.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AnomalyDef } from "./types";

export const phoneLit: AnomalyDef = {
  id: "phone.lit",
  displayName: "Phone Line Lamp Lit",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["prop.phone"],
  excludes: ["phone.gone", "phone.offhook"],
  testSeed: "test.phone.lit",
  dangerous: false,
  activate(ctx) {
    const { scene } = ctx;
    const lamp = scene.getMeshByName("prop.phone.lamp");
    if (!lamp) return { update() {}, cleanup() {} };
    const orig = lamp.material;
    const lit = new StandardMaterial("anomaly.phoneLit", scene);
    lit.diffuseColor = new Color3(0.35, 0.05, 0.04);
    lit.emissiveColor = new Color3(0.85, 0.12, 0.08);
    lit.specularColor = Color3.Black();
    lamp.material = lit;
    return {
      update() {},
      cleanup() {
        lamp.material = orig;
        lit.dispose();
      },
    };
  },
};
