'use client';

import { useLiveAttractionData } from '@/lib/hooks/use-live-attraction-data';
import { useAttractionDetail } from '@/lib/hooks/use-attraction-detail';
import { AlertCircle, Layers, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { PANEL_CELL, PanelGrid } from '@/components/parks/park-panel-cell';
import { Badge } from '@/components/ui/badge';
import { SectionHeading } from '@/components/common/section-heading';
import { QUEUE_GLOSSARY_TERMS, QueueTypeBadge } from '@/components/parks/queue-type-badge';
import { TrendPill } from '@/components/parks/trend-pill';
import { DailyWaitTimeChartClient } from '@/components/parks/daily-wait-time-chart-client';
import { DailyWaitTimeChartPlaceholder } from '@/components/parks/daily-wait-time-chart-placeholder';
import { LocalTime } from '@/components/ui/local-time';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { useTranslations } from 'next-intl';
import { useMounted } from '@/lib/hooks/use-mounted';
import { roundWaitDeltaTo5 } from '@/lib/utils/wait-time';
import type { ParkWithAttractions, QueueType, QueueStatus } from '@/lib/api/types';

const QUEUE_TYPE_KEYS = {
  STANDBY: 'queue.STANDBY',
  SINGLE_RIDER: 'queue.SINGLE_RIDER',
  RETURN_TIME: 'queue.RETURN_TIME',
  PAID_RETURN_TIME: 'queue.PAID_RETURN_TIME',
  BOARDING_GROUP: 'queue.BOARDING_GROUP',
  PAID_STANDBY: 'queue.PAID_STANDBY',
} as const satisfies Record<QueueType, string>;

const QUEUE_STATUS_KEYS = {
  OPERATING: 'queue.status.OPERATING',
  DOWN: 'queue.status.DOWN',
  CLOSED: 'queue.status.CLOSED',
  REFURBISHMENT: 'queue.status.REFURBISHMENT',
} as const satisfies Record<QueueStatus, string>;

interface LiveAttractionDataProps {
  initialPark: ParkWithAttractions;
  attractionSlug: string;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * Live chapter of the ride page: today's wait-time chart and the ride's other queues (single
 * rider, paid lanes, return windows, boarding groups), from the ride's detail query, polled every
 * five minutes over the server-rendered park snapshot.
 */
export function LiveAttractionData({
  initialPark,
  attractionSlug,
  continent,
  country,
  city,
  parkSlug,
}: LiveAttractionDataProps) {
  const t = useTranslations('attractions');
  const tChart = useTranslations('attractions.todayChart');
  const tCommon = useTranslations('common');
  // Gate the live-refetch indicator on mount so SSR and first client render agree (the page is
  // force-dynamic; the refetch-on-mount flips `isFetching` true and would otherwise mismatch).
  const mounted = useMounted();

  const { park, attraction, isError, error } = useLiveAttractionData({
    continent,
    country,
    city,
    parkSlug,
    attractionSlug,
    initialPark,
  });

  // The attraction *detail* (stripped from the live park poll) carries today's time series. It
  // shares its React Query key with the 30-day grid's <AttractionHistorySections>, so this adds no
  // request.
  const { data: detail, isLoading: isDetailLoading } = useAttractionDetail({
    continent,
    country,
    city,
    parkSlug,
    attractionSlug,
  });

  if (!attraction) return null;

  const hasTodayChart =
    (detail?.hourlyForecast?.length ?? 0) > 0 || (detail?.history?.length ?? 0) > 0;

  return (
    <>
      {isError && (
        <Card className="mb-6 border-red-500 bg-red-50 p-4 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                {tCommon('failedToLoadLiveData')}
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {tCommon('showingLastKnownState')}
                {error instanceof Error && ` (${error.message})`}
              </p>
            </div>
          </div>
        </Card>
      )}
      {/* Gated as a whole: a ride with no forecast and no reading today would otherwise get an
          empty bordered box under its chapter heading. */}
      {(!mounted || isDetailLoading || hasTodayChart) && (
        <>
          {/* Loading state and chart share ONE box with a reserved height, so the page does not
              drop when the detail lands. Window breakpoints, not `@container/page`: the rows it
              reserves for are gated on the window inside <DailyWaitTimeChart>, and a reservation
              has to ask the same question.
              See docs/rules/a-streamed-section-owes-the-page-its-height.md. */}
          {!mounted || isDetailLoading ? (
            <div className="min-h-[318px] p-4 sm:min-h-[338px] sm:p-6 md:min-h-[367px]">
              <DailyWaitTimeChartPlaceholder />
            </div>
          ) : (
            <div className="min-h-[318px] p-4 sm:min-h-[338px] sm:p-6 md:min-h-[367px]">
              <DailyWaitTimeChartClient
                // The chapter heading above already reads the chart's title; the KI-Prognose badge
                // sits beside that h2.
                hideTitle
                // The same box this card held a moment ago, for the frame in which the chart's
                // own mount gate has not caught up with this component's.
                fallback={<DailyWaitTimeChartPlaceholder />}
                history={detail!.history}
                hourlyForecast={detail!.hourlyForecast}
                timezone={park.timezone}
                schedule={detail!.schedule}
                bestVisitTimes={detail!.bestVisitTimes ?? attraction.bestVisitTimes}
                corridor={{ continent, country, city, parkSlug, attractionSlug }}
                translations={{
                  title: tChart('title'),
                  now: tChart('now'),
                  bestSlots: tChart('bestSlots', { hours: '{hours}' }),
                  bestSlotsGood: tChart('bestSlotsGood', { hours: '{hours}' }),
                  timeSuffix: tChart('timeSuffix'),
                  min: tChart('min'),
                  ratingOptimal: tChart('ratingOptimal'),
                  ratingGood: tChart('ratingGood'),
                  aiBadge: tChart('aiBadge'),
                  aiExplainer: tChart('aiExplainer'),
                  legendRecorded: tChart('legendRecorded'),
                  legendForecast: tChart('legendForecast'),
                  legendTypical: tChart('legendTypical'),
                }}
              />
              <div className="mt-3">
                <Link
                  href="/fancast"
                  className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium transition-colors"
                >
                  {tChart('fancastLink')}
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* The ride's other queues, as hairline-ruled columns under the chart in the SAME box rather
          than cards under a second heading: they are a reading about this ride's day, like the
          chart. */}
      {attraction.queues && attraction.queues.length > 1 && (
        <div className="border-border/50 border-t">
          <div className="px-4 pt-4 md:px-6">
            {/* Sub-section of the live chapter, not a chapter of its own — plain h3
                so the outline reads today's chart › other queues. */}
            <SectionHeading icon={Layers} title={t('otherQueues')} variant="plain" as="h3" />
          </div>
          <PanelGrid
            columnCount={Math.min(
              3,
              attraction.queues.filter((q) => q.queueType !== 'STANDBY').length
            )}
          >
            {attraction.queues
              .filter((q) => q.queueType !== 'STANDBY')
              .map((queue, i) => (
                <div key={i} className={PANEL_CELL}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {QUEUE_GLOSSARY_TERMS[queue.queueType] ? (
                          <GlossaryTermLink termId={QUEUE_GLOSSARY_TERMS[queue.queueType]!}>
                            {t(QUEUE_TYPE_KEYS[queue.queueType])}
                          </GlossaryTermLink>
                        ) : (
                          t(QUEUE_TYPE_KEYS[queue.queueType])
                        )}{' '}
                      </span>
                      <Badge variant="outline">{t(QUEUE_STATUS_KEYS[queue.status])}</Badge>
                    </div>
                    {/* The same queue detail the attraction cards show. */}
                    <QueueTypeBadge queue={queue} timezone={park.timezone} />
                    {/* Only the detail fetch carries a per-queue trend, not the live park poll.
                        Arrow and delta come from the same averages, so they never disagree. */}
                    {(() => {
                      const trend = detail?.queues?.find(
                        (q) => q.queueType === queue.queueType
                      )?.trend;
                      if (!trend) return null;
                      const delta = roundWaitDeltaTo5(trend.recentAverage - trend.previousAverage);
                      const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable';
                      return <TrendPill direction={direction} delta={delta} />;
                    })()}
                    {/* Paid standby lanes carry both a price (shown in the badge above) and a
                        wait time — surface the wait prominently. */}
                    {queue.queueType === 'PAID_STANDBY' && queue.waitTime !== null && (
                      <p className="text-2xl font-bold">
                        {queue.waitTime} <span className="text-muted-foreground text-sm">min</span>
                      </p>
                    )}
                    {/* Lightning Lane carries both a price (badge) and a return window — the
                        badge omits the window, so show it here. */}
                    {queue.queueType === 'PAID_RETURN_TIME' &&
                      queue.returnStart &&
                      queue.returnEnd && (
                        <p className="text-muted-foreground text-sm">
                          {t('returnTime')}:{' '}
                          <LocalTime time={queue.returnStart} timeZone={park.timezone} /> -{' '}
                          <LocalTime time={queue.returnEnd} timeZone={park.timezone} />
                        </p>
                      )}
                  </div>
                </div>
              ))}
          </PanelGrid>
        </div>
      )}
    </>
  );
}
