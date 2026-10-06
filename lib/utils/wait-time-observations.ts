import { getAttractionDisplayStatus, getStandbyWait } from './park-utils';
import { hasReadableWaitTimes } from './live-wait-times';
import { isInSeason } from './season';
import type { ParkAttraction, ParkWithAttractions } from '@/lib/api/types';

/**
 * One machine-readable wait-time reading as a schema.org `Observation`: the value, its unit and
 * when it was taken, per ride. `observationAbout` references the ride's `@id` from the park's
 * `containsPlace` instead of copying it, so the page stays one graph; its `@type` is repeated
 * because the observations ship in a separate `<script>`, and an untyped node is rejected.
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
 * `Observation` nodes for a park's current standby waits, mirroring the attraction cards' rules,
 * because structured data that contradicts the page is worse than none. Nothing for a park whose
 * waits we cannot read (it would assert `value: 0` readings never made, see
 * `hasReadableWaitTimes`); no out-of-season rides; only `OPERATING` rides, since a closed ride's 0
 * is a wait that does not exist; and no ride without a numeric reading.
 * See docs/rules/parks-we-cannot-read.md.
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
