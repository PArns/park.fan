'use client';

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMounted } from '@/lib/hooks/use-mounted';
import { hubTripOf, restorableTrip, type HubTripDates } from '@/lib/trip-regions/hub-trip';
import { rememberedTrip } from '@/lib/trip-regions/remembered-trip';

/** The hub's state: the trip it shows, and whether the planner has anything to show at all. */
interface HubState {
  trip: HubTripDates | null;
  /** Dates or a search for them (`when=`): the planner's own view; else the landing page's. */
  planner: boolean;
}

const LANDING: HubState = { trip: null, planner: false };
const HubTripContext = createContext<HubState>(LANDING);

/**
 * The hub's state for everything below it: the trip the planner shows, or null for the landing
 * page. Null on the server and while hydrating, so the served HTML is always the landing page
 * (what a crawler reads); after that, the address bar's dates. On a bare visit it puts back the
 * trip this browser remembers, once, so a returning visitor lands on their plan; the planner reads
 * the restored query as a link from outside. The children are server-rendered and never re-render
 * here: only the readers of {@link useHubTrip} do.
 */
export function HubTripProvider({
  region,
  todayIso,
  children,
}: {
  region: string;
  /** The region's today, from the render: a trip that ended before it is not put back. */
  todayIso: string;
  children: ReactNode;
}) {
  const mounted = useMounted();
  const params = useSearchParams();
  const search = params.toString();
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const query = restorableTrip(search, rememberedTrip(region)?.query, todayIso);
    if (!query) return;
    const { pathname, hash } = window.location;
    window.history.replaceState(null, '', `${pathname}?${query}${hash}`);
  }, [search, region, todayIso]);
  const trip = mounted ? hubTripOf(search) : null;
  const from = trip?.from;
  const to = trip?.to;
  const planner = mounted && (trip !== null || params.has('when'));
  const value = useMemo<HubState>(
    () =>
      from && to ? { trip: { from, to }, planner } : planner ? { trip: null, planner } : LANDING,
    [from, to, planner]
  );
  return <HubTripContext.Provider value={value}>{children}</HubTripContext.Provider>;
}

/** The trip the hub shows (its dates), or null while it is the landing page. */
export function useHubTrip(): HubTripDates | null {
  return useContext(HubTripContext).trip;
}

/**
 * The planner's inline view (its result, a date search), shown only while it has one: on the
 * landing page chapter 01 is the four steps, and the planner is the assistant's dialog, which
 * renders outside this box. Hidden in the served HTML, which is the landing page.
 */
export function HubPlannerOnly({ children }: { children: ReactNode }) {
  return <div hidden={!useContext(HubTripContext).planner}>{children}</div>;
}

/**
 * One of two server-rendered nodes by the hub's state: `landing` without a plan (and in the served
 * HTML), `plan` with one. For a title or a line whose words change with the state.
 */
export function HubStateSwitch({ landing, plan }: { landing: ReactNode; plan: ReactNode }) {
  return <>{useHubTrip() ? plan : landing}</>;
}

/**
 * What only the landing page shows (the four steps, the closing band): hidden while the hub shows
 * a plan, never unmounted, so the server's markup stays the same tree.
 */
export function HubLandingOnly({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div hidden={useHubTrip() !== null} className={className}>
      {children}
    </div>
  );
}
