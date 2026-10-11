/**
 * feed.figure — a third dot stands mid-frame on the tape, at the stretch
 * south of the camera's own mount. Look up: nobody there. Look back:
 * it hasn't moved, and it has no ring.
 */
import { drawFeed } from "../../world/generation/textures";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const feedFigure: AnomalyDef = {
  id: "feed.figure",
  displayName: "A Third Dot",
  chapter: 3,
  category: "character",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [40, 100],
  requires: ["feed.screen"],
  excludes: ["feed.lag", "feed.ahead", "feed.empty", "feed.static"],
  testSeed: "test.feed.figure",
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
        const p = ctx.player.position;
        acc += dt;
        if (acc < 0.15) return;
        acc = 0;
        drawFeed(t, {
          px: p.x,
          pz: p.z,
          wz: ctx.world.ambientWalker.root.position.z,
          ghostZ: 31.4,
        });
      },
      cleanup() {},
    };
  },
};
