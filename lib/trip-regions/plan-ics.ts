import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { addDays } from '@/lib/utils/park-day';

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
 * A US zone's VTIMEZONE with the rules since 2007 (second Sunday of March to first Sunday of
 * November), so a calendar app that ships no zone database still places the hours.
 */
function usZone(tzid: string, standard: number, names: [string, string]): string[] {
  const offset = (hours: number) =>
    `${hours < 0 ? '-' : '+'}${String(Math.abs(hours)).padStart(2, '0')}00`;
  return [
    'BEGIN:VTIMEZONE',
    `TZID:${tzid}`,
    'BEGIN:DAYLIGHT',
    `TZOFFSETFROM:${offset(standard)}`,
    `TZOFFSETTO:${offset(standard + 1)}`,
    `TZNAME:${names[1]}`,
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    `TZOFFSETFROM:${offset(standard + 1)}`,
    `TZOFFSETTO:${offset(standard)}`,
    `TZNAME:${names[0]}`,
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];
}

/**
 * The VTIMEZONE of each zone a trip region runs on, with its rules, so a calendar app that ships
 * no zone database still places the hours. A zone missing here writes its events with the TZID
 * alone, which every app with a zone database reads.
 */
const VTIMEZONES: Readonly<Record<string, readonly string[]>> = {
  'America/New_York': usZone('America/New_York', -5, ['EST', 'EDT']),
  'America/Los_Angeles': usZone('America/Los_Angeles', -8, ['PST', 'PDT']),
  // Central European time since 1996: last Sunday of March to last Sunday of October.
  'Europe/Paris': [
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Paris',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ],
  'Asia/Tokyo': [
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Tokyo',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0900',
    'TZOFFSETTO:+0900',
    'TZNAME:JST',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
  ],
};

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
export function icsLocalDateTime(iso: string, timeZone: string): string {
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

/**
 * The calendar file for a trip, timed in the region's zone. `now` stamps every event (`DTSTAMP`);
 * it is a parameter so the file is a function of its input. CRLF line ends, as the format
 * requires.
 */
export function buildTripIcs(
  events: readonly TripIcsEvent[],
  { now, calendarName, timeZone }: { now: number; calendarName: string; timeZone: string }
): string {
  const timed = events.some((e) => e.start && e.end);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//park.fan//Trip planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(calendarName)}`,
    `X-WR-TIMEZONE:${timeZone}`,
    ...(timed ? (VTIMEZONES[timeZone] ?? []) : []),
  ];
  for (const event of events) {
    lines.push('BEGIN:VEVENT', `UID:${event.uid}`, `DTSTAMP:${icsUtc(now)}`);
    if (event.start && event.end) {
      lines.push(
        `DTSTART;TZID=${timeZone}:${icsLocalDateTime(event.start, timeZone)}`,
        `DTEND;TZID=${timeZone}:${icsLocalDateTime(event.end, timeZone)}`
      );
    } else {
      lines.push(
        `DTSTART;VALUE=DATE:${compactDate(event.date)}`,
        // An all-day event ends on the next day, exclusive.
        `DTEND;VALUE=DATE:${compactDate(addDays(event.date, 1))}`
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
