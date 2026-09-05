/**
 * A tagged logger with a ring buffer.
 *
 * The buffer is the point: the Playwright harness reads `window.__PARKFAN_GAME__.log()` after a
 * screenshot and writes it into the run's JSON, so a console message that scrolled past — an asset
 * that fell back, a module that stubbed — is still in the record. Console output alone is not,
 * because a headless run captures it only while a listener happens to be attached.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly t: number;
  readonly level: LogLevel;
  readonly tag: string;
  readonly message: string;
  readonly detail?: unknown;
}

export interface Logger {
  debug(message: string, detail?: unknown): void;
  info(message: string, detail?: unknown): void;
  warn(message: string, detail?: unknown): void;
  error(message: string, detail?: unknown): void;
  child(tag: string): Logger;
}

const RING_SIZE = 500;

export class LogRing {
  private entries: LogEntry[] = [];
  private cursor = 0;
  /** Anything at or above this goes to the console too. */
  consoleLevel: LogLevel = 'warn';
  /** Counted separately so a harness can assert "zero errors" without scanning the ring. */
  errorCount = 0;
  warnCount = 0;

  private order: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

  push(entry: LogEntry): void {
    if (this.entries.length < RING_SIZE) this.entries.push(entry);
    else {
      this.entries[this.cursor] = entry;
      this.cursor = (this.cursor + 1) % RING_SIZE;
    }
    if (entry.level === 'error') this.errorCount++;
    if (entry.level === 'warn') this.warnCount++;
    if (this.order[entry.level] >= this.order[this.consoleLevel]) {
      const method = entry.level === 'debug' ? 'log' : entry.level;
      // eslint-disable-next-line no-console
      console[method](`[game:${entry.tag}] ${entry.message}`, entry.detail ?? '');
    }
  }

  /** Oldest first. */
  drain(): LogEntry[] {
    if (this.entries.length < RING_SIZE) return this.entries.slice();
    return [...this.entries.slice(this.cursor), ...this.entries.slice(0, this.cursor)];
  }

  clear(): void {
    this.entries = [];
    this.cursor = 0;
    this.errorCount = 0;
    this.warnCount = 0;
  }

  logger(tag: string, now: () => number = () => 0): Logger {
    const make = (level: LogLevel) => (message: string, detail?: unknown) =>
      this.push({ t: now(), level, tag, message, detail });
    return {
      debug: make('debug'),
      info: make('info'),
      warn: make('warn'),
      error: make('error'),
      child: (sub: string) => this.logger(`${tag}:${sub}`, now),
    };
  }
}
