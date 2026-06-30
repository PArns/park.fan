'use client';

import { useTranslations } from 'next-intl';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useAttractionDetail } from '@/lib/hooks/use-attraction-detail';
import { DailyWaitTimeChartClient } from './daily-wait-time-chart-client';
import { AttractionHistoryGrid } from './attraction-history-grid';
import { AttractionTypicalWaits } from './attraction-typical-waits';
import { AttractionHistorySectionsSkeleton } from './attraction-history-sections-skeleton';
import type { BestVisitSlot } from '@/lib/api/types';

interface AttractionHistorySectionsProps {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  attractionSlug: string;
  attractionName: string;
  timezone: string;
  /** From the lean park snapshot (kept in the shell) — fallback if the detail omits it. */
  bestVisitTimes?: BestVisitSlot[] | null;
  /** True when the shell already rendered typical-waits (headliner) — skip it here. */
  suppressTypicalWaits?: boolean;
}

/**
 * Client wrapper for the attraction's daily wait-time chart + 30-day history grid.
 *
 * These were server-rendered in the static shell, which baked the heavy `history` /
 * `hourlyForecast` time-series into every per-attraction × per-locale ISR write (the dominant
 * write source). They now load client-side via the CDN-cached `/api/parks/.../attractions/<slug>`
 * route (see {@link useAttractionDetail}), shrinking the shell to the lean park data + JSON-LD.
 * The SEO-critical content (structured data, FAQ) stays server-rendered.
 *
 * Shows the skeleton until mounted + loaded so the static prerender renders a stable placeholder.
 */
export function AttractionHistorySections({
  continent,
  country,
  city,
  parkSlug,
  attractionSlug,
  attractionName,
  timezone,
  bestVisitTimes,
  suppressTypicalWaits,
}: AttractionHistorySectionsProps) {
  const mounted = useMounted();
  const t = useTranslations('attractions.todayChart');
  const { data: detail, isLoading } = useAttractionDetail({
    continent,
    country,
    city,
    parkSlug,
    attractionSlug,
  });

  if (!mounted || isLoading) {
    return <AttractionHistorySectionsSkeleton />;
  }

  if (!detail) return null;

  const hasChart = (detail.hourlyForecast?.length ?? 0) > 0 || (detail.history?.length ?? 0) > 0;

  return (
    <>
      {/* Typical (P50) vs busy (P90) peak waits. For headliners this is rendered
          in the static shell instead (suppressTypicalWaits) for SEO + instant
          paint; non-headliner displayable rides still get it client-side here. */}
      {!suppressTypicalWaits && detail.typicalWaits?.displayable && (
        <section className="mb-8">
          <AttractionTypicalWaits typicalWaits={detail.typicalWaits} />
        </section>
      )}

      {/* Daily chart and historical calendar */}
      {hasChart && (
        <section className="mb-8">
          <DailyWaitTimeChartClient
            history={detail.history}
            hourlyForecast={detail.hourlyForecast}
            timezone={timezone}
            schedule={detail.schedule}
            bestVisitTimes={detail.bestVisitTimes ?? bestVisitTimes}
            translations={{
              title: t('title'),
              now: t('now'),
              bestSlots: t('bestSlots', { hours: '{hours}' }),
              bestSlotsGood: t('bestSlotsGood', { hours: '{hours}' }),
              timeSuffix: t('timeSuffix'),
              min: t('min'),
              ratingOptimal: t('ratingOptimal'),
              ratingGood: t('ratingGood'),
              aiBadge: t('aiBadge'),
              aiExplainer: t('aiExplainer'),
              legendRecorded: t('legendRecorded'),
              legendForecast: t('legendForecast'),
            }}
          />
        </section>
      )}

      <section className="mb-8">
        <AttractionHistoryGrid
          attraction={{ name: attractionName, history: detail.history, schedule: detail.schedule }}
        />
      </section>
    </>
  );
}
