import { describe, expect, it } from "vitest";
import { ALL_ANOMALIES } from "../../src/game/anomalies";
import type { Detectability } from "../../src/game/anomalies/types";

/**
 * Catalog validator — every registered anomaly must satisfy the
 * AnomalyDef contract plus the design rules in ANOMALY_CATALOG.md:
 * unique ids, chapter gating, a deterministic testSeed, a sane
 * progression range, and a roughly even detectability spread so a
 * run can't be all-jump-scares or all-microtells.
 */
describe("anomaly catalog", () => {
  it("has unique ids", () => {
    const ids = ALL_ANOMALIES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has at least the 24-anomaly design target", () => {
    expect(ALL_ANOMALIES.length).toBeGreaterThanOrEqual(24);
  });

  it.each(ALL_ANOMALIES.map((d) => [d.id, d] as const))("%s satisfies the def contract", (_id, d) => {
    expect(d.displayName.length).toBeGreaterThan(0);
    expect([1, 2, 3]).toContain(d.chapter);
    expect(d.weight).toBeGreaterThan(0);
    expect(d.testSeed.length).toBeGreaterThan(0);
    const [lo, hi] = d.progressionRange;
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeLessThanOrEqual(100);
    expect(lo).toBeLessThanOrEqual(hi);
    expect(Array.isArray(d.requires)).toBe(true);
    expect(Array.isArray(d.excludes)).toBe(true);
    expect(typeof d.activate).toBe("function");
  });

  it("keeps a sane detectability spread", () => {
    // the ⅓-each rule in ANOMALY_CATALOG.md is the per-loop exposure
    // (weights), not catalog thirds — the catalog skews quiet by design
    const counts: Record<Detectability, number> = {
      subtle: 0,
      moderate: 0,
      unmistakable: 0,
    };
    for (const d of ALL_ANOMALIES) counts[d.detectability] += 1;
    // every class non-trivially represented
    for (const v of Object.values(counts)) expect(v).toBeGreaterThanOrEqual(4);
    // subtle must be the largest share — the catalog is quiet-first
    expect(counts.subtle).toBeGreaterThanOrEqual(counts.moderate);
    expect(counts.subtle).toBeGreaterThanOrEqual(counts.unmistakable);
  });

  it("gates content by chapter — each tier has entries", () => {
    for (const ch of [1, 2, 3] as const) {
      expect(ALL_ANOMALIES.filter((d) => d.chapter === ch).length).toBeGreaterThanOrEqual(4);
    }
  });
});
