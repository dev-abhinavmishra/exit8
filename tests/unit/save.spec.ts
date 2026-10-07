import { describe, expect, it } from "vitest";
import { SaveStore, SAVE_KEY, SCHEMA_VERSION } from "../../src/game/state/save";
import { normalizeSettings, DEFAULT_SETTINGS } from "../../src/accessibility/settings";

function memStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    map,
  };
}

describe("save store", () => {
  it("starts from defaults when empty", () => {
    const s = new SaveStore(memStorage());
    expect(s.get().version).toBe(SCHEMA_VERSION);
    expect(s.get().settings).toEqual(DEFAULT_SETTINGS);
    expect(s.get().progression.bestStability).toBe(0);
  });

  it("persists updates", () => {
    const store = memStorage();
    const s = new SaveStore(store);
    s.update((d) => {
      d.progression.bestStability = 77;
      d.settings.video.fov = 91;
    });
    const s2 = new SaveStore(store);
    expect(s2.get().progression.bestStability).toBe(77);
    expect(s2.get().settings.video.fov).toBe(91);
  });

  it("quarantines corrupt JSON and resets safely", () => {
    const store = memStorage({ [SAVE_KEY]: "{not json!!" });
    const s = new SaveStore(store);
    expect(s.get().flags.saveResetNotice).toBe(true);
    expect(store.getItem(`${SAVE_KEY}.corrupt`)).toBe("{not json!!");
    expect(s.consumeResetNotice()).toBe(true);
    expect(s.consumeResetNotice()).toBe(false);
  });

  it("rejects future schema versions without crashing", () => {
    const store = memStorage({ [SAVE_KEY]: JSON.stringify({ version: 99, settings: {} }) });
    const s = new SaveStore(store);
    expect(s.get().version).toBe(SCHEMA_VERSION);
    expect(s.get().flags.saveResetNotice).toBe(true);
  });

  it("normalizes partial settings over defaults", () => {
    const merged = normalizeSettings({ video: { fov: 88, nonsense: true }, audio: { master: 0.3 } });
    expect(merged.video.fov).toBe(88);
    expect(merged.audio.master).toBe(0.3);
    expect(merged.video.quality).toBe(DEFAULT_SETTINGS.video.quality);
    expect(merged.controls.keyForward).toBe(DEFAULT_SETTINGS.controls.keyForward);
  });

  it("migrates a v1 blob with partial progression", () => {
    const blob = {
      version: 1,
      settings: { accessibility: { captions: false } },
      progression: { bestStability: 61, discovered: ["clock.reverse", 42] },
      flags: { completedOnce: true },
    };
    const store = memStorage({ [SAVE_KEY]: JSON.stringify(blob) });
    const s = new SaveStore(store);
    expect(s.get().progression.bestStability).toBe(61);
    expect(s.get().progression.discovered).toEqual(["clock.reverse"]);
    expect(s.get().flags.completedOnce).toBe(true);
    expect(s.get().settings.accessibility.captions).toBe(false);
  });

  it("resetAll wipes and returns to defaults", () => {
    const store = memStorage();
    const s = new SaveStore(store);
    s.update((d) => (d.progression.bestStability = 90));
    s.resetAll();
    expect(s.get().progression.bestStability).toBe(0);
    const s2 = new SaveStore(store);
    expect(s2.get().progression.bestStability).toBe(0);
  });
});

describe("progression (stability)", () => {
  it("correct judgments raise, mistakes lower, bounds hold", async () => {
    const { StabilityIndex } = await import("../../src/game/progression/stability");
    const st = new StabilityIndex();
    expect(st.current).toBe(40);
    const r1 = st.judge(true, 1);
    expect(r1.correct).toBe(true);
    expect(r1.stability).toBe(52);
    const r2 = st.judge(false, 1);
    expect(r2.stability).toBe(36);
    st.set(200);
    expect(st.current).toBe(100);
    st.set(-10);
    expect(st.current).toBe(0);
    expect(st.judge(true, 1).outcome === "secure" || st.current > 0).toBe(true);
  });

  it("outcome flips at the bounds", async () => {
    const { StabilityIndex } = await import("../../src/game/progression/stability");
    const st = new StabilityIndex();
    st.set(95);
    expect(st.judge(true, 1).outcome).toBe("secure");
    st.set(10);
    expect(st.judge(false, 1).outcome).toBe("lost");
  });
});

describe("quality resolution", () => {
  it("explicit quality wins over auto detection", async () => {
    const { resolveTier } = await import("../../src/engine/quality");
    const caps = {
      webgpu: true,
      webgl2: true,
      deviceMemoryGb: 16,
      hardwareConcurrency: 16,
      isMobileUA: false,
      pixelRatio: 2,
    };
    expect(resolveTier("low", caps)).toBe("low");
    expect(resolveTier("ultra", caps)).toBe("ultra");
  });

  it("auto picks conservative tiers by device", async () => {
    const { resolveTier } = await import("../../src/engine/quality");
    const weak = {
      webgpu: false,
      webgl2: true,
      deviceMemoryGb: 3,
      hardwareConcurrency: 4,
      isMobileUA: true,
      pixelRatio: 2,
    };
    const strong = {
      webgpu: true,
      webgl2: true,
      deviceMemoryGb: 16,
      hardwareConcurrency: 12,
      isMobileUA: false,
      pixelRatio: 2,
    };
    expect(["low", "medium"]).toContain(resolveTier("auto", weak));
    expect(["high", "ultra"]).toContain(resolveTier("auto", strong));
    expect(resolveTier("auto", { ...weak, isMobileUA: false })).toBe("low");
  });
});
