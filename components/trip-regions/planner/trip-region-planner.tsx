'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { parkToday } from '@/lib/planner/park-time';
import { DEFAULT_PLAN_STATE, tripHotelKinds, type TripPlanState } from '@/lib/trip-regions/plan';
import { TRIP_PLANNER_ID } from '@/lib/trip-regions/paths';
import { tripPlannerUi, type TripPlannerStartSource } from '@/lib/trip-regions/planner-ui';
import type { TripWizardStepKey } from '@/lib/trip-regions/wizard-steps';
import { requireTripRegion, type TripTicketStep } from '@/lib/trip-regions/registry';
import { shortParkName } from '@/lib/trip-regions/hub-data';
import { ticketCatalog } from '@/lib/trip-regions/plan-tickets';
import { trackTripEvent } from '@/lib/trip-regions/plan-analytics';
import type { PlanEdit } from './plan-tickets-card';
import type { TripRegion } from '@/lib/trip-regions/types';
import {
  PlanContextProvider,
  usePlanContext,
  useTripEvents,
  type PlanContextValue,
  type PlanParkPhoto,
} from './plan-context';
import { PlanResult } from './plan-result';
import { useTicketStep } from './plan-tickets';
import { usePlanState } from './use-plan-state';
import { ParkyTripInterviewButton } from '@/components/assistant/parky-trip-interview-button';
import { Button } from '@/components/ui/button';
import { TripWizard, type TripWizardAt } from '../wizard/trip-wizard';

/** What the hub hands the planner. */
export interface TripRegionPlannerProps {
  /** `GET /v1/trip-regions/:region`, as the page rendered it. */
  region: TripRegion;
  locale: string;
  /** `YYYY-MM`: the month the date picker opens on, a month page's own. */
  defaultMonth?: string;
  /**
   * The parks' photos for the Week view's blocks, resolved on the server
   * (`tripPlannerPhotos`, `lib/trip-regions/plan-photos.ts`); blocks without one are drawn plain.
   */
  photos?: Readonly<Record<string, PlanParkPhoto>>;
}

const NO_PHOTOS: Readonly<Record<string, PlanParkPhoto>> = {};
/** The ticket step of a region without one: no resorts, so the step is not drawn. */
const NO_TICKET_STEP: TripTicketStep = {
  resorts: [],
  entries: [],
  hopperNames: {},
  homeMarket: '',
};
const noUpdate = () => undefined;
/** The result's own ticket panel stays shut: the assistant's Tickets step is where tickets go. */
const noTicketsPanel = () => undefined;

/**
 * The trip planner of a region's hub: which park on which day of a trip, from the API's `/plan`.
 *
 * The visitor's choice is the address bar's query in the API's own names (`use-plan-state.ts`),
 * so a link from Parky or "Copy link" opens the same plan, and a change re-plans without a
 * remount. Nothing is planned until dates are chosen; the result is never a sample.
 *
 * Reading the query makes a prerendered page render this part in the browser, so it sits in a
 * Suspense boundary whose fallback is the same planner with nothing chosen and nothing to press:
 * the same boxes, so the swap after hydration moves nothing. The questions are asked by the
 * assistant (`TripWizard`), a dialog that "Reise planen" opens; the result goes from the answer
 * (Level 0) to the views (Level 1) to a day's details (Level 2) to the day planner (Level 3);
 * docs/features/orlando-planner.md.
 */
export function TripRegionPlanner({
  region,
  locale,
  defaultMonth,
  photos,
}: TripRegionPlannerProps) {
  return (
    <Suspense
      fallback={
        <PlannerFrame
          region={region}
          locale={locale}
          defaultMonth={defaultMonth}
          photos={photos}
          state={DEFAULT_PLAN_STATE}
          update={noUpdate}
          live={false}
        />
      }
    >
      <LivePlanner region={region} locale={locale} defaultMonth={defaultMonth} photos={photos} />
    </Suspense>
  );
}

function LivePlanner(props: TripRegionPlannerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  // A link that names the planner (Parky's, a copied one) lands on it with the focus in it, also
  // when the visitor is already on the page and only the query changed.
  const slug = props.region.slug;
  const onExternal = useCallback(() => {
    if (window.location.hash !== `#${TRIP_PLANNER_ID}`) return;
    // A link that carries a plan or a search (a shared one, Parky's, a best-time page's).
    if (window.location.search.length > 1) {
      trackTripEvent(slug, 'trip_planner_started', { source: 'link' });
    }
    const root = rootRef.current;
    if (!root) return;
    const target = document.getElementById(TRIP_PLANNER_ID) ?? root;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
    root.focus({ preventScroll: true });
  }, [slug]);
  const { state, update } = usePlanState(props.region, onExternal);
  return <PlannerFrame {...props} state={state} update={update} live rootRef={rootRef} />;
}

function PlannerFrame({
  region,
  locale,
  defaultMonth,
  photos,
  state,
  update,
  live,
  rootRef,
}: TripRegionPlannerProps & {
  state: TripPlanState;
  update: PlanContextValue['update'];
  live: boolean;
  rootRef?: RefObject<HTMLDivElement | null>;
}) {
  const now = useBrowserNow(live);
  const today = now ? parkToday(region.timezone, now.getTime()) : null;

  const context = useMemo<PlanContextValue>(() => {
    const parkBySlug = new Map(region.parks.map((p) => [p.slug, p]));
    const config = requireTripRegion(region.slug);
    return {
      region,
      config,
      ticketStep: config.tickets ?? NO_TICKET_STEP,
      hotels: tripHotelKinds(region, config.hotels),
      locale,
      timeZone: region.timezone,
      parkBySlug,
      parkName: (slug: string) => {
        const name = parkBySlug.get(slug)?.name;
        return name ? shortParkName(name) : slug;
      },
      venueByKey: new Map((region.venues ?? []).map((v) => [v.key, v])),
      groupByKey: new Map(region.groups.map((g) => [g.key, g])),
      headliners: region.parks.filter((p) => p.headliner).map((p) => p.slug),
      regionOrder: region.parks.map((p) => p.slug),
      areaKeys: new Set(region.hotelAreas.map((a) => a.key)),
      tickets: ticketCatalog(region.tickets),
      state,
      update,
      today,
      photos: photos ?? NO_PHOTOS,
      live,
    };
  }, [region, locale, state, update, today, photos, live]);

  return (
    <PlanContextProvider value={context}>
      <div
        ref={rootRef}
        tabIndex={-1}
        data-trip-planner=""
        className="flex flex-col gap-6 outline-none"
      >
        <PlannerBody defaultMonth={defaultMonth} />
      </div>
    </PlanContextProvider>
  );
}

const SMOOTH = '(prefers-reduced-motion: reduce)';
const scrollTo = (target: HTMLElement | null) => {
  if (!target) return;
  const smooth = !window.matchMedia(SMOOTH).matches;
  target.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
};

/**
 * The way into the assistant, the assistant itself and the result: the hub's and the result's
 * signals open it (`tripPlannerUi`), the phone's Back button closes it, and leaving it for the plan
 * puts the answer at the top of the screen with the focus in it.
 */
function PlannerBody({ defaultMonth }: { defaultMonth?: string }) {
  const t = useTranslations('tripPlanner');
  const { live, state, region } = usePlanContext();
  const track = useTripEvents();
  const step = useTicketStep();
  const [wizard, setWizard] = useState<TripWizardAt | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const toResult = useRef(false);
  const close = useCallback(() => setWizard(null), []);
  const screen = wizard?.screen;
  const closedByVisitor = useCallback(() => {
    if (screen) track('trip_wizard_closed', { step: screen });
    close();
  }, [close, screen, track]);
  useSheetHistory(wizard !== null, closedByVisitor);

  /** A start: the assistant on its first step. */
  const start = useCallback(
    (source: 'hero' | 'button' | TripPlannerStartSource) => {
      track('trip_planner_started', { source });
      setWizard({ screen: 'dates', via: 'start' });
    },
    [track]
  );
  /** A way back in from the result: the assistant on that step. */
  const reopen = useCallback(
    (screenKey: TripWizardStepKey) => setWizard({ screen: screenKey, via: 'answers' }),
    []
  );

  // The hub's hero and landing, and the result's answers, ask through `tripPlannerUi`.
  useEffect(() => {
    if (!live) return;
    const answer = () => {
      const request = tripPlannerUi.take();
      if (!request) return;
      if (request.kind === 'start') start(request.source);
      else reopen(request.step);
    };
    answer();
    return tripPlannerUi.subscribe(answer);
  }, [live, start, reopen]);

  const focusResult = useCallback(() => {
    const target = resultRef.current;
    if (!target) return;
    scrollTo(target);
    target.focus({ preventScroll: true });
  }, []);
  /** Leave the assistant for the plan, which takes the focus once the dialog is gone. */
  const showPlan = useCallback(() => {
    toResult.current = true;
    close();
    requestAnimationFrame(() => requestAnimationFrame(focusResult));
  }, [close, focusResult]);

  /** The result's ways back into the plan's questions, each the assistant on its step. */
  const edit = useMemo<PlanEdit>(
    () => ({
      tickets: (from, index) => {
        step.open(from);
        if (index !== undefined) step.focusTicket(index);
        reopen('tickets');
      },
      parks: () => reopen('parks'),
      options: () => reopen('hotel'),
      route: () => reopen('route'),
      dates: () => reopen('dates'),
    }),
    [step, reopen]
  );

  const dated = Boolean((state.from && state.to) || state.when);

  return (
    <>
      {live && <ParkyTripInterviewButton region={region.slug} />}
      {!dated && (
        <Button size="lg" className="self-start" disabled={!live} onClick={() => start('button')}>
          <CalendarPlus aria-hidden="true" />
          {t('setup.start')}
        </Button>
      )}
      <TripWizard
        at={wizard}
        onMove={setWizard}
        onClose={closedByVisitor}
        onShowPlan={showPlan}
        ticketStep={step}
        defaultMonth={defaultMonth}
      />
      <PlanResult
        ref={resultRef}
        edit={edit}
        step={step}
        ticketsOpen={false}
        onTicketsOpen={noTicketsPanel}
        defaultMonth={defaultMonth}
      />
    </>
  );
}

/**
 * The phone's Back button closes the assistant instead of leaving the page: opening it adds an
 * entry to the history, and Back takes it away again (`onBack`). The plan's own address changes
 * while it is open (`replaceState` on that entry), so the entry under it is given the latest address
 * once it is gone, or Back would also undo every answer given in it.
 */
function useSheetHistory(open: boolean, onBack: () => void) {
  const pushed = useRef(false);
  const latestBack = useRef(onBack);
  useEffect(() => {
    latestBack.current = onBack;
  }, [onBack]);
  useEffect(() => {
    if (open && !pushed.current) {
      pushed.current = true;
      window.history.pushState(null, '', window.location.href);
    } else if (!open && pushed.current) {
      pushed.current = false;
      const latest = window.location.href;
      const restore = () => {
        window.removeEventListener('popstate', restore);
        window.history.replaceState(null, '', latest);
      };
      window.addEventListener('popstate', restore);
      window.history.back();
    }
  }, [open]);
  useEffect(() => {
    const onPop = () => {
      if (!pushed.current) return;
      pushed.current = false;
      const latest = window.location.href;
      latestBack.current();
      // The entry Back landed on holds the address from before the assistant; the latest one wins.
      requestAnimationFrame(() => window.history.replaceState(null, '', latest));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}
