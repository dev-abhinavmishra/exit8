/**
 * WebAudio bus graph + procedural sources. All sound is synthesized —
 * no samples, no files, no licensing surface (ATTRIBUTION.md notes this).
 * Buses: master → ambience | footsteps | machinery | voices | anomaly | ui.
 * Positional emitters use distance gain + StereoPanner against the camera.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Settings } from "../accessibility/settings";
import type { RngStream } from "../game/state/rng";

export type BusName = "ambience" | "footsteps" | "machinery" | "voices" | "anomaly" | "ui";

export interface CaptionEvent {
  text: string;
  direction: "left" | "right" | "center" | "behind" | null;
  ts: number;
}

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private buses = new Map<BusName, GainNode>();
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private listenerPos = Vector3.Zero();
  private listenerFwd = Vector3.Forward();
  private captionListeners: ((e: CaptionEvent) => void)[] = [];
  private rumbleTimer = 0;
  private ambienceStarted = false;
  private clockPos: Vector3 | null = null;
  private tickT = 0;

  constructor(
    private readonly settings: Settings,
    private readonly rng: RngStream,
  ) {}

  /** Must be called from a user gesture. Idempotent. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    for (const b of ["ambience", "footsteps", "machinery", "voices", "anomaly", "ui"] as BusName[]) {
      const g = this.ctx.createGain();
      g.connect(this.master);
      this.buses.set(b, g);
    }
    // pre-render 2s of white noise used by most synths
    const len = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = this.noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = this.rng.draw() * 2 - 1;
      last = (last + 0.02 * white) / 1.02; // brownish
      ch[i] = last * 3.2;
    }
    this.applyVolumes();
  }

  ready(): boolean {
    return this.ctx !== null;
  }

  applyVolumes(): void {
    if (!this.ctx || !this.master) return;
    const a = this.settings.audio;
    this.master.gain.value = a.muted ? 0 : a.master;
    const set = (b: BusName, v: number) => {
      const g = this.buses.get(b);
      if (g) g.gain.value = v;
    };
    set("ambience", a.ambience);
    set("footsteps", a.footsteps);
    set("machinery", a.ambience * 0.9);
    set("voices", a.ambience);
    set("anomaly", a.anomaly * (this.settings.accessibility.reduceStartle ? 0.45 : 1));
    set("ui", a.ui);
  }

  private bus(name: BusName): GainNode {
    const b = this.buses.get(name);
    if (!b) throw new Error("audio not unlocked");
    return b;
  }

  /** The bed drops ~4 dB under anomaly-bus emitters so a ghost cue reads
   * through the room tone, then recovers on a slow release. Rides under
   * the settings volume — never fights applyVolumes. */
  private duckAmbience(holdS: number): void {
    if (!this.ctx) return;
    const g = this.bus("ambience");
    const base = this.settings.audio.ambience;
    const t = this.ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setTargetAtTime(base * 0.63, t, 0.06);
    g.gain.setTargetAtTime(base, t + holdS, 0.9);
  }

  setListener(pos: Vector3, fwd: Vector3): void {
    this.listenerPos.copyFrom(pos);
    this.listenerFwd.copyFrom(fwd);
  }

  private spatialParams(pos: Vector3): { gain: number; pan: number; dir: CaptionEvent["direction"] } {
    const d = pos.subtract(this.listenerPos);
    const dist = d.length();
    const gain = 1 / (1 + dist * 0.55);
    // pan by angle between listener forward and source direction (xz)
    const f = this.listenerFwd.clone();
    f.y = 0;
    f.normalize();
    const dd = d.clone();
    dd.y = 0;
    if (dd.lengthSquared() > 0.0001) dd.normalize();
    const cross = f.x * dd.z - f.z * dd.x;
    const dot = f.x * dd.x + f.z * dd.z;
    const pan = Math.max(-1, Math.min(1, -cross * 1.2));
    const dir: CaptionEvent["direction"] =
      dot < -0.4 ? "behind" : Math.abs(cross) < 0.3 ? "center" : cross > 0 ? "right" : "left";
    return { gain, pan, dir };
  }

  onCaption(fn: (e: CaptionEvent) => void): () => void {
    this.captionListeners.push(fn);
    return () => {
      this.captionListeners = this.captionListeners.filter((f) => f !== fn);
    };
  }

  caption(text: string, pos: Vector3 | null): void {
    if (!this.settings.accessibility.captions) return;
    const e: CaptionEvent = {
      text,
      direction: pos ? this.spatialParams(pos).dir : null,
      ts: performance.now(),
    };
    for (const fn of this.captionListeners) fn(e);
  }

  /** Surface-aware footstep: filtered noise burst, randomized per step. */
  playFootstep(pos: Vector3, intensity: number, anomalous = false): void {
    if (anomalous) this.duckAmbience(0.7);
    if (!this.ctx || !this.noiseBuffer) return;
    const t0 = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.9 + this.rng.draw() * 0.3;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 320 + this.rng.draw() * 120;
    bp.Q.value = 1.1;
    const g = this.ctx.createGain();
    const sp = this.spatialParams(pos);
    const peak = 0.5 * intensity * sp.gain;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.13);
    const pan = this.ctx.createStereoPanner();
    pan.pan.value = sp.pan;
    src
      .connect(bp)
      .connect(g)
      .connect(pan)
      .connect(this.bus(anomalous ? "anomaly" : "footsteps"));
    src.start(t0, this.rng.draw() * 1.4, 0.2);
    if (anomalous) this.caption("footsteps — not yours", pos);
  }

  /** Ambient bed: HVAC noise + fluorescent hum + rare structure rumbles.
   *  noRumble (e2e) keeps the bed fully deterministic across runs. */
  startAmbience(
    ventPositions: Vector3[],
    machinePos: Vector3,
    rng: RngStream,
    opts: { noRumble?: boolean; troffers?: Vector3[]; clockPos?: Vector3 } = {},
  ): void {
    if (!this.ctx || !this.noiseBuffer || this.ambienceStarted) return;
    this.ambienceStarted = true;
    const ctx = this.ctx;

    // continuous HVAC brown noise
    const hvac = ctx.createBufferSource();
    hvac.buffer = this.noiseBuffer;
    hvac.loop = true;
    const hvacLp = ctx.createBiquadFilter();
    hvacLp.type = "lowpass";
    hvacLp.frequency.value = 240;
    const hvacG = ctx.createGain();
    hvacG.gain.value = 0.16;
    const hvacLfo = ctx.createOscillator();
    hvacLfo.frequency.value = 0.05;
    const hvacLfoG = ctx.createGain();
    hvacLfoG.gain.value = 40;
    hvacLfo.connect(hvacLfoG).connect(hvacLp.frequency);
    hvac.connect(hvacLp).connect(hvacG).connect(this.bus("ambience"));
    hvac.start();
    hvacLfo.start();

    // per-vent positional hiss
    for (const pos of ventPositions) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 900;
      f.Q.value = 0.6;
      const g = ctx.createGain();
      g.gain.value = 0.0;
      const pan = ctx.createStereoPanner();
      src.connect(f).connect(g).connect(pan).connect(this.bus("ambience"));
      src.start();
      const update = () => {
        const sp = this.spatialParams(pos);
        g.gain.value = 0.09 * sp.gain;
        pan.pan.value = sp.pan;
      };
      this.ventUpdaters.push(update);
    }

    // fluorescent hum at the troffer rows — 120Hz + harmonic, faint
    // mains flutter driven per-update (deterministic phase by row z)
    for (const pos of opts.troffers ?? []) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = 120;
      const o2 = ctx.createOscillator();
      o2.type = "sine";
      o2.frequency.value = 240;
      const g2 = ctx.createGain();
      g2.gain.value = 0.3;
      const g = ctx.createGain();
      g.gain.value = 0.0;
      const pan = ctx.createStereoPanner();
      o.connect(g);
      o2.connect(g2).connect(g);
      g.connect(pan).connect(this.bus("ambience"));
      o.start();
      o2.start();
      const update = () => {
        const sp = this.spatialParams(pos);
        const flutter = 0.85 + 0.15 * Math.sin(ctx.currentTime * 6.3 + pos.z);
        g.gain.value = 0.03 * sp.gain * flutter;
        pan.pan.value = sp.pan;
      };
      this.ventUpdaters.push(update);
    }

    this.clockPos = opts.clockPos ?? null;

    // junction machinery thrum
    const mach = ctx.createOscillator();
    mach.type = "sawtooth";
    mach.frequency.value = 55;
    const machLp = ctx.createBiquadFilter();
    machLp.type = "lowpass";
    machLp.frequency.value = 160;
    const machG = ctx.createGain();
    machG.gain.value = 0.0;
    const machPan = ctx.createStereoPanner();
    mach.connect(machLp).connect(machG).connect(machPan).connect(this.bus("machinery"));
    mach.start();
    this.machineUpdater = () => {
      const sp = this.spatialParams(machinePos);
      const duck = this.machineGainScale ? this.machineGainScale() : 1;
      machG.gain.value = 0.12 * sp.gain * duck;
      machPan.pan.value = sp.pan;
    };

    // rare distant rumble — seeded so runs are reproducible
    if (!opts.noRumble) {
      const scheduleRumble = () => {
        this.rumbleTimer = rng.range(45, 120);
      };
      scheduleRumble();
      this.rumbleScheduler = (dt: number) => {
        this.rumbleTimer -= dt;
        if (this.rumbleTimer <= 0) {
          this.playRumble(rng);
          scheduleRumble();
        }
      };
    }
  }

  /** Suspend/resume the whole graph (pause menu, tab hidden). */
  suspend(): void {
    if (this.ctx && this.ctx.state === "running") void this.ctx.suspend();
  }
  resume(): void {
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  private ventUpdaters: (() => void)[] = [];
  private machineUpdater: (() => void) | null = null;
  private rumbleScheduler: ((dt: number) => void) | null = null;
  private machineGainScale: (() => number) | null = null;

  /** Anomalies duck the junction-machine hum through this (multiplier
   *  evaluated per update; pass null to clear). */
  setMachineGainScale(fn: (() => number) | null): void {
    this.machineGainScale = fn;
  }

  /** Per-frame spatialization refresh; call from sim or render. */
  update(dt: number): void {
    for (const u of this.ventUpdaters) u();
    this.machineUpdater?.();
    this.rumbleScheduler?.(dt);
    // faint mechanical tick near the master clock
    if (this.clockPos && this.ctx && this.noiseBuffer) {
      this.tickT -= dt;
      if (this.tickT <= 0) {
        this.tickT = 1.0;
        const sp = this.spatialParams(this.clockPos);
        if (sp.gain > 0.03) this.playTick(0.05 * sp.gain, sp.pan);
      }
    }
  }

  /** One clock tick — 12ms high-passed click, spatialized + fanned. */
  private playTick(gain: number, pan: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuffer) return;
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 1.6;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2600;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    src.connect(hp).connect(g).connect(p).connect(this.bus("ambience"));
    src.start(t0, 0.3, 0.06);
  }

  playRumble(rng: RngStream): void {
    this.duckAmbience(1.4);
    if (!this.ctx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.4;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 60;
    const g = ctx.createGain();
    const dur = rng.range(1.8, 3.4);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.12, t0 + dur * 0.4);
    g.gain.linearRampToValueAtTime(0, t0 + dur);
    src.connect(lp).connect(g).connect(this.bus("ambience"));
    src.start(t0, 0, dur + 0.1);
    this.caption("distant rumble", null);
  }

  /** Low vent groan — a slow pressure swell, used by vent anomalies. */
  playGroan(pos: Vector3): void {
    this.duckAmbience(1.2);
    if (!this.ctx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const sp = this.spatialParams(pos);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.setValueAtTime(0.6, t0);
    src.playbackRate.linearRampToValueAtTime(0.32, t0 + 1.4);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(240, t0);
    lp.frequency.linearRampToValueAtTime(90, t0 + 1.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.16 * sp.gain, t0 + 0.5);
    g.gain.linearRampToValueAtTime(0, t0 + 1.5);
    const pan = ctx.createStereoPanner();
    pan.pan.value = sp.pan;
    src.connect(lp).connect(g).connect(pan).connect(this.bus("ambience"));
    src.start(t0, 0.4, 1.6);
    this.caption("vent groan", pos);
  }

  /** Two-tone PA chime — ding-dong, used by announce anomalies. */
  playChime(pos: Vector3): void {
    this.duckAmbience(1.0);
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const sp = this.spatialParams(pos);
    const notes = [660, 494];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      const at = t0 + i * 0.42;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.07 * sp.gain, at + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.6);
      const pan = ctx.createStereoPanner();
      pan.pan.value = sp.pan;
      o.connect(g).connect(pan).connect(this.bus("ambience"));
      o.start(at);
      o.stop(at + 0.65);
    });
    this.caption("PA chime", pos);
  }

  /** Two-burst internal phone ring — a warbling trill pair, used by
   *  phone.rings. Spatialized to the handset niche. */
  playRing(pos: Vector3): void {
    this.duckAmbience(0.85);
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const sp = this.spatialParams(pos);
    for (const [burst, n] of [
      [0, 8],
      [0.55, 8],
    ] as const) {
      for (let i = 0; i < n; i++) {
        const o = ctx.createOscillator();
        o.type = "square";
        o.frequency.value = i % 2 === 0 ? 1046 : 880;
        const g = ctx.createGain();
        const at = t0 + burst + i * 0.055;
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(0.028 * sp.gain, at + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
        const pan = ctx.createStereoPanner();
        pan.pan.value = sp.pan;
        o.connect(g).connect(pan).connect(this.bus("ambience"));
        o.start(at);
        o.stop(at + 0.06);
      }
    }
    this.caption("phone ringing", pos);
  }

  /** Clock tick generator — used by baseline and clock anomalies. */
  createTicker(name: string): {
    start(): void;
    stop(): void;
    setPosition(p: Vector3): void;
    setRate(perSec: number): void;
  } {
    void name;
    let interval: ReturnType<typeof setInterval> | null = null;
    let pos: Vector3 | null = null;
    let rate = 1.1;
    const tick = () => {
      if (!this.ctx || !this.noiseBuffer || !pos) return;
      const t0 = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.playbackRate.value = 2.6;
      const hp = this.ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 2400;
      const g = this.ctx.createGain();
      const sp = this.spatialParams(pos);
      g.gain.setValueAtTime(0.05 * sp.gain, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.03);
      const pan = this.ctx.createStereoPanner();
      pan.pan.value = sp.pan;
      src.connect(hp).connect(g).connect(pan).connect(this.bus("ambience"));
      src.start(t0, 1.2, 0.05);
    };
    return {
      start: () => {
        if (interval !== null) return;
        interval = setInterval(tick, 1000 / rate);
      },
      stop: () => {
        if (interval !== null) clearInterval(interval);
        interval = null;
      },
      setPosition: (p: Vector3) => {
        pos = p.clone();
      },
      setRate: (r: number) => {
        rate = r;
        if (interval !== null) {
          clearInterval(interval);
          interval = setInterval(tick, 1000 / rate);
        }
      },
    };
  }

  /** Airlock cycle: servo whine + seal clunk. */
  playAirlockCycle(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t0);
    osc.frequency.linearRampToValueAtTime(90, t0 + 1.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.08, t0 + 0.25);
    g.gain.linearRampToValueAtTime(0, t0 + 1.5);
    osc.connect(g).connect(this.bus("ui"));
    osc.start(t0);
    osc.stop(t0 + 1.6);
    // seal clunk
    if (this.noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 140;
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.5, t0 + 1.5);
      cg.gain.exponentialRampToValueAtTime(0.001, t0 + 1.72);
      src.connect(lp).connect(cg).connect(this.bus("ui"));
      src.start(t0 + 1.5, 0.4, 0.3);
    }
    this.caption("airlock cycling", null);
  }

  /** Run-over tails: secure resolves upward, dossier-complete adds a
   *  third sparkle, lost sinks into a low dissonant swell. */
  playEnding(kind: "secure" | "lost" | "investigative" | "practice"): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    if (kind === "lost") {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(58, t0);
      o.frequency.linearRampToValueAtTime(41, t0 + 1.7);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.5);
      g.gain.linearRampToValueAtTime(0, t0 + 1.9);
      o.connect(lp).connect(g).connect(this.bus("anomaly"));
      o.start(t0);
      o.stop(t0 + 2.0);
      this.caption("the corridor settles", null);
      return;
    }
    const freqs = kind === "practice" ? [330, 415] : kind === "investigative" ? [392, 523, 784] : [392, 523];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      const at = t0 + i * 0.16;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(i === freqs.length - 1 ? 0.05 : 0.075, at + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.9);
      o.connect(g).connect(this.bus("ui"));
      o.start(at);
      o.stop(at + 1.0);
    });
  }

  /** Judgment confirm/deny chime — informational, not a jumpscare. */
  playJudgment(correct: boolean): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const freqs = correct ? [523, 784] : [196, 155];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      const g = ctx.createGain();
      const at = t0 + i * 0.09;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.07, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.5);
      o.connect(g).connect(this.bus("ui"));
      o.start(at);
      o.stop(at + 0.55);
    });
  }

  /** Menu blip. */
  playUiTick(): void {
    if (!this.ctx || !this.noiseBuffer) return;
    const t0 = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 3;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 3000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.05, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);
    src.connect(hp).connect(g).connect(this.bus("ui"));
    src.start(t0, 0.5, 0.08);
  }
}
