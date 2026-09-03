'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CalendarDays, Check, Compass, MapPin, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannerUi } from '@/lib/planner/ui-store';
import { addDays, todayInZone } from '@/lib/planner/park-time';
import { PlannerParkSearch } from './planner-park-search';
import { PlannerPushToggle } from './planner-push-toggle';
import { PlannerHelpSteps } from './planner-help';
import { PlannerPolaroids, type PolaroidPhoto } from './planner-polaroids';

/**
 * The planner's own page: a directory of what is planned, and an explanation
 * when nothing is.
 *
 * It deliberately does NOT edit anything. The flyout is the editor — it has the
 * axis, the drag, the legs and the live corrections — and a second, page-sized
 * copy of that would be two implementations of one thing, drifting. Picking a
 * day here sets the active day and asks the panel to open, which is the same
 * signal the park calendar's "plan this day" already sends.
 *
 * The empty state is the reason the page exists at all. The launcher only
 * appears once something is planned, so before that the feature was invisible
 * unless somebody happened to be on a ride page and noticed one button. A page
 * in the menu can be arrived at on purpose, and it has room to say what the
 * thing is for.
 */
export function PlannerPageBody({ photos = [] }: { photos?: readonly PolaroidPhoto[] }) {
  const t = useTranslations('planner');
  const locale = useLocale();
  const { state, setActive, openDay, clearDay } = usePlanner();

  const parks = useMemo(() => {
    return Object.values(state.parks)
      .map((park) => ({
        ...park,
        today: todayInZone(park.timezone),
        tomorrow: addDays(todayInZone(park.timezone), 1),
        days: Object.values(park.days)
          .filter((day) => day.entries.length > 0)
          .sort((a, b) => a.date.localeCompare(b.date)),
      }))
      .filter((park) => park.days.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [state.parks, locale]);

  const open = (parkSlug: string, date: string) => {
    setActive(parkSlug, date);
    plannerUi.requestOpen();
  };

  const planned = new Set(parks.map((park) => park.slug));
  const total = parks.reduce((sum, park) => sum + park.days.length, 0);

  return (
    <div className="flex flex-col gap-8">
      {/* The search is above both states: with a plan it adds a park, without
          one it is the first step rather than a control that appears later. */}
      <section className="bg-card overflow-hidden rounded-2xl border">
        <PlannerParkSearch
          plannedSlugs={planned}
          onPick={(park, date) => {
            openDay(park, date);
            plannerUi.requestOpen();
          }}
        />
      </section>

      {parks.length === 0 ? <PlannerPageIntro photos={photos} /> : null}

      {parks.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="size-5" aria-hidden="true" />
            {t('page.yourPlans', { count: total })}
          </h2>

          <div className="flex flex-col gap-4">
            {parks.map((park) => (
              <div key={park.slug} className="bg-card overflow-hidden rounded-2xl border">
                <h3 className="text-muted-foreground border-border/60 flex items-center gap-1.5 border-b px-4 py-2.5 text-xs font-medium tracking-wide uppercase">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {park.name}
                </h3>
                <ul>
                  {park.days.map((day) => {
                    // Per park, against that park's own zone: a plan holding
                    // Phantasialand and Magic Kingdom is on two different dates
                    // at 23:00 in Berlin.
                    const past = day.date < park.today;
                    const done = day.entries.filter((entry) => entry.done).length;
                    const label =
                      day.date === park.today
                        ? t('day.today')
                        : day.date === park.tomorrow
                          ? t('day.tomorrow')
                          : new Date(`${day.date}T12:00:00Z`).toLocaleDateString(locale, {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                            });

                    return (
                      <li key={day.date} className="border-border/40 flex items-center border-t">
                        <button
                          type="button"
                          onClick={() => open(park.slug, day.date)}
                          data-planner-page-day={`${park.slug}:${day.date}`}
                          className={cn(
                            'hover:bg-accent flex min-w-0 flex-1 items-baseline justify-between gap-3 px-4 py-3 text-left transition-colors',
                            // A finished day is kept and greyed rather than
                            // swept up: the ticked entries carry real measured
                            // minutes, and deleting it on a date change would
                            // throw that away on the visitor's behalf.
                            past && 'opacity-60'
                          )}
                        >
                          <span className="truncate text-sm font-medium">{label}</span>
                          <span className="text-muted-foreground flex shrink-0 items-baseline gap-2 text-xs">
                            {done > 0 && (
                              <span className="text-crowd-low inline-flex items-center gap-1">
                                <Check className="size-3" aria-hidden="true" />
                                {done}
                              </span>
                            )}
                            {t('summary.rides', { count: day.entries.length })}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            // The same confirm the panel asks for. A finished
                            // day holds measured minutes and nothing restores
                            // them.
                            if (window.confirm(t('clearDayConfirm'))) clearDay(park.slug, day.date);
                          }}
                          aria-label={t('clearDay')}
                          className="text-muted-foreground/50 hover:text-destructive px-4 py-3 transition-colors"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* The notification switch lives with the plans, not in the panel's
              chrome: it is about a plan existing, and this page is where a
              visitor looks at the ones they have. It renders nothing where push
              cannot work — see `PlannerPushToggle`. */}
          <div className="bg-card mt-4 overflow-hidden rounded-2xl border">
            <PlannerPushToggle />
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * What the planner is, for somebody who has not used it.
 *
 * Three steps and a way to start, in that order, because the honest answer to
 * "how do I begin" is "pick a park" and the page cannot pick one for them. The
 * steps come from `PlannerHelpSteps`, which the panel's empty state also uses —
 * two copies of the same three sentences would drift on the first edit.
 *
 * The polaroids sit ABOVE the steps rather than beside them: the picture is what
 * says "this is about a day out", and it has to land before the instructions do.
 */
function PlannerPageIntro({ photos }: { photos: readonly PolaroidPhoto[] }) {
  const t = useTranslations('planner');

  return (
    <section data-planner-page-intro="">
      <PlannerPolaroids photos={photos} />

      <h2 className="mt-6 mb-2 text-lg font-semibold">{t('page.introTitle')}</h2>
      <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
        {t('page.introBody')}
      </p>

      <div className="mt-6">
        <PlannerHelpSteps layout="cards" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/parks"
          className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
        >
          <Compass className="size-4" aria-hidden="true" />
          {t('page.browseParks')}
        </Link>
      </div>
    </section>
  );
}
