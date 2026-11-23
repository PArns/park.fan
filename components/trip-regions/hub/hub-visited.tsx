'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { trackTripEvent } from '@/lib/trip-regions/plan-analytics';
import { visitedOn, visitedParks } from '@/lib/trip-regions/visited-parks';

/** Where a park was ticked off: the first answer's chips or the calendar beside its name. */
export type VisitedFrom = 'answer' | 'calendar';

/** The parks of a region ticked off as visited on its `today`; none on the server. */
export function useVisitedParks(region: string, today: string): ReadonlySet<string> {
  const store = visitedParks(region);
  const record = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return useMemo(() => visitedOn(record, today), [record, today]);
}

/** Whether one park is ticked off: a boolean snapshot, so a tick re-renders only its own marks. */
export function useParkVisited(region: string, slug: string, today: string): boolean {
  const store = visitedParks(region);
  return useSyncExternalStore(
    store.subscribe,
    () => visitedOn(store.getSnapshot(), today).has(slug),
    () => false
  );
}

/** Ticks a park off or takes the tick away, and counts it. */
export function toggleVisited(region: string, slug: string, today: string, from: VisitedFrom) {
  const visited = visitedParks(region).toggle(slug, today);
  trackTripEvent(region, 'trip_hub_visited', { from, visited });
  return visited;
}

/**
 * The tick itself: an empty ring while the park is still ahead, a filled circle with a check in the
 * site's "open" green once it is done, the colour the ridden rides' check uses. `pop` plays a
 * short spring when the visitor has just ticked it, never when the ticks arrive after hydration.
 */
export function VisitedMark({
  visited,
  pop = false,
  className,
}: {
  visited: boolean;
  pop?: boolean;
  className?: string;
}) {
  return visited ? (
    <span
      aria-hidden
      className={cn(
        'bg-status-operating inline-flex size-[18px] shrink-0 items-center justify-center rounded-full text-white',
        pop && 'motion-safe:animate-[visited-pop_360ms_cubic-bezier(0.2,0.9,0.3,1.35)]',
        className
      )}
    >
      <Check className="size-3" strokeWidth={3.5} />
    </span>
  ) : (
    <span
      aria-hidden
      className={cn(
        'inline-block size-[18px] shrink-0 rounded-full border-2 border-current opacity-45',
        className
      )}
    />
  );
}

/**
 * The tick beside a park's name in the calendar: a button around {@link VisitedMark}, 44 px to
 * the touch, that names the park and says whether it is ticked.
 */
export function VisitedToggle({
  region,
  slug,
  name,
  today,
  className,
}: {
  region: string;
  slug: string;
  name: string;
  today: string;
  className?: string;
}) {
  const t = useTranslations('tripHub.visited');
  const visited = useParkVisited(region, slug, today);
  const [pop, setPop] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={visited}
      aria-label={t('toggle', { park: name })}
      title={visited ? t('untick', { park: name }) : t('tick', { park: name })}
      onClick={() => setPop(toggleVisited(region, slug, today, 'calendar'))}
      className={cn(
        'text-muted-foreground hover:text-foreground focus-visible:ring-ring relative -m-[13px] inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none',
        className
      )}
    >
      <VisitedMark visited={visited} pop={pop} />
    </button>
  );
}

/**
 * A park's days in the calendar, faded once it is ticked off: still readable, for a second visit,
 * but no longer what the eye goes to. Only this wrapper reads the tick; the tiles it holds are its
 * parent's elements and do not render again.
 */
export function VisitedDim({
  region,
  slug,
  today,
  children,
  className,
}: {
  region: string;
  slug: string;
  today: string;
  children: React.ReactNode;
  className?: string;
}) {
  const visited = useParkVisited(region, slug, today);
  return (
    <div
      data-visited={visited || undefined}
      className={cn('transition-opacity duration-300 data-[visited]:opacity-40', className)}
    >
      {children}
    </div>
  );
}

/**
 * {@link VisitedDim} for a row of the desktop grid: its day cells fade once the park is ticked
 * off, the row's name and tick stay as they are.
 */
export function VisitedRow({
  region,
  slug,
  today,
  children,
  ...props
}: {
  region: string;
  slug: string;
  today: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<'tr'>, 'children'>) {
  const visited = useParkVisited(region, slug, today);
  return (
    <tr
      data-visited={visited || undefined}
      className="[&>td]:transition-opacity [&>td]:duration-300 [&[data-visited]>td]:opacity-40"
      {...props}
    >
      {children}
    </tr>
  );
}
