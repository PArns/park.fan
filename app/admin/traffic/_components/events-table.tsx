'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  deltaOf,
  eventInfo,
  eventLabel,
  formatCount,
  trafficQuery,
} from '@/lib/admin/site-analytics';
import type { EventsResponse } from '@/lib/api/admin-site-analytics';
import { DeltaChip, Sparkline } from '../../_ui/charts';
import { Chip } from '../../_ui/primitives';
import type { TrafficFilters } from '../_lib/use-traffic';
import { BlockEventButton } from './block-event-button';

/** The address of an event's detail page, carrying the window, language and filters of this one. */
export function eventHref(name: string, filters: TrafficFilters): string {
  return `/admin/traffic/events/${name}?${trafficQuery(filters)}`;
}

/** Columns from `sm` up: the event, its count, the change, the line, the chevron. */
const ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 sm:grid-cols-[minmax(0,1fr)_5rem_6.5rem_6.5rem_1rem]';

/**
 * Every event name seen in the window, biggest first, with its change against the window before
 * and a line of its days. A row is a link to the event's detail page; a button beside it blocks the
 * name (releases it, for a blocked one), for editors and above. Blocked names stay in the list,
 * flagged. For today the change column names yesterday's full-day count rather than a percentage,
 * since today is not over. Names with nothing in this window and the one before sit behind one
 * button, so a list that grows with the site does not bury the events that did something.
 */
export function EventsTable({
  items,
  filters,
}: {
  items: EventsResponse['items'];
  filters: TrafficFilters;
}) {
  const [showQuiet, setShowQuiet] = useState(false);
  const before = (item: EventsResponse['items'][number]) => item.previous ?? 0;
  const active = items.filter((item) => item.count > 0 || before(item) > 0 || item.blocked);
  const quiet = items.filter((item) => item.count === 0 && before(item) === 0 && !item.blocked);
  const runningDay = filters.window.days === 1 && filters.window.to === filters.today;
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
      {rows.length === 0 && (
        <p className="text-muted-foreground px-4 py-8 text-center text-sm">
          In diesem Zeitraum wurde noch kein Ereignis gezählt.
        </p>
      )}
      <ul className="divide-border/40 divide-y">
        {rows.map((item) => (
          <li key={item.name} className="flex items-stretch">
            <Link
              href={eventHref(item.name, filters)}
              className={`${ROW_GRID} hover:bg-muted/20 group min-w-0 flex-1 items-center px-4 py-2.5 text-sm tabular-nums transition-colors max-sm:min-h-14`}
            >
              <span className="min-w-0">
                <span className="group-hover:text-primary flex flex-wrap items-center gap-2 font-medium transition-colors">
                  {eventLabel(item.name)}
                  {item.blocked && <Chip tone="warning">gesperrt</Chip>}
                </span>
                <span className="text-muted-foreground block font-mono text-[11px] break-all">
                  {item.name}
                </span>
                {eventInfo(item.name) && (
                  <span className="text-muted-foreground block max-w-md text-xs">
                    {eventInfo(item.name)?.when}
                  </span>
                )}
              </span>
              <span className="flex flex-col items-end gap-1 sm:contents">
                <span className="text-right font-semibold">{formatCount(item.count)}</span>
                <span className="text-right">
                  {item.previous === null ? (
                    <span
                      className="text-muted-foreground text-xs"
                      title="Über 180 Tage gibt es keinen Vergleichszeitraum."
                    >
                      –
                    </span>
                  ) : runningDay ? (
                    <span className="text-muted-foreground text-xs">
                      gestern {formatCount(item.previous)}
                    </span>
                  ) : (
                    <DeltaChip
                      neutral
                      delta={deltaOf(item.count, item.previous)}
                      title={`Davor: ${formatCount(item.previous)}`}
                    />
                  )}
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
            <div className="flex shrink-0 items-center pr-3">
              <BlockEventButton name={item.name} blocked={item.blocked} />
            </div>
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
            : quiet.length === 1
              ? '1 Ereignis ohne Zählung in diesem und im Zeitraum davor'
              : `${quiet.length} Ereignisse ohne Zählung in diesem und im Zeitraum davor`}
        </button>
      )}
    </div>
  );
}
