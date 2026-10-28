'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  deltaOf,
  EVENT_INFO,
  eventLabel,
  formatCount,
  trafficQuery,
} from '@/lib/admin/site-analytics';
import type { EventsResponse } from '@/lib/api/admin-site-analytics';
import { DeltaChip, Sparkline } from '../../_ui/charts';
import type { TrafficFilters } from '../_lib/use-traffic';

/** The address of an event's detail page, carrying the window and language of this one. */
export function eventHref(name: string, filters: TrafficFilters): string {
  return `/admin/traffic/events/${name}?${trafficQuery(filters)}`;
}

/** Columns from `sm` up: the event, its count, the change, the line, the chevron. */
const ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 sm:grid-cols-[minmax(0,1fr)_5rem_6.5rem_6.5rem_1rem]';

/**
 * Every event that fired in the window, biggest first, with its change against the window before
 * and a line of its days. A row is a link to the event's detail page; on a phone the count and the
 * change sit on the right and the line is left out. Events that did not fire sit behind one
 * button, because the API lists all of the schema and thirty rows of zeros bury the ten that did
 * something.
 */
export function EventsTable({
  items,
  filters,
}: {
  items: EventsResponse['items'];
  filters: TrafficFilters;
}) {
  const [showQuiet, setShowQuiet] = useState(false);
  const active = items.filter((item) => item.count > 0 || item.previous > 0);
  const quiet = items.filter((item) => item.count === 0 && item.previous === 0);
  const rows = showQuiet ? [...active, ...quiet] : active;

  return (
    <div>
      <div
        aria-hidden="true"
        className={`${ROW_GRID} border-border/50 text-muted-foreground hidden border-b px-4 py-2 text-[11px] tracking-wide uppercase sm:grid`}
      >
        <span>Ereignis</span>
        <span className="text-right">Anzahl</span>
        <span className="text-right">Veränderung</span>
        <span>Verlauf</span>
        <span />
      </div>
      <ul className="divide-border/40 divide-y">
        {rows.map((item) => (
          <li key={item.name}>
            <Link
              href={eventHref(item.name, filters)}
              className={`${ROW_GRID} hover:bg-muted/20 group items-center px-4 py-2.5 text-sm tabular-nums transition-colors max-sm:min-h-14`}
            >
              <span className="min-w-0">
                <span className="group-hover:text-primary block font-medium transition-colors">
                  {eventLabel(item.name)}
                </span>
                <span className="text-muted-foreground block font-mono text-[11px] break-all">
                  {item.name}
                </span>
                <span className="text-muted-foreground block max-w-md text-xs">
                  {EVENT_INFO[item.name]?.when}
                </span>
              </span>
              <span className="flex flex-col items-end gap-1 sm:contents">
                <span className="text-right font-semibold">{formatCount(item.count)}</span>
                <span className="text-right">
                  <DeltaChip
                    neutral
                    delta={deltaOf(item.count, item.previous)}
                    title={`Davor: ${formatCount(item.previous)}`}
                  />
                </span>
              </span>
              <span className="hidden sm:block">
                <Sparkline values={item.series.map((point) => point.count)} />
              </span>
              <ChevronRight
                aria-hidden="true"
                className="text-muted-foreground group-hover:text-primary hidden h-4 w-4 sm:block"
              />
            </Link>
          </li>
        ))}
      </ul>
      {quiet.length > 0 && (
        <button
          type="button"
          onClick={() => setShowQuiet((open) => !open)}
          className="text-primary border-border/50 w-full border-t px-4 py-2.5 text-left text-xs hover:underline max-sm:min-h-11"
        >
          {showQuiet
            ? 'Ereignisse ohne Zählung ausblenden'
            : `${quiet.length} Ereignisse ohne Zählung in diesem und im Zeitraum davor`}
        </button>
      )}
    </div>
  );
}
