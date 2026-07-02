import { getTranslations, getLocale } from 'next-intl/server';
import { ChevronRight, Star } from 'lucide-react';
import { getGeoStructure } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { Link } from '@/i18n/navigation';
import { extractFeaturedParks, type FeaturedPark } from './featured-parks-section';
import { FeaturedParkCardsLive } from './featured-park-cards-live';

/**
 * Featured ("beliebte") parks — structure server-rendered into the page's shell, live data
 * layered on the client.
 *
 * The baked part is day-stable only (names, links, city, photo — the SEO point of this
 * section) and comes from the default 24h-cached `getGeoStructure()`, so this section no
 * longer pins its host pages (homepage, blog, glossary, howto) to a 5-min ISR window — that
 * pin was a main driver of the Jun 2026 ISR-write bill. Status/crowd/wait/schedule overlay
 * client-side via the hub-page pattern ({@link FeaturedParkCardsLive} → `useRegionParks`,
 * 5-min poll), so the cards are fresher than the old baked snapshot ever was. Wrapped in
 * <Suspense> by callers so the geo fetch never blocks the page shell.
 */

/** Resolves translations server-side, then hands day-stable card data to the client grid. */
async function FeaturedParkCards({ parks }: { parks: FeaturedPark[] }) {
  const tGeo = await getTranslations('geo');
  return (
    <FeaturedParkCardsLive
      parks={parks.map((park) => ({
        parkId: park.parkId,
        name: park.name,
        slug: park.slug,
        city: park.city,
        country: translateGeoSlug(tGeo, 'countries', park.countrySlug, park.countryName),
        href: park.href,
        backgroundImage: park.backgroundImage ?? null,
        continentSlug: park.continentSlug,
        countrySlug: park.countrySlug,
      }))}
    />
  );
}

/**
 * Full featured-parks section (heading + intro + grid + "view all" CTA) — used on the homepage, the
 * blog context module and the bottom of glossary term pages.
 */
export async function FeaturedParksSlot({ locale }: { locale: string }) {
  const [tHome, geoData] = await Promise.all([
    getTranslations('home'),
    catchNonFatal(getGeoStructure()),
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
    catchNonFatal(getGeoStructure()),
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
