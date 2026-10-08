/**
 * gallery.mirror — a figure inside the smoked observation glass keeps
 * exact pace with you: mirrored x, matching z, walking when you walk.
 * After a few seconds it desyncs — freezing mid-stride and drifting
 * toward the glass while you move on. The glass is smoked; there should
 * never be a reflection in it at all.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { buildFigure } from "../../world/figures";
import { LAYOUT } from "../../world/generation/concourse";
import type { AnomalyDef } from "./types";

const MIRROR_S = 4.5; // seconds of faithful mirroring before the desync
const INNER_X_MIN = 1.95; // gallery floor, just behind the panes
const INNER_X_MAX = 3.05; // gallery floor, at the back wall
const Z_MIN = 20.4;
const Z_MAX = 31.6;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export const galleryMirror: AnomalyDef = {
  id: "gallery.mirror",
  displayName: "Mirrored Occupant",
  chapter: 3,
  category: "character",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["wall.gallery.glass"],
  excludes: ["gallery.occupied", "glass.eyes", "gallery.dark", "gallery.frost"],
  testSeed: "test.gallery.mirror",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    const mat = new StandardMaterial("anomaly.gmirror.mat", scene);
    mat.diffuseColor = new Color3(0.03, 0.03, 0.04);
    mat.emissiveColor = new Color3(0.06, 0.07, 0.09); // reads faint through the smoke
    const built = buildFigure(scene, world.root, "anomaly.gmirror", {
      kind: "silhouette",
      material: mat,
      heightScale: 1.02,
    });
    const fig = built.root;
    fig.rotation.y = -Math.PI / 2; // face the corridor through the glass
    fig.position.y = 0;

    const wallX = LAYOUT.corridor.xHalf;
    let t = 0;
    let walkPhase = 0;
    let prevZ = 0;
    let desynced = false;
    let frozenZ = 0;
    let desyncX = INNER_X_MIN;

    const mirror = () => {
      const p = ctx.player.position;
      // a true pane reflection: mirrored x across the glass, matching z
      fig.position.x = clamp(2 * wallX - p.x, INNER_X_MIN, INNER_X_MAX);
      fig.position.z = clamp(p.z, Z_MIN, Z_MAX);
    };
    mirror();
    prevZ = fig.position.z;

    const facePlayer = () => {
      const p = ctx.player.position;
      const dx = p.x - fig.position.x;
      const dz = p.z - fig.position.z;
      if (Math.hypot(dx, dz) > 0.3) {
        built.headPivot.rotation.y = clamp(Math.atan2(-dx, -dz), -1.3, 1.3);
      }
    };

    return {
      update(dt) {
        t += dt;
        if (!desynced) {
          mirror();
          // walking bob while it keeps pace
          walkPhase += dt * 6 * Math.min(1, Math.abs(fig.position.z - prevZ) * 8 + 0.4);
          prevZ = fig.position.z;
          built.hips[0]!.rotation.x = Math.sin(walkPhase) * 0.42;
          built.hips[1]!.rotation.x = -Math.sin(walkPhase) * 0.42;
          built.arms[0]!.rotation.x = -Math.sin(walkPhase) * 0.3;
          built.arms[1]!.rotation.x = Math.sin(walkPhase) * 0.3;
          // and its head tracks you the whole time — the only wrong
          // note while it still mirrors
          facePlayer();
          if (t >= MIRROR_S) {
            desynced = true;
            frozenZ = fig.position.z;
            desyncX = fig.position.x;
          }
        } else {
          // it stops mid-stride and drifts to the glass — you keep
          // walking, it does not keep pace
          fig.position.z = frozenZ;
          desyncX = Math.max(INNER_X_MIN, desyncX - dt * 0.35);
          fig.position.x = desyncX;
          facePlayer();
        }
      },
      cleanup() {
        fig.dispose(false, true);
        mat.dispose();
      },
    };
  },
};
