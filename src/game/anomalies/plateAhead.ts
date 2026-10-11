/**
 * plate.ahead — the pass plate already credits a filing you haven't
 * made: it reads one ahead of your real streak, like the corridor
 * pre-counted your judgment.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawSign } from "../../world/generation/textures";
import { SIGNS } from "../../data/signage";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const plateAhead: AnomalyDef = {
  id: "plate.ahead",
  displayName: "Count On Credit",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["sign.attempt.face"],
  excludes: ["plate.zero", "plate.countdown", "plate.blank", "plate.smeared"],
  testSeed: "test.plate.ahead",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const spec = SIGNS.find((s) => s.id === "sign.attempt");
    const t = ctx.world.materials.sign.get("sign.attempt")?.diffuseTexture as DynamicTexture | undefined;
    if (!spec || !t) return { update() {}, cleanup() {} };
    const shown = Math.min(99, (ctx.streak ?? 0) + 2);
    drawSign(t, { ...spec, title: `PASS ${String(shown).padStart(2, "0")}` });
    return { update() {}, cleanup() {} };
  },
};
