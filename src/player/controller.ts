/**
 * Grounded first-person controller. Custom input (pointer lock with drag
 * fallback + touch), accel/decel, capsule collision via Babylon's built-in
 * ellipsoid-vs-mesh path, procedural head motion tied to real speed.
 * The collision coordinator is a lazy side-effect import — without it the
 * first cameraDirection move throws and kills the render loop.
 * The sim owns position; the camera renders it.
 */
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import "@babylonjs/core/Collisions/collisionCoordinator";
import type { Scene } from "@babylonjs/core/scene";
import type { Settings } from "../accessibility/settings";
import { LAYOUT } from "../world/generation/concourse";

export type FootstepListener = (pos: Vector3, intensity: number) => void;

export interface InputState {
  forward: number; // -1..1
  strafe: number; // -1..1
}

const WALK_SPEED = 2.6;
const ACCEL = 14;
const DECEL = 18;
const BOB_FREQ = 1.85; // Hz at full speed — ~step cadence
const PITCH_LIMIT = Math.PI / 2 - 0.12;

export class PlayerController {
  readonly camera: FreeCamera;
  private velocity = Vector3.Zero();
  private yaw = 0;
  private pitch = 0;
  private bobPhase = 0;
  private bobAmplitude = 0;
  private keys = new Set<string>();
  private footListeners: FootstepListener[] = [];
  private stepSide = 1;
  private pointerLocked = false;
  private dragging = false;
  private touchMove: InputState | null = null;
  private touchLookId: number | null = null;
  private touchLookLast = { x: 0, y: 0 };
  private touchMoveId: number | null = null;
  private touchMoveStart = { x: 0, y: 0 };
  private padButtonsPrev: boolean[] = [];
  private padButtonListeners = new Map<number, (() => void)[]>();
  private padMove: InputState | null = null;
  enabled = true;

  constructor(
    scene: Scene,
    private readonly canvas: HTMLCanvasElement,
    private readonly settings: Settings,
  ) {
    this.camera = new FreeCamera(
      "player",
      new Vector3(LAYOUT.spawn.x, LAYOUT.eyeHeight, LAYOUT.spawn.z),
      scene,
    );
    this.camera.minZ = 0.05;
    this.camera.maxZ = 80;
    this.camera.fov = (settings.video.fov * Math.PI) / 180;
    this.camera.checkCollisions = true;
    this.camera.applyGravity = false;
    this.camera.ellipsoid = new Vector3(0.34, 0.72, 0.34);
    this.camera.ellipsoidOffset = new Vector3(0, 0.8, 0);
    this.camera.inputs.clear(); // we own input
    this.yaw = LAYOUT.spawnYaw;
    this.attach();
  }

  private attach(): void {
    const el = this.canvas;
    el.addEventListener("click", () => {
      if (!this.pointerLocked && this.enabled) {
        el.requestPointerLock?.();
      }
    });
    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === el;
    });
    el.addEventListener("mousemove", (e) => {
      if (this.pointerLocked || this.dragging) this.look(e.movementX, e.movementY);
    });
    el.addEventListener("mousedown", () => {
      this.dragging = true;
    });
    window.addEventListener("mouseup", () => {
      this.dragging = false;
    });
    window.addEventListener("keydown", (e) => {
      if (!e.repeat) this.keys.add(e.code);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());

    // touch: left half = move stick, right half = look
    el.addEventListener("touchstart", (e) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.clientX < window.innerWidth / 2 && this.touchMoveId === null) {
          this.touchMoveId = t.identifier;
          this.touchMoveStart = { x: t.clientX, y: t.clientY };
          this.touchMove = { forward: 0, strafe: 0 };
        } else if (this.touchLookId === null) {
          this.touchLookId = t.identifier;
          this.touchLookLast = { x: t.clientX, y: t.clientY };
        }
      }
      e.preventDefault();
    });
    el.addEventListener("touchmove", (e) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this.touchMoveId && this.touchMove) {
          this.touchMove = {
            strafe: Math.max(-1, Math.min(1, (t.clientX - this.touchMoveStart.x) / 55)),
            forward: Math.max(-1, Math.min(1, (this.touchMoveStart.y - t.clientY) / 55)),
          };
        } else if (t.identifier === this.touchLookId) {
          this.look((t.clientX - this.touchLookLast.x) * 2.2, (t.clientY - this.touchLookLast.y) * 2.2);
          this.touchLookLast = { x: t.clientX, y: t.clientY };
        }
      }
      e.preventDefault();
    });
    const endTouch = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this.touchMoveId) {
          this.touchMoveId = null;
          this.touchMove = null;
        }
        if (t.identifier === this.touchLookId) this.touchLookId = null;
      }
    };
    el.addEventListener("touchend", endTouch);
    el.addEventListener("touchcancel", endTouch);
  }

  private look(dx: number, dy: number): void {
    if (!this.enabled) return;
    const s = 0.0022 * this.settings.controls.sensitivity;
    this.yaw -= dx * s;
    this.pitch -= dy * s * (this.settings.controls.invertY ? -1 : 1);
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
  }

  onFootstep(fn: FootstepListener): () => void {
    this.footListeners.push(fn);
    return () => {
      this.footListeners = this.footListeners.filter((f) => f !== fn);
    };
  }

  forward(): Vector3 {
    return new Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }

  get position(): Vector3 {
    return this.camera.position;
  }

  teleport(pos: Vector3, yaw: number): void {
    this.camera.position.copyFrom(pos);
    this.yaw = yaw;
    this.pitch = 0;
    this.velocity.setAll(0);
    this.bobPhase = 0;
  }

  /** Direct view set (debug/tests) — camera.rotation.x is rewritten from
   * `pitch` every update, so setting the camera alone never sticks. */
  setView(yaw?: number, pitch?: number): void {
    if (yaw !== undefined) this.yaw = yaw;
    if (pitch !== undefined) this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
  }

  isPointerLocked(): boolean {
    return this.pointerLocked;
  }

  /** Rising-edge gamepad button listener (0=A interact, 9=start). */
  onPadButton(idx: number, fn: () => void): void {
    const l = this.padButtonListeners.get(idx) ?? [];
    l.push(fn);
    this.padButtonListeners.set(idx, l);
  }

  /**
   * Rising-edge button check — driven from the RENDER loop (not the fixed
   * sim step) so pad buttons still fire while the sim is frozen in pause.
   */
  pollPadButtons(): void {
    const pads = navigator.getGamepads?.() ?? [];
    const gp = [...pads].find((p) => p !== null) ?? null;
    if (!gp) {
      this.padButtonsPrev = [];
      return;
    }
    for (const [i, listeners] of this.padButtonListeners) {
      if ((gp.buttons[i]?.pressed ?? false) && !this.padButtonsPrev[i]) {
        for (const fn of listeners) fn();
      }
    }
    this.padButtonsPrev = gp.buttons.map((b) => b.pressed);
  }

  /** Standard-mapping pad axes: left stick move, right stick look. Sim-step. */
  private pollPadAxes(dt: number): void {
    const pads = navigator.getGamepads?.() ?? [];
    const gp = [...pads].find((p) => p !== null) ?? null;
    if (!gp) {
      this.padMove = null;
      return;
    }
    const dz = (v: number) => (Math.abs(v) < 0.18 ? 0 : v * Math.abs(v)); // quadratic
    // right-stick look — same sensitivity + invertY path as the mouse
    const rx = dz(gp.axes[2] ?? 0);
    const ry = dz(gp.axes[3] ?? 0);
    if (this.enabled && (rx !== 0 || ry !== 0)) {
      const rate = 2.6 * this.settings.controls.sensitivity;
      this.yaw -= rx * rate * dt;
      this.pitch -= ry * rate * dt * (this.settings.controls.invertY ? -1 : 1);
      this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
    }
    const lx = dz(gp.axes[0] ?? 0);
    const ly = dz(gp.axes[1] ?? 0);
    this.padMove = lx === 0 && ly === 0 ? null : { forward: -ly, strafe: lx };
  }

  private inputVector(): InputState {
    const s = this.settings.controls;
    let fwd = (this.keys.has(s.keyForward) ? 1 : 0) - (this.keys.has(s.keyBack) ? 1 : 0);
    let strafe = (this.keys.has(s.keyRight) ? 1 : 0) - (this.keys.has(s.keyLeft) ? 1 : 0);
    if (this.padMove) {
      fwd += this.padMove.forward;
      strafe += this.padMove.strafe;
    }
    fwd = Math.max(-1, Math.min(1, fwd));
    strafe = Math.max(-1, Math.min(1, strafe));
    if (this.touchMove) return this.touchMove;
    return { forward: fwd, strafe };
  }

  /** Fixed-step sim update. */
  update(dt: number): void {
    this.pollPadAxes(dt);
    const input = this.enabled ? this.inputVector() : { forward: 0, strafe: 0 };
    const fwd = new Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new Vector3(fwd.z, 0, -fwd.x);
    const wish = fwd.scale(input.forward).add(right.scale(input.strafe));
    const wishLen = wish.length();
    if (wishLen > 1) wish.scaleInPlace(1 / wishLen);

    const target = wish.scale(WALK_SPEED * this.speedScale);
    const rate = wishLen > 0.05 ? ACCEL : DECEL;
    this.velocity.x += (target.x - this.velocity.x) * Math.min(1, rate * dt);
    this.velocity.z += (target.z - this.velocity.z) * Math.min(1, rate * dt);

    const delta = this.velocity.scale(dt);
    // cameraDirection is the collision-checked movement path (world-space,
    // consumed once per render); position writes bypass the collider entirely.
    this.camera.cameraDirection.addInPlace(delta);

    // collision ellipsoid rides camera height; keep eye level fixed here
    const bob = this.headBob(dt);
    this.camera.position.y = LAYOUT.eyeHeight + bob.y;
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch + bob.pitch;
    this.camera.rotation.z = bob.roll;
  }

  /** Procedural head motion; returns offsets. Honors reducedMotion+bobAmount. */
  private headBob(dt: number): { y: number; pitch: number; roll: number } {
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    const speed01 = Math.min(1, speed / WALK_SPEED);
    const reduced = this.settings.accessibility.reducedMotion;
    const amount = reduced ? 0 : this.settings.controls.bobAmount;
    this.bobAmplitude += (speed01 - this.bobAmplitude) * Math.min(1, 8 * dt);
    const prevPhase = this.bobPhase;
    this.bobPhase += dt * BOB_FREQ * Math.PI * 2 * Math.max(0.25, speed01);
    // footstep fires on each half-cycle (each "step")
    const prevStep = Math.floor((prevPhase / Math.PI) % 2);
    const curStep = Math.floor((this.bobPhase / Math.PI) % 2);
    if (curStep !== prevStep && this.bobAmplitude > 0.3) {
      this.stepSide *= -1;
      const intensity = Math.min(1, 0.4 + speed01 * 0.7);
      for (const fn of this.footListeners) fn(this.camera.position, intensity);
    }
    const a = 0.028 * this.bobAmplitude * amount;
    return {
      y: Math.abs(Math.sin(this.bobPhase)) * a,
      pitch: Math.sin(this.bobPhase * 0.5) * a * 0.12,
      roll: Math.sin(this.bobPhase) * a * 0.2 * this.stepSide * -1,
    };
  }

  speed(): number {
    return Math.hypot(this.velocity.x, this.velocity.z);
  }

  /** Multiplier on target walk speed — anomalies ease it away from 1 to
   * make the corridor take longer than it should. 1 in baseline. */
  speedScale = 1;

  dispose(): void {
    this.camera.dispose();
  }
}
