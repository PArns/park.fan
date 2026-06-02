import { getTranslations } from 'next-intl/server';
import { getGeoStructure } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
import { FeaturedParksSectionClient } from './featured-parks-section-client';
import { extractFeaturedParks } from './featured-parks-section';

/**
 * Server slot that seeds the (client-side, React-Query-backed) featured parks
 * section with SSR data extracted from the geo structure.
 *
 * Rendered inside a <Suspense> boundary so the geo fetch never blocks the hero.
 * The extracted parks land in the streamed/prerendered HTML for SEO; the client
 * component keeps them live via React Query. `getGeoStructure` is request-deduped
 * by Next, so sharing it with the live-activity section costs no extra round-trip.
 */
export async function FeaturedParksSlot({ locale }: { locale: string }) {
  const [tHome, geoData] = await Promise.all([
    getTranslations('home'),
    catchNonFatal(getGeoStructure(300)),
  ]);

  return (
    <FeaturedParksSectionClient
      headingText={tHome('sections.featuredParks')}
      introText={tHome('sections.featuredParksIntro')}
      ctaText={tHome('hero.cta')}
      initialParks={extractFeaturedParks(geoData, locale)}
    />
  );
}
