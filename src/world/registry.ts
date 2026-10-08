/**
 * Named-node registry: the contract between the concourse builder and the
 * anomaly modules. An anomaly declares `requires`; the builder guarantees
 * those names exist. Never registry-mutate outside builder/cleanup hooks.
 */
import type { AbstractMesh, TransformNode } from "@babylonjs/core/Meshes";

export class WorldRegistry {
  private nodes = new Map<string, TransformNode | AbstractMesh>();

  register(name: string, node: TransformNode | AbstractMesh): void {
    if (this.nodes.has(name)) throw new Error(`registry duplicate: ${name}`);
    this.nodes.set(name, node);
  }

  get(name: string): TransformNode | AbstractMesh {
    const n = this.nodes.get(name);
    if (!n) throw new Error(`registry missing: ${name}`);
    return n;
  }

  mesh(name: string): AbstractMesh {
    const n = this.get(name);
    // Meshes are TransformNodes; a plain node throws here, which is correct.
    return n as AbstractMesh;
  }

  has(name: string): boolean {
    return this.nodes.has(name);
  }

  names(): string[] {
    return [...this.nodes.keys()];
  }

  clear(): void {
    this.nodes.clear();
  }
}
