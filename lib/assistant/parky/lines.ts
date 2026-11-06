/** Where a scheduled line can come from, best first in {@link LINE_PRIORITY}. */
export type LineSource = 'entrance' | 'live' | 'clock' | 'holiday' | 'fact' | 'park' | 'invitation';

/** What decides which sources may speak in one of the session's slots (`TEASER_SCHEDULE_MS`). */
export interface LineSlot {
  /** Which of the session's slots is due, 0 for the first. */
  slot: number;
  /** The last slot of the session, the one a fact takes. */
  lastSlot: number;
  /** Parky has just made an entrance on this page. */
  arrival: boolean;
  /** Today is one of Parky's holidays. */
  holiday: boolean;
  page: 'park' | 'home' | 'other';
  /** The park line's draw came up for this slot (`PARK_EGG_CHANCE`). */
  parkLuck: boolean;
  /**
   * This session has already had its line about how this park is right now, from the live waits
   * or the weather ({@link parkNewsKey}).
   */
  parkNews: boolean;
  /**
   * `?parky=`, which forces a source to try it out: `fact`, `live`, `clock`, or `egg` for the park
   * line.
   */
  forced: string | null;
}

/**
 * The session's answered-kind key for a park's news (`countAnswer`). The live waits and the
 * weather are level: a park gets one line a session about how it is right now, and whichever says
 * it first takes it, the slot's live line or the weather's own line 12 s after the page settles.
 */
export function parkNewsKey(parkPath: string): string {
  return `news:${parkPath}`;
}

/**
 * Every source in the order Parky prefers them, each with when it may speak. A line kind that
 * joins the bubble's schedule goes in here at its rank, and nowhere else. `live` comes before
 * `clock` when both have a line: what the queues say now is the more useful news, and the clock
 * gets the next slot.
 */
const LINE_PRIORITY: readonly { source: LineSource; when: (s: LineSlot) => boolean }[] = [
  { source: 'entrance', when: (s) => s.slot === 0 && s.arrival },
  {
    source: 'live',
    when: (s) => s.page === 'park' && (s.forced === 'live' || !s.parkNews),
  },
  { source: 'clock', when: (s) => s.page === 'park' },
  { source: 'holiday', when: (s) => s.slot === 0 && s.holiday },
  {
    source: 'fact',
    when: (s) => s.page !== 'other' && (s.slot === s.lastSlot || s.forced === 'fact'),
  },
  { source: 'park', when: (s) => s.page === 'park' && (s.parkLuck || s.forced === 'egg') },
  { source: 'invitation', when: () => true },
];

/**
 * The sources that may fill a slot, best first. The scheduler says the first that has a line: a
 * park whose statistics are too thin for a fact falls through to the next one. A forced source
 * goes first, so `?parky=` shows its line in whichever slot comes.
 */
export function lineSources(slot: LineSlot): LineSource[] {
  const sources = LINE_PRIORITY.filter((entry) => entry.when(slot)).map((entry) => entry.source);
  const forced = sources.find((source) => source === slot.forced);
  return forced ? [forced, ...sources.filter((source) => source !== forced)] : sources;
}
