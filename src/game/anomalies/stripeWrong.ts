/**
 * stripe.wrong — the south inspection point's floor stripe glows red
 * instead of amber. The commit line itself is wrong, which makes the
 * most attentive players hesitate at exactly the wrong moment. Subtle.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AnomalyDef } from "./types";

export const stripeWrong: AnomalyDef = {
  id: "stripe.wrong",
  displayName: "Wrong-Color Stripe",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["al.south.commitStripe"],
  excludes: ["sign", "commit"],
  testSeed: "test.stripe.wrong",
  dangerous: false,
  activate(ctx) {
    const stripe = ctx.world.registry.mesh("al.south.commitStripe");
    const mat = stripe.material as StandardMaterial | null;
    if (!mat) return { update() {}, cleanup() {} };
    const e0 = mat.emissiveColor.clone();
    const d0 = mat.diffuseColor.clone();
    mat.emissiveColor = new Color3(0.9, 0.12, 0.08);
    mat.diffuseColor = new Color3(0.5, 0.08, 0.06);
    return {
      update() {},
      cleanup() {
        mat.emissiveColor = e0;
        mat.diffuseColor = d0;
      },
    };
  },
};
