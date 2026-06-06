import { getTranslations } from 'next-intl/server';
import { Globe } from 'lucide-react';
import { getGeoStructure } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
import { LiveActivityGrid, type StaticContinentCard } from '@/components/home/live-activity-grid';

/**
 * "Parks open now" — per-continent live open-park counts.
 *
 * The section structure (continent names + total park counts) comes from the static geo structure
 * and is prerendered/edge-cached; the live open counts are layered on the client by
 * {@link LiveActivityGrid} (shared geo-live batch call), so this section no longer bakes a stale
 * count into the homepage ISR shell. Rendered inside <Suspense> so the geo fetch never blocks the
 * hero.
 */
export async function LiveActivitySection() {
  const [tHome, geoData] = await Promise.all([
    getTranslations('home'),
    catchNonFatal(getGeoStructure()),
  ]);

  const continents: StaticContinentCard[] =
    geoData?.continents.map((continent) => ({
      slug: continent.slug,
      name: continent.name,
      parkCount: continent.parkCount,
      countryCount: continent.countryCount,
    })) || [];

  if (continents.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="container mx-auto">
        <div className="mb-2 flex items-center gap-2">
          <Globe className="text-primary h-5 w-5" />
          <h2 className="text-xl font-bold">{tHome('sections.liveNow')}</h2>
        </div>
        <p className="text-muted-foreground mb-8 text-sm">{tHome('sections.liveNowIntro')}</p>
        <LiveActivityGrid continents={continents} />
      </div>
    </section>
  );
}
