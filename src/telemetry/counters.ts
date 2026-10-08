/** Rolling performance counters for the debug overlay (dev use). */
export class PerfCounters {
  private samples: number[] = [];
  private readonly capacity = 240;

  push(frameMs: number): void {
    this.samples.push(frameMs);
    if (this.samples.length > this.capacity) this.samples.shift();
  }

  percentile(p: number): number {
    if (this.samples.length === 0) return 0;
    const s = [...this.samples].sort((a, b) => a - b);
    const idx = Math.min(s.length - 1, Math.floor((p / 100) * s.length));
    return s[idx] ?? 0;
  }

  get fpsAvg(): number {
    if (this.samples.length === 0) return 0;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    return avg > 0 ? 1000 / avg : 0;
  }
}
