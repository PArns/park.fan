'use client';

import { Link } from '@/i18n/navigation';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';

/**
 * A ride that closed for good, as the park page's search can find it.
 *
 * Built on the server from `closedAttractions`: `since` arrives as finished text („seit Juli
 * 2026"), so this tree needs no date formatting and no message namespace of its own.
 */
export interface ClosedRideSearchItem {
  id: string;
  name: string;
  slug: string;
  land?: string | null;
  since: string;
}

/**
 * The closed rides a search on the park page matched, under the live results.
 *
 * The live grid is the park today, so a closed ride does not join it; it is named here with its
 * badge and the month it closed, and links to its own page.
 * See docs/rules/a-closed-ride-keeps-its-page.md.
 */
export function ClosedRideMatches({
  rides,
  parkPath,
  className,
}: {
  rides: readonly ClosedRideSearchItem[];
  parkPath: string;
  className?: string;
}) {
  if (rides.length === 0) return null;
  return (
    <ul
      className={`border-border/50 bg-background/60 divide-border/50 divide-y rounded-xl border px-4 shadow-md backdrop-blur-md dark:bg-[oklch(0.12_0.025_241_/_0.55)] ${className ?? ''}`}
    >
      {rides.map((ride) => (
        <li key={ride.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
          <Link
            href={`${parkPath}/${ride.slug}` as '/parks/europe/germany/rust/europa-park'}
            prefetch={false}
            className="text-primary hover:text-primary/80 font-medium underline decoration-dotted underline-offset-4"
          >
            {ride.name}
          </Link>
          <ParkStatusBadge status="RETIRED" />
          <span className="text-muted-foreground ml-auto text-sm">
            {[ride.land, ride.since].filter(Boolean).join(' · ')}
          </span>
        </li>
      ))}
    </ul>
  );
}
