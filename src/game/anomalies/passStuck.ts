/**
 * pass.stuck — the pass counter beside the south mouth didn't advance.
 * It still reads last loop's number: a deliberate off-by-one against the
 * streak the loop manager just painted, so a player counting their
 * filings catches it and a skimming player files "clear" on a lie.
 */
import type { DynamicTexture } from "@babylonjs/core";
import { SIGNS } from "../../data/signage";
import { drawSign } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const passStuck: AnomalyDef = {
  id: "pass.stuck",
  displayName: "Counter Didn't Advance",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["sign.attempt.face"],
  excludes: [],
  testSeed: "test.pass.stuck",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const spec = SIGNS.find((s) => s.id === "sign.attempt");
    const t = ctx.world.materials.sign.get("sign.attempt")?.diffuseTexture as DynamicTexture | undefined;
    const streak = ctx.streak ?? 0;
    if (!spec || !t) return { update() {}, cleanup() {} };
    // correct plate reads PASS {streak+1}; the stuck counter shows the
    // pass you just finished — the number didn't tick
    drawSign(t, { ...spec, title: `PASS ${String(Math.min(99, streak)).padStart(2, "0")}` });
    // second tell — the plate itself sits crooked in its bezel
    const plate = ctx.world.registry.get("sign.attempt.face");
    const rz = plate.rotation.z;
    plate.rotation.z = rz - 0.055;
    return {
      update() {},
      cleanup() {
        plate.rotation.z = rz;
        drawSign(t, {
          ...spec,
          title: `PASS ${String(Math.min(99, streak + 1)).padStart(2, "0")}`,
        });
      },
    };
  },
};
