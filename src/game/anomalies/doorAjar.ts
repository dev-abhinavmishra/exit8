/**
 * door.ajar — the right-wall service door hangs open at a shallow angle,
 * its south edge swung into the corridor with the dark service void
 * behind. Moderate: a door that was flush is now a wedge of shadow.
 */
import type { AnomalyDef } from "./types";

export const doorAjar: AnomalyDef = {
  id: "door.ajar",
  displayName: "Service Door Ajar",
  chapter: 1,
  category: "spatial",
  detectability: "moderate",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["service.door.leaf"],
  excludes: ["door.service"],
  testSeed: "test.door.ajar",
  dangerous: false,
  activate(ctx) {
    const leaf = ctx.world.registry.mesh("service.door.leaf");
    const x0 = leaf.position.x;
    const z0 = leaf.position.z;
    // hinge at the north jamb (x0, z0 - half): rotate the leaf toward -x so
    // its south edge swings into the corridor, then re-center so the north
    // edge stays on the jamb.
    const th = -0.6;
    const half = 0.44;
    leaf.rotation.y = th;
    leaf.position.x = x0 + half * Math.sin(th);
    leaf.position.z = z0 - half + half * Math.cos(th);
    return {
      update() {},
      cleanup() {
        leaf.rotation.y = 0;
        leaf.position.x = x0;
        leaf.position.z = z0;
      },
    };
  },
};
