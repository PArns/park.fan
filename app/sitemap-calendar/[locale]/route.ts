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
 * **The range stops one month short of the route's window at each end.** This file is generated
 * and cached for a day; the route recomputes its range from a live clock on every request. At a
 * month rollover a cached sitemap would otherwise advertise the month that just fell off the
 * back — a 404 in a sitemap, which is the one error here that costs something.
 *
 * **The window is measured from today IN THE PARK.** `currentParkCalendarMonth(park.timezone)`,
 * exactly as the page does it, or a park whose date has already rolled over gets a sitemap for a
 * different range than its own route will answer.
 */
export const revalidate = 86400;

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

  // Backwards: whatever the archive actually covers, from `parkCalendarMonthsBack` — the same
  // function the route's range check and the month index read, so a sitemap entry cannot outlive
  // the URL it names. No slack subtracted at this end: the window only ever GROWS as the archive
  // fills, so a cached sitemap lists fewer months than the route serves, never more.
  //
  // Forwards: one month short, on purpose. This file is generated and cached for a day while the
  // route recomputes its range from a live clock, so at a month rollover a cached sitemap would
  // otherwise advertise the month that just fell off the far end — a 404 in a sitemap, which is
  // the one error here that costs something.
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
          const back = parkCalendarMonthsBack(nowMonth);
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
              `<url><loc>${base}/${m.year}/${m.month}</loc>` +
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
