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
  /**
   * When the import running now started, ISO in UTC; `null` when none runs. A request to import
   * while it is set does nothing, so the button waits for it.
   */
  runningSince: string | null;
  /** The first and the last day the stored rows cover, `null` before the first import. */
  coverage: { from: string; to: string } | null;
  /** How many rows are stored. */
  rows: number;
}

/**
 * What Google reports for a window: `ctr` is 0..1, `position` the impression-weighted average,
 * `null` where there were no impressions (a zero would read as the best rank).
 */
export interface SearchConsoleTotals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number | null;
}

/**
 * The difference to the window before: clicks as a signed count, position in places (negative is
 * better), `null` when either side had no impressions.
 */
export interface SearchConsoleChange {
  clicks: number;
  position: number | null;
}

/** What every window answer echoes. */
interface SearchConsoleWindow {
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
 * (`page=<path>`). Google leaves the queries it anonymises out of these `totals`, so they are lower
 * than those of the pages and the series. `previous` covers as many days at the start of the window
 * before as this window has data for, and is `null` over 180 days or without data there.
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
 * (`query=<text>`). Its `totals` count everything Google reported, anonymised queries included, so
 * they match the series.
 */
export interface SearchConsolePagesResponse extends SearchConsoleWindow {
  totals: SearchConsoleTotals;
  previous: SearchConsoleTotals | null;
  items: SearchConsolePage[];
}

/**
 * One period of the series, starting at `day`. A quiet day inside the window is all zeros with no
 * `position`; `partial` is present and `true` when the window or the days Google has data for cut the
 * period.
 */
export interface SearchConsoleSeriesPoint extends SearchConsoleTotals {
  day: string;
  partial?: true;
}

/**
 * `GET /v1/admin/search-console/series`: one point per period, by day, week or month, up to the
 * last day with data.
 */
export interface SearchConsoleSeriesResponse extends SearchConsoleWindow {
  /** Google reports whole days, so there is no hourly step. */
  interval: Exclude<SeriesInterval, 'hour'>;
  series: SearchConsoleSeriesPoint[];
}

/** One page of the reindex queue: what changed when, what Google last saw, and its figures. */
export interface SearchConsoleReindexItem {
  path: string;
  url: string;
  /** `YYYY-MM-DD`, the sitemap `<lastmod>`: when park.fan saw the content change. */
  changedOn: string;
  /** Google's figures over the last 28 days with data. */
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
  /** `unknown`: no crawl at all; `stale`: crawled before the change; `uncertain`: crawled that day. */
  state: 'unknown' | 'stale' | 'uncertain';
  lastCrawlAt: string | null;
  coverageState: string | null;
  inspectedAt: string;
  requestedAt: string | null;
  requestedBy: string | null;
}

/** `GET /v1/admin/search-console/reindex`: the pages Google has not crawled since their change. */
export interface SearchConsoleReindexQueue {
  /** Not requested since the change. */
  open: SearchConsoleReindexItem[];
  /** Requested since the change and waiting for Google's crawl; not to be requested again. */
  requested: SearchConsoleReindexItem[];
  requestsLast24h: number;
  dailyLimit: number;
  history: Array<{ path: string; requestedAt: string; actor: string }>;
  candidates: number;
  inspected: number;
  lastInspectedAt: string | null;
}

/** `POST /v1/admin/search-console/reindex/requests`; `recorded` is false for a page already requested. */
export interface SearchConsoleReindexRecord {
  recorded: boolean;
  requestedAt: string;
  requestsLast24h: number;
  dailyLimit: number;
}
