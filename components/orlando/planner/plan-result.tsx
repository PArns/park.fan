'use client';

import { useCallback, useRef, useState, useSyncExternalStore, type Ref } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, LayoutList, Rows3, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { plannerPagePark, type PlannerPagePark } from '@/lib/planner/page-park';
import { plannerPageDay } from '@/lib/planner/page-day';
import { plannerUi } from '@/lib/planner/ui-store';
import { formatParkDay, formatParkDayRange } from '@/lib/utils/park-day';
import { PlannerPageParkBeacon } from '@/components/planner/planner-page-park-beacon';
import { Button } from '@/components/ui/button';
import {
  MAX_PLAN_VISITS,
  MAX_TRIP_DAYS,
  planProblem,
  planRequestQuery,
  plannerParkOf,
  swapLocks,
  toggleLock,
  type PlanLock,
  type TripPlan,
} from '@/lib/orlando/plan';
import {
  autoSplit,
  editCost,
  ignoredLocks,
  lastYearReach,
  planSavings,
  relaxedRules,
  unplacedParks,
} from '@/lib/orlando/plan-copy';
import { PlanRequestError } from '@/lib/orlando/plan-fetch';
import { whenRequestQuery } from '@/lib/orlando/plan-when';
import { orlandoPlanView, PLAN_VIEWS, type PlanView } from '@/lib/orlando/plan-view';
import type { TripCalendar } from '@/lib/orlando/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanAgendaView } from './plan-agenda-view';
import { PlanDaySheet } from './plan-day-sheet';
import { PlanDayMarker, useDayParks } from './plan-day-bits';
import { PlanKeep } from './plan-keep';
import { PlanMonthView } from './plan-month-view';
import { PLAN_WIDE_QUERY } from './plan-setup';
import { PlanWeekView } from './plan-week-view';
import { PlanWhenResult } from './plan-when-result';
import { useTripCalendar, useTripPlan, useTripWhen, useUnpinnedPlan } from './use-trip-plan';

const VIEW_ICON = { agenda: LayoutList, week: Rows3, month: CalendarDays } as const;

/**
 * The planner's answer, below the setup. Empty, and saying so, until dates are chosen (or a search
 * is set); then the plan from simple to detailed: the answer in sentences (Level 0), the Agenda,
 * Week or Month view (Level 1), a day's sheet (Level 2) and the day planner (Level 3). The previous
 * plan stays on screen, dimmed, while a change is asked for. In the When mode it is the search's
 * answer instead (`PlanWhenResult`).
 */
export function PlanResult({
  ref,
  onChooseDates,
}: {
  ref?: Ref<HTMLDivElement>;
  onChooseDates: () => void;
}) {
  const t = useTranslations('orlandoPlanner');
  const { state, headliners } = usePlanContext();

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-label={t('result.label')}
      className="flex scroll-mt-16 flex-col gap-5 outline-none"
    >
      {state.when ? (
        <WhenAnswer />
      ) : planProblem(state, headliners) === 'no_dates' ? (
        <div className="border-border/60 flex min-h-40 flex-col items-start justify-center gap-3 rounded-2xl border border-dashed p-5">
          <p className="text-sm">{t('result.empty')}</p>
          <Button variant="outline" onClick={onChooseDates} className="lg:hidden">
            {t('result.chooseDates')}
          </Button>
        </div>
      ) : (
        <PlanAnswerSection />
      )}
    </section>
  );
}

function WhenAnswer() {
  const t = useTranslations('orlandoPlanner');
  const { state, update } = usePlanContext();
  const query = whenRequestQuery(state);
  const when = useTripWhen(query);
  if (!when.data) {
    return when.isError ? (
      <Failure error={when.error} onRetry={() => void when.refetch()} />
    ) : (
      <Loading text={t('when.loading')} />
    );
  }
  return (
    <div
      className={cn('transition-opacity duration-200', when.waiting && 'opacity-60')}
      aria-busy={when.waiting}
    >
      <PlanWhenResult answer={when.data} onPlan={update} />
    </div>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <div
      className="bg-muted/30 flex min-h-64 animate-pulse items-center justify-center rounded-2xl"
      role="status"
    >
      <span className="text-muted-foreground text-sm">{text}</span>
    </div>
  );
}

function Failure({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const t = useTranslations('orlandoPlanner.result');
  const invalid = error instanceof PlanRequestError && error.kind === 'invalid';
  return (
    <div
      className="border-border/60 flex flex-col items-start gap-3 rounded-2xl border p-5"
      role="alert"
    >
      <p className="text-sm">{invalid ? t('invalid') : t('failed')}</p>
      {!invalid && (
        <Button variant="outline" onClick={onRetry}>
          {t('retry')}
        </Button>
      )}
    </div>
  );
}

function PlanAnswerSection() {
  const t = useTranslations('orlandoPlanner');
  const { state, update, headliners, parkBySlug } = usePlanContext();
  const problem = planProblem(state, headliners);
  const query = planRequestQuery(state, headliners);
  const plan = useTripPlan(query);
  const unpinned = useUnpinnedPlan(query);
  const calendar = useTripCalendar(state.from, state.to);

  const [openDate, setOpenDate] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openDay = useCallback((date: string) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpenDate(date);
  }, []);
  const [history, setHistory] = useState<PlanLock[][]>([]);
  const [beacon, setBeacon] = useState<PlannerPagePark | null>(null);

  const withHistory = useCallback(
    (recipe: Parameters<typeof update>[0]) => {
      setHistory((h) => [...h, state.locks]);
      update(recipe);
    },
    [state.locks, update]
  );

  if (problem) {
    return (
      <div className="border-border/60 flex flex-col gap-2 rounded-2xl border p-5" role="status">
        <p className="text-sm">
          {t(`problem.${problem}`, { days: MAX_TRIP_DAYS, max: MAX_PLAN_VISITS })}
        </p>
      </div>
    );
  }
  if (!plan.data) {
    return plan.isError ? (
      <Failure error={plan.error} onRetry={() => void plan.refetch()} />
    ) : (
      <Loading text={t('result.loading')} />
    );
  }

  const data = plan.data;
  const day = data.days.find((d) => d.date === openDate) ?? null;

  const planDay = (slug: string, date: string) => {
    const park = parkBySlug.get(slug);
    const filed = park ? plannerParkOf(park) : null;
    if (!filed) return;
    setOpenDate(null);
    const page = { slug, name: filed.name, geo: filed.geo, timezone: filed.timezone };
    // Published at once, not in the beacon's effect: the wizard reads it in the commit the request
    // opens. The beacon keeps it for as long as the hub is on screen, and clears it after.
    plannerPagePark.set(page);
    setBeacon(page);
    plannerPageDay.set({ parkSlug: slug, date });
    plannerUi.requestOpen('orlando-hub', 'page-park-wizard');
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-6 transition-opacity duration-200',
        plan.waiting && 'opacity-60'
      )}
      aria-busy={plan.waiting}
    >
      {beacon && <PlannerPageParkBeacon {...beacon} />}
      {plan.isError && <Failure error={plan.error} onRetry={() => void plan.refetch()} />}

      <PlanAnswer plan={data} calendar={calendar.data} onOpenDay={openDay} />

      {state.locks.length > 0 && (
        <EditBar
          plan={data}
          best={unpinned.data ?? null}
          canUndo={history.length > 0}
          onUndo={() => {
            const previous = history.at(-1);
            setHistory((h) => h.slice(0, -1));
            if (previous) update((s) => ({ ...s, locks: previous }));
          }}
          onRelease={() => withHistory((s) => ({ ...s, locks: [] }))}
        />
      )}

      <PlanViews plan={data} calendar={calendar.data} onOpenDay={openDay} />

      <PlanKeep plan={data} calendar={calendar.data} />

      <PlanDaySheet
        day={day}
        plan={data}
        calendar={calendar.data}
        onClose={() => setOpenDate(null)}
        onToggleLock={(d) => withHistory((s) => toggleLock(s, d))}
        onSwap={(a, b) => {
          setOpenDate(null);
          withHistory((s) => {
            const locks = swapLocks(s, a, b);
            return locks ? { ...s, locks } : s;
          });
        }}
        onPlanDay={planDay}
        returnFocus={() => opener.current?.isConnected && opener.current.focus()}
      />
    </div>
  );
}

/**
 * Level 0: the answer in sentences. The saving in minutes per ride against an average day of the
 * trip, with the forecast's own error where the API names it, or that the order barely matters;
 * what the plan had to give up; and one line per day, each opening the day.
 */
function PlanAnswer({
  plan,
  calendar,
  onOpenDay,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string) => void;
}) {
  const t = useTranslations('orlandoPlanner');
  const { locale, today, parkName } = usePlanContext();
  const parksOf = useDayParks();
  const savings = planSavings(plan.totals);
  const reach = today ? lastYearReach(plan.days, calendar?.meta.forecastUntil, today) : null;
  const added = autoSplit(plan.meta).map((e) =>
    t('answer.split', { park: parkName(e.slug), visits: e.visits })
  );
  const notes = [
    ...relaxedRules(plan.meta).map((r) => t(`relaxed.${r}`)),
    ...unplacedParks(plan).map((u) =>
      t(`unplaced.${u.reason}`, { park: parkName(u.slug) })
    ),
    ...ignoredLocks(plan).map((l) =>
      t(`ignoredLock.${l.reason}`, {
        what: l.target === 'rest' ? t('day.rest') : parkName(l.target),
        date: formatParkDay(locale, l.date, { weekday: 'short', day: 'numeric', month: 'short' }),
      })
    ),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">
          {formatParkDayRange(locale, plan.meta.from, plan.meta.to, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('answer.counts', { parkDays: plan.totals.parkDays, restDays: plan.totals.restDays })}
        </p>
      </div>

      {savings && (
        <div
          className="border-border/60 bg-muted/30 flex flex-col gap-1 rounded-2xl border p-4"
          data-plan-savings=""
        >
          <p className="text-base font-semibold">
            {t('answer.yourDays', { minutes: savings.planned })}
          </p>
          <p className="text-sm">{t('answer.averageDay', { minutes: savings.average })}</p>
          <p className="text-muted-foreground text-sm">
            {savings.kind === 'flat'
              ? t('answer.orderBarelyMatters')
              : t('answer.saved', { minutes: savings.saved })}
            {savings.expectedError !== null &&
              ` ${t('answer.error', { minutes: savings.expectedError })}`}
          </p>
        </div>
      )}

      {reach && (
        <p
          className="border-border/60 rounded-xl border border-dashed px-4 py-3 text-sm"
          role="note"
        >
          {t('answer.lastYear', {
            date: formatParkDay(locale, reach.reach, { day: 'numeric', month: 'long' }),
          })}
        </p>
      )}
      {added.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {added.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {notes.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {notes.map((note) => (
            <li key={note} className="text-crowd-ink-high">
              {note}
            </li>
          ))}
        </ul>
      )}

      <ol className="flex flex-col lg:max-w-2xl" aria-label={t('answer.daysLabel')}>
        {plan.days.map((day) => (
          <li key={day.date}>
            <button
              type="button"
              onClick={() => onOpenDay(day.date)}
              className={cn(
                'hover:bg-accent/40 flex min-h-11 w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors',
                PLAN_FOCUS
              )}
            >
              <span className="text-muted-foreground w-20 shrink-0 tabular-nums">
                {formatParkDay(locale, day.date, { weekday: 'short', day: 'numeric' })}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {day.kind === 'park' || day.kind === 'hop' ? parksOf(day) : t(`day.${day.kind}`)}
              </span>
              {day.headlinerWait != null && (
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {t('answer.about', { minutes: day.headlinerWait })}
                </span>
              )}
              <PlanDayMarker
                day={day}
                calendar={calendar}
                className="hidden shrink-0 sm:inline-flex"
              />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** What the visitor's pins cost against the best order without them, with Undo and Release. */
function EditBar({
  plan,
  best,
  canUndo,
  onUndo,
  onRelease,
}: {
  plan: TripPlan;
  best: TripPlan | null;
  canUndo: boolean;
  onUndo: () => void;
  onRelease: () => void;
}) {
  const t = useTranslations('orlandoPlanner.edit');
  const cost = editCost(best?.totals ?? null, plan.totals);
  return (
    <div
      className="border-primary/40 bg-primary/5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border px-4 py-3"
      role="status"
    >
      <p className="min-w-0 flex-1 text-sm">
        {cost === null
          ? t('pinned')
          : cost.delta > 0
            ? t('cost', { delta: cost.delta, current: cost.current, best: cost.best })
            : t('noCost')}
      </p>
      <div className="flex gap-2">
        {canUndo && (
          <Button variant="outline" size="sm" onClick={onUndo}>
            <Undo2 aria-hidden="true" />
            {t('undo')}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onRelease}>
          {t('release')}
        </Button>
      </div>
    </div>
  );
}

/**
 * Level 1, behind a switch: Agenda, Week or Month. The choice is this browser's (`plan-view.ts`);
 * until one is made a wide window opens on the Week and a phone on the Agenda.
 */
function PlanViews({
  plan,
  calendar,
  onOpenDay,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string) => void;
}) {
  const t = useTranslations('orlandoPlanner.views');
  const wide = useMediaQuery(PLAN_WIDE_QUERY);
  const chosen = useSyncExternalStore(
    orlandoPlanView.subscribe,
    orlandoPlanView.getSnapshot,
    orlandoPlanView.getServerSnapshot
  );
  const view: PlanView = chosen ?? (wide ? 'week' : 'agenda');

  return (
    <section className="flex flex-col gap-3" aria-label={t('label')}>
      <div
        role="radiogroup"
        aria-label={t('label')}
        className="bg-muted/50 inline-flex gap-1 self-start rounded-xl p-1"
      >
        {PLAN_VIEWS.map((key) => {
          const Icon = VIEW_ICON[key];
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={view === key}
              onClick={() => orlandoPlanView.set(key)}
              className={cn(
                'flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors lg:min-h-9',
                view === key
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
                PLAN_FOCUS
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {t(key)}
            </button>
          );
        })}
      </div>
      {view === 'week' && <PlanWeekView plan={plan} calendar={calendar} onOpenDay={onOpenDay} />}
      {view === 'month' && <PlanMonthView plan={plan} calendar={calendar} onOpenDay={onOpenDay} />}
      {view === 'agenda' && (
        <PlanAgendaView plan={plan} calendar={calendar} onOpenDay={onOpenDay} />
      )}
    </section>
  );
}
