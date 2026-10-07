/**
 * Procedural DynamicTextures — every texture in the slice is generated in
 * code from seeded RNG (no external files, no licensing surface). Seeded so
 * the same run seed reproduces identical surfaces.
 */
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";
import type { RngStream } from "../../game/state/rng";
import type { SignSpec } from "../../data/signage";

function tex(name: string, w: number, h: number, scene: Scene): DynamicTexture {
  const t = new DynamicTexture(name, { width: w, height: h }, scene, true);
  t.hasAlpha = false;
  return t;
}

/** Babylon's ICanvasRenderingContext typings are narrower than the real
 *  2D context handed back at runtime. */
type Ctx = CanvasRenderingContext2D;
function ctx(t: DynamicTexture): Ctx {
  return t.getContext() as unknown as Ctx;
}

function finish(t: DynamicTexture): DynamicTexture {
  t.update();
  t.wrapU = Texture.WRAP_ADDRESSMODE;
  t.wrapV = Texture.WRAP_ADDRESSMODE;
  return t;
}

export interface TextureSet {
  terrazzo: DynamicTexture;
  wallPanel: DynamicTexture;
  ceilingTile: DynamicTexture;
  steel: DynamicTexture;
  shutter: DynamicTexture;
  concrete: DynamicTexture;
  darkGlassNote: DynamicTexture; // subtle smudge map for the gallery glass
  condensation: DynamicTexture; // alpha patch — footsteps.extra visual cue
  posters: DynamicTexture[];
  clockFace: DynamicTexture;
  signs: Map<string, DynamicTexture>;
  terminal: DynamicTexture; // airlock terminal screen (live-updated)
}

/** Speckled terrazzo with brass divider strips. Tiles every 1.2 m. */
function makeTerrazzo(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 512;
  const t = tex("tex.terrazzo", s, s, scene);
  const c = ctx(t);
  c.fillStyle = "#8f8a80";
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 5200; i++) {
    const x = rng.draw() * s;
    const y = rng.draw() * s;
    const r = rng.draw() * 2.2 + 0.4;
    const v = rng.draw();
    c.fillStyle =
      v < 0.55
        ? `rgba(${120 + rng.int(0, 60)},${115 + rng.int(0, 55)},${105 + rng.int(0, 50)},0.55)`
        : v < 0.85
          ? `rgba(${70 + rng.int(0, 40)},${68 + rng.int(0, 38)},${62 + rng.int(0, 34)},0.5)`
          : `rgba(${170 + rng.int(0, 40)},${160 + rng.int(0, 40)},${145 + rng.int(0, 35)},0.5)`;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  // brass divider strips on quarter grid
  c.fillStyle = "#7d6f45";
  c.fillRect(0, 0, s, 5);
  c.fillRect(0, 0, 5, s);
  c.fillStyle = "rgba(255,240,200,0.25)";
  c.fillRect(5, 0, 2, s);
  c.fillRect(0, 5, s, 2);
  return finish(t);
}

/** Off-white wall panel: micro grain + vertical seams + baseboard scuff. */
function makeWallPanel(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 256;
  const t = tex("tex.wallPanel", s, s, scene);
  const c = ctx(t);
  c.fillStyle = "#e7e4dc";
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) {
    const g = 225 + rng.int(0, 25);
    c.fillStyle = `rgba(${g},${g - 2},${g - 8},${0.16 + rng.draw() * 0.2})`;
    c.fillRect(rng.draw() * s, rng.draw() * s, 1 + rng.draw() * 2, 1 + rng.draw() * 6);
  }
  // panel seam lines (1200mm module rendered on 1 panel = center seam)
  c.fillStyle = "rgba(120,118,110,0.55)";
  c.fillRect(0, 0, 2, s);
  c.fillRect(s - 2, 0, 2, s);
  // scuff band near the bottom
  const grad = c.createLinearGradient(0, s * 0.82, 0, s);
  grad.addColorStop(0, "rgba(90,88,80,0)");
  grad.addColorStop(1, "rgba(80,78,70,0.28)");
  c.fillStyle = grad;
  c.fillRect(0, s * 0.82, s, s * 0.18);
  return finish(t);
}

function makeCeilingTile(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 256;
  const t = tex("tex.ceilingTile", s, s, scene);
  const c = ctx(t);
  c.fillStyle = "#d8d5cd";
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 1600; i++) {
    const g = 200 + rng.int(0, 40);
    c.fillStyle = `rgba(${g},${g},${g - 6},0.35)`;
    c.fillRect(rng.draw() * s, rng.draw() * s, 1.5, 1.5);
  }
  c.strokeStyle = "rgba(100,98,92,0.7)";
  c.lineWidth = 3;
  c.strokeRect(0, 0, s, s);
  return finish(t);
}

function makeSteel(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 256;
  const t = tex("tex.steel", s, s, scene);
  const c = ctx(t);
  c.fillStyle = "#aeb2b5";
  c.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y++) {
    const g = 168 + rng.int(0, 30);
    c.fillStyle = `rgba(${g},${g + 3},${g + 6},0.5)`;
    c.fillRect(0, y, s, 1);
  }
  for (let i = 0; i < 90; i++) {
    c.fillStyle = `rgba(60,62,66,${0.05 + rng.draw() * 0.08})`;
    c.fillRect(rng.draw() * s, rng.draw() * s, rng.draw() * 30, 1);
  }
  return finish(t);
}

/** Security shutter: horizontal slats. */
function makeShutter(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 256;
  const t = tex("tex.shutter", s, s, scene);
  const c = ctx(t);
  c.fillStyle = "#8e9296";
  c.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 16) {
    c.fillStyle = "rgba(40,42,46,0.85)";
    c.fillRect(0, y, s, 3);
    const g = 150 + rng.int(0, 24);
    c.fillStyle = `rgb(${g},${g + 3},${g + 6})`;
    c.fillRect(0, y + 3, s, 13);
    c.fillStyle = "rgba(255,255,255,0.12)";
    c.fillRect(0, y + 3, s, 2);
  }
  return finish(t);
}

function makeConcrete(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 256;
  const t = tex("tex.concrete", s, s, scene);
  const c = ctx(t);
  c.fillStyle = "#7c7870";
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 2400; i++) {
    const g = 105 + rng.int(0, 45);
    c.fillStyle = `rgba(${g},${g - 2},${g - 6},0.4)`;
    c.fillRect(rng.draw() * s, rng.draw() * s, 1 + rng.draw() * 2, 1 + rng.draw() * 2);
  }
  return finish(t);
}

function makeSmudge(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 256;
  const t = tex("tex.smudge", s, s, scene);
  const c = ctx(t);
  c.fillStyle = "#808080";
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 140; i++) {
    const x = rng.draw() * s;
    const y = rng.draw() * s;
    const r = 8 + rng.draw() * 40;
    const grad = c.createRadialGradient(x, y, 0, x, y, r);
    const v = 118 + rng.int(0, 24);
    grad.addColorStop(0, `rgba(${v},${v},${v},0.5)`);
    grad.addColorStop(1, "rgba(128,128,128,0)");
    c.fillStyle = grad;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  return finish(t);
}

/** Soft radial fog patch — the breath-on-glass cue for footsteps.extra. */
function makeCondensation(scene: Scene): DynamicTexture {
  const s = 256;
  const t = tex("tex.condensation", s, s, scene);
  t.hasAlpha = true;
  const c = ctx(t);
  c.clearRect(0, 0, s, s);
  const grad = c.createRadialGradient(s / 2, s / 2, 8, s / 2, s / 2, s / 2);
  grad.addColorStop(0, "rgba(210,220,225,0.55)");
  grad.addColorStop(0.7, "rgba(205,215,220,0.22)");
  grad.addColorStop(1, "rgba(200,210,215,0)");
  c.fillStyle = grad;
  c.fillRect(0, 0, s, s);
  return finish(t);
}

export interface PosterDef {
  title: string;
  sub: string[];
  bg: string;
  fg: string;
}

/** Fictional notice posters — municipal micro-copy, never real branding. */
export const POSTER_DEFS: PosterDef[] = [
  {
    title: "QUIET HOURS",
    sub: ["CONCOURSE OBSERVES", "22:00 – 06:00", "CIVIC WORKS AUTHORITY"],
    bg: "#20242a",
    fg: "#e8a33d",
  },
  {
    title: "SORT YOUR REFUSE",
    sub: ["ORGANICS · GLASS · MIXED", "BAY 12 · RECORDS WALL", "AIDER CITY BYLAW 44-C"],
    bg: "#1d2b2b",
    fg: "#4fa8b8",
  },
  {
    title: "REPORT DRIFT",
    sub: ["UNLOGGED CHANGES ARE", "A ROUTE SAFETY ISSUE", "DIAL 7-700 INTERNAL"],
    bg: "#2a2024",
    fg: "#d8d5cd",
  },
];

/** Redraw a poster texture in place — used at build and by poster anomalies. */
export function drawPoster(t: DynamicTexture, d: PosterDef): void {
  const w = 256;
  const h = 384;
  const c = ctx(t);
  c.fillStyle = d.bg;
  c.fillRect(0, 0, w, h);
  c.strokeStyle = d.fg;
  c.lineWidth = 6;
  c.strokeRect(10, 10, w - 20, h - 20);
  c.fillStyle = d.fg;
  c.font = "bold 24px Arial, sans-serif";
  c.textAlign = "center";
  c.fillText(d.title, w / 2, 76);
  c.font = "16px Arial, sans-serif";
  d.sub.forEach((line, j) => c.fillText(line, w / 2, 150 + j * 44));
  c.font = "15px Arial, sans-serif";
  c.fillText("— 7 —", w / 2, h - 40);
  t.update();
}

function makePosters(scene: Scene): DynamicTexture[] {
  return POSTER_DEFS.map((d, i) => {
    const t = tex(`tex.poster.${i}`, 256, 384, scene);
    drawPoster(t, d);
    return finish(t);
  });
}

/**
 * Draw a clock face in place — used at build and by clock anomalies.
 * `numerals[i]` is the numeral drawn at clock position i+1; omit for 1–12.
 */
export function drawClockFace(t: DynamicTexture, numerals?: number[]): void {
  const s = 256;
  const c = ctx(t);
  c.clearRect(0, 0, s, s);
  c.fillStyle = "#eceae3";
  c.beginPath();
  c.arc(s / 2, s / 2, s / 2 - 4, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#2a2c30";
  c.lineWidth = 6;
  c.stroke();
  c.fillStyle = "#2a2c30";
  c.textAlign = "center";
  c.textBaseline = "middle";
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const r = s / 2 - 34;
    c.font = "bold 22px Arial, sans-serif";
    const n = numerals?.[i - 1] ?? i;
    c.fillText(String(n), s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r);
  }
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const r0 = s / 2 - (i % 5 === 0 ? 18 : 12);
    const r1 = s / 2 - 8;
    c.strokeStyle = "#2a2c30";
    c.lineWidth = i % 5 === 0 ? 3 : 1.5;
    c.beginPath();
    c.moveTo(s / 2 + Math.cos(a) * r0, s / 2 + Math.sin(a) * r0);
    c.lineTo(s / 2 + Math.cos(a) * r1, s / 2 + Math.sin(a) * r1);
    c.stroke();
  }
  c.fillStyle = "#4a4d52";
  c.font = "11px Arial, sans-serif";
  c.fillText("CWA STANDARD", s / 2, s / 2 + 52);
  t.update();
}

function makeClockFace(scene: Scene): DynamicTexture {
  const t = tex("tex.clockFace", 256, 256, scene);
  t.hasAlpha = true;
  drawClockFace(t);
  return finish(t);
}

/** Redraw a sign texture in place — used at build and by signage anomalies. */
export function drawSign(t: DynamicTexture, spec: SignSpec): void {
  const w = 512;
  const h = 160;
  const c = ctx(t);
  const tones = {
    amber: { bg: "#23262c", fg: "#e8a33d", edge: "#e8a33d" },
    cyan: { bg: "#1e2a2c", fg: "#7fd4e0", edge: "#4fa8b8" },
    dark: { bg: "#17191d", fg: "#c9c6bc", edge: "#4a4d52" },
  }[spec.tone];
  c.fillStyle = tones.bg;
  c.fillRect(0, 0, w, h);
  c.strokeStyle = tones.edge;
  c.lineWidth = 4;
  c.strokeRect(8, 8, w - 16, h - 16);
  c.fillStyle = tones.fg;
  c.textAlign = "center";
  c.font = "bold 44px Arial, sans-serif";
  const arrow = spec.arrow === "right" ? "  →" : spec.arrow === "left" ? "←  " : "";
  c.fillText(spec.title + arrow, w / 2, spec.sub ? 78 : 92);
  if (spec.sub) {
    c.font = "24px Arial, sans-serif";
    c.fillStyle = spec.tone === "dark" ? tones.fg : "#c9c6bc";
    c.fillText(spec.sub, w / 2, 122);
  }
  t.update();
}

function makeSignTexture(spec: SignSpec, scene: Scene): DynamicTexture {
  const t = tex(`tex.${spec.id}`, 512, 160, scene);
  drawSign(t, spec);
  return finish(t);
}

/** Live airlock terminal — rewritten per loop transition. */
function makeTerminal(scene: Scene): DynamicTexture {
  const t = tex("tex.terminal", 512, 256, scene);
  const c = ctx(t);
  c.fillStyle = "#10141a";
  c.fillRect(0, 0, 512, 256);
  return finish(t);
}

export function buildTextureSet(scene: Scene, rng: RngStream, signs: SignSpec[]): TextureSet {
  const signMap = new Map<string, DynamicTexture>();
  for (const s of signs) signMap.set(s.id, makeSignTexture(s, scene));
  return {
    terrazzo: makeTerrazzo(scene, rng),
    wallPanel: makeWallPanel(scene, rng),
    ceilingTile: makeCeilingTile(scene, rng),
    steel: makeSteel(scene, rng),
    shutter: makeShutter(scene, rng),
    concrete: makeConcrete(scene, rng),
    darkGlassNote: makeSmudge(scene, rng),
    condensation: makeCondensation(scene),
    posters: makePosters(scene),
    clockFace: makeClockFace(scene),
    signs: signMap,
    terminal: makeTerminal(scene),
  };
}

/** Rewrite the airlock terminal contents (called per loop transition). */
export function drawTerminal(
  t: DynamicTexture,
  lines: { header: string; rows: { label: string; value: string; tone?: "ok" | "warn" | "bad" }[] },
): void {
  const c = ctx(t);
  c.fillStyle = "#10141a";
  c.fillRect(0, 0, 512, 256);
  c.strokeStyle = "#3a3d40";
  c.lineWidth = 3;
  c.strokeRect(6, 6, 500, 244);
  c.fillStyle = "#e8a33d";
  c.font = "bold 26px ui-monospace, Menlo, monospace";
  c.textAlign = "left";
  c.fillText(lines.header, 26, 48);
  c.fillStyle = "#4a4d52";
  c.fillRect(26, 62, 460, 2);
  c.font = "20px ui-monospace, Menlo, monospace";
  lines.rows.forEach((row, i) => {
    const y = 104 + i * 34;
    c.fillStyle = "#8f8a80";
    c.fillText(row.label, 26, y);
    c.fillStyle =
      row.tone === "ok"
        ? "#7fd4a0"
        : row.tone === "warn"
          ? "#e8a33d"
          : row.tone === "bad"
            ? "#d86a5a"
            : "#c9c6bc";
    c.textAlign = "right";
    c.fillText(row.value, 486, y);
    c.textAlign = "left";
  });
  t.update();
}
