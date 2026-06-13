import { getTranslations } from 'next-intl/server';
import { ParkCard } from '@/components/parks/park-card';
import { GlassCard } from '@/components/common/glass-card';
import type { ResolvedPark } from '@/lib/blog/park-resolver';
import { translateGeoSlug } from '@/lib/utils/geo-translate';

interface BlogParkWidgetProps {
  park: ResolvedPark | null;
  slug: string;
  /** When placed in a multi-card row, fill the grid cell instead of sm:w-1/2. */
  inRow?: boolean;
}

/**
 * Inline embeddable park card used inside blog posts via:
 *   ```park-widget slug=magic-kingdom-park
 *   ```
 *
 * Falls back gracefully when the park can't be resolved (e.g. typo in slug
 * or geo data unavailable at render time).
 */
export async function BlogParkWidget({ park, slug, inRow = false }: BlogParkWidgetProps) {
  const tBlog = await getTranslations('blog');
  const tGeo = await getTranslations('geo');

  if (!park) {
    return (
      <GlassCard variant="light" className="not-prose my-8">
        <p className="text-muted-foreground text-sm">{tBlog('widget.parkNotFound', { slug })}</p>
      </GlassCard>
    );
  }

  return (
    <div
      className={
        inRow
          ? 'not-prose grid h-full w-full [grid-template-rows:auto_auto_1fr_auto] gap-3'
          : 'not-prose my-8 grid w-full [grid-template-rows:auto_auto_1fr_auto] gap-3 sm:w-1/2 lg:w-1/3'
      }
    >
      <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {tBlog('widget.parkSpotlight')}
      </h3>
      <ParkCard
        name={park.name}
        slug={park.slug}
        parkId={park.id}
        city={park.city}
        country={translateGeoSlug(tGeo, 'countries', park.countrySlug, park.country)}
        href={park.href as '/'}
        status={park.status}
        crowdLevel={park.crowdLevel}
        averageWaitTime={park.avgWaitTime}
        operatingAttractions={park.operatingAttractions}
        totalAttractions={park.totalAttractions}
        timezone={park.timezone}
        todaySchedule={park.todaySchedule}
        nextSchedule={park.nextSchedule}
        hasOperatingSchedule={park.hasOperatingSchedule}
      />
    </div>
  );
}
