/**
 * Stability index 0–100: the progression device. Correct judgments raise
 * it, mistakes lower it; reaching 100 secures the route (standard ending),
 * hitting 0 loses it. Chapter 1 of the consequence model: stability loss
 * only — resets/chapter penalties arrive with chapters 2–3.
 */
export const STABILITY_START = 40;
export const STABILITY_WIN = 100;
export const STABILITY_LOSE = 0;

export interface JudgmentResult {
  correct: boolean;
  delta: number;
  stability: number;
  outcome: "continue" | "secure" | "lost";
}

export class StabilityIndex {
  private value = STABILITY_START;
  private listeners: ((v: number) => void)[] = [];

  get current(): number {
    return this.value;
  }

  set(v: number): void {
    this.value = Math.max(STABILITY_LOSE, Math.min(STABILITY_WIN, Math.round(v)));
    this.emit();
  }

  onChange(fn: (v: number) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((f) => f !== fn);
    };
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.value);
  }

  /** chapter weight softens penalties early and sharpens rewards later */
  private weights(chapter: number): { gain: number; loss: number } {
    return chapter === 1
      ? { gain: 12, loss: 16 }
      : chapter === 2
        ? { gain: 10, loss: 20 }
        : { gain: 9, loss: 24 };
  }

  judge(correct: boolean, chapter: number): JudgmentResult {
    const w = this.weights(chapter);
    const delta = correct ? w.gain : -w.loss;
    this.set(this.value + delta);
    const outcome =
      this.value >= STABILITY_WIN ? "secure" : this.value <= STABILITY_LOSE ? "lost" : "continue";
    return { correct, delta, stability: this.value, outcome };
  }
}
