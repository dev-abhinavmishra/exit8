/**
 * plate.smeared — the counter printed, then something dragged a thumb
 * through the wet ink: the pass number streaks sideways into the
 * border, half-legible, still drying.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawSign } from "../../world/generation/textures";
import { SIGNS } from "../../data/signage";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const plateSmeared: AnomalyDef = {
  id: "plate.smeared",
  displayName: "Still Drying",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["sign.attempt.face"],
  excludes: ["plate.ahead", "plate.zero", "plate.countdown", "plate.blank"],
  testSeed: "test.plate.smeared",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const spec = SIGNS.find((s) => s.id === "sign.attempt");
    const t = ctx.world.materials.sign.get("sign.attempt")?.diffuseTexture as DynamicTexture | undefined;
    if (!spec || !t) return { update() {}, cleanup() {} };
    const shown = Math.min(99, (ctx.streak ?? 0) + 1);
    drawSign(t, { ...spec, title: `PASS ${String(shown).padStart(2, "0")}` });
    // drag the title band sideways — dark smears through the wet text
    const c = t.getContext();
    const sz = t.getSize();
    c.save();
    c.scale(sz.width / 512, sz.height / 160);
    c.fillStyle = "#23262c";
    c.globalAlpha = 0.72;
    for (let i = 0; i < 7; i++) {
      const y = 48 + i * 8;
      c.fillRect(150 + i * 22, y, 240 - i * 14, 3.4);
    }
    c.globalAlpha = 1;
    c.restore();
    t.update();
    return { update() {}, cleanup() {} };
  },
};
