/**
 * window.__nightaudit — deterministic debug/e2e surface.
 * Exposed in every build (harmless in prod; powers the dev overlay + tests).
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Tools } from "@babylonjs/core/Misc/tools";
import "@babylonjs/core/Misc/screenshotTools";
import type { App } from "../app/app";

export interface DebugHandle {
  seed: string;
  engine(): string;
  state(): string;
  loop(): number;
  anomaly(): string | null;
  stability(): number;
  pos(): { x: number; y: number; z: number };
  /** patrolling inspector's z — probe choreography hooks */
  walkerZ(): number;
  /** commuter presence tag for probes */
  commuterMode(): string;
  /** current walk-speed multiplier (pace.dissolves diagnostics) */
  speedScale(): number;
  teleport(x: number, y: number, z: number, yaw?: number): void;
  forceAnomaly(id: string | null): void;
  setStability(v: number): void;
  /** look direction */
  look(yaw: number, pitch?: number): void;
  /** current view angles */
  view(): { yaw: number; pitch: number };
  /** synth keydown for e2e movement without pointer lock */
  key(code: string, down: boolean): void;
  fps(): number;
  draws(): number;
  tris(): number;
  screenshot(width?: number, height?: number): Promise<string>;
  registry(): string[];
  /** transform + visibility of any scene mesh by name (registry or not) */
  meshInfo(name: string): {
    pos: [number, number, number];
    rot: [number, number, number];
    visible: boolean;
    enabled: boolean;
  } | null;
  /** material slot info for a named mesh — audit helper */
  matInfo(name: string): {
    mat: string;
    emissiveTex: string | null;
    emissiveR: number | null;
  } | null;
  ready: boolean;
}

export function installDebugHandle(app: App): void {
  const refs = () => app.__refs;
  const h: DebugHandle = {
    seed: "",
    ready: true,
    engine: () => refs().rendererKind,
    state: () => app.state,
    loop: () => refs().loop.state.loopIndex,
    anomaly: () => refs().loop.currentAnomaly,
    stability: () => refs().loop.stability.current,
    pos: () => {
      const p = refs().player.position;
      return { x: p.x, y: p.y, z: p.z };
    },
    walkerZ: () => refs().world.ambientWalker.root.position.z,
    commuterMode: () => (refs().world.commuter.isPresent() ? "present" : "absent"),
    speedScale: () => refs().player.speedScale,
    teleport: (x, y, z, yaw) => {
      refs().player.teleport(new Vector3(x, y, z), yaw ?? 0);
    },
    forceAnomaly: (id) => refs().loop.forceAnomaly(id),
    setStability: (v) => refs().loop.stability.set(v),
    look: (yaw, pitch) => {
      // controller owns pitch/yaw state — writing camera.rotation.x alone is
      // stomped by the next sim update
      refs().player.setView(yaw, pitch);
    },
    view: () => ({
      yaw: refs().player.camera.rotation.y,
      pitch: refs().player.camera.rotation.x,
    }),
    key: (code, down) => {
      const ev = new KeyboardEvent(down ? "keydown" : "keyup", { code, bubbles: true });
      window.dispatchEvent(ev);
    },
    fps: () => refs().engine.getFps(),
    draws: () =>
      (refs().scene.getEngine() as unknown as { _drawCalls?: { current: number } })._drawCalls?.current ?? 0,
    tris: () => refs().scene.getActiveIndices() / 3,
    screenshot: async (width = 960, height = 600) => {
      return Tools.CreateScreenshotAsync(refs().engine, refs().player.camera, {
        width,
        height,
        precision: 1,
      }) as Promise<string>;
    },
    registry: () => refs().world.registry.names(),
    meshInfo: (name) => {
      const m = refs().scene.getMeshByName(name);
      if (!m) return null;
      const p = m.getAbsolutePosition();
      const r = m.rotation;
      return {
        pos: [p.x, p.y, p.z],
        rot: [r.x, r.y, r.z],
        visible: m.isVisible,
        enabled: m.isEnabled(),
      };
    },
    matInfo: (name) => {
      const m = refs().scene.getMeshByName(name);
      const mat = m?.material;
      if (!mat) return null;
      const std = mat as { emissiveTexture?: { name?: string }; emissiveColor?: { r: number } };
      return {
        mat: mat.name,
        emissiveTex: std.emissiveTexture?.name ?? null,
        emissiveR: std.emissiveColor?.r ?? null,
      };
    },
  };
  Object.defineProperty(h, "seed", { get: () => refs().runSeed, enumerable: true });
  (window as unknown as { __nightaudit: DebugHandle }).__nightaudit = h;
}
