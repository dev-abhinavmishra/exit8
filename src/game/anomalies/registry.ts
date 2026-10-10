/**
 * Anomaly registry + seeded selection.
 * Rules: weighted bag with recent-history suppression, exclusion tags,
 * progression-range gate, chapter gate. Clean loops are rolled first —
 * an anomaly only spawns when the loop roll says "divergent".
 */
import { WeightedBag } from "../state/rng";
import type { RngStream } from "../state/rng";
import type { AnomalyDef } from "./types";

export class AnomalyRegistry {
  private defs = new Map<string, AnomalyDef>();
  private bag = new WeightedBag<string>(3);

  register(def: AnomalyDef): void {
    if (this.defs.has(def.id)) throw new Error(`duplicate anomaly: ${def.id}`);
    this.defs.set(def.id, def);
  }

  get(id: string): AnomalyDef {
    const d = this.defs.get(id);
    if (!d) throw new Error(`unknown anomaly: ${id}`);
    return d;
  }

  list(): AnomalyDef[] {
    return [...this.defs.values()];
  }

  /**
   * Roll for this loop. Returns the chosen def or null (clear loop).
   * `anomalyRate` is the chapter's divergent probability.
   */
  rollLoop(
    roll: RngStream,
    opts: { chapter: number; stability: number; anomalyRate: number },
  ): AnomalyDef | null {
    if (!roll.chance(opts.anomalyRate)) return null;
    return this.pick(roll, opts);
  }

  /** Weighted pick among eligible defs. */
  pick(roll: RngStream, opts: { chapter: number; stability: number }): AnomalyDef | null {
    const eligible = this.list().filter(
      (d) =>
        d.chapter <= opts.chapter &&
        opts.stability >= d.progressionRange[0] &&
        opts.stability <= d.progressionRange[1],
    );
    // tier multiplier — the loop favors reads you can actually make:
    // subtle rolls at roughly half rate, unmistakable slightly boosted.
    // within a tier the def's own weight still applies
    const tierMult = { subtle: 0.55, moderate: 0.9, unmistakable: 1.15 } as const;
    const id = this.bag.draw(
      roll,
      eligible.map((d) => ({ id: d.id, weight: d.weight * tierMult[d.detectability] })),
    );
    return id ? this.get(id) : null;
  }

  recent(): readonly string[] {
    return this.bag.recent();
  }
}
