import { addDays, parkMinuteNow, parkToday } from '@/lib/planner/park-time';
import type { ParkyAct } from './acts';

/** One day's opening hours as the park page's structured data gives them, in park time. */
export interface OpeningDay {
  /** `YYYY-MM-DD`, the park's calendar. */
  date: string;
  /** `HH:mm`, park time. */
  opens: string;
  /** `HH:mm`, park time; at or before `opens` it is past midnight. */
  closes: string;
}

/** Where the park's clock stands: the hour before opening, or the last half hour before closing. */
export type ClockMoment = 'ropeDrop' | 'closing';

/**
 * What Parky says on the park's clock (`assistant` namespace, with `{park}`), each with its act:
 * a stretch or a hop before rope drop, the fireworks before closing.
 */
export const CLOCK_LINES: Record<ClockMoment, readonly { key: string; act: ParkyAct }[]> = {
  ropeDrop: [
    { key: 'clockRopeDrop1', act: 'stretch' },
    { key: 'clockRopeDrop2', act: 'hop' },
    { key: 'clockRopeDrop3', act: 'hop' },
  ],
  closing: ['clockClosing1', 'clockClosing2', 'clockClosing3'].map((key) => ({
    key,
    act: 'fireworks' as const,
  })),
};

/**
 * The general park lines about opening and closing time (`PARK_LINES`): while the clock has its
 * own line for this park, they stay out of the draw.
 */
export const CLOCK_PARK_KEYS = /^park(RopeDrop|Closing)\d$/;

/** Minutes before opening that count as rope drop, and before closing as the fireworks. */
export const CLOCK_WINDOWS_MIN = { ropeDrop: 60, closing: 30 } as const;

const DAY_MIN = 24 * 60;

function minutesOf(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

/**
 * The opening days in the page's `openingHoursSpecification` (`opens`, `closes`, `validFrom`), each
 * a day the park opens; anything else in it is skipped.
 */
export function openingDaysOf(park: Record<string, unknown> | null): OpeningDay[] {
  const specs = park?.openingHoursSpecification;
  if (!Array.isArray(specs)) return [];
  return specs.flatMap((spec: Record<string, unknown>) => {
    const { opens, closes, validFrom } = spec ?? {};
    const time = /^\d{2}:\d{2}$/;
    return typeof opens === 'string' &&
      typeof closes === 'string' &&
      typeof validFrom === 'string' &&
      time.test(opens) &&
      time.test(closes)
      ? [{ date: validFrom, opens, closes }]
      : [];
  });
}

/** Whether the park opens today at all, by its own calendar. */
export function opensToday(hours: readonly OpeningDay[], timeZone: string, now: number): boolean {
  const today = parkToday(timeZone, now);
  return hours.some((day) => day.date === today);
}

/**
 * Where the park's clock stands at `now`, in the park's own zone: within the hour before today's
 * opening, rope drop; within the half hour before closing, the fireworks, also for a day that
 * closes after midnight; else `null`. `preview` (`?parky=clock`) drops the windows: before
 * opening is rope drop, any time after it the fireworks.
 */
export function clockMoment(
  hours: readonly OpeningDay[],
  timeZone: string,
  now: number,
  preview = false
): ClockMoment | null {
  const today = parkToday(timeZone, now);
  const minute = parkMinuteNow(timeZone, now);
  // Yesterday's day may still be running past midnight: its minutes are counted on from 24:00.
  for (const [date, offset] of [
    [today, 0],
    [addDays(today, -1), DAY_MIN],
  ] as const) {
    const day = hours.find((entry) => entry.date === date);
    if (!day) continue;
    const opens = minutesOf(day.opens);
    const closesAt = minutesOf(day.closes);
    const closes = closesAt <= opens ? closesAt + DAY_MIN : closesAt;
    const at = minute + offset;
    if (at >= closes) continue;
    if (at < opens) {
      if (offset === 0 && (preview || opens - at <= CLOCK_WINDOWS_MIN.ropeDrop)) return 'ropeDrop';
      continue;
    }
    if (preview || closes - at <= CLOCK_WINDOWS_MIN.closing) return 'closing';
  }
  return preview && hours.some((day) => day.date === today) ? 'closing' : null;
}
