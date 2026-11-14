'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { parkToday } from '@/lib/planner/park-time';
import { DEFAULT_PLAN_STATE, tripHotelKinds, type TripPlanState } from '@/lib/trip-regions/plan';
import { TRIP_PLANNER_ID } from '@/lib/trip-regions/paths';
import { tripPlannerUi } from '@/lib/trip-regions/planner-ui';
import { requireTripRegion, type TripTicketStep } from '@/lib/trip-regions/registry';
import { shortParkName } from '@/lib/trip-regions/hub-data';
import { ticketCatalog } from '@/lib/trip-regions/plan-tickets';
import { trackTripEvent } from '@/lib/trip-regions/plan-analytics';
import { PLAN_WIDE_QUERY } from './plan-setup';
import type { TripRegion } from '@/lib/trip-regions/types';
import {
  PlanContextProvider,
  usePlanContext,
  useTripEvents,
  type PlanContextValue,
  type PlanParkPhoto,
} from './plan-context';
import { PlanSetup, type PlanSheetStep } from './plan-setup';
import { PlanResult } from './plan-result';
import { useTicketStep } from './plan-tickets';
import { usePlanState } from './use-plan-state';
import { ParkyTripInterviewButton } from '@/components/assistant/parky-trip-interview-button';

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

/**
 * The trip planner of a region's hub: which park on which day of a trip, from the API's `/plan`.
 *
 * The visitor's choice is the address bar's query in the API's own names (`use-plan-state.ts`),
 * so a link from Parky or "Copy link" opens the same plan, and a change re-plans without a
 * remount. Nothing is planned until dates are chosen; the result is never a sample.
 *
 * Reading the query makes a prerendered page render this part in the browser, so it sits in a
 * Suspense boundary whose fallback is the same planner with nothing chosen and nothing to press:
 * the same boxes, so the swap after hydration moves nothing. Phone: Tickets, Dates, Parks and an
 * optional Fine-tune as sheets; desktop: the same panels inline. The result goes from the answer (Level 0)
 * to the views (Level 1) to a day's details (Level 2) to the day planner (Level 3);
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
 * The setup and the result, and what moves between them: the phone's sheets and their walk, the
 * desk's two disclosures, the ticket step's drafts, and the hub hero's signal.
 */
function PlannerBody({ defaultMonth }: { defaultMonth?: string }) {
  const { live, state, tickets: catalog, region } = usePlanContext();
  const track = useTripEvents();
  const step = useTicketStep();
  const [sheet, setSheet] = useState<PlanSheetStep | null>(null);
  const [walk, setWalk] = useState(false);
  const [ticketsChoice, setTicketsOpen] = useState<boolean | null>(null);
  const [fineTuneOpen, setFineTuneOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  // The question stands until answered; a desk shows its panel open until then.
  const asks = catalog.size > 0 && step.answer === 'unasked' && state.tickets.length === 0;
  const ticketsOpen = ticketsChoice ?? asks;

  const openSheet = useCallback((next: PlanSheetStep | null, inWalk = false) => {
    setWalk(inWalk);
    setSheet(next);
  }, []);

  /** The walk's first step: Tickets while the question is open, else Dates. */
  const start = useCallback(
    (source: 'hero' | 'button') => {
      track('trip_planner_started', { source });
      if (!window.matchMedia(PLAN_WIDE_QUERY).matches) {
        openSheet(asks ? 'tickets' : 'dates', asks);
        return;
      }
      if (asks) {
        setTicketsOpen(true);
        const panel = document.querySelector<HTMLElement>('[data-plan-disclosure="tickets"]');
        scrollTo(panel);
        panel
          ?.querySelector<HTMLElement>('[data-ticket-answer="no"]')
          ?.focus({ preventScroll: true });
        return;
      }
      const panel = document.querySelector<HTMLElement>('[data-plan-dates-panel]');
      scrollTo(panel);
      panel
        ?.querySelector<HTMLElement>(
          '[role=radio][aria-checked=true], [data-plan-date][tabindex="0"]'
        )
        ?.focus({ preventScroll: true });
    },
    [asks, openSheet, track]
  );

  // The hub's hero asks through `tripPlannerUi`.
  useEffect(() => {
    if (!live) return;
    const answer = () => {
      if (tripPlannerUi.take()) start('hero');
    };
    answer();
    return tripPlannerUi.subscribe(answer);
  }, [live, start]);

  // "Plan" on the last sheet: the answer, at the top of the screen, which on a phone is the first
  // thing to read after the sheets.
  const showResult = useCallback(() => {
    setSheet(null);
    requestAnimationFrame(() => {
      const target = resultRef.current;
      if (!target) return;
      scrollTo(target);
      target.focus({ preventScroll: true });
    });
  }, []);

  /** The result's ways back into the setup: a ticket, the parks, Fine-tune. */
  const edit = useMemo(
    () => ({
      tickets: (index?: number) => {
        if (index !== undefined) step.focusTicket(index);
        if (!window.matchMedia(PLAN_WIDE_QUERY).matches) {
          openSheet('tickets');
          return;
        }
        setTicketsOpen(true);
        scrollTo(document.querySelector<HTMLElement>('[data-plan-disclosure="tickets"]'));
      },
      parks: () => {
        if (!window.matchMedia(PLAN_WIDE_QUERY).matches) {
          openSheet('parks');
          return;
        }
        const panel = document.querySelector<HTMLElement>('[data-plan-parks-panel]');
        scrollTo(panel);
        panel?.focus({ preventScroll: true });
      },
      options: () => {
        if (!window.matchMedia(PLAN_WIDE_QUERY).matches) {
          openSheet('options');
          return;
        }
        setFineTuneOpen(true);
        scrollTo(document.querySelector<HTMLElement>('[data-plan-disclosure="options"]'));
      },
      dates: () => {
        if (!window.matchMedia(PLAN_WIDE_QUERY).matches) {
          openSheet('dates');
          return;
        }
        const panel = document.querySelector<HTMLElement>('[data-plan-dates-panel]');
        scrollTo(panel);
        panel?.focus({ preventScroll: true });
      },
    }),
    [step, openSheet]
  );

  return (
    <>
      {live && <ParkyTripInterviewButton region={region.slug} />}
      <PlanSetup
        defaultMonth={defaultMonth}
        sheet={sheet}
        onSheet={(next) => openSheet(next, next !== null && walk)}
        walk={walk}
        onDone={showResult}
        step={step}
        ticketsOpen={ticketsOpen}
        onTicketsOpen={setTicketsOpen}
        fineTuneOpen={fineTuneOpen}
        onFineTuneOpen={setFineTuneOpen}
        onStart={() => start('button')}
      />
      <PlanResult ref={resultRef} edit={edit} />
    </>
  );
}
