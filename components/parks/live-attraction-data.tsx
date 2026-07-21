'use client';

import { useLiveAttractionData } from '@/lib/hooks/use-live-attraction-data';
import { useAttractionDetail } from '@/lib/hooks/use-attraction-detail';
import {
  AlertCircle,
  Loader2,
  Clock,
  AlertTriangle,
  Wrench,
  XCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeading } from '@/components/common/section-heading';
import { AttractionLivePanel } from '@/components/parks/attraction-live-panel';
import { QueueTypeBadge } from '@/components/parks/queue-type-badge';
import { TrendPill } from '@/components/parks/trend-pill';
import { DailyWaitTimeChartClient } from '@/components/parks/daily-wait-time-chart-client';
import { LocalTime } from '@/components/ui/local-time';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { useTranslations } from 'next-intl';
import { useMounted } from '@/lib/hooks/use-mounted';
import type {
  ParkWithAttractions,
  AttractionStatus,
  QueueDataItem,
  QueueType,
  QueueStatus,
  StandbyQueue,
  AccuracyBadge,
} from '@/lib/api/types';

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

const ACCURACY_BADGE_KEYS = {
  excellent: 'accuracy.excellent',
  good: 'accuracy.good',
  fair: 'accuracy.fair',
  poor: 'accuracy.poor',
  insufficient_data: 'accuracy.insufficient_data',
} as const satisfies Record<AccuracyBadge, string>;

function getMainQueue(queues?: QueueDataItem[]): QueueDataItem | null {
  if (!queues || queues.length === 0) return null;
  return queues.find((q) => q.queueType === 'STANDBY') || queues[0];
}

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

  const { park, attraction, isFetching, isError, error } = useLiveAttractionData({
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

  const mainQueue = getMainQueue(attraction.queues);
  const isParkClosed = park.status !== 'OPERATING';
  const status: AttractionStatus = isParkClosed
    ? 'CLOSED'
    : mainQueue?.status || attraction.status || 'CLOSED';

  const history = attraction.statistics?.history;
  const calculatedMinWaitToday = history?.length
    ? Math.min(...history.map((h) => h.waitTime))
    : null;
  const calculatedMaxWaitToday = history?.length
    ? Math.max(...history.map((h) => h.waitTime))
    : null;

  const statusConfig: Record<
    AttractionStatus,
    { icon: typeof Clock; color: string; label: string }
  > = {
    OPERATING: { icon: Clock, color: 'text-status-operating', label: t('status.operating') },
    DOWN: { icon: AlertTriangle, color: 'text-status-down', label: t('status.down') },
    CLOSED: { icon: XCircle, color: 'text-status-closed', label: t('status.closed') },
    REFURBISHMENT: {
      icon: Wrench,
      color: 'text-status-refurbishment',
      label: t('status.refurbishment'),
    },
  };
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // Prefer the live park poll if it returns predictionAccuracy; otherwise use the client-fetched
  // attraction detail (the live poll strips it via leanParkForShell).
  const effectivePredictionAccuracy = attraction.predictionAccuracy ?? detail?.predictionAccuracy;

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

      {/* Subtle loading indicator during background refetch. Wrapped in a fixed-height slot that
          is always present, so the indicator appearing/disappearing on every 5-min poll (and on
          the immediate refetch-on-mount) no longer shifts the live card below it (CLS). */}
      <div className="mb-4 h-4">
        {mounted && isFetching && !isError && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{tCommon('updating')}</span>
          </div>
        )}
      </div>

      {/* Unified "live now" card: current wait + status + KI accuracy as the header, with today's
          "Wartezeiten heute" bar chart in the same box right below — the value and the chart read
          as one unit. The header paints immediately from the live poll; the chart fills in once the
          (deduped) detail fetch lands. */}
      <Card className="mb-8 gap-0 overflow-hidden p-0">
        <AttractionLivePanel
          waitTime={
            status === 'OPERATING' && !isParkClosed && mainQueue && 'waitTime' in mainQueue
              ? ((mainQueue as StandbyQueue).waitTime ?? null)
              : null
          }
          status={status}
          statusIcon={StatusIcon}
          statusLabel={config.label}
          trend={attraction.trend ?? undefined}
          minWaitToday={calculatedMinWaitToday}
          maxWaitToday={calculatedMaxWaitToday}
          timezone={park.timezone}
          lastUpdated={mainQueue?.lastUpdated}
          predictionAccuracy={effectivePredictionAccuracy}
          accuracyLabel={
            effectivePredictionAccuracy
              ? t(ACCURACY_BADGE_KEYS[effectivePredictionAccuracy.badge])
              : undefined
          }
          labels={{
            waitTime: t('waitTime'),
            minutes: tCommon('minutes'),
            status: tCommon('status'),
            updated: tCommon('updated'),
            todayMin: t('todayChart.todayMin'),
            todayMax: t('todayChart.todayMax'),
            min: t('todayChart.min'),
            predictionAccuracy: t('predictionAccuracy'),
            trendLabel: attraction.trend
              ? tCommon(attraction.trend.toLowerCase() as string)
              : undefined,
          }}
        />

        {/* Today's wait-time bar chart — same card, divided from the header. */}
        {!mounted || isDetailLoading ? (
          <div className="border-border/60 space-y-3 border-t p-4 sm:p-6">
            <Skeleton className="h-6 w-44 max-w-full" />
            <Skeleton className="h-28 w-full rounded-lg sm:h-32" />
          </div>
        ) : hasTodayChart ? (
          <div className="border-border/60 border-t p-4 sm:p-6">
            <DailyWaitTimeChartClient
              history={detail!.history}
              hourlyForecast={detail!.hourlyForecast}
              timezone={park.timezone}
              schedule={detail!.schedule}
              bestVisitTimes={detail!.bestVisitTimes ?? attraction.bestVisitTimes}
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
        ) : null}
      </Card>

      {/* Other Queue Types */}
      {attraction.queues && attraction.queues.length > 1 && (
        <section className="mb-8">
          <SectionHeading icon={Layers} title={t('otherQueues')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attraction.queues
              .filter((q) => q.queueType !== 'STANDBY')
              .map((queue, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
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
                    <div className="mb-2">
                      <QueueTypeBadge queue={queue} timezone={park.timezone} />
                    </div>
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
                      return (
                        <div className="mb-2">
                          <TrendPill direction={direction} delta={delta} />
                        </div>
                      );
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
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>
      )}
    </>
  );
}
