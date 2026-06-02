import { getTranslations } from 'next-intl/server';
import { ChevronRight, Globe } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OpenStatusProgress } from '@/components/common/open-status-progress';
import { getGeoStructure } from '@/lib/api/discovery';
import { getGeoLiveStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { translateGeoSlug } from '@/lib/utils/geo-translate';

/**
 * "Parks open now" — per-continent live open-park counts.
 *
 * Fetches the geo structure (deduped with the featured-parks slot) and merges in
 * the live open counts from the geo-live endpoint. Rendered inside <Suspense> so
 * neither fetch blocks the above-the-fold hero.
 */
export async function LiveActivitySection() {
  const [tHome, tGeo, tExplore, geoData, liveStats] = await Promise.all([
    getTranslations('home'),
    getTranslations('geo'),
    getTranslations('explore'),
    catchNonFatal(getGeoStructure(300)),
    catchNonFatal(getGeoLiveStats()),
  ]);

  const continents =
    geoData?.continents.map((continent) => {
      const liveContinent = liveStats?.continents.find((c) => c.slug === continent.slug);
      return {
        ...continent,
        openParkCount: liveContinent?.openParkCount ?? continent.openParkCount,
      };
    }) || [];

  if (continents.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="container mx-auto">
        <div className="mb-2 flex items-center gap-2">
          <Globe className="text-primary h-5 w-5" />
          <h2 className="text-xl font-bold">{tHome('sections.liveNow')}</h2>
        </div>
        <p className="text-muted-foreground mb-8 text-sm">{tHome('sections.liveNowIntro')}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {continents.map((continent) => {
            const continentName = translateGeoSlug(
              tGeo,
              'continents',
              continent.slug,
              continent.name
            );

            return (
              <Link
                key={continent.slug}
                href={`/parks/${continent.slug}`}
                prefetch={false}
                className="group block"
              >
                <Card className="bg-muted/50 hover:bg-muted/70 border-border hover:border-primary/50 h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium">{continentName}</CardTitle>
                      <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {continent.countryCount}{' '}
                      {tExplore('stats.country', { count: continent.countryCount })}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex items-baseline gap-2">
                      <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-3xl font-bold text-transparent">
                        {continent.openParkCount}
                      </span>
                      <span className="text-muted-foreground text-sm">/ {continent.parkCount}</span>
                    </div>
                    {/* Progress bar */}
                    <OpenStatusProgress
                      openCount={continent.openParkCount}
                      totalCount={continent.parkCount}
                      showLabel={false}
                    />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
