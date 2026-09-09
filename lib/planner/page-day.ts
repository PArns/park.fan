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
 * **Read once.** `take` clears as it reads, because this is a hand-off and not a state: a date
 * left lying here would arm the NEXT press of „Tag hier planen" — the one that means "some day,
 * you pick" — with a date the reader chose ten minutes ago on another page.
 */
export interface PlannerPageDay {
  /** The park the date belongs to. */
  parkSlug: string;
  /** `YYYY-MM-DD` in the park's own reckoning, exactly as the calendar holds it. */
  date: string;
}

let pending: PlannerPageDay | null = null;

export const plannerPageDay = {
  /** Leave the day the visitor just chose, for the panel to pick up. */
  set(day: PlannerPageDay): void {
    pending = day;
  },
  /**
   * The pending date for this park, consumed.
   *
   * `null` where nothing is pending or where what is pending belongs to another park — in both
   * cases the caller falls back to asking, which is the behaviour that existed before this file.
   */
  take(parkSlug: string): string | null {
    if (!pending || pending.parkSlug !== parkSlug) return null;
    const { date } = pending;
    pending = null;
    return date;
  },
  /** Drop anything pending — for a press that opens the panel without a day in mind. */
  clear(): void {
    pending = null;
  },
};
