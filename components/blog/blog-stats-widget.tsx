import { connection } from 'next/server';
import { getLocale, getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';
import { ParkStatsSection } from '@/components/parks/park-stats-section';
import { getParkHistoricalStats } from '@/lib/api/stats';
import { parkGeoPath } from '@/lib/blog/widget-park';
import type { ResolvedPark } from '@/lib/blog/park-resolver';
import type { ParkHistoricalStats } from '@/lib/api/types';

interface BlogStatsWidgetProps {
  park: ResolvedPark | null;
  slug: string;
}

/**
 * Inline historical wait-time statistics used inside blog posts via:
 *   ```stats-widget slug=phantasialand
 *   ```
 *
 * Reuses the park detail page's ParkStatsSection, which renders nothing when a
 * park has fewer than 30 sample days — so the widget self-hides for parks
 * without enough history rather than showing an empty shell.
 */
export async function BlogStatsWidget({ park, slug }: BlogStatsWidgetProps) {
  const tBlog = await getTranslations('blog');
  const geo = park ? parkGeoPath(park) : null;

  if (!park || !geo) {
    return (
      <GlassCard variant="light" className="not-prose my-8">
        <p className="text-muted-foreground text-sm">{tBlog('widget.parkNotFound', { slug })}</p>
      </GlassCard>
    );
  }

  // Dynamic PPR hole: the historical stats fetch streams below the fold.
  await connection();
  const locale = await getLocale();
  const stats: ParkHistoricalStats | null = await getParkHistoricalStats(
    geo.continent,
    geo.country,
    geo.city,
    geo.parkSlug
  ).catch(() => null);

  if (!stats) return null;

  return (
    <div className="not-prose my-8">
      <ParkStatsSection
        stats={stats}
        continent={geo.continent}
        country={geo.country}
        city={geo.city}
        parkSlug={geo.parkSlug}
        locale={locale}
      />
    </div>
  );
}
