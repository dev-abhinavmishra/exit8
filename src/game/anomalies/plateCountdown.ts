/**
 * plate.countdown — the counter runs backwards while you walk: every
 * few seconds it quietly takes one back, PASS 04 → 03 → 02, like the
 * route is un-earning your streak in real time.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawSign } from "../../world/generation/textures";
import { SIGNS } from "../../data/signage";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const plateCountdown: AnomalyDef = {
  id: "plate.countdown",
  displayName: "Unearned",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["sign.attempt.face"],
  excludes: ["plate.ahead", "plate.zero", "plate.blank", "plate.smeared"],
  testSeed: "test.plate.countdown",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const spec = SIGNS.find((s) => s.id === "sign.attempt");
    const t = ctx.world.materials.sign.get("sign.attempt")?.diffuseTexture as DynamicTexture | undefined;
    if (!spec || !t) return { update() {}, cleanup() {} };
    let shown = Math.min(99, (ctx.streak ?? 0) + 1);
    let acc = 0;
    drawSign(t, { ...spec, title: `PASS ${String(shown).padStart(2, "0")}` });
    return {
      update(dt: number) {
        acc += dt;
        if (acc < 9 || shown <= 0) return;
        acc = 0;
        shown -= 1;
        drawSign(t, { ...spec, title: `PASS ${String(shown).padStart(2, "0")}` });
      },
      cleanup() {},
    };
  },
};
