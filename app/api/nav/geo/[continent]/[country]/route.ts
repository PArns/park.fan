import { NextResponse } from 'next/server';
import { getCitiesWithParks } from '@/lib/api/discovery';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';

/**
 * The header menu's third pane: the cities of one country, each with its parks.
 *
 * This exists so those links never enter the sitewide link graph. The menu's first two panes
 * (continents, countries) are server-rendered into every page because 28 hub links are worth
 * concentrating internal weight on; the 144 cities and 212 parks below them are not — they are
 * already linked from those hubs and from the sitemap, and putting them in a template that runs on
 * ~35,000 pages would spread the same weight over 356 more targets for nothing. So they are
 * fetched when somebody actually opens a country, not shipped to everybody who loads a page.
 *
 * One request per country a visitor opens, deduplicated by the menu for the life of the tab. The
 * upstream call is the cached discovery entry the country pages already use (`geo` tag, continents
 * TTL), so this is a data-cache read rather than a fresh hop to api.park.fan.
 */

/** Slugs come from our own rendered markup, but this is a public URL — bound what we forward. */
const SLUG = /^[a-z0-9-]{1,64}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ continent: string; country: string }> }
) {
  const { continent, country } = await params;
  if (!SLUG.test(continent) || !SLUG.test(country)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  try {
    // `DiscoveryCityResponse` carries the cities under `data`, not `cities` — the upstream shape,
    // not a typo worth "fixing" here.
    const response = await getCitiesWithParks(continent, country);
    const cities = (response.data ?? [])
      .map((city) => ({
        slug: city.slug,
        name: city.name,
        parkCount: city.parkCount,
        parks: (city.parks ?? []).map((park) => ({ slug: park.slug, name: park.name })),
      }))
      .filter((city) => city.parks.length > 0)
      .sort((a, b) => b.parkCount - a.parkCount || a.name.localeCompare(b.name));

    return NextResponse.json(
      { cities },
      {
        // Structure, not status: a park moving to another city is a once-a-year event. Long
        // shared cache, and a stale copy is a better answer than a spinner.
        headers: cdnCacheHeaders(
          'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800'
        ),
      }
    );
  } catch {
    // The menu renders its country link and drops the pane; nothing here is worth a 500.
    return NextResponse.json({ cities: [] }, { status: 200 });
  }
}
