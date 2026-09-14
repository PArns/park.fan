/**
 * Fixed-step scheduler. Accumulates real time and runs whole ticks of TICK_MS; a stall longer
 * than `maxCatchUpTicks` drops the backlog rather than spiralling. Runs on any thread; the worker
 * drives it with `setTimeout`/`setInterval` and node's soak harness calls `step()` directly.
 */

import { TICK_MS } from './types';

export class FixedStepScheduler {
  private accumulator = 0;
  private lastNow: number | null = null;
  tick = 0;
  maxCatchUpTicks = 5;

  private readonly onTick: (tick: number) => void;

  constructor(onTick: (tick: number) => void) {
    this.onTick = onTick;
  }

  /** Feed wall-clock time; runs as many whole ticks as have elapsed. Returns ticks run. */
  advance(now: number): number {
    if (this.lastNow == null) this.lastNow = now;
    this.accumulator += now - this.lastNow;
    this.lastNow = now;
    let ran = 0;
    while (this.accumulator >= TICK_MS) {
      if (ran >= this.maxCatchUpTicks) {
        this.accumulator = 0;
        break;
      }
      this.accumulator -= TICK_MS;
      this.step();
      ran += 1;
    }
    return ran;
  }

  /** Run exactly one tick regardless of wall clock (soak harness, tests). */
  step(): void {
    this.tick += 1;
    this.onTick(this.tick);
  }

  reset(): void {
    this.accumulator = 0;
    this.lastNow = null;
  }
}
