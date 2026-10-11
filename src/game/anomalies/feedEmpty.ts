/**
 * feed.empty — the camera that can plainly see you shows a corridor
 * with nobody in it. No ring, no walker dot: an empty stretch of floor
 * on live tape.
 */
import { drawFeed } from "../../world/generation/textures";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const feedEmpty: AnomalyDef = {
  id: "feed.empty",
  displayName: "Empty Corridor",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [25, 100],
  requires: ["feed.screen"],
  excludes: ["feed.lag", "feed.ahead", "feed.figure", "feed.static"],
  testSeed: "test.feed.empty",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const t = (
      ctx.world.registry.mesh("feed.screen").material as {
        emissiveTexture?: DynamicTexture;
      } | null
    )?.emissiveTexture;
    if (!t) return { update() {}, cleanup() {} };
    let acc = 0;
    return {
      update(dt: number) {
        acc += dt;
        if (acc < 0.25) return;
        acc = 0;
        drawFeed(t, { px: 0, pz: 0, wz: 0, empty: true });
      },
      cleanup() {},
    };
  },
};
