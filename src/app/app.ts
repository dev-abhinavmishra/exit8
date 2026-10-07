/**
 * App orchestration: engine → world → player → loop → audio → UI.
 * App states: menu (start screen over live scene), playing, paused, results.
 */
import { Scene } from "@babylonjs/core/scene";
import { Color4, Color3 } from "@babylonjs/core/Maths/math.color";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import type { Engine } from "@babylonjs/core/Engines/engine";
import type { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { buildConcourse, LAYOUT, type ConcourseWorld } from "../world/generation/concourse";
import { RngStream } from "../game/state/rng";
import { PlayerController } from "../player/controller";
import { AudioSystem } from "../audio/audioSystem";
import { SaveStore } from "../game/state/save";
import type { Settings } from "../accessibility/settings";
import { AnomalyRegistry } from "../game/anomalies/registry";
import { LoopManager, type LoopState } from "../game/loop/loopManager";
import { Stepper } from "../engine/stepper";
import {
  detectCapabilities,
  resolveTier,
  TIERS,
  type CapabilityReport,
  type TierSpec,
} from "../engine/quality";
import { createRenderer, type RendererKind } from "../engine/renderer";
import { GameUi } from "../ui/screens";
import { buildInspectionRig, type InspectionRig } from "../world/lighting/rig";
import { FocusResolver, type Interactable } from "../game/interaction/focus";
import { ALL_ANOMALIES } from "../game/anomalies";
import { installDebugHandle } from "../debug/handle";

export type AppState = "boot" | "menu" | "playing" | "paused" | "results";

export interface UrlParams {
  seed: string;
  anomaly: string | null;
  engine: "auto" | "webgl" | "webgpu";
  quality: "auto" | "low" | "medium" | "high" | "ultra";
  practice: boolean;
  debug: boolean;
  e2e: boolean;
}

/** Deterministic per-UTC-day run seed for the daily route. */
export function dailySeed(): string {
  return `daily-${new Date().toISOString().slice(0, 10)}`;
}

export function parseUrl(search: string): UrlParams {
  const q = new URLSearchParams(search);
  const engine = q.get("engine");
  const quality = q.get("quality");
  return {
    seed: q.get("seed") ?? `run-${Math.floor(Math.random() * 1e9).toString(36)}`,
    anomaly: q.get("anomaly"),
    engine: engine === "webgl" || engine === "webgpu" ? engine : "auto",
    quality:
      quality === "low" || quality === "medium" || quality === "high" || quality === "ultra"
        ? quality
        : "auto",
    debug: q.get("debug") === "1" || q.get("debug") === "true",
    e2e: q.get("e2e") === "1",
    practice: q.get("practice") === "1",
  };
}

export class App {
  state: AppState = "boot";
  private engine!: Engine | WebGPUEngine;
  private rendererKind!: RendererKind;
  private scene!: Scene;
  private world!: ConcourseWorld;
  private player!: PlayerController;
  private audio!: AudioSystem;
  private loop!: LoopManager;
  private stepper!: Stepper;
  private ui!: GameUi;
  private save: SaveStore;
  private anomalies = new AnomalyRegistry();
  private caps: CapabilityReport;
  private tier!: TierSpec;
  private pipeline: DefaultRenderingPipeline | null = null;
  private rig: InspectionRig | null = null;
  private focus = new FocusResolver();
  private focused: Interactable | null = null;
  private stats = { correct: 0, mistakes: 0 };
  private filed: { name: string; chapter: number }[] = [];
  private runSeed: string;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly uiHost: HTMLElement,
    private readonly params: UrlParams,
  ) {
    this.save = new SaveStore(window.localStorage);
    const settings = this.save.get().settings;
    if (params.engine !== "auto") settings.video.engine = params.engine;
    if (params.quality !== "auto") settings.video.quality = params.quality;
    this.caps = detectCapabilities();
    this.runSeed = params.seed;
    for (const d of ALL_ANOMALIES) this.anomalies.register(d);
  }

  async boot(): Promise<void> {
    const settings = this.save.get().settings;
    const created = await createRenderer(this.canvas, settings.video.engine, this.caps);
    this.engine = created.engine;
    this.rendererKind = created.kind;
    this.tier = this.resolveTierFor(settings);
    this.engine.setHardwareScalingLevel(this.tier.hardwareScaling / settings.video.renderScale);

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.02, 0.025, 0.03, 1);
    this.scene.collisionsEnabled = true;
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.012;
    this.scene.fogColor = new Color3(0.03, 0.035, 0.04);

    this.world = buildConcourse(this.scene, this.runSeed);
    this.player = new PlayerController(this.scene, this.canvas, settings);
    this.audio = new AudioSystem(settings, new RngStream("audio.synth", this.runSeed));
    this.rig = buildInspectionRig(this.scene, this.player.camera, this.tier);
    this.applyQuality();

    // airlock terminals are the only interactables in the slice
    for (const side of ["north", "south"] as const) {
      const mesh = this.world.registry.mesh(`al.${side}.terminal`);
      this.focus.register({
        mesh,
        prompt: "ROUTE INTEGRITY TERMINAL",
        onUse: () => {
          const s = this.loop?.state;
          if (!s) return;
          this.ui?.caption(
            `terminal — stability ${s.stability} · loop ${String(s.loopIndex).padStart(2, "0")}`,
            null,
          );
        },
      });
    }
    window.addEventListener("keydown", (e) => {
      if (e.code === settings.controls.keyInteract && this.focused) this.focused.onUse();
    });

    this.ui = new GameUi(this.uiHost, settings, {
      onStart: () => this.startRun(),
      onDaily: () => this.dailyRoute(),
      onPractice: () => this.practiceRoute(),
      onResume: () => this.resume(),
      onRestart: () => this.restart(),
      onSettingsChanged: () => this.onSettingsChanged(),
      onResetData: () => {
        this.save.resetAll();
        location.reload();
      },
    });
    const day = dailySeed().slice(6);
    this.ui.setDailyLabel(day, this.save.get().progression.dailies.includes(day));
    {
      const p = this.save.get().progression;
      this.ui.setArchiveData(
        {
          runs: p.runsCompleted,
          secured: p.routesSecured,
          best: p.bestStability,
          logged: p.anomaliesLogged,
          falseClears: p.falseClears,
          falseAlarms: p.falseAlarms,
          dailies: p.dailies.length,
        },
        p.discovered,
      );
    }
    if (created.note) this.ui.setStartNote(created.note, true);
    else if (this.save.consumeResetNotice()) {
      this.ui.setStartNote("Save data on this device was corrupted and has been reset.", true);
    }
    this.ui.show("start");

    this.loop = new LoopManager(
      this.scene,
      this.world,
      this.player,
      this.audio,
      this.save,
      this.anomalies,
      this.runSeed,
      {
        onJudgment: (s) => this.onJudgment(s),
        onEnd: (outcome) => this.onEnd(outcome),
        onFade: (opacity, label) => {
          if (opacity > 0) this.ui.veilOn(label);
          else this.ui.veilOff();
        },
      },
      {
        reducedEffects: settings.accessibility.reducedMotion,
        visualCues: settings.accessibility.visualSoundCues,
      },
      this.params.practice,
    );
    if (this.params.anomaly) this.loop.forceAnomaly(this.params.anomaly);
    this.loop.start();
    // the player's own cadence — footsteps.extra layers a second one on top
    this.player.onFootstep((pos, intensity) => this.audio.playFootstep(pos, intensity));
    // gamepad: A uses the focused interactable, start toggles pause
    this.player.onPadButton(0, () => {
      if (this.focused && this.state === "playing") this.focused.onUse();
    });
    this.player.onPadButton(9, () => {
      if (this.state === "playing") this.pause();
      else if (this.state === "paused") this.resume();
    });
    this.ui.setStability(this.loop.stability.current);
    this.loop.stability.onChange((v) => this.ui?.setStability(v));

    this.stepper = new Stepper((dt) => this.sim(dt));
    this.engine.runRenderLoop(() => {
      const dt = this.engine.getDeltaTime() / 1000;
      // pad buttons edge-fire every frame — the sim freezes while paused,
      // and resume needs the same button that opened the pause screen
      this.player.pollPadButtons();
      if (this.state === "playing") {
        this.stepper.advance(dt);
      } else if (this.state === "menu") {
        // idle attract: slow drift so the menu sits over a live concourse
        this.player.camera.rotation.y += dt * 0.02;
      }
      this.audio.update(dt);
      this.ui.update();
      this.updateDebug(dt);
      this.scene.render();
    });
    window.addEventListener("resize", () => this.engine.resize());

    // audio unlock happens on the first real gesture (start button / click)
    const ambientRng = new RngStream("audio.ambient", this.runSeed);
    const unlock = () => {
      this.audio.unlock();
      this.audio.startAmbience(this.world.anchors.vents, this.world.anchors.junctionMachine, ambientRng, {
        noRumble: this.params.e2e,
      });
      // a first gesture arriving while paused must not un-mute the scene
      if (this.state === "paused") this.audio.suspend();
      this.audio.onCaption((e) => this.ui?.caption(e.text, e.direction));
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);

    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape" && this.state === "playing") this.pause();
      else if (e.code === "Escape" && this.state === "paused") this.resume();
    });
    document.addEventListener("pointerlockchange", () => {
      if (!document.pointerLockElement && this.state === "playing") this.pause();
    });

    installDebugHandle(this);
    this.state = "menu";
  }

  private sim(dt: number): void {
    this.player.update(dt);
    this.loop.update(dt);
    this.rig?.update();
    this.audio.setListener(this.player.position, this.player.forward());
    const fwd = this.player.camera.getForwardRay().direction;
    this.focused = this.focus.resolve(this.scene, this.player.position, fwd);
  }

  private startRun(): void {
    this.ui.show("none");
    this.state = "playing";
    this.canvas.requestPointerLock?.();
  }

  private pause(): void {
    this.state = "paused";
    this.audio.suspend();
    this.ui.show("pause");
    document.exitPointerLock?.();
  }

  private resume(): void {
    this.ui.show("none");
    this.state = "playing";
    this.audio.resume();
    this.canvas.requestPointerLock?.();
  }

  private restart(): void {
    // in practice mode, abandoning an in-flight run ends it into a report
    // instead of reloading; from the results screen it just starts fresh
    if (this.params.practice && this.state !== "results" && this.state !== "boot") {
      this.loop.endTraining();
      return;
    }
    // cleanest possible reset: reload with a fresh seed (all state is in
    // the page; the save persists records)
    const u = new URL(location.href);
    u.searchParams.delete("anomaly");
    u.searchParams.set("seed", `run-${Math.floor(Math.random() * 1e9).toString(36)}`);
    location.href = u.toString();
  }

  /** Endless training route — judgments still score, the route never ends. */
  private practiceRoute(): void {
    const u = new URL(location.href);
    u.searchParams.delete("anomaly");
    u.searchParams.set("practice", "1");
    u.searchParams.set("seed", `run-${Math.floor(Math.random() * 1e9).toString(36)}`);
    location.href = u.toString();
  }

  /** The daily route — one deterministic seed per UTC day, same for everyone. */
  private dailyRoute(): void {
    const u = new URL(location.href);
    u.searchParams.delete("anomaly");
    u.searchParams.set("seed", dailySeed());
    location.href = u.toString();
  }

  private onJudgment(s: LoopState): void {
    if (s.judgment?.correct) this.stats.correct += 1;
    else this.stats.mistakes += 1;
    // a correct retreat files the active divergence into the route log
    if (s.judgment?.correct && s.activeAnomaly) {
      const def = this.anomalies.get(s.activeAnomaly);
      if (!this.filed.some((f) => f.name === def.displayName)) {
        this.filed.push({ name: def.displayName, chapter: def.chapter });
      }
    }
    // practice mode tells you what the truth was — that's the training
    if (this.params.practice && s.judgment) {
      const name = s.activeAnomaly ? this.anomalies.get(s.activeAnomaly).displayName : null;
      const msg = s.judgment.correct
        ? name
          ? `DIVERGENCE FILED — ${name}`
          : "ROUTE CLEAR — nothing to file"
        : name
          ? `MISSED — ${name} was in play`
          : "FALSE FILING — route was clear";
      this.ui.caption(msg, null);
    }
    this.ui.setLoopIndex(s.loopIndex + 1);
    this.ui.setChapter(s.chapter);
  }

  private onEnd(outcome: "secure" | "lost" | "practice"): void {
    this.state = "results";
    document.exitPointerLock?.();
    // stamp the daily route if this run was one
    if (this.runSeed.startsWith("daily-")) {
      const day = this.runSeed.slice(6);
      this.save.update((d) => {
        if (!d.progression.dailies.includes(day)) d.progression.dailies.push(day);
      });
    }
    const discovered = this.save.get().progression.discovered.length;
    this.ui.showResults(outcome, this.loop.state, {
      loops: this.loop.state.loopIndex,
      correct: this.stats.correct,
      mistakes: this.stats.mistakes,
      discovered,
      filed: this.filed,
      practice: outcome === "practice",
    });
  }

  private onSettingsChanged(): void {
    const s = this.save.get().settings;
    this.player.camera.fov = (s.video.fov * Math.PI) / 180;
    this.applyQuality();
    this.audio.applyVolumes();
    this.loop?.setAnomalyContext({
      reducedEffects: s.accessibility.reducedMotion,
      visualCues: s.accessibility.visualSoundCues,
    });
    this.save.persist();
  }

  /** e2e pins the cheapest tier for deterministic software-GL runs. */
  private resolveTierFor(s: Settings): TierSpec {
    if (this.params.e2e && this.params.quality === "auto") return TIERS.low;
    return TIERS[resolveTier(s.video.quality, this.caps)];
  }

  private applyQuality(): void {
    const s = this.save.get().settings;
    this.tier = this.resolveTierFor(s);
    this.rig?.setTier(this.tier);
    if (this.engine) {
      this.engine.setHardwareScalingLevel(this.tier.hardwareScaling / s.video.renderScale);
    }
    // post pipeline per tier
    if (this.tier.post && !this.pipeline) {
      this.pipeline = new DefaultRenderingPipeline("drp", true, this.scene, [this.player.camera]);
      this.pipeline.bloomEnabled = true;
      this.pipeline.bloomThreshold = 0.72;
      this.pipeline.bloomWeight = 0.22;
      this.pipeline.fxaaEnabled = this.rendererKind === "webgl2";
      this.pipeline.grainEnabled = true;
      this.pipeline.grain.intensity = 6;
      this.pipeline.sharpenEnabled = false;
      this.pipeline.chromaticAberrationEnabled = true;
      this.pipeline.chromaticAberration.aberrationAmount = 3;
      this.pipeline.imageProcessing.toneMappingEnabled = true;
      this.pipeline.imageProcessing.vignetteEnabled = true;
      this.pipeline.imageProcessing.vignetteWeight = 0.7;
    } else if (!this.tier.post && this.pipeline) {
      this.pipeline.dispose();
      this.pipeline = null;
    }
  }

  private debugOn = false;
  private fpsAvg = 0;
  private updateDebug(dt: number): void {
    this.fpsAvg = this.fpsAvg * 0.95 + (1 / Math.max(dt, 1e-4)) * 0.05;
    if (!this.debugOn) return;
    const draws = this.scene.getEngine()._drawCalls?.current ?? 0;
    this.ui.setDebugText(
      `engine ${this.rendererKind} · tier ${this.tier.tier}\n` +
        `seed ${this.runSeed}\n` +
        `loop ${this.loop.state.loopIndex} · phase ${this.loop.phaseNow}\n` +
        `anomaly ${this.loop.currentAnomaly ?? "—"}\n` +
        `stability ${this.loop.stability.current}\n` +
        `fps ${this.fpsAvg.toFixed(0)} · draws ${draws}`,
    );
  }

  setDebug(on: boolean): void {
    this.debugOn = on;
    this.ui.setDebug(on);
  }

  // surface for the debug handle
  get __refs() {
    return {
      engine: this.engine,
      rendererKind: this.rendererKind,
      scene: this.scene,
      world: this.world,
      player: this.player,
      loop: this.loop,
      save: this.save,
      ui: this.ui,
      app: this,
      spawn: LAYOUT.spawn,
      runSeed: this.runSeed,
    };
  }
}
