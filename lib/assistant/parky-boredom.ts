/**
 * How bored Parky is: `awake` while somebody uses the page, `bored` after a quiet spell, `asleep`
 * after a long one.
 */
export type ParkyBoredom = 'awake' | 'bored' | 'asleep';

/** Quiet time on the page before Parky gets bored. */
export const BORED_AFTER_MS = 25_000;
/** Quiet time on the page before Parky nods off. */
export const ASLEEP_AFTER_MS = 75_000;

/** How bored Parky is after `quietMs` without a pointer, key, wheel or touch on the page. */
export function boredomAfter(quietMs: number): ParkyBoredom {
  if (quietMs >= ASLEEP_AFTER_MS) return 'asleep';
  if (quietMs >= BORED_AFTER_MS) return 'bored';
  return 'awake';
}

/** How long until the next stage after `quietMs` of quiet; `null` once asleep, which only activity ends. */
export function nextBoredomInMs(quietMs: number): number | null {
  if (quietMs < BORED_AFTER_MS) return BORED_AFTER_MS - quietMs;
  if (quietMs < ASLEEP_AFTER_MS) return ASLEEP_AFTER_MS - quietMs;
  return null;
}

// Scrolling arrives as one of these too: a wheel, a touch, a key or a press on the scrollbar.
const ACTIVITY = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
// Capture, so a handler that stops propagation cannot hide a visitor from Parky.
const LISTEN = { capture: true, passive: true } as const;

let stage: ParkyBoredom = 'awake';
let before: ParkyBoredom = 'awake';
let lastActive = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let still: boolean | undefined;
const listeners = new Set<() => void>();

function settle(next: ParkyBoredom): void {
  if (next === stage) return;
  before = stage;
  stage = next;
  listeners.forEach((listener) => listener());
}

// One timer, armed for the next stage and re-checked when it fires, so a moving pointer costs a
// timestamp and never a timer.
function tick(): void {
  timer = undefined;
  const quiet = performance.now() - lastActive;
  settle(boredomAfter(quiet));
  const due = nextBoredomInMs(quiet);
  if (due !== null) timer = setTimeout(tick, due);
}

function onActivity(): void {
  lastActive = performance.now();
  if (stage !== 'awake') settle('awake');
  if (timer === undefined) tick();
}

function reducedMotion(): boolean {
  still ??= window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return still;
}

/**
 * One boredom for the whole page, for `useSyncExternalStore`: the first subscriber starts the
 * listeners, the last one stops them. Without motion (`prefers-reduced-motion`) Parky has no idle
 * life and the snapshot is `null`, as on the server.
 */
export const parkyBoredom = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (listeners.size === 1 && !reducedMotion()) {
      lastActive = performance.now();
      stage = 'awake';
      before = 'awake';
      for (const type of ACTIVITY) window.addEventListener(type, onActivity, LISTEN);
      tick();
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size > 0) return;
      for (const type of ACTIVITY) window.removeEventListener(type, onActivity, LISTEN);
      clearTimeout(timer);
      timer = undefined;
    };
  },
  getSnapshot: (): ParkyBoredom | null => (reducedMotion() ? null : stage),
  /** Whether the last change woke Parky from sleep; read in an effect after the change. */
  wokeUp: (): boolean => before === 'asleep' && stage === 'awake',
  getServerSnapshot: (): ParkyBoredom | null => null,
};
