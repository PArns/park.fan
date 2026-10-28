import type { AnalyticsTotals, SeriesPoint } from '@/lib/api/admin-site-analytics';
import { formatCount, formatDecimal, formatDuration, formatShare } from './site-analytics';

/**
 * The figures of the traffic series: which ones a period carries, what each measures and how it
 * reads, and the order of a table of periods. The chart and the table are drawn from this list, so
 * a figure the API adds has one place to be named.
 */

/** What a figure is counted in, which decides the axis it can share. */
export type MetricUnit = 'count' | 'ratio' | 'percent' | 'seconds';

/** The figures a period of the overview series carries. */
export type MetricKey =
  | 'pageviews'
  | 'visits'
  | 'visitors'
  | 'events'
  | 'viewsPerVisit'
  | 'bounceRate'
  | 'avgVisitSeconds'
  | 'avgTimeOnPageSeconds';

/** One figure of the series. */
export interface TrafficMetric {
  key: MetricKey;
  label: string;
  unit: MetricUnit;
  /** Its place in the categorical palette: a figure keeps its colour whatever is shown beside it. */
  slot: number;
  hint: string;
  /** A fall is the good news. */
  lowerIsBetter?: boolean;
}

/** Every figure, in the order the toggles, the legend and the table columns list them. */
export const TRAFFIC_METRICS: readonly TrafficMetric[] = [
  {
    key: 'pageviews',
    label: 'Aufrufe',
    unit: 'count',
    slot: 0,
    hint: 'Jede aufgerufene Seite, auch beim Wechsel im Tab',
  },
  {
    key: 'visits',
    label: 'Besuche',
    unit: 'count',
    slot: 1,
    hint: 'Ein Besuch endet nach 30 Minuten ohne Aufruf',
  },
  {
    key: 'visitors',
    label: 'Besucher',
    unit: 'count',
    slot: 2,
    hint: 'Summe der Tageswerte: wer an einem anderen Tag wiederkommt, zählt erneut',
  },
  {
    key: 'events',
    label: 'Ereignisse',
    unit: 'count',
    slot: 3,
    hint: 'Klicks und Meldungen der Seite, ohne Seitenaufrufe',
  },
  {
    key: 'viewsPerVisit',
    label: 'Aufrufe je Besuch',
    unit: 'ratio',
    slot: 4,
    hint: 'Aufrufe geteilt durch Besuche',
  },
  {
    key: 'bounceRate',
    label: 'Absprungrate',
    unit: 'percent',
    slot: 5,
    hint: 'Besuche, die nur eine Seite gesehen haben, geteilt durch alle Besuche',
    lowerIsBetter: true,
  },
  {
    key: 'avgVisitSeconds',
    label: 'Ø Besuchsdauer',
    unit: 'seconds',
    slot: 6,
    hint: 'Die Zeit im Vordergrund eines Besuchs, über alle Besuche gemittelt',
  },
  {
    key: 'avgTimeOnPageSeconds',
    label: 'Ø Zeit auf der Seite',
    unit: 'seconds',
    slot: 7,
    hint: 'Die Zeit im Vordergrund, die ein Aufruf offen war, über alle Aufrufe gemittelt',
  },
];

/** The figures the chart starts with: hits against visits against visitors. */
export const DEFAULT_METRICS: readonly MetricKey[] = ['pageviews', 'visits', 'visitors'];

/** The metric of a key. */
export function metricOf(key: MetricKey): TrafficMetric {
  return TRAFFIC_METRICS.find((metric) => metric.key === key) ?? TRAFFIC_METRICS[0];
}

/** What a unit's chart is called when it stands beside others. */
export const UNIT_TITLE: Record<MetricUnit, string> = {
  count: 'Anzahl',
  ratio: 'Aufrufe je Besuch',
  percent: 'Anteil',
  seconds: 'Dauer',
};

/** The units in the order their charts are stacked. */
const UNIT_ORDER: readonly MetricUnit[] = ['count', 'ratio', 'percent', 'seconds'];

/**
 * The chosen figures split by unit, each group in the order of {@link TRAFFIC_METRICS}. One axis
 * suits one unit, so a count and a duration are two charts, never a second y axis.
 */
export function groupByUnit(
  keys: readonly MetricKey[]
): { unit: MetricUnit; metrics: TrafficMetric[] }[] {
  const chosen = TRAFFIC_METRICS.filter((metric) => keys.includes(metric.key));
  return UNIT_ORDER.map((unit) => ({
    unit,
    metrics: chosen.filter((metric) => metric.unit === unit),
  })).filter((group) => group.metrics.length > 0);
}

/** A figure of a period or of the window, `null` where the API had nothing to work it out from. */
export function metricValue(
  source: Pick<SeriesPoint, MetricKey> | AnalyticsTotals,
  key: MetricKey
): number | null {
  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** A figure as the tables and tooltips read it. */
export function formatMetric(unit: MetricUnit, value: number | null): string {
  if (value === null) return '–';
  if (unit === 'ratio') return formatDecimal(value);
  if (unit === 'percent') return formatShare(value);
  if (unit === 'seconds') return formatDuration(value);
  return formatCount(value);
}

/**
 * What a chart plots for a figure: a share as percent points, so one axis step is a whole percent
 * and the number is the one the table prints; everything else as it is.
 */
export function plotValue(unit: MetricUnit, value: number | null): number | null {
  return value !== null && unit === 'percent' ? value * 100 : value;
}

/** What the axis and the tooltip print for a plotted value of a unit. */
export function formatPlotted(unit: MetricUnit, plotted: number | null): string {
  if (plotted === null) return '–';
  if (unit === 'percent') return formatShare(plotted / 100);
  return formatMetric(unit, plotted);
}

/** What a table of periods can be sorted by: the period itself, or a figure. */
export type SortColumn = 'period' | MetricKey;

/**
 * The periods in the order of a column. A period without a figure (a visitor count under a
 * filter, a duration nobody measured) goes last in either direction, since it has no place in
 * the order.
 */
export function sortPoints(
  points: readonly SeriesPoint[],
  column: SortColumn,
  direction: 'asc' | 'desc'
): SeriesPoint[] {
  const sign = direction === 'asc' ? 1 : -1;
  return [...points].sort((a, b) => {
    if (column === 'period') return sign * a.day.localeCompare(b.day);
    const left = metricValue(a, column);
    const right = metricValue(b, column);
    if (left === null && right === null) return a.day.localeCompare(b.day);
    if (left === null) return 1;
    if (right === null) return -1;
    return sign * (left - right) || a.day.localeCompare(b.day);
  });
}
