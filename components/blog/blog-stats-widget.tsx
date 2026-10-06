import { getLocale, getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';
import { ParkStatsSection } from '@/components/parks/park-stats-section';
import { getParkHistoricalStatsSeed } from '@/lib/api/stats';
import { parkGeoPath } from '@/lib/blog/widget-park';
import type { ResolvedPark } from '@/lib/blog/park-resolver';

interface BlogStatsWidgetProps {
  park: ResolvedPark | null;
  slug: string;
  /**
   * Comma-separated subset of `attractions,months,weekdays` from the fence's `show=` attribute, so
   * a post can embed the one table its prose is arguing from. Omitted, all three.
   */
  show?: string;
}

const CARD_NAMES = ['attractions', 'months', 'weekdays'] as const;
type CardName = (typeof CARD_NAMES)[number];

function parseShow(show: string | undefined): readonly CardName[] | undefined {
  if (!show) return undefined;
  const picked = show
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is CardName => (CARD_NAMES as readonly string[]).includes(s));
  // An attribute that names nothing valid is a typo in the post, not a request for an empty
  // widget — fall back to the full bundle rather than rendering a blank card.
  return picked.length > 0 ? picked : undefined;
}

/**
 * Inline historical wait-time statistics used inside blog posts via:
 *   ```stats-widget slug=phantasialand
 *   ```
 *
 * `ParkStatsSection` fetches the aggregate itself through the CDN-cached `/api/parks/.../stats`,
 * as on the park page. A post is prerendered, so here it gets a server seed and its tables reach
 * crawlers filled. `getParkHistoricalStatsSeed` is timeout-bounded and resolves `null` on a cold
 * aggregate, in which case the card loads on the client.
 */
export async function BlogStatsWidget({ park, slug, show }: BlogStatsWidgetProps) {
  const tBlog = await getTranslations('blog');
  const geo = park ? parkGeoPath(park) : null;

  if (!park || !geo) {
    return (
      <GlassCard variant="light" className="not-prose clear-both my-8">
        <p className="text-muted-foreground text-sm">{tBlog('widget.parkNotFound', { slug })}</p>
      </GlassCard>
    );
  }

  const locale = await getLocale();
  const cards = parseShow(show);
  const initialStats = await getParkHistoricalStatsSeed(
    geo.continent,
    geo.country,
    geo.city,
    geo.parkSlug
  );
  return (
    <div className="not-prose clear-both my-8">
      <ParkStatsSection
        continent={geo.continent}
        country={geo.country}
        city={geo.city}
        parkSlug={geo.parkSlug}
        locale={locale}
        initialStats={initialStats}
        flat
        {...(cards ? { show: cards, hideHeading: true } : {})}
      />
    </div>
  );
}
