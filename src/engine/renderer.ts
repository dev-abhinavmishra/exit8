/**
 * Renderer selection: WebGPU when fully available (self-hosted glslang/twgsl
 * assets — no CDN calls, so init fails fast and offline-safe), WebGL 2
 * otherwise. Every failure path lands on WebGL2.
 */
import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import type { EngineKind } from "../accessibility/settings";
import type { CapabilityReport } from "./quality";

export type RendererKind = "webgpu" | "webgl2";

export interface CreatedEngine {
  engine: Engine | WebGPUEngine;
  kind: RendererKind;
  /** human-readable note when a preferred path failed */
  note: string | null;
}

// Self-hosted wasm/js — copied from @babylonjs/core/assets into public/webgpu/
// by tools/assets/copy-webgpu-assets.mjs (predev/prebuild). Keeps WebGPU
// shader translation fully offline (the "no network calls" contract).
const base = import.meta.env.BASE_URL || "/";
const glslangJs = `${base}webgpu/glslang.js`;
const glslangWasm = `${base}webgpu/glslang.wasm`;
const twgslJs = `${base}webgpu/twgsl.js`;
const twgslWasm = `${base}webgpu/twgsl.wasm`;

const WEBGPU_INIT_TIMEOUT_MS = 8000;

async function tryWebGPU(canvas: HTMLCanvasElement): Promise<WebGPUEngine | null> {
  try {
    const engine = new WebGPUEngine(canvas, {
      // base './' yields relative asset URLs — resolve to absolute for paths
      glslangOptions: {
        jsPath: new URL(glslangJs, location.href).href,
        wasmPath: new URL(glslangWasm, location.href).href,
      },
      twgslOptions: {
        jsPath: new URL(twgslJs, location.href).href,
        wasmPath: new URL(twgslWasm, location.href).href,
      },
      setMaximumLimits: false,
      powerPreference: "high-performance",
    });
    await Promise.race([
      engine.initAsync(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("webgpu init timeout")), WEBGPU_INIT_TIMEOUT_MS),
      ),
    ]);
    return engine;
  } catch {
    return null;
  }
}

function createWebGL(canvas: HTMLCanvasElement): Engine {
  return new Engine(canvas, true, {
    stencil: true,
    adaptToDeviceRatio: true,
    antialias: true,
    audioEngine: false, // audio owned by our WebAudio bus graph
    doNotHandleContextLost: false,
  });
}

export async function createRenderer(
  canvas: HTMLCanvasElement,
  preference: EngineKind,
  caps: CapabilityReport,
): Promise<CreatedEngine> {
  const wantWebGPU = preference === "webgpu" || (preference === "auto" && caps.webgpu);
  if (wantWebGPU) {
    const gpu = await tryWebGPU(canvas);
    if (gpu) {
      return { engine: gpu, kind: "webgpu", note: null };
    }
    const note = preference === "webgpu" ? "WebGPU requested but unavailable — fell back to WebGL 2." : null;
    return { engine: createWebGL(canvas), kind: "webgl2", note };
  }
  return { engine: createWebGL(canvas), kind: "webgl2", note: null };
}
