import { createHash } from 'node:crypto';
import type { ParkAttraction, ParkWithAttractions } from '@/lib/api/types';
import type { ContentChangeEntry, ContentChangeSnapshot, FingerprintMap } from './types';

/**
 * What a `<lastmod>` on a park or ride URL is allowed to claim. The API carries no per-entity
 * content timestamp (its `updatedAt` moves on every row each morning, because a nightly sync
 * rewrites unchanged values), so the date is observed: hash the part of a page that does not
 * move, and the day the hash first differs is the day the page changed. This file computes the
 * hash, `store.ts` remembers it.
 *
 * What stays out of the hash is the point. Every live reading (`queues`, `status`,
 * `effectiveStatus`, `crowdLevel`, `trend`, `statistics`, `history`, `typicalWaits`,
 * `bestVisitTimes`, `ropeDrop`, `isHeadliner`, `isCurrentlyInSeason`, `weather`, `schedule`,
 * `analytics`, `currentLoad`) would change every URL every day, a build stamp with extra steps.
 * Localized media captions stay out too; swapping a photo moves `mediaVersions`. See
 * docs/rules/a-lastmod-is-observed-never-stamped.md.
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
 * while a corrected height limit on one ride does not, and would otherwise drag
 * most parks in the catalog into "changed" on most days.
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
   * A park the API failed to answer for has to be kept: dropping it re-adds
   * every one of its rides tomorrow, and a re-add reads as "changed", so one
   * timeout would become a park's worth of false recrawl invitations.
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

/**
 * Yesterday's schedule coverage plus whatever today's crawl saw, the sibling of
 * {@link diffSnapshot} for a value that is carried rather than compared. A park that did not
 * answer keeps what it had, or one API wobble would shorten its calendar tomorrow; a park that
 * answered `null` overwrites, because that is an answer.
 */
export function mergeScheduleCoverage(
  previous: ContentChangeSnapshot | null,
  crawled: ReadonlyMap<string, string | null>
): Record<string, string | null> {
  const merged: Record<string, string | null> = { ...previous?.scheduleCoverage };
  for (const [parkPath, to] of crawled) {
    merged[parkPath] = to;
  }
  return merged;
}
