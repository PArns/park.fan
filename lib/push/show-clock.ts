import { formatTime } from '@/lib/utils/intl-format';

/**
 * A followed performance as a clock time, in the PARK's zone.
 *
 * The zone is the point: a show at 19:10 is 19:10 where it is performed, and a reader planning
 * around it is standing there. `formatTime` is the same helper the `LocalTime` component calls,
 * so this reads identically to every other time on the site — it exists as a bare function
 * because both call sites wrap the result in a sentence (`um {time} Uhr`) and need a string.
 *
 * `null` for anything unparseable, which the callers render as an em dash rather than a crash.
 */
export function formatShowClock(
  iso: string,
  timezone: string | null,
  locale: string
): string | null {
  try {
    return formatTime(new Date(iso), locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone ?? undefined,
    });
  } catch {
    return null;
  }
}
