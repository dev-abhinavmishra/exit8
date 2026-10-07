/**
 * Deterministic RNG for NIGHT AUDIT.
 *
 * Everything random flows through named streams derived from the run seed so
 * a run is fully reproducible from (seed, loopIndex). Rule: add new consumers
 * as NEW stream names or append draws at the END of an existing stream —
 * reordering or inserting draws reseats every downstream consumer.
 */

export function hashSeed(text: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — tiny, fast, good-enough distribution for game rolls. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type StreamName =
  | "loop.roll" // per-loop anomaly-or-clean + anomaly pick
  | "loop.dressing" // per-loop harmless baseline variance (poster nudges etc.)
  | "anomaly.runtime" // intra-anomaly variance (flicker patterns, cadence)
  | "audio.ambient" // rumble scheduling, ambience texture
  | "audio.synth" // synthesized-source jitter (footsteps, noise buffer)
  | "ui.feedback"
  | "e2e.stub";

const STREAM_SALTS: Record<StreamName, number> = {
  "loop.roll": 0x9e3779b9,
  "loop.dressing": 0x85ebca6b,
  "anomaly.runtime": 0xc2b2ae35,
  "audio.ambient": 0x27d4eb2f,
  "audio.synth": 0x5bf03635,
  "ui.feedback": 0x165667b1,
  "e2e.stub": 0xd3a2646c,
};

/** A named deterministic stream; `draw()` returns [0,1). */
export class RngStream {
  private next: () => number;

  constructor(
    public readonly name: StreamName,
    runSeed: string,
    scope = "",
  ) {
    this.next = mulberry32(hashSeed(`${runSeed}:${name}:${scope}`));
  }

  static salt(name: StreamName): number {
    return STREAM_SALTS[name];
  }

  draw(): number {
    return this.next();
  }

  int(minInclusive: number, maxExclusive: number): number {
    return minInclusive + Math.floor(this.draw() * (maxExclusive - minInclusive));
  }

  range(min: number, max: number): number {
    return min + this.draw() * (max - min);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("RngStream.pick on empty array");
    const item = items[this.int(0, items.length)];
    if (item === undefined) throw new Error("unreachable");
    return item;
  }

  chance(p: number): boolean {
    return this.draw() < p;
  }
}

/**
 * Weighted bag: shuffled without immediate repeats. Draw order is
 * deterministic for a given stream; a drawn id goes to the back of the bag
 * and cannot reappear until `cooldown` other draws happened.
 */
export class WeightedBag<T extends string> {
  private history: T[] = [];

  constructor(private readonly cooldown: number) {}

  /** Returns picked id or null when every candidate is in cooldown. */
  draw(stream: RngStream, candidates: readonly { id: T; weight: number }[]): T | null {
    const fresh = candidates.filter((c) => !this.history.includes(c.id));
    const pool = fresh.length > 0 ? fresh : candidates;
    if (pool.length === 0) return null;
    let total = 0;
    for (const c of pool) total += Math.max(0, c.weight);
    if (total <= 0) return null;
    let roll = stream.draw() * total;
    let chosen = pool[pool.length - 1];
    for (const c of pool) {
      roll -= Math.max(0, c.weight);
      if (roll <= 0) {
        chosen = c;
        break;
      }
    }
    if (chosen === undefined) return null;
    this.history.push(chosen.id);
    if (this.history.length > this.cooldown) this.history.shift();
    return chosen.id;
  }

  recent(): readonly T[] {
    return this.history;
  }

  reset(): void {
    this.history = [];
  }
}
