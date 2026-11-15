'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type Ref,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CalendarDays, Info, LayoutList, Rows3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { plannerPagePark, type PlannerPagePark } from '@/lib/planner/page-park';
import { plannerPageDay } from '@/lib/planner/page-day';
import { plannerUi } from '@/lib/planner/ui-store';
import { addDays, formatParkDay } from '@/lib/utils/park-day';
import { getListFormat } from '@/lib/utils/intl-format';
import { PlannerPageParkBeacon } from '@/components/planner/planner-page-park-beacon';
import { Button } from '@/components/ui/button';
import {
  MAX_PLAN_VISITS,
  MAX_TRIP_DAYS,
  addParkOnDate,
  addedByEdit,
  dayLockTarget,
  fixedNights,
  freeDay,
  lockOn,
  moveVisit,
  parkDaysAvailable,
  planProblem,
  planRequestQuery,
  plannerParkOf,
  removePark,
  setBaseNights,
  setTripDates,
  swapChange,
  swapLocks,
  toggleLock,
  tripDates,
  type PlanDay,
  type TripPlan,
} from '@/lib/trip-regions/plan';
import { ideaOnDay, type PlanIdea } from '@/lib/trip-regions/plan-ideas';
import {
  autoSplit,
  ignoredLocks,
  lastYearStart,
  planDayLastYear,
  parksLeftOut,
  relaxedRules,
  unplacedParks,
} from '@/lib/trip-regions/plan-copy';
import type { SpareSuggestion } from '@/lib/trip-regions/plan-week';
import { PlanRequestError } from '@/lib/trip-regions/plan-fetch';
import { whenRequestQuery } from '@/lib/trip-regions/plan-when';
import { readTickets } from '@/lib/trip-regions/plan-query';
import {
  asksForTickets,
  hopperResorts,
  hopperTicketResorts,
  ticketProblem,
  ticketWindow,
  type TicketProblem,
} from '@/lib/trip-regions/plan-tickets';
import { tripPlanView, PLAN_VIEWS, type PlanView } from '@/lib/trip-regions/plan-view';
import { connectPlannerSwap } from '@/lib/trip-regions/planner-bridge';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext, useTripEvents } from './plan-context';
import { PLAN_FOCUS, PLAN_WIDE_QUERY } from './plan-controls';
import { PlanAgendaView, type PlanDaySlots } from './plan-agenda-view';
import { DayActionsSheet, PlanDayActions } from './plan-day-actions';
import { PlanEditStatus } from './plan-edit-status';
import { PlanGlowProvider, usePlanGlow } from './plan-day-glow';
import { DayHint, IdeasStrip, useIdeaCardBridge, useShownIdeas } from './plan-ideas';
import { PlanSwapMode } from './plan-swap-mode';
import { PlanDaySheet } from './plan-day-sheet';
import { PlanKeep } from './plan-keep';
import { PlanMonthView } from './plan-month-view';
import { PlanPeakCard } from './plan-peak-card';
import { PlanResultHead } from './plan-result-head';
import { PlanWeekView } from './plan-week-view';
import { PlanWhenResult } from './plan-when-result';
import { useStatePlan, useTripCalendar, useTripWhen, useUnpinnedPlan } from './use-trip-plan';
import { PlanTicketsCard, TicketsAsk, type PlanEdit } from './plan-tickets-card';
import { useBaseName } from './plan-place-words';
import type { SiteEventMap } from '@/lib/analytics/site-analytics';
import {
  leftOutBucket,
  tripPlanFailedProps,
  tripPlanRequestProps,
  tripPlanShownProps,
  tripWhenShownProps,
  type TripEventProps,
} from '@/lib/trip-regions/plan-analytics';
import { oneFullStop } from '@/lib/utils/metadata';
import { useResortWord, useTicketName } from './plan-ticket-words';
import { regionOrShared } from '@/lib/trip-regions/region-words';

const VIEW_ICON = { agenda: LayoutList, week: Rows3, month: CalendarDays } as const;

/** The band over the answer that offers one change to the plan and the button that makes it. */
const ACTION_BAND =
  'border-primary/40 bg-primary/5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border px-4 py-3';

/**
 * The planner's answer, below the way into the assistant. Empty, and saying so, until dates are chosen (or a search
 * is set); then the plan from simple to detailed: the answer in sentences (Level 0), the Agenda,
 * Week or Month view (Level 1), a day's sheet (Level 2) and the day planner (Level 3). The previous
 * plan stays on screen, dimmed, while a change is asked for. In the When mode it is the search's
 * answer instead (`PlanWhenResult`).
 */
export function PlanResult({
  ref,
  edit,
  answers,
}: {
  ref?: Ref<HTMLDivElement>;
  edit: PlanEdit;
  /** The visitor's answers with a way back into each step, at the top of the result (beside it at a desk). */
  answers: ReactNode;
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
        </div>
      ) : (
        <PlanAnswerSection edit={edit} answers={answers} />
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

function PlanAnswerSection({ edit: editSteps, answers }: { edit: PlanEdit; answers: ReactNode }) {
  const t = useTranslations('tripPlanner');
  const {
    region,
    state,
    edit,
    edits,
    headliners,
    regionOrder,
    parkBySlug,
    tickets: catalog,
  } = usePlanContext();
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
  const [beacon, setBeacon] = useState<PlannerPagePark | null>(null);
  // The day whose swap mode is open, and the day whose „Mehr“ sheet is.
  const [swapDate, setSwapDate] = useState<string | null>(null);
  const [moreDate, setMoreDate] = useState<string | null>(null);
  const ideas = useShownIdeas();
  // The ideas Parky offers on his own get their card's words from this planner.
  useIdeaCardBridge();
  const glow = usePlanGlow(edits, plan.waiting);
  // „Anderen Tag“ on the chat's idea card: the swap mode for its park, on the idea's day where the
  // park is there, else on its first. Focus comes back to the card when the mode closes.
  useEffect(
    () =>
      connectPlannerSwap(region.slug, (park, from) => {
        const parkDays = (days ?? []).filter(
          (d) => (d.kind === 'park' || d.kind === 'hop') && d.parks.some((p) => p.slug === park)
        );
        const day = parkDays.find((d) => d.date === from) ?? parkDays[0];
        if (!day) return false;
        opener.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setOpenDate(null);
        setMoreDate(null);
        setSwapDate(day.date);
        return true;
      }),
    [region.slug, days]
  );

  const fill = useCallback(
    (suggestion: SpareSuggestion, from: 'card' | 'week') => {
      track('trip_spare_filled', { from });
      setOpenDate(null);
      edit(
        (s) =>
          addParkOnDate(
            s,
            suggestion.slug,
            suggestion.date,
            suggestion.planned,
            regionOrder,
            headliners
          ) ?? s,
        { kind: 'add', slug: suggestion.slug, date: suggestion.date }
      );
    },
    [track, edit, regionOrder, headliners]
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
  if (missed) return <TicketProblemBox problem={missed} edit={editSteps} />;
  if (!plan.data) {
    return plan.isError ? (
      <Failure error={plan.error} onRetry={() => void plan.refetch()} />
    ) : (
      <Loading text={t('result.loading')} />
    );
  }

  const data = plan.data;
  const day = data.days.find((d) => d.date === openDate) ?? null;
  const swapping = data.days.find((d) => d.date === swapDate) ?? null;
  const moreDay = data.days.find((d) => d.date === moreDate) ?? null;
  const added = addedByEdit(edits.undone ? null : edits.change);

  const pin = (d: PlanDay) => {
    const target = dayLockTarget(d);
    if (!target) return;
    const pinned = lockOn(state, d.date) === null;
    track('trip_day_pinned', { pinned });
    edit((s) => toggleLock(s, d), { kind: 'pin', target, date: d.date, pinned });
  };
  const startSwap = (d: PlanDay) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpenDate(null);
    setMoreDate(null);
    setSwapDate(d.date);
  };
  const endSwap = () => {
    setSwapDate(null);
    requestAnimationFrame(() => opener.current?.isConnected && opener.current.focus());
  };
  const pickSwap = (a: PlanDay, b: PlanDay) => {
    const change = swapChange(a, b);
    setSwapDate(null);
    if (!change) return;
    track('trip_day_swapped');
    edit((s) => {
      const locks = swapLocks(s, a, b);
      return locks ? { ...s, locks } : s;
    }, change);
  };
  const moveTo = (d: PlanDay, date: string) => {
    const slug = d.parks[0]?.slug;
    setMoreDate(null);
    if (!slug) return;
    track('trip_day_moved');
    edit((s) => moveVisit(s, d, date) ?? s, { kind: 'move', slug, from: d.date, to: date });
  };
  const free = (d: PlanDay) => {
    const slug = d.parks[0]?.slug;
    setMoreDate(null);
    if (!slug) return;
    track('trip_day_freed');
    edit((s) => freeDay(s, d) ?? s, { kind: 'free', slug, date: d.date });
  };
  const remove = (d: PlanDay) => {
    const slug = d.parks[0]?.slug;
    setMoreDate(null);
    if (!slug) return;
    track('trip_park_removed');
    const days = data.parks.find((p) => p.slug === slug)?.dates.length ?? 1;
    edit((s) => removePark(s, slug, regionOrder, headliners) ?? s, {
      kind: 'remove',
      slug,
      days,
    });
  };
  const openMore = (d: PlanDay) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMoreDate(d.date);
  };
  const slots: PlanDaySlots = {
    dayActions: (d) => <PlanDayActions day={d} onPin={pin} onSwap={startSwap} onMore={openMore} />,
    dayHint: (d) => {
      const idea = ideaOnDay(ideas, d.date);
      return idea ? <DayHint idea={idea} /> : null;
    },
  };

  const planDay = (slug: string, date: string) => {
    const park = parkBySlug.get(slug);
    const filed = park ? plannerParkOf(park) : null;
    if (!filed) return;
    setOpenDate(null);
    setMoreDate(null);
    const page = { slug, name: filed.name, geo: filed.geo, timezone: filed.timezone };
    // Published at once, not in the beacon's effect: the wizard reads it in the commit the request
    // opens. The beacon keeps it for as long as the hub is on screen, and clears it after.
    plannerPagePark.set(page);
    setBeacon(page);
    plannerPageDay.set({ parkSlug: slug, date });
    plannerUi.requestOpen(`${region.slug}-trip-day`, 'page-park-wizard');
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

      <PlanEditStatus plan={data} best={unpinned.data ?? null} calendar={calendar.data} />

      <PlanGlowProvider value={glow}>
        <PlanAnswer
          plan={data}
          calendar={calendar.data}
          onOpenDay={openDay}
          onFill={fill}
          added={added}
          edit={editSteps}
          answers={answers}
          ideas={ideas}
          slots={slots}
          swap={
            swapping
              ? {
                  day: swapping,
                  onPick: (other) => pickSwap(swapping, other),
                  onClose: endSwap,
                }
              : null
          }
        />
      </PlanGlowProvider>

      <PlanDaySheet
        day={day}
        plan={data}
        calendar={calendar.data}
        onClose={() => setOpenDate(null)}
        onFill={(s) => fill(s, 'card')}
        onToggleLock={pin}
        onSwap={startSwap}
        onPlanDay={planDay}
        returnFocus={() => opener.current?.isConnected && opener.current.focus()}
      />

      <DayActionsSheet
        day={moreDay}
        plan={data}
        calendar={calendar.data}
        onClose={() => setMoreDate(null)}
        onPin={(d) => {
          setMoreDate(null);
          pin(d);
        }}
        onSwap={startSwap}
        onMove={moveTo}
        onFree={free}
        onRemove={remove}
        onPlanDay={planDay}
        returnFocus={() => opener.current?.isConnected && opener.current.focus()}
      />
    </div>
  );
}

/**
 * Level 0 and 1: the answer. On a phone, top to bottom: the visitor's answers, the trip's head
 * (`PlanResultHead`), the peak wait (`PlanPeakCard`), the parks that did not fit with their three
 * ways out, the stay suggestion, last year's line, then the days in the chosen view, what the plan
 * had to give up, the tickets and Keep. At a desk the answers, the peak wait, the tickets and Keep
 * are a column of 340 px on the left, and the head and the days take the rest.
 */
function PlanAnswer({
  plan,
  calendar,
  onOpenDay,
  onFill,
  added,
  edit,
  answers,
  ideas,
  slots,
  swap,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string, view: DayOpenedView) => void;
  onFill: (suggestion: SpareSuggestion, from: 'card' | 'week') => void;
  added: { slug: string; date: string } | null;
  edit: PlanEdit;
  answers: ReactNode;
  /** Parky's ideas, over the days and under the day each changes. */
  ideas: readonly PlanIdea[];
  slots: PlanDaySlots;
  /** The swap mode, which takes the views' place while it is open. */
  swap: { day: PlanDay; onPick: (other: PlanDay) => void; onClose: () => void } | null;
}) {
  const t = useTranslations('tripPlanner');
  const tRegion = useTranslations('tripRegion.planner');
  const { locale, parkName, parkBySlug, state, tickets: catalog, ticketStep } = usePlanContext();
  const resortWord = useResortWord();
  const dropped = useDroppedTickets();
  const lastYear = lastYearStart(
    plan.days.filter((d) => d.kind === 'park' || d.kind === 'hop'),
    planDayLastYear
  );
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
  const splitLines = [...splitGroups.values()].map((g) =>
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
      ? [
          catalog.size > 0
            ? t('tickets.hopNeedsHopper')
            : t('answer.hopNeedsHopper', { options: t('wizard.steps.evenings') }),
        ]
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
  const ticketsAsked = asksForTickets(ticketStep, catalog);

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-8">
      <div className="lg:col-start-1 lg:row-start-1">{answers}</div>

      <div className="flex min-w-0 flex-col gap-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <PlanResultHead plan={plan} />
        <PlanPeakCard plan={plan} calendar={calendar} className="lg:hidden" />
        <LeftOut plan={plan} edit={edit} />
        <StaySuggestion plan={plan} />
        <IdeasStrip ideas={ideas} />

        {lastYear && (
          <p className="text-muted-foreground flex gap-2 text-sm" role="note">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {lastYear.all
              ? t('answer.lastYearAll')
              : t('answer.lastYear', {
                  date: formatParkDay(locale, lastYear.from, { day: 'numeric', month: 'long' }),
                })}
          </p>
        )}

        {swap ? (
          <PlanSwapMode
            day={swap.day}
            plan={plan}
            calendar={calendar}
            onPick={swap.onPick}
            onClose={swap.onClose}
          />
        ) : (
          <PlanViews
            plan={plan}
            calendar={calendar}
            onOpenDay={onOpenDay}
            onFill={onFill}
            added={added}
            slots={slots}
          />
        )}

        {splitLines.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {splitLines.map((line) => (
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
      </div>

      <div className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-16 lg:col-start-1 lg:row-start-2">
        <PlanPeakCard plan={plan} calendar={calendar} className="hidden lg:flex" />
        <PlanTicketsCard
          plan={plan}
          edit={edit}
          ask={
            ticketsAsked && state.tickets.length === 0 ? (
              <TicketsAsk onAsk={() => edit.tickets('ask')} />
            ) : null
          }
        />
        <PlanKeep plan={plan} calendar={calendar} />
      </div>
    </div>
  );
}

/**
 * The parks the trip had no day for, said in one sentence with the three ways to make room: a park
 * on the travel days, other parks, a longer trip. The plan above it is the best of what fits.
 */
function LeftOut({ plan, edit }: { plan: TripPlan; edit: PlanEdit }) {
  const t = useTranslations('tripPlanner');
  const { state, update, locale, parkName } = usePlanContext();
  const track = useTripEvents();
  const left = parksLeftOut(plan);
  if (left.length === 0) return null;
  const fixed = (fix: 'travel_days' | 'parks' | 'longer') =>
    track('trip_left_out_fix', { fix, left_out: leftOutBucket(left.length) });
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
            onClick={() => {
              fixed('travel_days');
              update((s) => ({ ...s, arrival: 'park', departure: 'park' }));
            }}
          >
            {t('answer.travelDays')}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fixed('parks');
            edit.parks('left_out');
          }}
        >
          {t('result.editParks')}
        </Button>
        {longer > 0 && state.from && state.to && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fixed('longer');
              update((s) => (s.from && s.to ? setTripDates(s, s.from, addDays(s.to, longer)) : s));
            }}
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
  const track = useTripEvents();
  const baseName = useBaseName();
  const suggestion = plan.meta.staySuggestion;
  const shown = suggestion && JSON.stringify(suggestion);
  useEffect(() => {
    if (shown) track('trip_stay_suggestion', { action: 'shown' });
  }, [shown, track]);
  if (!suggestion) return null;
  const order = (region.bases ?? []).map((b) => b.key);
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  const changes = list.format(
    Object.entries(suggestion.nights).map(([base, count]) =>
      t('route.stayShort', { city: baseName(base), count })
    )
  );
  return (
    <div className={ACTION_BAND} role="status" data-plan-stay-suggestion="">
      <p className="min-w-0 flex-1 text-sm">
        {oneFullStop(
          t('answer.staySuggestion', {
            changes,
            minutes: Math.round(suggestion.savedMinutesPerRide),
            park: parkName(suggestion.park),
            date: formatParkDay(locale, suggestion.date, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            }),
          })
        )}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          track('trip_stay_suggestion', { action: 'applied' });
          update((s) =>
            Object.entries(suggestion.nights).reduce(
              (next, [base, count]) => setBaseNights(next, base, count, order),
              s
            )
          );
        }}
      >
        {t('answer.planThisWay')}
      </Button>
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
  onFill,
  added,
  slots,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string, view: DayOpenedView) => void;
  onFill: (suggestion: SpareSuggestion, from: 'card' | 'week') => void;
  added: { slug: string; date: string } | null;
  slots: PlanDaySlots;
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
      {view === 'week' && (
        <PlanWeekView
          plan={plan}
          calendar={calendar}
          onOpenDay={onOpenDay}
          onFill={(s) => onFill(s, 'week')}
        />
      )}
      {view === 'month' && <PlanMonthView plan={plan} calendar={calendar} onOpenDay={onOpenDay} />}
      {view === 'agenda' && (
        <PlanAgendaView
          plan={plan}
          calendar={calendar}
          onOpenDay={onOpenDay}
          onFill={(s) => onFill(s, 'card')}
          added={added}
          {...slots}
        />
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
        {oneFullStop(
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
        <Button variant="outline" onClick={() => edit.dates('ticket_problem')}>
          {t('tickets.problem.changeDates')}
        </Button>
        <Button variant="outline" onClick={() => edit.tickets('ticket_problem', problem.index)}>
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
