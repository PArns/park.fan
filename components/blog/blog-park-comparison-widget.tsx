import { getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';
import { ParkComparisonCard } from '@/components/parks/park-comparison-card';
import { parkGeoPath } from '@/lib/blog/widget-park';
import type { ComparisonPark } from '@/lib/hooks/use-park-comparison-stats';
import type { ResolvedPark } from '@/lib/blog/park-resolver';

interface BlogParkComparisonWidgetProps {
  /** Pre-resolved parks, keyed by the slug written in the fence. */
  parks: ReadonlyMap<string, ResolvedPark | null>;
  /** Raw `slugs=` attribute, comma-separated, in the order the post wants them. */
  slugs: string;
  /** Optional `highlight=` slug — rendered bold. Usually the post's own park. */
  highlight?: string;
}

/**
 * Cross-park median comparison inside a blog post:
 *
 *   ```park-comparison-widget slugs=europa-park,phantasialand highlight=europa-park
 *   ```
 *
 * Exists because this is the one table in a park guide that no existing component covered and
 * that drifts daily. Measured cost: ~3 KB per park, so a seven-park row costs ~21 KB — cheap
 * enough for a client fetch, unlike an hourly-profile equivalent (8 × 53 KB, 45 % of it
 * `schedule` nobody renders), which needs a backend projection first.
 *
 * Attendance figures deliberately have no column here. They come from the TEA index, are curated
 * once a year and are not in our API; a number that changes annually belongs in the prose, a
 * number that changes daily belongs in the widget.
 */
export async function BlogParkComparisonWidget({
  parks,
  slugs,
  highlight,
}: BlogParkComparisonWidgetProps) {
  const t = await getTranslations('parks');
  const tBlog = await getTranslations('blog');

  const resolved: ComparisonPark[] = [];
  const missing: string[] = [];

  for (const raw of slugs.split(',')) {
    const slug = raw.trim();
    if (!slug) continue;
    const park = parks.get(slug) ?? null;
    const geo = park ? parkGeoPath(park) : null;
    if (!park || !geo) {
      missing.push(slug);
      continue;
    }
    resolved.push({
      slug,
      name: park.name,
      href: park.href,
      ...geo,
      highlight: highlight ? slug === highlight.trim() : false,
    });
  }

  // A single unresolvable slug is a typo in the post; showing the other six silently would hide
  // it. Name what is missing instead, the way the other widgets do.
  if (resolved.length === 0) {
    return (
      <GlassCard variant="light" className="not-prose clear-both my-8">
        <p className="text-muted-foreground text-sm">
          {tBlog('widget.parkNotFound', { slug: missing.join(', ') || slugs })}
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="not-prose clear-both my-8">
      <ParkComparisonCard
        parks={resolved}
        title={t('stats.comparisonTitle')}
        labelPark={t('stats.comparisonPark')}
        labelParkAverage={t('stats.parkAverage')}
        labelLongest={t('stats.longestQueue')}
        labelMinutes={t('overview.minutesUnit')}
      />
      {missing.length > 0 && (
        <p className="text-muted-foreground/60 mt-2 text-xs">
          {tBlog('widget.parkNotFound', { slug: missing.join(', ') })}
        </p>
      )}
    </div>
  );
}
