'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OpenStatusProgress } from '@/components/common/open-status-progress';
import { Skeleton } from '@/components/ui/skeleton';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { useGeoLiveStats, findOpenParkCount } from '@/lib/hooks/use-geo-live-stats';

/** Static (cacheable) per-continent fields — everything except the live open-park count. */
export interface StaticContinentCard {
  slug: string;
  name: string;
  parkCount: number;
  countryCount: number;
}

/**
 * Homepage "parks open now" grid. Card structure (continent name, country count, total parks) is
 * prerendered; the live open count is layered on the client via the shared {@link useGeoLiveStats}
 * batch call — so this section no longer bakes a 10-min-stale count into the homepage ISR shell.
 */
export function LiveActivityGrid({ continents }: { continents: StaticContinentCard[] }) {
  const tGeo = useTranslations('geo');
  const tExplore = useTranslations('explore');
  const { data } = useGeoLiveStats();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {continents.map((continent) => {
        const continentName = translateGeoSlug(tGeo, 'continents', continent.slug, continent.name);
        const openParkCount = findOpenParkCount(data, continent.slug);

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
                    {openParkCount === undefined ? (
                      <Skeleton className="inline-block h-7 w-8 align-middle" />
                    ) : (
                      openParkCount
                    )}
                  </span>
                  <span className="text-muted-foreground text-sm">/ {continent.parkCount}</span>
                </div>
                {/* Progress bar — muted placeholder until the live count loads */}
                <OpenStatusProgress
                  openCount={openParkCount ?? 0}
                  totalCount={continent.parkCount}
                  showLabel={false}
                  className={openParkCount === undefined ? 'opacity-40' : undefined}
                />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
