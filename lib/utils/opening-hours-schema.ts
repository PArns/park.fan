import { formatInTimeZone } from 'date-fns-tz';
import type { ScheduleItem } from '@/lib/api/types';

/**
 * `OpeningHoursSpecification` entries for a park's `ThemePark` JSON-LD.
 *
 * schema.org types `opens` and `closes` as `Time` — a local clock reading like
 * `"09:00"`. The API sends `openingTime`/`closingTime` as UTC instants
 * (`2026-08-21T07:00:00.000Z`), and passing those straight through published
 * the UTC hour as if it were the park's own: Europa-Park advertised 07:00–16:00
 * while its opening hours are 09:00–18:00, and Tokyo Disneyland read as
 * "midnight to noon" against a real 09:00–21:00. Parks west of UTC were worse —
 * Disney California Adventure emitted `closes: 2026-08-22T05:00:00.000Z`, a
 * date one day past the `validThrough` on the same entry.
 *
 * The park's own FAQ (`lib/faq/park-faq.ts`) has always rendered these correctly
 * by converting through `park.timezone` first; this is the same conversion for
 * the machine-readable copy.
 */
export interface OpeningHoursSpecification {
  '@type': 'OpeningHoursSpecification';
  opens: string;
  closes: string;
  validFrom: string;
  validThrough: string;
}

/**
 * A park past local midnight (a Six Flags closing at 01:00) yields `closes`
 * earlier than `opens`. That is schema.org's own convention for an overnight
 * span, so the pair stays on the single `validFrom`/`validThrough` date the
 * operating day belongs to rather than being split across two entries.
 */
export function buildOpeningHoursSpecification(
  schedule: ScheduleItem[] | null | undefined,
  timeZone: string | null | undefined
): OpeningHoursSpecification[] | undefined {
  if (!schedule?.length) return undefined;

  const zone = timeZone || 'UTC';
  const specs: OpeningHoursSpecification[] = [];

  for (const entry of schedule) {
    // A day is included when it states hours, not when it carries a particular
    // `scheduleType`. Across all 212 parks every CLOSED and UNKNOWN row has null
    // times and drops out here anyway, while `INFO` — which the API sends and
    // `ScheduleType` does not yet list — carries real ones: Warner Bros. Movie
    // World publishes all 17 of its days that way, and an OPERATING-only filter
    // silently emptied that park's opening hours.
    // Days without hours used to emit a spec with `opens`/`closes` undefined:
    // a date range asserting nothing, 1160 of them across the catalogue.
    if (!entry.openingTime || !entry.closingTime || !entry.date) continue;

    const opens = toLocalClockTime(entry.openingTime, zone);
    const closes = toLocalClockTime(entry.closingTime, zone);
    if (!opens || !closes) continue;

    specs.push({
      '@type': 'OpeningHoursSpecification',
      opens,
      closes,
      validFrom: entry.date,
      validThrough: entry.date,
    });
  }

  return specs.length ? specs : undefined;
}

/**
 * `null` for anything `Date` cannot parse — a malformed timestamp should drop
 * one day out of the markup, not throw the whole park page's render.
 */
function toLocalClockTime(instant: string, timeZone: string): string | null {
  const parsed = new Date(instant);
  if (Number.isNaN(parsed.getTime())) return null;
  try {
    return formatInTimeZone(parsed, timeZone, 'HH:mm');
  } catch {
    return null;
  }
}
