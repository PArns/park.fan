import { getAttractionDisplayStatus, getStandbyWait } from './park-utils';
import { hasReadableWaitTimes } from './live-wait-times';
import { isInSeason } from './season';
import type { ParkAttraction, ParkWithAttractions } from '@/lib/api/types';

/**
 * One machine-readable wait-time reading. schema.org types `Observation` as a
 * measurement of a variable about some entity at some time, which is exactly
 * what a standby queue reading is — and unlike the surrounding `AmusementPark` node
 * it carries the one thing an answer engine needs and prose cannot give it: the
 * value, its unit, and the moment it was taken, per ride.
 *
 * `observationAbout` is a **reference**, not a copy: the ride is already
 * declared under the park's `containsPlace` with its own `@id`, so pointing at
 * that id keeps the page one graph instead of two disagreeing descriptions of
 * the same ride. (The obvious alternative — repeating `{name}` inline, as the
 * competitor's markup does — leaves a crawler to match rides by string and
 * throws away the ride's URL, which is the part that makes it an entity.)
 *
 * It carries the ride's `@type` all the same, because that `containsPlace` sits
 * in the park node's own `<script>` and these observations ship in the next one:
 * a consumer that reads one block at a time is handed an object it cannot type,
 * which is the shape Search Console rejected on the calendar's `Dataset`. The
 * type is the one thing about a node that cannot drift, so stating it twice
 * costs nothing; the ride's name and URL still live in exactly one place.
 */
export interface WaitTimeObservation {
  '@type': 'Observation';
  observationAbout: { '@type': 'TouristAttraction'; '@id': string };
  variableMeasured: string;
  value: number;
  unitCode: 'MIN';
  unitText: string;
  observationDate?: string;
}

/** `lastUpdated` of the STANDBY queue — per-ride provenance for the reading. */
function getStandbyTimestamp(attraction: ParkAttraction): string | undefined {
  const standby = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  return standby?.lastUpdated || undefined;
}

/**
 * `Observation` nodes for a park's current standby waits.
 *
 * The selection deliberately mirrors {@link AttractionWaitOverview} — the no-JS
 * view a crawler's first wave reads — rule for rule, because structured data
 * that contradicts the visible page is worse than no structured data at all:
 *
 * 1. **Nothing at all for a park whose waits we cannot read.** Hansa-Park
 *    publishes wait times only inside its own app, and a park with no source is
 *    indistinguishable in the payload from a park shut for the night. Left to
 *    the generic path it would emit a full set of `value: 0` readings — a
 *    measurement we never made, asserted in machine-readable form. See
 *    `hasReadableWaitTimes`.
 * 2. **Out-of-season rides are skipped**, matching the overview's `isInSeason`
 *    filter. `containsPlace` still lists them, and should: it says what the park
 *    contains, which stays true in every month. An observation says what was
 *    measured today, and nobody measures the queue for an ice rink in August.
 * 3. **Only `OPERATING` rides**, via the same `getAttractionDisplayStatus` the
 *    overview uses. A closed ride has no queue to stand in, so `value: 0` would
 *    not be a short wait — it would be a wait that does not exist. The
 *    competitor emits exactly that (`value: 0` alongside `Status: closed`), and
 *    it is how a quiet park comes to look like a park with no queues.
 *
 * A ride that is operating but carries no numeric standby reading drops out
 * too: absent is not zero.
 */
export function buildWaitTimeObservations(
  park: ParkWithAttractions,
  parkUrl: string
): WaitTimeObservation[] | undefined {
  if (!hasReadableWaitTimes(park)) return undefined;

  const observations: WaitTimeObservation[] = [];

  for (const attraction of park.attractions ?? []) {
    if (!isInSeason(attraction)) continue;
    if (getAttractionDisplayStatus(attraction, park.status) !== 'OPERATING') continue;

    const waitTime = getStandbyWait(attraction);
    if (waitTime == null) continue;

    observations.push({
      '@type': 'Observation',
      observationAbout: {
        '@type': 'TouristAttraction',
        '@id': `${parkUrl}/${attraction.slug}`,
      },
      variableMeasured: 'Standby wait time',
      value: waitTime,
      unitCode: 'MIN',
      unitText: 'minutes',
      observationDate: getStandbyTimestamp(attraction),
    });
  }

  return observations.length ? observations : undefined;
}
