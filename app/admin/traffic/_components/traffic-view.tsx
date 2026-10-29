'use client';

import Link from 'next/link';
import {
  BarChart3,
  CalendarDays,
  Flame,
  ListChecks,
  Search,
  TrendingUp,
  Radar,
} from 'lucide-react';
import { hasTraffic, hasVisitFilter, unsupportedReason } from '@/lib/admin/site-analytics';
import type {
  BreakdownDimension,
  EventsResponse,
  TrafficOverview,
} from '@/lib/api/admin-site-analytics';
import {
  AdminPage,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
} from '../../_ui/primitives';
import { useRealtimeOverview, useTrafficData, useTrafficFilters } from '../_lib/use-traffic';
import { BreakdownPanel } from './breakdown-panel';
import { CountriesPanel } from './countries-panel';
import { EventsTable } from './events-table';
import { HourlyNotice } from './hourly-notice';
import { TrafficFilterBar } from './filter-bar';
import { KpiTiles } from './kpi-tiles';
import { SeriesPanel } from './series-panel';
import { TrafficCrosstabPanel } from './traffic-crosstab-panel';
import { UnsupportedNote } from './unsupported-note';
import { LivePill } from '../live/_components/live-pill';

/**
 * Two panels to a row, on a phone one under the other: where visits come from, the pages and what
 * they are for, where a visit begins and where it ends.
 */
const PAIRS: BreakdownDimension[][] = [
  ['channel', 'referrer'],
  ['path', 'page_type'],
  ['entry', 'exit'],
];

/** Panels with longer values, two to a row, under the countries. */
const LATER_PAIR: BreakdownDimension[] = ['browser_language', 'locale'];

/** Panels with short values, three across from `xl`. */
const SMALL: BreakdownDimension[] = ['device', 'browser', 'os'];

/**
 * `/admin/traffic`: who visited, what they read, where they came from and what they pressed, from
 * the site's own cookieless counter, worked like Umami's: pressing a value in any panel filters the
 * whole page by it, and the filters are chips that take themselves off. The window, language and
 * filters are in the URL. Umami keeps the page views and the Web Vitals; everything else is counted
 * here.
 */
export function TrafficView() {
  const filters = useTrafficFilters();
  const overview = useTrafficData<TrafficOverview>('overview', filters);
  const eventsReason = unsupportedReason('events', filters.filters);
  const events = useTrafficData<EventsResponse>('events', filters, undefined, {
    enabled: !eventsReason,
  });
  const realtime = useRealtimeOverview();

  const header = (
    <PanelHeader
      icon={TrendingUp}
      title="Traffic"
      hint="Der eigene Zähler auf api.park.fan: ohne Cookie, ohne gespeicherte Adresse, ohne Bots, Do Not Track, Global Privacy Control und Opt-out ausgenommen."
      action={
        <div className="flex items-center gap-3 text-xs">
          <LivePill active={realtime.data?.realtime.activeVisitors} />
          <Link
            href="/admin/traffic/seo"
            className="text-primary flex items-center gap-1 hover:underline max-sm:hidden"
          >
            <Radar className="h-3.5 w-3.5" /> SEO
          </Link>
          <Link
            href="/admin/traffic/search"
            className="text-primary flex items-center gap-1 hover:underline max-sm:hidden"
          >
            <Search className="h-3.5 w-3.5" /> Suche
          </Link>
          <Link
            href="/admin/traffic/planner"
            className="text-primary flex items-center gap-1 hover:underline max-sm:hidden"
          >
            <CalendarDays className="h-3.5 w-3.5" /> Planer
          </Link>
          <Link
            href="/admin/popularity"
            className="text-primary flex items-center gap-1 hover:underline max-sm:hidden"
          >
            <Flame className="h-3.5 w-3.5" /> Beliebtheit
          </Link>
        </div>
      }
    />
  );

  const filterRow = (
    <div className="border-border/50 flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
      <div className="space-y-2">
        <TrafficFilterBar filters={filters} />
        {hasVisitFilter(filters.filters) && (
          <p className="text-muted-foreground max-w-prose text-xs">
            Unter diesem Filter zählt der Zähler nur Besuche, nach ihrer ersten Seite. Aufrufe,
            Ereignisse und was daraus folgt gibt es nicht, und die Listen zählen Besuche.
          </p>
        )}
      </div>
    </div>
  );

  if (!overview.data) {
    return (
      <AdminPage width="wide">
        <Panel>
          {header}
          {filterRow}
          {overview.error ? (
            <ErrorState
              message={`Traffic: ${overview.error.message}`}
              onRetry={() => void overview.refetch()}
            />
          ) : (
            <LoadingState label="Lade Traffic…" />
          )}
        </Panel>
      </AdminPage>
    );
  }

  const data = overview.data;
  const empty = !hasTraffic(data.totals) && !(data.previous && hasTraffic(data.previous));
  const filtered = filters.filters.length > 0 || filters.locale !== null;

  return (
    <AdminPage width="wide">
      <Panel>
        {header}
        {filterRow}
        <PanelBody>
          <KpiTiles overview={data} realtime={realtime.data?.realtime} today={filters.today} />
        </PanelBody>
      </Panel>

      {empty ? (
        <Panel>
          <EmptyState
            icon={BarChart3}
            title="Noch nichts gezählt"
            description={
              filtered
                ? 'Mit diesen Filtern gibt es in diesem und im Zeitraum davor keine Aufrufe. Nimm einen Filter heraus oder stell „Alle“ ein.'
                : 'Der Zähler füllt sich ab dem Deploy des Beacons. Besuche mit Do Not Track, Global Privacy Control oder Opt-out und Aufrufe von Bots sind nicht darin.'
            }
            action={
              filters.filters.length > 0 ? (
                <button
                  type="button"
                  onClick={filters.clearFilters}
                  className="text-primary text-xs underline underline-offset-2"
                >
                  Filter entfernen
                </button>
              ) : undefined
            }
          />
        </Panel>
      ) : (
        <>
          <SeriesPanel data={data} />

          {PAIRS.map((pair) => (
            <div key={pair.join()} className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
              {pair.map((dim) => (
                <BreakdownPanel key={dim} dim={dim} filters={filters} />
              ))}
            </div>
          ))}

          <CountriesPanel filters={filters} />

          <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
            {LATER_PAIR.map((dim) => (
              <BreakdownPanel key={dim} dim={dim} filters={filters} />
            ))}
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
            {SMALL.map((dim) => (
              <BreakdownPanel key={dim} dim={dim} filters={filters} />
            ))}
          </div>

          <TrafficCrosstabPanel filters={filters} />

          <Panel>
            <PanelHeader
              icon={ListChecks}
              title="Ereignisse"
              hint="Was Besucher gedrückt oder eingeschaltet haben, was die Seite gemeldet hat. Eine Zeile öffnet das Ereignis mit Werten, Kreuztabelle und den Parks, Fahrgeschäften und Shows dahinter."
              action={
                <Link href="/admin/traffic/search" className="text-primary text-xs hover:underline">
                  Suche im Vergleich
                </Link>
              }
            />
            {eventsReason ? (
              <UnsupportedNote reason={eventsReason} filters={filters} />
            ) : events.error && !events.data ? (
              <ErrorState
                message={`Ereignisse: ${events.error.message}`}
                onRetry={() => void events.refetch()}
              />
            ) : !events.data ? (
              <SkeletonRows rows={6} />
            ) : (
              <>
                <EventsTable items={events.data.items} filters={filters} />
                <HourlyNotice data={events.data} className="mx-4 mt-0 mb-4" />
              </>
            )}
          </Panel>
        </>
      )}
    </AdminPage>
  );
}
