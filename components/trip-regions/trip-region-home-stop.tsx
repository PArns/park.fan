import { CalendarPlus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { HomeStop } from '@/components/home/home-stop';
import { RegionTile } from '@/components/layout/planner-menu-panel';
import { RegionSceneInView } from '@/components/layout/planner-region-art';
import { getPlannerMenu } from '@/lib/navigation/planner-menu';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';

/**
 * The homepage's stop for the trip regions, right under the news: the planner band's tiles, each
 * its hub's planner, with its scene once the stop nears the screen (`RegionSceneInView`, so the
 * first load pays nothing for it), and under each the region's teaser
 * (`tripRegions.<slug>.home.teaser`), its parks in one line. What every hub offers, a crowd calendar and a planner, is said
 * once, in the stop's lead (`homeStory.trips`); the hubs' own leads say it again for each region.
 * The regions are the band's (`getPlannerMenu`, which the layout has already asked for).
 */
export async function TripRegionsHomeStop({ locale }: { locale: Locale }) {
  const [tNav, t, { regions }] = await Promise.all([
    getTranslations('navigation'),
    getTranslations('homeStory.trips'),
    getPlannerMenu(locale),
  ]);
  if (regions.length === 0) return null;
  const teasers = await Promise.all(
    regions.map(async (region) =>
      (await getRegionTranslations(region.id, 'home', locale))('teaser')
    )
  );
  return (
    <HomeStop
      stacked
      flushTop
      block="trip_home"
      heading={
        <ChapterHeading
          variant="stop"
          icon={CalendarPlus}
          kicker={tNav('tripPlanner')}
          title={t('title')}
          hint={t('lead')}
        />
      }
    >
      <ul className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {regions.map((region, index) => (
          <li key={region.id} className="min-w-0">
            <RegionTile
              region={region}
              height="h-44 md:h-56"
              art={<RegionSceneInView regionId={region.id} />}
            />
            <p className="text-muted-foreground mt-2.5 text-sm text-pretty">{teasers[index]}</p>
          </li>
        ))}
      </ul>
    </HomeStop>
  );
}
