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

  /** A measurement in its row's own unit, as text. Keyed by SIDE, never by the value: two days
   *  with the same number would otherwise both be formatted as day A's. */
  const formatValue = (reason: DayComparisonReason, side: 'a' | 'b'): string => {
    const value = side === 'a' ? reason.a : reason.b;
    switch (reason.unit) {
      case 'bucket': {
        // The bucket INDEX is `rankOf`'s input, not something to print: what the reader knows is
        // the level's name, which is the same word the tile they clicked wears.
        const level = (side === 'a' ? a : b).crowdLevel;
        return level && level !== 'closed' && level !== 'unknown'
          ? t(`crowdLevels.${level as ColoredCrowdLevel}`)
          : t('crowdLevels.unknown');
      }
      case 'minutes':
        return reason.key === 'hours'
          ? formatDuration(value)
          : `${roundWaitTo5(value)} ${tCommon('min')}`;
      case 'mm':
        return t('dayComparison.unitMm', { value: Math.round(value * 10) / 10 });
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
    return m === 0
      ? t('dayComparison.unitHours', { hours: h })
      : t('dayComparison.unitHoursMinutes', { hours: h, minutes: m });
  };

  /** The difference, in the row's unit — never a level name, which has no arithmetic. */
  const formatDelta = (reason: DayComparisonReason): string => {
    switch (reason.unit) {
      case 'bucket':
        return t('dayComparison.unitSteps', { value: reason.delta });
      case 'minutes':
        return reason.key === 'hours'
          ? formatDuration(reason.delta)
          : `${roundWaitTo5(reason.delta)} ${tCommon('min')}`;
      case 'mm':
        return t('dayComparison.unitMm', { value: Math.round(reason.delta * 10) / 10 });
      case 'days':
        return t('dayComparison.unitFlags', { value: reason.delta });
      case 'currency':
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: comparison.currency ?? 'EUR',
          maximumFractionDigits: 0,
        }).format(reason.delta);
    }
  };

  const sideLabel = (side: DayComparisonSide) =>
    side === 'tie' ? t('dayComparison.bothDays') : shortLabel(side === 'a' ? a : b);

  const columnHead = (day: CalendarDay, side: 'a' | 'b') => {
    const wins = comparison.better === side && comparison.confidence !== 'tie';
    const level = day.crowdLevel;
    const colored: ColoredCrowdLevel | null =
      level && level !== 'closed' && level !== 'unknown' ? (level as ColoredCrowdLevel) : null;
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
          {colored ? t(`crowdLevels.${colored}`) : tCommon('closed')}
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
                      {reason.better !== 'tie' && (
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
                            reason.better === side
                              ? 'border-primary/40 bg-primary/5 text-foreground font-semibold'
                              : 'border-border/50 text-muted-foreground'
                          )}
                        >
                          {reason.better === side && (
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
              first two steps ask have just been answered on this screen. */}
          <div className="grid grid-cols-2 gap-2">
            {([a, b] as const).map((day) => (
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
            ))}
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
