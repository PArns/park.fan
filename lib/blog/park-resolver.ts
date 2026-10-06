import 'server-only';
import { cache } from 'react';
import { getGeoStructure } from '@/lib/api/discovery';
import { getAttractionByGeoPath } from '@/lib/api/parks';
import { extractInlineRefs, parseRefKey } from './derive.mjs';
import type {
  AttractionResponse,
  AttractionStatus,
  CrowdLevel,
  GeoStructure,
  ParkStatus,
  ScheduleSummary,
} from '@/lib/api/types';

// Kept as re-exports so `@/lib/blog/park-resolver` stays the one import site for
// callers that resolve a post's references (BlogReferences, the renderers).
export { extractInlineRefs, parseRefKey };

export interface ResolvedPark {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  countrySlug: string;
  continent: string;
  continentSlug: string;
  timezone?: string;
  href: string;
  status?: ParkStatus;
  crowdLevel?: CrowdLevel;
  avgWaitTime?: number;
  operatingAttractions?: number;
  totalAttractions?: number;
  hasOperatingSchedule?: boolean;
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
}

export interface ResolvedAttraction {
  parkSlug: string;
  parkName: string;
  attractionSlug: string;
  attractionName: string;
  href: string;
  /**
   * Live attraction payload for the AttractionCard in the hover, trimmed to what the card reads
   * ({@link leanDetailForBlogRef}). The browser swaps in the full payload once a card is on screen
   * (`useLiveBlogRide` `withDetail`).
   */
  detail?: AttractionResponse | null;
  /** Current STANDBY wait in minutes (null when unknown). Computed server-side. */
  currentWaitTime?: number | null;
  /** Effective ride status — OPERATING / DOWN / CLOSED / REFURBISHMENT. */
  status?: AttractionStatus;
  /** Current crowd level for the ride, if the API exposes one. */
  crowdLevel?: CrowdLevel;
  /**
   * The ride closed for good (`retiredKind === 'closed'`), so its badge says that instead of the
   * live CLOSED a ride comes back from. A fact about the ride, so the live overlay keeps it.
   */
  closedPermanently?: boolean;
}

interface IndexedGeo {
  parksBySlug: Map<string, ResolvedPark>;
  /**
   * Keyed by the full `continent/country/city/parkSlug` path. Needed because a
   * bare park slug is **not unique** — e.g. `disneyland-park` exists in both
   * Paris and Anaheim. When a ref carries the full geo path we resolve through
   * this map so the correct park (and its rides) is returned.
   */
  parksByPath: Map<string, ResolvedPark>;
}

const buildIndex = cache(async (): Promise<IndexedGeo> => {
  let geo: GeoStructure | null = null;
  try {
    // No explicit window: park names, slugs and geo paths are what `CACHE_TTL.geo` describes, and
    // a TTL here would set the ISR clock of every blog post. See
    // docs/rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md.
    geo = await getGeoStructure();
  } catch {
    geo = null;
  }
  const parksBySlug = new Map<string, ResolvedPark>();
  const parksByPath = new Map<string, ResolvedPark>();
  if (!geo) return { parksBySlug, parksByPath };

  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          const resolved: ResolvedPark = {
            id: park.id,
            name: park.name,
            slug: park.slug,
            city: city.name,
            country: country.name,
            countrySlug: country.slug,
            continent: continent.name,
            continentSlug: continent.slug,
            timezone: park.timezone,
            href: `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
            status: park.status,
            crowdLevel: park.currentLoad?.crowdLevel ?? park.analytics?.statistics?.crowdLevel,
            avgWaitTime: park.analytics?.statistics?.avgWaitTime ?? undefined,
            operatingAttractions: park.analytics?.statistics?.operatingAttractions,
            totalAttractions: park.analytics?.statistics?.totalAttractions,
            // ParkCard reads these to show "Opens tomorrow 09:00" instead of a bare "Closed".
            hasOperatingSchedule: park.hasOperatingSchedule,
            todaySchedule: park.todaySchedule,
            nextSchedule: park.nextSchedule,
          };
          // Bare slug is last-write-wins on collisions; the path index keeps
          // every park addressable and is preferred whenever a geoPath is known.
          parksBySlug.set(park.slug, resolved);
          parksByPath.set(`${continent.slug}/${country.slug}/${city.slug}/${park.slug}`, resolved);
        }
      }
    }
  }
  return { parksBySlug, parksByPath };
});

/**
 * Resolve a park by slug. Pass `geoPath` (`continent/country/city`) to
 * disambiguate slugs shared by multiple parks (e.g. Disneyland Paris vs.
 * Anaheim); it wins over the bare-slug lookup and falls back to it when the
 * path isn't found.
 */
export const resolvePark = cache(
  async (slug: string, geoPath?: string): Promise<ResolvedPark | null> => {
    const { parksBySlug, parksByPath } = await buildIndex();
    if (geoPath) {
      const byPath = parksByPath.get(`${geoPath}/${slug}`);
      if (byPath) return byPath;
    }
    return parksBySlug.get(slug) ?? null;
  }
);

/**
 * Trims the attraction detail to what a blog ride reference renders, since it is serialized once
 * per ride mention: `schedule` and `history` dominate it and neither `buildAttractionPayload` nor
 * `overlayAttraction` reads them. `statistics` stays whole because `buildFavoriteStats` reads
 * fields off it through a `Record` cast. An allowlist, so a new heavy API field stays out.
 */
function leanDetailForBlogRef(detail: AttractionResponse): AttractionResponse {
  return {
    id: detail.id,
    name: detail.name,
    slug: detail.slug,
    status: detail.status,
    // `land` is non-optional on the type; the card never renders it for a blog reference.
    land: null,
    latitude: detail.latitude,
    longitude: detail.longitude,
    queues: detail.queues,
    currentLoad: detail.currentLoad,
    statistics: detail.statistics,
    bestVisitTimes: detail.bestVisitTimes,
    // One enum value, and the card's transport badge has nothing else to read.
    attractionKind: detail.attractionKind ?? null,
  };
}

/**
 * Resolves a `ref:park/ride` mention in a post to the ride's name, link, live wait time, status and
 * a trimmed attraction payload, or `null` for an unknown park. Per-render cached.
 */
export const resolveAttraction = cache(
  async (
    parkSlug: string,
    attractionSlug: string,
    geoPath?: string
  ): Promise<ResolvedAttraction | null> => {
    // geoPath disambiguates a shared park slug (e.g. Disneyland Paris vs.
    // Anaheim) so the ride is fetched from the intended park's geo path.
    const park = await resolvePark(parkSlug, geoPath);
    if (!park) return null;

    // Try to enrich with the live attraction payload — failures are non-fatal,
    // the hover card just falls back to a minimal layout.
    let detail: AttractionResponse | null = null;
    try {
      detail = await getAttractionByGeoPath(
        park.continentSlug,
        park.countrySlug,
        deriveCitySlug(park.href),
        parkSlug,
        attractionSlug
      );
    } catch {
      detail = null;
    }

    // Derive the inline-displayable live values once, server-side, so the
    // client link component doesn't need to re-parse the queue array.
    const standby = detail?.queues?.find((q) => q.queueType === 'STANDBY');
    const currentWaitTime = standby && 'waitTime' in standby ? (standby.waitTime ?? null) : null;
    // Park closed ⇒ ride closed. Otherwise prefer the standby queue's own
    // status, then the attraction-level status.
    let status: AttractionStatus | undefined;
    if (park.status && park.status !== 'OPERATING') {
      status = 'CLOSED';
    } else if (standby && 'status' in standby && standby.status) {
      status = standby.status as AttractionStatus;
    } else {
      status = detail?.status;
    }

    return {
      parkSlug,
      parkName: park.name,
      attractionSlug,
      attractionName: detail?.name ?? prettifyName(attractionSlug),
      href: `${park.href}/${attractionSlug}`,
      // Trimmed before it can reach a client component — the browser swaps in the full payload
      // for the cards that actually need it (see leanDetailForBlogRef).
      detail: detail ? leanDetailForBlogRef(detail) : null,
      currentWaitTime,
      status,
      crowdLevel: detail?.currentLoad?.crowdLevel,
      ...(detail?.retiredKind === 'closed' && { closedPermanently: true }),
    };
  }
);

/** Extract the citySlug from a resolved park href: /parks/c/co/CITY/park. */
function deriveCitySlug(parkHref: string): string {
  const parts = parkHref.split('/').filter(Boolean);
  // parts = [parks, continent, country, city, parkSlug]
  return parts[3] ?? '';
}

function prettifyName(slug: string): string {
  return slug
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

/**
 * Parse the option flags from a `park:slug?flag1&flag2` or
 * `attraction:.../slug?flag1` href into a Set.
 *
 * Recognised options (consumed by BlogParkLink / BlogAttractionLink):
 *   - bare:     suppress the inline short-info annotation
 *   - info:     force the inline annotation on (default for parks/attractions)
 *   - long:     render the longer "city, country" form on parks
 */
export function parseRefOptions(href: string): { slug: string; options: Set<string> } {
  const qIdx = href.indexOf('?');
  if (qIdx === -1) return { slug: href, options: new Set() };
  const slug = href.slice(0, qIdx);
  const opts = new Set(
    href
      .slice(qIdx + 1)
      .split(/[&]/)
      .map((s) => s.split('=')[0]?.trim().toLowerCase())
      .filter((s): s is string => !!s)
  );
  return { slug, options: opts };
}
