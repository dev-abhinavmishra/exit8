/**
 * phone.offhook — the corridor phone's handset is off the cradle,
 * dangling by its cord below the housing. Nobody hung it up — or
 * nobody was there to hang it up. Subtle object-class anomaly.
 */
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const phoneOffhook: AnomalyDef = {
  id: "phone.offhook",
  displayName: "Off the Hook",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["prop.phone"],
  excludes: [],
  testSeed: "test.phone.offhook",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const phone = world.registry.get("prop.phone");
    const handset = phone.getChildMeshes().find((m) => m.name === "prop.phone.handset");
    const cord = phone.getChildMeshes().find((m) => m.name === "prop.phone.cord");
    if (!handset || !cord) return { update() {}, cleanup() {} };

    const hPos = handset.position.clone();
    const hRot = handset.rotation.clone();
    const cPos = cord.position.clone();
    const cRot = cord.rotation.clone();

    // handset drops off the cradle and swings out, still on the cord
    handset.position.set(-0.17, -0.32, -0.1);
    handset.rotation.set(0.35, 0, 0.18);
    // cord re-aims to meet it — bottom swings out toward the corridor
    cord.position.set(-0.09, -0.16, -0.08);
    cord.rotation.set(0, 0, -0.3);
    (cord as AbstractMesh).scaling.y = 1.2;

    return {
      update() {},
      cleanup() {
        handset.position.copyFrom(hPos);
        handset.rotation.copyFrom(hRot);
        cord.position.copyFrom(cPos);
        cord.rotation.copyFrom(cRot);
        (cord as AbstractMesh).scaling.y = 1;
      },
    };
  },
};
