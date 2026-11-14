import { NextResponse } from 'next/server';
import { isValidLocale } from '@/i18n/config';
import { cdnCacheHeaders, NO_STORE } from '@/lib/api/cdn-cache-headers';
import { getTripRegion } from '@/lib/trip-regions/api';
import { getTripRegionWords } from '@/lib/trip-regions/region-messages';
import { LIVE_TRIP_REGIONS } from '@/lib/trip-regions/registry';
import { TRIP_REGION_CACHE_CONTROL } from '@/lib/trip-regions/relay';
import { tripRegionLinks } from '@/lib/trip-regions/trip-links';

/**
 * The live trip regions as the browser links into them (`TripRegionLinks`): their names for the
 * search palette's first row and their parks for the day planner's plan list: each region route's
 * answer without its travel matrix, hotel areas and tickets, which no link needs, read through the
 * Data Cache and kept as long as the relay keeps a region. With `?locale=` each region carries its
 * own words in that language (`words`), and a search matches its name there too. A failed read is
 * a 502 nobody caches, never a shorter list kept for a day.
 */
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get('locale');
  const locale = requested && isValidLocale(requested) ? requested : null;
  try {
    const regions = await Promise.all(
      LIVE_TRIP_REGIONS.map(async (config) => {
        const links = tripRegionLinks(await getTripRegion(config.slug));
        if (!links || !locale) return links;
        const words = await getTripRegionWords(config.slug, locale);
        return { ...links, names: [...new Set([...links.names, words.name])], words };
      })
    );
    return NextResponse.json(
      { regions: regions.filter((links) => links !== null) },
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
