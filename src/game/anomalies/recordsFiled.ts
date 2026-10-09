/**
 * records.filed — one drawer stands open in the records bank, papers
 * fanned over its lip. The bank is a wall of shut drawers; nothing
 * moves and nothing sounds — you have to know the face. Moderate.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AnomalyDef, AnomalyInstance } from "./types";

const BANK_X = -1.55; // bank face plane; the drawer protrudes east (+x)
const SLOTS = [
  { z: 14.3, y: 1.55 },
  { z: 19.8, y: 0.85 },
  { z: 25.4, y: 1.85 },
  { z: 30.1, y: 1.2 },
];

export const recordsFiled: AnomalyDef = {
  id: "records.filed",
  displayName: "A Drawer Stands Open",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [18, 100],
  requires: ["records.cabinets"],
  excludes: ["corridor.mirror", "corridor.long", "records.breach", "figure.records"],
  testSeed: "test.records.filed",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;
    const slot = SLOTS[rng.int(0, SLOTS.length)]!;

    const drawer = CreateBox("anomaly.records.drawer", { width: 0.3, height: 0.16, depth: 0.34 }, scene);
    drawer.parent = world.root;
    drawer.position.set(BANK_X + 0.16, slot.y, slot.z);
    const dmat = new StandardMaterial("anomaly.records.drawerMat", scene);
    dmat.diffuseColor = new Color3(0.3, 0.29, 0.26);
    dmat.specularColor = new Color3(0.05, 0.05, 0.05);
    drawer.material = dmat;

    // dark cavity the drawer left in the face
    const hole = CreateBox("anomaly.records.hole", { width: 0.04, height: 0.18, depth: 0.36 }, scene);
    hole.parent = world.root;
    hole.position.set(BANK_X + 0.02, slot.y, slot.z);
    const hmat = new StandardMaterial("anomaly.records.holeMat", scene);
    hmat.diffuseColor = new Color3(0.02, 0.02, 0.02);
    hmat.emissiveColor = new Color3(0.02, 0.018, 0.014);
    hole.material = hmat;

    // papers fanned over the drawer's lip
    const papers = CreateBox("anomaly.records.papers", { width: 0.24, height: 0.05, depth: 0.26 }, scene);
    papers.parent = world.root;
    papers.position.set(BANK_X + 0.2, slot.y + 0.1, slot.z);
    papers.rotation.z = 0.12;
    const pmat = new StandardMaterial("anomaly.records.paperMat", scene);
    pmat.diffuseColor = new Color3(0.75, 0.72, 0.62);
    pmat.emissiveColor = new Color3(0.1, 0.09, 0.07);
    papers.material = pmat;

    let told = false;
    return {
      update() {
        if (!told && Math.abs(ctx.player.position.z - slot.z) < 1.6) {
          told = true;
          ctx.audio.caption("a drawer stands open", new Vector3(BANK_X, slot.y, slot.z));
        }
      },
      cleanup() {
        drawer.dispose();
        hole.dispose();
        papers.dispose();
        dmat.dispose();
        hmat.dispose();
        pmat.dispose();
      },
    };
  },
};
