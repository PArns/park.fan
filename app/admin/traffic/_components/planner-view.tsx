'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  FerrisWheel,
  ListChecks,
  ListPlus,
  MapPin,
  Share2,
  Signpost,
  Smartphone,
  WandSparkles,
  Wrench,
} from 'lucide-react';
import {
  DEVICE_LABEL,
  PLANNER_STAGE_LABEL,
  entityEditorHref,
  entityPublicHref,
  formatCount,
  formatDecimal,
  formatShare,
  pageTypeLabel,
  plannerItemMatrix,
  plannerPageTypeMatrix,
  plannerWizardRows,
  propValueLabel,
  trafficQuery,
  unsupportedReason,
  withoutEmptyColumns,
} from '@/lib/admin/site-analytics';
import { INTERVAL_SENTENCE } from '@/lib/admin/traffic-range';
import type { PlannerEntity, PlannerOverview } from '@/lib/api/admin-site-analytics';
import { BarList, CATEGORICAL, HeatMatrix, SeriesChart, type BarRow } from '../../_ui/charts';
import {
  AdminPage,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
  StatTile,
} from '../../_ui/primitives';
import { useTrafficData, useTrafficFilters, type TrafficFilters } from '../_lib/use-traffic';
import { eventHref } from './events-table';
import { TrafficFilterBar } from './filter-bar';
import { HourlyNotice } from './hourly-notice';
import { PublicLink } from './list-parts';
import { UnsupportedNote } from './unsupported-note';

/** The raw events behind the page, each a way into its own detail. */
const PLANNER_EVENT_LINKS = [
  'planner_opened',
  'plan_day_started',
  'plan_optimized',
  'planner_closed_empty',
  'planner_wizard_step',
  'planner_wizard_finished',
  'plan_item_added',
  'plan_item_removed',
  'planner_fit_opened',
  'planner_fit_lever',
  'planner_undo',
  'planner_day_cleared',
  'planner_shared_opened',
  'planner_shared_adopted',
  'planner_push_on',
  'share_clicked',
] as const;

/** The words for a row of the wizard panel: a step, or its last press. */
function wizardRowLabel(key: string): string {
  return key === 'finished' ? 'Fertig' : propValueLabel('step', key);
}

/** A count list as bar rows, its values in German by the property they came from. */
function countRows(prop: string, rows: readonly { value: string; count: number }[]): BarRow[] {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return rows.map((row) => ({
    key: row.value,
    label: propValueLabel(prop, row.value),
    value: row.count,
    share: total > 0 ? row.count / total : undefined,
  }));
}

/** A small list under its own title, or a line saying nothing was counted. */
function CountList({ title, rows, unit }: { title: string; rows: BarRow[]; unit: string }) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Noch nichts gezählt</p>
      ) : (
        <BarList rows={rows} limit={5} unit={unit} />
      )}
    </div>
  );
}

/** The funnel from opening to sharing, each stage against the one it follows. */
function FunnelPanel({ planner }: { planner: PlannerOverview }) {
  const { funnel } = planner;
  const emptyShare = funnel.opened > 0 ? Math.min(1, funnel.closedEmpty / funnel.opened) : 0;
  return (
    <Panel>
      <PanelHeader
        icon={CalendarDays}
        title="Vom Öffnen zum Plan"
        hint="Geöffnet: der Planer geht von zu auf offen. Plan begonnen: ein Park und Tag bekommen den ersten Block, auch über „Zum Plan“ bei zugeklapptem Planer. Die Quote zählt nur die Tage, die in einer Öffnung begannen. Optimieren und Teilen geht beliebig oft, darum stehen sie je begonnenem Plan da und nicht als Anteil."
      />
      <PanelBody className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 [&>*]:min-w-0">
          <StatTile label={PLANNER_STAGE_LABEL.opened} value={formatCount(funnel.opened)} />
          <StatTile
            label={PLANNER_STAGE_LABEL.started}
            value={formatCount(funnel.started)}
            sub={`${formatCount(funnel.startedInOpening)} in einer Öffnung, ${formatShare(funnel.startRate)} der Öffnungen`}
          />
          <StatTile
            label={PLANNER_STAGE_LABEL.optimized}
            value={formatCount(funnel.optimized)}
            sub={`${formatDecimal(funnel.optimizedPerStarted)} je begonnenem Plan`}
          />
          <StatTile
            label={PLANNER_STAGE_LABEL.shared}
            value={formatCount(funnel.shared)}
            sub={`${formatDecimal(funnel.sharedPerStarted)} je begonnenem Plan`}
          />
        </div>
        <p className="text-muted-foreground text-xs tabular-nums">
          Leer geschlossen: {formatCount(funnel.closedEmpty)} Öffnungen ({formatShare(emptyShare)}
          ), ohne dass ein Tag einen ersten Block bekam. Bei zugeklapptem Planer begonnen:{' '}
          {formatCount(funnel.startedPanelShut)} Tage.
        </p>
      </PanelBody>
    </Panel>
  );
}

/** Which way in is used, and which one leads to a plan. */
function SourcesPanel({ planner }: { planner: PlannerOverview }) {
  const max = Math.max(1, ...planner.sources.map((row) => row.opened));
  return (
    <Panel>
      <PanelHeader
        icon={Signpost}
        title="Wege hinein"
        hint="Wie der Planer geöffnet wurde. Plan begonnen zählt die Tage, die in einer so geöffneten Sitzung ihren ersten Block bekamen."
      />
      <PanelBody className="p-0">
        {planner.sources.length === 0 ? (
          <p className="text-muted-foreground px-4 py-6 text-center text-sm">
            Noch keine Öffnung gezählt
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm tabular-nums">
              <thead className="text-muted-foreground text-[11px] tracking-wide uppercase">
                <tr className="border-border/50 border-b">
                  <th className="py-2 pl-4 text-left font-medium">Weg</th>
                  <th className="px-3 py-2 text-left font-medium">Geöffnet</th>
                  <th className="px-3 py-2 text-right font-medium">Plan begonnen</th>
                  <th className="py-2 pr-4 pl-3 text-right font-medium">Quote</th>
                </tr>
              </thead>
              <tbody className="divide-border/40 divide-y">
                {planner.sources.map((row) => (
                  <tr key={row.source}>
                    <th scope="row" className="py-2.5 pl-4 text-left font-medium">
                      {propValueLabel('source', row.source)}
                    </th>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-right font-semibold">
                          {formatCount(row.opened)}
                        </span>
                        <span className="bg-muted-foreground/10 hidden h-1.5 w-24 overflow-hidden rounded-full sm:block">
                          <span
                            className="bg-primary/70 block h-full rounded-full"
                            style={{
                              width: `${Math.max(row.opened > 0 ? 2 : 0, (row.opened / max) * 100)}%`,
                            }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">{formatCount(row.started)}</td>
                    <td className="py-2.5 pr-4 pl-3 text-right font-medium">
                      {row.opened > 0 ? formatShare(row.startRate) : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}

/** Where the planner is opened from, and on which device. */
function PageTypePanel({ planner }: { planner: PlannerOverview }) {
  const matrix = plannerPageTypeMatrix(planner);
  return (
    <Panel>
      <PanelHeader
        icon={Smartphone}
        title="Von welcher Seite, auf welchem Gerät"
        hint="Öffnungen nach der Seitenart, auf der sie geschahen, und dem Gerät aus dem User-Agent."
      />
      <PanelBody>
        {matrix.rows.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Noch keine Öffnung gezählt
          </p>
        ) : (
          <HeatMatrix
            rowHeader="Seitenart"
            max={matrix.max}
            columnTotals={matrix.columnTotals}
            columns={matrix.columns.map((device) => ({
              key: device,
              label: DEVICE_LABEL[device] ?? device,
            }))}
            rows={matrix.rows.map((row) => ({
              key: row.key,
              label: pageTypeLabel(row.key),
              cells: row.cells,
              total: row.total,
            }))}
          />
        )}
      </PanelBody>
    </Panel>
  );
}

/** How far the wizard is followed, step by step. */
function WizardPanel({ planner }: { planner: PlannerOverview }) {
  const rows = plannerWizardRows(planner);
  return (
    <Panel>
      <PanelHeader
        icon={WandSparkles}
        title="Assistent"
        hint="Öffnungen, die einen Schritt erreichten, jeder Schritt einmal je Öffnung. Der Anteil rechnet gegen den meistbesuchten Schritt, weil ein Assistent auf einer Parkseite den Park schon kennt."
      />
      <PanelBody className="space-y-3">
        <BarList
          limit={rows.length}
          unit="Öffnungen"
          rows={rows.map((row) => ({
            key: row.key,
            label: wizardRowLabel(row.key),
            value: row.count,
            share: row.reach,
          }))}
        />
        <p className="text-muted-foreground text-xs tabular-nums">
          {planner.wizardFinished > 0
            ? `Davon mit Headlinern eingeplant: ${formatCount(planner.wizardWithHeadliners)} (${formatShare(planner.wizardWithHeadliners / planner.wizardFinished)})`
            : 'Noch kein Assistent zu Ende gegangen'}
        </p>
      </PanelBody>
    </Panel>
  );
}

/** One action's blocks: the control by the kind of block. */
function ItemMatrix({
  planner,
  action,
  title,
}: {
  planner: PlannerOverview;
  action: 'added' | 'removed';
  title: string;
}) {
  const matrix = withoutEmptyColumns(plannerItemMatrix(planner, action));
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {title}
      </p>
      {matrix.rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Noch nichts gezählt</p>
      ) : (
        <HeatMatrix
          rowHeader="Weg"
          max={matrix.max}
          columnTotals={matrix.columnTotals}
          columns={matrix.columns.map((kind) => ({
            key: kind,
            label: propValueLabel('kind', kind),
          }))}
          rows={matrix.rows.map((row) => ({
            key: row.key,
            label: propValueLabel('source', row.key),
            cells: row.cells,
            total: row.total,
          }))}
        />
      )}
    </div>
  );
}

/** What goes into a plan and out of it, and by which control. */
function ItemsPanel({ planner }: { planner: PlannerOverview }) {
  return (
    <Panel>
      <PanelHeader
        icon={ListPlus}
        title="Fahrgeschäfte, Shows und Blöcke"
        hint="Jeder Block, der in einen Plan kam oder einzeln herausgenommen wurde, nach dem Knopf, der es tat. Ein ganzer Tag gelöscht zählt unter Werkzeuge."
      />
      <PanelBody className="space-y-6">
        <ItemMatrix planner={planner} action="added" title="Eingeplant" />
        <ItemMatrix planner={planner} action="removed" title="Entfernt" />
      </PanelBody>
    </Panel>
  );
}

/** The optimiser, the fit assistant and the ways back. */
function ToolsPanel({ planner }: { planner: PlannerOverview }) {
  return (
    <Panel>
      <PanelHeader
        icon={Wrench}
        title="Werkzeuge"
        hint="Optimiert zählt nur, wenn sich der Plan geändert hat. Ein Hebel zählt beim Einschalten, nicht beim Ausschalten."
      />
      <PanelBody className="grid gap-6 md:grid-cols-2 [&>*]:min-w-0">
        <CountList
          title="Optimiert, nach Weg"
          rows={countRows('mode', planner.optimized)}
          unit="Mal"
        />
        <CountList
          title="Passt-Assistent geöffnet, nach Ort"
          rows={countRows('source', planner.fitOpened)}
          unit="Mal"
        />
        <CountList
          title="Hebel des Passt-Assistenten"
          rows={countRows('lever', planner.fitLevers)}
          unit="Mal"
        />
        <div className="space-y-4">
          <CountList
            title="Rückgängig, nach Ort"
            rows={countRows('source', planner.undo)}
            unit="Mal"
          />
          <p className="text-sm tabular-nums">
            Ganzer Tag gelöscht:{' '}
            <span className="font-semibold">{formatCount(planner.dayCleared)}</span>
          </p>
        </div>
      </PanelBody>
    </Panel>
  );
}

/** Sharing out, links opened and taken over, and push for the plan. */
function SharingPanel({ planner }: { planner: PlannerOverview }) {
  return (
    <Panel>
      <PanelHeader
        icon={Share2}
        title="Teilen und Push"
        hint="Geteilt: der Link des Plans wurde kopiert oder verschickt. Geöffnet: ein geteilter Link wurde aufgerufen und seine Antwort war da."
      />
      <PanelBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 [&>*]:min-w-0">
          <StatTile label={PLANNER_STAGE_LABEL.shared} value={formatCount(planner.funnel.shared)} />
          <StatTile label="Übernommen" value={formatCount(planner.sharedAdopted)} />
          <StatTile label="Push an" value={formatCount(planner.pushOn)} />
        </div>
        <CountList
          title="Geteilte Links geöffnet, nach Ergebnis"
          rows={countRows('outcome', planner.sharedOpened)}
          unit="Links"
        />
      </PanelBody>
    </Panel>
  );
}

/** One ranked entity as a bar row: the editor behind its name, the public page beside it. */
function entityRow(entity: PlannerEntity, kind: 'park' | 'attraction'): BarRow {
  if (entity.name === null || entity.url === null) {
    return {
      key: entity.id,
      label: <span className="text-muted-foreground">Nicht mehr vorhanden</span>,
      detail: <span className="font-mono text-[11px] break-all">{entity.id}</span>,
      value: entity.count,
    };
  }
  const resolved = { id: entity.id, kind, url: entity.url };
  return {
    key: entity.id,
    label: entity.name,
    value: entity.count,
    href: entityEditorHref(resolved),
    actions: (
      <PublicLink href={entityPublicHref(resolved)} label={`${entity.name} auf park.fan öffnen`} />
    ),
  };
}

/** The parks most days are planned for, and the rides most often put into a plan. */
function TopPanels({ planner }: { planner: PlannerOverview }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
      <Panel>
        <PanelHeader
          icon={MapPin}
          title="Meistgeplante Parks"
          hint="Begonnene Tage je Park, wo die Seite den Park kannte. Der Name führt in den Editor."
        />
        <PanelBody>
          {planner.topParks.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">Noch kein Park gezählt</p>
          ) : (
            <BarList
              unit="Tage"
              rows={planner.topParks.map((entity) => entityRow(entity, 'park'))}
            />
          )}
        </PanelBody>
      </Panel>
      <Panel>
        <PanelHeader
          icon={FerrisWheel}
          title="Meisteingeplante Fahrgeschäfte"
          hint="Wie oft ein Fahrgeschäft in einen Plan kam, wo die Seite es kannte. Der Name führt in den Editor."
        />
        <PanelBody>
          {planner.topRides.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Noch kein Fahrgeschäft gezählt
            </p>
          ) : (
            <BarList
              unit="Mal"
              rows={planner.topRides.map((entity) => entityRow(entity, 'attraction'))}
            />
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}

/** Openings, plans begun and optimisations per period. */
function SeriesPanel({ planner }: { planner: PlannerOverview }) {
  const days = planner.series.map((point) => point.day);
  const stages = ['opened', 'started', 'optimized'] as const;
  return (
    <Panel>
      <PanelHeader
        icon={ListChecks}
        title="Verlauf"
        hint={`Je Zeitraum. ${INTERVAL_SENTENCE[planner.interval]} Ein Klick auf die Legende blendet eine Linie aus.`}
      />
      <PanelBody>
        {days.length < 2 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Für einen einzelnen Punkt gibt es keine Kurve.
          </p>
        ) : (
          <SeriesChart
            label="Planer je Zeitraum"
            days={days}
            interval={planner.interval}
            partial={planner.series.map((point) => point.partial === true)}
            toggleable
            series={stages.map((stage, index) => ({
              key: stage,
              label: PLANNER_STAGE_LABEL[stage],
              color: CATEGORICAL[index],
              values: planner.series.map((point) => point[stage]),
            }))}
          />
        )}
      </PanelBody>
    </Panel>
  );
}

/** Links to the raw events, so every number on the page can be taken apart. */
function EventLinks({ filters }: { filters: TrafficFilters }) {
  return (
    <ul className="flex flex-wrap gap-2 px-4 pb-3">
      {PLANNER_EVENT_LINKS.map((name) => (
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

/**
 * `/admin/traffic/planner`: the trip planner from opening to sharing. The funnel and its ways in,
 * where it is opened, how far the wizard is followed, what goes into a plan, the tools, sharing
 * and push, the series, and the parks and rides planned most; every figure leads back to its
 * event.
 */
export function PlannerView() {
  const filters = useTrafficFilters();
  const reason = unsupportedReason('events', filters.filters);
  const { data, error, refetch } = useTrafficData<PlannerOverview>('planner', filters, undefined, {
    enabled: !reason,
  });

  const header = (
    <>
      <PanelHeader
        icon={CalendarDays}
        title="Tagesplaner"
        hint="Wie der Planer geöffnet wird, wie weit er führt und was in die Pläne kommt. Gezählt wird nie, wie ein Plan aussieht."
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
      </div>
      <p className="text-muted-foreground px-4 pt-3 pb-2 text-xs">Rohdaten:</p>
      <EventLinks filters={filters} />
    </>
  );

  if (reason) {
    return (
      <AdminPage width="wide">
        <Panel>
          {header}
          <UnsupportedNote reason={reason} filters={filters} />
        </Panel>
      </AdminPage>
    );
  }

  if (!data) {
    return (
      <AdminPage width="wide">
        <Panel>
          {header}
          {error ? (
            <ErrorState message={`Tagesplaner: ${error.message}`} onRetry={() => void refetch()} />
          ) : (
            <LoadingState label="Lade Tagesplaner…" />
          )}
        </Panel>
      </AdminPage>
    );
  }

  const counted = data.funnel.opened + data.funnel.started;

  return (
    <AdminPage width="wide">
      <Panel>
        {header}
        <HourlyNotice data={data} className="mx-4 mt-0 mb-4" />
      </Panel>
      {counted === 0 ? (
        <Panel>
          <EmptyState
            icon={CalendarDays}
            title="Noch kein Planer gezählt"
            description={
              filters.locale
                ? 'In dieser Sprache wurde im Zeitraum kein Planer geöffnet. Mit „Alle“ siehst du die anderen.'
                : 'Die Planer-Ereignisse füllen sich, sobald die Seite mit dem neuen Zähler ausgeliefert ist. Besuche mit Do Not Track, Global Privacy Control oder Opt-out sind nicht darin.'
            }
          />
        </Panel>
      ) : (
        <>
          <FunnelPanel planner={data} />
          <SourcesPanel planner={data} />
          <PageTypePanel planner={data} />
          <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
            <WizardPanel planner={data} />
            <SharingPanel planner={data} />
          </div>
          <ItemsPanel planner={data} />
          <ToolsPanel planner={data} />
          <TopPanels planner={data} />
          <SeriesPanel planner={data} />
        </>
      )}
    </AdminPage>
  );
}
