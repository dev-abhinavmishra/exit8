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
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { buildFigure, type Figure } from "../../world/figures";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { ConcourseWorld } from "../../world/generation/concourse";
import { LAYOUT, type DoorRig, type LightZone } from "../../world/generation/concourse";
import type { PlayerController } from "../../player/controller";
import type { AudioSystem } from "../../audio/audioSystem";
import type { SaveStore } from "../state/save";
import { RngStream } from "../state/rng";
import { StabilityIndex, type JudgmentResult } from "../progression/stability";
import type { AnomalyRegistry } from "../anomalies/registry";
import type { AnomalyContext, AnomalyDef, AnomalyInstance } from "../anomalies/types";
import { drawTerminal, drawSign } from "../../world/generation/textures";
import { COPY, SIGNS } from "../../data/signage";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";

export type LoopPhase = "open" | "commit_pending" | "cycling" | "ended";

export interface LoopState {
  loopIndex: number;
  phase: LoopPhase;
  chapter: number;
  activeAnomaly: string | null;
  judgment: JudgmentResult | null;
  stability: number;
  /** deepest pass-streak the shift reached (the cap plate's peak number) */
  bestPass: number;
}

export interface LoopEvents {
  onPhaseChange?: (s: LoopState) => void;
  onJudgment?: (s: LoopState) => void;
  onFade?: (opacity: number, label: string | null, tone?: "dark" | "light") => void;
  /** a dangerous anomaly physically reached the auditor — report names it */
  onContact?: (def: AnomalyDef) => void;
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
  /** consecutive correct filings — the diegetic PASS counter's number;
   *  a wrong call resets it to 0 like the original's exit counter */
  private streak = 0;
  /** deepest the streak reached — the report's BEST PASS row */
  private bestPass = 0;
  private activeDef: AnomalyDef | null = null;
  private activeInstance: AnomalyInstance | null = null;
  private cycleT = 0;
  private judgeT = 0;
  private pendingCommit: "continue" | "retreat" | null = null;
  private forcedAnomalyId: string | null = null;
  /** secure-ending payoff: the sealed south cap drops to daylight.
   * -1 = inactive; else seconds since the reveal began. */
  private endingT = -1;
  private endingCap: AbstractMesh | null = null;
  private endingCapY0 = 0;
  private endingLight: PointLight | null = null;
  private endingOutcome: "secure" | "lost" | null = null;
  /** secure-ending walk-out: which cap opened, and the z threshold
   *  past it that counts as stepping into the light */
  private endingSide: "north" | "south" = "south";
  private endingFigure: Figure | null = null;
  private endingCrossZ = 0;
  private endingOpenFired = false;
  private endingWalked = false;
  /** brown-out: while a judgment resolves the corridor's feed dips —
   *  lamps, fixture emissive and shafts ease down and breathe back as
   *  the next loop opens. brown01 0 = bright, 1 = dipped; the snapshot
   *  holds each zone's pre-dip level for the multiply. */
  private brown01 = 0;
  private brownTarget = 0;
  private brownBase: {
    zones: [LightZone, number, number[]][];
    emissive: Color3;
    shaftAlpha: number;
  } | null = null;
  private anomalyRolls: RngStream;
  private anomalyRuntime: RngStream;
  /** PA announcements — the corridor's recurring voice; first one
   *  lands early so the run opens under it, then every ~45-85s */
  private paRng: RngStream;
  private paT = 0;
  /** Distant train — the working line beyond the walls; rumbles past
   *  every ~90-150s so the loop reads as one passage in a live system */
  private trainRng: RngStream;
  private trainT = 0;
  /** Condensation plinks off the vent grilles — rare, the corridor sweats */
  private dripRng: RngStream;
  /** the commuter's presence roll — one draw per loop, keeps his
   *  mostly-there rhythm deterministic per seed */
  private commuterRng: RngStream;
  private dripT = 0;
  readonly stability = new StabilityIndex();
  /** last announced door targets — fires playDoorSlide on flips */
  private prevDoorTargets = new Map<DoorRig, number>();
  private domeMats = new Map<string, StandardMaterial>();
  private statusPulseT = 0;

  private domeMat(key: string): StandardMaterial | null {
    const mesh = this.world.registry.mesh(key);
    const m = mesh?.material;
    const mat = m instanceof StandardMaterial ? m : null;
    if (mat) this.domeMats.set(key, mat);
    return mat;
  }
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
    this.paRng = new RngStream("audio.pa", runSeed);
    this.commuterRng = new RngStream("loop.commuter", runSeed);
    this.paT = 10 + this.paRng.range(0, 12);
    this.trainRng = new RngStream("audio.train", runSeed);
    this.trainT = 26 + this.trainRng.range(0, 30);
    this.dripRng = new RngStream("audio.drip", runSeed);
    this.dripT = 18 + this.dripRng.range(0, 40);
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
      bestPass: this.bestPass,
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
    // the pass counter on the south cap keeps count in-world — the
    // exit-number equivalent: consecutive correct filings, reset to 01
    // by a wrong call, readable at the commit door
    {
      const spec = SIGNS.find((s) => s.id === "sign.attempt");
      const t = this.world.materials.sign.get("sign.attempt")?.diffuseTexture as DynamicTexture | undefined;
      if (spec && t)
        drawSign(t, { ...spec, title: `PASS ${String(Math.min(99, this.streak + 1)).padStart(2, "0")}` });
    }
    // harmless scatter drifts each loop — a changed detail is not a
    // divergence; keeps memorization honest (loop.dressing stream)
    this.world.scatter.refresh(this.loopIndex);
    // the other inspector returns to his mid-corridor post — his
    // constancy is what makes him part of normal
    this.world.ambientWalker.reset();
    // the commuter keeps his own baseroll: present most loops, absent
    // sometimes — a learnable rhythm, not a divergence either way
    const commuterPresent = this.commuterRng.chance(0.65);
    // on some loops he is up checking the board — a second baseline
    // habit, so a commuter in the wrong place at the wrong pose reads
    // as divergence rather than absence
    const commuterMode = commuterPresent && this.commuterRng.chance(0.3) ? "board" : "seat";
    this.world.commuter.reset(commuterPresent, commuterMode);
    // loop 1 is always clean — the first corridor teaches the baseline
    // the way Exit 8's does; anomalies start rolling on loop 2.
    // the odds lean wrong as the route deepens — late loops are rarely
    // free passes (the original's quiet escalation), capped at 0.8
    const base = CHAPTER_ANOMALY_RATE[this.chapter] ?? 0.5;
    const rate = this.loopIndex === 1 ? 0 : Math.min(0.8, base + (this.loopIndex - 2) * 0.025);
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
        penalize: (amount) => {
          // a contact scare costs real judgment room but never ends the
          // run on its own — endings stay verdicts of the commit planes
          this.stability.set(Math.max(1, this.stability.current - amount));
          if (this.activeDef) this.events.onContact?.(this.activeDef);
        },
        streak: this.streak,
      });
    }
  }

  private beginCycle(commit: "continue" | "retreat"): void {
    this.phase = "commit_pending";
    this.pendingCommit = commit;
    this.judgeT = JUDGE_DELAY;
    this.player.enabled = false;
    // seal both inner doors — and the corridor's feed dips while it
    // judges (the brown-out rides out under the cycle veil)
    this.dipLights(true);
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
    this.streak = correct ? this.streak + 1 : 0;
    if (this.streak > this.bestPass) this.bestPass = this.streak;
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
      { label: "PASS", value: `${String(this.streak + 1).padStart(2, "0")}`, tone: correct ? "ok" : "bad" },
    );

    this.events.onJudgment?.({
      ...this.state,
      judgment: result,
    });

    if (result.outcome !== "continue") {
      this.phase = "ended";
      this.save.update((d) => {
        d.progression.runsCompleted += 1;
        d.progression.bestPass = Math.max(d.progression.bestPass, this.bestPass);
        if (result.outcome === "secure") {
          d.progression.routesSecured += 1;
          d.flags.completedOnce = true;
          if (!d.progression.endings.includes("standard")) d.progression.endings.push("standard");
        }
      });
      if (result.outcome === "secure") {
        this.beginSecureEnding(this.pendingCommit === "retreat" ? "north" : "south");
      } else if (result.outcome === "lost") {
        this.beginLostEnding(this.pendingCommit === "retreat" ? "north" : "south");
      } else this.events.onEnd?.(result.outcome);
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
    this.dipLights(false);
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
      { label: "PASS", value: String(this.streak + 1).padStart(2, "0") },
    );
    this.emit();
  }

  /**
   * The secured-route payoff: the far cap — sealed steel the whole
   * shift — lowers into the floor and the vestibule fills with white.
   * The one time the loop leads somewhere. Plays ~3s in-world, then
   * the shift report takes over.
   */
  /** Corridor brown-out. On: snapshot lamp + fixture state, ease down.
   *  Off: ramp back to the snapshot — called before rebaseline so a
   *  lighting anomaly's own restore still lands on the true base. */
  private dipLights(on: boolean): void {
    if (on && !this.brownBase) {
      const tl = this.world.materials.trofferLit;
      const sh = this.world.materials.lightShaft;
      this.brownBase = {
        zones: this.world.zones.map(
          (z) =>
            [z, z.point.intensity, z.extraLights.map((l) => l.intensity)] as [LightZone, number, number[]],
        ),
        emissive: tl.emissiveColor.clone(),
        shaftAlpha: sh.alpha,
      };
    }
    this.brownTarget = on ? 1 : 0;
  }

  /** Applies the current dip level as a multiply over the snapshot. */
  private applyBrown(): void {
    const b = this.brownBase;
    if (!b) return;
    const f = 1 - 0.66 * this.brown01;
    for (const [z, v, ex] of b.zones) {
      z.point.intensity = v * f;
      z.extraLights.forEach((l, i) => (l.intensity = (ex[i] ?? 0) * f));
    }
    this.world.materials.trofferLit.emissiveColor = b.emissive.scale(1 - 0.72 * this.brown01);
    this.world.materials.lightShaft.alpha = b.shaftAlpha * (1 - 0.7 * this.brown01);
    if (this.brown01 === 0 && this.brownTarget === 0) this.brownBase = null;
  }

  private beginSecureEnding(side: "north" | "south"): void {
    const cap = this.world.registry.mesh(`al.${side}.cap`);
    this.endingCap = cap;
    this.endingCapY0 = cap.position.y;
    // the reveal plays at the cap the player just filed at
    const endZ = side === "south" ? LAYOUT.southAirlock.z1 : LAYOUT.northAirlock.z0;
    const dir = side === "south" ? -1 : 1; // cap → player direction
    const into = -dir; // cap → void beyond
    const w = LAYOUT.airlockWidth;
    const h = LAYOUT.corridor.height;
    this.endingSide = side;
    this.endingCrossZ = endZ + into * 0.55;
    this.endingOpenFired = false;
    this.endingWalked = false;
    // the exit throat: a dark floor and a flight of step silhouettes
    // rising into a white glow — stairs up to the surface
    const dark = new StandardMaterial("ending.dark.mat", this.scene);
    dark.disableLighting = true;
    dark.diffuseColor = new Color3(0.02, 0.02, 0.02);
    const glowZ = endZ + into * 1.7;
    const floor = CreateBox("ending.floor", { width: w - 0.1, height: 0.05, depth: 1.75 }, this.scene);
    floor.material = dark;
    floor.position = new Vector3(0, -0.025, endZ + into * 0.9);
    for (let i = 0; i < 4; i++) {
      const sh = 0.19 * (i + 1); // each tread's top height
      const step = CreateBox(`ending.step.${i}`, { width: w - 0.4, height: sh, depth: 0.42 }, this.scene);
      step.material = dark;
      step.position = new Vector3(0, sh / 2, endZ + into * (0.34 + i * 0.42));
    }
    // a handrail climbing the flight — the one silhouette that
    // reads instantly as "stairwell" against the light
    const rail = CreateBox("ending.rail", { width: 0.05, height: 0.05, depth: 2.1 }, this.scene);
    rail.material = dark;
    rail.position = new Vector3(-(w / 2 - 0.32), 1.18, endZ + into * 1.0);
    rail.rotation.x = -into * 0.62;
    const post = CreateBox("ending.railpost", { width: 0.05, height: 0.78, depth: 0.05 }, this.scene);
    post.material = dark;
    post.position = new Vector3(-(w / 2 - 0.32), 0.42, endZ + into * 0.36);
    // the stairwell is a real throat, not a flat: concrete cheeks
    // flank the flight so stepping through reads as a space — and no
    // void shows past the stair edges or above the glow
    for (const sx of [-1, 1]) {
      const cheek = CreateBox(`ending.cheek.${sx}`, { width: 0.12, height: 3.6, depth: 2.5 }, this.scene);
      cheek.material = dark;
      cheek.position = new Vector3((sx * (w - 0.06)) / 2, 1.8, endZ + into * 1.25);
    }
    const soffit = CreateBox("ending.soffit", { width: w + 0.2, height: 0.12, depth: 2.5 }, this.scene);
    soffit.material = dark;
    soffit.position = new Vector3(0, 3.14, endZ + into * 1.25);
    // the daylight beyond: not a card — a hot core low in the opening
    // (the sky past the stair head) falling off to warm brown edges,
    // with a brighter lane up the middle where the shaft of light is
    const glow = CreatePlane("ending.glow", { width: w + 0.2, height: h + 0.3 }, this.scene);
    const mat = new StandardMaterial("ending.glow.mat", this.scene);
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    const gtx = new DynamicTexture("ending.glow.tex", { width: 256, height: 512 }, this.scene, false);
    const gc = gtx.getContext();
    const grad = gc.createRadialGradient(128, 300, 24, 128, 300, 330);
    grad.addColorStop(0, "rgb(255,253,244)");
    grad.addColorStop(0.42, "rgb(240,226,196)");
    grad.addColorStop(0.78, "rgb(122,102,66)");
    grad.addColorStop(1, "rgb(24,20,12)");
    gc.fillStyle = grad;
    gc.fillRect(0, 0, 256, 512);
    const shaftG = gc.createLinearGradient(0, 0, 0, 512);
    shaftG.addColorStop(0, "rgba(255,255,246,0.85)");
    shaftG.addColorStop(0.55, "rgba(244,230,198,0.25)");
    shaftG.addColorStop(1, "rgba(0,0,0,0)");
    gc.fillStyle = shaftG;
    gc.fillRect(92, 0, 72, 512);
    gtx.update();
    mat.emissiveTexture = gtx;
    glow.material = mat;
    glow.position = new Vector3(0, h / 2 + 0.3, glowZ);
    glow.rotation.y = side === "south" ? Math.PI : 0;
    this.endingLight = new PointLight("ending.light", new Vector3(0, 1.9, endZ + dir * 0.9), this.scene);
    this.endingLight.diffuse = new Color3(1.0, 0.95, 0.84);
    this.endingLight.intensity = 0;
    this.endingLight.range = 11;
    this.endingOutcome = "secure";
    this.endingT = 0;
    const at = new Vector3(0, 1.6, endZ + dir);
    this.audio.playChime(at);
    this.audio.caption("the far end opens onto daylight", at);
  }

  /**
   * The lost-route mirror: the lamps across the whole corridor drown
   * at once, and where the sealed cap stood a moment ago there is now
   * a person facing you. The corridor stays playable — reaching it IS
   * the ending (16s fallback), then the shift report.
   */
  private beginLostEnding(side: "north" | "south"): void {
    // kill the brown-out restore first — its snapshot would relight the
    // drowned corridor mid-walk
    this.brown01 = this.brownTarget = 0;
    this.brownBase = null;
    for (const z of this.world.zones) {
      z.point.intensity = z.point.intensity * 0.05;
      for (const l of z.extraLights) l.intensity = l.intensity * 0.05;
    }
    const endZ = side === "south" ? LAYOUT.southAirlock.z1 : LAYOUT.northAirlock.z0;
    const dir = side === "south" ? -1 : 1;
    // barely-seen silhouette: a whisper of cold emissive, no light
    // dependency — the figure is just barely there in the drowned
    // corridor, which is what makes it wrong
    const figMat = new StandardMaterial("ending.figure.mat", this.scene);
    figMat.disableLighting = true;
    figMat.emissiveColor = new Color3(0.15, 0.17, 0.22);
    const fig = buildFigure(this.scene, this.world.root, "ending.figure", {
      kind: "silhouette",
      material: figMat,
    });
    fig.root.position = new Vector3(0, 0, endZ + dir * 0.35);
    fig.root.rotation.y = side === "south" ? Math.PI : 0;
    this.endingFigure = fig;
    this.endingSide = side;
    this.endingOpenFired = false;
    this.endingWalked = false;
    // the doors you just filed at part on their own — the drowned
    // vestibule opens and the way to it is the walk you have to make
    this.world.doors[side === "south" ? "southInner" : "northInner"].target01 = 1;

    this.endingOutcome = "lost";
    this.endingT = 0;
    // the ambient inspector is gone with the light — the figure ahead
    // is the only thing in the drowned corridor
    this.world.ambientWalker.setMode("absent");
    // the corridor goes dead quiet as it drowns — silence is the scare
    this.audio.hushAmbience();
    const at = new Vector3(0, 1.6, endZ + dir);
    this.audio.playGroan(at);
    this.audio.caption("it was always the same corridor", at);
  }

  private updateEnding(dt: number): void {
    this.endingT += dt;
    if (this.endingOutcome === "lost") {
      // the drowned corridor stays playable — reaching the figure IS
      // the ending (the mirror of stepping into the light on secure)
      if (!this.endingOpenFired && this.endingT > 1.4) {
        this.endingOpenFired = true;
        this.player.enabled = true;
      }
      const fig = this.endingFigure;
      if (fig) {
        const dx = this.player.position.x - fig.root.position.x;
        const dz = this.player.position.z - fig.root.position.z;
        // its head keeps finding you on the walk in — the only thing
        // that moves in the drowned corridor
        const s = this.endingSide === "south" ? -1 : 1;
        fig.headPivot.rotation.y = Math.min(Math.max(Math.atan2(s * dx, s * dz), -1.3), 1.3);
        if (this.endingOpenFired && !this.endingWalked && dx * dx + dz * dz < 1.35 * 1.35) {
          this.endingWalked = true;
          this.endingT = 0;
          this.player.enabled = false;
          this.player.jolt(0.7);
          const at = fig.root.position.clone().add(new Vector3(0, 1.6, 0));
          this.audio.playGroan(at);
          this.audio.caption("it was waiting for you", at);
          this.events.onFade?.(1, null);
        }
      }
      if (!this.endingWalked && this.endingT > 16) {
        this.endingT = -1;
        this.events.onEnd?.("lost");
      } else if (this.endingWalked && this.endingT > 0.9) {
        this.endingT = -1;
        this.events.onEnd?.("lost");
      }
      return;
    }
    const h = LAYOUT.corridor.height;
    // blast-door drop: slow ease-out over ~2.4s — the player watches
    // the seal sink and the light widen; slight early hold
    const t = Math.max(0, this.endingT - 0.4);
    const p = Math.min(1, t / 2.4);
    const e = 1 - (1 - p) * (1 - p);
    if (this.endingCap) this.endingCap.position.y = this.endingCapY0 - e * (h + 0.5);
    if (this.endingLight) this.endingLight.intensity = e * 4.4;

    // the cap is down — hand control back and let the player step into
    // the light. The cap collider dies with it so the doorway is real.
    if (!this.endingOpenFired && this.endingT > 2.9) {
      this.endingOpenFired = true;
      this.player.enabled = true;
      const col = this.world.colliders.find((c) => c.name === `al.${this.endingSide}.capCol`);
      col?.setEnabled(false);
      // the dropped seal lands — felt, not just seen
      this.player.jolt(0.45);
      this.audio.playClang(this.player.position.clone().add(new Vector3(0, 0.4, 0)));
      this.audio.caption("the way out is open", this.player.position.clone());
    }
    if (!this.endingWalked) {
      const z = this.player.position.z;
      const crossed = this.endingSide === "south" ? z > this.endingCrossZ : z < this.endingCrossZ;
      if (crossed) {
        // stepped past the seal — white fade takes the report
        this.endingWalked = true;
        this.endingT = 0;
        this.player.enabled = false;
        this.events.onFade?.(1, null, "light");
      } else if (this.endingT > 14) {
        // didn't walk — end on the doorway itself
        this.endingT = -1;
        this.events.onEnd?.("secure");
      }
      return;
    }
    if (this.endingT > 0.9) {
      this.endingT = -1;
      this.events.onEnd?.("secure");
    }
  }

  /** Sim step. */
  update(dt: number): void {
    // door slide animation (+ pneumatic audio on every target flip —
    // approach open, commit seal, cycle re-open)
    for (const d of [this.world.doors.northInner, this.world.doors.southInner] as DoorRig[]) {
      if (d.target01 !== this.prevDoorTargets.get(d)) {
        this.prevDoorTargets.set(d, d.target01);
        this.audio.playDoorSlide(d.frame.getAbsolutePosition(), d.target01 === 1);
      }
      d.open01 += (d.target01 - d.open01) * Math.min(1, 6 * dt);
      const half = 1.2;
      d.left.position.x = -half / 2 - d.open01 * half * 0.92;
      d.right.position.x = half / 2 + d.open01 * half * 0.92;
      d.leftCollider.position.x = d.left.position.x;
      d.rightCollider.position.x = d.right.position.x;
      // status dome over the mouth: amber sealed → teal open, pulsing
      // while the leaves are mid-travel
      const domeKey = d === this.world.doors.northInner ? "al.north.statusdome" : "al.south.statusdome";
      const domeMat = this.domeMats.get(domeKey) ?? this.domeMat(domeKey);
      if (domeMat) {
        const moving = Math.abs(d.target01 - d.open01) > 0.02;
        const pulse = moving ? 0.75 + 0.45 * Math.sin(this.statusPulseT) : 1;
        const t = Math.min(1, d.open01);
        domeMat.emissiveColor.set(
          (1.0 - t * 0.72) * pulse,
          (0.55 + t * 0.25) * pulse,
          (0.15 + t * 0.55) * pulse,
        );
      }
    }
    this.statusPulseT += dt * 9;

    // corridor brown-out ramp — down over ~0.7s, back over ~1.1s so the
    // lamps breathe back after the cycle veil lifts
    if (this.brown01 !== this.brownTarget) {
      const rate = this.brownTarget > this.brown01 ? 3.4 : 2.2;
      this.brown01 += (this.brownTarget - this.brown01) * Math.min(1, rate * dt);
      if (Math.abs(this.brown01 - this.brownTarget) < 0.01) this.brown01 = this.brownTarget;
      this.applyBrown();
    }

    if (this.phase === "ended" && this.endingT >= 0) this.updateEnding(dt);

    if (this.phase === "open") {
      const p = this.player.position;
      if (p.z <= LAYOUT.commitNorthZ) this.beginCycle("retreat");
      else if (p.z >= LAYOUT.commitSouthZ) this.beginCycle("continue");
      // auto-open the south door when the player is near it (they still must
      // cross the commit plane to file)
      if (p.z > LAYOUT.southAirlock.z0 - 1.2) this.world.doors.southInner.target01 = 1;
      // muffled PA — fires only while the corridor is open: endings
      // and judgments keep their own quiet, and anomalies that own the
      // horns (or kill the feed they run on) mute it entirely
      const paMuted =
        this.activeDef?.id === "lights.blackout" ||
        this.activeDef?.id === "pa.deadair" ||
        this.activeDef?.id === "announce.spatial";
      if (!paMuted) this.paT -= dt;
      if (this.paT <= 0) {
        this.paT = 40 + this.paRng.range(0, 45);
        this.audio.playAnnouncement(this.paRng.pick(this.world.anchors.paHorns));
      }
      this.trainT -= dt;
      if (this.trainT <= 0) {
        this.trainT = 90 + this.trainRng.range(0, 60);
        this.audio.playTrainPass();
      }
      this.dripT -= dt;
      if (this.dripT <= 0) {
        this.dripT = 55 + this.dripRng.range(0, 70);
        const vents = this.world.anchors.vents;
        if (vents.length > 0) this.audio.playWaterPlink(this.dripRng.pick(vents));
      }
    } else if (this.phase === "commit_pending") {
      this.judgeT -= dt;
      if (this.judgeT <= 0) this.resolveJudgment();
    } else if (this.phase === "cycling") {
      this.cycleT -= dt;
      if (this.cycleT <= 0) this.finishCycle();
    }

    // anomalies act only while the corridor is open — committing freezes
    // the loop's wrongness mid-beat so a chase can't dock a player who
    // already crossed to file
    if (this.phase === "open") this.activeInstance?.update(dt);

    // baseline clock: slow real-time sweep so the corridor feels alive
    this.baseClockMinute -= dt * 0.0016;
    if (!this.activeDef || (this.activeDef.id !== "clock.reverse" && this.activeDef.id !== "clock.stopped")) {
      this.world.clock.minutePivot.rotation.z = this.baseClockMinute;
      this.world.clock.hourPivot.rotation.z = this.baseClockHour - this.baseClockMinute / 60;
    }
  }
}
