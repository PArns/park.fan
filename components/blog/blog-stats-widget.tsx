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
   * Comma-separated subset of `attractions,months,weekdays` from the fence's `show=` attribute.
   * A post argues from one of those tables at a time, in sections that can sit 400 words apart,
   * so embedding the whole bundle twice would show a reader the weekday chart while the prose
   * is still talking about ride queues. Omitted → all three, which is what every existing post
   * already gets.
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
 * `ParkStatsSection` is a Client Component that fetches the historical aggregate itself via the
 * CDN-cached `/api/parks/.../stats` route, and on the park page it stays that way — moving the
 * heavy 2-year fetch back onto that render is what forced the whole route into `no-store`.
 *
 * A blog post is a different case: it is statically prerendered, so the fetch happens once at
 * build time and costs a visitor nothing. Without a seed the post shipped its numbers as
 * skeleton placeholders, so the tables an answer engine would quote reached crawlers empty.
 * `getParkHistoricalStatsSeed` is timeout-bounded and resolves `null` on a cold aggregate, in
 * which case this renders exactly what it rendered before.
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
