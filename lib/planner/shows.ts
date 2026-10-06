import type { PlanDay, PlanDayShow, PlanDayShowSource } from '@/lib/api/types';
import { unfoldedCloseHour } from './day-grid';

/**
 * Showtimes, as lines on the day. `/plan/day` answers for every date: the operator's own listing
 * where there is one, otherwise the last matching weekday carried forward, a projection marked as
 * one all the way to the pixel, which is why {@link PlannerShowLine} keeps `source`.
 */

/**
 * The park's published day in park-local minutes, not the axis with its pads. Build it with
 * {@link showDayHours}: past midnight `closeHour < openHour`, and the raw pair puts the close
 * before the open.
 */
export interface ShowDayHours {
  openMin: number;
  closeMin: number;
}

/**
 * The clip window for one day, or `null` where the park's hours are unknown. `closeHour` is
 * unfolded like the axis ({@link unfoldedCloseHour}), or a day crossing midnight clips every
 * projected show. The showtimes are not unfolded: the API files a 00:45 show under the next date,
 * so each day's times are an ordinary 0–1439.
 */
export function showDayHours(
  openHour: number | null | undefined,
  closeHour: number | null | undefined
): ShowDayHours | null {
  if (openHour === null || openHour === undefined) return null;
  if (closeHour === null || closeHour === undefined) return null;
  return {
    openMin: openHour * 60,
    closeMin: unfoldedCloseHour(openHour, closeHour) * 60,
  };
}

/** One showtime as a line on the day. */
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
 * One line per showtime, ascending. `times` is park-local `HH:mm`, like the axis, so nothing is
 * converted; a malformed entry is dropped rather than drawn at midnight.
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
      // A projection carries another day's programme, often a longer one, so it is clipped to this
      // day's hours. A listing is never clipped: an operator's time for this date outranks hours we
      // derived.
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
 * Whether the grid draws any show on this day, asked exactly as the grid asks. The phone's show
 * switch and its row render only where this is true.
 */
export function dayHasShowLines(day: PlanDay | null | undefined): boolean {
  if (!day) return false;
  return (
    showLinesFor(day.shows, showDayHours(day.context.openHour, day.context.closeHour)).length > 0
  );
}

/**
 * The source a drawn line speaks with where several shows fold into one: a projection anywhere in
 * the group, since a projection may never be drawn as a listing.
 */
export function lineSource(lines: readonly PlannerShowLine[]): PlanDayShowSource {
  return lines.some((line) => line.source === 'projected') ? 'projected' : 'scheduled';
}
