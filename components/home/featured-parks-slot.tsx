import { getTranslations, getLocale } from 'next-intl/server';
import { ChevronRight, Star } from 'lucide-react';
import { getGeoStructure } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
import { ParkCard } from '@/components/parks/park-card';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { Link } from '@/i18n/navigation';
import { extractFeaturedParks, type FeaturedPark } from './featured-parks-section';

/**
 * Featured ("beliebte") parks — server-rendered into the page's 5-min shell.
 *
 * The cards' live-ish data (status, crowd, wait, schedule) comes from `getGeoStructure(300)`, which
 * is request-deduped (shared with the live-activity section) and 5-min-cached. That is the *same*
 * source the old `/api/featured-parks` client poll hit, so rendering here on the server costs no
 * freshness while dropping the extra round-trip + React Query JS and baking the park links into the
 * prerendered HTML (the SEO point of this section). Wrapped in <Suspense> by callers so the geo
 * fetch never blocks the page shell.
 */

/** Shared server-rendered card grid used by both the full section and the compact grid. */
async function FeaturedParkCards({ parks }: { parks: FeaturedPark[] }) {
  const tGeo = await getTranslations('geo');
  return (
    <div className="grid [grid-auto-rows:auto_1fr_auto] gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {parks.map((park) => (
        <ParkCard
          key={park.slug}
          name={park.name}
          slug={park.slug}
          parkId={park.parkId}
          city={park.city}
          country={translateGeoSlug(tGeo, 'countries', park.countrySlug, park.countryName)}
          href={park.href as '/'}
          backgroundImage={park.backgroundImage}
          status={park.status}
          crowdLevel={park.crowdLevel}
          averageWaitTime={park.averageWaitTime}
          operatingAttractions={park.operatingAttractions}
          totalAttractions={park.totalAttractions}
          timezone={park.timezone}
          todaySchedule={park.todaySchedule}
          nextSchedule={park.nextSchedule}
          variant="detailed"
        />
      ))}
    </div>
  );
}

/**
 * Full featured-parks section (heading + intro + grid + "view all" CTA) — used on the homepage, the
 * blog context module and the bottom of glossary term pages.
 */
export async function FeaturedParksSlot({ locale }: { locale: string }) {
  const [tHome, geoData] = await Promise.all([
    getTranslations('home'),
    catchNonFatal(getGeoStructure(300)),
  ]);
  const parks = extractFeaturedParks(geoData, locale);
  if (parks.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="container mx-auto">
        <div className="mb-2 flex items-center gap-2">
          <Star className="text-primary h-5 w-5" />
          <h2 className="text-xl font-bold">{tHome('sections.featuredParks')}</h2>
        </div>
        <p className="text-muted-foreground mb-8 text-sm">{tHome('sections.featuredParksIntro')}</p>

        <FeaturedParkCards parks={parks} />

        <div className="mt-6 flex justify-center">
          <Link
            href="/parks"
            prefetch={false}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
          >
            {tHome('hero.cta')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Compact featured-parks grid (no section heading) for inline editorial use (howto pages).
 * Resolves the current locale via `getLocale()` so callers need pass nothing.
 */
export async function PopularParksGrid() {
  const [tHome, locale, geoData] = await Promise.all([
    getTranslations('home'),
    getLocale(),
    catchNonFatal(getGeoStructure(300)),
  ]);
  const parks = extractFeaturedParks(geoData, locale);
  if (parks.length === 0) return null;

  return (
    <div className="space-y-4">
      <FeaturedParkCards parks={parks} />
      <div className="flex justify-end">
        <Link
          href="/parks"
          prefetch={false}
          className="text-primary text-sm font-medium hover:underline"
        >
          {tHome('hero.cta')}
        </Link>
      </div>
    </div>
  );
}
