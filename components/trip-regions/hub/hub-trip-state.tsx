'use client';

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useMounted } from '@/lib/hooks/use-mounted';
import { hubTripOf, restorableTrip, type HubTripDates } from '@/lib/trip-regions/hub-trip';
import { rememberedTrip } from '@/lib/trip-regions/remembered-trip';
import { cn } from '@/lib/utils';

const HubTripContext = createContext<HubTripDates | null>(null);

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
  const search = useSearchParams().toString();
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
  const value = useMemo(() => (from && to ? { from, to } : null), [from, to]);
  return <HubTripContext.Provider value={value}>{children}</HubTripContext.Provider>;
}

/** The trip the hub shows (its dates), or null while it is the landing page. */
export function useHubTrip(): HubTripDates | null {
  return useContext(HubTripContext);
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
export function HubLandingOnly({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div hidden={useHubTrip() !== null} className={className}>
      {children}
    </div>
  );
}

/**
 * A chapter's body that folds into one line while the hub shows a plan (the calendar, the resorts):
 * open on the landing page, which is the served HTML, so every link and day stays in it. The line
 * is a button that opens the body in place; the body stays mounted either way.
 */
export function HubPlanFold({ summary, children }: { summary: string; children: ReactNode }) {
  const trip = useHubTrip();
  const [open, setOpen] = useState(false);
  const id = useId();
  const folded = trip !== null && !open;
  return (
    <div>
      {trip && (
        <button
          type="button"
          aria-expanded={!folded}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="border-border/60 bg-card hover:bg-muted/40 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-4 py-2 text-left text-sm"
        >
          <span>{summary}</span>
          <ChevronDown
            aria-hidden
            className={cn('size-4 shrink-0 transition-transform', !folded && 'rotate-180')}
          />
        </button>
      )}
      <div id={id} hidden={folded} className={cn(trip && !folded && 'mt-4')}>
        {children}
      </div>
    </div>
  );
}
