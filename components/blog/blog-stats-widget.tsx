import { getLocale, getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';
import { ParkStatsSection } from '@/components/parks/park-stats-section';
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
 * Mirrors the park detail page: `ParkStatsSection` is a Client Component that
 * fetches the historical aggregate itself via the CDN-cached `/api/parks/.../stats`
 * route. Keeping the heavy 2-year fetch off the server render lets the blog post
 * shell stay statically prerenderable (no `connection()` / dynamic hole).
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
  return (
    <div className="not-prose clear-both my-8">
      <ParkStatsSection
        continent={geo.continent}
        country={geo.country}
        city={geo.city}
        parkSlug={geo.parkSlug}
        locale={locale}
        {...(cards ? { show: cards, hideHeading: true } : {})}
      />
    </div>
  );
}
