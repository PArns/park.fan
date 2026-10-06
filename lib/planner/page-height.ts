'use client';

/**
 * The rider height a page has just offered to plan with, on its way to the wizard: the same
 * hand-off as {@link import('./page-day').plannerPageDay}, for a press on a park's "with kids"
 * page. The park slug is checked on the way out, and `take` clears as it reads and refuses anything
 * older than {@link MAX_AGE_MS}.
 */
export interface PlannerPageHeight {
  /** The park the height belongs to. */
  parkSlug: string;
  /** Centimetres, one of `RIDER_HEIGHT_CHOICES`. */
  cm: number;
}

/** See `page-day.ts`: two frames in practice, ten seconds so that no second gesture reaches it. */
const MAX_AGE_MS = 10_000;

let pending: (PlannerPageHeight & { at: number }) | null = null;

/** The pending height hand-off: `set` on the press, `take` in the panel. */
export const plannerPageHeight = {
  /** Leave the height the visitor just chose, for the panel to pick up. */
  set(height: PlannerPageHeight): void {
    pending = { ...height, at: Date.now() };
  },
  /** The pending height for this park, consumed; `null` when nothing is pending or it is another park's. */
  take(parkSlug: string): number | null {
    if (!pending) return null;
    const { at, parkSlug: owner, cm } = pending;
    pending = null;
    if (Date.now() - at > MAX_AGE_MS || owner !== parkSlug) return null;
    return cm;
  },
};
