import { toSlug } from '../../_lib/media-upload';

/**
 * What a photograph taken in the field is called, and what it is tagged with.
 *
 * Both answers are made on the phone, both are conservative on purpose, and the
 * reason is the same: a wrong value here looks reviewed. An `alt` field left empty
 * is visibly unfinished and the `review` flag says so; a tag saying `night` on a
 * midday photo is a small lie nobody will ever go looking for.
 */

/**
 * A free file name for a ride's next photograph.
 *
 * The first one is simply the ride's slug, which is what a hand-authored file
 * would have been called. Anything after that needs a suffix, and it has to be
 * checked against what is really in the collection: `commit` writes by path
 * without asking, so a second `troy.jpg` silently replaces the first.
 *
 * `taken` holds the names already in `public/media/<park>/` plus everything this
 * session has committed or queued — a queue drained an hour later must not collide
 * with a photo taken since.
 */
export function freeName(rideSlug: string | null, taken: ReadonlySet<string>): string {
  const base = rideSlug ? toSlug(rideSlug) : 'park';
  if (!taken.has(base)) return base;
  for (let n = 2; n < 200; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  // 200 photographs of one ride in one collection is not a case worth a branch,
  // but silently overwriting the two hundredth would be.
  return `${base}-${Date.now()}`;
}

/**
 * The tags a phone may set without guessing.
 *
 * `photo` and `ride` are facts about what is being uploaded. The time of day is
 * read off the park's own clock, and only in the two windows where it cannot be
 * wrong — nine to five is daylight in every month this catalogue covers, ten at
 * night is not. Everything between them is `dusk`, `dawn` or `blue-hour`, which
 * are judgements about the light rather than the hour, and they belong to the
 * review pass along with the weather and the subject.
 */
export function fieldTags(parkTimezone: string | null, when: Date = new Date()): string[] {
  const tags = ['photo', 'ride'];
  const hour = parkHour(parkTimezone, when);
  if (hour === null) return tags;
  if (hour >= 9 && hour < 17) tags.push('day');
  else if (hour >= 22 || hour < 5) tags.push('night');
  return tags;
}

/** The hour of the day where the park is, or null when the zone is unusable. */
function parkHour(timezone: string | null, when: Date): number | null {
  if (!timezone) return null;
  try {
    const formatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      hour12: false,
    }).format(when);
    const hour = Number(formatted);
    return Number.isFinite(hour) ? hour : null;
  } catch {
    // An unknown zone must not cost the upload its tags, let alone throw on a
    // phone halfway through a commit.
    return null;
  }
}

/** `2026-08-29` in the park's own day, for `shotAt` when EXIF carries nothing. */
export function parkDate(timezone: string | null, when: Date = new Date()): string | null {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone ?? undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(when);
  } catch {
    return null;
  }
}
