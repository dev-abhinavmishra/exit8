/**
 * feed.lag — the corridor feed drags four seconds behind: the ringed dot
 * on the monitor keeps walking a path you already left. Watch it catch
 * up only when you stand still.
 */
import { drawFeed } from "../../world/generation/textures";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { AnomalyDef, AnomalyInstance } from "./types";

const DELAY = 4.0;

export const feedLag: AnomalyDef = {
  id: "feed.lag",
  displayName: "The Feed Drags",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [30, 100],
  requires: ["feed.screen"],
  excludes: ["feed.ahead", "feed.empty", "feed.figure", "feed.static"],
  testSeed: "test.feed.lag",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const t = (
      ctx.world.registry.mesh("feed.screen").material as {
        emissiveTexture?: DynamicTexture;
      } | null
    )?.emissiveTexture;
    if (!t) return { update() {}, cleanup() {} };
    const hist: { x: number; z: number }[] = [];
    let acc = 0;
    return {
      update(dt: number) {
        const p = ctx.player.position;
        hist.push({ x: p.x, z: p.z });
        // keep ~DELAY+1 s of trail — at 60fps that's ~300 samples
        while (hist.length > 300) hist.shift();
        acc += dt;
        if (acc < 0.12) return;
        acc = 0;
        const back = Math.min(hist.length - 1, Math.round((DELAY * 60) / 1));
        const ghost = hist[Math.max(0, hist.length - 1 - back)]!;
        drawFeed(t, {
          px: ghost.x,
          pz: ghost.z,
          wz: ctx.world.ambientWalker.root.position.z,
        });
      },
      cleanup() {},
    };
  },
};
