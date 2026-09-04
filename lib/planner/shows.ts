import type { PlanDayShow, PlanDayShowSource } from '@/lib/api/types';

/**
 * Showtimes, as lines on the day.
 *
 * They used to be read off the live park payload, which meant they existed for
 * TODAY and for no other date — sixty of the sixty-one dates the picker offers
 * drew nothing, and the panel had to say so. `/plan/day` answers for every date
 * instead: the operator's own listing where there is one, and otherwise the last
 * matching weekday carried forward. That second kind is a projection and is
 * marked as one all the way to the pixel, which is the whole reason
 * {@link PlannerShowLine} carries `source` rather than resolving it away here.
 */

/**
 * The park's PUBLISHED day, in park-local minutes — `context.openHour` and
 * `context.closeHour`, not the axis. The axis pads both ends by half an hour and
 * carries a whole extra hour at the close (the backend emits a bucket AT
 * `closeHour`), and neither of those is a claim that anything happens there.
 */
export interface ShowDayHours {
  openMin: number;
  closeMin: number;
}

export interface PlannerShowLine {
  slug: string;
  name: string;
  /** Park-local minutes since midnight. */
  minute: number;
  source: PlanDayShowSource;
  /** `projected` only — the date these times were observed on. */
  observedOn?: string | null;
  /** `projected` only — measured days behind the projection. */
  sampleDays?: number | null;
}

/**
 * One line per showtime, ascending.
 *
 * `times` is park-local wall clock (`HH:mm`) and stays that way: the planner's
 * whole axis is park-local minutes, so there is no instant to build and no zone
 * to convert through. A malformed entry is dropped rather than defaulted — a
 * show at minute 0 would be drawn at midnight, which is a line somebody would
 * have to explain.
 */
export function showLinesFor(
  shows: readonly PlanDayShow[] | undefined | null,
  hours?: ShowDayHours | null
): PlannerShowLine[] {
  const out: PlannerShowLine[] = [];
  for (const show of shows ?? []) {
    for (const time of show.times ?? []) {
      const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
      if (!match) continue;
      const hour = Number(match[1]);
      const minute = Number(match[2]);
      if (hour > 23 || minute > 59) continue;
      const at = hour * 60 + minute;
      // A projection carries ANOTHER day's programme, and the other day is often
      // the longer one. Phantasialand closed at 18:00 on 2026-09-03 and its
      // projection came off 2026-08-13, a late-summer evening: 22 of the 48
      // showtimes the API returned for that date sat past the close — the whole
      // Wintertraum and laser run from 18:15 to 21:00 — drawn down an axis that
      // ends at 19:00, which is where the grid stopped being a plan and became a
      // wall of dotted rules. A LISTING is never clipped: an operator publishing
      // a time for this date outranks an opening hour we derived, which the API
      // says out loud for `hoursSource: "observed"`, where the window it reports
      // is narrower than the park's real one.
      if (show.source === 'projected' && hours && (at < hours.openMin || at > hours.closeMin)) {
        continue;
      }
      out.push({
        slug: show.showSlug,
        name: show.showName,
        minute: at,
        source: show.source,
        observedOn: show.observedOn ?? null,
        sampleDays: show.sampleDays ?? null,
      });
    }
  }
  return out.sort((a, b) => a.minute - b.minute);
}

/**
 * The source a drawn line speaks with, where several shows fold into one.
 *
 * A projection anywhere in the group decides it. The rule is one-directional —
 * a projection may never be drawn as a listing — so where a scheduled 14:00 and
 * a projected 14:05 collapse into one rule, the softer treatment is the only
 * one that is not a promise about the second of them.
 */
export function lineSource(lines: readonly PlannerShowLine[]): PlanDayShowSource {
  return lines.some((line) => line.source === 'projected') ? 'projected' : 'scheduled';
}
