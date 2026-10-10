/**
 * vents.crawl — something is inside the ceiling duct. A long dark shape
 * travels the trunk line on a slow patrol; through each grate it reads
 * as a body sliding past the slats, and its scrape follows overhead —
 * always ahead of you or just behind. Moderate: you catch it moving,
 * never parked.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AnomalyDef, AnomalyInstance } from "./types";

const DUCT_X = 1.02;
const DUCT_Y = 2.66;
const Z0 = 6;
const Z1 = 50;
const SPEED = 1.9; // m/s — brisk but paced, like a shoulder you can't keep

export const ventsCrawl: AnomalyDef = {
  id: "vents.crawl",
  displayName: "In the Duct",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 1,
  progressionRange: [14, 100],
  requires: ["duct.grate.0"],
  excludes: ["lights.blackout", "corridor.mirror", "corridor.long", "corridor.narrow"],
  testSeed: "test.vents.crawl",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene } = ctx;
    // the shape riding inside the trunk — long and low so a grate's
    // slit view cuts it into slat-separated body parts
    const mat = new StandardMaterial("anomaly.crawl.mat", scene);
    mat.diffuseColor = new Color3(0.012, 0.011, 0.01);
    mat.specularColor = new Color3(0.05, 0.05, 0.05);
    const body = CreateBox("anomaly.crawl.body", { width: 0.3, height: 0.14, depth: 1.7 }, scene);
    body.material = mat;
    let z = ctx.rng.range(Z0 + 6, Z1 - 6);
    let dir = ctx.rng.chance(0.5) ? 1 : -1;
    let scrapeT = 0;
    let told = false;
    let turnT = 0;
    body.position = new Vector3(DUCT_X, DUCT_Y, z);
    return {
      update(dt) {
        const p = ctx.player.position;
        if (!told) {
          const d2 = (p.x - DUCT_X) ** 2 + (p.z - z) ** 2;
          if (d2 < 49) {
            told = true;
            ctx.audio.caption("something is inside the duct", new Vector3(DUCT_X, 2.6, z));
          }
        }
        // bias its course toward staying just ahead of the player: when
        // the gap shrinks it slips away through the run
        const gap = p.z - z;
        if (Math.abs(gap) < 3.5 && Math.sign(gap) !== dir && turnT <= 0) {
          turnT = 1.1; // it heard you — resumes moving, away from you
        }
        if (turnT > 0) {
          turnT -= dt;
          if (turnT <= 0) dir = Math.sign(gap) || dir;
        } else {
          z += dir * SPEED * dt;
          if (z > Z1) {
            z = Z1;
            dir = -1;
          } else if (z < Z0) {
            z = Z0;
            dir = 1;
          }
          body.position.z = z;
          // it scrapes as it goes — a dry drag that paces you overhead
          scrapeT -= dt;
          if (scrapeT <= 0) {
            scrapeT = 0.42 + ctx.rng.range(0, 0.2);
            ctx.audio.playScrape(new Vector3(DUCT_X, 2.6, z));
          }
        }
      },
      cleanup() {
        body.dispose();
        mat.dispose();
      },
    };
  },
};
