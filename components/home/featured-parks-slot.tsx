import { getTranslations, getLocale } from 'next-intl/server';
import { ChevronRight } from 'lucide-react';
import { FeaturedParksHeading } from '@/components/home/section-headings';
import { getGeoStructure } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { extractFeaturedParks, type FeaturedPark } from './featured-parks-section';
import { FeaturedParkCardsLive } from './featured-park-cards-live';

/**
 * Featured parks: day-stable structure server-rendered from the 24 h-cached `getGeoStructure()`
 * (the SEO point of this section), live data layered on the client ({@link FeaturedParkCardsLive}),
 * so the host pages are not pinned to a 5-minute ISR window. Callers wrap it in <Suspense> so the
 * geo fetch never blocks the shell.
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
 *
 * `className` goes onto the `<section>` and is for its padding: the homepage hands it the story's
 * rhythm (`STORY_SECTION_Y`), and must hand the same to `FeaturedParksSkeleton` in its fallback.
 */
export async function FeaturedParksSlot({
  locale,
  className,
  heading = 'watermark',
}: {
  locale: string;
  className?: string;
  /** `tile` on the homepage, `watermark` under editorial pages — see {@link FeaturedParksHeading}. */
  heading?: 'watermark' | 'tile';
}) {
  const [tHome, geoData] = await Promise.all([
    getTranslations('home'),
    catchNonFatal(getGeoStructure()),
  ]);
  const parks = extractFeaturedParks(geoData, locale);
  if (parks.length === 0) return null;

  return (
    <section className={cn('px-4 py-12', className)}>
      <div className="container mx-auto">
        {/* The same heading node `FeaturedParksSkeleton` mounts, so the fallback is as tall as
            the section whichever way the title and the intro wrap. */}
        <FeaturedParksHeading
          variant={heading}
          labels={{
            title: tHome('sections.featuredParks'),
            hint: tHome('sections.featuredParksIntro'),
          }}
        />

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
