import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Clock } from 'lucide-react';
import { WaitTimeValue } from '@/components/common/wait-time-value';
import { getAttractionDisplayStatus } from '@/lib/utils/park-utils';
import { stripNewPrefix } from '@/lib/utils';
import type { ParkAttraction, ParkWithAttractions } from '@/lib/api/types';

interface AttractionWaitOverviewProps {
  park: ParkWithAttractions;
  parkPath: string;
  landNames: string[];
  attractionsByLand: Record<string, ParkAttraction[]>;
}

/** STANDBY wait of an attraction, or null when it has none / is not operating. */
function getStandbyWait(attraction: ParkAttraction): number | null {
  const standby = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  return standby && 'waitTime' in standby ? standby.waitTime : null;
}

/** Newest STANDBY `lastUpdated` across the park — the honest "data as of" timestamp. */
function getDataTimestamp(park: ParkWithAttractions): string | null {
  let newest: string | null = park.analytics?.statistics?.timestamp ?? null;
  for (const attraction of park.attractions ?? []) {
    for (const queue of attraction.queues ?? []) {
      if (queue.lastUpdated && (!newest || queue.lastUpdated > newest)) {
        newest = queue.lastUpdated;
      }
    }
  }
  return newest;
}

/**
 * Server-renderable wait-time overview — the pre-hydration / no-JS content of the attractions
 * tab. Renders every attraction as a plain semantic list (name → link to its detail page, wait
 * time or status from the data-cached snapshot) grouped by themed area, plus the park-wide
 * summary line and a visible "data as of" timestamp.
 *
 * This is what Googlebot's FIRST wave (raw HTML, no JS) indexes for "{park} wartezeiten" and
 * "{ride} wartezeit" queries — before this existed the initial HTML contained NO attraction
 * names and NO links to the attraction pages at all (they only arrived after hydration, and
 * lands below the first are additionally lazy-mounted). After mount the interactive cards
 * replace this view; values here come from the shared park snapshot (up to PARK_REVALIDATE
 * stale), which is why the timestamp is rendered alongside instead of pretending to be live.
 *
 * Must stay deterministic from props (no clock, no browser APIs): it renders on the server AND
 * on the first client render, so any divergence would be a hydration mismatch.
 */
export function AttractionWaitOverview({
  park,
  parkPath,
  landNames,
  attractionsByLand,
}: AttractionWaitOverviewProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const stats = park.analytics?.statistics;
  const dataTimestamp = getDataTimestamp(park);
  const formattedTimestamp = dataTimestamp
    ? new Intl.DateTimeFormat(locale, {
        timeZone: park.timezone || 'UTC',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dataTimestamp))
    : null;

  return (
    <section aria-labelledby="wait-overview-heading">
      <div className="bg-background/70 mb-4 w-fit rounded-lg px-3 py-1.5 backdrop-blur-md">
        <h2
          id="wait-overview-heading"
          className="flex items-center gap-2 text-2xl font-semibold"
        >
          <Clock className="h-5 w-5 shrink-0" aria-hidden="true" />
          {t('overview.title')}
        </h2>
        {stats && (
          <p className="text-muted-foreground text-sm">
            {t('avgWaitTime')}: {stats.avgWaitTime} {tCommon('minutes')} ·{' '}
            {t('parkPeak')}: {stats.peakWaitToday} {tCommon('minutes')} ·{' '}
            {t('operatingCount', {
              count: stats.operatingAttractions,
              total: stats.totalAttractions,
            })}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {landNames.map((landName) => {
          const attractions = attractionsByLand[landName];
          if (!attractions || attractions.length === 0) return null;

          return (
            <div
              key={landName}
              className="border-border/50 bg-background/60 rounded-xl border px-4 py-3 backdrop-blur-md dark:bg-[oklch(0.12_0.025_241_/_0.55)]"
            >
              <h3 className="mb-2 text-lg font-semibold">{landName}</h3>
              <ul className="divide-border/40 divide-y">
                {attractions.map((attraction) => {
                  const status = getAttractionDisplayStatus(attraction, park.status);
                  const waitTime = status === 'OPERATING' ? getStandbyWait(attraction) : null;
                  const href =
                    `${parkPath}/${attraction.slug}` as '/parks/europe/germany/rust/europa-park/blue-fire';

                  return (
                    <li
                      key={attraction.id}
                      className="flex items-baseline justify-between gap-4 py-1.5"
                    >
                      <Link
                        href={href}
                        className="hover:text-primary min-w-0 truncate text-sm font-medium transition-colors"
                      >
                        {stripNewPrefix(attraction.name)}
                      </Link>
                      {waitTime != null ? (
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          <WaitTimeValue minutes={waitTime} /> {t('overview.minutesUnit')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground shrink-0 text-sm">
                          {t(`status.${status}`)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {formattedTimestamp && (
        <p className="text-muted-foreground mt-4 text-xs" suppressHydrationWarning>
          {t('overview.dataAsOf', { time: formattedTimestamp })}
        </p>
      )}
    </section>
  );
}
