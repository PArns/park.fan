import 'server-only';
import { cache } from 'react';
import { getGeoStructure } from '@/lib/api/discovery';
import { getAttractionByGeoPath } from '@/lib/api/parks';
import type {
  AttractionResponse,
  AttractionStatus,
  CrowdLevel,
  GeoStructure,
  ParkStatus,
  ScheduleSummary,
} from '@/lib/api/types';

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
   * Full live attraction payload (queues, statistics, sparkline). Populated
   * lazily on the server when the post page renders, so AttractionCard can be
   * embedded inside the hover with the same look as on favorites.
   */
  detail?: AttractionResponse | null;
  /** Current STANDBY wait in minutes (null when unknown). Computed server-side. */
  currentWaitTime?: number | null;
  /** Effective ride status — OPERATING / DOWN / CLOSED / REFURBISHMENT. */
  status?: AttractionStatus;
  /** Current crowd level for the ride, if the API exposes one. */
  crowdLevel?: CrowdLevel;
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
    geo = await getGeoStructure(3600);
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
            avgWaitTime: park.analytics?.statistics?.avgWaitTime,
            operatingAttractions: park.analytics?.statistics?.operatingAttractions,
            totalAttractions: park.analytics?.statistics?.totalAttractions,
            // Schedule data flows straight from the geo API. ParkCard reads
            // todaySchedule + nextSchedule (+ hasOperatingSchedule) to render
            // "Closes in 3h 20m" while open and "Opens tomorrow 09:00" while
            // closed — without these the closed footer is just "Closed".
            hasOperatingSchedule: park.hasOperatingSchedule,
            todaySchedule: park.todaySchedule,
            nextSchedule: park.nextSchedule,
          };
          // Bare slug is last-write-wins on collisions; the path index keeps
          // every park addressable and is preferred whenever a geoPath is known.
          parksBySlug.set(park.slug, resolved);
          parksByPath.set(
            `${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
            resolved
          );
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
      detail,
      currentWaitTime,
      status,
      crowdLevel: detail?.currentLoad?.crowdLevel,
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
 * Find every park/attraction reference in a markdown body — both inline link
 * references `[label](park:slug)` / `[label](attraction:parkSlug/slug)` and
 * embedded widget fences such as
 *
 *   ```park-widget slug=magic-kingdom-park
 *   ```
 *   ```attraction-widget parkSlug=europa-park slug=voltron-nevera
 *   ```
 *
 * The link slug part stops at `?` so authors can pass options. Used at
 * render time so we can resolve them on the server in one batch.
 */
/**
 * Normalise a `ref:` token value into `{ kind, key }`. Accepts both the legacy
 * short form (just the slug, or `parkSlug/rideSlug` for a ride) AND the new
 * full-path form the editor produces — `/parks/<continent>/<country>/<city>/
 * <parkSlug>[/<rideSlug>]`. The renderer + resolver only ever sees the bare
 * slug pair after this normaliser runs, so existing posts keep working.
 *
 * When the full geo-path form is used, `geoPath` (`continent/country/city`) is
 * returned alongside the bare key so resolution can disambiguate park slugs
 * that are shared by more than one park (e.g. `disneyland-park` in Paris and
 * Anaheim). The bare `key` stays unchanged for backward-compatible map/dedup
 * behaviour; `geoPath` is `undefined` for the short form.
 */
export function parseRefKey(value: string): {
  kind: 'park' | 'ride';
  key: string;
  geoPath?: string;
} {
  if (value.startsWith('/parks/')) {
    const parts = value.slice('/parks/'.length).split('/').filter(Boolean);
    // [continent, country, city, parkSlug, rideSlug?]
    const geoPath = parts.length >= 4 ? parts.slice(0, 3).join('/') : undefined;
    if (parts.length === 4) return { kind: 'park', key: parts[3], geoPath };
    if (parts.length >= 5) return { kind: 'ride', key: `${parts[3]}/${parts[4]}`, geoPath };
  }
  return { kind: value.includes('/') ? 'ride' : 'park', key: value };
}

export function extractInlineRefs(markdown: string): {
  parkSlugs: Set<string>;
  attractions: Set<string>;
  /** Bare park slug → `continent/country/city` geoPath, when a ref carried one. */
  parkGeoPaths: Map<string, string>;
  /** Bare `parkSlug/rideSlug` → geoPath, when a ref carried one. */
  attractionGeoPaths: Map<string, string>;
} {
  const parks = new Set<string>();
  const attractions = new Set<string>();
  const parkGeoPaths = new Map<string, string>();
  const attractionGeoPaths = new Map<string, string>();

  // 1. Inline link references — [label](park:slug) / [label](attraction:p/s)
  //    plus the unified [label](ref:slug) / [label](ref:p/s) form.
  const linkRe = /\[[^\]]+]\(((?:park|attraction|ref):[^)\s]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(markdown)) !== null) {
    const href = match[1];
    const value = href.includes('?') ? href.slice(0, href.indexOf('?')) : href;
    if (value.startsWith('park:')) parks.add(value.slice('park:'.length));
    else if (value.startsWith('attraction:')) {
      attractions.add(value.slice('attraction:'.length));
    } else if (value.startsWith('ref:')) {
      const { kind, key, geoPath } = parseRefKey(value.slice('ref:'.length));
      if (kind === 'ride') {
        attractions.add(key);
        const parkSlug = key.split('/')[0];
        parks.add(parkSlug);
        if (geoPath) {
          attractionGeoPaths.set(key, geoPath);
          if (!parkGeoPaths.has(parkSlug)) parkGeoPaths.set(parkSlug, geoPath);
        }
      } else {
        parks.add(key);
        if (geoPath) parkGeoPaths.set(key, geoPath);
      }
    }
  }

  // 2. Widget fences — ```park-widget … ``` / ```attraction-widget … ```
  const widgetRe = /^```([a-z]+-widget)(?:[ \t]+([^\n`]+))?\n([\s\S]*?)\n?```$/gm;
  while ((match = widgetRe.exec(markdown)) !== null) {
    const name = match[1];
    const attrSource = `${match[2] ?? ''}\n${match[3] ?? ''}`;
    const slug = extractAttr(attrSource, 'slug');
    const parkSlug = extractAttr(attrSource, 'parkSlug') ?? extractAttr(attrSource, 'park');
    if ((name === 'park-widget' || name === 'map-widget') && slug) {
      parks.add(slug);
    } else if (name === 'attraction-widget' && slug && parkSlug) {
      parks.add(parkSlug);
      attractions.add(`${parkSlug}/${slug}`);
    }
  }

  return { parkSlugs: parks, attractions, parkGeoPaths, attractionGeoPaths };
}

function extractAttr(source: string, key: string): string | undefined {
  // Accepts `key=value`, `key="value"`, `key: value` formats.
  const re = new RegExp(`\\b${key}\\s*[:=]\\s*(?:"([^"]*)"|'([^']*)'|([^\\s]+))`, 'i');
  const m = source.match(re);
  if (!m) return undefined;
  return m[1] ?? m[2] ?? m[3];
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
