import { formatInTimeZone } from 'date-fns-tz';
import type { ScheduleItem } from '@/lib/api/types';

/**
 * An `OpeningHoursSpecification` entry for a park's `AmusementPark` JSON-LD. schema.org's `opens`
 * and `closes` are local clock times, while the API sends UTC instants, so each is converted
 * through the park's timezone (as the park FAQ does); passing them through published the UTC hour
 * as the park's own.
 */
export interface OpeningHoursSpecification {
  '@type': 'OpeningHoursSpecification';
  opens: string;
  closes: string;
  validFrom: string;
  validThrough: string;
}

/**
 * The JSON-LD opening hours for a park's schedule. A park open past local midnight yields `closes`
 * earlier than `opens`, which is schema.org's convention for an overnight span, so the pair stays
 * on the operating day's single date.
 */
export function buildOpeningHoursSpecification(
  schedule: ScheduleItem[] | null | undefined,
  timeZone: string | null | undefined
): OpeningHoursSpecification[] | undefined {
  if (!schedule?.length) return undefined;

  const zone = timeZone || 'UTC';
  const specs: OpeningHoursSpecification[] = [];

  for (const entry of schedule) {
    // Included when it states hours, whatever its `scheduleType`: `INFO` rows (not yet in
    // `ScheduleType`) carry real hours for some parks; a day without hours would assert nothing.
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

/** `null` for an unparsable timestamp, so a bad row drops one day rather than the page's render. */
function toLocalClockTime(instant: string, timeZone: string): string | null {
  const parsed = new Date(instant);
  if (Number.isNaN(parsed.getTime())) return null;
  try {
    return formatInTimeZone(parsed, timeZone, 'HH:mm');
  } catch {
    return null;
  }
}
