import type {
  SearchConsoleChange,
  SearchConsoleSeriesPoint,
  SearchConsoleStatus,
  SearchConsoleTotals,
} from '@/lib/api/admin-search-console';
import type { SeriesInterval } from '@/lib/api/admin-site-analytics';
import {
  formatChange,
  formatCount,
  formatDecimal,
  formatShare,
  trafficQuery,
  type TrafficDelta,
  type TrafficQueryState,
} from './site-analytics';
import {
  addDays,
  defaultInterval,
  formatRangeSpan,
  germanDay,
  intervalsFor,
  weekStart,
  type TrafficRange,
} from './traffic-range';
import { plotValue, type MetricUnit } from './traffic-series';

/**
 * The pure half of the Search Console section on `/admin/traffic/seo`: the four figures Google
 * reports and how each reads, the change against the window before, the address of each read, the
 * drill-down parameters, and what the status line has to say. Kept apart from the components so
 * `pnpm test:admin-search-console` can pin it.
 */

/** The figures Google reports for a query, a page or a window. */
type SearchConsoleMetricKey = 'clicks' | 'impressions' | 'ctr' | 'position';

/** One of the four figures: its words, the unit its axis counts in, and its colour. */
interface SearchConsoleMetric {
  key: SearchConsoleMetricKey;
  label: string;
  unit: MetricUnit;
  /** Its place in the categorical palette, so a figure keeps its colour on every chart. */
  slot: number;
  hint: string;
  /** A fall is the good news. */
  lowerIsBetter?: boolean;
}

/** The four figures in the order the tiles, the charts and the table columns list them. */
export const SEARCH_CONSOLE_METRICS: readonly SearchConsoleMetric[] = [
  {
    key: 'clicks',
    label: 'Klicks',
    unit: 'count',
    slot: 0,
    hint: 'Wie oft jemand in der Google-Suche ein Ergebnis von park.fan angeklickt hat',
  },
  {
    key: 'impressions',
    label: 'Impressionen',
    unit: 'count',
    slot: 1,
    hint: 'Wie oft ein Ergebnis von park.fan in der Google-Suche angezeigt wurde',
  },
  {
    key: 'ctr',
    label: 'CTR',
    unit: 'percent',
    slot: 2,
    hint: 'Klicks geteilt durch Impressionen',
  },
  {
    key: 'position',
    label: 'Ø Position',
    unit: 'position',
    slot: 3,
    hint: 'Die durchschnittliche Platzierung in den Ergebnissen, 1 ist ganz oben. Eine kleinere Zahl ist besser.',
    lowerIsBetter: true,
  },
];

/** The metric of a key. */
function searchConsoleMetric(key: SearchConsoleMetricKey): SearchConsoleMetric {
  return SEARCH_CONSOLE_METRICS.find((metric) => metric.key === key) ?? SEARCH_CONSOLE_METRICS[0];
}

/**
 * A figure of a period or a window, `null` where it has nothing to stand on: a click rate and a
 * position over no impressions are not zero, they do not exist.
 */
export function searchConsoleFigure(
  source: SearchConsoleTotals | SearchConsoleSeriesPoint,
  key: SearchConsoleMetricKey
): number | null {
  const value = source[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if ((key === 'ctr' || key === 'position') && !(source.impressions > 0)) return null;
  return value;
}

/** A figure as the tiles and the tables print it; a dash for one that does not exist. */
export function formatSearchConsole(key: SearchConsoleMetricKey, value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '–';
  if (key === 'ctr') return formatShare(value);
  if (key === 'position') return formatDecimal(value);
  return formatCount(value);
}

/** The four figures of a row or a window as the tables print them, keyed like the metrics. */
export function formatSearchConsoleRow(
  source: SearchConsoleTotals
): Record<SearchConsoleMetricKey, string> {
  return {
    clicks: formatSearchConsole('clicks', searchConsoleFigure(source, 'clicks')),
    impressions: formatSearchConsole('impressions', searchConsoleFigure(source, 'impressions')),
    ctr: formatSearchConsole('ctr', searchConsoleFigure(source, 'ctr')),
    position: formatSearchConsole('position', searchConsoleFigure(source, 'position')),
  };
}

/** What a chart plots for a figure of a period: a click rate as percent points, as the table prints it. */
export function plotSearchConsole(
  point: SearchConsoleSeriesPoint,
  key: SearchConsoleMetricKey
): number | null {
  return plotValue(searchConsoleMetric(key).unit, searchConsoleFigure(point, key));
}

// ---------------------------------------------------------------------------------------------
// Change

/** A signed number of places: `+1,2` fell down the results, `−0,4` climbed, `±0` stayed. */
export function formatPositionChange(change: number): string {
  const rounded = Math.round(Math.abs(change) * 10) / 10;
  if (rounded === 0) return '±0';
  return `${change > 0 ? '+' : '−'}${formatDecimal(rounded)}`;
}

/** The direction of a difference in a figure's own unit; flat when it rounds to nothing. */
function directionOf(difference: number, step: number): TrafficDelta['direction'] {
  if (Math.abs(difference) < step / 2) return 'flat';
  return difference > 0 ? 'up' : 'down';
}

/**
 * What a change is measured against. Google is days behind, so the API compares with as many days at
 * the start of the window before as the window has data for, not with the whole window before.
 */
const COMPARISON = 'gegenüber dem Zeitraum davor, mit gleich vielen Tagen mit Daten';

/** Why a window has no window before to compare with. */
export const NO_COMPARISON =
  'Kein Vergleich: Über 180 Tage gibt es keinen Zeitraum davor, oder Google hat dort keine Daten.';

/** A change for a `DeltaChip`: its direction and, for a figure told in its own unit, the label. */
interface SearchConsoleChip {
  delta: TrafficDelta;
  /** Replaces the percentage: percent points for a click rate, places for a position. */
  label?: string;
  /** What the change is measured against, for the tooltip. */
  title: string;
}

/**
 * The change of a headline figure against the window before. Clicks and impressions are told as a
 * percentage, a click rate in percent points and a position in places: a percentage of a
 * percentage reads as the rate itself moving, and a position that goes from 8 to 4 is four places,
 * not "minus 50 percent". `null` when the window before is missing or has nothing to compare.
 */
export function searchConsoleChip(
  key: SearchConsoleMetricKey,
  totals: SearchConsoleTotals,
  previous: SearchConsoleTotals | null
): SearchConsoleChip | null {
  if (previous === null) return null;
  const now = searchConsoleFigure(totals, key);
  const before = searchConsoleFigure(previous, key);
  if (now === null || before === null) return null;
  const title = `${COMPARISON}: ${formatSearchConsole(key, before)}`;

  if (key === 'clicks' || key === 'impressions') {
    if (before === 0) {
      return {
        delta:
          now === 0 ? { direction: 'flat', percent: null } : { direction: 'new', percent: null },
        title,
      };
    }
    const change = ((now - before) / before) * 100;
    const direction = Math.abs(change) < 0.5 ? 'flat' : change > 0 ? 'up' : 'down';
    return {
      delta: { direction, percent: direction === 'flat' ? 0 : Math.round(Math.abs(change)) },
      title,
    };
  }

  if (key === 'ctr') {
    const points = (now - before) * 100;
    const direction = directionOf(points, 0.1);
    const label =
      direction === 'flat'
        ? 'gleich'
        : `${points > 0 ? '+' : '−'}${formatDecimal(Math.abs(points))} Pp`;
    return { delta: { direction, percent: null }, label, title };
  }

  const places = now - before;
  const direction = directionOf(places, 0.1);
  return {
    delta: { direction, percent: null },
    label: direction === 'flat' ? 'gleich' : `${formatPositionChange(places)} Plätze`,
    title,
  };
}

/** How a row moved: the clicks as a signed count, the position in places, and whether it is good news. */
interface SearchConsoleRowChange {
  clicks: string;
  /** `null` when either side had no impressions: a place that did not exist cannot have moved. */
  position: string | null;
  clicksTone: 'good' | 'bad' | 'flat';
  positionTone: 'good' | 'bad' | 'flat';
}

/**
 * A row's change in words and tones; `null` without a change (no window before). A position that
 * either side has no impressions for has no change, which is not a change of zero.
 */
export function searchConsoleRowChange(
  change: SearchConsoleChange | null
): SearchConsoleRowChange | null {
  if (change === null) return null;
  const places = change.position === null ? null : Math.round(change.position * 10) / 10;
  return {
    clicks: formatChange(change.clicks),
    position: change.position === null ? null : formatPositionChange(change.position),
    clicksTone: change.clicks === 0 ? 'flat' : change.clicks > 0 ? 'good' : 'bad',
    positionTone: places === null || places === 0 ? 'flat' : places < 0 ? 'good' : 'bad',
  };
}

// ---------------------------------------------------------------------------------------------
// Addresses

/** The proxy path of the status read. */
export const SEARCH_CONSOLE_STATUS_PATH = '/api/admin/search-console/status';

/** The proxy path that queues an import now. */
export const SEARCH_CONSOLE_IMPORT_PATH = '/api/admin/search-console/import';

/** The proxy path of the reindex queue; `/requests` records one, `/scan` queues the check. */
export const SEARCH_CONSOLE_REINDEX_PATH = '/api/admin/search-console/reindex';

/**
 * Search Console's URL Inspection for one page, where "Indexierung beantragen" is: Google offers no
 * API for the request itself.
 */
export function searchConsoleInspectUrl(siteUrl: string, pageUrl: string): string {
  const params = new URLSearchParams({ resource_id: siteUrl, id: pageUrl });
  return `https://search.google.com/search-console/inspect?${params}`;
}

/** The reads that take the window. */
export type SearchConsoleReport = 'queries' | 'pages' | 'series';

/**
 * The proxy path of a read with the window, the language and extras (`page`, `query`, `limit`).
 * The step goes to the series only; the filters of the traffic pages are not sent, since the API
 * knows nothing of them.
 */
export function searchConsolePath(
  report: SearchConsoleReport,
  state: Pick<TrafficQueryState, 'range' | 'locale'> & { interval?: SeriesInterval | null },
  extra?: Record<string, string | number>
): string {
  const query = trafficQuery(
    {
      range: state.range,
      locale: state.locale,
      interval: report === 'series' ? state.interval : null,
    },
    extra
  );
  return `/api/admin/search-console/${report}?${query}`;
}

/** The steps of the Search Console series: Google reports whole days, so there is no hour. */
type SearchConsoleInterval = Exclude<SeriesInterval, 'hour'>;

/** The step a series is asked for when the address names `active`: an hour becomes a day. */
export function searchConsoleInterval(active: SeriesInterval): SearchConsoleInterval {
  return active === 'hour' ? 'day' : active;
}

/** The steps that make a chart of a window of `days`, without the hour. */
export function searchConsoleIntervals(days: number): SearchConsoleInterval[] {
  return intervalsFor(days).filter((step): step is SearchConsoleInterval => step !== 'hour');
}

/** The step a window of `days` starts with when the address names none. */
export function defaultSearchConsoleInterval(days: number): SearchConsoleInterval {
  return searchConsoleInterval(defaultInterval(days));
}

/** The last day of the month that starts at `start`. */
function monthEnd(start: string): string {
  const [year, month] = start.split('-').map(Number);
  return `${start.slice(0, 8)}${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, '0')}`;
}

/**
 * Which periods of a series are not whole, as the API says when it flags any (`partial: true` on a
 * period the window or Google's missing days cut), otherwise as {@link partialPeriods} works it out.
 */
export function seriesPartial(
  points: readonly SearchConsoleSeriesPoint[],
  interval: SearchConsoleInterval,
  window: { from: string; to: string },
  coverageTo: string | null
): boolean[] {
  if (points.some((point) => point.partial === true)) {
    return points.map((point) => point.partial === true);
  }
  return partialPeriods(
    points.map((point) => point.day),
    interval,
    window,
    coverageTo
  );
}

/**
 * A fallback for when the API flags none: a week or month the window starts inside, and one that
 * reaches past the window's end or past the last day Google has reported, whichever comes first. Its
 * figure is not comparable with a whole one, and a month cut off by the last three days that are
 * still missing would otherwise read as a drop.
 */
export function partialPeriods(
  starts: readonly string[],
  interval: SearchConsoleInterval,
  window: { from: string; to: string },
  coverageTo: string | null
): boolean[] {
  if (interval === 'day') return starts.map(() => false);
  const until = coverageTo !== null && coverageTo < window.to ? coverageTo : window.to;
  return starts.map((start) => {
    const begins = interval === 'week' ? weekStart(start) === start : start.endsWith('-01');
    const end = interval === 'week' ? addDays(start, 6) : monthEnd(start);
    return !begins || start < window.from || end > until;
  });
}

// ---------------------------------------------------------------------------------------------
// Drill-down

/** The address parameter that holds the query a page list is narrowed to. */
export const SEARCH_CONSOLE_QUERY_PARAM = 'gscQuery';

/** The address parameter that holds the page a query list is narrowed to. */
export const SEARCH_CONSOLE_PAGE_PARAM = 'gscPage';

const MAX_DRILL_LENGTH = 300;

/** The query an address names: trimmed text of a sane length, otherwise `null`. */
export function parseSearchConsoleQuery(raw: string | null | undefined): string | null {
  const text = raw?.trim() ?? '';
  return text.length > 0 && text.length <= MAX_DRILL_LENGTH ? text : null;
}

/** The page an address names: one of our paths, so it starts with a slash and has no query or hash. */
export function parseSearchConsolePage(raw: string | null | undefined): string | null {
  const text = raw?.trim() ?? '';
  return text.length <= MAX_DRILL_LENGTH && /^\/[^\s?#]*$/.test(text) ? text : null;
}

/** The address of the Google results for a query, to see what a searcher sees. */
export function googleSearchHref(query: string): string {
  return `https://www.google.com/search?${new URLSearchParams({ q: query }).toString()}`;
}

// ---------------------------------------------------------------------------------------------
// Status

/**
 * Where the import stands: `off` without credentials, `waiting` while nothing is stored yet (the
 * first import backfills 16 months and takes its time), `ready` once rows exist. A failed import
 * does not change this: rows from the one before are still there to read.
 */
export function searchConsoleState(status: SearchConsoleStatus): 'off' | 'waiting' | 'ready' {
  if (!status.configured) return 'off';
  return status.coverage === null || status.rows <= 0 ? 'waiting' : 'ready';
}

/**
 * The window Google's figures cover, in a sentence, from the dates the API echoed. A rolling window
 * ends at the last day with data, so it reads like Search Console's own "Letzte 28 Tage"; a fixed one
 * says where the stored days stop when it reaches past them, and where nothing was imported before.
 */
export function googleWindowNote(
  range: TrafficRange,
  window: { from: string; to: string; days: number },
  coverage: { from: string; to: string } | null
): string {
  const notes: string[] = [];
  if (range.kind === 'days') {
    const unit = window.days === 1 ? 'Tag' : 'Tage';
    const last = coverage?.to === window.to ? ' (letzter Tag mit Daten)' : '';
    notes.push(`Google-Zahlen: ${window.days} ${unit} bis ${germanDay(window.to)}${last}.`);
  } else {
    notes.push(`Google-Zahlen: ${formatRangeSpan(window)}.`);
    if (coverage && window.to > coverage.to) {
      notes.push(`Google hat Daten bis ${germanDay(coverage.to)}, die Tage danach fehlen noch.`);
    }
  }
  if (coverage && window.from < coverage.from) {
    notes.push(`Vor dem ${germanDay(coverage.from)} ist nichts importiert.`);
  }
  return notes.join(' ');
}

/** What the status said when an import was requested: if either changes, the import has run. */
export type ImportMark = Pick<SearchConsoleStatus, 'lastImportAt' | 'lastError'>;

/**
 * Whether the import requested at `mark` has run since: it has finished (a new `lastImportAt`) or
 * failed (a new `lastError`). `runningSince` cannot say that: between the request and the start of
 * the run it is still empty.
 */
export function importFinished(mark: ImportMark, current: ImportMark): boolean {
  return mark.lastImportAt !== current.lastImportAt || mark.lastError !== current.lastError;
}

/**
 * Whether the API reports an import in progress, whoever started it: the nightly run, or a request
 * from another tab. An API that does not send `runningSince` yet reads as none.
 */
export function importInProgress(status: Pick<SearchConsoleStatus, 'runningSince'>): boolean {
  return status.runningSince != null;
}

/** How long a requested import is waited for, in milliseconds, before the page stops asking. */
export const IMPORT_WAIT_MS = 5 * 60_000;

/** Milliseconds between two asks for the status while an import is awaited. */
export const IMPORT_POLL_MS = 6_000;

/** The owner's setup steps in the API's docs: the service account, the property, the variables. */
export const SEARCH_CONSOLE_SETUP_DOC =
  'https://github.com/PArns/v4.api.park.fan/blob/main/docs/admin/search-console-setup.md';
