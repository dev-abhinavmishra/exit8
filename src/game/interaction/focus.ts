/**
 * Interaction focus: a single forward ray resolved against registered
 * interactables. Deliberately narrow — this game is about judgment, not
 * item hunting. M1 interactables: the two airlock terminals.
 */
import { Ray } from "@babylonjs/core/Culling/ray";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

export interface Interactable {
  mesh: AbstractMesh;
  prompt: string;
  onUse: () => void;
}

export class FocusResolver {
  private items: Interactable[] = [];
  private lastPrompt: string | null = null;

  register(item: Interactable): void {
    this.items.push(item);
  }

  /** Returns the focused interactable or null. */
  resolve(scene: Scene, origin: Vector3, dir: Vector3, maxDist = 2.4): Interactable | null {
    const ray = new Ray(origin, dir.normalize(), maxDist);
    let best: Interactable | null = null;
    let bestD = maxDist;
    for (const it of this.items) {
      if (!it.mesh.isEnabled()) continue;
      const hit = ray.intersectsMesh(it.mesh, false);
      if (hit.hit && hit.distance < bestD) {
        best = it;
        bestD = hit.distance;
      }
    }
    void scene;
    this.lastPrompt = best?.prompt ?? null;
    return best;
  }

  prompt(): string | null {
    return this.lastPrompt;
  }
}
