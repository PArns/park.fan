import {
  localeFromSitemapFile,
  localeSitemapParams,
  urlsetResponse,
  xmlEscape,
} from '@/lib/seo/sitemap-xml';
import { notFound } from 'next/navigation';

import { getGeoStructure } from '@/lib/api/discovery';
import { CACHE_TTL } from '@/lib/api/cache-config';
import { getScheduleCoverageIndex } from '@/lib/seo/content-changes/store';
import { SITE_URL } from '@/i18n/config';
import {
  PARK_CALENDAR_SEGMENTS,
  currentParkCalendarMonth,
  parkCalendarMonthsBack,
  parkCalendarMonthsForward,
  shiftParkCalendarMonth,
} from '@/lib/parks/calendar-segments';

export function generateStaticParams() {
  return localeSitemapParams();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
): Promise<Response> {
  const locale = localeFromSitemapFile((await params).locale);
  if (!locale) notFound();

  const segment = PARK_CALENDAR_SEGMENTS[locale];
  const [geo, coverage] = await Promise.all([
    getGeoStructure(CACHE_TTL.geoSitemap),
    getScheduleCoverageIndex(),
  ]);

  // One month short at both ends. This file is cached for a day while the route computes its
  // range from a live clock, so after a month rollover a cached copy would list a month the route
  // now 308s to the hub: a redirect we hand a crawler ourselves. Both edges move: the back end
  // once `parkCalendarMonthsBack` saturates at the span's `back`, the forward end whenever a
  // park's published schedule runs out.
  const forwardSlack = 1;

  const urls: string[] = [];
  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          const base = `${SITE_URL}/${locale}/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}/${segment}`;
          // The snapshot is keyed by the locale-agnostic content path, like `lib/content-urls`
          // and the lastmod index, so one entry answers for all six locales.
          const contentPath = `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`;
          const nowMonth = currentParkCalendarMonth(park.timezone);
          // Per park, because `nowMonth` is per park: a park whose date has already rolled over
          // reaches one month further back than one that has not.
          const back = Math.max(0, parkCalendarMonthsBack(nowMonth) - 1);
          // The forward edge follows this park's published schedule, not a constant. Past it the
          // API still answers, with `CLOSED` for every day of a seasonal park and `UNKNOWN` with
          // no hours for a year-round one, so those months would state a confident falsehood.
          // Absent coverage keeps the full span: a cold or stale snapshot must leave the sitemap
          // as it was rather than delete live URLs.
          const forward = Math.max(
            0,
            parkCalendarMonthsForward(nowMonth, coverage.get(contentPath)) - forwardSlack
          );
          for (let offset = -back; offset <= forward; offset++) {
            if (offset === 0) continue;
            const m = shiftParkCalendarMonth(nowMonth, offset);
            const distance = Math.abs(offset);
            // No `<lastmod>`: the content-change detector fingerprints the stable half of a park,
            // and a crowd forecast shifts a little every morning on every park at once, the
            // identical-date value that gets a sitemap's lastmod discounted (docs/seo/sitemaps.md).
            urls.push(
              `<url><loc>${xmlEscape(`${base}/${m.year}/${m.month}`)}</loc>` +
                `<changefreq>${offset < 0 ? 'monthly' : 'weekly'}</changefreq>` +
                `<priority>${distance <= 3 ? '0.6' : distance <= 6 ? '0.5' : '0.4'}</priority></url>`
            );
          }
        }
      }
    }
  }

  return urlsetResponse(urls);
}
