import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import type { DiscoveryCityResponse, LiveParkFields } from '@/lib/api/types';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';

/**
 * Guardrail for a public route that fans out to the backend. The featured strip needs at most six
 * regions; this is double, because exceeding it costs the page its whole live overlay.
 */
const MAX_REGIONS = 12;
const REGION_RE = /^[a-z0-9-]+\/[a-z0-9-]+$/;

/**
 * Live park status for one or more regions in one call, in the projection the cards read
 * (`useLiveParksByRegion`). The answer is identical for every visitor, so the CDN window collapses
 * the polls. `?regions=europe/germany,europe/france` is order-insensitive (the client sorts); the
 * response maps each park id to its `LiveParkFields`.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('regions') ?? '';
  const regions = [...new Set(raw.split(',').filter(Boolean))];

  if (regions.length === 0) {
    return NextResponse.json(
      { error: 'Expected ?regions=<continent>/<country>[,<continent>/<country>…]' },
      { status: 400 }
    );
  }
  if (regions.length > MAX_REGIONS) {
    return NextResponse.json(
      { error: `At most ${MAX_REGIONS} regions per request` },
      { status: 400 }
    );
  }
  if (regions.some((r) => !REGION_RE.test(r))) {
    return NextResponse.json(
      { error: 'Malformed region (expected <continent>/<country>)' },
      { status: 400 }
    );
  }

  // In parallel: the regions are independent, so the request costs one round trip.
  const responses = await Promise.all(
    regions.map(async (region) => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/v1/discovery/continents/${region}`, {
          // Always the backend's latest: this IS the live path. The CDN window below is what
          // keeps concurrent visitors off the origin.
          cache: 'no-store',
          headers: getServerApiHeaders(),
        });
        if (!res.ok) return null;
        return (await res.json()) as DiscoveryCityResponse;
      } catch {
        // One unreachable region shouldn't blank the other cards on the page.
        return null;
      }
    })
  );

  // Every region failed: an outage, not an empty answer. An uncached 502 keeps the last data on
  // screen and lets the next poll retry, where a `200 {}` would blank every card. See
  // docs/rules/an-api-route-passes-only-slugs-upstream.md.
  if (responses.every((data) => data === null)) {
    // `no-store` explicitly: without a Cache-Control of its own the response would take the
    // shared window the rule in next.config.ts gives this path.
    return NextResponse.json(
      { error: 'Live data unavailable' },
      { status: 502, headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  }

  const live: Record<string, LiveParkFields> = {};
  for (const data of responses) {
    for (const city of data?.data ?? []) {
      for (const park of city.parks ?? []) {
        // A park without a readable wait-time source has an aggregate over an empty set (Ø 0 min).
        // Dropped here as values the card already renders around, so the projection gains no
        // field. See docs/rules/parks-we-cannot-read.md.
        const waitDerived = hasReadableWaitTimes(park)
          ? {
              crowdLevel: park.analytics?.statistics?.crowdLevel ?? park.currentLoad?.crowdLevel,
              averageWaitTime: park.analytics?.statistics?.avgWaitTime,
              operatingAttractions: park.analytics?.statistics?.operatingAttractions,
              totalAttractions: park.analytics?.statistics?.totalAttractions,
            }
          : {};
        live[park.id] = {
          status: park.status,
          ...waitDerived,
          timezone: park.timezone,
          hasOperatingSchedule: park.hasOperatingSchedule,
          todaySchedule: park.todaySchedule ?? undefined,
          nextSchedule: park.nextSchedule ?? undefined,
        };
      }
    }
  }

  // Every visitor of a given region set gets byte-identical JSON, so a small shared window
  // collapses them onto one backend fan-out. The client polls every 5 min; ≤60 s of CDN age
  // is well inside that.
  return NextResponse.json(live, {
    headers: cdnCacheHeaders('public, s-maxage=60, stale-while-revalidate=120'),
  });
}
