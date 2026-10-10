/**
 * gate.keeper — a fare-keeper stands inside the middle lane of the
 * shut wicket, back to the corridor, facing the paddles like he's
 * holding the line open for someone. Nobody works the desk tonight.
 * Inside ~9m his head finds you; press close and there is nobody
 * there. Unmistakable figure-class.
 */
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

const KEEPER_X = 1.26;
const KEEPER_Z = 7.4; // lane 1

export const gateKeeper: AnomalyDef = {
  id: "gate.keeper",
  displayName: "The Fare-Keeper",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.65,
  progressionRange: [30, 100],
  requires: ["gate.leaf.1.n", "gate.leaf.1.s"],
  excludes: [
    "figure.corridor",
    "figure.south",
    "figure.north",
    "figure.corner",
    "figure.records",
    "figure.fountain",
    "watcher.follows",
    "walker.crowd",
    "creature.tall",
    "walker.long",
  ],
  testSeed: "test.gate.keeper",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const fig = buildFigure(scene, world.root, "anomaly.gate.keeper", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const node = fig.root;
    node.position.set(KEEPER_X - 0.2 + rng.range(-0.1, 0.1), 0, KEEPER_Z + rng.range(-0.2, 0.2));
    node.rotation.y = Math.PI / 2; // back to the corridor, facing the gates/wall
    let gone = false;
    return {
      update() {
        if (gone) return;
        const p = ctx.player.position;
        const dx = p.x - node.position.x;
        const dz = p.z - node.position.z;
        const d2 = dx * dx + dz * dz;
        // his head finds you inside ~9m — a slow track, not a snap
        if (d2 < 81) {
          const want = Math.atan2(dx, dz) - node.rotation.y;
          fig.headPivot.rotation.y += (want - fig.headPivot.rotation.y) * 0.04;
        }
        // press right up to the paddles and there is nobody there
        if (d2 < 2.1) {
          gone = true;
          node.setEnabled(false);
          ctx.audio.caption("nobody at the gates", null);
        }
      },
      cleanup() {
        node.dispose(false, true);
      },
    };
  },
};
