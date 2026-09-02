'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, MapPin, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlannerState } from '@/lib/planner/types';

interface PlannerOverviewProps {
  state: PlannerState;
  activeParkSlug: string | null;
  activeDate: string | null;
  onPick: (parkSlug: string, date: string) => void;
  onClearDay: (parkSlug: string, date: string) => void;
}

/** Today in the visitor's own reading, which is what "past" is measured against. */
function todayLocal(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/**
 * Every park and day in the plan, in one list.
 *
 * The panel otherwise only ever shows ONE day of ONE park, and everything else
 * a visitor has planned is reachable only by remembering it: the day picker
 * marks a planned date with a dot sixty entries deep, and the park switcher was
 * a row of chips naming parks with no indication of what was in them. A trip
 * across three parks and five days was invisible to the person who planned it.
 *
 * Days in the past are kept and shown greyed rather than swept up. A finished
 * day is a record of what was actually queued — the ticked-off entries carry
 * real measured minutes — and deleting it on a date change would throw that away
 * on the visitor's behalf.
 *
 * Sorted by park name and then by date, never by insertion: the order a plan was
 * built in is not an order anybody reads it in.
 */
export function PlannerOverview({
  state,
  activeParkSlug,
  activeDate,
  onPick,
  onClearDay,
}: PlannerOverviewProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
  const today = todayLocal();
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowDate = tomorrow.toISOString().slice(0, 10);

  const parks = useMemo(() => {
    return Object.values(state.parks)
      .map((park) => ({
        ...park,
        days: Object.values(park.days)
          .filter((day) => day.entries.length > 0)
          .sort((a, b) => a.date.localeCompare(b.date)),
      }))
      .filter((park) => park.days.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [state.parks, locale]);

  if (parks.length === 0) {
    return (
      <div className="flex h-full min-h-[180px] items-center justify-center px-6 text-center">
        <p className="text-muted-foreground text-xs">{t('overview.empty')}</p>
      </div>
    );
  }

  return (
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
              const past = day.date < today;
              const done = day.entries.filter((entry) => entry.done).length;
              // Same wording as the day picker for the two dates that have a
              // name: a list that calls today "Do., 03. September" while the
              // picker beside it calls it "Heute" reads as two different days.
              const label =
                day.date === today
                  ? t('day.today')
                  : day.date === tomorrowDate
                    ? t('day.tomorrow')
                    : new Date(`${day.date}T12:00:00Z`).toLocaleDateString(locale, {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'long',
                      });

              return (
                <li key={day.date} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onPick(park.slug, day.date)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'hover:bg-accent flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left transition-colors max-sm:py-2.5',
                      isActive && 'bg-accent/70',
                      past && !isActive && 'opacity-60'
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">{label}</span>

                    {/* A day everything has been ridden on gets a tick instead of
                        a count: "5 von 5" is arithmetic the reader should not
                        have to do to see that a day is finished. */}
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
                    onClick={() => {
                      if (window.confirm(t('clearDayConfirm'))) onClearDay(park.slug, day.date);
                    }}
                    aria-label={t('clearDay')}
                    className="text-muted-foreground/40 hover:bg-destructive/15 hover:text-destructive flex size-8 shrink-0 items-center justify-center rounded-md transition-colors max-sm:size-11"
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
  );
}
