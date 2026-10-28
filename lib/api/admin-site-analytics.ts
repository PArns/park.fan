/**
 * What `GET /v1/admin/analytics/*` answers, read by `/admin/traffic`, its event and SEO pages and
 * `/admin/traffic/search`. The contract is the API's
 * (`docs/frontend/site-analytics.md` in the backend). Every read takes the window (`days`), an
 * optional `locale` and any number of `filter=<dimension>:<value>`, and echoes them. Numbers are
 * integers unless a name ends in `Rate` or is `share`, which are 0..1 floats.
 *
 * Nothing here is a closed list: the API stores whatever event names, properties, page types and
 * search fields the site sent, so those are strings, and the words for the ones this build knows
 * live in `lib/admin/site-analytics.ts`.
 */

/** What every response echoes: UTC days, today included, the language and the filters. */
export interface AnalyticsWindow {
  from: string;
  to: string;
  days: number;
  /** The language the figures are limited to, `null` for all. */
  locale: string | null;
  /** The filters that were applied, as `dimension:value`; absent when there were none. */
  filters?: string[];
}

/** The headline figures of a window. `viewsPerVisit` is a float, `bounceRate` a share. */
export interface AnalyticsTotals {
  pageviews: number;
  visits: number;
  visitors: number;
  events: number;
  viewsPerVisit: number;
  /** Visits that saw one page, over all visits: 1 minus the engaged ones. */
  bounceRate: number;
}

/** One minute of the realtime counter. */
export interface RealtimeMinute {
  minute: string;
  pageviews: number;
}

/**
 * One point of the daily series. `day` is a `YYYY-MM-DD`, or for a window of one day an ISO
 * timestamp at the start of an hour (`2026-10-28T07:00:00Z`), which is drawn as that hour.
 */
export interface SeriesPoint {
  day: string;
  pageviews: number;
  visits: number;
  visitors: number;
}

/** `GET /v1/admin/analytics/overview`: totals against the window before, the series, realtime. */
export interface TrafficOverview extends AnalyticsWindow {
  totals: AnalyticsTotals;
  /** The same length of time right before `from`. */
  previous: AnalyticsTotals;
  series: SeriesPoint[];
  realtime: { activeVisitors: number; perMinute: RealtimeMinute[] };
}

/** What `breakdown` can group by, and what a `filter` can name. */
export type BreakdownDimension =
  | 'path'
  | 'page_type'
  | 'entry'
  | 'referrer'
  | 'channel'
  | 'campaign'
  | 'viewport'
  | 'browser'
  | 'os'
  | 'country'
  | 'locale';

/** `GET /v1/admin/analytics/breakdown`: one dimension, biggest first. */
export interface BreakdownResponse extends AnalyticsWindow {
  dim: BreakdownDimension;
  /** `views` of the visit-level dimensions are visits started, since they exist only there. */
  total: { views: number; visits: number };
  items: {
    value: string;
    views: number;
    visits: number;
    share: number;
    /** Only on the visit-level dimensions (entry, referrer, channel, campaign). */
    bounceRate?: number;
  }[];
}

/** `GET /v1/admin/analytics/events`: every event name seen in the window, and the blocked ones. */
export interface EventsResponse extends AnalyticsWindow {
  items: {
    name: string;
    count: number;
    previous: number;
    /** Blocked by an admin: not recorded any more. */
    blocked: boolean;
    series: { day: string; count: number }[];
  }[];
}

/** A value of an event's property or dimension, and how often it came up. */
export interface CountedValue {
  value: string;
  count: number;
}

/** What an event's `entity` resolved to; `url` is the public path without the locale. */
export interface EventEntity {
  id: string;
  kind: 'park' | 'attraction' | 'show' | 'restaurant';
  name: string;
  url: string;
  count: number;
}

/** `GET /v1/admin/analytics/events/:name`: one event taken apart. */
export interface EventDetailResponse extends AnalyticsWindow {
  name: string;
  total: number;
  blocked?: boolean;
  /** Every property key seen, with its top values; the rest of the values is `otherCount`. */
  props: { prop: string; values: CountedValue[]; otherCount?: number }[];
  /** The top combinations of property values, as they were sent together. */
  combinations: { props: Record<string, string>; count: number }[];
  byPageType: CountedValue[];
  byViewport: CountedValue[];
  entities: EventEntity[];
  series: { day: string; count: number }[];
}

/** A dimension of `crosstab`: `page_type`, `viewport`, `locale`, `day` or `prop:<key>`. */
export type CrosstabDimension = string;

/** `GET /v1/admin/analytics/events/:name/crosstab`: two dimensions of one event against each other. */
export interface CrosstabResponse extends AnalyticsWindow {
  name: string;
  row: CrosstabDimension;
  col: CrosstabDimension;
  /** Capped at 30 by count; the rest is folded into `other`. */
  rows: string[];
  cols: string[];
  cells: { row: string; col: string; count: number }[];
  total: number;
}

/** `GET /v1/admin/analytics/search`: the search fields compared, whatever fields were seen. */
export interface SearchOverview extends AnalyticsWindow {
  surfaces: {
    surface: string;
    opened: number;
    typed: number;
    resultClicks: number;
    browseClicks: number;
    noResults: number;
    viewAll: number;
    /** (resultClicks + browseClicks) / opened. */
    clickRate: number;
    /** noResults / typed. */
    noResultRate: number;
  }[];
  bySurfaceAndPageType: { surface: string; pageType: string; opened: number }[];
  bySurfaceAndViewport: { surface: string; viewport: string; opened: number }[];
  resultTypes: { surface: string; result: string; clicks: number }[];
  positions: { position: string; clicks: number }[];
  browseItems: { surface: string; item: string; clicks: number }[];
  series: { day: string; surface: string; opened: number }[];
}

/** A page of the SEO views: where it is, what kind it is, and how it did against the window before. */
export interface SeoLandingPage {
  path: string;
  pageType: string;
  visits: number;
  previous: number;
  /** `visits - previous`. */
  change: number;
  bounceRate: number;
  /** Which engines or assistants sent the visits, biggest first. */
  sources: { value: string; visits: number }[];
}

/** `GET /v1/admin/analytics/seo/landing-pages`: the pages visits began on, for one channel. */
export interface SeoLandingPagesResponse extends AnalyticsWindow {
  channel: string;
  items: SeoLandingPage[];
}

/** A page whose visits moved most. */
export interface SeoTrendPage {
  path: string;
  visits: number;
  previous: number;
  change: number;
}

/** `GET /v1/admin/analytics/seo/trends`: the pages that gained and lost most search visits. */
export interface SeoTrendsResponse extends AnalyticsWindow {
  channel: string;
  rising: SeoTrendPage[];
  falling: SeoTrendPage[];
}

/** `GET /v1/admin/analytics/seo/not-found`: addresses people asked for that do not exist. */
export interface SeoNotFoundResponse extends AnalyticsWindow {
  items: { path: string; views: number; referrers: { value: string; views: number }[] }[];
}

/** `GET /v1/admin/analytics/seo/uncovered`: parks or rides that no search visit reached. */
export interface SeoUncoveredResponse extends AnalyticsWindow {
  kind: 'park' | 'attraction';
  items: { id?: string; name: string; url: string }[];
}
