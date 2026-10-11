/**
 * cctv.double — two eyes. A second camera head rides the same bracket
 * a metre and a half further along, same droop, same red pin — the
 * mount was never installed twice. Subtle object anomaly: easy to
 * miss unless you learned the corner.
 */
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnomalyDef } from "./types";

export const cctvDouble: AnomalyDef = {
  id: "cctv.double",
  displayName: "Two Eyes",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["cctv"],
  excludes: [],
  testSeed: "test.cctv.double",
  dangerous: false,
  activate(ctx) {
    const { scene } = ctx;
    const mount = scene.getTransformNodeByName("cctv");
    const head = scene.getTransformNodeByName("cctv.head");
    if (!mount || !head) return { update() {}, cleanup() {} };
    // the mount's local +x runs along the corridor (rotation −π/2) —
    // dupe the whole head sub-tree one-and-a-half metres down-wall
    const dupe = new TransformNode("cctv.dupe.head", scene);
    dupe.parent = mount;
    dupe.position = head.position.clone();
    dupe.position.x += 1.4;
    dupe.rotation.copyFrom(head.rotation);
    for (const m of head.getChildMeshes()) {
      const c = m.clone(`${m.name}.dupe`, null);
      if (!c) continue;
      c.parent = dupe;
      c.position.copyFrom(m.position);
      c.rotation.copyFrom(m.rotation);
    }
    return {
      update() {},
      cleanup() {
        for (const m of dupe.getChildMeshes()) m.dispose();
        dupe.dispose();
      },
    };
  },
};
