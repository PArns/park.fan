'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarSearch,
  Hotel,
  Map as MapIcon,
  Plane,
  Signpost,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import {
  formatCount,
  formatShare,
  propValueLabel,
  trafficQuery,
  unsupportedReason,
} from '@/lib/admin/site-analytics';
import type {
  BreakdownResponse,
  TripFunnelStep,
  TripPlannerReport,
  TripReportRow,
} from '@/lib/api/admin-site-analytics';
import { TRIP_REGIONS, tripRegionBySegment, tripRegionTitle } from '@/lib/trip-regions/registry';
import { BarList, type BarRow } from '../../_ui/charts';
import { Segmented } from '../../_ui/controls';
import {
  AdminPage,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
  StatTile,
} from '../../_ui/primitives';
import { useTrafficData, useTrafficFilters, type TrafficFilters } from '../_lib/use-traffic';
import { EventLinks } from './event-links';
import { TrafficFilterBar } from './filter-bar';
import { HourlyNotice } from './hourly-notice';
import { UnsupportedNote } from './unsupported-note';

/** The raw events behind the page, so every number on it can be taken apart. */
const TRIP_EVENT_LINKS = [
  'trip_planner_started',
  'trip_plan_requested',
  'trip_plan_shown',
  'trip_edit_opened',
  'trip_tickets_opened',
  'ticket_link_clicked',
] as const;

/** The pages of a region: its hub, its months and its best time, each a page type of the counter. */
const HUB_PAGE_TYPES = ['trip_hub', 'trip_month', 'trip_best_time'] as const;

type HubPageType = (typeof HUB_PAGE_TYPES)[number];

const HUB_PAGE_LABELS: Record<HubPageType, string> = {
  trip_hub: 'Hub',
  trip_month: 'Monate',
  trip_best_time: 'Beste Reisezeit',
};

const FUNNEL_LABELS: Record<TripFunnelStep['step'], string> = {
  started: 'Begonnen',
  requested: 'Plan angefragt',
  shown: 'Plan gezeigt',
  changed: 'Geändert',
  tickets: 'Tickets geöffnet',
  kept: 'Behalten',
};

const count = (value: number | null | undefined) => (value == null ? '–' : formatCount(value));
const share = (value: number | null | undefined) => (value == null ? '–' : formatShare(value));

/** A list of the report as bar rows: its property values in German, joined, and their counts. */
function reportRows(rows: readonly TripReportRow[]): BarRow[] {
  const counted = rows.filter((row) => typeof row.count === 'number');
  const total = counted.reduce((sum, row) => sum + (row.count ?? 0), 0);
  return counted.map((row) => {
    const props = Object.entries(row).filter(([key]) => key !== 'count');
    return {
      key: props.map(([, value]) => String(value)).join('|'),
      label: props.map(([key, value]) => propValueLabel(key, String(value ?? '–'))).join(' · '),
      value: row.count ?? 0,
      share: total > 0 ? (row.count ?? 0) / total : undefined,
    };
  });
}

/** A small list under its own title, or a line saying nothing was counted. */
function ReportList({ title, rows }: { title: string; rows: readonly TripReportRow[] }) {
  const bars = reportRows(rows);
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium">{title}</p>
      {bars.length === 0 ? (
        <p className="text-muted-foreground text-sm">Noch nichts gezählt</p>
      ) : (
        <BarList rows={bars} limit={6} unit="Ereignisse" />
      )}
    </div>
  );
}

/** A panel of lists, two side by side from `lg`. */
function ListsPanel({
  icon,
  title,
  hint,
  lists,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  lists: ReadonlyArray<{ title: string; rows: readonly TripReportRow[] }>;
  children?: ReactNode;
}) {
  return (
    <Panel>
      <PanelHeader icon={icon} title={title} hint={hint} />
      <PanelBody className="space-y-4">
        {children}
        <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
          {lists.map((list) => (
            <ReportList key={list.title} title={list.title} rows={list.rows} />
          ))}
        </div>
      </PanelBody>
    </Panel>
  );
}

/**
 * The views of each live region's pages: hub, months and best time. The counter knows them by
 * path, so the region is read off the path's segment the way the site routes it
 * (`tripRegionBySegment`).
 */
function HubsPanel({ filters }: { filters: TrafficFilters }) {
  const reads = [
    useHubViews(filters, 'trip_hub'),
    useHubViews(filters, 'trip_month'),
    useHubViews(filters, 'trip_best_time'),
  ];
  const failed = reads.find((read) => read.error)?.error;
  const views = new Map<string, Partial<Record<HubPageType, number>>>();
  HUB_PAGE_TYPES.forEach((pageType, index) => {
    for (const item of reads[index].data?.items ?? []) {
      const [, first = '', second = ''] = item.value.split('/');
      const region = (tripRegionBySegment(second) ?? tripRegionBySegment(first))?.region.slug;
      if (!region) continue;
      const row = views.get(region) ?? {};
      row[pageType] = (row[pageType] ?? 0) + item.views;
      views.set(region, row);
    }
  });

  return (
    <Panel>
      <PanelHeader
        icon={MapIcon}
        title="Regionen-Seiten"
        hint="Aufrufe der Hubs, ihrer Monatsseiten und der besten Reisezeit, je Region aus dem Pfad gelesen."
      />
      <PanelBody>
        {failed ? (
          <ErrorState message={`Seitenaufrufe: ${failed.message}`} />
        ) : reads.some((read) => !read.data) ? (
          <LoadingState label="Lade Seitenaufrufe…" />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 [&>*]:min-w-0">
            {TRIP_REGIONS.filter((region) => region.live).map((region) => {
              const row = views.get(region.slug) ?? {};
              const total = HUB_PAGE_TYPES.reduce((sum, type) => sum + (row[type] ?? 0), 0);
              return (
                <StatTile
                  key={region.slug}
                  label={tripRegionTitle(region.slug)}
                  value={formatCount(total)}
                  sub={HUB_PAGE_TYPES.map(
                    (type) => `${HUB_PAGE_LABELS[type]} ${formatCount(row[type] ?? 0)}`
                  ).join(' · ')}
                />
              );
            })}
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}

/** One page type's views by path, the window's own filters and that page type. */
function useHubViews(filters: TrafficFilters, pageType: HubPageType) {
  return useTrafficData<BreakdownResponse>(
    'breakdown',
    { ...filters, filters: [...filters.filters, { dim: 'page_type', value: pageType }] },
    { dim: 'path', limit: 200 }
  );
}

/** Each step with its count and the rate it is read by. */
function FunnelPanel({ report }: { report: TripPlannerReport }) {
  return (
    <Panel>
      <PanelHeader
        icon={Plane}
        title="Vom Start zum Plan"
        hint="Begonnen, angefragt, gezeigt und behalten folgen aufeinander; Ändern und Tickets braucht ein passender Plan nicht, sie stehen als Anteil der gezeigten Pläne da."
      />
      <PanelBody>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6 [&>*]:min-w-0">
          {report.head.funnel.map((step) => (
            <StatTile
              key={step.step}
              label={FUNNEL_LABELS[step.step] ?? step.step}
              value={count(step.count)}
              sub={
                step.ofShown !== undefined
                  ? `${share(step.ofShown)} der gezeigten`
                  : step.fromPrevious !== undefined
                    ? `${share(step.fromPrevious)} des Schritts davor`
                    : `${share(step.ofStarted)} der begonnenen`
              }
            />
          ))}
        </div>
      </PanelBody>
    </Panel>
  );
}

/** The regions side by side, by what their visitors did. */
function RegionsPanel({ report }: { report: TripPlannerReport }) {
  const columns = ['started', 'requested', 'shown', 'errors', 'kept', 'ticketLinks'] as const;
  const labels = ['Begonnen', 'Angefragt', 'Gezeigt', 'Fehler', 'Behalten', 'Ticket-Links'];
  return (
    <Panel>
      <PanelHeader icon={Signpost} title="Regionen" hint="Die Ereignisse des Planers je Region." />
      <PanelBody className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead className="text-muted-foreground text-xs">
            <tr>
              <th className="py-1.5 text-left font-medium">Region</th>
              {labels.map((label) => (
                <th key={label} className="py-1.5 text-right font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.lists.regions.map((row) => (
              <tr key={row.region} className="border-t border-white/[0.06]">
                <td className="py-1.5">{tripRegionTitle(row.region)}</td>
                {columns.map((column) => (
                  <td key={column} className="py-1.5 text-right">
                    {count(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </PanelBody>
    </Panel>
  );
}

/**
 * `/admin/traffic/trip-planner`: the multi-day trip planner and the region hubs, the counterpart of
 * the Tagesplaner page. Region pages, the funnel, the regions side by side, the requests, the
 * „Wann“ searches, tickets and hotels; every figure leads back to its event.
 */
export function TripPlannerView() {
  const filters = useTrafficFilters();
  const [region, setRegion] = useState<string>('');
  const reason = unsupportedReason('events', filters.filters);
  const { data, error, refetch } = useTrafficData<TripPlannerReport>(
    'trip-planner',
    filters,
    region ? { region } : undefined,
    { enabled: !reason }
  );

  const header = (
    <>
      <PanelHeader
        icon={Plane}
        title="Reiseplaner"
        hint="Wie der mehrtägige Planer der Regionen genutzt wird: von den Hubs über die Anfrage bis zu Tickets und Hotels."
        action={
          <Link
            href={`/admin/traffic?${trafficQuery(filters)}`}
            className="text-primary flex items-center gap-1 text-xs hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Traffic
          </Link>
        }
      />
      <div className="border-border/50 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <TrafficFilterBar filters={filters} hint={false} />
        <Segmented
          label="Region"
          value={region}
          onChange={setRegion}
          options={[
            { value: '', label: 'Alle' },
            ...TRIP_REGIONS.map((entry) => ({
              value: entry.slug,
              label: tripRegionTitle(entry.slug),
            })),
          ]}
        />
      </div>
      <p className="text-muted-foreground px-4 pt-3 pb-2 text-xs">Rohdaten:</p>
      <EventLinks names={TRIP_EVENT_LINKS} filters={filters} />
    </>
  );

  return (
    <AdminPage width="wide">
      <Panel>
        {header}
        {reason ? (
          <UnsupportedNote reason={reason} filters={filters} />
        ) : !data ? (
          error ? (
            <ErrorState message={`Reiseplaner: ${error.message}`} onRetry={() => void refetch()} />
          ) : (
            <LoadingState label="Lade Reiseplaner…" />
          )
        ) : (
          <HourlyNotice data={data.head} className="mx-4 mt-0 mb-4" />
        )}
      </Panel>
      {!reason && <HubsPanel filters={filters} />}
      {data && (
        <>
          <FunnelPanel report={data} />
          <RegionsPanel report={data} />
          <ListsPanel
            icon={Signpost}
            title="Anfragen"
            hint={`${count(data.head.requests.planRequested)} Pläne angefragt, ${count(data.head.requests.datesKnown)} mit festen Daten.`}
            lists={[
              { title: 'Woher', rows: data.lists.started.sources },
              { title: 'Art der Anfrage', rows: data.lists.requests.mode },
              { title: 'Reisedauer', rows: data.lists.requests.days },
              { title: 'Eigene Tickets', rows: data.lists.requests.tickets },
            ]}
          />
          <ListsPanel
            icon={CalendarSearch}
            title="„Wann“-Suchen"
            hint={`${count(data.head.findDates.searched)} Suchen nach Reisedaten, ${count(data.head.findDates.shown)} mit Ergebnis, ${count(data.head.findDates.windowsPlanned)} Zeiträume geplant (${share(data.head.findDates.plannedPerShown)} je Ergebnis).`}
            lists={[
              { title: 'Gesuchte Zeiträume', rows: data.lists.findDates.periods },
              { title: 'Gefundene Zeitfenster', rows: data.lists.findDates.windowsFound },
              { title: 'Geplant nach Rang', rows: data.lists.findDates.windowRanks },
            ]}
          />
          <ListsPanel
            icon={Ticket}
            title="Tickets"
            hint={`${count(data.head.ticketLinks.clicks)} Klicks auf Kauf-Links, ${count(data.head.tickets.adopted)} Ticketvorschläge übernommen, ${count(data.head.tickets.removed)} Tickets entfernt.`}
            lists={[
              { title: 'Geöffnet von', rows: data.lists.tickets.opened },
              { title: 'Hinzugefügt', rows: data.lists.tickets.added },
              { title: 'Kauf-Links nach Händler', rows: data.lists.ticketLinks.bySeller },
              { title: 'Kauf-Links nach Produkt', rows: data.lists.ticketLinks.byProduct },
            ]}
          />
          <ListsPanel
            icon={Hotel}
            title="Hotels"
            hint="Wie oft der Plan einen Hotelwechsel vorschlägt und was mit dem Vorschlag geschieht."
            lists={[
              { title: 'Hotels im Plan', rows: data.lists.answers.stays },
              { title: 'Vorschlag', rows: data.lists.changes.staySuggestion },
            ]}
          />
        </>
      )}
    </AdminPage>
  );
}
