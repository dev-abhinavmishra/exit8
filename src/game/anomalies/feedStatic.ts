/**
 * feed.static — signal loss: the pane rolls noise bands and the corridor
 * underneath them keeps dropping out — dots flicker off for whole seconds
 * at a stretch while the REC pin burns steady.
 */
import { drawFeed } from "../../world/generation/textures";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const feedStatic: AnomalyDef = {
  id: "feed.static",
  displayName: "Signal Loss",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [25, 100],
  requires: ["feed.screen"],
  excludes: ["feed.lag", "feed.ahead", "feed.empty", "feed.figure"],
  testSeed: "test.feed.static",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const t = (
      ctx.world.registry.mesh("feed.screen").material as {
        emissiveTexture?: DynamicTexture;
      } | null
    )?.emissiveTexture;
    if (!t) return { update() {}, cleanup() {} };
    let acc = 0;
    let ph = 0;
    return {
      update(dt: number) {
        const p = ctx.player.position;
        ph += dt;
        acc += dt;
        if (acc < 0.1) return;
        acc = 0;
        const drop = Math.sin(ph * 1.7) > 0.86; // ~8% of ticks lose the dots
        drawFeed(t, {
          px: p.x,
          pz: p.z,
          wz: ctx.world.ambientWalker.root.position.z,
          empty: drop,
          statik: 0.45 + 0.45 * (0.5 + 0.5 * Math.sin(ph * 2.6)),
        });
      },
      cleanup() {},
    };
  },
};
