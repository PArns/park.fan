import { ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OpenStatusProgress } from '@/components/common/open-status-progress';
import { translateGeoSlug } from '@/lib/utils/geo-translate';

/** Per-continent card data — including the live open-park count, resolved server-side. */
export interface ContinentCard {
  slug: string;
  name: string;
  parkCount: number;
  countryCount: number;
  openParkCount: number;
}

/**
 * Homepage "parks open now" grid — server-rendered into the 5-min shell. The continent structure
 * and the live open count both come from props (resolved in {@link LiveActivitySection} via
 * `getGeoLiveStats(300)`), so the count refreshes with the shell and this grid ships no client JS.
 */
export async function LiveActivityGrid({ continents }: { continents: ContinentCard[] }) {
  const [tGeo, tExplore] = await Promise.all([getTranslations('geo'), getTranslations('explore')]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {continents.map((continent) => {
        const continentName = translateGeoSlug(tGeo, 'continents', continent.slug, continent.name);
        const openParkCount = continent.openParkCount;

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
                    {openParkCount}
                  </span>
                  <span className="text-muted-foreground text-sm">/ {continent.parkCount}</span>
                </div>
                <OpenStatusProgress
                  openCount={openParkCount}
                  totalCount={continent.parkCount}
                  showLabel={false}
                />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
