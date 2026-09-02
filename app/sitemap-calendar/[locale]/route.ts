import { xmlEscape } from '@/lib/seo/sitemap-xml';
import { notFound } from 'next/navigation';

import { getGeoStructure } from '@/lib/api/discovery';
import { CACHE_TTL } from '@/lib/api/cache-config';
import { getScheduleCoverageIndex } from '@/lib/seo/content-changes/store';
import { locales, SITE_URL, type Locale } from '@/i18n/config';
import {
  PARK_CALENDAR_SEGMENTS,
  currentParkCalendarMonth,
  parkCalendarMonthsBack,
  parkCalendarMonthsForward,
  shiftParkCalendarMonth,
} from '@/lib/parks/calendar-segments';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale: `${locale}.xml` }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
): Promise<Response> {
  const { locale: fileName } = await params;
  const locale = fileName.replace(/\.xml$/, '');
  if (!locales.includes(locale as Locale)) notFound();

  const segment = PARK_CALENDAR_SEGMENTS[locale as Locale];
  const [geo, coverage] = await Promise.all([
    getGeoStructure(CACHE_TTL.geoSitemap),
    getScheduleCoverageIndex(),
  ]);

  // One month short at BOTH ends. This file is generated and cached for a day while the route
  // recomputes its range from a live clock, so at a month rollover a cached copy would otherwise
  // advertise a month that has just fallen outside — a 404 in a sitemap, which is the one error
  // here that costs something.
  //
  // The back end looks like it would not need the slack, because `parkCalendarMonthsBack` grows
  // as the archive fills and a growing window can only make a cached file too SHORT. That holds
  // until it saturates at the span's `back`. From January 2027 it is pinned at twelve and the
  // oldest served month advances with every rollover, so a copy generated on 2027-02-28 lists
  // 2026-02 and the route stops serving it the next morning — 212 parks × 6 locales of listed
  // 404s per month boundary.
  //
  // The forward end now needs the slack for a second reason: it follows each park's published
  // schedule, and that edge moves BACKWARDS as days pass without the park releasing more. A copy
  // generated the day before the last covered month ends would list a month the route has since
  // stopped serving.
  const forwardSlack = 1;

  const urls: string[] = [];
  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          const base = `${SITE_URL}/${locale}/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}/${segment}`;
          // The snapshot is keyed by locale-agnostic CONTENT path, the same key `lib/content-urls`
          // and the lastmod index already speak in — one entry answers for all six locales.
          const contentPath = `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`;
          const nowMonth = currentParkCalendarMonth(park.timezone);
          // Per park, because `nowMonth` is per park: a park whose date has already rolled over
          // reaches one month further back than one that has not.
          const back = Math.max(0, parkCalendarMonthsBack(nowMonth) - 1);
          // The forward edge follows this park's published schedule, not a constant. Past it the
          // API does not go quiet, it answers: `CLOSED` for every day of a seasonal park (measured
          // 2026-08-28: Phantasialand and Europa-Park returned a fully closed July 2027, which is
          // mid-season at both) and `UNKNOWN` with the flat `moderate` fallback and no hours for a
          // year-round one. Five of ten sampled parks were in the first group, so roughly half the
          // catalogue was advertising months that state a confident falsehood.
          //
          // Absent coverage keeps the old span, deliberately. The value comes from the daily
          // content-change snapshot, and a blob that is cold, slow or one deploy behind must leave
          // the sitemap as it was rather than delete thousands of live URLs.
          const forward = Math.max(
            0,
            parkCalendarMonthsForward(nowMonth, coverage.get(contentPath)) - forwardSlack
          );
          for (let offset = -back; offset <= forward; offset++) {
            if (offset === 0) continue;
            const m = shiftParkCalendarMonth(nowMonth, offset);
            const distance = Math.abs(offset);
            // No `<lastmod>`. The content-change detector fingerprints the STABLE half of a park
            // and a crowd forecast is the moving half by definition — it shifts a little every
            // morning on all 212 parks at once, which is exactly the identical-date-everywhere
            // value that gets a sitemap's lastmod discounted (docs/seo/sitemaps.md). Absent is
            // the honest answer until there is a fingerprint for what a calendar shows.
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
