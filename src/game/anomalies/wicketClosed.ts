/**
 * wicket.closed — the wicket isn't just shut tonight, it's condemned:
 * two portable stanchions stand mid-corridor before the gates with a
 * sagging chain between them and a LANE CLOSED plate hung off the
 * chain. It physically narrows the walk — you squeeze past on the
 * west side. Unmistakable spatial-class.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { drawSign } from "../../world/generation/textures";
import { SIGNS } from "../../data/signage";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const wicketClosed: AnomalyDef = {
  id: "wicket.closed",
  displayName: "The Wicket Is Closed",
  chapter: 2,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [30, 100],
  requires: ["gate.lamp.0"],
  excludes: ["corridor.mirror", "corridor.long", "corridor.narrow", "totem.fallen"],
  testSeed: "test.wicket.closed",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;
    const parent = new TransformNode("anomaly.wicket.closed", scene);
    parent.parent = world.root;
    // mid-lane before the gates — the squeeze is west of it
    parent.position.set(0.25 + rng.range(-0.15, 0.15), 0, 7.4 + rng.range(-0.3, 0.3));
    parent.rotation.y = rng.range(-0.12, 0.12);
    const postMat = world.materials.steel;
    for (const px of [-0.6, 0.6]) {
      const post = CreateCylinder(
        "anomaly.wicket.closed.post",
        { height: 0.95, diameter: 0.05, tessellation: 10 },
        scene,
      );
      post.material = postMat;
      post.parent = parent;
      post.position.set(px, 0.475, 0);
      const foot = CreateCylinder(
        "anomaly.wicket.closed.foot",
        { height: 0.03, diameter: 0.3, tessellation: 12 },
        scene,
      );
      foot.material = postMat;
      foot.parent = parent;
      foot.position.set(px, 0.015, 0);
    }
    // the chain sags between the posts — a parabola of little links
    const chainMat = new StandardMaterial("anomaly.wicket.closed.chainmat", scene);
    chainMat.diffuseColor = new Color3(0.5, 0.5, 0.52);
    chainMat.specularColor = new Color3(0.2, 0.2, 0.2);
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      const sag = Math.sin(u * Math.PI) * 0.22;
      const link = CreateBox(
        `anomaly.wicket.closed.link.${i}`,
        { width: 0.1, height: 0.025, depth: 0.025 },
        scene,
      );
      link.material = chainMat;
      link.parent = parent;
      link.position.set(-0.6 + u * 1.2, 0.9 - sag, 0);
      link.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.25;
    }
    // LANE CLOSED plate hung off the chain's belly
    const spec = SIGNS.find((s) => s.id === "sign.wicket.closed");
    let plateMat = chainMat;
    if (spec) {
      const t = new DynamicTexture("anomaly.wicket.closed.tex", { width: 512, height: 192 }, scene, true);
      drawSign(t, spec);
      plateMat = new StandardMaterial("anomaly.wicket.closed.platemat", scene);
      plateMat.diffuseTexture = t;
      plateMat.emissiveTexture = t;
      plateMat.emissiveColor = new Color3(0.75, 0.75, 0.75);
      plateMat.specularColor = Color3.Black();
      plateMat.backFaceCulling = false;
    }
    const plate = CreateBox("anomaly.wicket.closed.plate", { width: 0.52, height: 0.3, depth: 0.015 }, scene);
    plate.material = plateMat;
    plate.parent = parent;
    plate.position.set(0, 0.52, 0);
    // it physically narrows the walk — squeeze past on the west side
    const blocker = CreateBox("anomaly.wicket.closed.col", { width: 1.4, height: 1.0, depth: 0.18 }, scene);
    blocker.parent = parent;
    blocker.position.set(0, 0.5, 0);
    blocker.isVisible = false;
    blocker.checkCollisions = true;
    return {
      update() {},
      cleanup() {
        parent.dispose(false, true);
      },
    };
  },
};
