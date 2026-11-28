import { NextResponse } from 'next/server';
import { isValidLocale } from '@/i18n/config';
import { getCitiesWithParks } from '@/lib/api/discovery';
import { getParkOrderViews } from '@/lib/api/parks';
import { orderCitiesByViews } from '@/lib/parks/viewed-parks';
import { getCardObjectPosition, getParkBackgroundImage } from '@/lib/utils/park-assets';
import { cdnCacheHeaders, NO_STORE } from '@/lib/api/cdn-cache-headers';
import { foreignForecastRequest, isSameOriginRequest } from '@/lib/api/forecast-relay';

/**
 * The header menu's third pane: one country's cities and parks, fetched when a country is opened
 * so these links stay out of the sitewide link graph. It reads the cached discovery entry the
 * country pages use. With `?locale=` the parks that language's readers open most lead, as on the
 * country page; without, the cities with the most parks. See
 * docs/rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md.
 */

/** Slugs come from our own rendered markup, but this is a public URL — bound what we forward. */
const SLUG = /^[a-z0-9-]{1,64}$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ continent: string; country: string }> }
) {
  // The API gives this only to a key, so the relay answers park.fan's own pages only.
  if (!isSameOriginRequest(request)) return foreignForecastRequest();

  const { continent, country } = await params;
  if (!SLUG.test(continent) || !SLUG.test(country)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400, headers: NO_STORE });
  }
  const requested = new URL(request.url).searchParams.get('locale');
  const locale = requested && isValidLocale(requested) ? requested : null;

  try {
    // `DiscoveryCityResponse` carries the cities under `data`, not `cities` — the upstream shape,
    // not a typo worth "fixing" here.
    const [response, views] = await Promise.all([
      getCitiesWithParks(continent, country),
      locale ? getParkOrderViews(locale) : new Map<string, number>(),
    ]);
    const byParkCount = (response.data ?? [])
      .filter((city) => (city.parks ?? []).length > 0)
      .sort((a, b) => b.parkCount - a.parkCount || a.name.localeCompare(b.name));
    const cities = orderCitiesByViews(byParkCount, views).map((city) => ({
      slug: city.slug,
      name: city.name,
      parkCount: city.parkCount,
      parks: city.parks.map((park) => {
        const lookup = {
          slug: park.slug,
          url: `${continent}/${country}/${city.slug}/${park.slug}`,
        };
        return {
          slug: park.slug,
          name: park.name,
          // Resolved on the server: the menu is a Client Component, and `@/lib/media` there
          // would ship the media catalog to the browser. `null` for most parks, so the row needs
          // none.
          image: getParkBackgroundImage(lookup),
          imagePosition: getCardObjectPosition(lookup),
        };
      }),
    }));

    return NextResponse.json(
      { cities },
      {
        // Structure, not status: a park moving to another city is a once-a-year event, and the
        // view order sums 30 days. Long shared cache, and a stale copy is a better answer than a
        // spinner.
        headers: cdnCacheHeaders(
          'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800'
        ),
      }
    );
  } catch {
    // A failure, said as one: the menu would cache a `200 { cities: [] }` as "no cities" for the
    // session. `no-store`, or the day-long window next.config.ts gives this path would apply.
    return NextResponse.json({ error: 'Cities unavailable' }, { status: 502, headers: NO_STORE });
  }
}
