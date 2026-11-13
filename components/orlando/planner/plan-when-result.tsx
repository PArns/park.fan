'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarCheck, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { CROWD_DOT_CLASS } from '@/lib/utils/crowd-level-styles';
import { formatParkDay, formatParkDayRange } from '@/lib/utils/park-day';
import { planWindow, type OrlandoPlanState } from '@/lib/orlando/plan';
import { climateChips } from '@/lib/orlando/plan-copy';
import {
  percentBelowAverage,
  rankedLower,
  weekInWindow,
  weekTiers,
  windowReasons,
  windowWarnings,
} from '@/lib/orlando/plan-when';
import type { TripWhen, TripWhenWindow } from '@/lib/orlando/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { usePlanContext, useTripEvents } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PLAN_WIDE_QUERY } from './plan-setup';
import { useSeasonName } from './use-day-facts';
import { ClimateChips } from './plan-day-bits';

/**
 * The When mode's answer, simple first. Level 0: the three best windows as cards, each with its
 * dates, the big rides' wait, how far below the period's average it lies and one reason; a window
 * on last year's days says so. Level 1: the year strip, a bar per week in crowd tints with the
 * windows marked, which a screen reader reads as a list of weeks and figures. Level 2: a window's
 * reasons, warnings, events and day-by-day sketch in a sheet. Level 3: "Plan these dates", which
 * sets the dates and leaves the search for the plan itself.
 */
export function PlanWhenResult({
  answer,
  onPlan,
}: {
  answer: TripWhen;
  onPlan: (next: (state: OrlandoPlanState) => OrlandoPlanState) => void;
}) {
  const t = useTranslations('orlandoPlanner.when');
  const { locale } = usePlanContext();
  const track = useTripEvents();
  const [open, setOpen] = useState<TripWhenWindow | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const details = (window: TripWhenWindow) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(window);
  };
  const windows = answer.windows;
  const range = (from: string, to: string) =>
    formatParkDayRange(locale, from, to, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const plan = (window: TripWhenWindow) => {
    track('trip_window_planned', { rank: window.rank });
    setOpen(null);
    onPlan((state) => planWindow(state, { from: window.from, to: window.to }));
  };

  if (windows.length === 0) {
    const periods = answer.meta.within?.periods ?? [];
    return (
      <div className="border-border/60 bg-muted/30 flex flex-col gap-2 rounded-2xl border p-4 text-sm">
        <p className="font-medium">
          {answer.meta.within
            ? t('noneWithin', { days: answer.meta.days, region: answer.meta.within.name })
            : t('none', { days: answer.meta.days })}
        </p>
        {periods.length > 0 && (
          <ul className="text-muted-foreground list-disc pl-5">
            {periods.map((p) => (
              <li key={`${p.from}-${p.name}`}>
                {p.name}:{' '}
                {formatParkDayRange(locale, p.from, p.to, { day: 'numeric', month: 'short' })}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3" aria-label={t('bestTitle')}>
        <h3 className="text-lg font-semibold">{t('bestTitle')}</h3>
        <ol className="grid gap-3 lg:grid-cols-3">
          {windows.map((window) => (
            <WindowCard
              key={window.from}
              window={window}
              label={range(window.from, window.to)}
              onDetails={() => details(window)}
              onPlan={() => plan(window)}
            />
          ))}
        </ol>
      </section>

      <YearStrip answer={answer} />

      <WindowSheet
        window={open}
        answer={answer}
        label={open ? range(open.from, open.to) : ''}
        onClose={() => setOpen(null)}
        onPlan={plan}
        returnFocus={() => opener.current?.isConnected && opener.current.focus()}
      />
    </div>
  );
}

function WindowCard({
  window,
  label,
  onDetails,
  onPlan,
}: {
  window: TripWhenWindow;
  label: string;
  onDetails: () => void;
  onPlan: () => void;
}) {
  const t = useTranslations('orlandoPlanner.when');
  const below = percentBelowAverage(window);
  const reason = windowReasons(window)[0];
  const tClimate = useTranslations('orlandoPlanner.climate');
  const lower = rankedLower(window);
  return (
    <li className="border-border/60 bg-muted/30 flex flex-col gap-2 rounded-2xl border p-4">
      <span className="text-muted-foreground text-xs font-semibold">
        {t('rank', { rank: window.rank })}
      </span>
      <span className="text-base leading-snug font-semibold">{label}</span>
      <span className="text-sm">{t('wait', { minutes: window.headlinerWait })}</span>
      {below !== null && (
        <span className="text-crowd-ink-low text-sm font-medium">
          {t('below', { percent: below })}
        </span>
      )}
      {reason && <span className="text-muted-foreground text-sm">{t(`reason.${reason}`)}</span>}
      <ClimateChips codes={climateChips(window.warnings)} />
      {lower.length > 0 && (
        <span className="text-muted-foreground text-xs">
          {t('rankedLower', { reasons: lower.map((c) => tClimate(c)).join(', ') })}
        </span>
      )}
      {window.basis !== 'forecast' && (
        <span className="text-muted-foreground text-xs italic">{t(`basis.${window.basis}`)}</span>
      )}
      <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onDetails}>
          <Info aria-hidden="true" />
          {t('details')}
        </Button>
        <Button size="sm" onClick={onPlan}>
          <CalendarCheck aria-hidden="true" />
          {t('plan')}
        </Button>
      </div>
    </li>
  );
}

/**
 * Level 1: one bar per week, its height the week's figure and its tint where the week falls among
 * the period's weeks; the found windows are marked under it. For a screen reader the same thing
 * is a list: each week, its figure, and whether a window falls in it.
 */
function YearStrip({ answer }: { answer: TripWhen }) {
  const t = useTranslations('orlandoPlanner.when');
  const { locale } = usePlanContext();
  const tiers = useMemo(() => weekTiers(answer.weeks), [answer.weeks]);
  const max = Math.max(1, ...answer.weeks.map((w) => w.headlinerWait ?? 0));
  if (answer.weeks.length === 0) return null;
  return (
    <section className="flex flex-col gap-2" aria-label={t('stripTitle')}>
      <h3 className="text-base font-semibold">{t('stripTitle')}</h3>
      <ol className="flex h-28 items-end gap-px" data-plan-strip="">
        {answer.weeks.map((week, i) => {
          const tier = tiers[i];
          const marked = answer.windows.find((w) => weekInWindow(week.start, w));
          const date = formatParkDay(locale, week.start, { day: 'numeric', month: 'short' });
          const text =
            week.headlinerWait != null
              ? t('stripWeek', { date, minutes: week.headlinerWait })
              : t('stripWeekNone', { date });
          return (
            <li
              key={week.start}
              className="flex h-full min-w-0 flex-1 flex-col justify-end gap-0.5"
            >
              <span className="sr-only">
                {text}
                {marked ? `, ${t('stripWindow', { rank: marked.rank })}` : ''}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'w-full rounded-t-sm',
                  tier ? CROWD_DOT_CLASS[tier] : 'bg-muted',
                  week.basis === 'last_year' && 'opacity-60'
                )}
                style={{ height: `${Math.max(4, ((week.headlinerWait ?? 0) / max) * 96)}px` }}
                title={text}
              />
              <span
                aria-hidden="true"
                className={cn(
                  'h-1.5 w-full rounded-full',
                  marked ? 'bg-primary' : 'bg-transparent'
                )}
              />
            </li>
          );
        })}
      </ol>
      <div className="text-muted-foreground flex justify-between text-[11px]" aria-hidden="true">
        <span>
          {formatParkDay(locale, answer.weeks[0].start, { month: 'short', year: 'numeric' })}
        </span>
        <span>
          {formatParkDay(locale, answer.weeks.at(-1)!.start, { month: 'short', year: 'numeric' })}
        </span>
      </div>
      <p className="text-muted-foreground text-xs">{t('stripLegend')}</p>
    </section>
  );
}

function WindowSheet({
  window,
  answer,
  label,
  onClose,
  onPlan,
  returnFocus,
}: {
  window: TripWhenWindow | null;
  answer: TripWhen;
  label: string;
  onClose: () => void;
  onPlan: (window: TripWhenWindow) => void;
  returnFocus: () => void;
}) {
  const t = useTranslations('orlandoPlanner');
  const { locale, parkName } = usePlanContext();
  const wide = useMediaQuery(PLAN_WIDE_QUERY);
  const seasonName = useSeasonName();
  const tSeasons = useTranslations('parks.seasons');

  return (
    <Sheet open={window !== null} onOpenChange={(o) => !o && onClose()}>
      {window && (
        <SheetContent
          side={wide ? 'right' : 'bottom'}
          hideClose
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocus();
          }}
          className={cn('gap-0 p-0', wide ? 'w-full sm:max-w-md' : 'max-h-[90svh] rounded-t-2xl')}
        >
          <div className="border-border/60 flex items-start gap-2 border-b px-4 py-2">
            <div className="flex min-w-0 flex-1 flex-col py-1.5">
              <SheetDescription className="text-muted-foreground text-xs">
                {t('when.rank', { rank: window.rank })}
              </SheetDescription>
              <SheetTitle className="text-base leading-snug">{label}</SheetTitle>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('setup.close')}
              className={cn(
                'hover:bg-accent flex size-11 shrink-0 items-center justify-center rounded-md',
                PLAN_FOCUS
              )}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 text-sm">
            <p>
              <span className="text-lg font-semibold">
                {t('when.wait', { minutes: window.headlinerWait })}
              </span>
              <span className="text-muted-foreground block text-xs">
                {t('when.average', { minutes: window.rangeAverageWait })}
              </span>
            </p>
            {windowReasons(window).length > 0 && (
              <ul className="flex flex-col gap-1">
                {windowReasons(window).map((r) => (
                  <li key={r}>{t(`when.reason.${r}`)}</li>
                ))}
              </ul>
            )}
            {windowWarnings(window).length > 0 && (
              <ul className="flex flex-col gap-1">
                {windowWarnings(window).map((w) => (
                  <li key={w} className="text-crowd-ink-high">
                    {t(`when.warning.${w}`, { count: window.closesEarlyDays })}
                  </li>
                ))}
              </ul>
            )}
            {window.seasons.length > 0 && (
              <ul className="flex flex-col gap-1">
                {answer.seasons
                  .filter((s) => window.seasons.includes(s.id))
                  .map((s) => (
                    <li key={s.id}>
                      {seasonName(s)}
                      {s.status !== 'confirmed' && (
                        <span className="text-muted-foreground">
                          {' '}
                          · {tSeasons(`status.${s.status}`)}
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            )}
            {window.plan && window.plan.days.length > 0 && (
              <div>
                <h3 className="mb-1 font-semibold">{t('when.sketch')}</h3>
                <ol className="flex flex-col gap-0.5">
                  {window.plan.days.map((day) => (
                    <li key={day.date} className="flex gap-3">
                      <span className="text-muted-foreground w-20 shrink-0 tabular-nums">
                        {formatParkDay(locale, day.date, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <span className="min-w-0 truncate">
                        {day.parks.length > 0
                          ? day.parks.map((s) => parkName(s)).join(' + ')
                          : ['arrival', 'departure', 'rest'].includes(day.kind)
                            ? t(`day.${day.kind as 'arrival' | 'departure' | 'rest'}`)
                            : ''}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {window.basis !== 'forecast' && (
              <p className="text-muted-foreground text-xs italic">
                {t(`when.basis.${window.basis}`)}
              </p>
            )}
          </div>
          <div className="border-border/60 border-t px-4 py-3">
            <Button className="w-full" onClick={() => onPlan(window)}>
              <CalendarCheck aria-hidden="true" />
              {t('when.plan')}
            </Button>
          </div>
        </SheetContent>
      )}
    </Sheet>
  );
}
