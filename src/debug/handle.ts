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
  teleport(x: number, y: number, z: number, yaw?: number): void;
  forceAnomaly(id: string | null): void;
  setStability(v: number): void;
  /** look direction */
  look(yaw: number, pitch?: number): void;
  /** synth keydown for e2e movement without pointer lock */
  key(code: string, down: boolean): void;
  fps(): number;
  draws(): number;
  tris(): number;
  screenshot(width?: number, height?: number): Promise<string>;
  registry(): string[];
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
    teleport: (x, y, z, yaw) => {
      refs().player.teleport(new Vector3(x, y, z), yaw ?? 0);
    },
    forceAnomaly: (id) => refs().loop.forceAnomaly(id),
    setStability: (v) => refs().loop.stability.set(v),
    look: (yaw, pitch) => {
      refs().player.teleport(refs().player.position.clone(), yaw);
      if (pitch !== undefined) refs().player.camera.rotation.x = pitch;
    },
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
  };
  Object.defineProperty(h, "seed", { get: () => refs().runSeed, enumerable: true });
  (window as unknown as { __nightaudit: DebugHandle }).__nightaudit = h;
}
