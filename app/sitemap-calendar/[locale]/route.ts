import { notFound } from 'next/navigation';

import { getGeoStructure } from '@/lib/api/discovery';
import { locales, SITE_URL, type Locale } from '@/i18n/config';
import {
  PARK_CALENDAR_MONTH_SPAN,
  PARK_CALENDAR_SEGMENTS,
  currentParkCalendarMonth,
  parkCalendarMonthsBack,
  shiftParkCalendarMonth,
} from '@/lib/parks/calendar-segments';

/**
 * One calendar-month sitemap per locale, addressed as `/sitemap-calendar/<locale>.xml`.
 *
 * The month pages were indexable and linked from the day they shipped, but no sitemap named
 * them — the only route in was the panel's prev/next stepper, twelve hops deep at each end. These
 * are the pages written for „phantasialand september 2026", the query shape queue-times and
 * wartecheck currently own outright.
 *
 * Three rules decide what is listed, and each of them prevents a specific wrong URL:
 *
 * **The current month is skipped.** Its content is the hub's, and the route canonicals
 * `/2026/8` to `/…/wartezeiten-kalender` in August. Listing a URL that canonicals elsewhere is a
 * duplicate signal this app would be inflicting on itself.
 *
 * **Both ends stop one month short of what the route serves.** This file is generated and cached
 * for a day; the route recomputes its range from a live clock on every request. At a month
 * rollover a cached copy would otherwise advertise a month that has just fallen outside — a 404
 * in a sitemap, which is the one error here that costs something. See the inline note at `back`
 * for why the archive-bounded end needs the slack too.
 *
 * **The window is measured from today IN THE PARK.** `currentParkCalendarMonth(park.timezone)`,
 * exactly as the page does it, or a park whose date has already rolled over gets a sitemap for a
 * different range than its own route will answer.
 */
export const revalidate = 86400;

/** Same helper the attractions sitemap uses. The slugs come from `getGeoStructure()`, i.e.
 *  upstream data this app does not control, and one `&` in a new park slug makes the whole
 *  3,816-URL file malformed — rejected silently, per locale. */
function xmlEscape(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll("'", '&apos;')
    .replaceAll('"', '&quot;');
}

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
  const geo = await getGeoStructure(86400);

  // One month short at BOTH ends. This file is generated and cached for a day while the route
  // recomputes its range from a live clock, so at a month rollover a cached copy would otherwise
  // advertise a month that has just fallen outside — a 404 in a sitemap, which is the one error
  // here that costs something.
  //
  // The back end looks like it would not need the slack, because `parkCalendarMonthsBack` grows
  // as the archive fills and a growing window can only make a cached file too SHORT. That holds
  // until it saturates at `PARK_CALENDAR_MONTH_SPAN.back`. From January 2027 it is pinned at
  // twelve and the oldest served month advances with every rollover, so a copy generated on
  // 2027-02-28 lists 2026-02 and the route stops serving it the next morning — 212 parks × 6
  // locales of listed 404s per month boundary.
  const forward = PARK_CALENDAR_MONTH_SPAN.forward - 1;

  const urls: string[] = [];
  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          const base = `${SITE_URL}/${locale}/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}/${segment}`;
          const nowMonth = currentParkCalendarMonth(park.timezone);
          // Per park, because `nowMonth` is per park: a park whose date has already rolled over
          // reaches one month further back than one that has not.
          const back = Math.max(0, parkCalendarMonthsBack(nowMonth) - 1);
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
