/** Where a scheduled line can come from, best first in {@link LINE_PRIORITY}. */
export type LineSource = 'entrance' | 'holiday' | 'fact' | 'park' | 'invitation';

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
  /** `?parky=`, which forces a source to try it out: `fact`, or `egg` for the park line. */
  forced: string | null;
}

/**
 * Every source in the order Parky prefers them, each with when it may speak. A line kind that
 * joins the bubble's schedule goes in here at its rank, and nowhere else.
 */
const LINE_PRIORITY: readonly { source: LineSource; when: (s: LineSlot) => boolean }[] = [
  { source: 'entrance', when: (s) => s.slot === 0 && s.arrival },
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
 * park whose statistics are too thin for a fact falls through to the next one.
 */
export function lineSources(slot: LineSlot): LineSource[] {
  return LINE_PRIORITY.filter((entry) => entry.when(slot)).map((entry) => entry.source);
}
