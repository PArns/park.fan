import { NextResponse } from 'next/server';
import { cdnCacheHeaders, NO_STORE } from '@/lib/api/cdn-cache-headers';
import { getOrlandoRegion } from '@/lib/orlando/api';
import { TRIP_REGION_CACHE_CONTROL } from '@/lib/orlando/relay';
import { tripRegionLinks } from '@/lib/orlando/trip-links';

/**
 * The trip regions as the browser links into them (`TripRegionLinks`): their names for the search
 * palette's first row and their parks for the day planner's plan list: the region route's answer
 * without its travel matrix, hotel areas and tickets, which no link needs, read through the Data
 * Cache and kept as long as the relay keeps the region. A failed read is a 502 nobody caches, never
 * an empty list kept for a day.
 */
export async function GET() {
  try {
    const links = tripRegionLinks(await getOrlandoRegion());
    return NextResponse.json(
      { regions: links ? [links] : [] },
      { headers: cdnCacheHeaders(TRIP_REGION_CACHE_CONTROL) }
    );
  } catch (error) {
    console.error('[Trip region links] Error:', error);
    return NextResponse.json(
      { error: 'The trip regions could not be read' },
      { status: 502, headers: NO_STORE }
    );
  }
}
