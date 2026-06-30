'use client';

import { useLiveAttractionData } from '@/lib/hooks/use-live-attraction-data';
import { useAttractionDetail } from '@/lib/hooks/use-attraction-detail';
import { AlertCircle, Loader2, Clock, AlertTriangle, Wrench, XCircle, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeading } from '@/components/common/section-heading';
import { AttractionLivePanel } from '@/components/parks/attraction-live-panel';
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

  // Prediction accuracy lives in the attraction *detail* (stripped from the live park poll). It's
  // fetched client-side via the CDN-cached detail route — shared (deduped) with the daily chart's
  // <AttractionHistorySections> through React Query's query key, so this adds no extra request.
  const { data: detail } = useAttractionDetail({
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

      {mounted && isFetching && !isError && (
        <div className="text-muted-foreground mb-4 flex items-center gap-2 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>{tCommon('updating')}</span>
        </div>
      )}

      {/* Live now — compact hero panel (wait time + status + KI accuracy) */}
      <div className="mb-8">
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
          sparklineHistory={attraction.statistics?.history}
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
      </div>

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
                    {'waitTime' in queue && queue.waitTime !== null && (
                      <p className="text-2xl font-bold">
                        {queue.waitTime} <span className="text-muted-foreground text-sm">min</span>
                      </p>
                    )}
                    {'returnStart' in queue &&
                      queue.returnStart &&
                      'returnEnd' in queue &&
                      queue.returnEnd && (
                        <p className="text-muted-foreground text-sm">
                          {t('returnTime')}:{' '}
                          <LocalTime time={queue.returnStart || ''} timeZone={park.timezone} /> -{' '}
                          <LocalTime time={queue.returnEnd || ''} timeZone={park.timezone} />
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
