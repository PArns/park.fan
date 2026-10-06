'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  CalendarDays,
  CalendarPlus,
  Check,
  Compass,
  MapPin,
  Plus,
  Route,
  Trash2,
} from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { PLANNER_START_ID } from '@/lib/planner/segments';
import { cn } from '@/lib/utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannedParks } from '@/lib/planner/types';
import { plannerUi } from '@/lib/planner/ui-store';
import { addDays, todayInZone } from '@/lib/planner/park-time';
import { PlannerPushToggle } from './planner-push-toggle';
import { PlannerHelpSteps } from './planner-help';
import { PlannerPolaroids, type PolaroidPhoto } from './planner-polaroids';
import { PlannerTripAssistant } from './planner-trip-assistant';
import { PlannerWizard, type WizardPark } from './planner-wizard';
import { ClearDayConfirm, type ClearDayTarget } from './planner-clear-day-confirm';

/**
 * The planner's own page: a directory of what is planned, and an explanation when nothing is. It
 * edits nothing: the flyout is the editor, and picking a day here sets the active day and asks the
 * panel to open, as the park calendar's "plan this day" does. A page in the menu can be reached on
 * purpose and has room to say what the planner is for.
 */
export function PlannerPageBody({ photos = [] }: { photos?: readonly PolaroidPhoto[] }) {
  const t = useTranslations('planner');
  const locale = useLocale();
  const { state, setActive, clearDay } = usePlanner();
  // `null` = closed, otherwise the park the wizard starts on; one state, so the two cannot
  // disagree.
  const [wizardFor, setWizardFor] = useState<{ park: WizardPark | null } | null>(null);
  /**
   * The day whose bin was pressed, or `null`: one dialog under the whole list, as in the overview.
   */
  const [pendingClear, setPendingClear] = useState<ClearDayTarget | null>(null);
  // Mounted only while open, so every opening starts from its defaults.
  const [assistantOpen, setAssistantOpen] = useState(false);

  const parks = useMemo(
    () =>
      plannedParks(state.parks, locale).map((park) => ({
        ...park,
        today: todayInZone(park.timezone),
        tomorrow: addDays(todayInZone(park.timezone), 1),
      })),
    [state.parks, locale]
  );

  const open = (parkSlug: string, date: string) => {
    setActive(parkSlug, date);
    plannerUi.requestOpen('plan-list');
  };

  const total = parks.reduce((sum, park) => sum + park.days.length, 0);
  const dayFormat = getDateTimeFormat(locale, { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="flex flex-col gap-8">
      {/* The photographs stay, plan or no plan: they are what the page is about, above the button
          for what to do about it. */}
      <PlannerPolaroids photos={photos} />

      {/* One way in, a button into the wizard rather than a park search, so which day and who is
          coming are asked too. `PLANNER_START_ID` is what the hero's action jumps to; it sits here
          or on the intro below, which render for opposite states. */}
      {parks.length > 0 && (
        <div id={PLANNER_START_ID} className="flex scroll-mt-20 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setWizardFor({ park: null })}
            data-planner-new-day=""
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            {t('wizard.open')}
          </button>
          {/* The other question, which park on which day: a button beside the wizard, since a
              proposal is something asked for. */}
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            data-planner-trip-open=""
            className="hover:bg-accent inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <Route className="size-4" aria-hidden="true" />
            {t('trip.open')}
          </button>
        </div>
      )}

      {parks.length === 0 ? (
        <PlannerPageIntro onStart={() => setWizardFor({ park: null })} />
      ) : null}

      {parks.length > 0 && (
        <section>
          {/* A chapter of the page like the article's below, with the same heading. No number: it
              renders only once something is planned. */}
          <ChapterHeading
            icon={CalendarDays}
            title={t('page.yourPlans', { count: total })}
            className="mb-5 pb-4"
          />

          <div className="flex flex-col gap-4">
            {parks.map((park) => (
              <div key={park.slug} className="bg-card overflow-hidden rounded-2xl border">
                <h3 className="text-muted-foreground border-border/60 flex items-center gap-1.5 border-b px-4 py-2.5 text-xs font-medium tracking-wide uppercase">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{park.name}</span>
                  {/* Another day at this park, the common case: starts the wizard on the date
                      step. */}
                  <button
                    type="button"
                    onClick={() =>
                      setWizardFor({
                        park: {
                          slug: park.slug,
                          name: park.name,
                          geo: park.geo,
                          timezone: park.timezone,
                        },
                      })
                    }
                    data-planner-add-day=""
                    className="hover:bg-accent hover:text-foreground -my-1 flex items-center gap-1 rounded-md px-2 py-1 normal-case transition-colors"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    {t('wizard.addDay')}
                  </button>
                </h3>
                <ul>
                  {park.days.map((day) => {
                    // Per park, in that park's own zone: two parks can be on different dates.
                    const past = day.date < park.today;
                    const done = day.entries.filter((entry) => entry.done).length;
                    const label =
                      day.date === park.today
                        ? t('day.today')
                        : day.date === park.tomorrow
                          ? t('day.tomorrow')
                          : dayFormat.format(new Date(`${day.date}T12:00:00Z`));

                    return (
                      <li key={day.date} className="border-border/40 flex items-center border-t">
                        <button
                          type="button"
                          onClick={() => open(park.slug, day.date)}
                          data-planner-page-day={`${park.slug}:${day.date}`}
                          className={cn(
                            'hover:bg-accent flex min-w-0 flex-1 items-baseline justify-between gap-3 px-4 py-3 text-left transition-colors',
                            // A finished day is greyed, not swept up: its ticked entries carry real
                            // measured minutes.
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
                          // The panel's own question and dialog: measured minutes cannot be
                          // restored.
                          onClick={() => setPendingClear({ parkSlug: park.slug, date: day.date })}
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

          {/* The notification switch lives with the plans, since it is about a plan existing. It
              renders nothing where push cannot work. */}
          <div className="bg-card mt-4 overflow-hidden rounded-2xl border">
            <PlannerPushToggle />
          </div>
        </section>
      )}

      <ClearDayConfirm
        pending={pendingClear}
        onDismiss={() => setPendingClear(null)}
        onConfirm={clearDay}
      />

      {assistantOpen && <PlannerTripAssistant onOpenChange={setAssistantOpen} />}

      {/* Mounted only while open, which resets its answers (see `PlannerWizard`'s `open`). */}
      {wizardFor && (
        <PlannerWizard
          open
          initialPark={wizardFor.park}
          onOpenChange={(next) => setWizardFor(next ? wizardFor : null)}
        />
      )}
    </div>
  );
}

/**
 * What the planner is, for somebody who has not used it: three steps and a way to start. The steps
 * are `PlannerHelpSteps`, shared with the panel's empty state so the sentences cannot drift.
 */
function PlannerPageIntro({ onStart }: { onStart: () => void }) {
  const t = useTranslations('planner');

  return (
    <section id={PLANNER_START_ID} data-planner-page-intro="" className="scroll-mt-20">
      <ChapterHeading icon={CalendarPlus} title={t('page.introTitle')} className="mb-5 pb-4" />
      <p className="text-muted-foreground text-sm leading-relaxed">{t('page.introBody')}</p>

      <div className="mt-6">
        <PlannerHelpSteps layout="cards" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {/* The wizard is the primary action, the one control that asks for both a park and a day;
            browsing the catalogue stays for somebody who does not know which park yet. */}
        <button
          type="button"
          onClick={onStart}
          data-planner-new-day=""
          className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
        >
          <CalendarPlus className="size-4" aria-hidden="true" />
          {t('wizard.open')}
        </button>
        <Link
          href="/parks"
          className="hover:bg-accent inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Compass className="size-4" aria-hidden="true" />
          {t('page.browseParks')}
        </Link>
      </div>
    </section>
  );
}
