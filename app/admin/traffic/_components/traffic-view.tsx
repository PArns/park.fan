'use client';

import Link from 'next/link';
import { BarChart3, Flame, ListChecks, Search, TrendingUp } from 'lucide-react';
import { hasTraffic, TRAFFIC_RANGES } from '@/lib/admin/site-analytics';
import type {
  BreakdownDimension,
  EventsResponse,
  TrafficOverview,
} from '@/lib/api/admin-site-analytics';
import { CATEGORICAL, SeriesChart } from '../../_ui/charts';
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
import { EventsTable } from './events-table';
import { TrafficFilterBar } from './filter-bar';
import { KpiTiles } from './kpi-tiles';

/** The six breakdowns with long values, two to a row: what they read and where they came from. */
const WIDE_BREAKDOWNS: BreakdownDimension[] = [
  'path',
  'entry',
  'referrer',
  'page_type',
  'country',
  'locale',
];

/** The three with short values, side by side: what they read it on. */
const DEVICE_BREAKDOWNS: BreakdownDimension[] = ['viewport', 'browser', 'os'];

/**
 * `/admin/traffic`: who visited, what they read, where they came from and what they pressed, from
 * the site's own cookieless counter. The window and language are in the URL. Umami keeps the
 * page views and the Web Vitals; everything custom is counted here.
 */
export function TrafficView() {
  const filters = useTrafficFilters();
  const overview = useTrafficData<TrafficOverview>('overview', filters);
  const events = useTrafficData<EventsResponse>('events', filters);

  const realtime = useRealtimeOverview();

  const windowLabel = TRAFFIC_RANGES.find((range) => range.days === filters.days)?.label;
  const header = (
    <PanelHeader
      icon={TrendingUp}
      title="Traffic"
      hint="Der eigene Zähler auf api.park.fan: ohne Cookie, ohne gespeicherte Adresse, ohne Bots, Do Not Track und Opt-out ausgenommen. Umami zählt nur noch Seitenaufrufe und Web Vitals."
      action={
        <div className="hidden gap-3 text-xs sm:flex">
          <Link
            href="/admin/traffic/search"
            className="text-primary flex items-center gap-1 hover:underline"
          >
            <Search className="h-3.5 w-3.5" /> Suche
          </Link>
          <Link
            href="/admin/popularity"
            className="text-primary flex items-center gap-1 hover:underline"
          >
            <Flame className="h-3.5 w-3.5" /> Beliebtheit
          </Link>
        </div>
      }
    />
  );

  const filterRow = (
    <div className="border-border/50 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <TrafficFilterBar filters={filters} />
      <p className="text-muted-foreground text-xs">
        {overview.data ? `${overview.data.from} bis ${overview.data.to} (UTC)` : windowLabel}
      </p>
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
  const empty = !hasTraffic(data.totals) && !hasTraffic(data.previous);

  return (
    <AdminPage width="wide">
      <Panel>
        {header}
        {filterRow}
        <PanelBody>
          <KpiTiles overview={data} realtime={realtime.data?.realtime} days={filters.days} />
        </PanelBody>
      </Panel>

      {empty ? (
        <Panel>
          <EmptyState
            icon={BarChart3}
            title="Noch nichts gezählt"
            description={
              filters.locale
                ? 'In dieser Sprache gibt es in diesem und im Zeitraum davor keine Aufrufe. Mit „Alle“ siehst du die anderen.'
                : 'Der Zähler füllt sich ab dem Deploy des Beacons. Besuche mit Do Not Track, Global Privacy Control oder Opt-out und Aufrufe von Bots sind nicht darin.'
            }
          />
        </Panel>
      ) : (
        <>
          <Panel>
            <PanelHeader
              icon={BarChart3}
              title="Verlauf"
              hint="Ein Punkt je Tag, UTC. Besucher sind die Summe der Tageswerte."
            />
            <PanelBody>
              {data.series.length < 2 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  Für einen einzelnen Tag gibt es keine Kurve. Die letzten 30 Minuten stehen oben
                  unter „Jetzt aktiv“, längere Zeiträume im Schalter darüber.
                </p>
              ) : (
                <SeriesChart
                  label={`Aufrufe, Besuche und Besucher pro Tag, ${data.from} bis ${data.to}`}
                  days={data.series.map((point) => point.day)}
                  toggleable
                  series={[
                    {
                      key: 'pageviews',
                      label: 'Aufrufe',
                      color: CATEGORICAL[0],
                      values: data.series.map((point) => point.pageviews),
                    },
                    {
                      key: 'visits',
                      label: 'Besuche',
                      color: CATEGORICAL[1],
                      values: data.series.map((point) => point.visits),
                    },
                    {
                      key: 'visitors',
                      label: 'Besucher',
                      color: CATEGORICAL[2],
                      values: data.series.map((point) => point.visitors),
                    },
                  ]}
                />
              )}
            </PanelBody>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
            {WIDE_BREAKDOWNS.map((dim) => (
              <BreakdownPanel key={dim} dim={dim} filters={filters} onLocale={filters.setLocale} />
            ))}
          </div>
          <div className="grid gap-5 md:grid-cols-3 [&>*]:min-w-0">
            {DEVICE_BREAKDOWNS.map((dim) => (
              <BreakdownPanel key={dim} dim={dim} filters={filters} onLocale={filters.setLocale} />
            ))}
          </div>

          <Panel>
            <PanelHeader
              icon={ListChecks}
              title="Ereignisse"
              hint="Was Besucher gedrückt oder eingeschaltet haben. Eine Zeile öffnet das Ereignis mit Werten, Seitenarten, Geräten und den Parks, Fahrgeschäften und Shows dahinter."
              action={
                <Link href="/admin/traffic/search" className="text-primary text-xs hover:underline">
                  Suche im Vergleich
                </Link>
              }
            />
            {events.error && !events.data ? (
              <ErrorState
                message={`Ereignisse: ${events.error.message}`}
                onRetry={() => void events.refetch()}
              />
            ) : !events.data ? (
              <SkeletonRows rows={6} />
            ) : (
              <EventsTable items={events.data.items} filters={filters} />
            )}
          </Panel>
        </>
      )}
    </AdminPage>
  );
}
