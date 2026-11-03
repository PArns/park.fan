/** Which way a hard scroll throws Parky: carried up (`down`) or pressed flat (`up`). */
export type ParkyFling = 'down' | 'up';

/** What moves the page: a finger, a wheel or trackpad, a key, or the scrollbar dragged by mouse. */
export type FlingHand = 'touch' | 'wheel' | 'key' | 'bar';

/**
 * How far the page has to travel one way, in viewport heights, and within how long, to throw
 * Parky, by what moves it. A finger's flick carries the page on its momentum, so on a phone a brisk
 * swipe already covers two screens. A wheel moves the page in steps without momentum: a few notches
 * at a time stay under a screen, a wheel rolled hard gets past it. The scrollbar's thumb covers the
 * most page per move of the hand, so a quick pull is enough. A key needs holding: one press of the
 * space bar is less than a screen (`docs/features/assistant.md`).
 */
const THROW: Record<FlingHand, { screens: number; ms: number }> = {
  touch: { screens: 3, ms: 600 },
  wheel: { screens: 1.25, ms: 500 },
  key: { screens: 3, ms: 600 },
  bar: { screens: 1, ms: 500 },
};
/** The longest span any hand is measured over. */
const LONGEST_MS = Math.max(...Object.values(THROW).map(({ ms }) => ms));
/**
 * A hand this recent means the visitor moves the page. It covers the momentum after the finger
 * lifts; a link, a tab or a script scrolling the page on its own never throws him.
 */
export const FLING_HAND_MS = 1_000;
/** Once thrown he holds on while the page still moves this fast (px/ms), slower scrolling included. */
const HOLD_SPEED = 0.5;
/**
 * Once the page has moved slower than that for this long, he lets go: long enough to hold on
 * through the gaps between a wheel's bursts or a finger's swipes, so he does not bounce about.
 */
export const SETTLE_MS = 250;

/** The last wheel, finger movement, scroll key or press on the scrollbar, and when it came. */
export interface FlingHandAt {
  kind: FlingHand;
  at: number;
}

/** Where the page stood at a moment. */
interface Reading {
  at: number;
  y: number;
}

/** What one reading of the page means for Parky. */
export interface FlingState {
  /** The fling under way, or null. */
  fling: ParkyFling | null;
  /** The page still moves fast enough to hold him where the fling put him. */
  holding: boolean;
}

/**
 * Decides when a scroll throws Parky (`useScrollFling`), from the scroll position read once a frame.
 * A throw is distance, not a peak: the page has to travel a few viewport heights one way within
 * a fraction of a second, moved by hand, how far depending on the hand. A frame read late shows a
 * burst of speed the page never had, so a single fast frame must not be enough. More than a screen
 * between two readings is a jump (a link to the top of a new page) and starts the count again,
 * except while the scrollbar is pulled, whose thumb covers that much of a long page in a frame. The
 * first direction holds until he lets go, so a hanging Parky is not squashed; once he has, the next
 * throw can come at once, either way. The clock is handed in, so the decision is testable without a
 * browser.
 */
export class FlingTracker {
  private readings: Reading[] = [];
  private fling: ParkyFling | null = null;

  /** One reading: `at` in ms, `y` the scroll position and `viewport` the window's height. */
  read(at: number, y: number, viewport: number, hand: FlingHandAt | null): FlingState {
    const last = this.readings.at(-1);
    const moved = last ? Math.abs(y - last.y) : 0;
    const jumped = moved > viewport && hand?.kind !== 'bar';
    if (jumped) this.readings = [];
    const speed = last && !jumped ? moved / Math.max(at - last.at, 1) : 0;
    this.readings.push({ at, y });
    while (this.readings[0].at < at - LONGEST_MS) this.readings.shift();
    if (this.fling) return { fling: this.fling, holding: speed > HOLD_SPEED };
    const none = { fling: null, holding: false };
    if (!hand || at - hand.at > FLING_HAND_MS) return none;
    const { screens, ms } = THROW[hand.kind];
    const from = this.readings.find((reading) => reading.at >= at - ms) ?? { at, y };
    const travel = y - from.y;
    if (Math.abs(travel) < screens * viewport) return none;
    this.fling = travel > 0 ? 'down' : 'up';
    return { fling: this.fling, holding: true };
  }

  /** The page has all but stopped, or Parky is needed elsewhere: he lets go. */
  letGo(): void {
    this.fling = null;
    this.readings = [];
  }
}
