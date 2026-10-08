/**
 * Data-driven anomaly modules. Each definition is self-contained metadata +
 * hooks; the registry validates `requires` against the world's named nodes
 * before activation so an anomaly can never silently half-exist.
 */
import type { Scene } from "@babylonjs/core/scene";
import type { ConcourseWorld } from "../../world/generation/concourse";
import type { RngStream } from "../state/rng";
import type { PlayerController } from "../../player/controller";
import type { AudioSystem } from "../../audio/audioSystem";

export type AnomalyCategory = "object" | "spatial" | "lighting" | "sound" | "character" | "systemic";
export type Detectability = "subtle" | "moderate" | "unmistakable";

export interface AnomalyContext {
  scene: Scene;
  world: ConcourseWorld;
  /** runtime-variance stream for this loop only (seeded) */
  rng: RngStream;
  player: PlayerController;
  audio: AudioSystem;
  /** true when reduced-motion/reduced-effects accessibility is on */
  reducedEffects: boolean;
  /** visual accessibility cues allowed (footsteps.extra condensation etc.) */
  visualCues: boolean;
  /** dock the run's stability — floored so a scare can't silently end it */
  penalize?(amount: number): void;
}

export interface AnomalyInstance {
  /** per-loop housekeeping; called from the sim step */
  update(dt: number): void;
  /** restore the world to baseline — always idempotent */
  cleanup(): void;
}

export interface AnomalyDef {
  id: string;
  displayName: string; // debug/catalog name
  chapter: 1 | 2 | 3;
  category: AnomalyCategory;
  detectability: Detectability;
  /** weighted-bag pick weight */
  weight: number;
  /** stability range (inclusive) where this anomaly may appear */
  progressionRange: [number, number];
  /** registry node names that must exist */
  requires: string[];
  /** tags that can't co-run (e.g. two clock anomalies) */
  excludes: string[];
  /** deterministic seed used by the validator/tests */
  testSeed: string;
  /** threat: can this anomaly cause a hard reset? */
  dangerous: boolean;
  activate(ctx: AnomalyContext): AnomalyInstance;
}
