import type { SeriesInterval } from './admin-site-analytics';

/**
 * What `GET /v1/admin/search-console/*` answers, read by the Search Console section of
 * `/admin/traffic/seo`. The contract is the API's. The reads take the window the analytics reads
 * take (`days`, or `from` and `to`, and `locale`, which keeps the pages whose path starts with that
 * language). A query is what somebody typed into Google and a path is one of our own, so both are
 * rendered as text.
 */

/** `GET /v1/admin/search-console/status`: whether the import is set up, and what it has read. */
export interface SearchConsoleStatus {
  /** `false` without service-account credentials: the module is off and the rest answers empty. */
  configured: boolean;
  /** The property, `sc-domain:park.fan` for a domain property. */
  siteUrl: string | null;
  /** When the last import finished, ISO in UTC; `null` before the first one. */
  lastImportAt: string | null;
  /** The error of the last import, or `null` when it succeeded. */
  lastError: string | null;
  /** The first and the last day the stored rows cover, `null` before the first import. */
  coverage: { from: string; to: string } | null;
  /** How many rows are stored. */
  rows: number;
}

/** What Google reports for a window: `ctr` is 0..1, `position` the impression-weighted average. */
export interface SearchConsoleTotals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/** The difference to the window before: clicks as a signed count, position in places (negative is better). */
export interface SearchConsoleChange {
  clicks: number;
  position: number;
}

/** What every window answer echoes. */
export interface SearchConsoleWindow {
  from: string;
  to: string;
  days: number;
  locale: string | null;
}

/** One search query with its figures. */
export interface SearchConsoleQuery extends SearchConsoleTotals {
  query: string;
  /** `null` when the window is longer than 180 days, or the query had no rows before. */
  change: SearchConsoleChange | null;
}

/**
 * `GET /v1/admin/search-console/queries`: the biggest queries by clicks, optionally of one page
 * (`page=<path>`). `previous` is `null` for a window of more than 180 days.
 */
export interface SearchConsoleQueriesResponse extends SearchConsoleWindow {
  totals: SearchConsoleTotals;
  previous: SearchConsoleTotals | null;
  items: SearchConsoleQuery[];
}

/** Our own numbers for the visits that began on a page from a search engine, in the same window. */
export interface SearchConsoleSiteFigures {
  visits: number;
  bounceRate: number;
  /** Foreground seconds of a visit that began here; `null` without a measurement. */
  avgVisitSeconds: number | null;
}

/** One page of ours as Google sees it, joined with what the counter saw of its search visits. */
export interface SearchConsolePage extends SearchConsoleTotals {
  /** The path as the analytics knows it: lower case, with the language, no trailing slash. */
  path: string;
  change: SearchConsoleChange | null;
  /** `null` when no visit from a search engine began on this path in the window. */
  site: SearchConsoleSiteFigures | null;
}

/**
 * `GET /v1/admin/search-console/pages`: the biggest pages by clicks, optionally for one query
 * (`query=<text>`).
 */
export interface SearchConsolePagesResponse extends SearchConsoleWindow {
  totals: SearchConsoleTotals;
  previous: SearchConsoleTotals | null;
  items: SearchConsolePage[];
}

/** One period of the series; a period without impressions has no meaningful `ctr` or `position`. */
export interface SearchConsoleSeriesPoint extends SearchConsoleTotals {
  day: string;
}

/** `GET /v1/admin/search-console/series`: one point per period, by day, week or month. */
export interface SearchConsoleSeriesResponse extends SearchConsoleWindow {
  /** Google reports whole days, so there is no hourly step. */
  interval: Exclude<SeriesInterval, 'hour'>;
  series: SearchConsoleSeriesPoint[];
}
