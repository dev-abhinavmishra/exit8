/**
 * panel.wires — the breaker panel hangs open like panel.open, but three
 * colored cable strands are pulled out of the bus and droop toward the
 * floor, as if something reached in and tugged the guts out. The door
 * conflict keeps it exclusive with panel.open. Moderate.
 */
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

const WIRE_COLORS = [
  new Color3(0.62, 0.1, 0.08), // live red
  new Color3(0.75, 0.62, 0.12), // neutral yellow
  new Color3(0.12, 0.22, 0.6), // earth blue
];

export const panelWires: AnomalyDef = {
  id: "panel.wires",
  displayName: "Guts Pulled Out",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.75,
  progressionRange: [15, 100],
  requires: ["elec.panel.door", "elec.panel"],
  excludes: ["panel.open"],
  testSeed: "test.panel.wires",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, rng } = ctx;
    const door = ctx.world.registry.get("elec.panel.door");
    const panel = ctx.world.registry.get("elec.panel");
    if (!door || !panel) return { update() {}, cleanup() {} };
    const rot = door.rotation.clone();
    door.rotation.y = 0.95;

    const wires: { dispose(): void }[] = [];
    for (const [i, col] of WIRE_COLORS.entries()) {
      const mat = new StandardMaterial(`anomaly.pwires.${i}`, scene);
      mat.diffuseColor = col;
      mat.specularColor = Color3.Black();
      mat.emissiveColor = col.scale(0.08);
      const len = rng.range(0.3, 0.48);
      const drop = CreateCylinder(`anomaly.pwires.${i}.drop`, { diameter: 0.008, height: len }, scene);
      drop.material = mat;
      drop.parent = panel;
      // strands spill from the open bus mouth, hanging out into the corridor
      drop.position = new Vector3(0.045, 0.1 - i * 0.1 - len / 2, rng.range(-0.08, 0.12));
      drop.rotation.z = rng.range(-0.12, 0.3);
      const tip = CreateCylinder(
        `anomaly.pwires.${i}.tip`,
        { diameter: 0.008, height: rng.range(0.08, 0.14) },
        scene,
      );
      tip.material = mat;
      tip.parent = drop;
      tip.position = new Vector3(0.03, -len / 2 - 0.04, 0);
      tip.rotation.z = Math.PI / 2 - rng.range(0.2, 0.6);
      wires.push(drop);
    }
    return {
      update() {},
      cleanup() {
        door.rotation.copyFrom(rot);
        for (const w of wires) w.dispose();
      },
    };
  },
};
