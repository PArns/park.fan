'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ListChecks, MousePointerClick, Search, Smartphone } from 'lucide-react';
import {
  browseItemLabel,
  pageTypeLabel,
  resultKindLabel,
  SEARCH_SURFACES,
  surfaceLabel,
  DEVICE_LABEL,
  DEVICES,
  browseItemMatrix,
  formatCount,
  formatDecimal,
  formatShare,
  heroOrHeader,
  positionRows,
  resultTypeMatrix,
  seriesDays,
  seriesPartial,
  surfacePageTypeMatrix,
  surfaceRows,
  surfaceSeries,
  surfaceDeviceMatrix,
  trafficQuery,
  unsupportedReason,
  withoutEmptyColumns,
} from '@/lib/admin/site-analytics';
import { INTERVAL_SENTENCE } from '@/lib/admin/traffic-range';
import { UnsupportedNote } from './unsupported-note';
import type { SearchOverview } from '@/lib/api/admin-site-analytics';
import {
  BarList,
  CATEGORICAL,
  HeatMatrix,
  SeriesChart,
  ShareBar,
  type SharePart,
} from '../../_ui/charts';
import { Segmented } from '../../_ui/controls';
import {
  AdminPage,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
  Tile,
} from '../../_ui/primitives';
import { useTrafficData, useTrafficFilters, type TrafficFilters } from '../_lib/use-traffic';
import { TrafficFilterBar } from './filter-bar';
import { eventHref } from './events-table';

/** Each search field keeps one colour in every chart of the page, in the palette's fixed order. */
const KNOWN_SURFACE_COLOR = Object.fromEntries(
  SEARCH_SURFACES.map((surface, index) => [surface, CATEGORICAL[index]])
);

/** Greys for a search field the site starts sending later, which has no colour of its own yet. */
const OTHER_SURFACE_COLORS = ['#94a3b8', '#64748b', '#cbd5e1', '#475569'] as const;

/** The colour of a search field: its own while the build knows it, else a grey fixed by its name. */
function surfaceColor(surface: string): string {
  if (KNOWN_SURFACE_COLOR[surface]) return KNOWN_SURFACE_COLOR[surface];
  const hash = [...surface].reduce((total, char) => total + char.charCodeAt(0), 0);
  return OTHER_SURFACE_COLORS[hash % OTHER_SURFACE_COLORS.length];
}

/** Not the first two colours, which belong to the hero and the header, whose cards the bars sit in. */
const DEVICE_COLOR = { mobile: CATEGORICAL[2], tablet: CATEGORICAL[3], desktop: CATEGORICAL[6] };

/** The raw events behind the page, each a way into its own detail. */
const SEARCH_EVENT_LINKS = [
  'search_opened',
  'search_typed',
  'search_result_clicked',
  'search_browse_clicked',
  'search_no_results',
  'search_view_all',
] as const;

/** A field's name with its colour, for a column or a row head. */
function SurfaceName({ surface }: { surface: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: surfaceColor(surface) }}
      />
      {surfaceLabel(surface)}
    </span>
  );
}

/** The answer to the question the page exists for: hero or header, and on which devices. */
function HeroHeaderPanel({ search }: { search: SearchOverview }) {
  const verdict = heroOrHeader(search);
  const deviceParts = (surface: string): SharePart[] =>
    DEVICES.map((device) => ({
      key: device,
      label: DEVICE_LABEL[device] ?? device,
      value:
        search.bySurfaceAndDevice.find((cell) => cell.surface === surface && cell.device === device)
          ?.opened ?? 0,
      color: DEVICE_COLOR[device],
    }));
  const sentence =
    verdict.leader === null
      ? verdict.hero === 0
        ? 'Weder Hero noch Header wurden geöffnet.'
        : 'Hero und Header wurden gleich oft geöffnet.'
      : verdict.ratio === null
        ? `Nur ${verdict.leader === 'hero' ? 'der Hero' : 'der Header'} wurde geöffnet.`
        : `${verdict.leader === 'hero' ? 'Der Hero' : 'Der Header'} wird ${formatDecimal(verdict.ratio)}-mal so oft geöffnet wie ${verdict.leader === 'hero' ? 'der Header' : 'der Hero'}.`;

  return (
    <Panel>
      <PanelHeader
        icon={Search}
        title="Hero oder Header?"
        hint="Geöffnet heißt: das Feld wurde angeklickt oder fokussiert, noch nichts getippt. Der Hero ist das Suchfeld der Startseite, auf dem Telefon wie am Computer."
      />
      <PanelBody className="space-y-4">
        <p className="text-sm font-medium">{sentence}</p>
        <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
          {(['header', 'hero'] as const).map((surface) => {
            const row = search.surfaces.find((entry) => entry.surface === surface);
            return (
              <Tile key={surface} className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold">
                    <SurfaceName surface={surface} />
                  </p>
                  <span className="text-3xl font-bold tabular-nums">
                    {formatCount(row?.opened ?? 0)}
                  </span>
                </div>
                <ShareBar parts={deviceParts(surface)} />
                <p className="text-muted-foreground text-xs tabular-nums">
                  {row && row.opened > 0
                    ? `Klickrate ${formatShare(row.clickRate)}, ohne Treffer ${formatShare(row.noResultRate)}`
                    : 'Noch nicht geöffnet'}
                </p>
              </Tile>
            );
          })}
        </div>
      </PanelBody>
    </Panel>
  );
}

/** All seven fields side by side: how often they are opened, typed into and followed. */
function SurfaceTable({ search }: { search: SearchOverview }) {
  const rows = surfaceRows(search);
  const max = Math.max(1, ...rows.map((row) => row.opened));
  return (
    <Panel>
      <PanelHeader
        icon={MousePointerClick}
        title="Die Suchfelder im Vergleich"
        hint="Klickrate: Treffer und Vorschläge, die geöffnet wurden, geteilt durch die Öffnungen. Ohne Treffer: Eingaben ab drei Zeichen, die nichts fanden, geteilt durch alle Eingaben."
      />
      <PanelBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm tabular-nums">
            <thead className="text-muted-foreground text-[11px] tracking-wide uppercase">
              <tr className="border-border/50 border-b">
                <th className="py-2 pl-4 text-left font-medium">Feld</th>
                <th className="px-3 py-2 text-left font-medium">Geöffnet</th>
                <th className="px-3 py-2 text-right font-medium">Eingegeben</th>
                <th className="px-3 py-2 text-right font-medium">Treffer</th>
                <th className="px-3 py-2 text-right font-medium">Vorschläge</th>
                <th className="px-3 py-2 text-right font-medium">Klickrate</th>
                <th className="px-3 py-2 text-right font-medium">Ohne Treffer</th>
                <th className="py-2 pr-4 pl-3 text-right font-medium">Alle Ergebnisse</th>
              </tr>
            </thead>
            <tbody className="divide-border/40 divide-y">
              {rows.map((row) => (
                <tr key={row.surface}>
                  <th scope="row" className="py-2.5 pl-4 text-left font-medium">
                    <SurfaceName surface={row.surface} />
                  </th>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-right font-semibold">
                        {formatCount(row.opened)}
                      </span>
                      <span className="bg-muted-foreground/10 hidden h-1.5 w-24 overflow-hidden rounded-full sm:block">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${Math.max(row.opened > 0 ? 2 : 0, (row.opened / max) * 100)}%`,
                            background: surfaceColor(row.surface),
                          }}
                        />
                      </span>
                      <span className="text-muted-foreground w-10 text-right text-xs">
                        {formatShare(row.openedShare)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">{formatCount(row.typed)}</td>
                  <td className="px-3 py-2.5 text-right">{formatCount(row.resultClicks)}</td>
                  <td className="px-3 py-2.5 text-right">{formatCount(row.browseClicks)}</td>
                  <td className="px-3 py-2.5 text-right font-medium">
                    {row.opened > 0 ? formatShare(row.clickRate) : '–'}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {row.typed > 0 ? formatShare(row.noResultRate) : '–'}
                  </td>
                  <td className="py-2.5 pr-4 pl-3 text-right">{formatCount(row.viewAll)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelBody>
    </Panel>
  );
}

/** Which page the search was opened from, field by field. */
function PageMatrixPanel({ search }: { search: SearchOverview }) {
  const [mode, setMode] = useState<'count' | 'share'>('count');
  const matrix = surfacePageTypeMatrix(search);
  return (
    <Panel>
      <PanelHeader
        icon={Search}
        title="Von welcher Seite"
        hint="Wo ein Suchfeld geöffnet wurde. „Anteil“ rechnet je Seitenart: welches Feld dort gebraucht wird, unabhängig davon, wie viele Aufrufe die Seitenart hat."
        action={
          <Segmented
            label="Darstellung"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'count', label: 'Anzahl' },
              { value: 'share', label: 'Anteil' },
            ]}
          />
        }
      />
      <PanelBody>
        <HeatMatrix
          mode={mode}
          rowHeader="Seitenart"
          max={matrix.max}
          columnTotals={matrix.columnTotals}
          columns={matrix.columns.map((surface) => ({
            key: surface,
            label: <SurfaceName surface={surface} />,
          }))}
          rows={matrix.rows.map((row) => ({
            key: row.key,
            label: pageTypeLabel(row.key),
            cells: row.cells,
            total: row.total,
          }))}
        />
      </PanelBody>
    </Panel>
  );
}

/** Which device the search was opened on, field by field. */
function DevicePanel({ search }: { search: SearchOverview }) {
  const matrix = surfaceDeviceMatrix(search);
  return (
    <Panel>
      <PanelHeader
        icon={Smartphone}
        title="Auf welchem Gerät"
        hint="Gerät beim Öffnen, aus dem User-Agent abgeleitet. Die Gestaltung des Hero-Feldes folgt der Fensterbreite und deckt sich nicht immer mit der Gerätespalte."
      />
      <PanelBody>
        <HeatMatrix
          rowHeader="Feld"
          max={matrix.max}
          columnTotals={matrix.columnTotals}
          columns={matrix.columns.map((device) => ({
            key: device,
            label: DEVICE_LABEL[device] ?? device,
          }))}
          rows={matrix.rows.map((row) => ({
            key: row.key,
            label: <SurfaceName surface={row.key} />,
            cells: row.cells,
            total: row.total,
          }))}
        />
      </PanelBody>
    </Panel>
  );
}

/** What gets opened: result kinds, positions and the suggestions of the resting list. */
function ClicksPanels({ search }: { search: SearchOverview }) {
  const results = withoutEmptyColumns(resultTypeMatrix(search));
  const browse = withoutEmptyColumns(browseItemMatrix(search));
  const positions = positionRows(search);
  const positionTotal = positions.reduce((sum, row) => sum + row.clicks, 0);
  return (
    <>
      <Panel>
        <PanelHeader
          icon={MousePointerClick}
          title="Welche Treffer geöffnet werden"
          hint="Art des geöffneten Treffers, nach Feld"
        />
        <PanelBody>
          {results.rows.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Noch keine Treffer geöffnet
            </p>
          ) : (
            <HeatMatrix
              rowHeader="Treffertyp"
              max={results.max}
              columnTotals={results.columnTotals}
              columns={results.columns.map((surface) => ({
                key: surface,
                label: <SurfaceName surface={surface} />,
              }))}
              rows={results.rows.map((row) => ({
                key: row.key,
                label: resultKindLabel(row.key),
                cells: row.cells,
                total: row.total,
              }))}
            />
          )}
        </PanelBody>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel>
          <PanelHeader
            title="An welcher Stelle geklickt wird"
            hint="Position des geöffneten Treffers in der Liste, alle Felder"
          />
          <PanelBody>
            {positionTotal === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Noch keine Treffer geöffnet
              </p>
            ) : (
              <BarList
                limit={6}
                unit="Klicks"
                rows={positions.map((row) => ({
                  key: row.position,
                  label: `Platz ${row.position}`,
                  value: row.clicks,
                  share: row.clicks / positionTotal,
                }))}
              />
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Was in der Ruheliste angeklickt wird"
            hint="Vorschläge, die ein Feld vor der ersten Eingabe zeigt, nach Feld"
          />
          <PanelBody>
            {browse.rows.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Noch keine Vorschläge geöffnet
              </p>
            ) : (
              <HeatMatrix
                rowHeader="Vorschlag"
                max={browse.max}
                columnTotals={browse.columnTotals}
                columns={browse.columns.map((surface) => ({
                  key: surface,
                  label: <SurfaceName surface={surface} />,
                }))}
                rows={browse.rows.map((row) => ({
                  key: row.key,
                  label: browseItemLabel(row.key),
                  cells: row.cells,
                  total: row.total,
                }))}
              />
            )}
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}

/** Daily openings of every field, one line each, switchable. */
function SeriesPanel({ search }: { search: SearchOverview }) {
  const days = seriesDays(search);
  const series = surfaceSeries(search, days);
  return (
    <Panel>
      <PanelHeader
        icon={ListChecks}
        title="Verlauf je Feld"
        hint={`Geöffnet je Zeitraum. ${INTERVAL_SENTENCE[search.interval]} Ein Klick auf die Legende blendet ein Feld aus.`}
      />
      <PanelBody>
        {days.length < 2 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Für einen einzelnen Punkt gibt es keine Kurve.
          </p>
        ) : (
          <SeriesChart
            label="Geöffnete Suchfelder je Zeitraum"
            days={days}
            interval={search.interval}
            partial={seriesPartial(search, days)}
            toggleable
            series={Object.entries(series).map(([surface, values]) => ({
              key: surface,
              label: surfaceLabel(surface),
              color: surfaceColor(surface),
              values,
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
      {SEARCH_EVENT_LINKS.map((name) => (
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
 * `/admin/traffic/search`: which search field is used, from which page and on which device. The
 * seven fields are compared on openings, typing, clicks and misses; the matrices show where each
 * is used, and every figure leads back to its event.
 */
export function SearchView() {
  const filters = useTrafficFilters();
  const reason = unsupportedReason('events', filters.filters);
  const { data, error, refetch } = useTrafficData<SearchOverview>('search', filters, undefined, {
    enabled: !reason,
  });

  const header = (
    <>
      <PanelHeader
        icon={Search}
        title="Suche"
        hint="Welches Suchfeld wird gebraucht, von welcher Seite aus und mit welchem Erfolg. Gezählt wird nie, was getippt wurde."
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
            <ErrorState message={`Suche: ${error.message}`} onRetry={() => void refetch()} />
          ) : (
            <LoadingState label="Lade Suche…" />
          )}
        </Panel>
      </AdminPage>
    );
  }

  const opened = data.surfaces.reduce((sum, row) => sum + row.opened, 0);

  return (
    <AdminPage width="wide">
      <Panel>{header}</Panel>
      {opened === 0 ? (
        <Panel>
          <EmptyState
            icon={Search}
            title="Noch keine Suche gezählt"
            description={
              filters.locale
                ? 'In dieser Sprache wurde im Zeitraum kein Suchfeld geöffnet. Mit „Alle“ siehst du die anderen.'
                : 'Die Suchereignisse füllen sich, sobald die Seite mit dem neuen Zähler ausgeliefert ist. Besuche mit Do Not Track, Global Privacy Control oder Opt-out sind nicht darin.'
            }
          />
        </Panel>
      ) : (
        <>
          <HeroHeaderPanel search={data} />
          <SurfaceTable search={data} />
          <PageMatrixPanel search={data} />
          <DevicePanel search={data} />
          <ClicksPanels search={data} />
          <SeriesPanel search={data} />
        </>
      )}
    </AdminPage>
  );
}
