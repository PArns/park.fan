import { getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';
import { ParkComparisonCard } from '@/components/parks/park-comparison-card';
import { getParkHistoricalStatsSeed } from '@/lib/api/stats';
import { parkGeoPath } from '@/lib/blog/widget-park';
import type { ComparisonPark } from '@/lib/hooks/use-park-comparison-stats';
import type { ResolvedPark } from '@/lib/blog/park-resolver';
import { weekdayName } from '@/lib/utils/intl-format';

interface BlogParkComparisonWidgetProps {
  /** Pre-resolved parks, keyed by the slug written in the fence. */
  parks: ReadonlyMap<string, ResolvedPark | null>;
  /** Raw `slugs=` attribute, comma-separated, in the order the post wants them. */
  slugs: string;
  /**
   * Optional `show=quietest` — adds the quietest-weekday column.
   *
   * Opt-in rather than always on: a post arguing about queue lengths does not want a weekday
   * column in the middle of its table, and the column stays empty for parks whose week was
   * measured too unevenly to name a day (see `pickQuietestWeekday`).
   */
  show?: string;
  /** Post locale — only needed for the weekday names when `show=quietest` is set. */
  locale: string;
  /** Optional `highlight=` slug — rendered bold. Usually the post's own park. */
  highlight?: string;
}

/**
 * Cross-park median comparison inside a blog post:
 *
 *   ```park-comparison-widget slugs=europa-park,phantasialand highlight=europa-park
 *   ```
 *
 * The one table in a park guide that drifts daily and no other component covered; at a few KB per
 * park it is cheap enough for a client fetch. No attendance column: those figures change yearly,
 * are not in our API and belong in the prose.
 */
export async function BlogParkComparisonWidget({
  parks,
  slugs,
  show,
  locale,
  highlight,
}: BlogParkComparisonWidgetProps) {
  const t = await getTranslations('parks');
  const tBlog = await getTranslations('blog');
  const tBestTime = await getTranslations('bestTime.quietestByPark');

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

  const showQuietest = (show ?? '')
    .split(',')
    .map((part) => part.trim())
    .includes('quietest');
  // Runtime weekday names, Sunday first — same reasoning as on the best-time hub: six translated
  // lists would be six things to keep in sync with `DayOfWeekStat.dayOfWeek`.
  const weekdayNames = Array.from({ length: 7 }, (_, i) => weekdayName(i, locale));

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

  // Server seed for the numbers, so crawlers do not get park names beside skeleton cells. Fetched
  // only after the guard above; the fetch is timeout-bounded and per-render cached, so it runs at
  // build, never at request time.
  const initialStats = await Promise.all(
    resolved.map((p) => getParkHistoricalStatsSeed(p.continent, p.country, p.city, p.parkSlug))
  );

  return (
    <div className="not-prose clear-both my-8">
      <ParkComparisonCard
        parks={resolved}
        initialStats={initialStats}
        title={t('stats.comparisonTitle')}
        labelPark={t('stats.comparisonPark')}
        labelParkAverage={t('stats.parkAverage')}
        labelLongest={t('stats.longestQueue')}
        labelMinutes={t('overview.minutesUnit')}
        {...(showQuietest ? { labelQuietestDay: tBestTime('colQuietest'), weekdayNames } : {})}
      />
      {missing.length > 0 && (
        <p className="text-muted-foreground/60 mt-2 text-xs">
          {tBlog('widget.parkNotFound', { slug: missing.join(', ') })}
        </p>
      )}
    </div>
  );
}
