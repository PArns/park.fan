'use client';

import { useMemo } from 'react';
import {
  Ban,
  CalendarClock,
  CalendarX2,
  Check,
  CloudRain,
  Coins,
  Info,
  Scale,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import type { CalendarDay } from '@/lib/api/types';
import type { PlannerGeo } from '@/lib/planner/types';
import { PlanDayButtonLazy } from '@/components/planner/plan-day-button-lazy';
import { usePlannerDayFacts } from '@/lib/planner/use-day-facts';
import {
  compareDays,
  type DayComparison,
  type DayComparisonReason,
  type DayComparisonSide,
} from '@/lib/parks/day-comparison';
import { CROWD_TEXT_CLASS, type ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { getNumberFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DialogHero } from '@/components/common/dialog-hero';

/** One icon per reason row, so the rows are scannable before they are read. */
const REASON_ICON = {
  crowd: Users,
  wait: CalendarClock,
  hours: CalendarClock,
  weather: CloudRain,
  holiday: CalendarX2,
  price: Coins,
} as const;

/** Props of the two-day comparison dialog. */
export interface ParkCalendarComparisonProps {
  /** The first day picked. `null` closes the dialog — see `open`. */
  a: CalendarDay | null;
  b: CalendarDay | null;
  parkTimezone: string;
  /** `YYYY-MM-DD` in the PARK's zone. Decides what counts as already past. */
  todayIso: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where the two „Diesen Tag planen" buttons file their day. */
  planner: { parkSlug: string; parkName: string; geo: PlannerGeo };
}

/**
 * Two calendar days side by side, with the verdict on top. The arithmetic lives in
 * `lib/parks/day-comparison.ts`; this file turns its keys and numbers into ICU messages.
 *
 * Header cards, reason rows and plan buttons share one `grid-cols-2`, so a value on the left is day
 * A at every width. What stacks on a phone is each row: its label sits above its two values.
 */
export function ParkCalendarComparison({
  a,
  b,
  parkTimezone,
  todayIso,
  open,
  onOpenChange,
  planner,
}: ParkCalendarComparisonProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  /**
   * The dates in the reader's word order. A `date-fns` pattern like `'EEEE, d. MMMM'` is German
   * word order with translated words; `Intl.DateTimeFormat` uses the order of each locale.
   */
  const fmt = useMemo(
    () => ({
      full: new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
      weekday: new Intl.DateTimeFormat(locale, { weekday: 'long' }),
      date: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }),
      short: new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
      }),
    }),
    [locale]
  );

  /**
   * How far ahead the planner can plan: the best-days snapshot's rolling 90 days. The wizard's date
   * step disables later days, and this path skips that step, so the check happens before the offer.
   *
   * Until the answer arrives the button waits on `pending`, not `loading`: `isFetching` is false in
   * the `useLoadLast` defer window and true on a background refetch. Settled at `null` (the request
   * failed) the button stays, as the date step treats a missing max as no max.
   */
  const { lastDate: plannerHorizon, pending: horizonPending } = usePlannerDayFacts(
    { slug: planner.parkSlug, geo: planner.geo },
    open
  );

  const comparison: DayComparison | null = useMemo(
    () => (a && b ? compareDays(a, b, todayIso) : null),
    [a, b, todayIso]
  );

  if (!a || !b || !comparison) return null;

  // `T12:00`, not `parseISO(day.date)`: a bare `YYYY-MM-DD` parses as UTC midnight, which is the
  // previous day west of Greenwich. Midday is far from either boundary.
  const asDate = (day: CalendarDay) => new Date(`${day.date}T12:00:00`);
  /** „Dienstag, 10. November" — for the verdict sentence, which is prose. */
  const dayLabel = (day: CalendarDay) => fmt.full.format(asDate(day));
  /** „Di., 10.11." — for a blocker line, where the sentence does the naming. */
  const shortLabel = (day: CalendarDay) => fmt.short.format(asDate(day));
  /** The two halves of the column head, kept apart so neither has to be truncated. */
  const weekdayLabel = (day: CalendarDay) => fmt.weekday.format(asDate(day));
  const dateLabel = (day: CalendarDay) => fmt.date.format(asDate(day));

  /**
   * The sides the comparison itself has ruled out. The plan button reads this instead of
   * re-deriving "can this day be visited", so the dialog never recommends a day and then silently
   * refuses to plan it.
   */
  const blockedSides = new Set(
    comparison.blockers.flatMap((blocker) =>
      blocker.side === 'tie' ? (['a', 'b'] as const) : [blocker.side]
    )
  );

  const winner = comparison.better === 'a' ? a : comparison.better === 'b' ? b : null;
  /**
   * The headline. „Unentschieden" and „keiner von beiden" both come back as `better: 'tie'`; which
   * one applies depends on whether anything was comparable at all, since two past or two closed
   * days are not equally good days.
   */
  const verdict =
    blockedSides.size === 2
      ? t('dayComparison.resultUnavailable')
      : comparison.confidence === 'tie' || !winner
        ? t('dayComparison.resultTie')
        : comparison.confidence === 'clear'
          ? t('dayComparison.resultClear', { day: dayLabel(winner) })
          : t('dayComparison.resultSlight', { day: dayLabel(winner) });

  /**
   * The number a cell shows, rounded the way its unit is. The cell and the difference both read
   * this, so a row never ticks a winner between two cells that print the same figure.
   */
  const displayNumber = (reason: DayComparisonReason, value: number): number => {
    switch (reason.unit) {
      case 'minutes':
        return reason.key === 'hours' ? Math.round(value) : roundWaitTo5(value);
      case 'mm':
        return Math.round(value * 10) / 10;
      case 'currency':
        return Math.round(value);
      default:
        return value;
    }
  };

  /** The difference between the two cells AS SHOWN. Zero means the row has nothing to report. */
  const shownDelta = (reason: DayComparisonReason): number =>
    Math.abs(displayNumber(reason, reason.a) - displayNumber(reason, reason.b));

  /**
   * Whether this row marks a winner. Two cells that print the same thing do not, whatever the
   * floats say. The crowd row is exempt: its cells are level names, and `better` already compares
   * buckets.
   */
  const rowDecides = (reason: DayComparisonReason): boolean =>
    reason.better !== 'tie' && (reason.unit === 'bucket' || shownDelta(reason) > 0);

  /** A measurement in its row's own unit, as text. Keyed by SIDE, never by the value: two days
   *  with the same number would otherwise both be formatted as day A's. */
  const formatValue = (reason: DayComparisonReason, side: 'a' | 'b'): string => {
    const value = displayNumber(reason, side === 'a' ? reason.a : reason.b);
    switch (reason.unit) {
      case 'bucket': {
        // The bucket INDEX is `rankOf`'s input, not something to print: what the reader knows is
        // the level's name, which is the same word the tile they clicked wears.
        const day = side === 'a' ? a : b;
        if (day.status === 'CLOSED' || day.crowdLevel === 'closed') return tCommon('closed');
        const level = day.crowdLevel;
        return level && level !== 'unknown'
          ? t(`crowdLevels.${level as ColoredCrowdLevel}`)
          : t('crowdLevels.unknown');
      }
      case 'minutes':
        return reason.key === 'hours' ? formatDuration(value) : `${value} ${tCommon('min')}`;
      case 'mm':
        return t('dayComparison.unitMm', { value });
      case 'days':
        return t('dayComparison.unitFlags', { value });
      case 'currency':
        return formatWholeCurrency(value, locale, comparison.currency ?? 'EUR');
    }
  };

  const formatDuration = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    // Under an hour there is no hour to name, so no „0 Std. 30 Min.".
    if (h === 0) return `${m} ${tCommon('min')}`;
    return m === 0
      ? t('dayComparison.unitHours', { hours: h })
      : t('dayComparison.unitHoursMinutes', { hours: h, minutes: m });
  };

  /**
   * The difference in the row's unit, never a level name. Computed from {@link shownDelta}, so it
   * is always the subtraction of the two figures the reader sees.
   */
  const formatDelta = (reason: DayComparisonReason): string => {
    const delta = shownDelta(reason);
    switch (reason.unit) {
      case 'bucket':
        return t('dayComparison.unitSteps', { value: reason.delta });
      case 'minutes':
        return reason.key === 'hours' ? formatDuration(delta) : `${delta} ${tCommon('min')}`;
      case 'mm':
        return t('dayComparison.unitMm', { value: Math.round(delta * 10) / 10 });
      case 'days':
        return t('dayComparison.unitFlags', { value: delta });
      case 'currency':
        return formatWholeCurrency(delta, locale, comparison.currency ?? 'EUR');
    }
  };

  /**
   * Past the planner's ninety-day reach: a different refusal from a blocked day, and the ordinary
   * case for dates next spring. It gets a sentence rather than an empty cell, for the same reason
   * `blockedSides` exists.
   */
  const beyondPlanner = (day: CalendarDay): boolean =>
    !horizonPending && plannerHorizon !== null && day.date > plannerHorizon;

  /** Whether this day may be handed to the planner at all. */
  const plannable = (day: CalendarDay): boolean => {
    const side = day === a ? 'a' : 'b';
    if (blockedSides.has(side)) return false;
    if (day.status !== 'OPERATING' || day.date < todayIso) return false;
    // Nothing has come back yet: offering now would be offering before the check.
    if (horizonPending) return false;
    return !beyondPlanner(day);
  };

  const sideLabel = (side: DayComparisonSide) =>
    side === 'tie' ? t('dayComparison.bothDays') : shortLabel(side === 'a' ? a : b);

  const columnHead = (day: CalendarDay, side: 'a' | 'b') => {
    const wins = comparison.better === side && comparison.confidence !== 'tie';
    // The same three-way read as `park-calendar-day.tsx`: `status` and `crowdLevel` can disagree,
    // and "open or closed" alone labelled an open day with no forecast „Geschlossen".
    const isClosed = day.status === 'CLOSED' || day.crowdLevel === 'closed';
    const level = day.crowdLevel;
    const colored: ColoredCrowdLevel | null =
      !isClosed && level && level !== 'closed' && level !== 'unknown'
        ? (level as ColoredCrowdLevel)
        : null;
    return (
      <div
        className={cn(
          'flex min-w-0 flex-col gap-1 rounded-lg border p-3',
          wins ? 'border-primary/60 bg-primary/5' : 'border-border/60'
        )}
      >
        {/* Weekday and date on two lines: truncated to one, the label lost the month on a phone,
            and the month is what tells two days in different months apart. */}
        <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
          {weekdayLabel(day)}
        </span>
        <span className="text-sm font-semibold">{dateLabel(day)}</span>
        <span
          className={cn(
            'text-xs font-medium',
            colored ? CROWD_TEXT_CLASS[colored] : 'text-muted-foreground'
          )}
        >
          {isClosed
            ? tCommon('closed')
            : colored
              ? t(`crowdLevels.${colored}`)
              : t('crowdLevels.unknown')}
        </span>
        {wins && (
          <span className="text-primary mt-1 flex items-center gap-1 text-[11px] font-semibold">
            <Check className="size-3.5 shrink-0" aria-hidden="true" />
            {t('dayComparison.better')}
          </span>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The planner wizard's anatomy, since this dialog is one press away from it. Only the body
          scrolls, so the verdict and the two plan buttons hold still on a phone; `svh` keeps the
          buttons above a mobile browser's toolbar. */}
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        {/* The verdict is the description: it is the one sentence the dialog exists for.
            `whitespace-normal` because the band defaults to one truncating line. */}
        <DialogHero
          icon={Scale}
          title={t('dayComparison.title')}
          description={verdict}
          describesDialog
          descriptionClassName="text-foreground/90 font-medium whitespace-normal"
        />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-2">
            {columnHead(a, 'a')}
            {columnHead(b, 'b')}
          </div>

          {comparison.blockers.length > 0 && (
            <ul className="space-y-1.5">
              {comparison.blockers.map((blocker) => (
                <li
                  key={`${blocker.key}-${blocker.side}`}
                  className="text-muted-foreground bg-muted/40 flex items-start gap-2 rounded-md px-3 py-2 text-xs"
                >
                  <Ban className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="text-foreground font-medium">{sideLabel(blocker.side)}</span>
                    {' · '}
                    {t(
                      blocker.key === 'closed'
                        ? 'dayComparison.blockerClosed'
                        : blocker.key === 'past'
                          ? 'dayComparison.blockerPast'
                          : 'dayComparison.blockerNoForecast'
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {comparison.reasons.length === 0 ? (
            <p className="text-muted-foreground flex items-start gap-2 text-xs">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {t('dayComparison.noReasons')}
            </p>
          ) : (
            <ul className="space-y-3">
              {comparison.reasons.map((reason) => {
                const Icon = REASON_ICON[reason.key];
                return (
                  <li key={reason.key} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
                        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                        {t(`dayComparison.reason${capitalize(reason.key)}`)}
                      </span>
                      {/* The difference is a fact and shows wherever the two cells differ, even on
                          a row that names no winner. The tick below is the claim. */}
                      {shownDelta(reason) > 0 && (
                        <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                          {t('dayComparison.difference', { value: formatDelta(reason) })}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(['a', 'b'] as const).map((side) => (
                        <span
                          key={side}
                          className={cn(
                            'flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm tabular-nums',
                            rowDecides(reason) && reason.better === side
                              ? 'border-primary/40 bg-primary/5 text-foreground font-semibold'
                              : 'border-border/50 text-muted-foreground'
                          )}
                        >
                          {rowDecides(reason) && reason.better === side && (
                            <Check className="text-primary size-3.5 shrink-0" aria-hidden="true" />
                          )}
                          <span className="truncate">{formatValue(reason, side)}</span>
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* One button per column in the same grid, so the left button plans the left day, pinned
            like the wizard's own row. Only for a plannable day: `mode="wizard"` skips the date
            step, the only place a past or closed day is refused. An empty column keeps the other
            button under its own day. */}
        <div className="border-border/60 grid shrink-0 grid-cols-2 gap-2 border-t px-5 py-4">
          {([a, b] as const).map((day) =>
            !plannable(day) ? (
              // Not asked yet is not "cannot": while the snapshot is pending, `plannable` and
              // `beyondPlanner` are both false, and the last branch would show no button and no
              // reason.
              horizonPending ? (
                <p
                  key={day.date}
                  className="text-muted-foreground self-center text-[11px] leading-snug"
                >
                  {tCommon('loading')}
                </p>
              ) : beyondPlanner(day) ? (
                <p
                  key={day.date}
                  className="text-muted-foreground self-center text-[11px] leading-snug"
                >
                  {t('dayComparison.beyondPlanner')}
                </p>
              ) : (
                // Blocked, and the blocker list above already says why — a second copy of
                // „geschlossen" under the first would be the same sentence twice.
                <div key={day.date} aria-hidden="true" />
              )
            ) : (
              <PlanDayButtonLazy
                key={day.date}
                parkSlug={planner.parkSlug}
                parkName={planner.parkName}
                geo={planner.geo}
                date={day.date}
                timezone={parkTimezone}
                mode="wizard"
                // Tighter than the day dialog's instance: two share a phone-width row, and the
                // default padding pushed the label onto a third line.
                className="gap-1.5 px-2 text-xs max-sm:min-h-11 sm:text-sm"
                onPlanned={() => onOpenChange(false)}
              />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** `crowd` → `Crowd`, for the message key. Cheaper than a second lookup table that can drift. */
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** A price in whole units of the park's currency, for the price row's cells and its difference. */
function formatWholeCurrency(value: number, locale: string, currency: string): string {
  // `Intl.NumberFormat` throws a `RangeError` on an unknown currency, and this runs in render: a
  // bad code would take the whole dialog down. `compareDays` already refuses anything that is not
  // three letters; this is the second half of that guard.
  try {
    return getNumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${Math.round(value)} ${currency}`;
  }
}
