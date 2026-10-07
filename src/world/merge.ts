/**
 * Static mesh merge — the M5 draw-call lever. Dozens of small decorative
 * pieces (ceiling trays, hangers, seams, grime, conduit risers) each cost
 * a draw call; no anomaly or loop system reaches them by name, so they
 * collapse into one mesh per material family.
 *
 * HARD RULE: only prefixes in STATIC_PREFIXES may merge. Anything a
 * registry anchor, `requires`, `getMeshByName`, or per-loop scatter can
 * reach must stay a discrete mesh — merging it would silently break the
 * anomaly that hides or moves it.
 */
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Material } from "@babylonjs/core/Materials/material";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";

const STATIC_PREFIXES = [
  "dress.tray.",
  "dress.conduit.",
  "dress.hanger.",
  "dress.jbox.",
  "dress.jstub.",
  "dress.seam.",
  "dress.drain.",
  "dress.grime.",
  "dress.cabseam.",
  "dress.cabpull.",
  "dress.ceilseam.",
  "dress.ceilrail.",
  "dress.ao.",
  "dress.rail.",
  "dress.pilaster.",
  "dress.gal.",
  "dress.sprinkler.",
  "dress.threshold.",
  "dress.cablabel.",
  "dress.scuff.",
  "dress.dome.",
  "dress.tactile.",
  "dress.callpoint.",
  "dress.emlight.",
  "dress.hatch.",
  "dress.stain.",
  "dress.pahorn.",
  "dress.caution.",
  "dress.dframe.",
  "dress.puddle.",
  "dress.doorlight.",
  "dress.ceilvoid",
  "dress.stencil.",
  "dress.cabfascia",
  "dress.hose.",
  "conduit.",
  "baseboard.",
  "junction.pipe.",
];

export function mergeStaticDressing(root: TransformNode): void {
  const groups = new Map<Material, Mesh[]>();
  for (const m of root.getChildMeshes(false)) {
    if (!STATIC_PREFIXES.some((p) => m.name.startsWith(p))) continue;
    if (!(m instanceof Mesh)) continue; // MergeMeshes needs real meshes
    const mat = m.material;
    if (!mat) continue;
    const g = groups.get(mat) ?? [];
    g.push(m);
    groups.set(mat, g);
  }
  let i = 0;
  for (const [mat, meshes] of groups) {
    if (meshes.length < 2) continue;
    const merged = Mesh.MergeMeshes(meshes, true, false, undefined, false, false);
    if (!merged) continue;
    merged.name = `merged.static.${i++}`;
    merged.material = mat;
    merged.parent = root;
    merged.isVisible = true;
    merged.setEnabled(true);
  }
}
