/**
 * DOM overlay UI: start, pause, settings (tabbed), results, HUD, captions,
 * fade veil. Keyboard-navigable; pointer-events only where a screen is up.
 */
import type { Settings } from "../accessibility/settings";
import { COPY } from "../data/signage";
import { ALL_ANOMALIES } from "../game/anomalies";
import type { LoopState } from "../game/loop/loopManager";

export interface UiCallbacks {
  onStart(): void;
  onDaily(): void;
  onPractice(): void;
  onResume(): void;
  onRestart(): void;
  onSettingsChanged(): void;
  onResetData(): void;
}

export class GameUi {
  private root: HTMLDivElement;
  private screens = new Map<string, HTMLDivElement>();
  private hud: HTMLDivElement;
  private touchUse: HTMLButtonElement | null = null;
  private touchPause: HTMLButtonElement | null = null;
  private touchUseHandler: () => void = () => {};
  private touchPauseHandler: () => void = () => {};
  private veil: HTMLDivElement;
  private veilLabel: HTMLDivElement;
  private captions: HTMLDivElement;
  private stabilityEl!: {
    num: HTMLElement;
    bar: HTMLElement;
    tag: HTMLElement;
    ch: HTMLElement;
  };
  private commitHint!: HTMLDivElement;
  private usePrompt!: HTMLDivElement;
  private debugEl: HTMLDivElement;
  private captionQueue: { el: HTMLDivElement; until: number }[] = [];
  private cb: UiCallbacks;
  private dailyBtn: HTMLButtonElement | null = null;
  private archiveBody: HTMLDivElement | null = null;

  constructor(
    host: HTMLElement,
    private readonly settings: Settings,
    callbacks: UiCallbacks,
  ) {
    this.cb = callbacks;
    this.root = document.createElement("div");
    this.root.className = "na-root";
    host.appendChild(this.root);

    this.veil = document.createElement("div");
    this.veil.className = "na-veil";
    this.veilLabel = document.createElement("div");
    this.veilLabel.className = "label";
    this.veil.appendChild(this.veilLabel);
    this.root.appendChild(this.veil);

    this.hud = this.buildHud();
    this.root.appendChild(this.hud);

    this.captions = document.createElement("div");
    this.captions.className = "na-captions";
    this.root.appendChild(this.captions);

    this.debugEl = document.createElement("div");
    this.debugEl.className = "na-debug";
    this.root.appendChild(this.debugEl);

    this.screens.set("start", this.buildStart());
    this.screens.set("archive", this.buildArchive());
    this.screens.set("pause", this.buildPause());
    this.screens.set("settings", this.buildSettings());
    this.screens.set("results", this.buildResults());
    this.screens.set("credits", this.buildCredits());
    for (const s of this.screens.values()) this.root.appendChild(s);
  }

  private screen(id: string, inner: HTMLElement): HTMLDivElement {
    const s = document.createElement("div");
    s.className = "na-screen";
    s.dataset.screen = id;
    s.appendChild(inner);
    return s;
  }

  private panel(kicker: string, title: string): { panel: HTMLDivElement; body: HTMLDivElement } {
    const panel = document.createElement("div");
    panel.className = "na-panel";
    const header = document.createElement("header");
    header.innerHTML = `<div class="kicker"></div><h1></h1>`;
    (header.querySelector(".kicker") as HTMLElement).textContent = kicker;
    (header.querySelector("h1") as HTMLElement).textContent = title;
    const body = document.createElement("div");
    body.className = "body";
    panel.appendChild(header);
    panel.appendChild(body);
    return { panel, body };
  }

  private btn(label: string, sub: string | null, onClick: () => void, cls = ""): HTMLButtonElement {
    const b = document.createElement("button");
    b.className = `na-btn ${cls}`;
    b.textContent = label;
    if (sub) {
      const s = document.createElement("span");
      s.className = "sub";
      s.textContent = sub;
      b.appendChild(s);
    }
    b.addEventListener("click", () => {
      onClick();
    });
    return b;
  }

  // ── screens ────────────────────────────────────────────────────
  private buildStart(): HTMLDivElement {
    const { panel, body } = this.panel(FICTION_SUB(), "NIGHT AUDIT");
    const brief = document.createElement("p");
    brief.className = "na-brief";
    brief.textContent = COPY.startScreen.brief.join("\n");
    body.appendChild(brief);
    body.appendChild(
      this.btn(COPY.startScreen.begin, "new inspection run", () => this.cb.onStart(), "primary"),
    );
    this.dailyBtn = this.btn("DAILY ROUTE", "same shift for everyone, today", () => this.cb.onDaily());
    body.appendChild(this.dailyBtn);
    body.appendChild(
      this.btn("PRACTICE ROUTE", "endless loops · judgment feedback · no stakes", () => this.cb.onPractice()),
    );
    body.appendChild(
      this.btn("ROUTE ARCHIVE", "case file — filed divergences & records", () => this.show("archive")),
    );
    body.appendChild(this.btn("CREDITS", null, () => this.show("credits")));
    body.appendChild(
      this.btn("SETTINGS", "video · controls · audio · accessibility", () => this.openSettingsFrom("start")),
    );
    const note = document.createElement("p");
    note.className = "na-note";
    note.id = "na-start-note";
    note.textContent =
      "WebGPU preferred · WebGL 2 fallback · WASD to walk, mouse to look, Esc pauses. Gamepad & touch supported.";
    body.appendChild(note);
    return this.screen("start", panel);
  }

  /** Label the daily-route button with today's date / filed state. */
  setDailyLabel(date: string, filed: boolean): void {
    const s = this.dailyBtn?.querySelector(".sub");
    if (s) s.textContent = filed ? `${date} — already filed` : `${date} — same shift for everyone`;
  }

  setStartNote(text: string, warn = false): void {
    const n = this.root.querySelector("#na-start-note");
    if (n) {
      n.textContent = text;
      n.classList.toggle("warn", warn);
    }
  }

  // ── archive ───────────────────────────────────────────────────
  private buildArchive(): HTMLDivElement {
    const { panel, body } = this.panel("INSPECTOR RECORD", "ROUTE ARCHIVE");
    this.archiveBody = document.createElement("div");
    body.appendChild(this.archiveBody);
    body.appendChild(this.btn("BACK", null, () => this.show("start")));
    return this.screen("archive", panel);
  }

  /** Populate the route archive from the save — called at boot. */
  setArchiveData(
    stats: {
      runs: number;
      secured: number;
      best: number;
      logged: number;
      falseClears: number;
      falseAlarms: number;
      dailies: number;
    },
    discoveredIds: string[],
    notes: { title: string; lines: string[]; found: boolean }[] = [],
  ): void {
    const host = this.archiveBody;
    if (!host) return;
    host.innerHTML = "";
    const ROMAN = ["I", "II", "III"];
    const discovered = new Set(discoveredIds);

    const table = document.createElement("table");
    table.className = "na-stats";
    for (const [k, v] of [
      ["RUNS FILED", String(stats.runs)],
      ["ROUTES SECURED", String(stats.secured)],
      ["BEST STABILITY", String(stats.best)],
      ["DIVERGENCES LOGGED", String(stats.logged)],
      ["FALSE CLEARS", String(stats.falseClears)],
      ["FALSE ALARMS", String(stats.falseAlarms)],
      ["DAILY ROUTES", String(stats.dailies)],
    ] as [string, string][]) {
      const tr = document.createElement("tr");
      const a = document.createElement("td");
      a.textContent = k;
      const b = document.createElement("td");
      b.textContent = v;
      tr.appendChild(a);
      tr.appendChild(b);
      table.appendChild(tr);
    }
    host.appendChild(table);

    const log = document.createElement("div");
    log.className = "na-route-log na-archive";
    const head = document.createElement("div");
    head.className = "h";
    head.textContent = `DIVERGENCE REGISTER — ${discovered.size} OF ${ALL_ANOMALIES.length} FILED`;
    log.appendChild(head);
    const defs = [...ALL_ANOMALIES].sort((a, b) => a.chapter - b.chapter || a.id.localeCompare(b.id));
    for (const d of defs) {
      const row = document.createElement("div");
      if (discovered.has(d.id)) {
        row.className = "row";
        const nm = document.createElement("span");
        nm.textContent = d.displayName;
        const meta = document.createElement("span");
        meta.className = "ch";
        meta.textContent = `CH ${ROMAN[d.chapter - 1]} · ${d.category.toUpperCase()} · ${d.detectability.toUpperCase()}`;
        row.appendChild(nm);
        row.appendChild(meta);
      } else {
        row.className = "row locked";
        const nm = document.createElement("span");
        nm.textContent = "—— UNFILED ——";
        const meta = document.createElement("span");
        meta.className = "ch";
        meta.textContent = `CH ${ROMAN[d.chapter - 1]}`;
        row.appendChild(nm);
        row.appendChild(meta);
      }
      log.appendChild(row);
    }
    host.appendChild(log);

    if (notes.length > 0) {
      const doc = document.createElement("div");
      doc.className = "na-route-log na-archive";
      const dh = document.createElement("div");
      dh.className = "h";
      const found = notes.filter((n) => n.found).length;
      dh.textContent = `FIELD NOTES — ${found} OF ${notes.length} FILED`;
      doc.appendChild(dh);
      for (const n of notes) {
        const row = document.createElement("div");
        if (n.found) {
          row.className = "row";
          const nm = document.createElement("span");
          nm.textContent = n.title;
          const meta = document.createElement("span");
          meta.className = "ch";
          meta.textContent = "FILED";
          row.appendChild(nm);
          row.appendChild(meta);
          const det = document.createElement("div");
          det.className = "row note-lines";
          det.textContent = n.lines.filter((l) => l.length > 0).join(" ");
          doc.appendChild(row);
          doc.appendChild(det);
        } else {
          row.className = "row locked";
          const nm = document.createElement("span");
          nm.textContent = "—— UNFILED ——";
          row.appendChild(nm);
          const meta = document.createElement("span");
          meta.className = "ch";
          meta.textContent = "MEMO";
          row.appendChild(meta);
          doc.appendChild(row);
        }
      }
      host.appendChild(doc);
    }
  }

  private buildPause(): HTMLDivElement {
    const { panel, body } = this.panel("INSPECTION PAUSED", "HOLD ON LOOP 7");
    body.appendChild(this.btn("RESUME", "back to the concourse", () => this.cb.onResume(), "primary"));
    body.appendChild(this.btn("SETTINGS", null, () => this.openSettingsFrom("pause")));
    body.appendChild(
      this.btn("ABANDON SHIFT", "end this run — progress is kept", () => this.cb.onRestart(), "danger"),
    );
    return this.screen("pause", panel);
  }

  private settingsBack: () => void = () => this.show("start");
  private buildSettings(): HTMLDivElement {
    const { panel, body } = this.panel("FIELD KIT", "SETTINGS");
    const tabs = document.createElement("div");
    tabs.className = "na-tabs";
    const panes = new Map<string, HTMLDivElement>();
    const mkTab = (id: string, label: string, build: (p: HTMLDivElement) => void) => {
      const b = document.createElement("button");
      b.textContent = label;
      const pane = document.createElement("div");
      build(pane);
      panes.set(id, pane);
      b.addEventListener("click", () => {
        for (const [k, p] of panes) p.style.display = k === id ? "block" : "none";
        for (const bb of Array.from(tabs.children)) bb.classList.toggle("on", bb === b);
      });
      tabs.appendChild(b);
      return b;
    };

    const v = mkTab("video", "Video", (p) => this.buildVideoTab(p));
    mkTab("controls", "Controls", (p) => this.buildControlsTab(p));
    mkTab("audio", "Audio", (p) => this.buildAudioTab(p));
    mkTab("access", "Access", (p) => this.buildAccessTab(p));
    body.appendChild(tabs);
    for (const [k, p] of panes) {
      p.style.display = k === "video" ? "block" : "none";
      body.appendChild(p);
    }
    v.classList.add("on");
    body.appendChild(
      this.btn("BACK", null, () => {
        this.settingsBack();
        this.cb.onSettingsChanged();
      }),
    );
    return this.screen("settings", panel);
  }

  openSettingsFrom(from: "start" | "pause"): void {
    this.settingsBack = () => this.show(from);
    this.show("settings");
  }

  private field(label: string): { f: HTMLDivElement; val: HTMLSpanElement } {
    const f = document.createElement("div");
    f.className = "na-field";
    const l = document.createElement("label");
    l.innerHTML = `<span>${label}</span><span class="val"></span>`;
    f.appendChild(l);
    return { f, val: l.querySelector(".val") as HTMLSpanElement };
  }

  private slider(min: number, max: number, step: number, initial: number): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(initial);
    return input;
  }

  private buildVideoTab(p: HTMLDivElement): void {
    const s = this.settings;
    {
      const { f } = this.field("QUALITY");
      const seg = document.createElement("div");
      seg.className = "seg";
      for (const q of ["auto", "low", "medium", "high", "ultra"] as const) {
        const b = document.createElement("button");
        b.textContent = q;
        b.classList.toggle("on", s.video.quality === q);
        b.addEventListener("click", () => {
          s.video.quality = q;
          for (const bb of Array.from(seg.children)) bb.classList.toggle("on", bb === b);
          this.cb.onSettingsChanged();
        });
        seg.appendChild(b);
      }
      f.appendChild(seg);
      p.appendChild(f);
    }
    {
      const { f, val } = this.field("FOV");
      const input = this.slider(60, 100, 1, s.video.fov);
      val.textContent = `${s.video.fov}°`;
      input.addEventListener("input", () => {
        s.video.fov = Number(input.value);
        val.textContent = `${s.video.fov}°`;
        this.cb.onSettingsChanged();
      });
      f.appendChild(input);
      p.appendChild(f);
    }
    {
      const { f, val } = this.field("RENDER SCALE");
      const input = this.slider(0.5, 1, 0.05, s.video.renderScale);
      val.textContent = `${Math.round(s.video.renderScale * 100)}%`;
      input.addEventListener("input", () => {
        s.video.renderScale = Number(input.value);
        val.textContent = `${Math.round(s.video.renderScale * 100)}%`;
        this.cb.onSettingsChanged();
      });
      f.appendChild(input);
      p.appendChild(f);
    }
    {
      const { f } = this.field("RENDERER");
      const seg = document.createElement("div");
      seg.className = "seg";
      for (const q of ["auto", "webgl", "webgpu"] as const) {
        const b = document.createElement("button");
        b.textContent = q === "webgl" ? "WebGL 2" : q === "webgpu" ? "WebGPU" : "auto";
        b.classList.toggle("on", s.video.engine === q);
        b.addEventListener("click", () => {
          s.video.engine = q;
          for (const bb of Array.from(seg.children)) bb.classList.toggle("on", bb === b);
          this.cb.onSettingsChanged();
        });
        seg.appendChild(b);
      }
      f.appendChild(seg);
      const note = document.createElement("p");
      note.className = "na-note";
      note.textContent = "Renderer changes apply on next launch.";
      f.appendChild(note);
      p.appendChild(f);
    }
  }

  private buildControlsTab(p: HTMLDivElement): void {
    const s = this.settings;
    const { f, val } = this.field("MOUSE SENSITIVITY");
    const input = this.slider(0.2, 3, 0.05, s.controls.sensitivity);
    val.textContent = `${s.controls.sensitivity.toFixed(2)}×`;
    input.addEventListener("input", () => {
      s.controls.sensitivity = Number(input.value);
      val.textContent = `${s.controls.sensitivity.toFixed(2)}×`;
      this.cb.onSettingsChanged();
    });
    f.appendChild(input);
    p.appendChild(f);

    const { f: fb, val: vb } = this.field("HEAD MOTION");
    const inputb = this.slider(0, 1, 0.05, s.controls.bobAmount);
    vb.textContent = `${Math.round(s.controls.bobAmount * 100)}%`;
    inputb.addEventListener("input", () => {
      s.controls.bobAmount = Number(inputb.value);
      vb.textContent = `${Math.round(s.controls.bobAmount * 100)}%`;
      this.cb.onSettingsChanged();
    });
    fb.appendChild(inputb);
    p.appendChild(fb);

    const inv = document.createElement("label");
    inv.className = "na-check";
    const invc = document.createElement("input");
    invc.type = "checkbox";
    invc.checked = s.controls.invertY;
    invc.addEventListener("change", () => {
      s.controls.invertY = invc.checked;
      this.cb.onSettingsChanged();
    });
    inv.appendChild(invc);
    inv.appendChild(Object.assign(document.createElement("span"), { textContent: "INVERT LOOK Y" }));
    p.appendChild(inv);

    const note = document.createElement("p");
    note.className = "na-note";
    note.textContent =
      "Move: W A S D · Interact: E · Pause: Esc · Full remapping arrives with the controller update (M3).";
    p.appendChild(note);
  }

  private buildAudioTab(p: HTMLDivElement): void {
    const s = this.settings;
    const mk = (label: string, get: () => number, set: (v: number) => void) => {
      const { f, val } = this.field(label);
      const input = this.slider(0, 1, 0.05, get());
      val.textContent = `${Math.round(get() * 100)}%`;
      input.addEventListener("input", () => {
        set(Number(input.value));
        val.textContent = `${Math.round(get() * 100)}%`;
        this.cb.onSettingsChanged();
      });
      f.appendChild(input);
      p.appendChild(f);
    };
    mk(
      "MASTER",
      () => s.audio.master,
      (v) => (s.audio.master = v),
    );
    mk(
      "AMBIENCE",
      () => s.audio.ambience,
      (v) => (s.audio.ambience = v),
    );
    mk(
      "FOOTSTEPS",
      () => s.audio.footsteps,
      (v) => (s.audio.footsteps = v),
    );
    mk(
      "ANOMALY",
      () => s.audio.anomaly,
      (v) => (s.audio.anomaly = v),
    );
    mk(
      "INTERFACE",
      () => s.audio.ui,
      (v) => (s.audio.ui = v),
    );

    const mute = document.createElement("label");
    mute.className = "na-check";
    const mc = document.createElement("input");
    mc.type = "checkbox";
    mc.checked = s.audio.muted;
    mc.addEventListener("change", () => {
      s.audio.muted = mc.checked;
      this.cb.onSettingsChanged();
    });
    mute.appendChild(mc);
    mute.appendChild(Object.assign(document.createElement("span"), { textContent: "MUTE ALL" }));
    p.appendChild(mute);
  }

  private buildAccessTab(p: HTMLDivElement): void {
    const s = this.settings;
    const mkCheck = (label: string, get: () => boolean, set: (v: boolean) => void) => {
      const el = document.createElement("label");
      el.className = "na-check";
      const c = document.createElement("input");
      c.type = "checkbox";
      c.checked = get();
      c.addEventListener("change", () => {
        set(c.checked);
        this.cb.onSettingsChanged();
      });
      el.appendChild(c);
      el.appendChild(Object.assign(document.createElement("span"), { textContent: label }));
      p.appendChild(el);
    };
    const a = s.accessibility;
    mkCheck(
      "REDUCED MOTION",
      () => a.reducedMotion,
      (v) => (a.reducedMotion = v),
    );
    mkCheck(
      "CAPTIONS",
      () => a.captions,
      (v) => (a.captions = v),
    );
    mkCheck(
      "VISUAL SOUND CUES",
      () => a.visualSoundCues,
      (v) => (a.visualSoundCues = v),
    );
    mkCheck(
      "HIGH-CONTRAST COMMIT ZONES",
      () => a.highContrastCommitZones,
      (v) => (a.highContrastCommitZones = v),
    );
    mkCheck(
      "REDUCE STARTLE (SOFTER STINGERS)",
      () => a.reduceStartle,
      (v) => (a.reduceStartle = v),
    );

    const reset = this.btn(
      "RESET ALL DATA",
      "settings, records and discoveries are wiped",
      () => {
        if (confirm("Reset all NIGHT AUDIT data on this device?")) this.cb.onResetData();
      },
      "danger",
    );
    p.appendChild(reset);
  }

  private buildResults(): HTMLDivElement {
    const { panel, body } = this.panel(FICTION_SUB(), "SHIFT REPORT");
    body.id = "na-results-body";
    return this.screen("results", panel);
  }

  showResults(
    outcome: "secure" | "lost" | "practice",
    state: LoopState,
    stats: {
      loops: number;
      correct: number;
      mistakes: number;
      discovered: number;
      filed: { name: string; chapter: number }[];
      practice?: boolean;
      ending?: "standard" | "investigative" | "lost" | "practice";
      notes?: string;
    },
  ): void {
    const screenEl = this.screens.get("results");
    if (!screenEl) return;
    const body = screenEl.querySelector(".body") as HTMLDivElement;
    body.innerHTML = "";
    const stamp = document.createElement("div");
    const practice = stats.practice === true;
    stamp.className = `na-stamp ${practice || outcome === "secure" ? "ok" : "bad"}`;
    stamp.textContent = practice
      ? "PRACTICE SHIFT"
      : stats.ending === "investigative"
        ? "DOSSIER COMPLETE — ROUTE SECURED"
        : outcome === "secure"
          ? COPY.results.secured
          : COPY.results.lost;
    body.appendChild(stamp);
    const epilogue = document.createElement("p");
    epilogue.className = "na-epilogue";
    const ek = stats.ending ?? (practice ? "practice" : outcome === "secure" ? "standard" : "lost");
    epilogue.textContent = COPY.results.epilogues[ek];
    body.appendChild(epilogue);
    const table = document.createElement("table");
    table.className = "na-stats";
    const rows: [string, string][] = [
      ["LOOPS WALKED", String(stats.loops)],
      ["CORRECT FILINGS", String(stats.correct)],
      ["ERRORS", String(stats.mistakes)],
      ["ANOMALIES DISCOVERED", String(stats.discovered)],
      ["FIELD NOTES", stats.notes ?? "0/6"],
      ["FINAL STABILITY", `${state.stability}`],
    ];
    for (const [k, v] of rows) {
      const tr = document.createElement("tr");
      const a = document.createElement("td");
      a.textContent = k;
      const b = document.createElement("td");
      b.textContent = v;
      tr.appendChild(a);
      tr.appendChild(b);
      table.appendChild(tr);
    }
    body.appendChild(table);

    const log = document.createElement("div");
    log.className = "na-route-log";
    const logHead = document.createElement("div");
    logHead.className = "h";
    logHead.textContent = "FILED DIVERGENCES";
    log.appendChild(logHead);
    if (stats.filed.length === 0) {
      const none = document.createElement("div");
      none.className = "row muted";
      none.textContent = "route filed clean — nothing logged";
      log.appendChild(none);
    } else {
      for (const f of stats.filed) {
        const row = document.createElement("div");
        row.className = "row";
        const nm = document.createElement("span");
        nm.textContent = f.name;
        const ch = document.createElement("span");
        ch.className = "ch";
        ch.textContent = `CH ${["I", "II", "III"][f.chapter - 1] ?? "I"}`;
        row.appendChild(nm);
        row.appendChild(ch);
        log.appendChild(row);
      }
    }
    body.appendChild(log);

    body.appendChild(this.btn("FILE ANOTHER SHIFT", "new run", () => this.cb.onRestart(), "primary"));
    this.show("results");
  }

  private buildCredits(): HTMLDivElement {
    const { panel, body } = this.panel("SHIFT LOG · APPENDIX", COPY.credits.title);
    for (const line of COPY.credits.lines) {
      const p = document.createElement("p");
      p.className = "na-credit-line";
      p.textContent = line;
      body.appendChild(p);
    }
    body.appendChild(this.btn("BACK", null, () => this.show("start")));
    return this.screen("credits", panel);
  }

  // ── HUD + veil + captions ──────────────────────────────────────
  private buildHud(): HTMLDivElement {
    const h = document.createElement("div");
    h.className = "na-hud";
    h.innerHTML = `
      <div class="loop-tag">LOOP <b class="n">01</b><span class="ch">CH I</span></div>
      <div class="stability">STABILITY<b class="n">40</b><div class="bar"><i></i></div></div>
      <div class="reticle"></div>
      <div class="use-prompt"></div>
      <div class="commit-hint">COMMIT AT AN INSPECTION POINT</div>
      <div class="touch-ui">
        <button class="touch-pause" aria-label="Pause">II</button>
        <button class="touch-use" aria-label="Interact">USE</button>
      </div>
    `;
    this.stabilityEl = {
      num: h.querySelector(".stability .n") as HTMLElement,
      bar: h.querySelector(".stability .bar i") as HTMLElement,
      tag: h.querySelector(".loop-tag .n") as HTMLElement,
      ch: h.querySelector(".loop-tag .ch") as HTMLElement,
    };
    this.commitHint = h.querySelector(".commit-hint") as HTMLDivElement;
    this.usePrompt = h.querySelector(".use-prompt") as HTMLDivElement;
    this.touchUse = h.querySelector(".touch-use") as HTMLButtonElement;
    this.touchPause = h.querySelector(".touch-pause") as HTMLButtonElement;
    // stop the look/move sticks from claiming taps that land on buttons
    for (const b of [this.touchUse, this.touchPause]) {
      b.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    }
    this.touchUse.addEventListener("click", () => this.touchUseHandler());
    this.touchPause.addEventListener("click", () => this.touchPauseHandler());
    return h;
  }

  /** Wire the touch-only buttons (visible on coarse pointers). */
  bindTouchHandlers(use: () => void, pause: () => void): void {
    this.touchUseHandler = use;
    this.touchPauseHandler = pause;
  }

  /** Focus prompt under the reticle — "FIELD NOTE — …" / terminal labels. */
  setUsePrompt(text: string | null, key = "E"): void {
    this.usePrompt.textContent = text ? `[${key}] ${text}` : "";
    this.usePrompt.classList.toggle("on", text !== null);
    this.touchUse?.classList.toggle("armed", text !== null);
  }

  setStability(v: number): void {
    this.stabilityEl.num.textContent = String(v);
    this.stabilityEl.bar.style.width = `${Math.max(0, Math.min(100, v))}%`;
  }

  setLoopIndex(i: number): void {
    this.stabilityEl.tag.textContent = String(i).padStart(2, "0");
  }

  setChapter(ch: number): void {
    this.stabilityEl.ch.textContent = `CH ${["I", "II", "III"][ch - 1] ?? "I"}`;
  }

  show(id: "start" | "archive" | "pause" | "settings" | "results" | "credits" | "none"): void {
    for (const [k, s] of this.screens) s.classList.toggle("on", k === id);
    this.hud.classList.toggle("on", id === "none");
  }

  veilOn(label: string | null): void {
    this.veil.classList.add("on");
    this.veilLabel.textContent = label ?? "";
  }

  veilOff(): void {
    this.veil.classList.remove("on");
    this.veilLabel.textContent = "";
  }

  caption(text: string, dir: string | null): void {
    const el = document.createElement("div");
    el.className = "na-caption";
    if (dir) {
      const d = document.createElement("span");
      d.className = "dir";
      d.textContent = dir === "left" ? "←" : dir === "right" ? "→" : dir === "behind" ? "↓" : "·";
      el.appendChild(d);
    }
    el.appendChild(document.createTextNode(text));
    this.captions.appendChild(el);
    this.captionQueue.push({ el, until: performance.now() + 2600 });
    while (this.captionQueue.length > 3) {
      const old = this.captionQueue.shift();
      old?.el.remove();
    }
  }

  setDebug(on: boolean): void {
    this.debugEl.classList.toggle("on", on);
  }

  setDebugText(t: string): void {
    this.debugEl.textContent = t;
  }

  update(): void {
    const now = performance.now();
    while (this.captionQueue.length > 0 && this.captionQueue[0] && this.captionQueue[0].until < now) {
      const c = this.captionQueue.shift();
      c?.el.remove();
    }
    this.commitHint.classList.toggle("contrast", this.settings.accessibility.highContrastCommitZones);
  }

  dispose(): void {
    this.root.remove();
  }
}

function FICTION_SUB(): string {
  return "CIVIC WORKS AUTHORITY · ROUTE INTEGRITY";
}
