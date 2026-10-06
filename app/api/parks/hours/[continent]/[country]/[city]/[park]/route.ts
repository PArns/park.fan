import { NextRequest, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { CACHE_TTL } from '@/lib/api/cache-config';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';
import { getParkSchedule } from '@/lib/api/parks';
import { defaultLocale, isValidLocale, SITE_URL } from '@/i18n/config';
import { buildParkHoursIcs, hasOpeningDays } from '@/lib/parks/park-hours-ics';
import { isSlugPath } from '@/lib/utils/servable-route';

/**
 * The park's coming opening days as a calendar file (`<park-slug>.ics`), behind the "opening hours
 * to calendar" link on the park page. Takes precedence over the `/api/parks/[...path]` catch-all
 * (static segment wins).
 *
 * `?locale=` picks the language of the event title and the note on an estimated day; an unknown
 * value falls back to the default locale rather than failing the download.
 *
 * The window is the one the upstream schedule has (`s-maxage=3600`) and the rule in
 * `next.config.ts` carries the same value. The upstream fetch takes its TTL from
 * `CACHE_TTL.schedule`. A failure, and a park with no coming opening day, answer without a cache
 * window: an empty calendar must not be shared as the park's hours.
 */
const SCHEDULE_CACHE = `public, s-maxage=${CACHE_TTL.schedule}, stale-while-revalidate=${CACHE_TTL.schedule * 2}`;
// `CDN-Cache-Control` too: the rule in next.config.ts sets one on every answer of this path.
const NO_STORE = {
  'Cache-Control': 'no-store, must-revalidate',
  'CDN-Cache-Control': 'no-store',
};

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ continent: string; country: string; city: string; park: string }> }
) {
  const { continent, country, city, park } = await params;
  if (!isSlugPath([continent, country, city, park])) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400, headers: NO_STORE });
  }
  const requested = request.nextUrl.searchParams.get('locale') ?? '';
  const locale = isValidLocale(requested) ? requested : defaultLocale;

  try {
    const result = await getParkSchedule(continent, country, city, park);
    if (!result) {
      return NextResponse.json({ error: 'Park not found' }, { status: 404, headers: NO_STORE });
    }
    if (!hasOpeningDays(result.schedule, new Date())) {
      return NextResponse.json({ error: 'No opening days' }, { status: 404, headers: NO_STORE });
    }
    const t = await getTranslations({ locale, namespace: 'parks.hoursCalendar' });
    const ics = buildParkHoursIcs({
      parkName: result.park.name,
      parkSlug: result.park.slug,
      parkUrl: `${SITE_URL}/${locale}/parks/${continent}/${country}/${city}/${park}`,
      schedule: result.schedule,
      summary: t('summary', { park: result.park.name }),
      estimatedNote: t('estimated'),
    });
    return new NextResponse(ics, {
      headers: {
        ...cdnCacheHeaders(SCHEDULE_CACHE),
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${park}.ics"`,
      },
    });
  } catch (error) {
    console.error('[Park hours ics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch the park schedule' },
      { status: 502, headers: NO_STORE }
    );
  }
}
