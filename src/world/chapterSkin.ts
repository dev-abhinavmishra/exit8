import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { ConcourseWorld } from "./generation/concourse";

/**
 * Chapter reskin — the route visibly degrades as competence advances:
 * CH I warm neutral, CH II amber-thin + grime smudges, CH III dim red
 * dusk + failed troffers + litter. Persistent meshes use dress.ch.*
 * (merge-folded statics, never anomaly-touched). Anomaly cleanups
 * restore zone.baseDiffuse/baseIntensity, so we shift those bases too.
 */

interface Saved {
  diffuse: Color3[];
  intensity: number[];
  trofferMats: unknown[][];
  extras: number[];
}
const saved = new WeakMap<ConcourseWorld, Saved>();
const grimeMeshes = new WeakMap<ConcourseWorld, AbstractMesh[]>();

function base(w: ConcourseWorld): Saved {
  let s = saved.get(w);
  if (!s) {
    s = {
      diffuse: w.zones.map((z) => z.baseDiffuse.clone()),
      intensity: w.zones.map((z) => z.point.intensity),
      trofferMats: w.zones.map((z) => z.troffers.map((t) => t.material)),
      extras: w.zones.map((z) => z.extraLights.reduce((a, l) => a + l.intensity, 0)),
    };
    saved.set(w, s);
  }
  return s;
}

export function applyChapterSkin(world: ConcourseWorld, chapter: number): void {
  const s = base(world);
  const scene = world.root.getScene();

  // chapter tints: I clean, II amber-thin, III red dusk
  const tint = chapter >= 3 ? [0.82, 0.62, 0.55] : chapter === 2 ? [0.98, 0.88, 0.7] : [1, 1, 1];
  const dim = chapter >= 3 ? 0.72 : chapter === 2 ? 0.9 : 1;
  world.zones.forEach((z, i) => {
    const d = s.diffuse[i]!;
    z.baseDiffuse = new Color3(d.r * tint[0]!, d.g * tint[1]!, d.b * tint[2]!);
    z.point.diffuse = z.baseDiffuse.clone();
    z.point.intensity = s.intensity[i]! * dim;
    for (const l of z.extraLights) l.intensity *= dim;
    // CH III: the last troffer of each zone burns out for good
    if (chapter >= 3 && z.troffers.length) {
      const last = z.troffers[z.troffers.length - 1]!;
      last.material = world.materials.trofferDim;
    } else {
      z.troffers.forEach((t, j) => (t.material = s.trofferMats[i]![j] as never));
    }
  });

  // persistent dressing per chapter tier
  let list = grimeMeshes.get(world);
  if (!list) {
    list = [];
    grimeMeshes.set(world, list);
  }
  list.forEach((m) => m.dispose());
  list.length = 0;
  const grime = new StandardMaterial(`mat.ch${chapter}.grime`, scene);
  grime.diffuseColor = new Color3(0.05, 0.05, 0.045);
  grime.specularColor = Color3.Black();
  grime.alpha = 0.55;
  const spots: [number, number, number, number][] =
    chapter >= 3
      ? [
          [-1.74, 0.9, 9, 1.4],
          [-1.74, 1.4, 27, 1.1],
          [-1.74, 0.7, 47, 1.6],
          [1.74, 1.1, 17, 1.2],
          [1.74, 0.8, 43, 1.5],
          [0.4, 0.02, 25.5, 0.7],
          [-0.3, 0.02, 36, 0.9],
          [0.8, 0.02, 48.5, 0.6],
        ]
      : chapter === 2
        ? [
            [-1.74, 0.8, 23, 1.2],
            [1.74, 1.0, 31, 1.0],
            [0.2, 0.02, 33, 0.6],
          ]
        : [];
  spots.forEach(([x, y, z, len], i) => {
    const wall = y > 0.05;
    const m = CreateBox(
      `dress.ch.grime.${i}`,
      { width: wall ? 0.015 : len!, height: wall ? len! : 0.008, depth: wall ? len! : len! * 0.8 },
      scene,
    );
    m.material = grime;
    m.parent = world.root;
    m.position = new Vector3(x, y, z);
    if (wall) m.rotation.x = 0.3 + i * 0.2;
    list!.push(m);
  });
}
