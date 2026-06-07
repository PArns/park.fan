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
}

const buildIndex = cache(async (): Promise<IndexedGeo> => {
  let geo: GeoStructure | null = null;
  try {
    geo = await getGeoStructure(3600);
  } catch {
    geo = null;
  }
  const parksBySlug = new Map<string, ResolvedPark>();
  if (!geo) return { parksBySlug };

  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          parksBySlug.set(park.slug, {
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
          });
        }
      }
    }
  }
  return { parksBySlug };
});

export const resolvePark = cache(async (slug: string): Promise<ResolvedPark | null> => {
  const { parksBySlug } = await buildIndex();
  return parksBySlug.get(slug) ?? null;
});

export const resolveAttraction = cache(
  async (parkSlug: string, attractionSlug: string): Promise<ResolvedAttraction | null> => {
    const park = await resolvePark(parkSlug);
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
    const currentWaitTime =
      standby && 'waitTime' in standby ? (standby.waitTime ?? null) : null;
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
export function extractInlineRefs(markdown: string): {
  parkSlugs: Set<string>;
  attractions: Set<string>;
} {
  const parks = new Set<string>();
  const attractions = new Set<string>();

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
      // park vs ride is decided by the presence of a slash in the key
      const refKey = value.slice('ref:'.length);
      if (refKey.includes('/')) {
        attractions.add(refKey);
        parks.add(refKey.split('/')[0]);
      } else {
        parks.add(refKey);
      }
    }
  }

  // 2. Widget fences — ```park-widget … ``` / ```attraction-widget … ```
  const widgetRe =
    /^```([a-z]+-widget)(?:\s+([^\n`]+))?\n([\s\S]*?)\n?```$/gm;
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

  return { parkSlugs: parks, attractions };
}

function extractAttr(source: string, key: string): string | undefined {
  // Accepts `key=value`, `key="value"`, `key: value` formats.
  const re = new RegExp(
    `\\b${key}\\s*[:=]\\s*(?:"([^"]*)"|'([^']*)'|([^\\s]+))`,
    'i'
  );
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
