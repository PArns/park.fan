'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, Loader2, Sparkles, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { TrendPill } from '@/components/parks/trend-pill';
import { PANEL_CELL, PanelGrid, PanelMetric } from '@/components/parks/park-panel-cell';
import { formatPeakDate } from '@/components/parks/attraction-typical-waits';
import { ParkTimeRange } from '@/components/common/park-time';
import { LocalTime } from '@/components/ui/local-time';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { formatTime } from '@/lib/utils/intl-format';
import { getStandbyWait } from '@/lib/utils/park-utils';
import { roundWaitTo5, shortTermWaitTrend } from '@/lib/utils/wait-time';
import { cn } from '@/lib/utils';
import type {
  AccuracyBadge,
  AttractionStatus,
  ParkAttraction,
  ParkWithAttractions,
  ScheduleItem,
  TypicalWaitBucket,
} from '@/lib/api/types';

/** Best-visit rows the panel ever draws — the same shape as the park panel's show column. */
const SLOT_ROWS = 3;

const ACCURACY_BADGE_CLASS: Record<AccuracyBadge, string> = {
  excellent: 'bg-status-operating/15 text-status-operating',
  good: 'bg-status-operating/15 text-status-operating',
  fair: 'bg-status-down/15 text-status-down',
  poor: 'bg-destructive/15 text-destructive',
  insufficient_data: 'bg-muted text-muted-foreground',
};

interface RideNowPanelProps {
  park: ParkWithAttractions;
  attraction: ParkAttraction;
  /** The ride's effective status, already resolved against the park's — see the ride page. */
  status: AttractionStatus;
  statusLabel: string;
  /**
   * Today in the PARK's timezone (`yyyy-MM-dd`), resolved on the server.
   *
   * It exists so the typical/busy pair can be picked during the SERVER render. Derived from the
   * browser clock it was `null` until mount, so the two figures a „typische Wartezeit Taron"
   * query is about rendered as em dashes in the served HTML and only appeared for a visitor with
   * JavaScript. This route is `force-dynamic`, so the server clock costs nothing here.
   */
  todayIso: string;
  /**
   * How many best-visit slots the SERVER render saw, for the column's row reservation.
   *
   * Separate from `attraction.bestVisitTimes` because that field is overlaid by the live merge —
   * see `slotSlots` below for what reading the merged one did to the fold.
   */
  shellSlotCount: number;
  /** Today's schedule row for the park, from the client detail fetch. */
  todaySchedule?: ScheduleItem | null;
  /** A background poll is in flight. */
  isRefreshing?: boolean;
}

/**
 * „Heute an dieser Bahn" — the ride page's fold, and the park header panel's twin.
 *
 * The ride page used to answer the same four questions the park panel answers, in four places
 * spread down the page: the live wait sat in a card under the first chapter heading, the park's
 * own hours were nowhere at all, the best hours of the day were a caption under a bar chart 400 px
 * further down, and what the queue typically costs was a card in the chapter after that. A visitor
 * had to assemble it, on the page they arrive at from a search for „<ride> Wartezeit".
 *
 * It is deliberately the same object as {@link ParkTodayPanel}: the same header strip with the
 * live dot and the clock, the same {@link PanelGrid} of hairline-ruled columns, the same
 * {@link PanelMetric} captions. Two pages one click apart used to open with a dense four-column
 * panel and with a rounded row of four empty tiles.
 *
 * **Geometry comes from the shell, content from the poll** — the rule the park panel is built on,
 * and the reason the columns are counted rather than written down. Whether this ride has typical
 * waits and whether it has best-visit slots is decided by the server-rendered snapshot and cannot
 * change under the reader; the values inside those columns move on the 5-minute poll and the rows
 * that hold them do not.
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

  const browserNow = useBrowserNow(60_000);
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
   * The queue's short-term movement — arrow and figure from ONE derivation.
   *
   * `shortTermWaitTrend` is `AttractionCard`'s, so the panel and the ride's own card on the park
   * page cannot disagree. This used to take its direction from `attraction.trend` (the API's
   * reading) and its number from today's second half against its first, which is a different
   * question: at 18:00 a queue reading 70, 70, 55, 50 drew a falling arrow next to `+30 min`.
   */
  const trend = useMemo(() => shortTermWaitTrend(history), [history]);

  /**
   * Today's typical pair, from the ride's own weekday rather than the weekday/weekend average.
   *
   * Read off `todayIso` and not off the browser clock, so it is in the served HTML — see the prop.
   * Reading the day back as UTC midnight cannot drift across a DST boundary the way a local
   * `new Date(y, m, d)` can.
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
   * Rows the slot column reserves.
   *
   * From `shellSlotCount`, which the server render measured, and NOT from `attraction` — that one
   * is the merged object, and `useLiveAttractionData` overlays `bestVisitTimes` from the detail
   * response. Six of Phantasialand's forty rides ship an empty list in the park payload and get
   * two slots from the detail endpoint, so reading it here made `columnCount` go 2 → 3 about
   * 300 ms in: a whole `PANEL_CELL` appearing under the h1, in the fold. It must not shrink as
   * the day's slots pass either, which is why it is not `slots.length`.
   */
  const slotSlots = Math.min(SLOT_ROWS, shellSlotCount);

  const accuracy = attraction.predictionAccuracy;
  const cell = PANEL_CELL;
  const columnCount = 2 + (slotSlots > 0 ? 1 : 0) + (attraction.typicalWaits?.displayable ? 1 : 0);

  return (
    <>
      {/* The header strip: what this panel is, and the clock it is true at. Same anatomy as the
        park panel's, down to the static dot — an `animate-pulse` inside a `backdrop-filter` box
        dirties its region every frame and costs the card a repaint, which is what made the park
        header flicker. */}
      {/* 46 px = `py-3` over the tallest thing the row can hold, which is the accuracy badge
        (16 px of `text-xs` + `py-0.5` + its 1 px borders = 22) rather than the 20 px heading. The
        badge is not in the shell — `leanParkForShell` strips `predictionAccuracy`, so it arrives
        with the client detail fetch — and without the reservation its arrival moved this row, the
        card, and the whole page under it by two pixels. */}
      <div className="border-border/50 flex min-h-[46px] items-center gap-3 border-b px-5 py-3">
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isOperating ? 'bg-status-operating' : 'bg-muted-foreground/40'
            )}
            aria-hidden="true"
          />
          {/* „Wartezeit jetzt" and not a „Heute an dieser Bahn" of its own, for the query this
            page is written for. The chapter that used to carry this h2 sat under the fold and has
            become „Wartezeiten heute" (the chart); putting the keyword back on the heading
            directly above the number is the stronger placement of the two, and the page keeps
            both headings rather than trading one for the other. */}
          <h2 className="text-[13px] font-bold tracking-[0.06em] uppercase">
            {t('sectionLiveNow')}
          </h2>
        </div>

        {accuracy && (
          <Tooltip>
            <TooltipTrigger className="min-w-0 cursor-default">
              <Badge className={cn('gap-1.5', ACCURACY_BADGE_CLASS[accuracy.badge])}>
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {/* „Gut" on its own says nothing about what is good. The prefix names it where
                  there is room and goes below `sm`, where the row also carries the clock — the
                  same split the park panel's weather reading uses. A truncated „KI-Genauigk…"
                  would be worse than the bare grade. */}
                <span className="hidden sm:inline">{t('predictionAccuracy')}:</span>
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
            {formatTime(browserNow, locale, {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: timezone,
            })}
            {tCommon('timeSuffix')} · {tParks('localTime')}
          </span>
        )}
      </div>

      <div className="overflow-hidden">
        <PanelGrid columnCount={columnCount}>
          {/* ── Wartezeit ── */}
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
              {mainQueue?.lastUpdated && (
                <span className="text-muted-foreground text-xs">
                  {tCommon('updated')}{' '}
                  <LocalTime time={mainQueue.lastUpdated} timeZone={timezone} />
                </span>
              )}
            </div>
          </div>

          {/* ── Heute ── */}
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
              {/* Today's high-water mark and when it fell. NOT the park's crowd level, which is
                the one reading on this page that would have been stale rather than old: the ride
                poll overlays the park's `status` and nothing else, so `currentLoad` would still
                hold whatever the day-cached shell fetch was written with. */}
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

            {/* The park's own day, under the ride's. A ride's queue is only half the answer to
              „soll ich jetzt hin" — the other half is whether the park is still open, and the
              ride page never said. Reserved at two lines because the schedule arrives with the
              client detail fetch. */}
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

          {/* ── Beste Zeiten heute ── */}
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

          {/* ── Typisch ── */}
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
                    // Never the raw field: it is `yyyy-MM-dd`, and it rendered as „Rekord 135 Min
                    // · 2026-07-16" beside a card two chapters down saying „16. Juli 2026".
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
