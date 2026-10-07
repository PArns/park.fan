'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, Loader2, Sparkles, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { TrendPill } from '@/components/parks/trend-pill';
import { OutageNote } from '@/components/parks/outage-note';
import { RideOpensAtNote } from '@/components/parks/ride-opens-at-note';
import { PANEL_CELL, PanelGrid, PanelMetric } from '@/components/parks/park-panel-cell';
import { formatPeakDate } from '@/components/parks/attraction-typical-waits';
import { ParkTimeRange } from '@/components/common/park-time';
import { LocalTime } from '@/components/ui/local-time';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMinuteNowDate } from '@/lib/hooks/use-minute-now';
import { formatTime } from '@/lib/utils/intl-format';
import { getStandbyWait } from '@/lib/utils/park-utils';
import { roundWaitTo5, shortTermWaitTrend } from '@/lib/utils/wait-time';
import { accuracyStyle } from '@/lib/utils/accuracy-styles';
import { cn } from '@/lib/utils';
import type {
  AttractionStatus,
  ParkAttraction,
  ParkWithAttractions,
  ScheduleItem,
  TypicalWaitBucket,
} from '@/lib/api/types';

/** Best-visit rows the panel ever draws — the same shape as the park panel's show column. */
const SLOT_ROWS = 3;

interface RideNowPanelProps {
  park: ParkWithAttractions;
  attraction: ParkAttraction;
  /** The ride's effective status, already resolved against the park's — see the ride page. */
  status: AttractionStatus;
  statusLabel: string;
  /**
   * Today in the park's timezone (`yyyy-MM-dd`), resolved on the server, so the typical/busy pair
   * is in the served HTML rather than appearing after mount. The route is `force-dynamic`, so the
   * server clock costs nothing.
   */
  todayIso: string;
  /**
   * How many best-visit slots the server render saw, for the column's row reservation. Separate
   * from `attraction.bestVisitTimes`, which the live merge overlays (see `slotSlots`).
   */
  shellSlotCount: number;
  /** Today's schedule row for the park, from the client detail fetch. */
  todaySchedule?: ScheduleItem | null;
  /** A background poll is in flight. */
  isRefreshing?: boolean;
}

/**
 * „Heute an dieser Bahn": the ride page's fold and the twin of {@link ParkTodayPanel}, with the
 * same header strip, {@link PanelGrid} columns and {@link PanelMetric} captions. It answers on
 * arrival what a visitor otherwise assembled from the whole page: the live wait, the park's hours,
 * the best hours and the typical wait.
 *
 * Geometry comes from the shell, content from the poll: whether the ride has typical waits or
 * best-visit slots is decided by the server snapshot, and the 5-minute poll moves values, never
 * rows.
 */
export function RideNowPanel({
  park,
  attraction,
  status,
  statusLabel,
  todayIso,
  shellSlotCount,
  todaySchedule,
  isRefreshing,
}: RideNowPanelProps) {
  const t = useTranslations('attractions');
  const tCommon = useTranslations('common');
  const tParks = useTranslations('parks');
  const locale = useLocale();
  const timezone = park.timezone ?? 'UTC';

  const browserNow = useMinuteNowDate();
  const isOperating = status === 'OPERATING';
  const wait = isOperating ? getStandbyWait(attraction) : null;
  const mainQueue =
    attraction.queues?.find((q) => q.queueType === 'STANDBY') ?? attraction.queues?.[0];

  const stats = attraction.statistics;
  const history = stats?.history;
  const minToday = history?.length
    ? Math.min(...history.map((h) => h.waitTime))
    : (stats?.minWaitToday ?? null);
  const maxToday = history?.length
    ? Math.max(...history.map((h) => h.waitTime))
    : (stats?.maxWaitToday ?? null);

  /**
   * The queue's short-term movement, arrow and figure from one derivation (`shortTermWaitTrend`,
   * shared with `AttractionCard`), so the panel and the ride's card cannot disagree and the arrow
   * cannot point against its own number.
   */
  const trend = useMemo(() => shortTermWaitTrend(history), [history]);

  /**
   * Today's typical pair, from the ride's own weekday rather than the weekday/weekend average. Read
   * off `todayIso`, so it is in the served HTML, and parsed as UTC midnight, which cannot drift
   * across a DST boundary like a local `new Date(y, m, d)`.
   */
  const typicalToday = useMemo((): (TypicalWaitBucket & { isWeekend?: boolean }) | null => {
    const tw = attraction.typicalWaits;
    if (!tw?.displayable) return null;
    const dow = new Date(`${todayIso}T00:00:00Z`).getUTCDay(); // 0=Sun…6=Sat, as `byDayOfWeek` is
    const own = tw.byDayOfWeek?.find((d) => d.dayOfWeek === dow);
    if (own && (own.typical !== null || own.busy !== null)) return own;
    return dow === 0 || dow === 6 ? tw.weekend : tw.weekday;
  }, [attraction.typicalWaits, todayIso]);

  /** The next few recommended slots — the ones still ahead of the reader. */
  const slots = useMemo(() => {
    if (!browserNow) return [];
    const nowMs = browserNow.getTime();
    return (attraction.bestVisitTimes ?? [])
      .filter((s) => new Date(s.time).getTime() > nowMs)
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, SLOT_ROWS);
  }, [attraction.bestVisitTimes, browserNow]);

  /**
   * Rows the slot column reserves, from `shellSlotCount` and not from the merged `attraction`: the
   * live merge can add `bestVisitTimes` from the detail response, which made a whole column appear
   * in the fold after mount. Not `slots.length` either, which shrinks as the day's slots pass.
   */
  const slotSlots = Math.min(SLOT_ROWS, shellSlotCount);

  const accuracy = attraction.predictionAccuracy;
  const cell = PANEL_CELL;
  const columnCount = 2 + (slotSlots > 0 ? 1 : 0) + (attraction.typicalWaits?.displayable ? 1 : 0);

  return (
    <>
      {/* The header strip, with the park panel's static dot (an `animate-pulse` inside
          `backdrop-filter` repaints every frame). 47 px is `py-3` around the accuracy badge (22 px,
          taller than the heading) plus the 1 px `border-b`: the badge arrives with the client
          detail fetch and must not move the row. Below `sm` the row is one line and wraps only so a
          clock that does not fit drops to a second line that `overflow-hidden` cuts off. */}
      <div className="border-border/50 flex min-h-[47px] items-center gap-3 border-b px-5 py-3 max-sm:h-[47px] max-sm:flex-wrap max-sm:gap-y-3.5 max-sm:overflow-hidden">
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isOperating ? 'bg-status-operating' : 'bg-muted-foreground/40'
            )}
            aria-hidden="true"
          />
          {/* „Wartezeit jetzt" rather than a „Heute an dieser Bahn" heading: the query this page is
              written for belongs on the heading directly above the number. */}
          <h2 className="text-[13px] font-bold tracking-[0.06em] uppercase">
            {t('sectionLiveNow')}
          </h2>
        </div>

        {accuracy && (
          <Tooltip>
            <TooltipTrigger className="flex min-w-0 cursor-default max-sm:hidden">
              <Badge className={cn('gap-1.5', accuracyStyle(accuracy.badge).badge)}>
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {/* The whole badge goes below `sm`, where the row also carries the clock — the same
                  split the park panel's weather reading uses. A bare „Gut" says nothing about
                  what is good, and a truncated „KI-Genauigk…" is worse. */}
                <span>{t('predictionAccuracy')}:</span>
                <span className="truncate">{t(`accuracy.${accuracy.badge}`)}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[16rem] text-xs">
              {accuracy.message}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Guarded on the browser clock, not on the formatted string: the page is force-dynamic
          and rendering a time before mount is a hydration mismatch. The refetch spinner rides
          the same guard for the same reason. */}
        {browserNow && (
          <span className="text-muted-foreground ml-auto flex shrink-0 items-center gap-2 text-xs tabular-nums">
            {isRefreshing && (
              <Loader2 className="h-3 w-3 animate-spin" aria-label={tCommon('updating')} />
            )}
            <span>
              {formatTime(browserNow, locale, {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: timezone,
              })}
              {tCommon('timeSuffix')}
              <span className="max-sm:hidden"> · {tParks('localTime')}</span>
            </span>
          </span>
        )}
      </div>

      <div className="overflow-hidden">
        <PanelGrid columnCount={columnCount}>
          <div className={cell}>
            <PanelMetric caption={t('waitTime')}>
              <ParkStatusBadge status={status} />
            </PanelMetric>
            {/* Reserved at the number's own height whether or not there is a number: a ride that
              shuts mid-afternoon leaves a dash behind instead of collapsing the panel. */}
            <div className="flex min-h-[3.25rem] flex-col gap-1">
              {wait !== null ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl leading-none font-bold tabular-nums">
                    {roundWaitTo5(wait)}
                  </span>
                  <span className="text-muted-foreground text-base">{tCommon('minutes')}</span>
                  {trend && <TrendPill {...trend} className="ml-0.5" />}
                </div>
              ) : (
                <span className="text-xl font-semibold">{statusLabel}</span>
              )}
              {/* Inside the box reserved for the number, where a ride with no wait shows its
                  status: a DOWN ride is that case. The `full` block carries both estimate figures,
                  since this is the page a visitor opens standing in front of the ride. */}
              <OutageNote
                outage={attraction.outage}
                timezone={timezone}
                variant="full"
                className="my-1.5"
              />
              {status === 'CLOSED' && !attraction.outage && (
                <RideOpensAtNote
                  slug={attraction.slug}
                  notRunToday={attraction.notRunToday}
                  timezone={timezone}
                  variant="full"
                  className="my-1.5"
                />
              )}
              {mainQueue?.lastUpdated && (
                <span className="text-muted-foreground text-xs">
                  {tCommon('updated')}{' '}
                  <LocalTime time={mainQueue.lastUpdated} timeZone={timezone} />
                </span>
              )}
            </div>
          </div>

          <div className={cell}>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <PanelMetric caption={t('todayRange')}>
                <span className="text-lg font-bold tabular-nums">
                  {minToday !== null && maxToday !== null ? (
                    <>
                      {roundWaitTo5(minToday)}
                      <span className="text-muted-foreground mx-1 font-normal">–</span>
                      {roundWaitTo5(maxToday)}
                      <span className="text-muted-foreground ml-1 text-sm font-normal">
                        {tCommon('min')}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </span>
              </PanelMetric>
              {/* Today's high-water mark and when it fell. Not the park's crowd level: the ride
                  poll overlays only the park's `status`, so `currentLoad` would be stale. */}
              <PanelMetric caption={t('peakToday')}>
                {stats?.peakWaitToday != null ? (
                  <span className="text-lg font-bold tabular-nums">
                    {roundWaitTo5(stats.peakWaitToday)}
                    <span className="text-muted-foreground ml-1 text-sm font-normal">
                      {tCommon('min')}
                    </span>
                    {stats.peakWaitTimestamp && (
                      <span className="text-muted-foreground ml-1.5 text-sm font-normal">
                        <LocalTime time={stats.peakWaitTimestamp} timeZone={timezone} />
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </PanelMetric>
            </div>

            {/* The park's own day, under the ride's: whether the park is still open is the other
                half of „soll ich jetzt hin". Reserved at two lines because the schedule arrives
                with the client detail fetch. */}
            <div className="mt-auto flex min-h-[3.25rem] flex-col gap-1">
              <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {t('parkToday')}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <ParkStatusBadge status={park.status ?? 'CLOSED'} />
                {todaySchedule?.openingTime && todaySchedule.closingTime && (
                  <span className="text-sm font-semibold tabular-nums">
                    <ParkTimeRange
                      openingTime={todaySchedule.openingTime}
                      closingTime={todaySchedule.closingTime}
                      parkTimezone={timezone}
                      locale={locale}
                      showSuffix
                    />
                  </span>
                )}
              </div>
            </div>
          </div>

          {slotSlots > 0 && (
            <div className={cell}>
              <PanelMetric caption={t('bestTimesToday')} icon={Star}>
                <div className="relative">
                  {/* Nothing left today. Centred over the rows the column has already reserved
                    rather than written into the first of them — at the end of a day the other
                    rows are empty anyway, and one line at the top of a blank column reads as a
                    list that failed to load. */}
                  {browserNow && slots.length === 0 && (
                    <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-center text-sm">
                      {t('noBestTimesLeft')}
                    </div>
                  )}
                  <ul className="flex flex-col gap-1.5">
                    {Array.from({ length: slotSlots }, (_, i) => {
                      const slot = slots[i];
                      if (!slot) {
                        // The row is RESERVED, not drawn — it holds its height so the panel does
                        // not shrink as the day's slots pass.
                        return (
                          <li key={i} className="text-muted-foreground text-sm">
                            <span className="invisible" aria-hidden="true">
                              &mdash;
                            </span>
                          </li>
                        );
                      }
                      return (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="shrink-0 font-bold tabular-nums">
                            <LocalTime time={slot.time} timeZone={timezone} />
                          </span>
                          <span className="text-muted-foreground min-w-0 flex-1 truncate">
                            {t(
                              slot.rating === 'optimal'
                                ? 'todayChart.ratingOptimal'
                                : 'todayChart.ratingGood'
                            )}
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums">
                            {roundWaitTo5(slot.predictedWaitTime)} {tCommon('min')}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </PanelMetric>
              <a href="#plan" className="text-primary mt-auto text-left text-xs hover:underline">
                {t('sectionPlanVisit')}
              </a>
            </div>
          )}

          {attraction.typicalWaits?.displayable && (
            <div className={cell}>
              {/* No „basierend auf N Tagen" note here: the card in „Beste Besuchszeit planen"
                already carries the window, and at panel width it pushed the caption onto a second
                line in French and Italian. */}
              <PanelMetric caption={t('typicalToday')}>
                <div className="flex min-h-[3.25rem] flex-wrap gap-x-6 gap-y-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-2xl leading-none font-bold tabular-nums">
                      {typicalToday?.typical != null ? roundWaitTo5(typicalToday.typical) : '—'}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {t('typicalWaits.typical')}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-2xl leading-none font-bold tabular-nums">
                      {typicalToday?.busy != null ? roundWaitTo5(typicalToday.busy) : '—'}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {t('typicalWaits.busy')}
                    </span>
                  </div>
                </div>
              </PanelMetric>
              {attraction.typicalWaits.peak && (
                <p className="text-muted-foreground mt-auto text-xs">
                  {t('typicalWaits.peak', {
                    value: roundWaitTo5(attraction.typicalWaits.peak.value),
                    // Never the raw `yyyy-MM-dd` field: formatted like the card two chapters down.
                    date: formatPeakDate(attraction.typicalWaits.peak.date, locale),
                  })}
                </p>
              )}
            </div>
          )}
        </PanelGrid>
      </div>
    </>
  );
}
