import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { BlogFrontmatter } from './types';

type Published = Pick<BlogFrontmatter, 'date' | 'time'>;

/**
 * Frontmatter dates and times are written in Germany. Berlin switches DST at 02:00, so midnight
 * always exists; a `time` inside the skipped hour is moved forward by `fromZonedTime`.
 */
const POST_TIME_ZONE = 'Europe/Berlin';

/** The shape `time` must have: `HH:MM`, 00:00 to 23:59. */
export const POST_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function clockOf(fm: Published): string | null {
  const time = fm.time?.trim();
  return time && POST_TIME.test(time) ? time : null;
}

/**
 * When a post went out, as a sortable local stamp: `2026-10-07T13:20`, or the bare date for a post
 * without a time, which then sorts before every timed post of its day. Both halves are fixed-width,
 * so string comparison is time comparison.
 */
export function publishedAt(fm: Published): string {
  const clock = clockOf(fm);
  return clock ? `${fm.date}T${clock}` : fm.date;
}

/**
 * Comparator, newest first by {@link publishedAt}. Equal stamps return 0, so a stable sort keeps
 * them in the order it was given; a comparator that never returns 0 left same-day posts in
 * whatever order the engine's sort happened to produce.
 */
export function newestPublishedFirst(a: Published, b: Published): number {
  const x = publishedAt(a);
  const y = publishedAt(b);
  return x < y ? 1 : x > y ? -1 : 0;
}

/**
 * A calendar day, and the post's time when it has one, as a timestamp with Berlin's offset, which
 * Google wants on every Article type: `2026-10-07` → `2026-10-07T00:00:00+02:00`, with `13:20` →
 * `2026-10-07T13:20:00+02:00`. Anything that is not a bare day passes through.
 */
export function withZoneOffset(date: string, time?: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const clock = time && POST_TIME.test(time.trim()) ? time.trim() : '00:00';
  return formatInTimeZone(
    fromZonedTime(`${date}T${clock}:00`, POST_TIME_ZONE),
    POST_TIME_ZONE,
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );
}

/**
 * The instant a post went out, for a feed's `pubDate`: feed readers order by it, and every news
 * post of a day used to share one. A post without a time keeps UTC midnight, the instant the feed
 * has always given it, so no existing item moves.
 */
export function publishedInstant(fm: Published): Date {
  const clock = clockOf(fm);
  return clock ? fromZonedTime(`${fm.date}T${clock}:00`, POST_TIME_ZONE) : new Date(fm.date);
}
