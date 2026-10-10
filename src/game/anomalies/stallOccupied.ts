/**
 * stall.occupied — the far stall door is shut (baseline it stands wide
 * ajar) and two feet stand under the gap: shoe-toe shadows on the tile,
 * a trouser-cuff line, and — when you lean close — the soft sound of
 * someone standing very still in there. Moderate, escalating to
 * unmistakable at the gap.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const stallOccupied: AnomalyDef = {
  id: "stall.occupied",
  displayName: "The Stall Is Occupied",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.7,
  progressionRange: [22, 100],
  requires: ["wash.stall.door.1"],
  excludes: ["corridor.mirror", "corridor.long", "corridor.narrow"],
  testSeed: "test.stall.occupied",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const door = world.registry.get("wash.stall.door.1");
    const baseYaw = door.rotation.y;
    door.rotation.y = -0.02; // shut — the door that stood open is closed
    // the under-gap read: two shoe toes + trouser cuffs visible below
    // the leaf, angled slightly toward the door like someone facing out
    const shoeMat = new StandardMaterial("anomaly.stall.shoes", scene);
    shoeMat.diffuseColor = new Color3(0.05, 0.05, 0.06);
    shoeMat.specularColor = new Color3(0.12, 0.12, 0.13);
    const cuffMat = new StandardMaterial("anomaly.stall.cuffs", scene);
    cuffMat.diffuseColor = new Color3(0.11, 0.1, 0.09);
    cuffMat.specularColor = new Color3(0.04, 0.04, 0.04);
    const parts: AbstractMesh[] = [];
    for (const [i, fx] of [-0.09, 0.11].entries()) {
      const shoe = CreateBox(`anomaly.stall.shoe.${i}`, { width: 0.09, height: 0.07, depth: 0.2 }, scene);
      shoe.material = shoeMat;
      shoe.position.set(3.16 + fx, 0.035, 16.98);
      shoe.rotation.y = 0.16; // toes point a little past the door line
      parts.push(shoe);
      const cuff = CreateBox(`anomaly.stall.cuff.${i}`, { width: 0.1, height: 0.09, depth: 0.13 }, scene);
      cuff.material = cuffMat;
      cuff.position.set(3.16 + fx - 0.015, 0.115, 16.97);
      parts.push(cuff);
    }
    const breathAt = new Vector3(3.16, 1.1, 16.9);
    let shifted = false;
    return {
      update() {
        // standing very still — until you lean in, then the weight shifts
        if (
          !shifted &&
          ctx.player.position.x > 2.2 &&
          ctx.player.position.z > 16.6 &&
          ctx.player.position.z < 19.9
        ) {
          const d = Math.hypot(ctx.player.position.x - 3.16, ctx.player.position.z - 17.0);
          if (d < 1.9) {
            shifted = true;
            ctx.audio.playRustle(breathAt);
          }
        }
      },
      cleanup() {
        door.rotation.y = baseYaw;
        for (const m of parts) m.dispose();
        shoeMat.dispose();
        cuffMat.dispose();
      },
    };
  },
};
