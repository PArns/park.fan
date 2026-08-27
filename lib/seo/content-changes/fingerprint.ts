import { createHash } from 'node:crypto';
import type { ParkAttraction, ParkWithAttractions } from '@/lib/api/types';
import type { ContentChangeEntry, ContentChangeSnapshot, FingerprintMap } from './types';

/**
 * What a `<lastmod>` on a park or ride URL is allowed to claim.
 *
 * The API carries no per-entity content timestamp — `/v1/sitemap/attractions`
 * answers `{url, slug}`, and the park payload dates only its live readings
 * (`analytics.occupancy.updatedAt`, `typicalWaits.dataTo`). So the date has to be
 * *observed*: hash the part of a page that does not move, remember the hash, and
 * the day it first differs is the day the page changed. This file computes the
 * hash, `store.ts` remembers it.
 *
 * The value of the exercise is in what stays OUT of the hash. A park page
 * repaints every five minutes and an attraction page with it; feed those readings
 * in and all 44,000 URLs change every day, which is a build stamp with extra
 * steps. Google uses `lastmod` where it is "consistently and verifiably
 * accurate", and a date that is identical on every URL carries nothing to be
 * accurate about. So the fingerprint sees the editorial layer only: what the ride
 * is called, where it stands, how tall you have to be, which glossary elements
 * its layout hits, which photos and articles the page carries. Across the whole
 * catalog that moves a couple of hundred times a year, which is the set worth
 * pointing a crawler at.
 *
 * Excluded deliberately, and every one of them would otherwise change daily:
 * `queues`, `status`, `effectiveStatus`, `crowdLevel`, `trend`, `statistics`,
 * `history`, `typicalWaits`, `bestVisitTimes`, `ropeDrop`, `isHeadliner` (ranked
 * off live stats), `isCurrentlyInSeason` (a statement about today, unlike
 * `seasonMonths`, which describes the season), `weather`, `schedule`,
 * `analytics`, `currentLoad`.
 *
 * One exclusion is worth knowing about because it is not obvious: the localized
 * `alt`/`caption` text in the media sidecars. Swapping a photo moves
 * `mediaVersions`; rewording the caption under the same photo moves nothing, and
 * reaches Google on the crawler's own schedule.
 *
 * **Why the backend cannot just hand us the date, which is the first thing anyone
 * asks.** The `attractions` and `parks` tables do carry a TypeORM
 * `@UpdateDateColumn`, and exposing it would delete this whole file. It would also
 * be wrong: the children-metadata sync runs daily at 04:00 UTC and calls
 * `attractionRepository.update(id, {name, latitude, longitude})` for every matched
 * ride **unconditionally**. `Repository.update()` issues a raw UPDATE with no
 * diff, so `updatedAt` moves on all ~7,100 rows every morning even though the
 * values written are the ones already there. That is the identical-date-everywhere
 * pathology this file exists to avoid, arriving as a field that looks
 * authoritative. A content-scoped column on the API would be the better source,
 * but it would still miss half the question — the media versions and blog
 * backlinks below are frontend content the backend has never heard of.
 *
 * The cost is not the reason either. One pass is ~14 MB across 212 parks and the
 * fields read here are 24 % of it, so a lean backend projection would save ~10 MB
 * *per day*, against a prewarm cron in this same repo that renders 1,272 pages
 * every six hours. Measured crawl time for the whole catalog: 1.4 s warm, 5.4 s
 * cold.
 */

/**
 * Bump when the fingerprint inputs change. The stored hashes then stop being
 * comparable, and `diffSnapshot` answers by keeping every `changedAt` it already
 * holds instead of announcing that the whole catalog changed — an edit to this
 * file is a change to the detector, not to the parks.
 */
export const FINGERPRINT_VERSION = 1;

/** 16 hex chars: 64 bits over ~50,000 entries, which will not collide. */
function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}

/**
 * `undefined` and `null` are the same thing to a fingerprint. The API strips
 * null-valued keys from its responses, so `{model: null}` and an absent `model`
 * are one ride arriving two ways, and `JSON.stringify` would call them two.
 */
function nn<T>(value: T | null | undefined): T | null {
  return value ?? null;
}

export interface EntityContext {
  /** `<media id>@<version>` for every image that answers for this page. */
  mediaVersions: string[];
  /** `translationKey` of every blog post this page links. */
  postKeys: string[];
}

const EMPTY_CONTEXT: EntityContext = { mediaVersions: [], postKeys: [] };

function contextParts({ mediaVersions, postKeys }: EntityContext) {
  return { media: [...mediaVersions].sort(), posts: [...postKeys].sort() };
}

/**
 * A ride's fingerprint. `rideProfile` is spelled out field by field for the
 * null-stripping reason above — and because `stats.source`/`sourceId` are
 * provenance the page never renders, so a re-merge that picks the same numbers
 * out of Wikidata instead of the curated table is not a content change.
 */
export function fingerprintAttraction(
  attraction: ParkAttraction,
  context: EntityContext = EMPTY_CONTEXT
): string {
  const profile = attraction.rideProfile;
  const stats = profile?.stats;
  return hash({
    slug: attraction.slug,
    name: attraction.name,
    land: nn(attraction.land),
    lat: nn(attraction.latitude),
    lng: nn(attraction.longitude),
    minHeight: nn(attraction.minimumHeight),
    maxHeight: nn(attraction.maximumHeight),
    mayGetWet: nn(attraction.mayGetWet),
    rcdbId: nn(attraction.rcdbId),
    isSeasonal: nn(attraction.isSeasonal),
    seasonMonths: nn(attraction.seasonMonths),
    profile: profile
      ? {
          elements: profile.elements,
          types: profile.types,
          manufacturer: nn(profile.manufacturer),
          manufacturerTermId: nn(profile.manufacturerTermId),
          model: nn(profile.model),
          openedYear: nn(profile.openedYear),
          inversions: nn(profile.inversions),
          stats: stats
            ? {
                topSpeedKmh: nn(stats.topSpeedKmh),
                heightM: nn(stats.heightM),
                lengthM: nn(stats.lengthM),
                durationSeconds: nn(stats.durationSeconds),
                attribution: stats.attribution
                  ? `${stats.attribution.label} ${stats.attribution.url}`
                  : null,
              }
            : null,
        }
      : null,
    ...contextParts(context),
  });
}

/**
 * A park's fingerprint. It carries the ride ROSTER — slug, name, land — but not
 * the rides' own fingerprints: the park page lists its attractions, so a ride
 * appearing, being renamed or moving to another land changes the park page too,
 * while a corrected height limit on one of 82 rides does not, and would otherwise
 * drag most parks in the catalog into "changed" on most days.
 */
export function fingerprintPark(
  park: ParkWithAttractions,
  context: EntityContext = EMPTY_CONTEXT
): string {
  const info = park.info;
  return hash({
    slug: park.slug,
    name: park.name,
    country: nn(park.country),
    city: nn(park.city),
    region: nn(park.region),
    continent: nn(park.continent),
    timezone: nn(park.timezone),
    lat: nn(park.latitude),
    lng: nn(park.longitude),
    hasOperatingSchedule: nn(park.hasOperatingSchedule),
    info: info
      ? {
          website: nn(info.website),
          ticketsUrl: nn(info.ticketsUrl),
          wikipediaUrl: nn(info.wikipediaUrl),
          instagramUrl: nn(info.instagramUrl),
          facebookUrl: nn(info.facebookUrl),
          youtubeUrl: nn(info.youtubeUrl),
          streetAddress: nn(info.streetAddress),
          postalCode: nn(info.postalCode),
          phone: nn(info.phone),
          openedYear: nn(info.openedYear),
          areaHectares: nn(info.areaHectares),
        }
      : null,
    // Not a live reading: the curated "we have no source for this park" flag.
    // The day it flips, the page changes shape completely — see
    // docs/api/parks-without-wait-times.md.
    liveWaitTimes: park.liveWaitTimes
      ? { available: park.liveWaitTimes.available, reason: nn(park.liveWaitTimes.reason) }
      : null,
    attractions: (park.attractions ?? []).map((a) => `${a.slug} ${a.name} ${a.land ?? ''}`).sort(),
    shows: (park.shows ?? []).map((s) => `${s.slug} ${s.name}`).sort(),
    restaurants: (park.restaurants ?? [])
      .map((r) => `${r.slug} ${r.name} ${r.cuisineType ?? ''}`)
      .sort(),
    ...contextParts(context),
  });
}

/**
 * A geo hub's fingerprint: the parks it lists, and nothing else. Everything else
 * a country page shows — open/closed, average wait, crowd level — is a live
 * reading.
 */
export function fingerprintGeoHub(parks: { slug: string; name: string }[]): string {
  return hash({ parks: parks.map((p) => `${p.slug} ${p.name}`).sort() });
}

export interface DiffResult {
  snapshot: ContentChangeSnapshot;
  added: string[];
  changed: string[];
  removed: string[];
  /** Entries carried over from the previous snapshot because this run did not cover them. */
  carried: number;
}

export interface DiffOptions {
  /** `YYYY-MM-DD` stamped on everything this run found new or different. */
  today: string;
  /**
   * A previous key this run did not produce: `true` keeps it, `false` drops it.
   * A park the API failed to answer for has to be KEPT — dropping it re-adds
   * every one of its rides tomorrow, and a re-add reads as "changed", which is
   * how one five-second timeout would turn into 82 false recrawl invitations.
   * Defaults to dropping, i.e. a key missing from a run that did cover it is
   * genuinely gone.
   */
  retainUncovered?: (path: string) => boolean;
}

/**
 * Fold one crawl into the stored snapshot.
 *
 * `changedAt` only ever moves forward, and only for a key whose fingerprint
 * actually differs. A key seen for the first time is stamped with today — right
 * for a ride that just opened, and merely harmless on the very first run, where
 * every URL gets the same date and the sitemap says nothing it did not already
 * say.
 */
export function diffSnapshot(
  previous: ContentChangeSnapshot | null,
  current: FingerprintMap,
  { today, retainUncovered = () => false }: DiffOptions
): DiffResult {
  const incomparable = previous != null && previous.version !== FINGERPRINT_VERSION;
  const before = previous?.entries ?? {};
  const entries: Record<string, ContentChangeEntry> = {};
  const added: string[] = [];
  const changed: string[] = [];
  const removed: string[] = [];
  let carried = 0;

  for (const [path, fingerprint] of current) {
    const prior = before[path];
    if (!prior) {
      entries[path] = { hash: fingerprint, changedAt: today };
      added.push(path);
    } else if (incomparable) {
      // Adopt the new hash, keep the date we already believe.
      entries[path] = { hash: fingerprint, changedAt: prior.changedAt };
    } else if (prior.hash === fingerprint) {
      entries[path] = prior;
    } else {
      entries[path] = { hash: fingerprint, changedAt: today };
      changed.push(path);
    }
  }

  for (const [path, entry] of Object.entries(before)) {
    if (current.has(path)) continue;
    if (retainUncovered(path)) {
      entries[path] = entry;
      carried++;
    } else {
      removed.push(path);
    }
  }

  return {
    snapshot: { version: FINGERPRINT_VERSION, generatedAt: new Date().toISOString(), entries },
    added,
    changed,
    removed,
    carried,
  };
}
