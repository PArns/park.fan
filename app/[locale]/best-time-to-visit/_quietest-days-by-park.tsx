import { getTranslations } from 'next-intl/server';
import { CalendarDays } from 'lucide-react';
import { getGeoStructure } from '@/lib/api/discovery';
import { extractFeaturedParks } from '@/components/home/featured-parks-section';
import { ParkComparisonCard } from '@/components/parks/park-comparison-card';
import type { ComparisonPark } from '@/lib/hooks/use-park-comparison-stats';
import { weekdayName } from '@/lib/utils/intl-format';
import { getGuideForPark } from '@/lib/blog/backlinks';
import { hasPublishedPosts } from '@/lib/blog/listing';
import { postPath } from '@/lib/blog/paths';
import { BlogPostLink } from '@/components/blog/blog-post-link';
import type { Locale } from '@/i18n/config';

/**
 * The quietest day at each featured park: the one section on this hub that names parks, for the
 * park-qualified searches ("beste Zeit Europa-Park besuchen") an average cannot answer. It
 * renders {@link ParkComparisonCard}, the component the `park-comparison-widget` fence uses, so
 * the numbers that drift daily are fetched client-side instead of frozen into a prerender. The
 * parks are the locale's `FEATURED_PARK_SLUGS`.
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

  // The visit guide for each park in the table, by the lookup the park page uses; a park without
  // a guide in this locale is not named, and a locale without a blog gets no line.
  const guides = hasPublishedPosts(locale as Locale)
    ? parks.flatMap((park) => {
        const guide = getGuideForPark(locale as Locale, park.parkSlug, {
          geoPath: `${park.continent}/${park.country}/${park.city}`,
        });
        return guide ? [{ name: park.name, href: postPath(guide) }] : [];
      })
    : [];

  const [t, tStats, tOverview] = await Promise.all([
    getTranslations('bestTime.quietestByPark'),
    getTranslations('parks.stats'),
    getTranslations('parks.overview'),
  ]);

  // Weekday names from the runtime rather than six translated lists: one less thing to keep in
  // sync, and it already matches each locale's own conventions. Indexed like
  // `DayOfWeekStat.dayOfWeek`, Sunday first.
  const weekdayNames = Array.from({ length: 7 }, (_, i) => weekdayName(i, locale));

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
      {guides.length > 0 && (
        <p className="text-muted-foreground mt-4 max-w-2xl text-sm">
          {t('guidesLead')}{' '}
          {guides.map((guide, i) => (
            <span key={guide.href}>
              {i > 0 && ' · '}
              <BlogPostLink href={guide.href}>{guide.name}</BlogPostLink>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
