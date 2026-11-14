import { getDateTimeFormat } from '@/lib/utils/intl-format';

/** The park-local `HH` and `mm` of an ISO time. */
function localHourMinute(iso: string, timezone: string): [number, number] {
  const date = new Date(iso);
  const h = getDateTimeFormat('en', { hour: 'numeric', hour12: false, timeZone: timezone }).format(
    date
  );
  const m = getDateTimeFormat('en', { minute: 'numeric', timeZone: timezone }).format(date);
  return [parseInt(h, 10) % 24, parseInt(m, 10)];
}

const slot = (h: number, m: number) =>
  `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

/**
 * The first and last 15-minute `HH:mm` slot of a day's chart from its opening and closing time.
 *
 * Opening rounds down and closing up to the quarter hour. A park closing at or after midnight
 * (16:00–00:00, 18:00–01:00, a 24-hour day) gets `23:45` as its last slot: a later slot belongs
 * to the next park-local day, and a bound of `00:00` would drop every slot after opening.
 */
export function dailyChartWindow(
  openingTime: string | null | undefined,
  closingTime: string | null | undefined,
  timezone: string,
  fallback: { start: string; end: string } = { start: '09:00', end: '19:00' }
): { start: string; end: string } {
  let start = fallback.start;
  let end = fallback.end;
  if (openingTime) {
    const [h, m] = localHourMinute(openingTime, timezone);
    start = slot(h, Math.floor(m / 15) * 15);
  }
  if (closingTime) {
    const [h, m] = localHourMinute(closingTime, timezone);
    const roundedM = Math.ceil(m / 15) * 15;
    end = roundedM === 60 ? slot((h + 1) % 24, 0) : slot(h, roundedM);
  }
  if (openingTime && closingTime && end <= start) end = '23:45';
  return { start, end };
}
