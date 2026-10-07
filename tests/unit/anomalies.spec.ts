import { describe, expect, it } from "vitest";
import { AnomalyRegistry } from "../../src/game/anomalies/registry";
import { RngStream } from "../../src/game/state/rng";
import { clockReverse } from "../../src/game/anomalies/clockReverse";
import { doorwayExtra } from "../../src/game/anomalies/doorwayExtra";
import { footstepsExtra } from "../../src/game/anomalies/footstepsExtra";
import type { AnomalyDef } from "../../src/game/anomalies/types";

const registry = () => {
  const r = new AnomalyRegistry();
  for (const d of [clockReverse, doorwayExtra, footstepsExtra]) r.register(d);
  return r;
};

describe("anomaly registry", () => {
  it("ids are unique and defs carry required metadata", () => {
    const r = registry();
    const ids = r.list().map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of r.list()) {
      expect(d.testSeed.length).toBeGreaterThan(0);
      expect(d.requires.length).toBeGreaterThan(0);
      expect(d.progressionRange[0]).toBeLessThanOrEqual(d.progressionRange[1]);
      expect(d.weight).toBeGreaterThan(0);
      expect(["subtle", "moderate", "unmistakable"]).toContain(d.detectability);
    }
  });

  it("same seed → same anomaly sequence (reproducible runs)", () => {
    const seq = (seed: string) => {
      const r = registry();
      const stream = new RngStream("loop.roll", seed);
      return Array.from(
        { length: 8 },
        () => r.rollLoop(stream, { chapter: 1, stability: 40, anomalyRate: 0.5 })?.id ?? "clean",
      );
    };
    expect(seq("determinism")).toEqual(seq("determinism"));
    expect(seq("determinism")).not.toEqual(seq("other-seed"));
  });

  it("anomalyRate 0 always yields clean loops; rate 1 always yields an anomaly", () => {
    const r = registry();
    const s1 = new RngStream("loop.roll", "r0");
    for (let i = 0; i < 10; i++) {
      expect(r.rollLoop(s1, { chapter: 1, stability: 40, anomalyRate: 0 })).toBeNull();
    }
    const s2 = new RngStream("loop.roll", "r1");
    for (let i = 0; i < 10; i++) {
      expect(r.rollLoop(s2, { chapter: 1, stability: 40, anomalyRate: 1 })).not.toBeNull();
    }
  });

  it("chapter gating excludes later-chapter anomalies", () => {
    const later: AnomalyDef = {
      ...clockReverse,
      id: "test.later",
      chapter: 3,
      requires: ["clock.face"],
    };
    const r = new AnomalyRegistry();
    r.register(later);
    const s = new RngStream("loop.roll", "gate");
    expect(r.pick(s, { chapter: 1, stability: 50 })).toBeNull();
    expect(r.pick(s, { chapter: 3, stability: 50 })?.id).toBe("test.later");
  });

  it("progression-range gating excludes out-of-band anomalies", () => {
    const gated: AnomalyDef = {
      ...footstepsExtra,
      id: "test.gated",
      progressionRange: [80, 100],
    };
    const r = new AnomalyRegistry();
    r.register(gated);
    const s = new RngStream("loop.roll", "range");
    expect(r.pick(s, { chapter: 1, stability: 40 })).toBeNull();
    expect(r.pick(s, { chapter: 1, stability: 90 })?.id).toBe("test.gated");
  });

  it("excludes tags are declared, not co-activated (registry invariants)", () => {
    // exclusion is enforced structurally: one anomaly per loop, so two defs
    // sharing a tag can never co-run — assert the tags exist and are sane.
    for (const d of registry().list()) {
      expect(Array.isArray(d.excludes)).toBe(true);
      expect(d.excludes.every((t) => typeof t === "string" && t.length > 0)).toBe(true);
    }
  });
});
