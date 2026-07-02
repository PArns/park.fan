import { getTranslations } from 'next-intl/server';
import { Globe } from 'lucide-react';
import { getGeoStructure } from '@/lib/api/discovery';
import { getGeoLiveStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { LiveActivityGrid, type ContinentCard } from '@/components/home/live-activity-grid';

/**
 * "Parks open now" — per-continent open-park counts, server-rendered into the homepage shell.
 *
 * The continent structure (names + total park counts) comes from the static geo structure; the
 * baked open counts are only an HOURLY SSR seed (the shell revalidates every 3600s to keep ISR
 * writes down) — the live values overlay themselves client-side per card via the shared
 * `useGeoLiveStats` batch call (see LiveContinentOpenCount). Rendered inside <Suspense> so
 * neither fetch blocks the hero; on error the section is omitted.
 */
export async function LiveActivitySection() {
  const [tHome, geoData, geoLive] = await Promise.all([
    getTranslations('home'),
    catchNonFatal(getGeoStructure()),
    catchNonFatal(getGeoLiveStats()),
  ]);

  const continents: ContinentCard[] =
    geoData?.continents.map((continent) => ({
      slug: continent.slug,
      name: continent.name,
      parkCount: continent.parkCount,
      countryCount: continent.countryCount,
      openParkCount: geoLive?.continents.find((c) => c.slug === continent.slug)?.openParkCount ?? 0,
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
