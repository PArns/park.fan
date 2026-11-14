'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type Ref,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CalendarDays,
  ChevronDown,
  LayoutList,
  MapPinned,
  Route,
  Rows3,
  SlidersHorizontal,
  Ticket,
  Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { plannerPagePark, type PlannerPagePark } from '@/lib/planner/page-park';
import { plannerPageDay } from '@/lib/planner/page-day';
import { plannerUi } from '@/lib/planner/ui-store';
import { addDays, formatParkDay, formatParkDayRange } from '@/lib/utils/park-day';
import { getListFormat } from '@/lib/utils/intl-format';
import { PlannerPageParkBeacon } from '@/components/planner/planner-page-park-beacon';
import { Button } from '@/components/ui/button';
import {
  MAX_PLAN_VISITS,
  MAX_TRIP_DAYS,
  fixedNights,
  lockOn,
  parkDaysAvailable,
  planProblem,
  planRequestQuery,
  plannerParkOf,
  setBaseNights,
  setTripDates,
  swapLocks,
  toggleLock,
  tripDates,
  type PlanDay,
  type PlanLock,
  type TripPlan,
} from '@/lib/trip-regions/plan';
import {
  autoSplit,
  editCost,
  ignoredLocks,
  lastYearReach,
  parksLeftOut,
  planSavings,
  relaxedRules,
  unplacedParks,
} from '@/lib/trip-regions/plan-copy';
import { PlanRequestError } from '@/lib/trip-regions/plan-fetch';
import { whenRequestQuery } from '@/lib/trip-regions/plan-when';
import { planStays } from '@/lib/trip-regions/plan-stays';
import { readTickets } from '@/lib/trip-regions/plan-query';
import {
  hopperResorts,
  hopperTicketResorts,
  ticketProblem,
  ticketWindow,
  type TicketProblem,
} from '@/lib/trip-regions/plan-tickets';
import { tripPlanView, PLAN_VIEWS, type PlanView } from '@/lib/trip-regions/plan-view';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext, useTripEvents } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanAgendaView } from './plan-agenda-view';
import { PlanDaySheet } from './plan-day-sheet';
import { PlanKeep } from './plan-keep';
import { PlanMonthView } from './plan-month-view';
import { PLAN_WIDE_QUERY } from './plan-setup';
import { PlanWeekView } from './plan-week-view';
import { PlanWhenResult } from './plan-when-result';
import { useStatePlan, useTripCalendar, useTripWhen, useUnpinnedPlan } from './use-trip-plan';
import { PlanTicketsCard, type PlanEdit } from './plan-tickets-card';
import { PlanTickets, type TicketStep } from './plan-tickets';
import { useBaseName } from './plan-place-words';
import type { SiteEventMap } from '@/lib/analytics/site-analytics';
import {
  tripPlanFailedProps,
  tripPlanRequestProps,
  tripPlanShownProps,
  tripWhenShownProps,
  type TripEventProps,
} from '@/lib/trip-regions/plan-analytics';
import { oneStop, useResortWord, useTicketName } from './plan-ticket-words';
import { regionOrShared } from '@/lib/trip-regions/region-words';

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
  edit,
  step,
  ticketsOpen,
  onTicketsOpen,
  defaultMonth,
}: {
  ref?: Ref<HTMLDivElement>;
  edit: PlanEdit;
  /** The ticket step, which the answer opens in place at a desk. */
  step: TicketStep;
  ticketsOpen: boolean;
  onTicketsOpen: (open: boolean) => void;
  defaultMonth?: string;
}) {
  const t = useTranslations('tripPlanner');
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
        <PlanAnswerSection
          edit={edit}
          tickets={
            ticketsOpen ? (
              <DeskTickets
                step={step}
                defaultMonth={defaultMonth}
                onClose={() => onTicketsOpen(false)}
              />
            ) : null
          }
        />
      )}
    </section>
  );
}

function WhenAnswer() {
  const t = useTranslations('tripPlanner');
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
  const t = useTranslations('tripPlanner.result');
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

function PlanAnswerSection({
  edit,
  tickets,
}: {
  edit: PlanEdit;
  /** The ticket step in place at a desk, under the tickets or under what holds the plan back. */
  tickets: ReactNode;
}) {
  const t = useTranslations('tripPlanner');
  const { region, state, update, headliners, parkBySlug, tickets: catalog } = usePlanContext();
  const track = useTripEvents();
  const problem = planProblem(state, headliners);
  const missed = ticketProblem(state, catalog);
  const query = planRequestQuery(state, headliners, missed !== null);
  const plan = useStatePlan();
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
      if (kind) track('trip_day_opened', { kind, view });
    },
    [days, track]
  );
  const [history, setHistory] = useState<PlanLock[][]>([]);
  // The last edit, when it was a swap: the edit bar says what moved where, not "pinned".
  const [swapped, setSwapped] = useState<{ a: PlanDay; b: PlanDay } | null>(null);
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
          {t(`problem.${problem}`, {
            days: MAX_TRIP_DAYS,
            max: MAX_PLAN_VISITS,
            fixed: fixedNights(state),
            nights: Math.max(0, tripDates(state).length - 1),
          })}
        </p>
      </div>
    );
  }
  if (missed) {
    return (
      <>
        <TicketProblemBox problem={missed} edit={edit} />
        {tickets}
      </>
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
    plannerUi.requestOpen(`${region.slug}-hub`, 'page-park-wizard');
    track('trip_day_sent');
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
      {tickets}

      {state.locks.length > 0 && (
        <EditBar
          plan={data}
          best={unpinned.data ?? null}
          swapped={swapped}
          canUndo={history.length > 0}
          onUndo={() => {
            const previous = history.at(-1);
            setHistory((h) => h.slice(0, -1));
            setSwapped(null);
            if (previous) update((s) => ({ ...s, locks: previous }));
          }}
          onRelease={() => {
            setSwapped(null);
            withHistory((s) => ({ ...s, locks: [] }));
          }}
        />
      )}

      <PlanKeep plan={data} calendar={calendar.data} />

      <PlanDaySheet
        day={day}
        plan={data}
        calendar={calendar.data}
        onClose={() => setOpenDate(null)}
        onToggleLock={(d) => {
          track('trip_day_pinned', { pinned: lockOn(state, d.date) === null });
          setSwapped(null);
          withHistory((s) => toggleLock(s, d));
        }}
        onSwap={(a, b) => {
          track('trip_day_swapped');
          setOpenDate(null);
          setSwapped({ a, b });
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
 * Level 0 and 1: the answer. The trip's dates and what they hold, the parks that did not fit, then
 * the days themselves in the chosen view (the list, the Week or the Month), and under them one line:
 * the peak wait on the planned days against the average of the trip's days, with how accurate that
 * is one press away. Then what the plan had to give up, the three ways to change it, and the
 * tickets: what to buy, or the visitor's own.
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
  const t = useTranslations('tripPlanner');
  const tRegion = useTranslations('tripRegion.planner');
  const {
    locale,
    today,
    parkName,
    parkBySlug,
    state,
    region,
    tickets: catalog,
    ticketStep,
  } = usePlanContext();
  const resortWord = useResortWord();
  const dropped = useDroppedTickets();
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
    ...relaxedRules(plan.meta).map((r) => regionOrShared(tRegion, t, `relaxed.${r}`)),
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
  const ticketsAsked = ticketStep.resorts.length > 0 && catalog.size > 0;
  const bases = (region.bases?.length ?? 0) > 0;
  const stays = planStays(plan);

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
          {stays.length > 1 &&
            ` · ${t('answer.moves', { cities: stays.length, moves: plan.totals.moves ?? stays.length - 1 })}`}
        </p>
      </div>

      <LeftOut plan={plan} edit={edit} />
      <StaySuggestion plan={plan} />

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

      <PlanViews plan={plan} calendar={calendar} onOpenDay={onOpenDay} />

      <PeakLine plan={plan} />

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

      <div className="flex flex-wrap gap-2" data-plan-changes="">
        <Button variant="outline" size="sm" onClick={edit.parks}>
          <MapPinned aria-hidden="true" />
          {t('result.editParks')}
        </Button>
        {bases && edit.route && (
          <Button variant="outline" size="sm" onClick={edit.route}>
            <Route aria-hidden="true" />
            {t('result.editRoute')}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={edit.options}>
          <SlidersHorizontal aria-hidden="true" />
          {t('setup.fineTune')}
        </Button>
      </div>

      <PlanTicketsCard
        plan={plan}
        edit={edit}
        ask={ticketsAsked && state.tickets.length === 0 ? <TicketsAsk edit={edit} /> : null}
      />
    </div>
  );
}

/**
 * The one line under the days: the peak wait on them, and how much less it is than the average of
 * the trip's days, or that the order barely matters. "How accurate is this?" holds the average
 * itself and the forecast's measured error.
 */
function PeakLine({ plan }: { plan: TripPlan }) {
  const t = useTranslations('tripPlanner.answer');
  const savings = planSavings(plan.totals);
  const id = useId();
  const [open, setOpen] = useState(false);
  if (!savings) return null;
  return (
    <div className="flex flex-col gap-1" data-plan-savings="">
      <p className="text-sm">
        {savings.kind === 'flat'
          ? t('peakFlat', { minutes: savings.planned })
          : t('peakSaved', { minutes: savings.planned, saved: savings.saved })}{' '}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'text-primary-ink inline-flex min-h-11 items-center gap-1 rounded-md px-1 font-medium underline-offset-4 hover:underline lg:min-h-0',
            PLAN_FOCUS
          )}
        >
          {t('accuracy')}
          <ChevronDown
            className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      </p>
      <p id={id} hidden={!open} className="text-muted-foreground text-sm">
        {t('averageDay', { minutes: savings.average })}
        {savings.expectedError !== null && ` ${t('error', { minutes: savings.expectedError })}`}
      </p>
    </div>
  );
}

/** "Already have tickets? Add them": the way to the ticket step once there is a plan. */
function TicketsAsk({ edit }: { edit: PlanEdit }) {
  const t = useTranslations('tripPlanner.tickets');
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-sm" data-plan-tickets-ask="">
      {t('later')}
      <button
        type="button"
        onClick={() => edit.tickets()}
        className={cn(
          'text-primary-ink hover:bg-primary/10 -my-2 min-h-11 rounded-md px-2 font-medium transition-colors',
          PLAN_FOCUS
        )}
      >
        {t('enter')}
      </button>
    </p>
  );
}

/** The ticket step in place at a desk, opened from the answer; a phone gets it as a sheet. */
function DeskTickets({
  step,
  defaultMonth,
  onClose,
}: {
  step: TicketStep;
  defaultMonth?: string;
  onClose: () => void;
}) {
  const t = useTranslations('tripPlanner');
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      tabIndex={-1}
      data-plan-tickets-panel=""
      className="border-border/60 bg-muted/30 hidden scroll-mt-16 flex-col gap-4 rounded-2xl border p-4 outline-none lg:flex"
    >
      <div className="flex items-center gap-2">
        <Ticket className="text-primary-ink size-4 shrink-0" aria-hidden="true" />
        <h4 id={id} className="min-w-0 flex-1 text-base font-semibold">
          {t('tickets.yours')}
        </h4>
        <Button variant="outline" size="sm" onClick={onClose}>
          {t('setup.done')}
        </Button>
      </div>
      <PlanTickets step={step} defaultMonth={defaultMonth} wide />
    </section>
  );
}

/**
 * The parks the trip had no day for, said in one sentence with the three ways to make room: a park
 * on the travel days, other parks, a longer trip. The plan above it is the best of what fits.
 */
function LeftOut({ plan, edit }: { plan: TripPlan; edit: PlanEdit }) {
  const t = useTranslations('tripPlanner');
  const { state, update, locale, parkName } = usePlanContext();
  const left = parksLeftOut(plan);
  if (left.length === 0) return null;
  const length = tripDates(state).length;
  const longer = Math.min(left.length, MAX_TRIP_DAYS - length);
  const travelFree = state.arrival === 'free' || (length > 1 && state.departure === 'free');
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  return (
    <div
      className="border-crowd-high/40 flex flex-col items-start gap-3 rounded-2xl border p-4"
      role="status"
      data-plan-left-out=""
    >
      <p className="text-sm font-medium">
        {t('answer.leftOut', {
          parks: list.format(left.map(parkName)),
          count: left.length,
          days: parkDaysAvailable(state),
        })}
      </p>
      <div className="flex flex-wrap gap-2">
        {travelFree && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => update((s) => ({ ...s, arrival: 'park', departure: 'park' }))}
          >
            {t('answer.travelDays')}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={edit.parks}>
          {t('result.editParks')}
        </Button>
        {longer > 0 && state.from && state.to && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              update((s) => (s.from && s.to ? setTripDates(s, s.from, addDays(s.to, longer)) : s))
            }
          >
            {t('answer.longer', { count: longer })}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * With nights the visitor fixed, the API's one-night change that saves most, in one sentence with
 * "Plan it this way", which writes those nights.
 */
function StaySuggestion({ plan }: { plan: TripPlan }) {
  const t = useTranslations('tripPlanner');
  const { region, update, locale, parkName } = usePlanContext();
  const baseName = useBaseName();
  const suggestion = plan.meta.staySuggestion;
  if (!suggestion) return null;
  const order = (region.bases ?? []).map((b) => b.key);
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  const changes = list.format(
    Object.entries(suggestion.nights).map(([base, count]) =>
      t('route.stayShort', { city: baseName(base), count })
    )
  );
  return (
    <div
      className="border-primary/40 bg-primary/5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border px-4 py-3"
      role="status"
      data-plan-stay-suggestion=""
    >
      <p className="min-w-0 flex-1 text-sm">
        {t('answer.staySuggestion', {
          changes,
          minutes: Math.round(suggestion.savedMinutesPerRide),
          park: parkName(suggestion.park),
          date: formatParkDay(locale, suggestion.date, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          }),
        })}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          update((s) =>
            Object.entries(suggestion.nights).reduce(
              (next, [base, count]) => setBaseNights(next, base, count, order),
              s
            )
          )
        }
      >
        {t('answer.planThisWay')}
      </Button>
    </div>
  );
}

/** What the visitor's pins cost against the best order without them, with Undo and Release. */
function EditBar({
  plan,
  best,
  swapped,
  canUndo,
  onUndo,
  onRelease,
}: {
  plan: TripPlan;
  best: TripPlan | null;
  /** The swap that was the last edit, said as one: what is on which day now. */
  swapped: { a: PlanDay; b: PlanDay } | null;
  canUndo: boolean;
  onUndo: () => void;
  onRelease: () => void;
}) {
  const t = useTranslations('tripPlanner.edit');
  const tDay = useTranslations('tripPlanner.day');
  const { locale, parkName } = usePlanContext();
  const cost = editCost(best?.totals ?? null, plan.totals);
  const what = (d: PlanDay) =>
    d.kind === 'rest' ? tDay('rest') : parkName(d.parks[0]?.slug ?? '');
  const short = (date: string) => formatParkDay(locale, date, { weekday: 'short' });
  if (swapped) {
    return (
      <div
        className="border-primary/40 bg-primary/5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border px-4 py-3"
        role="status"
        data-plan-swapped=""
      >
        <p className="min-w-0 flex-1 text-sm">
          {t('swapped', {
            first: what(swapped.a),
            firstDay: short(swapped.b.date),
            second: what(swapped.b),
            secondDay: short(swapped.a.date),
          })}
          {cost && ` ${t('swappedCost', { current: cost.current, best: cost.best })}`}
        </p>
        <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
          <Undo2 aria-hidden="true" />
          {t('undo')}
        </Button>
      </div>
    );
  }
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
  const t = useTranslations('tripPlanner.views');
  const track = useTripEvents();
  const wide = useMediaQuery(PLAN_WIDE_QUERY);
  const choice = tripPlanView(usePlanContext().region.slug);
  const chosen = useSyncExternalStore(
    choice.subscribe,
    choice.getSnapshot,
    choice.getServerSnapshot
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
                if (key !== view) track('trip_view_changed', { view: key });
                choice.set(key);
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
  const t = useTranslations('tripPlanner');
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
  shown: TripEventProps<'trip_plan_shown'> | null
) {
  const requested = useRef<string | null>(null);
  const answered = useRef<string | null>(null);
  const track = useTripEvents();
  const { tickets: catalog } = usePlanContext();
  useEffect(() => {
    if (!asked || requested.current === asked) return;
    requested.current = asked;
    track(
      'trip_plan_requested',
      tripPlanRequestProps(
        Object.fromEntries(new URLSearchParams(asked)),
        mode,
        hopperResorts(catalog)
      )
    );
  }, [asked, mode, track, catalog]);
  const key = shown ? JSON.stringify(shown) : null;
  useEffect(() => {
    if (!asked || !key || answered.current === asked) return;
    answered.current = asked;
    track('trip_plan_shown', JSON.parse(key) as TripEventProps<'trip_plan_shown'>);
  }, [asked, key, track]);
}
