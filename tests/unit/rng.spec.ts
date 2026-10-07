import { describe, expect, it } from "vitest";
import { RngStream, WeightedBag, hashSeed, mulberry32 } from "../../src/game/state/rng";

describe("seeded RNG", () => {
  it("same seed produces identical sequences", () => {
    const a = mulberry32(hashSeed("loop-7"));
    const b = mulberry32(hashSeed("loop-7"));
    for (let i = 0; i < 64; i++) expect(a()).toBe(b());
  });

  it("different seeds diverge", () => {
    const a = mulberry32(hashSeed("run-a"));
    const b = mulberry32(hashSeed("run-b"));
    const seqA = Array.from({ length: 16 }, () => a());
    const seqB = Array.from({ length: 16 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it("streams are independent of each other and of scope", () => {
    const roll = new RngStream("loop.roll", "s1");
    const dress = new RngStream("loop.dressing", "s1");
    const rollScoped = new RngStream("loop.roll", "s1", "loop5");
    const seqRoll = Array.from({ length: 8 }, () => roll.draw());
    const seqDress = Array.from({ length: 8 }, () => dress.draw());
    const seqScoped = Array.from({ length: 8 }, () => rollScoped.draw());
    expect(seqRoll).not.toEqual(seqDress);
    expect(seqRoll).not.toEqual(seqScoped);
  });

  it("draws stay in [0,1) and int() in range", () => {
    const s = new RngStream("loop.roll", "bounds");
    for (let i = 0; i < 512; i++) {
      const v = s.draw();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      const n = s.int(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThan(7);
    }
  });
});

describe("WeightedBag", () => {
  const cands = [
    { id: "a" as const, weight: 1 },
    { id: "b" as const, weight: 1 },
    { id: "c" as const, weight: 1 },
  ];

  it("suppresses immediate repeats within cooldown", () => {
    const bag = new WeightedBag<string>(2);
    const s = new RngStream("loop.roll", "bag-test");
    const picks: string[] = [];
    for (let i = 0; i < 30; i++) {
      const p = bag.draw(s, cands);
      if (p) picks.push(p);
    }
    for (let i = 0; i < picks.length - 1; i++) {
      expect(picks[i]).not.toBe(picks[i + 1]);
    }
  });

  it("is deterministic for a seed", () => {
    const run = () => {
      const bag = new WeightedBag<string>(2);
      const s = new RngStream("loop.roll", "det");
      return Array.from({ length: 12 }, () => bag.draw(s, cands));
    };
    expect(run()).toEqual(run());
  });

  it("returns null on empty candidates", () => {
    const bag = new WeightedBag<string>(2);
    const s = new RngStream("loop.roll", "empty");
    expect(bag.draw(s, [])).toBeNull();
  });
});
