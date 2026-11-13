'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type Ref } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CalendarDays, LayoutList, Rows3, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { plannerPagePark, type PlannerPagePark } from '@/lib/planner/page-park';
import { plannerPageDay } from '@/lib/planner/page-day';
import { plannerUi } from '@/lib/planner/ui-store';
import { formatParkDay, formatParkDayRange } from '@/lib/utils/park-day';
import { getListFormat } from '@/lib/utils/intl-format';
import { PlannerPageParkBeacon } from '@/components/planner/planner-page-park-beacon';
import { Button } from '@/components/ui/button';
import {
  MAX_PLAN_VISITS,
  MAX_TRIP_DAYS,
  lockOn,
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
import { readTickets } from '@/lib/orlando/plan-query';
import {
  hopperTicketResorts,
  ticketProblem,
  ticketWindow,
  type TicketProblem,
} from '@/lib/orlando/plan-tickets';
import { orlandoPlanView, PLAN_VIEWS, type PlanView } from '@/lib/orlando/plan-view';
import type { TripCalendar } from '@/lib/orlando/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanAgendaView } from './plan-agenda-view';
import { PlanDaySheet } from './plan-day-sheet';
import { PlanDayMarker, useDayParks, useEveningName } from './plan-day-bits';
import { PlanKeep } from './plan-keep';
import { PlanMonthView } from './plan-month-view';
import { PLAN_WIDE_QUERY } from './plan-setup';
import { PlanWeekView } from './plan-week-view';
import { PlanWhenResult } from './plan-when-result';
import { useTripCalendar, useTripPlan, useTripWhen, useUnpinnedPlan } from './use-trip-plan';
import { PlanTicketsCard, type PlanEdit } from './plan-tickets-card';
import { trackSiteEvent, type SiteEventMap } from '@/lib/analytics/site-analytics';
import {
  tripPlanFailedProps,
  tripPlanRequestProps,
  tripPlanShownProps,
  tripWhenShownProps,
} from '@/lib/orlando/plan-analytics';
import { oneStop, useResortWord, useTicketName } from './plan-ticket-words';

const VIEW_ICON = { agenda: LayoutList, week: Rows3, month: CalendarDays } as const;

/**
 * The planner's answer, below the setup. Empty, and saying so, until dates are chosen (or a search
 * is set); then the plan from simple to detailed: the answer in sentences (Level 0), the Agenda,
 * Week or Month view (Level 1), a day's sheet (Level 2) and the day planner (Level 3). The previous
 * plan stays on screen, dimmed, while a change is asked for. In the When mode it is the search's
 * answer instead (`PlanWhenResult`).
 */
export function PlanResult({ ref, edit }: { ref?: Ref<HTMLDivElement>; edit: PlanEdit }) {
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
          <Button variant="outline" onClick={edit.dates} className="lg:hidden">
            {t('result.chooseDates')}
          </Button>
        </div>
      ) : (
        <PlanAnswerSection edit={edit} />
      )}
    </section>
  );
}

function WhenAnswer() {
  const t = useTranslations('orlandoPlanner');
  const { state, update } = usePlanContext();
  const query = whenRequestQuery(state);
  const when = useTripWhen(query);
  usePlanEvents(
    when.asked,
    'when',
    when.data && !when.isPlaceholderData && !when.isFetching
      ? tripWhenShownProps(when.data)
      : when.isError && !when.isFetching
        ? tripPlanFailedProps(statusOf(when.error), 'when')
        : null
  );
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

function PlanAnswerSection({ edit }: { edit: PlanEdit }) {
  const t = useTranslations('orlandoPlanner');
  const { state, update, headliners, parkBySlug, tickets: catalog } = usePlanContext();
  const problem = planProblem(state, headliners);
  const missed = ticketProblem(state, catalog);
  const query = planRequestQuery(state, headliners, missed !== null);
  const plan = useTripPlan(query);
  const unpinned = useUnpinnedPlan(query);
  const calendar = useTripCalendar(state.from, state.to);
  usePlanEvents(
    plan.asked,
    'dates',
    plan.data && plan.current && !plan.isFetching
      ? tripPlanShownProps(plan.data)
      : plan.isError && !plan.isFetching
        ? tripPlanFailedProps(statusOf(plan.error), 'dates')
        : null
  );

  const [openDate, setOpenDate] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const days = plan.data?.days;
  const openDay = useCallback(
    (date: string, view: DayOpenedView) => {
      opener.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpenDate(date);
      const kind = days?.find((d) => d.date === date)?.kind;
      if (kind) trackSiteEvent('trip_day_opened', { kind, view });
    },
    [days]
  );
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
  if (missed) return <TicketProblemBox problem={missed} edit={edit} />;
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
    trackSiteEvent('trip_day_sent');
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

      <PlanAnswer plan={data} calendar={calendar.data} onOpenDay={openDay} edit={edit} />

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
        onToggleLock={(d) => {
          trackSiteEvent('trip_day_pinned', { pinned: lockOn(state, d.date) === null });
          withHistory((s) => toggleLock(s, d));
        }}
        onSwap={(a, b) => {
          trackSiteEvent('trip_day_swapped');
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
  edit,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string, view: DayOpenedView) => void;
  edit: PlanEdit;
}) {
  const t = useTranslations('orlandoPlanner');
  const { locale, today, parkName, parkBySlug, state, tickets: catalog } = usePlanContext();
  const resortWord = useResortWord();
  const dropped = useDroppedTickets();
  const parksOf = useDayParks();
  const eveningOf = useEveningName();
  const savings = planSavings(plan.totals);
  const reach = today ? lastYearReach(plan.days, calendar?.meta.forecastUntil, today) : null;
  // One sentence per kind of split, the parks as a list: "EPCOT, Magic Kingdom and Epic Universe
  // get a second day." A split an owned ticket asked for says why.
  const splitGroups = new Map<string, { visits: number; ticket: boolean; parks: string[] }>();
  for (const e of autoSplit(plan.meta)) {
    const key = `${e.visits}:${e.ticket ? 't' : ''}`;
    const group = splitGroups.get(key) ?? {
      visits: e.visits,
      ticket: Boolean(e.ticket),
      parks: [],
    };
    group.parks.push(parkName(e.slug));
    splitGroups.set(key, group);
  }
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  const added = [...splitGroups.values()].map((g) =>
    t(g.ticket ? 'tickets.split' : 'answer.split', {
      parks: list.format(g.parks),
      count: g.parks.length,
      visits: g.visits,
    })
  );
  const anyHopper =
    state.ticket === 'hopper' ||
    state.hopper.length > 0 ||
    hopperTicketResorts(state.tickets, catalog).length > 0;
  const hopWithoutHopper =
    (state.hop && !anyHopper) ||
    plan.days.some((d) => d.warnings.includes('hop_needs_hopper')) ||
    (plan.meta.warnings ?? []).includes('hop_needs_hopper');
  const notes = [
    ...(dropped > 0 ? [t('tickets.linkDropped', { count: dropped })] : []),
    ...(hopWithoutHopper
      ? [t(catalog.size > 0 ? 'tickets.hopNeedsHopper' : 'answer.hopNeedsHopper')]
      : []),
    ...relaxedRules(plan.meta).map((r) => t(`relaxed.${r}`)),
    ...unplacedParks(plan).map((u) =>
      t(u.reason === 'no_ticket_day' ? 'tickets.unplaced' : `unplaced.${u.reason}`, {
        park: parkName(u.slug),
        resort: resortWord(parkBySlug.get(u.slug)?.group ?? ''),
      })
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

      <PlanTicketsCard plan={plan} edit={edit} />

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
              onClick={() => onOpenDay(day.date, 'list')}
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
                {eveningOf(day) && (
                  <span className="text-muted-foreground">
                    {' '}
                    {t('evening.plus', { name: eveningOf(day) ?? '' })}
                  </span>
                )}
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
  onOpenDay: openDay,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string, view: DayOpenedView) => void;
}) {
  const t = useTranslations('orlandoPlanner.views');
  const wide = useMediaQuery(PLAN_WIDE_QUERY);
  const chosen = useSyncExternalStore(
    orlandoPlanView.subscribe,
    orlandoPlanView.getSnapshot,
    orlandoPlanView.getServerSnapshot
  );
  const view: PlanView = chosen ?? (wide ? 'week' : 'agenda');
  const onOpenDay = (date: string) => openDay(date, view);

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
              onClick={() => {
                if (key !== view) trackSiteEvent('trip_view_changed', { view: key });
                orlandoPlanView.set(key);
              }}
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

/**
 * How many items of the address's `tickets` could not be read, for "One ticket in this link isn't
 * one we know". Once the planner writes the address again the item is gone, and so is the line.
 */
function useDroppedTickets(): number {
  const params = useSearchParams();
  const { tickets: catalog } = usePlanContext();
  if (catalog.size === 0) return 0;
  return readTickets(params.get('tickets'), catalog).dropped;
}

/**
 * A ticket the trip's dates miss, said before any request (the API would answer it with a 400),
 * with the two ways out: other dates, or another ticket.
 */
function TicketProblemBox({ problem, edit }: { problem: TicketProblem; edit: PlanEdit }) {
  const t = useTranslations('orlandoPlanner');
  const { state, locale, tickets: catalog } = usePlanContext();
  const name = useTicketName();
  const ticket = state.tickets[problem.index];
  const product = catalog.get(problem.product);
  const window = product && ticket ? ticketWindow(product, ticket) : null;
  const day = (d: string) =>
    formatParkDay(locale, d, { weekday: 'short', day: 'numeric', month: 'short' });
  return (
    <div
      className="border-crowd-high/40 flex flex-col items-start gap-3 rounded-2xl border p-5"
      role="alert"
      data-plan-ticket-problem={problem.kind}
    >
      <p className="text-sm">
        {oneStop(
          t(`tickets.problem.${problem.kind}`, {
            ticket: ticket ? name(ticket) : problem.product,
            start: ticket?.start ? day(ticket.start) : '',
            end: window ? day(window.to) : '',
            from: state.from ? day(state.from) : '',
            to: state.to ? day(state.to) : '',
          })
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={edit.dates}>
          {t('tickets.problem.changeDates')}
        </Button>
        <Button variant="outline" onClick={() => edit.tickets(problem.index)}>
          {t('tickets.problem.changeTicket')}
        </Button>
      </div>
    </div>
  );
}

/** Where a day's sheet was opened from: the answer's list or one of the views. */
type DayOpenedView = SiteEventMap['trip_day_opened']['view'];

/** A failed request's status for the statistic, 0 where nothing answered. */
function statusOf(error: unknown): number {
  return error instanceof PlanRequestError ? error.status : 0;
}

/**
 * Counts `trip_plan_requested` once per query asked, and `trip_plan_shown` once its answer, or its
 * failure, is on screen. `shown` is `null` while the answer is on its way.
 */
function usePlanEvents(
  asked: string | null,
  mode: 'dates' | 'when',
  shown: SiteEventMap['trip_plan_shown'] | null
) {
  const requested = useRef<string | null>(null);
  const answered = useRef<string | null>(null);
  useEffect(() => {
    if (!asked || requested.current === asked) return;
    requested.current = asked;
    trackSiteEvent(
      'trip_plan_requested',
      tripPlanRequestProps(Object.fromEntries(new URLSearchParams(asked)), mode)
    );
  }, [asked, mode]);
  const key = shown ? JSON.stringify(shown) : null;
  useEffect(() => {
    if (!asked || !key || answered.current === asked) return;
    answered.current = asked;
    trackSiteEvent('trip_plan_shown', JSON.parse(key) as SiteEventMap['trip_plan_shown']);
  }, [asked, key]);
}
