/**
 * supply.plate — the SUPPLY ISSUE plate reads RECEIPTS CLOSED and the
 * amber pilot over the grille is dead. Subtle-tier: the plate wordplay
 * rides a second tell (the pilot lamp dies with it), per the
 * obvious-first law for kept-subtle anomalies.
 */
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const supplyPlate: AnomalyDef = {
  id: "supply.plate",
  displayName: "Receipts Closed",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.5,
  progressionRange: [20, 100],
  requires: ["sign.supply", "supply.pilot"],
  excludes: [],
  testSeed: "test.supply.plate",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const sign = world.registry.mesh("sign.supply");
    const pilot = world.registry.mesh("supply.pilot");
    const savedMat = sign.material;
    const pilotMat = pilot.material as StandardMaterial;
    const pilotSaved = pilotMat.emissiveColor.clone();
    sign.material = world.materials.sign.get("sign.supply.closed") ?? savedMat;
    pilotMat.emissiveColor.set(0.01, 0.01, 0.01);
    return {
      update() {},
      cleanup() {
        sign.material = savedMat;
        pilotMat.emissiveColor = pilotSaved;
      },
    };
  },
};
