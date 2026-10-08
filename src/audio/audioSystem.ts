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
    // corridor slap-echo: the tiled passage answers each step a beat
    // later — send off the footsteps bus through a short feedback delay,
    // lowpassed like hard plaster reflections
    const delay = this.ctx.createDelay(0.5);
    delay.delayTime.value = 0.115;
    const echoLp = this.ctx.createBiquadFilter();
    echoLp.type = "lowpass";
    echoLp.frequency.value = 1500;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.3;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.22;
    this.bus("footsteps").connect(delay);
    delay.connect(echoLp);
    echoLp.connect(fb);
    fb.connect(delay);
    echoLp.connect(wet);
    wet.connect(this.master);
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

  /** Kill the ambience bed outright — used by the lost ending, where the
   *  corridor drowning into silence IS the scare. Stays down; the next
   *  run rebuilds the audio graph on reload. */
  hushAmbience(): void {
    if (!this.ctx) return;
    const g = this.bus("ambience");
    const t = this.ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setTargetAtTime(0.001, t, 0.5);
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
    // tactile guide strip: rubber thuds underfoot, it doesn't click like
    // terrazzo — lower, duller, a touch longer. Anomalous footsteps keep
    // the terrazzo timbre (they are never yours).
    const onStrip = !anomalous && Math.abs(pos.x - 0.72) < 0.2 && pos.z > 3.0 && pos.z < 54.2;
    src.playbackRate.value = (onStrip ? 0.7 : 0.9) + this.rng.draw() * 0.3;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = (onStrip ? 205 : 320) + this.rng.draw() * (onStrip ? 60 : 120);
    bp.Q.value = onStrip ? 1.5 : 1.1;
    const g = this.ctx.createGain();
    const sp = this.spatialParams(pos);
    const peak = 0.5 * intensity * sp.gain * (onStrip ? 0.85 : 1);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + (onStrip ? 0.17 : 0.13));
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
    opts: { noRumble?: boolean; troffers?: Vector3[]; clockPos?: Vector3; vendPos?: Vector3 } = {},
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

    // vending-unit compressor — a low cycling buzz that swells for a
    // stretch then idles, so the machine sounds like it's keeping
    // something cold behind the lit face
    if (opts.vendPos) {
      const pos = opts.vendPos;
      const vo = ctx.createOscillator();
      vo.type = "sawtooth";
      vo.frequency.value = 88;
      const vlp = ctx.createBiquadFilter();
      vlp.type = "lowpass";
      vlp.frequency.value = 130;
      const vg = ctx.createGain();
      vg.gain.value = 0;
      const vp = ctx.createStereoPanner();
      vo.connect(vlp).connect(vg).connect(vp).connect(this.bus("machinery"));
      vo.start();
      this.ventUpdaters.push(() => {
        const sp = this.spatialParams(pos);
        // ~26s duty cycle: on for 14s, rests for 12s, soft ramps
        const ph = (ctx.currentTime % 26) / 26;
        const duty = ph < 0.08 ? ph / 0.08 : ph < 0.54 ? 1 : ph < 0.62 ? (0.62 - ph) / 0.08 : 0;
        vg.gain.value = 0.05 * sp.gain * duty * (this.vendGainScaleFn?.() ?? 1);
        vp.pan.value = sp.pan;
      });
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
      const pitch = this.machinePitchFn ? this.machinePitchFn() : 1;
      machG.gain.value = 0.12 * sp.gain * duck;
      machPan.pan.value = sp.pan;
      mach.frequency.value = 55 * pitch;
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
  private machinePitchFn: (() => number) | null = null;

  /** Anomaly hook: scale the vend-unit compressor gain (vend.dead
   *  silences it — the machine is off, not just dark). */
  setVendGainScale(fn: (() => number) | null): void {
    this.vendGainScaleFn = fn;
  }
  private vendGainScaleFn: (() => number) | null = null;

  /** Anomalies duck the junction-machine hum through this (multiplier
   *  evaluated per update; pass null to clear). */
  setMachineGainScale(fn: (() => number) | null): void {
    this.machineGainScale = fn;
  }

  /** Anomalies detune the junction-machine thrum through this (pitch
   *  multiplier evaluated per update; pass null to clear). pitch.sags
   *  drives the corridor drone a semitone flat over a slow drift. */
  setMachinePitch(fn: (() => number) | null): void {
    this.machinePitchFn = fn;
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

  /** A train passes somewhere beyond the walls — the signature transit
   *  ambience: a long low rumble swell with the wheel-clatter pulse
   *  riding on top and a faint brake whistle trailing off. Not
   *  spatialized: it's always distant, everywhere in the loop. */
  playTrainPass(): void {
    this.duckAmbience(6);
    if (!this.ctx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const dur = 7 + this.rng.draw() * 3;
    const bus = this.bus("ambience");

    // low body — the rolling mass
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.45;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 110;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.14, t0 + dur * 0.35);
    g.gain.setValueAtTime(0.14, t0 + dur * 0.6);
    g.gain.linearRampToValueAtTime(0, t0 + dur);
    src.connect(lp).connect(g).connect(bus);
    src.start(t0, 0, dur + 0.1);

    // wheel clatter — pairs of filtered noise ticks at ~3.6Hz, slightly
    // quickening; quiet enough to feel embedded in the rumble
    let t = t0 + dur * 0.3;
    const end = t0 + dur * 0.78;
    let interval = 0.28;
    while (t < end) {
      for (const off of [0, 0.07]) {
        const tick = ctx.createBufferSource();
        tick.buffer = this.noiseBuffer;
        tick.playbackRate.value = 2.4;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 900;
        bp.Q.value = 1.6;
        const tg = ctx.createGain();
        const at = t + off;
        const swell = Math.sin(((at - t0) / dur) * Math.PI); // ride the rumble
        tg.gain.setValueAtTime(0.035 * swell, at);
        tg.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
        tick.connect(bp).connect(tg).connect(bus);
        tick.start(at, 0.2, 0.07);
      }
      interval *= 0.995; // nearly imperceptible acceleration
      t += interval;
    }

    // brake whistle — a long faint descending sine, the only tonal part
    const w = ctx.createOscillator();
    w.type = "sine";
    w.frequency.setValueAtTime(1900, t0 + dur * 0.55);
    w.frequency.linearRampToValueAtTime(1300, t0 + dur * 0.95);
    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0, t0 + dur * 0.55);
    wg.gain.linearRampToValueAtTime(0.012, t0 + dur * 0.68);
    wg.gain.linearRampToValueAtTime(0, t0 + dur * 0.97);
    w.connect(wg).connect(bus);
    w.start(t0 + dur * 0.55);
    w.stop(t0 + dur);
    this.caption("distant train", null);
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

  /** Condensation plink — a drop off a vent grille: a high sine ping
   *  that falls in pitch, plus one softer echo as it splashes the pan.
   *  Scheduled rarely; the corridor sweats. */
  playWaterPlink(pos: Vector3): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const sp = this.spatialParams(pos);
    const drop = (at: number, f0: number, peak: number, dur: number) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f0, at);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.82, at + dur * 0.9);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(peak * sp.gain, at + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, at + dur);
      const pan = ctx.createStereoPanner();
      pan.pan.value = sp.pan;
      o.connect(g).connect(pan).connect(this.bus("ambience"));
      o.start(at);
      o.stop(at + dur + 0.02);
    };
    drop(t0, 2350, 0.028, 0.16);
    drop(t0 + 0.26, 1900, 0.014, 0.13);
    this.caption("water drip", pos);
  }

  /** A whistled note — sine with a slow human vibrato and a soft attack,
   *  riding the anomaly bus. walker.hum feeds it a melody; a quiet tune
   *  in a dead-quiet corridor is unmistakably wrong. */
  playWhistle(pos: Vector3, freq: number, dur = 0.42): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const sp = this.spatialParams(pos);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq * 0.985, t0);
    o.frequency.exponentialRampToValueAtTime(freq, t0 + 0.06);
    // ~5 Hz wobble at ±0.7% — a loose, unpractised whistle
    const vib = ctx.createOscillator();
    vib.type = "sine";
    vib.frequency.value = 5.2;
    const vibGain = ctx.createGain();
    vibGain.gain.value = freq * 0.007;
    vib.connect(vibGain).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.02 * sp.gain, t0 + 0.06);
    g.gain.setValueAtTime(0.02 * sp.gain, t0 + dur * 0.68);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    const pan = ctx.createStereoPanner();
    pan.pan.value = sp.pan;
    o.connect(g).connect(pan).connect(this.bus("anomaly"));
    o.start(t0);
    vib.start(t0);
    o.stop(t0 + dur + 0.03);
    vib.stop(t0 + dur + 0.03);
  }

  /** Muffled station PA — the corridor's recurring voice. A two-tone
   *  chime, then garbled horn-speaker speech: syllable-rhythm formant
   *  clusters through a narrow band. Unintelligible by design — the
   *  important thing is that it SOUNDS like an announcement. */
  playAnnouncement(pos: Vector3): void {
    this.duckAmbience(5);
    if (!this.ctx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const sp = this.spatialParams(pos);
    const pan = ctx.createStereoPanner();
    pan.pan.value = sp.pan;
    pan.connect(this.bus("voices"));

    // chime — the up-down pair every transit PA opens with
    [880, 659].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      const at = t0 + i * 0.42;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.06 * sp.gain, at + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.55);
      o.connect(g).connect(pan);
      o.start(at);
      o.stop(at + 0.6);
    });

    // horn-speaker band — tinny, band-limited, over-driven a touch
    const horn = ctx.createBiquadFilter();
    horn.type = "bandpass";
    horn.frequency.value = 1350;
    horn.Q.value = 0.8;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 420;
    const master = ctx.createGain();
    master.gain.value = 0.9;
    horn.connect(hp).connect(master).connect(pan);

    // syllable chain — two vowel formants per syllable, envelope
    // shaped like speech; clause gaps every so often; a consonant
    // hiss leads some syllables
    let t = t0 + 1.05;
    const syllables = 9 + Math.floor(this.rng.draw() * 7);
    for (let i = 0; i < syllables; i++) {
      const dur = 0.08 + this.rng.draw() * 0.13;
      const clause = this.rng.draw() < 0.16;
      const f1 = 300 + this.rng.draw() * 420;
      const f2 = 900 + this.rng.draw() * 1100;
      const at = t;
      for (const f of [f1, f2]) {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = f;
        const g = ctx.createGain();
        const peak = (f === f1 ? 0.055 : 0.03) * sp.gain;
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(peak, at + 0.018);
        g.gain.setValueAtTime(peak * 0.8, at + dur * 0.7);
        g.gain.linearRampToValueAtTime(0, at + dur);
        o.connect(g).connect(horn);
        o.start(at);
        o.stop(at + dur + 0.02);
      }
      // leading consonant hiss on ~1/3 of syllables
      if (this.rng.draw() < 0.35) {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.playbackRate.value = 1.4;
        const nf = ctx.createBiquadFilter();
        nf.type = "highpass";
        nf.frequency.value = 2600;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.022 * sp.gain, at - 0.035);
        g.gain.exponentialRampToValueAtTime(0.001, at);
        src.connect(nf).connect(g).connect(horn);
        src.start(at - 0.04);
        src.stop(at);
      }
      t += dur + (clause ? 0.28 + this.rng.draw() * 0.2 : 0.02 + this.rng.draw() * 0.1);
    }
    this.caption("PA announcement", pos);
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

  /** Single water drop landing — a short falling chirp with a tiny
   *  noise tick on impact, used by ceiling.weeps. Spatialized. */
  playDrip(pos: Vector3): void {
    if (!this.ctx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const sp = this.spatialParams(pos);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(1650, t0);
    o.frequency.exponentialRampToValueAtTime(720, t0 + 0.055);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.05 * sp.gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07);
    const pan = ctx.createStereoPanner();
    pan.pan.value = sp.pan;
    o.connect(g).connect(pan).connect(this.bus("ambience"));
    o.start(t0);
    o.stop(t0 + 0.08);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 4;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 3800;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.02 * sp.gain, t0);
    g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.03);
    src.connect(hp).connect(g2).connect(pan);
    src.start(t0);
    src.stop(t0 + 0.04);
    this.caption("water dripping", pos);
  }

  /** A door slam — deep body thud plus a mid metal crack, used by
   *  doors.slam. Heavier than a footstep; spatialized to the leaves. */
  playSlam(pos: Vector3): void {
    this.duckAmbience(0.8);
    if (!this.ctx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const sp = this.spatialParams(pos);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(115, t0);
    o.frequency.exponentialRampToValueAtTime(42, t0 + 0.22);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3 * sp.gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
    const pan = ctx.createStereoPanner();
    pan.pan.value = sp.pan;
    o.connect(g).connect(pan).connect(this.bus("anomaly"));
    o.start(t0);
    o.stop(t0 + 0.32);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.7;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.22 * sp.gain, t0);
    g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
    src.connect(lp).connect(g2).connect(pan);
    src.start(t0);
    src.stop(t0 + 0.1);
    this.caption("doors slam shut", pos);
  }

  /** A muffled knock from behind a wall panel — low thud plus a woody
   *  tap. Used by hatch.knocks; quieter and duller than playSlam, so it
   *  reads as behind-something rather than in the corridor. */
  playKnock(pos: Vector3): void {
    if (!this.ctx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const sp = this.spatialParams(pos);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t0);
    o.frequency.exponentialRampToValueAtTime(68, t0 + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.14 * sp.gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.13);
    const pan = ctx.createStereoPanner();
    pan.pan.value = sp.pan;
    o.connect(g).connect(pan).connect(this.bus("anomaly"));
    o.start(t0);
    o.stop(t0 + 0.15);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.9;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 300;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.12 * sp.gain, t0);
    g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06);
    src.connect(lp).connect(g2).connect(pan);
    src.start(t0);
    src.stop(t0 + 0.08);
    this.caption("something knocks behind the panel", pos);
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

  /** Inner door slide — a soft pneumatic hiss + servo whirr on open,
   *  and a lower whirr settling into a seal thump on close. Fires on
   *  every target change: auto-open on approach, seal on commit,
   *  re-open into the next loop. Spatialized to the door mouth. */
  playDoorSlide(pos: Vector3, opening: boolean): void {
    if (!this.ctx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const sp = this.spatialParams(pos);
    const pan = ctx.createStereoPanner();
    pan.pan.value = sp.pan;
    pan.connect(this.bus("machinery"));

    // servo tone — a light electric whirr, pitch rises while opening
    const o = ctx.createOscillator();
    o.type = "triangle";
    if (opening) {
      o.frequency.setValueAtTime(320, t0);
      o.frequency.linearRampToValueAtTime(390, t0 + 0.5);
    } else {
      o.frequency.setValueAtTime(240, t0);
      o.frequency.linearRampToValueAtTime(190, t0 + 0.5);
    }
    const og = ctx.createGain();
    og.gain.setValueAtTime(0, t0);
    og.gain.linearRampToValueAtTime(0.035 * sp.gain, t0 + 0.08);
    og.gain.linearRampToValueAtTime(0, t0 + 0.55);
    o.connect(og).connect(pan);
    o.start(t0);
    o.stop(t0 + 0.6);

    // pneumatic hiss — a short breath of high-passed noise
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 1.1;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = opening ? 1500 : 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.045 * sp.gain, t0 + 0.1);
    g.gain.linearRampToValueAtTime(0, t0 + 0.55);
    src.connect(hp).connect(g).connect(pan);
    src.start(t0, 0.2, 0.7);

    // seal thump on close — the leaves meeting
    if (!opening) {
      const th = ctx.createBufferSource();
      th.buffer = this.noiseBuffer;
      th.playbackRate.value = 0.5;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 170;
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(0, t0 + 0.42);
      tg.gain.linearRampToValueAtTime(0.14 * sp.gain, t0 + 0.45);
      tg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.62);
      th.connect(lp).connect(tg).connect(pan);
      th.start(t0 + 0.42, 0.3, 0.3);
      this.caption("door seals", pos);
    } else {
      this.caption("door opens", pos);
    }
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
  /** Chapter-advance stamp — a short rising two-note mark when the
   *  route raises your clearance. Softer than a judgment sting. */
  playAdvance(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    [311, 466].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      const at = t0 + i * 0.14;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.05, at + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.6);
      o.connect(g).connect(this.bus("ui"));
      o.start(at);
      o.stop(at + 0.65);
    });
    this.caption("clearance raised", null);
  }

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

  /** A loose sheet dragged across terrazzo — a dry soft scrape that
   *  swells as the paper bites then dies. Spatialized to the sheet. */
  playScrape(pos: Vector3): void {
    if (!this.ctx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const sp = this.spatialParams(pos);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.8;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 640;
    bp.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.05 * sp.gain, t0 + 0.25);
    g.gain.linearRampToValueAtTime(0.018 * sp.gain, t0 + 0.7);
    g.gain.linearRampToValueAtTime(0, t0 + 1.1);
    const pan = ctx.createStereoPanner();
    pan.pan.value = sp.pan;
    src.connect(bp).connect(g).connect(pan).connect(this.bus("ambience"));
    src.start(t0, 0.4, 1.1);
    this.caption("a sheet slides", pos);
  }
}
