'use client';

import { useLiveAttractionData } from '@/lib/hooks/use-live-attraction-data';
import { useAttractionDetail } from '@/lib/hooks/use-attraction-detail';
import { AlertCircle, Layers, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { PANEL_CELL, PanelGrid } from '@/components/parks/park-panel-cell';
import { Badge } from '@/components/ui/badge';
import { SectionHeading } from '@/components/common/section-heading';
import { QueueTypeBadge } from '@/components/parks/queue-type-badge';
import { TrendPill } from '@/components/parks/trend-pill';
import { DailyWaitTimeChartClient } from '@/components/parks/daily-wait-time-chart-client';
import { DailyWaitTimeChartPlaceholder } from '@/components/parks/daily-wait-time-chart-placeholder';
import { LocalTime } from '@/components/ui/local-time';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { useTranslations } from 'next-intl';
import { useMounted } from '@/lib/hooks/use-mounted';
import type { ParkWithAttractions, QueueType, QueueStatus } from '@/lib/api/types';

const QUEUE_TYPE_KEYS = {
  STANDBY: 'queue.STANDBY',
  SINGLE_RIDER: 'queue.SINGLE_RIDER',
  RETURN_TIME: 'queue.RETURN_TIME',
  PAID_RETURN_TIME: 'queue.PAID_RETURN_TIME',
  BOARDING_GROUP: 'queue.BOARDING_GROUP',
  PAID_STANDBY: 'queue.PAID_STANDBY',
} as const satisfies Record<QueueType, string>;

const QUEUE_TYPE_TERM: Partial<Record<QueueType, string>> = {
  SINGLE_RIDER: 'single-rider',
  RETURN_TIME: 'virtual-queue',
  PAID_RETURN_TIME: 'lightning-lane',
  PAID_STANDBY: 'express-pass',
  BOARDING_GROUP: 'boarding-group',
};

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

  // The attraction *detail* (stripped from the live park poll) carries the prediction accuracy AND
  // the daily "Wartezeiten heute" time-series (history/forecast/schedule/bestVisitTimes). It's
  // fetched client-side via the CDN-cached detail route — shared (deduped) with the 30-day grid's
  // <AttractionHistorySections> through React Query's query key, so this adds no extra request.
  const { data: detail, isLoading: isDetailLoading } = useAttractionDetail({
    continent,
    country,
    city,
    parkSlug,
    attractionSlug,
  });

  if (!attraction) return null;

  // Whether the detail carries enough to render the "Wartezeiten heute" bar chart.
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
      {/* Today's curve. The live value, the status badge and the accuracy chip that used to sit
          above it now open the page inside the header card, where the park page puts the same
          readings, so what is left here is the chart.

          The whole card is gated: with `hasTodayChart` false it used to render as a bordered box
          with nothing in it, ~2 px tall under a chapter heading. The old code always had the live
          panel inside, so the empty case never came up; a ride with no forecast and no reading
          today (verified on `hansa-park/animal-babies-of-peterhof`) got exactly that. */}
      {(!mounted || isDetailLoading || hasTodayChart) && (
        <>
          {/* Loading state and chart share ONE box with a reserved height, because the placeholder
              used to stand in for the chart at less than half its size: 213 px held for the
              401-421 px the chart occupies, so the moment the detail fetch landed the rest of the
              ride page dropped ~208 px. The skeleton mirrors the chart's anatomy row for row:
              explainer, legend, plot, best-slot line, Fancast link. It carries no title row,
              because the chart no longer draws one (`hideTitle`; the chapter heading above says
              it). The plot grows at `sm` with the taller bars and again at `md`, where the
              hour-label row appears.

              Window breakpoints, not `@container/page`: the rows this reserves for are themselves
              gated on the window inside <DailyWaitTimeChart>, and a reservation that asks a
              different question from the thing it reserves for is how a box comes out 200 px
              short. */}
          {!mounted || isDetailLoading ? (
            <div className="min-h-[318px] p-4 sm:min-h-[338px] sm:p-6 md:min-h-[367px]">
              <DailyWaitTimeChartPlaceholder />
            </div>
          ) : (
            <div className="min-h-[318px] p-4 sm:min-h-[338px] sm:p-6 md:min-h-[367px]">
              <DailyWaitTimeChartClient
                // The chapter heading above already reads the chart's own title, so it draws
                // none. The KI-Prognose badge moved up beside that h2 with it.
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

      {/* The ride's other queues — single rider, a paid lane, a return window. A band of
          hairline-ruled columns under the chart in the SAME box, not a row of cards under a
          second heading: they are a reading about this ride's day like the chart above them, and
          three floating cards under a chapter band was the shape this page was rebuilt to stop
          drawing. The `border-t` is the rule that separates them from the chart. */}
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
                        {QUEUE_TYPE_TERM[queue.queueType] ? (
                          <GlossaryTermLink termId={QUEUE_TYPE_TERM[queue.queueType]!}>
                            {t(QUEUE_TYPE_KEYS[queue.queueType])}
                          </GlossaryTermLink>
                        ) : (
                          t(QUEUE_TYPE_KEYS[queue.queueType])
                        )}{' '}
                      </span>
                      <Badge variant="outline">{t(QUEUE_STATUS_KEYS[queue.status])}</Badge>
                    </div>
                    {/* Canonical queue detail (price, single-rider time, boarding groups,
                        virtual-queue window/state) — same component used on attraction cards. */}
                    <QueueTypeBadge queue={queue} timezone={park.timezone} />
                    {/* Short-term wait-time trend (e.g. single-rider rising/falling). Only the
                        client-side detail fetch carries per-queue trend; the live park poll that
                        feeds `attraction.queues` above does not. Derive both the arrow and the
                        delta from the recent-vs-previous averages so they never disagree. */}
                    {(() => {
                      const trend = detail?.queues?.find(
                        (q) => q.queueType === queue.queueType
                      )?.trend;
                      if (!trend) return null;
                      const delta =
                        Math.round((trend.recentAverage - trend.previousAverage) / 5) * 5;
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
