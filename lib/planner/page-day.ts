'use client';

/**
 * The day a page has just offered to plan, on its way to the wizard. The date belongs to the press,
 * not to the route or the plan, so the press leaves it here; a module store like `page-park.ts`,
 * because an intent that carried data would be a second channel free to disagree with the beacon.
 *
 * The park slug travels with the date and is checked on the way out, so a date cannot be applied
 * at another park. Read once: `take` clears as it reads and refuses anything older than
 * {@link MAX_AGE_MS}, because a hand-off nobody collected must not be collected by somebody else.
 */
export interface PlannerPageDay {
  /** The park the date belongs to. */
  parkSlug: string;
  /** `YYYY-MM-DD` in the park's own reckoning, exactly as the calendar holds it. */
  date: string;
}

/**
 * How long a hand-off stays valid. The panel takes it within a frame or two; one still here
 * seconds later was never picked up, and the next wizard request for this park would otherwise
 * skip its date step with a date chosen on another screen.
 */
const MAX_AGE_MS = 10_000;

let pending: (PlannerPageDay & { at: number }) | null = null;

/** The pending day hand-off: `set` on the press, `take` in the panel. */
export const plannerPageDay = {
  /** Leave the day the visitor just chose, for the panel to pick up. */
  set(day: PlannerPageDay): void {
    pending = { ...day, at: Date.now() };
  },
  /**
   * The pending date for this park, consumed. `null` where nothing is pending or it belongs to
   * another park; the caller then asks.
   */
  take(parkSlug: string): string | null {
    if (!pending) return null;
    if (Date.now() - pending.at > MAX_AGE_MS) {
      pending = null;
      return null;
    }
    // Cleared on a mismatch too, or the right park's next "some day, you pick" gesture could still
    // collect it inside the window.
    if (pending.parkSlug !== parkSlug) {
      pending = null;
      return null;
    }
    const { date } = pending;
    pending = null;
    return date;
  },
};
