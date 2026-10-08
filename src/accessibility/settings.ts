/** Settings + accessibility model. Persisted in the versioned save blob. */

export type QualityName = "auto" | "low" | "medium" | "high" | "ultra";
export type EngineKind = "auto" | "webgl" | "webgpu";

export interface Settings {
  video: {
    quality: QualityName;
    engine: EngineKind;
    fov: number; // radians-ish degrees 60–100
    renderScale: number; // 0.5–1, applied on top of tier default
  };
  controls: {
    sensitivity: number; // 0.2–3 multiplier
    invertY: boolean;
    bobAmount: number; // 0–1 head-bob scale
    keyForward: string;
    keyBack: string;
    keyLeft: string;
    keyRight: string;
    keyInteract: string;
    keyPause: string;
    keyGlance: string;
  };
  audio: {
    master: number; // 0–1
    ambience: number;
    footsteps: number;
    anomaly: number;
    ui: number;
    muted: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    captions: boolean;
    visualSoundCues: boolean;
    highContrastCommitZones: boolean;
    reduceStartle: boolean;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  video: {
    quality: "auto",
    engine: "auto",
    fov: 75,
    renderScale: 1,
  },
  controls: {
    sensitivity: 1,
    invertY: false,
    bobAmount: 0.6,
    keyForward: "KeyW",
    keyBack: "KeyS",
    keyLeft: "KeyA",
    keyRight: "KeyD",
    keyInteract: "KeyE",
    keyPause: "Escape",
    keyGlance: "KeyQ",
  },
  audio: {
    master: 0.9,
    ambience: 0.8,
    footsteps: 0.9,
    anomaly: 1,
    ui: 0.8,
    muted: false,
  },
  accessibility: {
    reducedMotion: false,
    captions: true,
    visualSoundCues: true,
    highContrastCommitZones: false,
    reduceStartle: false,
  },
};

/** Deep-merge stored settings over defaults so new fields migrate cleanly. */
export function normalizeSettings(raw: unknown): Settings {
  const out = structuredClone(DEFAULT_SETTINGS);
  if (typeof raw !== "object" || raw === null) return out;
  const src = raw as Record<string, unknown>;
  for (const section of Object.keys(out) as (keyof Settings)[]) {
    const s = src[section];
    if (typeof s !== "object" || s === null) continue;
    const srcObj = s as Record<string, unknown>;
    const dstObj = out[section] as Record<string, unknown>;
    for (const k of Object.keys(dstObj)) {
      const v = srcObj[k];
      if (typeof v === typeof dstObj[k] || (typeof dstObj[k] === "number" && typeof v === "number")) {
        dstObj[k] = v;
      }
    }
  }
  return out;
}
