/** The most foreground seconds one page view reports; a tab left open all day counts no more. */
export const MAX_ENGAGEMENT_SECONDS = 1800;

/**
 * The time one page view spent in the foreground: it runs while the page is visible and stands
 * still while the tab is hidden, so a page left open in the background earns nothing. The clock is
 * handed in, which keeps the timing testable without waiting.
 *
 * Reading it is cumulative on purpose: {@link ForegroundTimer.take} returns only the whole seconds
 * since the last read, and the fraction stays in the total, so reading often does not lose time and
 * a page that is read twice a second reports each second once.
 */
export class ForegroundTimer {
  private readonly now: () => number;
  private since: number | null;
  private elapsedMs = 0;
  private reportedSeconds = 0;

  constructor(now: () => number, visible: boolean) {
    this.now = now;
    this.since = visible ? now() : null;
  }

  /** The tab went to the background: time stops counting. */
  pause(): void {
    if (this.since === null) return;
    this.elapsedMs += Math.max(0, this.now() - this.since);
    this.since = null;
  }

  /** The tab came back to the front: time counts again. */
  resume(): void {
    if (this.since === null) this.since = this.now();
  }

  /**
   * The whole foreground seconds since the last call, up to {@link MAX_ENGAGEMENT_SECONDS} for the
   * page view as a whole. Under a second is 0 and stays in the total for the next call.
   */
  take(): number {
    const running = this.since === null ? 0 : Math.max(0, this.now() - this.since);
    const total = Math.min(MAX_ENGAGEMENT_SECONDS, Math.round((this.elapsedMs + running) / 1000));
    const delta = total - this.reportedSeconds;
    if (delta < 1) return 0;
    this.reportedSeconds = total;
    return delta;
  }
}
