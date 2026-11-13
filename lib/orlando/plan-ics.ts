import { getDateTimeFormat } from '@/lib/utils/intl-format';

/**
 * The trip as an iCalendar file (RFC 5545), built in the browser: one event per park day, timed in
 * the park's own zone where the hours are published and all-day where they are not. Pure; the
 * caller passes every sentence already translated, so the file speaks the page's language.
 */

/** One park day as the calendar file holds it. */
export interface TripIcsEvent {
  /** Region-local `YYYY-MM-DD`. */
  date: string;
  /** Stable across downloads, so a calendar app updates an event instead of doubling it. */
  uid: string;
  summary: string;
  /** Lines of the description, joined with line breaks. */
  description: string[];
  /** Park-local ISO with offset; both present or the event is all-day. */
  start?: string;
  end?: string;
  url?: string;
}

/**
 * The zone every Orlando event is written in, with its rules since 2007 (second Sunday of March to
 * first Sunday of November), so a calendar app that ships no zone database still places the hours.
 */
const NEW_YORK_VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:America/New_York',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:-0500',
  'TZOFFSETTO:-0400',
  'TZNAME:EDT',
  'DTSTART:19700308T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:-0400',
  'TZOFFSETTO:-0500',
  'TZNAME:EST',
  'DTSTART:19701101T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

/** The zone the file names; the planner only builds Orlando trips. */
export const TRIP_ICS_TZID = 'America/New_York';

/** Text as a property value: backslash, semicolon, comma and line breaks escaped. */
export function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * A content line folded at 75 octets, continuation lines opening with a space. Folded by bytes,
 * never inside a multi-byte character, because the limit is in octets and a park name may carry an
 * accent.
 */
export function icsFold(line: string): string {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(current);
      current = char;
      bytes = size;
    } else {
      current += char;
      bytes += size;
    }
  }
  out.push(current);
  return out.join('\r\n ');
}

/** `YYYYMMDDTHHMMSS` of an instant on the wall clock of `timeZone`. */
export function icsLocalDateTime(iso: string, timeZone: string = TRIP_ICS_TZID): string {
  const parts = getDateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}${get('month')}${get('day')}T${get('hour')}${get('minute')}${get('second')}`;
}

/** `YYYYMMDDTHHMMSSZ` of an instant, for `DTSTAMP`. */
function icsUtc(at: number): string {
  return new Date(at)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

const compactDate = (date: string) => date.replace(/-/g, '');

/** The day after a `YYYY-MM-DD`, compact: an all-day event ends on the next day, exclusive. */
function nextDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return compactDate(d.toISOString().slice(0, 10));
}

/**
 * The calendar file for a trip. `now` stamps every event (`DTSTAMP`); it is a parameter so the
 * file is a function of its input. CRLF line ends, as the format requires.
 */
export function buildTripIcs(
  events: readonly TripIcsEvent[],
  { now, calendarName }: { now: number; calendarName: string }
): string {
  const timed = events.some((e) => e.start && e.end);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//park.fan//Trip planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(calendarName)}`,
    `X-WR-TIMEZONE:${TRIP_ICS_TZID}`,
    ...(timed ? NEW_YORK_VTIMEZONE : []),
  ];
  for (const event of events) {
    lines.push('BEGIN:VEVENT', `UID:${event.uid}`, `DTSTAMP:${icsUtc(now)}`);
    if (event.start && event.end) {
      lines.push(
        `DTSTART;TZID=${TRIP_ICS_TZID}:${icsLocalDateTime(event.start)}`,
        `DTEND;TZID=${TRIP_ICS_TZID}:${icsLocalDateTime(event.end)}`
      );
    } else {
      lines.push(
        `DTSTART;VALUE=DATE:${compactDate(event.date)}`,
        `DTEND;VALUE=DATE:${nextDay(event.date)}`
      );
    }
    lines.push(`SUMMARY:${icsEscape(event.summary)}`);
    if (event.description.length > 0) {
      lines.push(`DESCRIPTION:${icsEscape(event.description.join('\n'))}`);
    }
    if (event.url) lines.push(`URL:${event.url}`);
    lines.push('TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(icsFold).join('\r\n')}\r\n`;
}
