/**
 * Fixed-step simulation driver. Gameplay/anomaly logic runs at a fixed
 * 60 Hz; render happens once per RAF however fast that is. Deterministic in
 * the sense that sim outcomes don't depend on frame rate.
 */
export const SIM_DT = 1 / 60;
const MAX_STEPS_PER_FRAME = 5;

export class Stepper {
  private accumulator = 0;
  private simTime = 0;
  private readonly step: (dt: number) => void;

  constructor(step: (dt: number) => void) {
    this.step = step;
  }

  /** Called once per rendered frame with real elapsed seconds. */
  advance(frameDt: number): number {
    this.accumulator += Math.min(frameDt, 0.25); // clamp death-spiral
    let steps = 0;
    while (this.accumulator >= SIM_DT && steps < MAX_STEPS_PER_FRAME) {
      this.step(SIM_DT);
      this.accumulator -= SIM_DT;
      this.simTime += SIM_DT;
      steps++;
    }
    if (steps === MAX_STEPS_PER_FRAME) {
      // Dropping excess time keeps the sim stable under extreme hitches.
      this.accumulator = 0;
    }
    return steps;
  }

  get time(): number {
    return this.simTime;
  }

  reset(): void {
    this.accumulator = 0;
    this.simTime = 0;
  }
}
