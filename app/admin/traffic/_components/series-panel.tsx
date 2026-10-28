'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, BarChart3 } from 'lucide-react';
import { INTERVAL_SENTENCE, formatPeriodLong } from '@/lib/admin/traffic-range';
import {
  DEFAULT_METRICS,
  TRAFFIC_METRICS,
  UNIT_TITLE,
  formatMetric,
  groupByUnit,
  metricValue,
  plotValue,
  sortPoints,
  type MetricKey,
  type SortColumn,
} from '@/lib/admin/traffic-series';
import type { TrafficOverview } from '@/lib/api/admin-site-analytics';
import { cn } from '@/lib/utils';
import { CATEGORICAL, SeriesChart } from '../../_ui/charts';
import { Segmented } from '../../_ui/controls';
import { Chip, Panel, PanelBody, PanelHeader } from '../../_ui/primitives';
import { HourlyNotice } from './hourly-notice';

/**
 * The series of the window: pick the figures to draw (hits against visits against visitors by
 * default), and see them as lines or as a table of every period with all figures and the window's
 * totals. A chart is one unit, so counts, a ratio, a share and durations are separate charts one
 * under the other and never share an axis. A figure keeps its colour whatever is picked beside it.
 */
export function SeriesPanel({ data }: { data: TrafficOverview }) {
  const [picked, setPicked] = useState<ReadonlySet<MetricKey>>(new Set(DEFAULT_METRICS));
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const visitorsMissing = data.totals.visitors === null;
  const byVisitsOnly = data.totals.pageviews === null;
  // A figure the API did not send for this window (visitors under a filter, page views under a
  // filter on how a visit began) has nothing to draw, and a line of nothing would read as zero.
  const choices = TRAFFIC_METRICS.filter(
    (metric) =>
      metricValue(data.totals, metric.key) !== null ||
      data.series.some((point) => metricValue(point, metric.key) !== null)
  );
  // A line needs a point with a value: the hours of yesterday have no visitors although the day
  // does, and the table still shows the day's total.
  const drawable = choices.filter((metric) =>
    data.series.some((point) => metricValue(point, metric.key) !== null)
  );
  const lines = drawable.length > 0 ? drawable : choices;
  const chosen = lines.filter((metric) => picked.has(metric.key)).map((metric) => metric.key);
  const groups = groupByUnit(chosen.length > 0 ? chosen : [lines[0].key]);
  // Visitors are known for the hours of today only; earlier hours have none.
  const hoursWithoutVisitors =
    data.interval === 'hour' &&
    !visitorsMissing &&
    data.series.some((point) => point.visitors === null);

  const toggle = (key: MetricKey) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else next.add(key);
      return next;
    });

  const days = data.series.map((point) => point.day);
  const partial = data.series.map((point) => point.partial === true);
  const anyPartial = partial.some(Boolean);

  return (
    <Panel>
      <PanelHeader
        icon={BarChart3}
        title="Verlauf"
        hint={`${INTERVAL_SENTENCE[data.interval]}${
          byVisitsOnly
            ? ' Unter diesem Filter gibt es nur Besuchswerte.'
            : visitorsMissing
              ? ' Besucher fehlen, solange ein Filter gesetzt ist.'
              : hoursWithoutVisitors
                ? ' Besucher gibt es stundenweise nur für heute.'
                : ' Besucher sind die Summe der Tageswerte.'
        }`}
      />
      <PanelBody>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <ul className="flex flex-wrap gap-1.5" aria-label="Kennzahlen im Verlauf">
            {lines.map((metric) => {
              const on = picked.has(metric.key);
              return (
                <li key={metric.key}>
                  <button
                    type="button"
                    aria-pressed={on}
                    title={metric.hint}
                    onClick={() => toggle(metric.key)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors max-sm:min-h-9',
                      on
                        ? 'border-border bg-muted/40 text-foreground'
                        : 'border-border/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full"
                      style={{
                        background: CATEGORICAL[metric.slot],
                        opacity: on ? 1 : 0.35,
                      }}
                    />
                    {metric.label}
                  </button>
                </li>
              );
            })}
          </ul>
          <Segmented
            label="Darstellung"
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: 'Diagramm' },
              { value: 'table', label: 'Tabelle' },
            ]}
          />
        </div>

        {data.series.length < 2 && view === 'chart' ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Für einen einzelnen Punkt gibt es keine Kurve. Die letzten 30 Minuten stehen oben unter
            „Jetzt aktiv“, ein feinerer Schritt oder ein längerer Zeitraum darüber.
          </p>
        ) : view === 'chart' ? (
          <div className="space-y-4">
            {groups.map((group, index) => (
              <div key={group.unit}>
                {groups.length > 1 && (
                  <p className="text-muted-foreground mb-1 text-[11px] font-medium tracking-wide uppercase">
                    {UNIT_TITLE[group.unit]}
                  </p>
                )}
                <SeriesChart
                  chrome={false}
                  gutter={groups.length > 1 ? 64 : undefined}
                  unit={group.unit}
                  interval={data.interval}
                  height={index === 0 ? 220 : 150}
                  days={days}
                  partial={partial}
                  label={`${group.metrics.map((metric) => metric.label).join(', ')} je Zeitraum, ${data.from} bis ${data.to}`}
                  series={group.metrics.map((metric) => ({
                    key: metric.key,
                    label: metric.label,
                    color: CATEGORICAL[metric.slot],
                    values: data.series.map((point) =>
                      plotValue(group.unit, metricValue(point, metric.key))
                    ),
                  }))}
                />
              </div>
            ))}
            {anyPartial && (
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span
                  aria-hidden="true"
                  className="bg-muted-foreground/15 inline-block h-3 w-5 rounded-sm"
                />
                Schattiert: der Zeitraum ist nur zum Teil im Fenster und nicht mit einem ganzen
                vergleichbar.
              </p>
            )}
          </div>
        ) : (
          <PeriodTable data={data} columns={choices.map((metric) => metric.key)} />
        )}
        <HourlyNotice data={data} />
      </PanelBody>
    </Panel>
  );
}

/**
 * Every period of the series with every figure, sortable by any column, and the window's totals
 * underneath. The totals are the API's, not a sum of the rows: visitors, rates and averages of a
 * window are not sums of their periods. A period the window cut off is marked.
 */
function PeriodTable({ data, columns }: { data: TrafficOverview; columns: readonly MetricKey[] }) {
  const [sort, setSort] = useState<{ column: SortColumn; direction: 'asc' | 'desc' }>({
    column: 'period',
    direction: 'asc',
  });
  const rows = useMemo(
    () => sortPoints(data.series, sort.column, sort.direction),
    [data.series, sort]
  );
  const metrics = TRAFFIC_METRICS.filter((metric) => columns.includes(metric.key));

  const header = (column: SortColumn, label: string, align: 'left' | 'right') => {
    const on = sort.column === column;
    return (
      <th
        key={column}
        scope="col"
        aria-sort={on ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={cn(
          'px-3 py-1.5 font-medium whitespace-nowrap',
          align === 'right' ? 'text-right' : 'text-left'
        )}
      >
        <button
          type="button"
          onClick={() =>
            setSort((current) =>
              current.column === column
                ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
                : { column, direction: column === 'period' ? 'asc' : 'desc' }
            )
          }
          className={cn(
            'hover:text-foreground inline-flex items-center gap-1 uppercase',
            on && 'text-foreground'
          )}
        >
          {label}
          {on &&
            (sort.direction === 'asc' ? (
              <ArrowUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ArrowDown className="h-3 w-3" aria-hidden="true" />
            ))}
        </button>
      </th>
    );
  };

  return (
    <div className="border-border/50 max-h-[32rem] overflow-auto rounded-lg border">
      <table className="w-full text-sm tabular-nums">
        <thead className="bg-card text-muted-foreground sticky top-0 z-10 text-[11px] tracking-wide">
          <tr>
            {header('period', 'Zeitraum', 'left')}
            {metrics.map((metric) => header(metric.key, metric.label, 'right'))}
          </tr>
        </thead>
        <tbody className="divide-border/40 divide-y">
          {rows.map((point) => (
            <tr key={point.day} className={cn(point.partial && 'bg-muted/20')}>
              <td className="text-muted-foreground px-3 py-1.5 whitespace-nowrap">
                {formatPeriodLong(point.day, data.interval)}
                {point.partial && (
                  <Chip tone="muted" className="ml-2">
                    teilweise
                  </Chip>
                )}
              </td>
              {metrics.map((metric) => (
                <td key={metric.key} className="px-3 py-1.5 text-right">
                  {formatMetric(metric.unit, metricValue(point, metric.key))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-card sticky bottom-0 font-semibold">
          <tr className="border-border/60 border-t">
            <td className="px-3 py-1.5">Gesamt</td>
            {metrics.map((metric) => (
              <td key={metric.key} className="px-3 py-1.5 text-right">
                {formatMetric(metric.unit, metricValue(data.totals, metric.key))}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
