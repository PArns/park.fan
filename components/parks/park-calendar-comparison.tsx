'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { de, enUS, es, fr, it, nl } from 'date-fns/locale';
import { Ban, CalendarClock, CalendarX2, Check, CloudRain, Coins, Info, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import type { CalendarDay } from '@/lib/api/types';
import type { PlannerGeo } from '@/lib/planner/types';
import { PlanDayButtonLazy } from '@/components/planner/plan-day-button-lazy';
import {
  compareDays,
  type DayComparison,
  type DayComparisonReason,
  type DayComparisonSide,
} from '@/lib/parks/day-comparison';
import { CROWD_TEXT_CLASS, type ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DATE_LOCALES = { de, en: enUS, es, fr, it, nl } as const;

/** One icon per reason row, so the rows are scannable before they are read. */
const REASON_ICON = {
  crowd: Users,
  wait: CalendarClock,
  hours: CalendarClock,
  weather: CloudRain,
  holiday: CalendarX2,
  price: Coins,
} as const;

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
 * Two calendar days, side by side, with the verdict on top.
 *
 * The arithmetic is entirely in `lib/parks/day-comparison.ts` and none of it is here: this file
 * turns keys and numbers into a sentence and six rows. That split is what lets the rules be
 * tested without a DOM, and it is why there is no model anywhere near this — every sentence below
 * is an ICU message with a measured number in it, the same shape `planner-fit-assistant.tsx`
 * uses.
 *
 * **The two columns are the layout, all the way down.** Header cards, every reason row and the
 * two plan buttons all sit in the same `grid-cols-2`, so a value on the left is day A at every
 * height of the dialog — including at 360 px, where the alternative (stacking the two days) would
 * put the numbers being compared a screen apart, which is the thing the reader came here to stop
 * doing. What stacks instead is each ROW: its label and difference sit above its two values.
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
  const dateLocale = DATE_LOCALES[locale as keyof typeof DATE_LOCALES] ?? enUS;

  const comparison: DayComparison | null = useMemo(
    () => (a && b ? compareDays(a, b, todayIso) : null),
    [a, b, todayIso]
  );

  if (!a || !b || !comparison) return null;

  /** „Dienstag, 10. November" — for the verdict sentence, which is prose. */
  const dayLabel = (day: CalendarDay) =>
    format(parseISO(day.date), 'EEEE, d. MMMM', { locale: dateLocale });
  /** „Di., 10.11." — for a blocker line, where the sentence does the naming. */
  const shortLabel = (day: CalendarDay) =>
    format(parseISO(day.date), 'EE, d.M.', { locale: dateLocale });
  /** The two halves of the column head, kept apart so neither has to be truncated. */
  const weekdayLabel = (day: CalendarDay) =>
    format(parseISO(day.date), 'EEEE', { locale: dateLocale });
  const dateLabel = (day: CalendarDay) =>
    format(parseISO(day.date), 'd. MMMM', { locale: dateLocale });

  const winner = comparison.better === 'a' ? a : comparison.better === 'b' ? b : null;
  const verdict =
    comparison.confidence === 'tie' || !winner
      ? t('dayComparison.resultTie')
      : comparison.confidence === 'clear'
        ? t('dayComparison.resultClear', { day: dayLabel(winner) })
        : t('dayComparison.resultSlight', { day: dayLabel(winner) });

  /**
   * The number a cell actually shows, rounded the way that unit is rounded.
   *
   * Both the cell and the difference read from this, and that is the point: waits of 30 and 32.4
   * both print „30 Min", and a difference taken from the RAW values then printed „Unterschied:
   * 0 Min" beside a ticked cell — a row contradicting itself in three words. A row says one thing
   * or it says nothing, so the comparison the reader can SEE is the one that decides both.
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
   * Whether this row marks a winner at all.
   *
   * A row whose two cells print the same thing does not, however the underlying floats compare —
   * a tick with no visible difference beside it reads as a bug, and at this precision the two days
   * really are the same. The crowd row is exempt: its cells are level NAMES, and `better` there is
   * already a comparison of whole buckets.
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
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: comparison.currency ?? 'EUR',
          maximumFractionDigits: 0,
        }).format(value);
    }
  };

  const formatDuration = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    // Under an hour there is no hour to name: a half-hour difference between two opening spans
    // read „0 Std. 30 Min." before this branch existed.
    if (h === 0) return `${m} ${tCommon('min')}`;
    return m === 0
      ? t('dayComparison.unitHours', { hours: h })
      : t('dayComparison.unitHoursMinutes', { hours: h, minutes: m });
  };

  /**
   * The difference, in the row's unit — never a level name, which has no arithmetic.
   *
   * Computed from {@link shownDelta}, i.e. from the two numbers the cells print, so „Unterschied"
   * is always the subtraction the reader can do themselves on the two figures beside it.
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
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: comparison.currency ?? 'EUR',
          maximumFractionDigits: 0,
        }).format(delta);
    }
  };

  const sideLabel = (side: DayComparisonSide) =>
    side === 'tie' ? t('dayComparison.bothDays') : shortLabel(side === 'a' ? a : b);

  const columnHead = (day: CalendarDay, side: 'a' | 'b') => {
    const wins = comparison.better === side && comparison.confidence !== 'tie';
    // The same three-way read `park-calendar-day.tsx` does, and for the same reason: `status` and
    // `crowdLevel` are two fields that can disagree. Collapsing them into „open or closed" labelled
    // an OPEN day with no forecast as „Geschlossen" — while the tile it was picked from said
    // „Keine Prognose" — and would have dressed a shut day in a stale crowd tier.
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
        {/* Weekday and date on two lines rather than one truncated one: at 390 px a column is
            about 145 px and „Samstag, 10. Oktober" came out as „Samstag, 10. Ok…", which loses the
            month — the half of the label that says WHICH day this is when the two are in different
            months, which is the case this whole screen exists for. */}
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
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-border/60 border-b p-5 pb-4 text-left">
          <DialogTitle className="text-base sm:text-lg">{t('dayComparison.title')}</DialogTitle>
          {/* The verdict IS the description, not a line under one: it is the single sentence the
              whole dialog exists to produce, and burying it under a generic subtitle would put
              the answer third. */}
          <DialogDescription className="text-foreground text-sm font-medium">
            {verdict}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-5">
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
                      {rowDecides(reason) && (
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

          {/* One button per column, in the same grid as everything above it, so „links planen"
              plans the day whose figures are on the left. `mode="wizard"`: both questions the
              first two steps ask have just been answered on this screen.

              Only for a day that can actually be planned, and here that guard carries more weight
              than it does in the day dialog it is copied from (`park-calendar-day-detail.tsx`):
              `mode="wizard"` skips the date step, and the date step is the ONLY place a date is
              validated — `PlannerMonthCalendar` refuses a past or closed day. Without this, a
              button sitting directly under „Der Park ist an diesem Tag geschlossen" would file
              that day into the persisted plan. The column is held open rather than collapsed, so
              the remaining button stays under the day it belongs to. */}
          <div className="grid grid-cols-2 gap-2">
            {([a, b] as const).map((day) =>
              day.status !== 'OPERATING' || day.date < todayIso ? (
                <div key={day.date} aria-hidden="true" />
              ) : (
                <PlanDayButtonLazy
                  key={day.date}
                  parkSlug={planner.parkSlug}
                  parkName={planner.parkName}
                  geo={planner.geo}
                  date={day.date}
                  timezone={parkTimezone}
                  mode="wizard"
                  // Tighter than the day dialog's full-width instance: two of these share a row
                  // 390 px wide, where the default padding and gap pushed the label onto a third
                  // line.
                  className="gap-1.5 px-2 text-xs max-sm:min-h-11 sm:text-sm"
                  onPlanned={() => onOpenChange(false)}
                />
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** `crowd` → `Crowd`, for the message key. Cheaper than a second lookup table that can drift. */
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
