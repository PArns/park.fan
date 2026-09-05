/**
 * The fixed-step scheduler.
 *
 * 20 Hz, and the tick length never changes. Speed multipliers run *more* ticks per frame, they do
 * not run longer ones — a variable dt is how a physics integration stops being reproducible, and
 * reproducibility is what the soak test and the save round-trip both rest on.
 *
 * The accumulator is clamped: after a tab has been backgrounded for a minute the elapsed time is
 * 60 s, and running 1200 catch-up ticks in one frame locks the page. `MAX_CATCHUP_TICKS` bounds
 * it and the remainder is *dropped*, not deferred — the park runs while the tab is hidden or it
 * does not, and pretending to catch up produces a frame that takes a second.
 */

import { TICK_MS } from './units';

export const MAX_CATCHUP_TICKS = 8;

export interface SchedulerStats {
  ticks: number;
  /** Ticks the accumulator had to drop because the frame ran long. */
  dropped: number;
  lastTickMs: number;
  meanTickMs: number;
  maxTickMs: number;
}

export class FixedStepScheduler {
  private accumulator = 0;
  private speed = 1;
  private samples: number[] = [];
  readonly stats: SchedulerStats = {
    ticks: 0,
    dropped: 0,
    lastTickMs: 0,
    meanTickMs: 0,
    maxTickMs: 0,
  };

  constructor(
    private readonly step: () => void,
    /** Injected so the worker can pass a clock the sim itself never reads. */
    private readonly now: () => number
  ) {}

  setSpeed(speed: number): void {
    this.speed = Math.max(0, speed);
    // A paused sim must not bank up time to spend the moment it resumes.
    if (this.speed === 0) this.accumulator = 0;
  }

  getSpeed(): number {
    return this.speed;
  }

  /** Feed real elapsed milliseconds. Returns how many ticks ran. */
  advance(elapsedMs: number): number {
    if (this.speed === 0) return 0;
    this.accumulator += elapsedMs * this.speed;
    let ran = 0;
    while (this.accumulator >= TICK_MS) {
      if (ran >= MAX_CATCHUP_TICKS) {
        const dropped = Math.floor(this.accumulator / TICK_MS);
        this.stats.dropped += dropped;
        this.accumulator -= dropped * TICK_MS;
        break;
      }
      this.accumulator -= TICK_MS;
      this.runOne();
      ran++;
    }
    return ran;
  }

  /** Run exactly `count` ticks, ignoring the clock. The fast-forward and soak path. */
  runExactly(count: number): void {
    for (let i = 0; i < count; i++) this.runOne();
  }

  private runOne(): void {
    const started = this.now();
    this.step();
    const took = this.now() - started;
    this.stats.ticks++;
    this.stats.lastTickMs = took;
    if (took > this.stats.maxTickMs) this.stats.maxTickMs = took;
    // A 120-sample window: long enough to be stable, short enough that a fix shows up while
    // somebody is looking at the overlay.
    this.samples.push(took);
    if (this.samples.length > 120) this.samples.shift();
    let sum = 0;
    for (const s of this.samples) sum += s;
    this.stats.meanTickMs = sum / this.samples.length;
  }

  resetStats(): void {
    this.stats.ticks = 0;
    this.stats.dropped = 0;
    this.stats.maxTickMs = 0;
    this.samples = [];
  }
}
