import type { ScheduleItem } from '@/lib/api/types';

/** A schedule row as `/v1/parks/<geo>/schedule` sends it: `isEstimated` is not on `ScheduleItem`. */
export type HoursScheduleItem = Pick<
  ScheduleItem,
  'date' | 'scheduleType' | 'openingTime' | 'closingTime'
> & { isEstimated?: boolean };

/** The days that become a calendar event: an `OPERATING` row with both times. */
function isOpeningDay(day: HoursScheduleItem): boolean {
  return Boolean(day.scheduleType === 'OPERATING' && day.openingTime && day.closingTime);
}

/**
 * One row per date, and with `now` only those that have not ended yet. The park page calls it
 * without a clock — it never reads one in the shell path — and the route, which does, passes it.
 *
 * One row per date. The API sends `EXTRA_HOURS` next to `OPERATING` for the same date, and a
 * second event would show up as a second visit, so only the `OPERATING` row counts.
 */
export function openingDays(
  schedule: readonly HoursScheduleItem[] | null | undefined,
  now?: Date
): HoursScheduleItem[] {
  const seen = new Set<string>();
  const days: HoursScheduleItem[] = [];
  for (const day of schedule ?? []) {
    if (!isOpeningDay(day) || seen.has(day.date)) continue;
    if (now && new Date(day.closingTime as string).getTime() <= now.getTime()) continue;
    seen.add(day.date);
    days.push(day);
  }
  return days;
}

/** Whether the park page offers the calendar link: the schedule has an opening day at all. */
export function hasOpeningDays(
  schedule: readonly HoursScheduleItem[] | null | undefined,
  now?: Date
): boolean {
  return openingDays(schedule, now).length > 0;
}

export interface HoursIcsInput {
  parkName: string;
  parkSlug: string;
  /** Absolute URL of the park page, written into each event's `URL`. */
  parkUrl: string;
  schedule: readonly HoursScheduleItem[];
  /** The event title, already in the visitor's language. */
  summary: string;
  /** Written into `DESCRIPTION` of an estimated day only. */
  estimatedNote: string;
  now?: Date;
}

/** `2026-10-06T07:00:00.000Z` → `20261006T070000Z`. */
function icsUtc(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/** RFC 5545 §3.1: lines are folded at 75 octets, never inside a UTF-8 sequence. */
function fold(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char);
    // Continuation lines start with a space, which counts toward the 75.
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  out.push(current);
  return out.map((part, i) => (i === 0 ? part : ` ${part}`));
}

/**
 * The park's coming opening days as an iCalendar file: one event per day, in UTC (`…Z`), so the
 * file needs no `VTIMEZONE` and every calendar app shows the times in the visitor's own zone.
 * `UID` is stable per park and date, so importing the file again replaces the events instead of
 * doubling them.
 */
export function buildParkHoursIcs(input: HoursIcsInput): string {
  const now = input.now ?? new Date();
  const stamp = icsUtc(now.toISOString());
  const summary = escapeText(input.summary);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//park.fan//Opening hours//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(input.parkName)}`,
  ];
  for (const day of openingDays(input.schedule, now)) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${input.parkSlug}-${day.date}@park.fan`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsUtc(day.openingTime as string)}`,
      `DTEND:${icsUtc(day.closingTime as string)}`,
      `SUMMARY:${summary}`,
      `URL:${input.parkUrl}`,
      'TRANSP:TRANSPARENT'
    );
    if (day.isEstimated) lines.push(`DESCRIPTION:${escapeText(input.estimatedNote)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.flatMap(fold).join('\r\n') + '\r\n';
}
