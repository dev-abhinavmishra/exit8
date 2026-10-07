/** Quality tiers + auto-detection. Budgets in docs/OPTIMIZATION.md. */
import type { QualityName } from "../accessibility/settings";

export type ResolvedTier = "low" | "medium" | "high" | "ultra";

export interface TierSpec {
  tier: ResolvedTier;
  /** engine hardware scaling level (1 = native, >1 = lower res) */
  hardwareScaling: number;
  /** shadow map size; 0 = shadows off */
  shadowMapSize: number;
  /** post-processing enabled */
  post: boolean;
  /** simultaneous shadow-casting lights allowed */
  shadowCasters: number;
  /** pixel-ratio ceiling */
  maxPixelRatio: number;
}

export const TIERS: Record<ResolvedTier, TierSpec> = {
  low: {
    tier: "low",
    hardwareScaling: 2.0,
    shadowMapSize: 0,
    post: false,
    shadowCasters: 0,
    maxPixelRatio: 1,
  },
  medium: {
    tier: "medium",
    hardwareScaling: 1.5,
    shadowMapSize: 1024,
    post: false,
    shadowCasters: 1,
    maxPixelRatio: 1.5,
  },
  high: {
    tier: "high",
    hardwareScaling: 1.0,
    shadowMapSize: 2048,
    post: true,
    shadowCasters: 2,
    maxPixelRatio: 2,
  },
  ultra: {
    tier: "ultra",
    hardwareScaling: 0.75,
    shadowMapSize: 2048,
    post: true,
    shadowCasters: 3,
    maxPixelRatio: 2,
  },
};

export interface CapabilityReport {
  webgpu: boolean;
  webgl2: boolean;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number;
  isMobileUA: boolean;
  pixelRatio: number;
}

export function detectCapabilities(): CapabilityReport {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const webgpu = typeof nav !== "undefined" && "gpu" in nav;
  let webgl2 = false;
  try {
    const c = document.createElement("canvas");
    webgl2 = c.getContext("webgl2") !== null;
  } catch {
    webgl2 = false;
  }
  const ua = nav?.userAgent ?? "";
  return {
    webgpu,
    webgl2,
    deviceMemoryGb:
      typeof (nav as (Navigator & { deviceMemory?: number }) | undefined)?.deviceMemory === "number"
        ? ((nav as Navigator & { deviceMemory?: number }).deviceMemory as number)
        : null,
    hardwareConcurrency: nav?.hardwareConcurrency ?? 4,
    isMobileUA: /Android|iPhone|iPad|iPod|Mobile/i.test(ua),
    pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
  };
}

/** Heuristic auto tier. Deliberately conservative: frame consistency first. */
export function resolveTier(quality: QualityName, caps: CapabilityReport): ResolvedTier {
  if (quality !== "auto") return quality;
  const mem = caps.deviceMemoryGb ?? 4;
  const cores = caps.hardwareConcurrency;
  if (caps.isMobileUA) {
    return mem >= 6 && cores >= 8 ? "medium" : "low";
  }
  if (mem >= 8 && cores >= 8) return caps.webgpu ? "ultra" : "high";
  if (mem >= 4 && cores >= 4) return "medium";
  return "low";
}
