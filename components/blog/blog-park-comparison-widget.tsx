import { getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';
import { ParkComparisonCard } from '@/components/parks/park-comparison-card';
import { getParkHistoricalStatsSeed } from '@/lib/api/stats';
import { parkGeoPath } from '@/lib/blog/widget-park';
import type { ComparisonPark } from '@/lib/hooks/use-park-comparison-stats';
import type { ResolvedPark } from '@/lib/blog/park-resolver';

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
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    weekdayFormat.format(new Date(Date.UTC(2023, 0, 1 + i)))
  );

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

  // Server seed for the numbers. Without it this table reached crawlers as park names beside
  // empty cells — `data-slot="skeleton"` in the shipped HTML — while the prose around it argues
  // from exactly these figures. Fetched only after the guard above, so a post with a typo'd slug
  // does not fetch seven aggregates to render an error. `Promise.all` over a timeout-bounded,
  // per-render-cached fetch: seven parks cost one round of ≤3s at build, never at request time.
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
