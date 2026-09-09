'use client';

/**
 * The day a page has just offered to plan, on its way to the wizard.
 *
 * `plannerUi.requestOpen` carries no payload on purpose — see the note there — and the park it
 * would otherwise need is already published by {@link plannerPagePark}. The date is the one thing
 * neither of those answers: it is not a property of the route (a calendar month page is about
 * thirty days) and it is not a property of the plan (there is none yet). It belongs to the
 * PRESS, and this is where a press leaves it for the panel to pick up.
 *
 * A module store rather than a field on the intent, for the reason `ui-store.ts` gives for
 * carrying no park: an intent that grew data would be a second channel free to disagree with the
 * beacon, and the two would then have to be kept in step by whoever remembered. Same shape as
 * `page-park.ts`, one file over, so there is one pattern for "the page tells the panel something"
 * rather than two.
 *
 * **The park slug travels with the date and is checked on the way out.** A date alone is
 * ambiguous the moment somebody walks from one park's calendar to another's without the panel
 * having consumed it — and „der 20. September" at the wrong park is a plan for a day the reader
 * never picked. {@link plannerPageDay.take} therefore only returns a date whose park is the one
 * being asked about.
 *
 * **Read once, and not for long.** `take` clears as it reads, and refuses anything older than
 * {@link MAX_AGE_MS} — because this is a hand-off and not a state, and the failure mode of a
 * hand-off nobody collected is that somebody else collects it.
 */
export interface PlannerPageDay {
  /** The park the date belongs to. */
  parkSlug: string;
  /** `YYYY-MM-DD` in the park's own reckoning, exactly as the calendar holds it. */
  date: string;
}

/**
 * How long a hand-off stays valid.
 *
 * The panel consumes this within a frame or two of the press — it is a store write followed by a
 * `requestOpen` the flyout answers in the same commit. Anything still here seconds later was
 * never picked up (the planner's lazy chunk failed, the double-`requestAnimationFrame` never
 * fired), and the danger is not that it is lost but that it is found: the NEXT wizard request for
 * this park — „Tag im Phantasialand planen", which means „some day, you pick" — would consume it
 * and skip the date step with a date chosen minutes ago on another screen.
 *
 * Ten seconds is generous for something that normally takes two frames, and short enough that no
 * second gesture can reach it.
 */
const MAX_AGE_MS = 10_000;

let pending: (PlannerPageDay & { at: number }) | null = null;

export const plannerPageDay = {
  /** Leave the day the visitor just chose, for the panel to pick up. */
  set(day: PlannerPageDay): void {
    pending = { ...day, at: Date.now() };
  },
  /**
   * The pending date for this park, consumed.
   *
   * `null` where nothing is pending or where what is pending belongs to another park — in both
   * cases the caller falls back to asking, which is the behaviour that existed before this file.
   */
  take(parkSlug: string): string | null {
    if (!pending) return null;
    if (Date.now() - pending.at > MAX_AGE_MS) {
      pending = null;
      return null;
    }
    if (pending.parkSlug !== parkSlug) return null;
    const { date } = pending;
    pending = null;
    return date;
  },
  /** Drop anything pending — for a press that opens the panel without a day in mind. */
  clear(): void {
    pending = null;
  },
};
