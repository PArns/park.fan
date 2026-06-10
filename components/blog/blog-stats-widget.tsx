import { getLocale, getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';
import { ParkStatsSection } from '@/components/parks/park-stats-section';
import { parkGeoPath } from '@/lib/blog/widget-park';
import type { ResolvedPark } from '@/lib/blog/park-resolver';

interface BlogStatsWidgetProps {
  park: ResolvedPark | null;
  slug: string;
}

/**
 * Inline historical wait-time statistics used inside blog posts via:
 *   ```stats-widget slug=phantasialand
 *   ```
 *
 * Mirrors the park detail page: `ParkStatsSection` is a Client Component that
 * fetches the historical aggregate itself via the CDN-cached `/api/parks/.../stats`
 * route. Keeping the heavy 2-year fetch off the server render lets the blog post
 * shell stay statically prerenderable (no `connection()` / dynamic hole).
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

  const locale = await getLocale();
  return (
    <div className="not-prose my-8">
      <ParkStatsSection
        continent={geo.continent}
        country={geo.country}
        city={geo.city}
        parkSlug={geo.parkSlug}
        locale={locale}
      />
    </div>
  );
}
