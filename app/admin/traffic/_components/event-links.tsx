'use client';

import Link from 'next/link';
import type { TrafficFilters } from '../_lib/use-traffic';
import { eventHref } from './events-table';

/** The raw events behind a dashboard, each a way into its own detail under the same filters. */
export function EventLinks({
  names,
  filters,
}: {
  names: readonly string[];
  filters: TrafficFilters;
}) {
  return (
    <ul className="flex flex-wrap gap-2 px-4 pb-3">
      {names.map((name) => (
        <li key={name}>
          <Link
            href={eventHref(name, filters)}
            className="border-border/60 hover:border-primary/50 hover:text-primary text-muted-foreground rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors max-sm:py-2"
          >
            {name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
