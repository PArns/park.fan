'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarPlus, Check, MapPin, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { addDays, nextPlannedDay, todayInZone } from '@/lib/planner/park-time';
import { plannedParks, type PlannerState } from '@/lib/planner/types';
import { ClearDayConfirm, type ClearDayTarget } from './planner-clear-day-confirm';

interface PlannerOverviewProps {
  state: PlannerState;
  /**
   * Starts a new day through the wizard, which asks which park, which day and who is coming, and
   * lands on the park's own page.
   */
  onNewDay?: () => void;
  activeParkSlug: string | null;
  activeDate: string | null;
  onPick: (parkSlug: string, date: string) => void;
  onClearDay: (parkSlug: string, date: string) => void;
}

/**
 * Every park and day in the plan, in one list, since the panel otherwise shows one day of one park.
 * Past days are kept and greyed rather than swept up: a finished day records what was actually
 * queued. Sorted by park name, then date, never by insertion.
 */
export function PlannerOverview({
  state,
  activeParkSlug,
  activeDate,
  onPick,
  onClearDay,
  onNewDay,
}: PlannerOverviewProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
  /**
   * The day whose bin was pressed, or `null`: park and date, because the dialog is rendered once at
   * the bottom of the list rather than one Radix portal per row.
   */
  const [pendingClear, setPendingClear] = useState<ClearDayTarget | null>(null);
  // There is no single "today" here: two parks can be on different dates at once, so "Heute" and
  // the greying-out are decided per park, in that park's zone.

  const parks = useMemo(
    () =>
      plannedParks(state.parks, locale).map((park) => ({
        ...park,
        today: todayInZone(park.timezone),
        tomorrow: addDays(todayInZone(park.timezone), 1),
      })),
    [state.parks, locale]
  );

  /**
   * The one day the panel counts down to, the nearest planned day ahead in any park: how long the
   * wait is has a single answer for the whole trip, so one badge.
   */
  const next = useMemo(() => nextPlannedDay(state), [state]);
  const dayFormat = getDateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: 'long' });

  const newDay = onNewDay ? (
    <div className="border-border/60 border-b px-2 py-2">
      <button
        type="button"
        onClick={onNewDay}
        data-planner-new-day=""
        className="bg-primary/10 text-primary hover:bg-primary/15 planner-phone:min-h-11 flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors"
      >
        <CalendarPlus className="size-3.5 shrink-0" aria-hidden="true" />
        {t('wizard.open')}
      </button>
    </div>
  ) : null;

  if (parks.length === 0) {
    return (
      <div className="flex flex-col">
        {newDay}
        <div className="flex min-h-[140px] items-center justify-center px-6 text-center">
          <p className="text-muted-foreground text-xs">{t('overview.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {newDay}
      <div className="flex flex-col gap-3 px-1 py-1">
        {parks.map((park) => (
          <section key={park.slug}>
            <h3 className="text-muted-foreground flex items-center gap-1.5 px-2 pb-1 text-[11px] font-medium tracking-wide uppercase">
              <MapPin className="size-3" />
              {park.name}
            </h3>

            <ul>
              {park.days.map((day) => {
                const isActive = park.slug === activeParkSlug && day.date === activeDate;
                const past = day.date < park.today;
                // The countdown goes on the nearest day ahead, from two nights out: "Morgen" and
                // "Heute" already are the count.
                const countdown =
                  next !== null &&
                  next.parkSlug === park.slug &&
                  next.date === day.date &&
                  next.inDays >= 2
                    ? next.inDays
                    : null;
                const done = day.entries.filter((entry) => entry.done).length;
                // The day picker's wording for the two dates that have a name, or the two read as
                // different days.
                const label =
                  day.date === park.today
                    ? t('day.today')
                    : day.date === park.tomorrow
                      ? t('day.tomorrow')
                      : dayFormat.format(new Date(`${day.date}T12:00:00Z`));

                return (
                  <li key={day.date} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onPick(park.slug, day.date)}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'hover:bg-accent planner-phone:py-2.5 flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left transition-colors',
                        isActive && 'bg-accent/70',
                        past && !isActive && 'opacity-60'
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">{label}</span>

                      {countdown !== null && (
                        <span className="text-primary shrink-0 text-[11px] font-medium tabular-nums">
                          {t('overview.countdown', { count: countdown })}
                        </span>
                      )}

                      {/* A finished day gets a tick instead of "5 von 5". */}
                      {done > 0 && done === day.entries.length ? (
                        <Check className="text-crowd-low size-3.5 shrink-0" />
                      ) : (
                        done > 0 && (
                          <span className="text-muted-foreground shrink-0 font-mono text-[11px] tabular-nums">
                            {t('summary.done', { done, total: day.entries.length })}
                          </span>
                        )
                      )}

                      <span className="text-muted-foreground shrink-0 text-[11px]">
                        {t('summary.rides', { count: day.entries.length })}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPendingClear({ parkSlug: park.slug, date: day.date })}
                      aria-label={t('clearDay')}
                      className="text-muted-foreground/40 hover:bg-destructive/15 hover:text-destructive planner-phone:size-11 flex size-8 shrink-0 items-center justify-center rounded-md transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <ClearDayConfirm
        pending={pendingClear}
        onDismiss={() => setPendingClear(null)}
        onConfirm={onClearDay}
      />
    </div>
  );
}
