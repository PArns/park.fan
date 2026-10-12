import { getDateTimeFormat, formatTime } from '@/lib/utils/intl-format';
import type { WeatherNowcastStep } from '@/lib/api/types';

/**
 * Gust speed (km/h) from which the weather card marks wind in the nowcast window. 50 km/h is
 * Beaufort 7 and about where the DWD starts its lowest gust warning. It is not a ride threshold:
 * parks publish none, and the storm banner has its own 75 km/h gate.
 */
export const NOTABLE_GUST_KMH = 50;

/**
 * Visibility (m) below which the weather card calls it fog and marks it in the nowcast window.
 * The same line the live conditions column already draws for „Nebel".
 */
export const LOW_VISIBILITY_M = 1000;

/** Format an instant (ms) as a naive park-local ISO ("YYYY-MM-DDTHH:MM"). */
function toLocalIso(ms: number, timezone: string): string {
  return getDateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(ms)
    .replace(' ', 'T');
}

/**
 * The steps whose slot has not fully passed. Step times are naive park-local strings, so the
 * cutoff is compared in the park timezone, against `observedAt` (stable across SSR) as "now".
 */
export function upcomingNowcastSteps(
  steps: WeatherNowcastStep[],
  observedAt: string,
  timezone: string
): WeatherNowcastStep[] {
  const slotMs =
    steps.length >= 2 ? Date.parse(steps[1].time) - Date.parse(steps[0].time) : 15 * 60_000;
  const cutoff = toLocalIso(Date.parse(observedAt) - slotMs, timezone);
  return steps.filter((s) => s.time.slice(0, 16) >= cutoff);
}

/** A step's naive park-local time as „HH:MM" in the reader's locale. */
export function formatStepTime(localIso: string, locale: string): string {
  return formatTime(new Date(`${localIso}Z`), locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/** What stands out in the upcoming steps: the strongest gust and the lowest visibility. */
export interface NowcastOutlook {
  steps: WeatherNowcastStep[];
  /** Strongest gust at or above {@link NOTABLE_GUST_KMH}, else `null`. */
  gust: { kmh: number; time: string } | null;
  /** Lowest visibility below {@link LOW_VISIBILITY_M}, else `null`. */
  visibility: { meters: number; time: string } | null;
}

/** Gust and visibility highlights of the upcoming steps; both `null` when the window is calm. */
export function nowcastOutlook(
  steps: WeatherNowcastStep[],
  observedAt: string,
  timezone: string
): NowcastOutlook {
  const upcoming = upcomingNowcastSteps(steps, observedAt, timezone);
  let gust: NowcastOutlook['gust'] = null;
  let visibility: NowcastOutlook['visibility'] = null;
  for (const s of upcoming) {
    if (s.windGusts != null && s.windGusts >= NOTABLE_GUST_KMH && s.windGusts > (gust?.kmh ?? 0)) {
      gust = { kmh: s.windGusts, time: s.time };
    }
    if (
      s.visibility != null &&
      s.visibility < LOW_VISIBILITY_M &&
      s.visibility < (visibility?.meters ?? Infinity)
    ) {
      visibility = { meters: s.visibility, time: s.time };
    }
  }
  return { steps: upcoming, gust, visibility };
}
