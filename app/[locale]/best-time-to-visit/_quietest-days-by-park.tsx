import { getTranslations } from 'next-intl/server';
import { CalendarDays } from 'lucide-react';
import { getGeoStructure } from '@/lib/api/discovery';
import { extractFeaturedParks } from '@/components/home/featured-parks-section';
import { ParkComparisonCard } from '@/components/parks/park-comparison-card';
import type { ComparisonPark } from '@/lib/hooks/use-park-comparison-stats';

/**
 * "The quietest day at each park" — the one section on this page that names parks.
 *
 * Everything above it is averaged across the whole catalogue, which is honest but answers a
 * question almost nobody types. The demand is park-qualified ("beste Zeit Europa-Park besuchen"),
 * and every competitor ranking for that shape is a park-specific page. This closes part of that
 * gap with data no one else has.
 *
 * It renders {@link ParkComparisonCard}, the same component the `park-comparison-widget` fence
 * puts inside blog posts, rather than a table of its own: the numbers drift daily, so they are
 * fetched client-side through the CDN-cached `/api/parks/.../stats` and shared with any
 * `stats-widget` for the same park on the page, instead of being frozen into a prerender. This
 * page only picks the parks and hands over the labels.
 *
 * The list is `FEATURED_PARK_SLUGS`, the same per-locale six the homepage and the header rail use
 * — curated by search volume, so the German page names Europa-Park and Phantasialand while the
 * French one names Parc Astérix and Futuroscope.
 */
export async function QuietestDaysByPark({ locale }: { locale: string }) {
  const geo = await getGeoStructure().catch(() => null);
  const featured = extractFeaturedParks(geo, locale);
  if (featured.length === 0) return null;

  const parks: ComparisonPark[] = featured.map((park) => {
    // href is `/parks/<continent>/<country>/<city>/<park>` — the only place the city slug survives
    // `extractFeaturedParks`, which drops it after building the link.
    const [, , continent, country, city, parkSlug] = park.href.split('/');
    return {
      slug: park.slug,
      name: park.name,
      href: park.href,
      continent,
      country,
      city,
      parkSlug,
    };
  });

  const [t, tStats, tOverview] = await Promise.all([
    getTranslations('bestTime.quietestByPark'),
    getTranslations('parks.stats'),
    getTranslations('parks.overview'),
  ]);

  // Weekday names from the runtime rather than six translated lists: one less thing to keep in
  // sync, and it already matches each locale's own conventions. 2023-01-01 was a Sunday, so the
  // index maps straight onto `DayOfWeekStat.dayOfWeek`.
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    weekday.format(new Date(Date.UTC(2023, 0, 1 + i)))
  );

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="text-primary h-5 w-5" aria-hidden="true" />
        <h3 className="text-xl font-bold">{t('title')}</h3>
      </div>
      <p className="text-muted-foreground mb-4 max-w-2xl">{t('intro')}</p>
      <ParkComparisonCard
        parks={parks}
        title={tStats('comparisonTitle')}
        labelPark={tStats('comparisonPark')}
        labelParkAverage={tStats('parkAverage')}
        labelLongest={tStats('longestQueue')}
        labelMinutes={tOverview('minutesUnit')}
        labelQuietestDay={t('colQuietest')}
        weekdayNames={weekdayNames}
      />
    </section>
  );
}
