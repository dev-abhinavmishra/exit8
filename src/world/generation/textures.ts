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
  const c = t.getContext() as unknown as Ctx;
  // texture contexts persist across repaints — without a reset every
  // painter's scale() compounds and redrawn signs/posters blow up
  c.setTransform(1, 0, 0, 1, 0, 0);
  return c;
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
  wallPanelBump: DynamicTexture; // normal map for the grout relief
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
  fadeStrip: DynamicTexture; // linear fade — fake ambient occlusion
  guideStrip: DynamicTexture; // tactile guide bar channels for the floor
  lightShaft: DynamicTexture; // soft volumetric cone under a troffer
  domePad: DynamicTexture; // truncated-dome warning pad at door thresholds
  blinds: DynamicTexture; // horizontal venetian slats, alpha-gapped
  puddle: DynamicTexture; // radial damp patch for floor drains
}

/** Speckled terrazzo with brass divider strips. Tiles every 1.2 m. */
function makeTerrazzo(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 1024;
  const t = tex("tex.terrazzo", s, s, scene);
  const c = ctx(t);
  // lighter warm-grey field — the reference floor is pale polished
  // tile, not asphalt; speckles keep the same speckle language lifted
  c.fillStyle = "#a39c8f";
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 5200; i++) {
    const x = rng.draw() * s;
    const y = rng.draw() * s;
    const r = rng.draw() * 4.4 + 0.8;
    const v = rng.draw();
    c.fillStyle =
      v < 0.55
        ? `rgba(${140 + rng.int(0, 60)},${135 + rng.int(0, 55)},${124 + rng.int(0, 50)},0.55)`
        : v < 0.85
          ? `rgba(${88 + rng.int(0, 40)},${85 + rng.int(0, 38)},${78 + rng.int(0, 34)},0.5)`
          : `rgba(${185 + rng.int(0, 40)},${176 + rng.int(0, 40)},${160 + rng.int(0, 35)},0.5)`;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  // brass divider strips on quarter grid
  c.fillStyle = "#7d6f45";
  c.fillRect(0, 0, s, 10);
  c.fillRect(0, 0, 10, s);
  c.fillStyle = "rgba(255,240,200,0.25)";
  c.fillRect(10, 0, 4, s);
  c.fillRect(0, 10, s, 4);
  return finish(t);
}

/** Off-white wall panel: micro grain + vertical seams + baseboard scuff. */
function makeWallPanel(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 512;
  const t = tex("tex.wallPanel", s, s, scene);
  const c = ctx(t);
  c.fillStyle = "#edeae2";
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) {
    const g = 228 + rng.int(0, 24);
    c.fillStyle = `rgba(${g},${g - 2},${g - 8},${0.16 + rng.draw() * 0.2})`;
    c.fillRect(rng.draw() * s, rng.draw() * s, 1 + rng.draw() * 2, 1 + rng.draw() * 6);
  }
  // subway-tile grout: horizontal courses + a vertical half-course so
  // the panels read as glazed tile up close, not painted drywall
  c.fillStyle = "rgba(140,137,128,0.55)";
  for (let row = 1; row < 5; row++) {
    c.fillRect(0, (s / 5) * row - 1, s, 2);
  }
  c.fillRect(s / 2 - 1, 0, 2, s);
  // panel seam lines (1200mm module rendered on 1 panel = center seam)
  c.fillStyle = "rgba(115,112,104,0.7)";
  c.fillRect(0, 0, 4, s);
  c.fillRect(s - 4, 0, 4, s);
  // scuff band near the bottom
  const grad = c.createLinearGradient(0, s * 0.82, 0, s);
  grad.addColorStop(0, "rgba(90,88,80,0)");
  grad.addColorStop(1, "rgba(80,78,70,0.28)");
  c.fillStyle = grad;
  c.fillRect(0, s * 0.82, s, s * 0.18);
  return finish(t);
}

/** Tangent-space normal map matching makeWallPanel's groove layout so
 * the grout courses and panel seams catch light as real relief rather
 * than printed lines. Height field → Sobel gradients → RGB normals. */
function makeWallPanelBump(scene: Scene): DynamicTexture {
  const s = 512;
  const t = tex("tex.wallPanel.bump", s, s, scene);
  const c = ctx(t);
  const height = new Float32Array(s * s).fill(1);
  const groove = (x0: number, y0: number, w: number, h: number) => {
    for (let y = Math.max(0, y0); y < Math.min(s, y0 + h); y++) {
      for (let x = Math.max(0, x0); x < Math.min(s, x0 + w); x++) {
        height[y * s + x] = 0.35;
      }
    }
  };
  for (let row = 1; row < 5; row++) groove(0, Math.round((s / 5) * row) - 2, s, 4);
  groove(Math.round(s / 2) - 2, 0, 4, s);
  groove(0, 0, 5, s);
  groove(s - 5, 0, 5, s);
  const img = c.createImageData(s, s);
  const strength = 4.5;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const xm = (x - 1 + s) % s;
      const xp = (x + 1) % s;
      const ym = (y - 1 + s) % s;
      const yp = (y + 1) % s;
      const dx = (height[y * s + xp]! - height[y * s + xm]!) * strength;
      const dy = (height[yp * s + x]! - height[ym * s + x]!) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * s + x) * 4;
      img.data[i] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      img.data[i + 1] = Math.round(((dy / len) * 0.5 + 0.5) * 255);
      img.data[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      img.data[i + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  return finish(t);
}

function makeCeilingTile(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 512;
  const t = tex("tex.ceilingTile", s, s, scene);
  const c = ctx(t);
  c.fillStyle = "#e0ddd4";
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 1600; i++) {
    const g = 200 + rng.int(0, 40);
    c.fillStyle = `rgba(${g},${g},${g - 6},0.35)`;
    c.fillRect(rng.draw() * s, rng.draw() * s, 1.5, 1.5);
  }
  c.strokeStyle = "rgba(100,98,92,0.7)";
  c.lineWidth = 6;
  c.strokeRect(0, 0, s, s);
  return finish(t);
}

function makeSteel(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 512;
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
    c.fillRect(rng.draw() * s, rng.draw() * s, rng.draw() * 60, 2);
  }
  return finish(t);
}

/** Security shutter: horizontal slats. */
function makeShutter(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 512;
  const t = tex("tex.shutter", s, s, scene);
  const c = ctx(t);
  c.fillStyle = "#8e9296";
  c.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 32) {
    c.fillStyle = "rgba(40,42,46,0.85)";
    c.fillRect(0, y, s, 6);
    const g = 150 + rng.int(0, 24);
    c.fillStyle = `rgb(${g},${g + 3},${g + 6})`;
    c.fillRect(0, y + 6, s, 26);
    c.fillStyle = "rgba(255,255,255,0.12)";
    c.fillRect(0, y + 6, s, 4);
  }
  return finish(t);
}

function makeConcrete(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 512;
  const t = tex("tex.concrete", s, s, scene);
  const c = ctx(t);
  c.fillStyle = "#7c7870";
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 2400; i++) {
    const g = 105 + rng.int(0, 45);
    c.fillStyle = `rgba(${g},${g - 2},${g - 6},0.4)`;
    c.fillRect(rng.draw() * s, rng.draw() * s, 2 + rng.draw() * 4, 2 + rng.draw() * 4);
  }
  return finish(t);
}

function makeSmudge(scene: Scene, rng: RngStream): DynamicTexture {
  const s = 512;
  const t = tex("tex.smudge", s, s, scene);
  const c = ctx(t);
  c.fillStyle = "#808080";
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 140; i++) {
    const x = rng.draw() * s;
    const y = rng.draw() * s;
    const r = 16 + rng.draw() * 80;
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
  /** draws an engraved staff portrait instead of a text block */
  portrait?: boolean;
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
    title: "FACE OF THE ROUTE",
    sub: ["INSPECTOR R. VANCE", "27 YEARS ON LOOP 7"],
    bg: "#232120",
    fg: "#d8d5cd",
    portrait: true,
  },
  {
    title: "REPORT DRIFT",
    sub: ["UNLOGGED CHANGES ARE", "A ROUTE SAFETY ISSUE", "DIAL 7-700 INTERNAL"],
    bg: "#2a2024",
    fg: "#d8d5cd",
  },
  {
    title: "KEEP LEFT",
    sub: ["LOOP 7 TRAVELS NORTH", "SOUTH PASSAGE IS", "INSPECTION ONLY"],
    bg: "#252322",
    fg: "#e8a33d",
  },
  {
    title: "SHIFT CHANGES",
    sub: ["OVERTIME IS APPROVED", "BY YOUR LAST SHIFT'S", "FILING. SIGN FIRST."],
    bg: "#22262c",
    fg: "#9fb8c8",
  },
];

/** Redraw a poster texture in place — used at build and by poster anomalies. */
export function drawPoster(
  t: DynamicTexture,
  d: PosterDef,
  mirror = false,
  hollow = false,
  grin = false,
  gaze = 0,
): void {
  const w = 256;
  const h = 384;
  const c = ctx(t);
  const sz = t.getSize();
  c.scale(sz.width / w, sz.height / h);
  c.fillStyle = d.bg;
  c.fillRect(0, 0, w, h);
  if (mirror) {
    c.save();
    c.translate(w, 0);
    c.scale(-1, 1);
  }
  c.strokeStyle = d.fg;
  c.lineWidth = 6;
  c.strokeRect(10, 10, w - 20, h - 20);
  c.fillStyle = d.fg;
  c.font = "bold 24px Arial, sans-serif";
  c.textAlign = "center";
  c.fillText(d.title, w / 2, 76);
  if (d.portrait) {
    // engraved staff portrait — dark shoulder block, pale face oval,
    // crude woodcut features; hollow swaps the eyes for void sockets
    c.fillStyle = "#17191d";
    c.beginPath();
    c.ellipse(w / 2, 215, 50, 60, 0, 0, Math.PI * 2);
    c.fill();
    c.fillRect(w / 2 - 70, 262, 140, 64);
    c.fillStyle = hollow ? "#4a443e" : "#c9c2b4";
    c.beginPath();
    c.ellipse(w / 2, 208, 37, 47, 0, 0, Math.PI * 2);
    c.fill();
    const eyeY = grin ? 3.4 : 5;
    if (gaze !== 0 && !hollow) {
      // readable eyes with a pupil that slides to track the viewer —
      // whites bright enough to lift off the pale face oval
      c.fillStyle = "#efe9d8";
      c.strokeStyle = "#3a352c";
      c.lineWidth = 1.4;
      for (const sx of [-13, 13]) {
        c.beginPath();
        c.ellipse(w / 2 + sx, 199, 9, 6, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      c.fillStyle = "#100e0a";
      for (const sx of [-13, 13]) {
        c.beginPath();
        c.ellipse(w / 2 + sx + gaze * 4, 199.5, 3.8, 5, 0, 0, Math.PI * 2);
        c.fill();
      }
      // pinprick catchlights so the pupils read as wet eyes up close
      c.fillStyle = "#efe9d8";
      for (const sx of [-13, 13]) {
        c.beginPath();
        c.arc(w / 2 + sx + gaze * 4 - 1, 197.5, 0.8, 0, Math.PI * 2);
        c.fill();
      }
    } else {
      c.fillStyle = hollow ? "#08080a" : "#2a2622";
      c.beginPath();
      c.ellipse(w / 2 - 13, 199, hollow ? 8 : 5, hollow ? 11 : eyeY, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(w / 2 + 13, 199, hollow ? 8 : 5, hollow ? 11 : eyeY, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = hollow ? "#1c1a18" : "#4a443c";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(w / 2, 206);
    c.lineTo(w / 2 - 3, 224);
    c.stroke();
    if (grin) {
      // the smile is drawn too wide — an open dark crescent under the
      // cheekbones, corners pulled past where a mouth should reach
      c.fillStyle = "#141210";
      c.beginPath();
      c.ellipse(w / 2, 232, 19, 13, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#c9c2b4";
      c.fillRect(w / 2 - 16, 224, 32, 7); // teeth strip catching the light
      c.strokeStyle = "#4a443c";
      c.lineWidth = 2.5;
      c.beginPath();
      c.ellipse(w / 2, 232, 19, 13, 0, 0, Math.PI * 2);
      c.stroke();
    } else {
      c.beginPath();
      c.moveTo(w / 2 - 11, 238);
      c.lineTo(w / 2 + 11, 238);
      c.stroke();
    }
    c.font = "15px Arial, sans-serif";
    c.fillStyle = d.fg;
    d.sub.forEach((line, j) => c.fillText(line, w / 2, 300 + j * 24));
  } else {
    c.font = "16px Arial, sans-serif";
    d.sub.forEach((line, j) => c.fillText(line, w / 2, 150 + j * 44));
  }
  c.font = "15px Arial, sans-serif";
  c.fillText("— 7 —", w / 2, h - 40);
  if (mirror) c.restore();
  t.update();
}

function makePosters(scene: Scene): DynamicTexture[] {
  return POSTER_DEFS.map((d, i) => {
    const t = tex(`tex.poster.${i}`, 512, 768, scene);
    drawPoster(t, d);
    return finish(t);
  });
}

/** Field-note paper — cream memo stock, typed header, small body lines. */
export function drawNote(t: DynamicTexture, d: { title: string; lines: string[] }): void {
  const w = 256;
  const h = 352;
  const c = ctx(t);
  const sz = t.getSize();
  c.scale(sz.width / w, sz.height / h);
  c.fillStyle = "#d9d3c2";
  c.fillRect(0, 0, w, h);
  // typed-paper grain: a few faint horizontal rules
  c.strokeStyle = "rgba(70,60,50,0.18)";
  c.lineWidth = 1;
  for (let y = 64; y < h - 40; y += 22) {
    c.beginPath();
    c.moveTo(18, y);
    c.lineTo(w - 18, y);
    c.stroke();
  }
  c.fillStyle = "#262019";
  c.textAlign = "left";
  c.font = "bold 15px 'Courier New', monospace";
  c.fillText(d.title, 18, 40);
  c.strokeStyle = "#262019";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(18, 50);
  c.lineTo(w - 18, 50);
  c.stroke();
  c.font = "14px 'Courier New', monospace";
  d.lines.forEach((line, j) => c.fillText(line, 18, 84 + j * 22));
  c.textAlign = "right";
  c.fillStyle = "rgba(90,70,50,0.7)";
  c.font = "11px 'Courier New', monospace";
  c.fillText("CWA/OPS", w - 14, h - 14);
  t.update();
}

/**
 * Draw a clock face in place — used at build and by clock anomalies.
 * `numerals[i]` is the numeral drawn at clock position i+1; omit for 1–12.
 */
export function drawClockFace(t: DynamicTexture, numerals?: number[]): void {
  const s = 256;
  const c = ctx(t);
  const ts = t.getSize().width;
  c.scale(ts / s, ts / s);
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
  const t = tex("tex.clockFace", 384, 384, scene);
  t.hasAlpha = true;
  drawClockFace(t);
  return finish(t);
}

/** Original walking-person glyph — head disc, torso stroke, splayed
 * stride legs, one arm stroke. `dir` ±1 mirrors it. ~52 px tall. */
export function drawFigure(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  dir: number,
  color: string,
): void {
  c.save();
  c.translate(cx, cy);
  c.scale(dir, 1);
  c.fillStyle = color;
  c.strokeStyle = color;
  c.lineCap = "round";
  // head
  c.beginPath();
  c.arc(4, -24, 7, 0, Math.PI * 2);
  c.fill();
  // torso + arm (one continuous stroke leaning into the walk)
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(0, -14);
  c.lineTo(-2, 6);
  c.lineTo(10, 16);
  c.stroke();
  // stride legs — lead leg forward, trail leg back
  c.beginPath();
  c.moveTo(-2, 6);
  c.lineTo(12, 26);
  c.lineTo(16, 30);
  c.moveTo(-2, 6);
  c.lineTo(-12, 24);
  c.lineTo(-8, 30);
  c.stroke();
  c.restore();
}

export function drawSign(t: DynamicTexture, spec: SignSpec, mirror = false): void {
  const w = 512;
  const h = 160;
  const c = ctx(t);
  const sz = t.getSize();
  c.scale(sz.width / w, sz.height / h);
  const tones = {
    amber: { bg: "#23262c", fg: "#e8a33d", edge: "#e8a33d" },
    cyan: { bg: "#1e2a2c", fg: "#7fd4e0", edge: "#4fa8b8" },
    dark: { bg: "#17191d", fg: "#c9c6bc", edge: "#4a4d52" },
    green: { bg: "#0d2416", fg: "#5fe08a", edge: "#3da867" },
  }[spec.tone];
  if (mirror) {
    c.save();
    c.translate(w, 0);
    c.scale(-1, 1);
  }
  c.fillStyle = tones.bg;
  c.fillRect(0, 0, w, h);
  c.strokeStyle = tones.edge;
  c.lineWidth = 4;
  c.strokeRect(8, 8, w - 16, h - 16);
  c.fillStyle = tones.fg;
  c.textAlign = "center";
  c.font = "bold 44px Arial, sans-serif";
  const arrow = spec.arrow === "right" ? "  →" : spec.arrow === "left" ? "←  " : "";
  // fit-to-width: long titles shrink before they can reach the pictogram
  const title = spec.title + arrow;
  const maxW = spec.figure ? w - 150 : w - 70;
  const tw = c.measureText(title).width;
  if (tw > maxW) c.font = `bold ${Math.floor((44 * maxW) / tw)}px Arial, sans-serif`;
  c.fillText(title, spec.figure ? w / 2 + 26 : w / 2, spec.sub ? 78 : 92);
  if (spec.figure) drawFigure(c, 32, 74, spec.figure === "right" ? 1 : -1, tones.fg);
  if (spec.sub) {
    c.font = "24px Arial, sans-serif";
    c.fillStyle = spec.tone === "dark" ? tones.fg : "#c9c6bc";
    c.fillText(spec.sub, w / 2, 122);
  }
  if (mirror) c.restore();
  t.update();
}

function makeSignTexture(spec: SignSpec, scene: Scene): DynamicTexture {
  const t = tex(`tex.${spec.id}`, 768, 240, scene);
  drawSign(t, spec);
  return finish(t);
}

/** Live airlock terminal — rewritten per loop transition. */
function makeTerminal(scene: Scene): DynamicTexture {
  const t = tex("tex.terminal", 768, 384, scene);
  const c = ctx(t);
  c.fillStyle = "#10141a";
  c.fillRect(0, 0, 768, 384);
  return finish(t);
}

export function buildTextureSet(scene: Scene, rng: RngStream, signs: SignSpec[]): TextureSet {
  const signMap = new Map<string, DynamicTexture>();
  for (const s of signs) signMap.set(s.id, makeSignTexture(s, scene));
  return {
    terrazzo: makeTerrazzo(scene, rng),
    wallPanel: makeWallPanel(scene, rng),
    wallPanelBump: makeWallPanelBump(scene),
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
    fadeStrip: drawFadeStrip(tex("tex.fadeStrip", 256, 64, scene), "up"),
    guideStrip: makeGuideStrip(scene),
    lightShaft: makeLightShaft(scene),
    domePad: makeDomePad(scene),
    blinds: makeBlinds(scene),
    puddle: makePuddle(scene),
  };
}

/** Tactile guide strip tile: dim amber channel with three raised bars
 * running along the walk direction. Tiles seamlessly in v. */
function makeGuideStrip(scene: Scene): DynamicTexture {
  const t = tex("tex.guideStrip", 256, 256, scene);
  const c = ctx(t);
  c.scale(2, 2);
  c.fillStyle = "#6b5d33";
  c.fillRect(0, 0, 128, 128);
  for (const u of [0.2, 0.5, 0.8]) {
    const x = Math.round(u * 128);
    c.fillStyle = "#9a8548";
    c.fillRect(x - 5, 6, 10, 116);
    c.fillStyle = "#4a4024";
    c.fillRect(x + 5, 6, 2, 116); // righthand shadow edge
  }
  t.update();
  return finish(t);
}

/** Tactile warning pad: the truncated-dome field laid before each
 * airlock door line — amber mat with a raised dot grid, lit edge. */
function makeDomePad(scene: Scene): DynamicTexture {
  const t = tex("tex.domePad", 256, 64, scene);
  const c = ctx(t);
  c.scale(2, 2);
  c.fillStyle = "#5d5130";
  c.fillRect(0, 0, 128, 32);
  for (let ry = 0; ry < 3; ry++) {
    for (let rx = 0; rx < 12; rx++) {
      const x = 8 + rx * 10 + (ry % 2) * 5;
      const y = 8 + ry * 9;
      // dot = pale crown + dark under-edge
      c.fillStyle = "#4a4024";
      c.beginPath();
      c.arc(x, y + 0.8, 3, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#a8934f";
      c.beginPath();
      c.arc(x, y, 3, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#c2ad67";
      c.beginPath();
      c.arc(x - 0.7, y - 0.8, 1.1, 0, Math.PI * 2);
      c.fill();
    }
  }
  t.update();
  return finish(t);
}

/** Venetian blinds drawn behind one gallery bay: thin horizontal slats
 * with gaps that let the room's cove line bleed through. */
function makeBlinds(scene: Scene): DynamicTexture {
  const t = tex("tex.blinds", 64, 128, scene);
  const c = ctx(t);
  c.clearRect(0, 0, 64, 128);
  for (let y = 2; y < 126; y += 11) {
    // slat: pale body + brighter top edge (lit by the cove)
    c.fillStyle = "rgba(200, 196, 180, 0.95)";
    c.fillRect(0, y, 64, 8);
    c.fillStyle = "rgba(240, 236, 216, 1)";
    c.fillRect(0, y, 64, 2.2);
    c.fillStyle = "rgba(60, 58, 52, 0.9)";
    c.fillRect(0, y + 8, 64, 1.2);
  }
  t.update();
  return finish(t);
}

/** Damp patch that spreads around a floor drain: radial dark wash with
 * a faintly raised rim, alpha-fading to nothing at the edge. */
function makePuddle(scene: Scene): DynamicTexture {
  const t = tex("tex.puddle", 128, 128, scene);
  const c = ctx(t);
  const g = c.createRadialGradient(64, 64, 8, 64, 64, 62);
  g.addColorStop(0, "rgba(8, 10, 12, 0.72)");
  g.addColorStop(0.55, "rgba(8, 10, 12, 0.4)");
  g.addColorStop(1, "rgba(10, 12, 14, 0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
  t.update();
  return finish(t);
}

/** Volumetric light shaft under a troffer: a pale trapezoid, brightest
 * at the fixture and fading out before the floor. Additive-blended. */
function makeLightShaft(scene: Scene): DynamicTexture {
  const w = 64;
  const h = 256;
  const t = tex("tex.lightShaft", w, h, scene);
  const c = ctx(t);
  c.clearRect(0, 0, w, h);
  const grad = c.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(255,242,214,0.55)");
  grad.addColorStop(0.4, "rgba(255,240,208,0.28)");
  grad.addColorStop(1, "rgba(255,238,200,0)");
  c.fillStyle = grad;
  c.beginPath();
  c.moveTo(w * 0.32, 0);
  c.lineTo(w * 0.68, 0);
  c.lineTo(w * 0.95, h);
  c.lineTo(w * 0.05, h);
  c.closePath();
  c.fill();
  // soften the side edges so the cone reads gaseous, not sheet-like
  const edge = c.createLinearGradient(0, 0, w, 0);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(0.5, "rgba(0,0,0,1)");
  edge.addColorStop(1, "rgba(0,0,0,0)");
  c.globalCompositeOperation = "destination-in";
  c.fillStyle = edge;
  c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = "source-over";
  t.update();
  t.hasAlpha = true;
  return finish(t);
}

/** Rewrite the airlock terminal contents (called per loop transition). */
export function drawTerminal(
  t: DynamicTexture,
  lines: { header: string; rows: { label: string; value: string; tone?: "ok" | "warn" | "bad" }[] },
): void {
  const c = ctx(t);
  const sz = t.getSize();
  c.scale(sz.width / 512, sz.height / 256);
  c.fillStyle = "#151b22";
  c.fillRect(0, 0, 512, 256);
  c.strokeStyle = "#3a3d40";
  c.lineWidth = 3;
  c.strokeRect(6, 6, 500, 244);
  // lit header band — reads as a powered screen at corridor distance
  c.fillStyle = "#3d2c12";
  c.fillRect(10, 10, 492, 50);
  c.fillStyle = "#e8a33d";
  c.font = "bold 26px ui-monospace, Menlo, monospace";
  c.textAlign = "left";
  c.fillText(lines.header, 26, 48);
  c.fillStyle = "#4a4d52";
  c.fillRect(26, 62, 460, 2);
  lines.rows.forEach((row, i) => {
    const y = 104 + i * 34;
    // long prompt labels get a smaller font so they never clip the bezel
    c.font =
      row.label.length > 24 ? "16px ui-monospace, Menlo, monospace" : "20px ui-monospace, Menlo, monospace";
    c.fillStyle = "#8f8a80";
    c.fillText(row.label, 26, y);
    c.font = "20px ui-monospace, Menlo, monospace";
    const tone =
      row.tone === "ok"
        ? "#7fd4a0"
        : row.tone === "warn"
          ? "#e8a33d"
          : row.tone === "bad"
            ? "#d86a5a"
            : "#c9c6bc";
    // status pill behind the value so the state color reads at distance
    const vw = c.measureText(row.value).width;
    if (row.value) {
      c.fillStyle = "#232a32";
      c.fillRect(480 - vw - 10, y - 18, vw + 16, 26);
      c.fillStyle = tone;
      c.fillRect(480 - vw - 10, y - 18, 3, 26);
    }
    c.fillStyle = tone;
    c.textAlign = "right";
    c.fillText(row.value, 486, y);
    c.textAlign = "left";
  });
  // scanlines — the CRT texture cue
  c.fillStyle = "rgba(0,0,0,0.12)";
  for (let y = 0; y < 256; y += 4) c.fillRect(0, y, 512, 1);
  t.update();
}

/** Vending machine face: backlit brand band over a dark glass column of
 *  product silhouettes. All signage copy stays inside CWA fiction. */
export function makeVendingFace(scene: Scene): DynamicTexture {
  const t = tex("tex.vendingFace", 256, 512, scene);
  drawVendingFace(t);
  return finish(t);
}

/** Repaint the vending face — `empty` leaves the shelves bare with a
 *  printed OUT OF STOCK strip where the brand band's pride used to be. */
export function drawVendingFace(t: DynamicTexture, empty = false, brand = "CWA CANTEEN SERVICES"): void {
  const c = ctx(t);
  c.scale(2, 2); // drawn against a 128×256 reference frame
  // dark glass field
  const glass = c.createLinearGradient(0, 0, 128, 0);
  glass.addColorStop(0, "#0d1114");
  glass.addColorStop(0.5, "#131a1f");
  glass.addColorStop(1, "#0b0e11");
  c.fillStyle = glass;
  c.fillRect(0, 0, 128, 256);
  // brand band — lit header, institutional cyan
  c.fillStyle = "#12333a";
  c.fillRect(0, 0, 128, 30);
  c.fillStyle = "#7fc4cf";
  c.font = "bold 11px Arial, sans-serif";
  c.textAlign = "center";
  c.fillText("COLD DISPENSE", 64, 13);
  c.font = "8px Arial, sans-serif";
  c.fillStyle = "#4d7d86";
  c.fillText(brand, 64, 24);
  // product columns: 4 cols × 4 rows of dim bottles/cartons behind glass
  const rng = (i: number) => Math.abs(Math.sin(i * 91.345)) % 1;
  const tones = ["#28465a", "#4a3a28", "#3d4a2d", "#4a2d33", "#2d3d4a"];
  for (let r = 0; r < 4; r++) {
    const y = 44 + r * 38;
    // shelf line
    c.fillStyle = "rgba(180,200,205,0.25)";
    c.fillRect(8, y + 26, 112, 2);
    if (empty) {
      // bare shelf — dusty underside line + a lone stock tag
      c.fillStyle = "rgba(120,130,135,0.12)";
      c.fillRect(10, y + 6, 108, 20);
      c.fillStyle = "rgba(190,190,170,0.5)";
      c.fillRect(14, y + 12, 18, 8);
      continue;
    }
    for (let col = 0; col < 4; col++) {
      const x = 12 + col * 27;
      const h = 18 + Math.floor(rng(r * 7 + col) * 8);
      c.fillStyle = tones[(r + col) % tones.length] ?? "#28465a";
      c.fillRect(x, y + 26 - h, 16, h);
      c.fillStyle = "rgba(220,235,240,0.5)";
      c.fillRect(x + 2, y + 28 - h, 3, 3); // glint
      c.fillStyle = "rgba(0,0,0,0.35)";
      c.fillRect(x, y + 20, 16, 4); // label shadow
    }
  }
  if (empty) {
    c.fillStyle = "rgba(150,60,50,0.85)";
    c.font = "bold 9px Arial, sans-serif";
    c.fillText("OUT OF STOCK — CWA", 64, 208);
  }
  // glass sheen — diagonal highlight
  const sheen = c.createLinearGradient(0, 0, 128, 256);
  sheen.addColorStop(0.35, "rgba(255,255,255,0)");
  sheen.addColorStop(0.5, "rgba(200,225,235,0.10)");
  sheen.addColorStop(0.65, "rgba(255,255,255,0)");
  c.fillStyle = sheen;
  c.fillRect(0, 0, 128, 256);
  // dispense flap at the base
  c.fillStyle = "#07090b";
  c.fillRect(24, 216, 80, 30);
  c.strokeStyle = "#2b3438";
  c.lineWidth = 2;
  c.strokeRect(26, 218, 76, 26);
  t.update();
}

/** Linear fade strip for fake-AO — opaque at `head`, transparent at the
 *  tail. Direction "up" puts the solid edge at v=0 (bottom of a wall). */
export function drawFadeStrip(t: DynamicTexture, dir: "up" | "down"): DynamicTexture {
  const c = ctx(t);
  c.clearRect(0, 0, 256, 64);
  const g = c.createLinearGradient(0, dir === "up" ? 64 : 0, 0, dir === "up" ? 0 : 64);
  g.addColorStop(0, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 64);
  return finish(t);
}

/** ARCHIVES fascia — dark institutional band with the word repeated per
 *  bay. Painted onto a 17.6 m strip on the records bank face. */
export function makeFasciaBand(scene: Scene): DynamicTexture {
  const t = tex("tex.fascia", 2048, 96, scene);
  const c = ctx(t);
  c.scale(2, 2); // logical 1024x48
  c.fillStyle = "#26282b";
  c.fillRect(0, 0, 1024, 48);
  // top + bottom rules
  c.fillStyle = "#3a3d42";
  c.fillRect(0, 0, 1024, 2);
  c.fillRect(0, 46, 1024, 2);
  // one "ARCHIVES" per ~3 m bay: 6 labels across the strip
  c.fillStyle = "#d8a045";
  c.font = "bold 20px Arial, sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  for (let i = 0; i < 6; i++) {
    const cx = (i + 0.5) * (1024 / 6);
    c.fillText("A R C H I V E S", cx, 24);
    // bay separator tick
    if (i > 0) {
      c.fillStyle = "#3a3d42";
      c.fillRect(i * (1024 / 6) - 1, 8, 2, 32);
      c.fillStyle = "#d8a045";
    }
  }
  t.update();
  return finish(t);
}

/** LOOP 7 route diagram — the framed schematic panel: a single amber
 *  route line with stops, north up, and a YOU ARE HERE marker near the
 *  intake end. The corridor's memorization anchor. */
export function makeRouteMap(scene: Scene): DynamicTexture {
  const t = tex("tex.routemap", 512, 384, scene);
  drawRouteMap(t);
  return finish(t);
}

/** Paint the LOOP 7 schematic onto an existing DynamicTexture.
 *  `hereStop` is which stop the YOU ARE HERE marker points at — 0 is
 *  baseline (NORTH INTAKE, the loop's start); map.wrong repaints with
 *  a different index so the map claims you are somewhere else. */
export function drawRouteMap(t: DynamicTexture, hereStop = 0): void {
  const c = ctx(t);
  // board
  c.fillStyle = "#1e2124";
  c.fillRect(0, 0, 512, 384);
  c.strokeStyle = "#3a3d42";
  c.lineWidth = 4;
  c.strokeRect(8, 8, 496, 368);
  c.fillStyle = "#c8cdd4";
  c.font = "bold 24px Arial, sans-serif";
  c.textAlign = "center";
  c.fillText("INSPECTION LOOP 7", 256, 46);
  c.fillStyle = "#8a9099";
  c.font = "15px Arial, sans-serif";
  c.fillText("MUNICIPAL SERVICES CONCOURSE · LEVEL −2", 256, 72);
  // the route line
  c.strokeStyle = "#d8a045";
  c.lineWidth = 7;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(256, 110);
  c.lineTo(256, 320);
  c.stroke();
  // stops
  const stops: [number, string, boolean][] = [
    [110, "NORTH INTAKE", true],
    [168, "RECORDS WALL", false],
    [232, "JUNCTION S-2", false],
    [320, "INSPECTION POINT", false],
  ];
  c.fillStyle = "#d8a045";
  for (const [y, label] of stops) {
    c.beginPath();
    c.arc(256, y, 8, 0, Math.PI * 2);
    c.fill();
    c.textAlign = "left";
    c.font = "bold 16px Arial, sans-serif";
    c.fillText(label, 286, y + 5);
  }
  // heading marker at the south end
  c.beginPath();
  c.moveTo(244, 336);
  c.lineTo(268, 336);
  c.lineTo(256, 354);
  c.closePath();
  c.fill();
  // YOU ARE HERE just below the claimed stop — baseline points at the
  // intake (stop 0, y 110 → marker row at 132)
  const hereY = stops[hereStop]![0] + 22;
  c.fillStyle = "#c8cdd4";
  c.textAlign = "right";
  c.font = "bold 14px Arial, sans-serif";
  c.fillText("YOU ARE HERE", 236, hereY);
  c.strokeStyle = "#c8cdd4";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(238, hereY - 4);
  c.lineTo(250, hereY - 10);
  c.stroke();
  // filing footnote
  c.fillStyle = "#8a9099";
  c.textAlign = "center";
  c.font = "13px Arial, sans-serif";
  c.fillText("FILE ALL DIVERGENCES AT THE INSPECTION POINT", 256, 372);
  t.update();
}

/** Night staffing rota — the framed duty board near the intake: a typed
 *  table of inspector codes, shift times and clearance marks. */
export function makeRotaBoard(scene: Scene): DynamicTexture {
  const t = tex("tex.rota", 512, 384, scene);
  drawRotaBoard(t);
  return finish(t);
}

/** Paint the duty board. `stamped` adds a big red UNDER REVIEW mark
 *  across the table — rota.stamped's rewrite of a settled document. */
export function drawRotaBoard(t: DynamicTexture, stamped = false): void {
  const c = ctx(t);
  c.fillStyle = "#232629";
  c.fillRect(0, 0, 512, 384);
  c.strokeStyle = "#3d4045";
  c.lineWidth = 4;
  c.strokeRect(6, 6, 500, 372);
  c.fillStyle = "#d8a045";
  c.font = "bold 20px Arial, sans-serif";
  c.textAlign = "center";
  c.fillText("ROUTE STAFFING — NIGHT", 256, 36);
  c.fillStyle = "#8a9099";
  c.font = "12px Arial, sans-serif";
  c.fillText("INSPECTION LOOP 7 · ROUTE INTEGRITY DIVISION", 256, 56);
  // table header
  const cols = ["INSPECTOR", "SHIFT", "ROUTE", "CLEARANCE"];
  const xs = [80, 200, 310, 420];
  c.textAlign = "left";
  c.font = "bold 13px Arial, sans-serif";
  c.fillStyle = "#a8adb5";
  cols.forEach((col, i) => c.fillText(col, (xs[i] ?? 0) - 30, 82));
  c.strokeStyle = "#3d4045";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(24, 92);
  c.lineTo(488, 92);
  c.stroke();
  // rows
  const rows: readonly (readonly [string, string, string, string])[] = [
    ["N-104", "22–06", "RESERVE", "FILED"],
    ["N-117", "00–08", "LOOP 7", "ACTIVE"],
    ["N-122", "22–06", "LOOP 9", "FILED"],
    ["N-131", "00–08", "SURFACE", "FILED"],
    ["N-140", "22–06", "LOOP 7", "RELIEF"],
    ["N-147", "00–08", "RESERVE", "STANDBY"],
    ["N-153", "22–06", "LOOP 4", "FILED"],
  ];
  c.font = "13px 'Courier New', monospace";
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const y = 112 + r * 30;
    const active = row[3] === "ACTIVE";
    c.fillStyle = active ? "#e8c078" : "#7d838c";
    row.forEach((v, i) => c.fillText(v, (xs[i] ?? 0) - 30, y));
    c.strokeStyle = "#2e3134";
    c.beginPath();
    c.moveTo(24, y + 8);
    c.lineTo(488, y + 8);
    c.stroke();
  }
  // footnote stamp
  c.save();
  c.translate(430, 330);
  c.rotate(-0.18);
  c.strokeStyle = "rgba(216,160,69,0.75)";
  c.lineWidth = 2;
  c.strokeRect(-58, -16, 116, 30);
  c.fillStyle = "rgba(216,160,69,0.75)";
  c.font = "bold 12px Arial, sans-serif";
  c.textAlign = "center";
  c.fillText("AUDITED", 0, 4);
  c.restore();
  if (stamped) {
    // the big red review mark, stamped across the middle of the table
    c.save();
    c.translate(256, 196);
    c.rotate(-0.11);
    c.strokeStyle = "rgba(190,62,48,0.85)";
    c.lineWidth = 5;
    c.strokeRect(-172, -34, 344, 66);
    c.fillStyle = "rgba(190,62,48,0.85)";
    c.font = "bold 44px Arial, sans-serif";
    c.textAlign = "center";
    c.fillText("UNDER REVIEW", 0, 15);
    c.restore();
  }
  t.update();
}

/** Corridor service phone face — dark plate, keypad grid, dial card. */
export function makePhoneFace(scene: Scene): DynamicTexture {
  const t = tex("tex.phoneFace", 256, 384, scene);
  const c = ctx(t);
  c.fillStyle = "#151719";
  c.fillRect(0, 0, 256, 384);
  // bevel edge
  c.strokeStyle = "#3d4045";
  c.lineWidth = 4;
  c.strokeRect(4, 4, 248, 376);
  // handset cradle shadow strip left
  c.fillStyle = "#0c0d0f";
  c.fillRect(16, 20, 52, 344);
  c.strokeStyle = "#2c2f33";
  c.lineWidth = 2;
  c.strokeRect(16, 20, 52, 344);
  // label strip
  c.fillStyle = "#1d3a40";
  c.fillRect(84, 20, 156, 30);
  c.fillStyle = "#7fc4cf";
  c.font = "bold 13px Arial, sans-serif";
  c.textAlign = "center";
  c.fillText("INTERNAL", 162, 40);
  // dial card
  c.fillStyle = "#c9c4b2";
  c.fillRect(104, 66, 116, 46);
  c.strokeStyle = "#6a6558";
  c.strokeRect(104, 66, 116, 46);
  c.fillStyle = "#3a3d42";
  c.font = "bold 15px 'Courier New', monospace";
  c.fillText("DIAL 7-700", 162, 88);
  c.font = "9px Arial, sans-serif";
  c.fillText("MAINTENANCE", 162, 104);
  // keypad 3x4
  for (let r = 0; r < 4; r++) {
    for (let col = 0; col < 3; col++) {
      const bx = 104 + col * 42;
      const by = 134 + r * 44;
      c.fillStyle = "#23262a";
      c.fillRect(bx, by, 34, 34);
      c.strokeStyle = "#3d4045";
      c.strokeRect(bx, by, 34, 34);
      c.fillStyle = "#8a9099";
      c.font = "bold 12px Arial, sans-serif";
      const n = r * 3 + col + 1;
      c.fillText(n === 10 ? "*" : n === 11 ? "0" : n === 12 ? "#" : String(n), bx + 17, by + 22);
    }
  }
  // status LED bottom right
  c.fillStyle = "#5a7d62";
  c.fillRect(206, 330, 14, 14);
  c.fillStyle = "#7d838c";
  c.font = "9px Arial, sans-serif";
  c.fillText("LINE", 213, 358);
  t.update();
  return finish(t);
}
