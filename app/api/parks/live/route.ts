import { NextRequest, NextResponse } from 'next/server';
import { getServerApiHeaders } from '@/lib/api/client';
import type { DiscoveryCityResponse, LiveParkFields } from '@/lib/api/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan';

/**
 * Guardrail for a public route that fans out to the backend: refuse silly region lists.
 *
 * The real upper bound is the featured strip — six parks, so at most six distinct regions, and
 * every other caller asks for one. Double that, because exceeding it costs the page its whole
 * live overlay (the batch 400s and every card next to the offending region loses its badge),
 * which is a bad trade for a limit whose only job is to stop an attacker asking for a hundred.
 */
const MAX_REGIONS = 12;
const REGION_RE = /^[a-z0-9-]+\/[a-z0-9-]+$/;

/**
 * Live park status for one or more regions, in ONE call and in the projection the cards read.
 *
 * The card overlay (`useLiveParksByRegion`) needs nine fields per park — status, crowd, average
 * wait, the open/total counts, timezone and today's/next schedule. It used to get them from
 * `/api/discovery/<continent>/<country>`, which answers with the region's full park objects; the
 * featured-parks strip spans three countries, so six cards cost three requests and 16.7 KB of
 * which 7.2 KB is fields nothing on the page reads (descriptions, coordinates, images the proxy
 * had just resolved, per-city nesting).
 *
 * Folding the regions into one request and returning the projection instead answers the same six
 * cards in one request and 9.5 KB (1.2 KB br) — and unlike the per-region route this response is
 * identical for every visitor, so the CDN window actually collapses the polls.
 *
 * `?regions=europe/germany,europe/france` — order-insensitive (the client sorts, so one cache
 * entry serves every ordering). Response: `{ "<parkId>": LiveParkFields }` across all regions,
 * flattened; ids are globally unique so the caller just looks its park up.
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

  // Fan out in parallel: the regions are independent and this runs next to the backend, so the
  // request costs one round-trip, not one per region like the client-side version it replaces.
  const responses = await Promise.all(
    regions.map(async (region) => {
      try {
        const res = await fetch(`${API_BASE}/v1/discovery/continents/${region}`, {
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

  const live: Record<string, LiveParkFields> = {};
  for (const data of responses) {
    for (const city of data?.data ?? []) {
      for (const park of city.parks ?? []) {
        live[park.id] = {
          status: park.status,
          crowdLevel: park.analytics?.statistics?.crowdLevel ?? park.currentLoad?.crowdLevel,
          averageWaitTime: park.analytics?.statistics?.avgWaitTime,
          operatingAttractions: park.analytics?.statistics?.operatingAttractions,
          totalAttractions: park.analytics?.statistics?.totalAttractions,
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
  // is well inside that. (Needs the matching exemption in next.config.ts — the blanket
  // `/api → no-store` rule would otherwise override this header.)
  return NextResponse.json(live, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
