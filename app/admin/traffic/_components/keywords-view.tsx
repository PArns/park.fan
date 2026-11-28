'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeltaChip } from '../../_ui/charts';
import { Select } from '../../_ui/controls';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
  StatTile,
  Toolbar,
} from '../../_ui/primitives';
import { useAdminQuery } from '../../_lib/api';
import { formatDecimal } from '@/lib/admin/site-analytics';
import type { KeywordReport, KeywordRow } from '@/lib/api/admin-search-console';
import { addDays } from '@/lib/utils/park-day';
import { formatCount } from '@/lib/admin/format-number';

const COUNTRIES = [
  { value: 'deu', label: 'Deutschland' },
  { value: 'aut', label: 'Österreich' },
  { value: 'che', label: 'Schweiz' },
  { value: 'nld', label: 'Niederlande' },
  { value: 'fra', label: 'Frankreich' },
  { value: 'usa', label: 'USA' },
  { value: 'gbr', label: 'Vereinigtes Königreich' },
];

const DEVICES = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobil' },
  { value: 'tablet', label: 'Tablet' },
];

const dayFormat = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  timeZone: 'UTC',
});

/** `02.11.26 – 08.11.26`. */
function weekLabel(week: { from: string; to: string }): string {
  const day = (iso: string) => dayFormat.format(new Date(`${iso}T00:00:00Z`));
  return `${day(week.from)} – ${day(week.to)}`;
}

const position = (value: number | null) => (value === null ? '–' : formatDecimal(value));

/** The move of one keyword: places up or down, new, lost or unchanged. */
function MoveChip({ row }: { row: KeywordRow }) {
  if (row.trend === 'new') return <Chip tone="primary">neu</Chip>;
  if (row.trend === 'lost') return <Chip tone="warning">raus</Chip>;
  const places = formatDecimal(Math.abs(row.change ?? 0));
  if (row.trend === 'same') return <DeltaChip delta={{ direction: 'flat', percent: null }} />;
  return (
    <DeltaChip
      delta={{ direction: row.trend, percent: null }}
      label={`${row.trend === 'up' ? '+' : '−'}${places}`}
      title={`${places} Plätze ${row.trend === 'up' ? 'nach oben' : 'nach unten'}`}
    />
  );
}

/**
 * The keywords as a table: position this week and before, the move, the page, the figures.
 * `compact` keeps keyword, positions and move, for a half-width panel.
 */
function KeywordTable({ rows, compact = false }: { rows: KeywordRow[]; compact?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead className="text-muted-foreground text-xs">
          <tr className="text-left">
            <th className="py-1.5 font-medium">Keyword</th>
            <th className="py-1.5 text-right font-medium">Pos.</th>
            <th className="py-1.5 pl-3 text-right font-medium">Vorwoche</th>
            <th className="py-1.5 pl-3 font-medium">+/−</th>
            {!compact && (
              <>
                <th className="py-1.5 font-medium max-md:hidden">URL</th>
                <th className="py-1.5 text-right font-medium">Klicks</th>
                <th className="py-1.5 text-right font-medium max-sm:hidden">Impr.</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.query} className="border-border/40 border-t">
              <td className="max-w-64 truncate py-1.5 pr-3">{row.query}</td>
              <td className="py-1.5 text-right font-medium">{position(row.current.position)}</td>
              <td className="text-muted-foreground py-1.5 pl-3 text-right">
                {position(row.previous.position)}
              </td>
              <td className="py-1.5 pl-3">
                <MoveChip row={row} />
              </td>
              {!compact && (
                <>
                  <td className="text-muted-foreground max-w-56 truncate py-1.5 pr-3 max-md:hidden">
                    {row.page ?? '–'}
                  </td>
                  <td className="py-1.5 text-right">{formatCount(row.current.clicks)}</td>
                  <td className="py-1.5 text-right max-sm:hidden">
                    {formatCount(row.current.impressions)}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A count this week with last week's beside it. */
function Compare({ now, before }: { now: number; before: number }) {
  return (
    <>
      {formatCount(now)}
      <span className="text-muted-foreground ml-2 text-sm font-normal">
        Vorwoche {formatCount(before)}
      </span>
    </>
  );
}

/**
 * `/admin/traffic/keywords`: the weekly keyword report from Search Console, like a rank tracker's
 * but from Google's own figures. The keywords are the queries with the most impressions; no list is
 * kept by hand. Competitors are not in it.
 */
export function KeywordsView() {
  const [country, setCountry] = useState<string | null>(null);
  const [device, setDevice] = useState<string | null>(null);
  const [week, setWeek] = useState<string | null>(null);
  const params = new URLSearchParams();
  if (week) params.set('week', week);
  if (country) params.set('country', country);
  if (device) params.set('device', device);
  const report = useAdminQuery<KeywordReport>(
    ['admin', 'search-console', 'keywords', week, country, device],
    `/api/admin/search-console/keywords?${params}`,
    { staleTime: 5 * 60_000 }
  );
  const data = report.data;
  const summary = data?.summary;
  const visibility = summary?.visibility;

  return (
    <AdminPage>
      <Panel>
        <PanelHeader
          icon={ListOrdered}
          title="Keywords"
          hint="Die Suchbegriffe mit den meisten Impressionen, letzte volle Woche (Montag bis Sonntag) gegen die Woche davor. Positionen sind Googles Durchschnitt aus der Search Console."
        />
        <PanelBody className="space-y-4">
          <Toolbar>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                aria-label="Woche davor"
                disabled={!data?.previous}
                onClick={() => data?.previous && setWeek(data.previous.from)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-40 text-center text-sm tabular-nums">
                {data?.current ? weekLabel(data.current) : '…'}
              </span>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Woche danach"
                disabled={!week || !data?.current}
                onClick={() => data?.current && setWeek(addDays(data.current.to, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Select
              value={country}
              onValueChange={setCountry}
              options={COUNTRIES}
              emptyLabel="Alle Länder"
              placeholder="Alle Länder"
              className="w-44"
            />
            <Select
              value={device}
              onValueChange={setDevice}
              options={DEVICES}
              emptyLabel="Alle Geräte"
              placeholder="Alle Geräte"
              className="w-36"
            />
          </Toolbar>

          {report.isError ? (
            <ErrorState message={report.error.message} />
          ) : report.isLoading || !summary || !visibility ? (
            <SkeletonRows rows={4} />
          ) : summary.keywords === 0 ? (
            <EmptyState
              icon={ListOrdered}
              title="Keine Keywords"
              description="Für diese Woche und diese Filter hat die Search Console keine Suchbegriffe."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label={`Sichtbarkeit (${summary.keywords} Keywords)`}
                value={
                  <span className="flex items-center gap-2">
                    {formatDecimal(visibility.current)} %
                    <DeltaChip
                      delta={{
                        direction:
                          visibility.change > 0 ? 'up' : visibility.change < 0 ? 'down' : 'flat',
                        percent: null,
                      }}
                      label={`${visibility.change >= 0 ? '+' : '−'}${formatDecimal(Math.abs(visibility.change))} Pkt.`}
                    />
                  </span>
                }
                sub="Anteil der Klicks, die diese Keywords auf Platz 1 bekämen"
              />
              <StatTile
                label="Top 3"
                value={<Compare now={summary.top3.current} before={summary.top3.previous} />}
              />
              <StatTile
                label="Top 10"
                value={<Compare now={summary.top10.current} before={summary.top10.previous} />}
              />
              <StatTile
                label="Bewegung"
                value={
                  <span className="flex items-center gap-3 text-xl">
                    <span className="flex items-center gap-1 text-emerald-500">
                      <ArrowUp className="h-4 w-4" />
                      {summary.risers.keywords}
                    </span>
                    <span className="flex items-center gap-1 text-rose-500">
                      <ArrowDown className="h-4 w-4" />
                      {summary.fallers.keywords}
                    </span>
                  </span>
                }
                sub={`${formatDecimal(summary.risers.places)} Plätze hoch, ${formatDecimal(summary.fallers.places)} runter · ${summary.new} neu, ${summary.lost} raus`}
              />
            </div>
          )}
        </PanelBody>
      </Panel>

      {data && data.items.length > 0 && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel>
              <PanelHeader icon={TrendingUp} title="Größte Aufsteiger" />
              <PanelBody>
                {data.movers.risers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Keine Keywords betroffen</p>
                ) : (
                  <KeywordTable rows={data.movers.risers} compact />
                )}
              </PanelBody>
            </Panel>
            <Panel>
              <PanelHeader icon={ArrowDown} title="Größte Absteiger" />
              <PanelBody>
                {data.movers.fallers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Keine Keywords betroffen</p>
                ) : (
                  <KeywordTable rows={data.movers.fallers} compact />
                )}
              </PanelBody>
            </Panel>
          </div>
          <Panel>
            <PanelHeader
              icon={ListOrdered}
              title="Alle Keywords"
              hint="Nach Impressionen beider Wochen. +/− in Plätzen, ab einem Platz zählt es als Bewegung."
            />
            <PanelBody>
              <KeywordTable rows={data.items} />
            </PanelBody>
          </Panel>
        </>
      )}
    </AdminPage>
  );
}
