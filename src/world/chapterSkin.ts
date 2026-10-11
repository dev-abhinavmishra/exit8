import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { ConcourseWorld, LightZone } from "./generation/concourse";

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
  extras: number[][];
}
const saved = new WeakMap<ConcourseWorld, Saved>();
const grimeMeshes = new WeakMap<ConcourseWorld, AbstractMesh[]>();
/** last tier applied — skin.* anomalies save/restore through this */
const appliedTier = new WeakMap<ConcourseWorld, number>();
/** baseline emissive of lit fixtures so reskin composes instead of compounding */
const fixtureBase = new WeakMap<StandardMaterial, Color3>();

export function getChapterSkin(world: ConcourseWorld): number {
  return appliedTier.get(world) ?? 1;
}

function base(w: ConcourseWorld): Saved {
  let s = saved.get(w);
  if (!s) {
    s = {
      diffuse: w.zones.map((z) => z.baseDiffuse.clone()),
      intensity: w.zones.map((z) => z.point.intensity),
      trofferMats: w.zones.map((z) => z.troffers.map((t) => t.material)),
      extras: w.zones.map((z) => z.extraLights.map((l) => l.intensity)),
    };
    saved.set(w, s);
  }
  return s;
}

/** Lit fixture meshes whose emissive follows the zone's tier (screens,
 *  ad lamps, dome lights) — recording pins deliberately excluded: the
 *  corridor dies around them, the red pin stays honest. */
const FIXTURE_EMISSIVE = [
  "ads.face.0",
  "ads.face.1",
  "ads.face.2",
  "feed.screen",
  "help.lamp",
  "cctv.lens",
  "board.face.n",
  "board.face.s",
];

function tierTint(tier: number): [number, number, number] {
  return tier >= 3 ? [0.82, 0.62, 0.55] : tier === 2 ? [0.98, 0.88, 0.7] : [1, 1, 1];
}
function tierDim(tier: number): number {
  return tier >= 3 ? 0.72 : tier === 2 ? 0.9 : 1;
}

function applyZoneTier(world: ConcourseWorld, s: Saved, i: number, tier: number): void {
  const z = world.zones[i]!;
  const [tr, tg, tb] = tierTint(tier);
  const dim = tierDim(tier);
  const d = s.diffuse[i]!;
  z.baseDiffuse = new Color3(d.r * tr, d.g * tg, d.b * tb);
  z.point.diffuse = z.baseDiffuse.clone();
  z.point.intensity = s.intensity[i]! * dim;
  z.extraLights.forEach((l, j) => (l.intensity = (s.extras[i]?.[j] ?? l.intensity) * dim));
  // CH III: the last troffer of each zone burns out for good
  if (tier >= 3 && z.troffers.length) {
    const last = z.troffers[z.troffers.length - 1]!;
    last.material = world.materials.trofferDim;
  } else {
    z.troffers.forEach((t, j) => (t.material = s.trofferMats[i]![j] as never));
  }
}

function zoneAt(zones: LightZone[], z: number): number {
  let best = 0;
  zones.forEach((zn, i) => {
    if (z >= zn.z0 && z <= zn.z1) best = i;
  });
  return best;
}

/** scale lit-fixture emissive by the tier of the zone each one hangs in */
function applyFixtureTiers(world: ConcourseWorld, tierOf: (zoneIdx: number) => number): void {
  for (const name of FIXTURE_EMISSIVE) {
    const mesh = world.registry.mesh(name);
    const mat = mesh?.material as StandardMaterial | null;
    if (!mat) continue;
    if (!fixtureBase.has(mat)) fixtureBase.set(mat, mat.emissiveColor.clone());
    const b = fixtureBase.get(mat)!;
    const zi = zoneAt(world.zones, mesh.getAbsolutePosition().z);
    const [tr, tg, tb] = tierTint(tierOf(zi));
    const dim = tierDim(tierOf(zi));
    mat.emissiveColor = new Color3(b.r * tr * dim, b.g * tg * dim, b.b * tb * dim);
  }
}

function applyGrime(world: ConcourseWorld, chapter: number): void {
  const scene = world.root.getScene();
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
  grime.zOffset = -2;
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

export function applyChapterSkin(world: ConcourseWorld, chapter: number): void {
  const s = base(world);
  world.zones.forEach((_z, i) => applyZoneTier(world, s, i, chapter));
  applyFixtureTiers(world, () => chapter);
  applyGrime(world, chapter);
  appliedTier.set(world, chapter);
}

/** two tiers on one route — the corridor halves wear different chapters */
export function applySplitSkin(world: ConcourseWorld, northTier: number, southTier: number): void {
  const s = base(world);
  const half = Math.ceil(world.zones.length / 2);
  const tierOf = (i: number) => (i < half ? northTier : southTier);
  world.zones.forEach((_z, i) => applyZoneTier(world, s, i, tierOf(i)));
  applyFixtureTiers(world, tierOf);
  applyGrime(world, southTier);
  appliedTier.set(world, Math.max(northTier, southTier));
}
