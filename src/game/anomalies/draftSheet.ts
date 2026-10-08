/**
 * draft.sheet — a lone paper sheet lies on open terrazzo where none
 * was dropped this loop. Wait near it and it slides half a metre in a
 * draft that touches nothing else — papers nearby never stir. The
 * scrape gives it away if you're close enough to hear. Subtle: the
 * corridor already drops loose sheets, so only the moving one is wrong.
 */
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AnomalyDef } from "./types";

export const draftSheet: AnomalyDef = {
  id: "draft.sheet",
  displayName: "The Sheet Moved",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.6,
  progressionRange: [15, 100],
  requires: ["floor"],
  excludes: ["floor.flood", "tracks.wet", "memory.persist"],
  testSeed: "test.draft.sheet",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const mat = new StandardMaterial("anomaly.sheet.mat", scene);
    mat.diffuseColor = new Color3(0.55, 0.52, 0.45);
    mat.emissiveColor = new Color3(0.1, 0.095, 0.08); // readable in the dim stretch
    mat.specularColor = new Color3(0, 0, 0);
    const sheet = CreatePlane("anomaly.sheet", { width: 0.2, height: 0.28 }, scene);
    sheet.material = mat;
    sheet.parent = world.root;
    sheet.rotation.x = Math.PI / 2;
    const x0 = rng.range(-0.9, 0.9);
    const z0 = rng.range(18, 42);
    const yaw0 = rng.range(0, Math.PI * 2);
    sheet.rotation.z = yaw0;
    sheet.position.set(x0, 0.006, z0);

    // slide vector — mostly along the corridor, slight drift sideways
    const slideDir = rng.draw() < 0.5 ? 1 : -1;
    const slideX = rng.range(-0.25, 0.25);
    const triggerZ = z0 - 9; // player closing within ~9m wakes the draft
    let t = -1; // -1 waiting, else slide progress seconds
    const DUR = 1.5;
    let scraped = false;
    return {
      update(dt) {
        if (t < 0) {
          if (ctx.player.position.z > triggerZ) t = 0;
          return;
        }
        if (t > DUR) return; // settled — once per loop
        const k0 = Math.min(1, t / DUR);
        t += dt;
        const k1 = Math.min(1, t / DUR);
        // ease-out: a drag that dies like friction catching it
        const e = (k: number) => 1 - (1 - k) * (1 - k);
        const dk = e(k1) - e(k0);
        sheet.position.x += slideX * dk;
        sheet.position.z += slideDir * 0.85 * dk;
        sheet.position.y = 0.006 + Math.sin(k1 * Math.PI) * 0.008; // corners lift as it goes
        sheet.rotation.z += dk * 0.7 * slideDir;
        if (!scraped && t > 0.15) {
          scraped = true;
          const at = sheet.getAbsolutePosition();
          at.y += 0.1;
          ctx.audio.playScrape(at);
        }
      },
      cleanup() {
        sheet.dispose();
        mat.dispose();
      },
    };
  },
};
