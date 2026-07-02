import { ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LiveContinentOpenCount } from '@/components/home/live-continent-open-count';
import { translateGeoSlug } from '@/lib/utils/geo-translate';

/** Per-continent card data — the open count is the hourly SSR seed, overlaid live on the client. */
export interface ContinentCard {
  slug: string;
  name: string;
  parkCount: number;
  countryCount: number;
  openParkCount: number;
}

/**
 * Homepage "parks open now" grid. The continent structure (names, links, totals) is
 * server-rendered into the hourly shell; only the open-park counter + progress bar are a
 * client component ({@link LiveContinentOpenCount}) that overlays the baked seed with live
 * values — one shared 5-min-polled batch call for all cards.
 */
export async function LiveActivityGrid({ continents }: { continents: ContinentCard[] }) {
  const [tGeo, tExplore] = await Promise.all([getTranslations('geo'), getTranslations('explore')]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {continents.map((continent) => {
        const continentName = translateGeoSlug(tGeo, 'continents', continent.slug, continent.name);

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
                <LiveContinentOpenCount
                  continentSlug={continent.slug}
                  initialOpenCount={continent.openParkCount}
                  parkCount={continent.parkCount}
                />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
