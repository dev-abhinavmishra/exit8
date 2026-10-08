/**
 * pane.face — the wired-glass vision pane on the south doors is a dark
 * slot you never look into. Tonight, when you close on the doors for
 * your filing, a face is pressed into it from inside — flattened nose,
 * splayed fingers. It drops from the glass just before you reach it.
 */
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnomalyDef, AnomalyInstance } from "./types";

const REVEAL_M = 5.0;
const VANISH_M = 1.25;

export const paneFace: AnomalyDef = {
  id: "pane.face",
  displayName: "Face at the Glass",
  chapter: 3,
  category: "character",
  detectability: "subtle",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["door.south.inner.R"],
  excludes: ["doors.open", "doors.slam", "door.slow", "door.stuck"],
  testSeed: "test.pane.face",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world, scene } = ctx;
    world.registry.mesh("door.south.inner.R"); // asserts the leaf exists

    const tex = new DynamicTexture("tex.paneface", { width: 128, height: 192 }, scene, true);
    const c = tex.getContext() as unknown as CanvasRenderingContext2D;
    // the wired glass itself is the background — the plate is opaque
    // and reads as the pane's own face, no alpha pass needed
    c.fillStyle = "rgb(14,18,21)";
    c.fillRect(0, 0, 128, 192);
    // pale oval pressed flat — kept dim so the dark glass edge shows
    // around it and the black features carry the read at distance
    c.fillStyle = "rgba(205,192,172,0.85)";
    c.beginPath();
    c.ellipse(64, 70, 36, 46, 0, 0, Math.PI * 2);
    c.fill();
    // flattened nose blob
    c.fillStyle = "rgba(185,170,150,0.85)";
    c.beginPath();
    c.ellipse(64, 84, 14, 10, 0, 0, Math.PI * 2);
    c.fill();
    // socket shadows — big near-black pits, the read at four metres
    c.fillStyle = "rgba(16,13,10,0.96)";
    for (const ex of [44, 84]) {
      c.beginPath();
      c.ellipse(ex, 56, 12, 15, 0, 0, Math.PI * 2);
      c.fill();
    }
    // mouth — a slack open drop
    c.beginPath();
    c.ellipse(64, 106, 14, 9, 0, 0, Math.PI * 2);
    c.fill();
    // splayed fingers climbing the glass below the chin
    c.fillStyle = "rgba(216,204,186,0.9)";
    for (const fx of [30, 48, 66, 84, 102]) {
      c.beginPath();
      c.ellipse(fx, 150, 7, 26, (fx - 66) * 0.006, 0, Math.PI * 2);
      c.fill();
    }
    c.beginPath();
    c.ellipse(66, 176, 40, 16, 0, 0, Math.PI * 2);
    c.fill();
    tex.update();
    const mat = new StandardMaterial("mat.paneface", scene);
    mat.diffuseTexture = tex;
    mat.specularColor.set(0, 0, 0);
    mat.emissiveTexture = tex;
    mat.emissiveColor.set(0.42, 0.4, 0.36);
    mat.backFaceCulling = false;

    const holder = new TransformNode("anomaly.pane.face", scene);
    holder.parent = world.root;
    holder.position = new Vector3(0.6, 1.72, 54.934);
    // plate fills the wired pane — the face IS the glass at a glance
    const plate = CreatePlane("anomaly.pane.face.plate", { width: 0.215, height: 0.39 }, scene);
    plate.material = mat;
    plate.parent = holder;
    holder.setEnabled(false);

    let revealed = false;
    let gone = false;
    const panePos = new Vector3();
    return {
      update() {
        if (gone) return;
        holder.getAbsolutePosition().subtractToRef(ctx.player.position, panePos);
        const dist = panePos.length();
        if (!revealed && dist < REVEAL_M) {
          revealed = true;
          holder.setEnabled(true);
          ctx.audio.caption("something is pressed to the glass", holder.getAbsolutePosition().clone());
        } else if (revealed && dist < VANISH_M) {
          gone = true;
          holder.setEnabled(false);
          ctx.audio.playKnock(holder.getAbsolutePosition().clone());
          ctx.audio.caption("it drops from the glass", null);
        }
      },
      cleanup() {
        holder.dispose();
        mat.dispose();
        tex.dispose();
      },
    };
  },
};
