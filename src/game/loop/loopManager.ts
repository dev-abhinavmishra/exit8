/**
 * LoopManager — the game's core state machine.
 *
 *   OPEN (in corridor, observing)
 *   → COMMIT_PENDING (crossed a commit plane: doors seal, judging)
 *   → CYCLING (airlock reset: fade + rebaseline + teleport to north airlock)
 *   → OPEN (next loop)
 *
 * Commit semantics: south airlock = "route clear" (correct iff no anomaly);
 * north airlock = "divergence logged" (correct iff anomaly active).
 */
import type { Scene } from "@babylonjs/core/scene";
import type { ConcourseWorld } from "../../world/generation/concourse";
import { LAYOUT, type DoorRig } from "../../world/generation/concourse";
import type { PlayerController } from "../../player/controller";
import type { AudioSystem } from "../../audio/audioSystem";
import type { SaveStore } from "../state/save";
import { RngStream } from "../state/rng";
import { StabilityIndex, type JudgmentResult } from "../progression/stability";
import type { AnomalyRegistry } from "../anomalies/registry";
import type { AnomalyContext, AnomalyDef, AnomalyInstance } from "../anomalies/types";
import { drawTerminal } from "../../world/generation/textures";
import { COPY } from "../../data/signage";

export type LoopPhase = "open" | "commit_pending" | "cycling" | "ended";

export interface LoopState {
  loopIndex: number;
  phase: LoopPhase;
  chapter: number;
  activeAnomaly: string | null;
  judgment: JudgmentResult | null;
  stability: number;
}

export interface LoopEvents {
  onPhaseChange?: (s: LoopState) => void;
  onJudgment?: (s: LoopState) => void;
  onFade?: (opacity: number, label: string | null) => void;
  onEnd?: (outcome: "secure" | "lost" | "practice") => void;
}

const CHAPTER_ANOMALY_RATE = [0, 0.5, 0.55, 0.6];
const CYCLE_SECONDS = 2.2;
const JUDGE_DELAY = 0.55;

export class LoopManager {
  private phase: LoopPhase = "open";
  private loopIndex = 0;
  /** correct judgments filed this run — chapters unlock on competence */
  private correctCount = 0;
  private activeDef: AnomalyDef | null = null;
  private activeInstance: AnomalyInstance | null = null;
  private cycleT = 0;
  private judgeT = 0;
  private pendingCommit: "continue" | "retreat" | null = null;
  private forcedAnomalyId: string | null = null;
  private anomalyRolls: RngStream;
  private anomalyRuntime: RngStream;
  readonly stability = new StabilityIndex();
  private baseClockMinute = 0;
  private baseClockHour = 0;

  constructor(
    private readonly scene: Scene,
    private readonly world: ConcourseWorld,
    private readonly player: PlayerController,
    private readonly audio: AudioSystem,
    private readonly save: SaveStore,
    private readonly anomalies: AnomalyRegistry,
    runSeed: string,
    private readonly events: LoopEvents = {},
    private readonly anomalyCtx: Omit<AnomalyContext, "rng" | "world" | "player" | "audio" | "scene"> = {
      reducedEffects: false,
      visualCues: true,
    },
    /** practice mode: judgments still score but the route never ends. */
    private readonly training = false,
  ) {
    this.anomalyRolls = new RngStream("loop.roll", runSeed);
    this.anomalyRuntime = new RngStream("anomaly.runtime", runSeed);
    // spawn inside the north airlock, door to corridor opens on first loop
    this.player.teleport(LAYOUT.spawn.clone(), LAYOUT.spawnYaw);
    this.world.doors.northInner.target01 = 1;
    this.updateTerminals("SHIFT BRIEFING FILED", { label: "STABILITY", value: `${this.stability.current}` });
  }

  /** Begin loop 1 — rolls (or applies a forced) first anomaly. */
  start(): void {
    this.rebaseline();
    this.updateTerminals(
      "ROUTE INTEGRITY",
      { label: COPY.airlockTerminal.prompt, value: "" },
      { label: "STABILITY", value: `${this.stability.current}` },
      { label: "LOOP", value: String(this.loopIndex).padStart(2, "0") },
    );
    this.emit();
  }

  /** Settings toggles that anomalies read — updated mid-run by App. */
  setAnomalyContext(flags: { reducedEffects: boolean; visualCues: boolean }): void {
    this.anomalyCtx.reducedEffects = flags.reducedEffects;
    this.anomalyCtx.visualCues = flags.visualCues;
  }

  /** 1 → 2 after 2 correct judgments, 2 → 3 after 4. */
  get chapter(): number {
    return Math.min(3, 1 + (this.correctCount >> 1));
  }

  get state(): LoopState {
    return {
      loopIndex: this.loopIndex,
      phase: this.phase,
      chapter: this.chapter,
      activeAnomaly: this.activeDef?.id ?? null,
      judgment: null,
      stability: this.stability.current,
    };
  }

  get phaseNow(): LoopPhase {
    return this.phase;
  }

  get currentAnomaly(): string | null {
    return this.activeDef?.id ?? null;
  }

  /** e2e/debug: force the next loop's anomaly (or "none"). */
  forceAnomaly(id: string | null): void {
    this.forcedAnomalyId = id;
  }

  /** Training runs don't die — the pause menu ends them into a report. */
  endTraining(): void {
    if (this.phase === "ended") return;
    this.phase = "ended";
    this.events.onEnd?.("practice");
    this.emit();
  }

  private updateTerminals(
    header: string,
    ...rows: { label: string; value: string; tone?: "ok" | "warn" | "bad" }[]
  ): void {
    drawTerminal(this.world.textures.terminal, { header, rows });
  }

  private emit(): void {
    this.events.onPhaseChange?.(this.state);
  }

  /** Roll the next loop's content and rebuild mutable state. */
  private rebaseline(): void {
    // cleanup previous anomaly
    this.activeInstance?.cleanup();
    this.activeInstance = null;
    this.activeDef = null;

    // restore baseline clock (hands frozen at a plausible time)
    this.world.clock.minutePivot.rotation.z = this.baseClockMinute;
    this.world.clock.hourPivot.rotation.z = this.baseClockHour;

    // roll next loop
    this.loopIndex += 1;
    // harmless scatter drifts each loop — a changed detail is not a
    // divergence; keeps memorization honest (loop.dressing stream)
    this.world.scatter.refresh(this.loopIndex);
    // the other inspector returns to his mid-corridor post — his
    // constancy is what makes him part of normal
    this.world.ambientWalker.reset();
    const rate = CHAPTER_ANOMALY_RATE[this.chapter] ?? 0.5;
    if (this.forcedAnomalyId !== null) {
      this.activeDef = this.forcedAnomalyId === "none" ? null : this.anomalies.get(this.forcedAnomalyId);
      this.forcedAnomalyId = null;
    } else {
      this.activeDef = this.anomalies.rollLoop(this.anomalyRolls, {
        chapter: this.chapter,
        stability: this.stability.current,
        anomalyRate: rate,
      });
    }

    if (this.activeDef) {
      for (const req of this.activeDef.requires) {
        if (!this.world.registry.has(req)) {
          console.warn(`anomaly ${this.activeDef.id} missing registry node ${req} — skipping`);
          this.activeDef = null;
          break;
        }
      }
    }

    if (this.activeDef) {
      this.activeInstance = this.activeDef.activate({
        scene: this.scene,
        world: this.world,
        rng: this.anomalyRuntime,
        player: this.player,
        audio: this.audio,
        reducedEffects: this.anomalyCtx.reducedEffects,
        visualCues: this.anomalyCtx.visualCues,
      });
    }
  }

  private beginCycle(commit: "continue" | "retreat"): void {
    this.phase = "commit_pending";
    this.pendingCommit = commit;
    this.judgeT = JUDGE_DELAY;
    this.player.enabled = false;
    // seal both inner doors
    this.world.doors.northInner.target01 = 0;
    this.world.doors.southInner.target01 = 0;
    this.emit();
  }

  private resolveJudgment(): void {
    if (!this.pendingCommit) return;
    // continue is correct iff route is clear; retreat iff anomalous
    const correct =
      (this.pendingCommit === "continue" && !this.activeDef) ||
      (this.pendingCommit === "retreat" && !!this.activeDef);
    const result = this.stability.judge(correct, this.chapter);
    if (correct) this.correctCount += 1;
    // training keeps the stakes visible but clamps instead of terminating
    if (this.training && result.outcome !== "continue") {
      this.stability.set(result.outcome === "secure" ? 85 : 15);
      result.outcome = "continue";
    }

    // progression bookkeeping
    const discovered = this.activeDef?.id;
    this.save.update((d) => {
      const p = d.progression;
      if (correct && this.pendingCommit === "retreat") p.anomaliesLogged += 1;
      if (!correct && this.pendingCommit === "continue") p.falseClears += 1;
      if (!correct && this.pendingCommit === "retreat") p.falseAlarms += 1;
      if (discovered && !p.discovered.includes(discovered)) p.discovered.push(discovered);
      if (this.stability.current > p.bestStability) p.bestStability = this.stability.current;
    });

    this.audio.playJudgment(correct);
    this.updateTerminals(
      correct ? "JUDGMENT ACCEPTED" : "JUDGMENT CONTESTED",
      {
        label: "FILED",
        value: this.pendingCommit === "continue" ? "ROUTE CLEAR" : "DIVERGENCE",
        tone: correct ? "ok" : "bad",
      },
      { label: "STABILITY", value: `${result.stability} (${result.delta >= 0 ? "+" : ""}${result.delta})` },
      { label: "ROUTE", value: `LOOP ${String(this.loopIndex).padStart(2, "0")}` },
    );

    this.events.onJudgment?.({
      ...this.state,
      judgment: result,
    });

    if (result.outcome !== "continue") {
      this.phase = "ended";
      this.save.update((d) => {
        d.progression.runsCompleted += 1;
        if (result.outcome === "secure") {
          d.progression.routesSecured += 1;
          d.flags.completedOnce = true;
          if (!d.progression.endings.includes("standard")) d.progression.endings.push("standard");
        }
      });
      this.events.onEnd?.(result.outcome);
      this.emit();
      return;
    }

    this.phase = "cycling";
    this.cycleT = CYCLE_SECONDS;
    this.audio.playAirlockCycle();
    this.events.onFade?.(1, correct ? "ROUTE CLEAR — CYCLING" : "DIVERGENCE LOGGED — CYCLING");
    this.emit();
  }

  private finishCycle(): void {
    this.rebaseline();
    // teleport back into the north airlock facing the corridor
    this.player.teleport(LAYOUT.spawn.clone(), LAYOUT.spawnYaw);
    this.world.doors.northInner.target01 = 1;
    this.world.doors.southInner.target01 = 0;
    this.player.enabled = true;
    this.phase = "open";
    this.events.onFade?.(0, null);
    this.updateTerminals(
      "ROUTE INTEGRITY",
      { label: COPY.airlockTerminal.prompt, value: "" },
      { label: "STABILITY", value: `${this.stability.current}` },
      { label: "LOOP", value: String(this.loopIndex).padStart(2, "0") },
    );
    this.emit();
  }

  /** Sim step. */
  update(dt: number): void {
    // door slide animation
    for (const d of [this.world.doors.northInner, this.world.doors.southInner] as DoorRig[]) {
      d.open01 += (d.target01 - d.open01) * Math.min(1, 6 * dt);
      const half = 1.2;
      d.left.position.x = -half / 2 - d.open01 * half * 0.92;
      d.right.position.x = half / 2 + d.open01 * half * 0.92;
      d.leftCollider.position.x = d.left.position.x;
      d.rightCollider.position.x = d.right.position.x;
    }

    if (this.phase === "open") {
      const p = this.player.position;
      if (p.z <= LAYOUT.commitNorthZ) this.beginCycle("retreat");
      else if (p.z >= LAYOUT.commitSouthZ) this.beginCycle("continue");
      // auto-open the south door when the player is near it (they still must
      // cross the commit plane to file)
      if (p.z > LAYOUT.southAirlock.z0 - 1.2) this.world.doors.southInner.target01 = 1;
    } else if (this.phase === "commit_pending") {
      this.judgeT -= dt;
      if (this.judgeT <= 0) this.resolveJudgment();
    } else if (this.phase === "cycling") {
      this.cycleT -= dt;
      if (this.cycleT <= 0) this.finishCycle();
    }

    this.activeInstance?.update(dt);

    // baseline clock: slow real-time sweep so the corridor feels alive
    this.baseClockMinute -= dt * 0.0016;
    if (!this.activeDef || this.activeDef.id !== "clock.reverse") {
      this.world.clock.minutePivot.rotation.z = this.baseClockMinute;
      this.world.clock.hourPivot.rotation.z = this.baseClockHour - this.baseClockMinute / 60;
    }
  }
}
