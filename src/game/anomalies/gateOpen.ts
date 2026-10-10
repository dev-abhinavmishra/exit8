/**
 * gate.open — one fare lane stands open: the smoked paddles have swung
 * back into their pedestals and the lane lamp above it burns green —
 * the only lit lamp on a row that should be dead. Moderate: the open
 * lane reads at a glance, the lamp confirms it.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnomalyDef, AnomalyInstance } from "./types";

const LANE = 0;

export const gateOpen: AnomalyDef = {
  id: "gate.open",
  displayName: "A Gate Stands Open",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [30, 100],
  requires: [`gate.leaf.${LANE}.n`, `gate.leaf.${LANE}.s`, `gate.lamp.${LANE}`],
  excludes: [],
  testSeed: "test.gate.open",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const north = world.registry.get(`gate.leaf.${LANE}.n`) as TransformNode;
    const south = world.registry.get(`gate.leaf.${LANE}.s`) as TransformNode;
    // paddles retract toward their own pedestals — the real-gate read
    north.rotation.y = Math.PI / 2.2;
    south.rotation.y = -Math.PI / 2.2;
    // second tell: the lane lamp burns green over the open lane
    const lamp = world.registry.mesh(`gate.lamp.${LANE}`);
    const lm = lamp.material as StandardMaterial;
    const lampSaved = lm.emissiveColor.clone();
    lm.emissiveColor = new Color3(0.1, 0.7, 0.28);
    return {
      update() {},
      cleanup() {
        north.rotation.y = 0;
        south.rotation.y = 0;
        lm.emissiveColor = lampSaved;
      },
    };
  },
};
