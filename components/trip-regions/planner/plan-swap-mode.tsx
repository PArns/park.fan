'use client';

import { useEffect, useId, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeftRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatParkDay } from '@/lib/utils/park-day';
import { formatClockTime, getNumberFormat } from '@/lib/utils/intl-format';
import { dayLockTarget, isSpareDay, type PlanDay, type TripPlan } from '@/lib/trip-regions/plan';
import {
  calendarCell,
  shownDayWait,
  swapPreview,
  swapTargets,
  type SwapPreview,
} from '@/lib/trip-regions/plan-week';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';

/**
 * „Tauschen“ on a day card: a band that says what is swapped and how to read the list, the day as
 * it is, and every day of its city it can trade with. Each target says what it holds now and what
 * the trade does in the parks' own figures, never the plan's mean: „DisneySea 105 Min. (+5)“, for
 * a park day also the park that comes back („Tokyo Disneyland dafür am Di.: 60 Min. (±0)“), for a
 * free day where it goes. The quietest is marked, a short day carries its closing time, the same
 * park and a closed day cannot be picked.
 */
export function PlanSwapMode({
  day,
  plan,
  calendar,
  onPick,
  onClose,
}: {
  day: PlanDay;
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onPick: (other: PlanDay) => void;
  onClose: () => void;
}) {
  const t = useTranslations('tripPlanner');
  const { locale, timeZone, parkName } = usePlanContext();
  const titleId = useId();
  const titleRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => titleRef.current?.focus({ preventScroll: false }), [day.date]);

  const mine = dayLockTarget(day);
  const park = mine && mine !== 'rest' ? parkName(mine) : t('day.rest');
  const weekday = (date: string) => formatParkDay(locale, date, { weekday: 'short' });
  const date = (d: string) => formatParkDay(locale, d, { day: 'numeric', month: 'short' });
  const signed = getNumberFormat(locale, { signDisplay: 'always' });
  const delta = (n: number) => (n === 0 ? '±0' : signed.format(n));
  const wait = shownDayWait(day, calendar);

  const rows = swapTargets(plan, day).map((other) => {
    const theirs = dayLockTarget(other);
    const preview = swapPreview(calendar, day, other, timeZone);
    return { other, theirs, preview, same: theirs === mine };
  });
  const figureOf = (p: SwapPreview, slug: string | null) =>
    p.kind === 'minutes' ? (p.parks.find((f) => f.slug === slug) ?? null) : null;
  const quietest = rows
    .filter((r) => !r.same && r.preview.kind === 'minutes')
    .map((r) => ({ date: r.other.date, away: figureOf(r.preview, mine)?.away ?? Infinity }))
    .sort((a, b) => a.away - b.away)[0]?.date;

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-2 lg:col-span-2"
      data-plan-swap-mode=""
    >
      <div className="bg-primary text-primary-foreground flex items-start gap-3 rounded-2xl px-4 py-3">
        <ArrowLeftRight className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col">
          <p
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
            className="text-sm font-semibold outline-none"
          >
            {t('edit.swapMode.title', { park })}
          </p>
          <p className="text-xs opacity-90">{t('edit.swapMode.hint', { park })}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('edit.swapMode.close')}
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 lg:size-9',
            PLAN_FOCUS
          )}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="border-primary/60 bg-card rounded-xl border-2 px-4 py-3 text-sm">
        <p className="text-muted-foreground text-xs">
          {weekday(day.date)} {date(day.date)} · {t('edit.swapMode.now')}
        </p>
        <p className="font-semibold">{park}</p>
        {wait != null && <p className="text-xs">{t('peakWait', { minutes: wait })}</p>}
      </div>

      <ul className="flex flex-col gap-1.5">
        {rows.map(({ other, theirs, preview, same }) => {
          const minePark = figureOf(preview, mine);
          const theirPark = figureOf(preview, theirs);
          const now = isSpareDay(other)
            ? t('edit.swapMode.nowFree')
            : theirs === 'rest'
              ? t('edit.swapMode.nowRest')
              : t('edit.swapMode.nowPark', { park: parkName(theirs ?? '') });
          // A short day the trade puts this park on, said with its closing time.
          const closes =
            preview.kind === 'minutes' && preview.short?.slug === mine && mine
              ? calendarCell(calendar, mine, other.date)?.closesAt
              : undefined;
          const disabled = same || preview.kind === 'closed';
          return (
            <li key={other.date}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(other)}
                className={cn(
                  'bg-card hover:bg-accent/40 flex min-h-11 w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-50',
                  quietest === other.date ? 'border-primary/60' : 'border-border/60',
                  PLAN_FOCUS
                )}
              >
                <span className="flex w-14 shrink-0 flex-col text-xs tabular-nums">
                  <span className="text-muted-foreground">{weekday(other.date)}</span>
                  <span className="font-semibold">{date(other.date)}</span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {same ? (
                    <span className="text-muted-foreground text-xs">
                      {t('edit.swapMode.same', { park })}
                    </span>
                  ) : (
                    <>
                      <span className="text-muted-foreground text-xs">{now}</span>
                      {preview.kind === 'closed' ? (
                        <span>{t('swap.closed', { park: parkName(preview.slug) })}</span>
                      ) : preview.kind === 'no_figure' ? (
                        <span>{t('swap.noFigure')}</span>
                      ) : (
                        minePark && (
                          <span className="tabular-nums">
                            {t.rich('edit.swapMode.figure', {
                              park,
                              minutes: minePark.away,
                              delta: delta(minePark.away - minePark.here),
                              strong: (chunks) => <strong>{chunks}</strong>,
                            })}
                          </span>
                        )
                      )}
                      {theirPark && (
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {t('edit.swapMode.theirs', {
                            park: parkName(theirPark.slug),
                            day: weekday(day.date),
                            minutes: theirPark.away,
                            delta: delta(theirPark.away - theirPark.here),
                          })}
                        </span>
                      )}
                      {(isSpareDay(other) || theirs === 'rest') && (
                        <span className="text-muted-foreground text-xs">
                          {t(
                            isSpareDay(other)
                              ? 'edit.swapMode.spareMoves'
                              : 'edit.swapMode.restMoves',
                            {
                              day: weekday(day.date),
                            }
                          )}
                        </span>
                      )}
                    </>
                  )}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {quietest === other.date && (
                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
                      {t('edit.swapMode.quietest')}
                    </span>
                  )}
                  {closes && (
                    <span className="bg-crowd-high/12 text-crowd-ink-high rounded-full px-2 py-0.5 text-[11px]">
                      {t('edit.swapMode.closes', {
                        time: formatClockTime(closes, locale, timeZone),
                      })}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
