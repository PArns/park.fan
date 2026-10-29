/**
 * What `GET /v1/admin/analytics/*` answers, read by `/admin/traffic`, its event, SEO and live pages
 * and `/admin/traffic/search`. The contract is the API's
 * (`docs/frontend/site-analytics.md` in the backend). Every read takes the window (`days`, or
 * `from` and `to`), an optional `locale` and any number of `filter=<dimension>:<value>`, and
 * echoes them together with the `interval` it used. Numbers are integers unless
 * a name ends in `Rate` or is `share`, which are 0..1 floats, or is `viewsPerVisit`. A duration is
 * whole seconds, `null` where there is nothing to average.
 *
 * Nothing here is a closed list: the API stores whatever event names, properties, page types and
 * search fields the site sent, so those are strings, and the words for the ones this build knows
 * live in `lib/admin/site-analytics.ts`.
 */

/** What every response echoes: UTC days, today included, the language and the filters. */
export interface AnalyticsWindow {
  from: string;
  to: string;
  /** The length of the window in days. */
  days: number;
  /** The step of the series, for the reports that have one; echoed by all of them. */
  interval: SeriesInterval;
  /** The language the figures are limited to, `null` for all. */
  locale: string | null;
  /** The filters that were applied, as `dimension:value`; absent when there were none. */
  filters?: string[];
  /**
   * The API keeps the hourly rows 90 to 97 days and the daily sums 400. A figure that no daily sum
   * can give (under a filter on a page, three filters, an hourly chart) reads the hourly rows, and
   * for older days it finds nothing. When one did, this is the first UTC day (`YYYY-MM-DD`) that
   * figure is complete from, and the response holds what there is. `null` when nothing was cut; an
   * older API sends none.
   */
  hourlyFrom?: string | null;
}

/**
 * The headline figures of a window. `viewsPerVisit` is a float, `bounceRate` a share. `visitors`
 * is a number without a filter and under one filter on country, device, browser, OS or channel
 * (the language is no filter); under any other filter, two filters included, it is `null`: the
 * daily visitor counts exist per language and per value of those five only. Under a filter on how
 * a visit began (entry page, referrer, channel) the page views, events and the figures worked out
 * from them are `null` too, and only the visits, the bounce rate, the average visit and, for a
 * channel, the visitors are left.
 */
export interface AnalyticsTotals {
  /** `null` under a filter on how a visit began: a page view carries no such thing. */
  pageviews: number | null;
  visits: number;
  visitors: number | null;
  /** `null` under a filter on how a visit began, as `pageviews`. */
  events: number | null;
  /** `null` under a filter on how a visit began, as `pageviews`. */
  viewsPerVisit: number | null;
  /** Visits that saw one page, over all visits: 1 minus the engaged ones. */
  bounceRate: number;
  /** Foreground seconds of a visit, averaged over the visits; `null` without any. */
  avgVisitSeconds: number | null;
  /** Foreground seconds a page view was open, averaged over the page views; `null` without any. */
  avgTimeOnPageSeconds: number | null;
}

/** The step of a series: the period one point stands for. `hour` is only for a window of two days. */
export type SeriesInterval = 'hour' | 'day' | 'week' | 'month';

/** One minute of the realtime counter. */
interface RealtimeMinute {
  minute: string;
  pageviews: number;
}

/**
 * One point of the series, for the period that starts at `day`: a `YYYY-MM-DD`, or for an hourly
 * series an ISO timestamp at the start of the hour (`2026-10-28T07:00:00Z`). Weeks start on a
 * Monday, months on the 1st, both in UTC. The first and the last period can be cut by the window,
 * which `partial` says.
 */
export interface SeriesPoint {
  day: string;
  partial?: boolean;
  /** `null` under a filter on how a visit began, as in {@link AnalyticsTotals}. */
  pageviews: number | null;
  visits: number;
  /**
   * `null` where {@link AnalyticsTotals} has none, and in an hourly series under any filter: the
   * hours are counted per language only.
   */
  visitors: number | null;
  events: number | null;
  viewsPerVisit: number | null;
  bounceRate: number;
  avgVisitSeconds: number | null;
  avgTimeOnPageSeconds: number | null;
}

/** One point of a count series: an event, or a search field. */
interface CountPoint {
  day: string;
  count: number;
  partial?: boolean;
}

/**
 * `GET /v1/admin/analytics/overview`: totals against the window before, the series, realtime.
 * `previous` is `null` when the window is longer than 180 days: there is nothing to compare with.
 */
export interface TrafficOverview extends AnalyticsWindow {
  totals: AnalyticsTotals;
  /** The same length of time right before `from`. */
  previous: AnalyticsTotals | null;
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
  | 'device'
  | 'browser'
  | 'os'
  | 'country'
  | 'locale'
  | 'browser_language'
  | 'exit';

/** What the `views` of a breakdown count: page views, visits that began, or visits that ended. */
export type BreakdownMeasure = 'views' | 'visits' | 'exits';

/**
 * `GET /v1/admin/analytics/breakdown`: one dimension, biggest first. `measure` says what the counts
 * are: page views for a page dimension, visits for a visit dimension and for any dimension under a
 * filter on how a visit began (then it lists where those visits entered), exits for `exit`.
 */
export interface BreakdownResponse extends AnalyticsWindow {
  dim: BreakdownDimension;
  measure: BreakdownMeasure;
  /** `views` of the visit-level dimensions are visits started, since they exist only there. */
  total: { views: number; visits: number };
  items: BreakdownItem[];
}

/**
 * One value of a breakdown. What it carries depends on the dimension: the visit-level ones (entry,
 * referrer, channel) have a bounce rate and an average visit duration, the page-level
 * ones an average time on the page, `path` also its exits, and the five that count visitors
 * (country, device, browser, OS, channel) their visitors.
 */
export interface BreakdownItem {
  value: string;
  views: number;
  visits: number;
  share: number;
  /**
   * The value's visitors over the window, summed over its days. Only on country, device, browser,
   * OS and channel, without a filter or under a filter on that same dimension.
   */
  visitors?: number;
  bounceRate?: number;
  avgVisitSeconds?: number | null;
  avgTimeOnPageSeconds?: number | null;
  /** Visits that ended on this page. Only on `path`. */
  exits?: number;
  /** `exits` over the page's views, 0..1. Only on `path`. */
  exitRate?: number;
}

/** `GET /v1/admin/analytics/events`: every event name seen in the window, and the blocked ones. */
export interface EventsResponse extends AnalyticsWindow {
  items: {
    name: string;
    count: number;
    /** The count of the window before; `null` when the window is longer than 180 days. */
    previous: number | null;
    /** Blocked by an admin: not recorded any more. */
    blocked: boolean;
    series: CountPoint[];
  }[];
}

/** A value of an event's property or dimension, and how often it came up. */
interface CountedValue {
  value: string;
  count: number;
}

/**
 * What an event's `entity` resolved to; `url` is the public path without the locale. An id that
 * resolves to nothing any more (a retired park, a deleted show) has `kind`, `name` and `url` all
 * `null`; only the id and the count remain.
 */
export interface EventEntity {
  id: string;
  kind: 'park' | 'attraction' | 'show' | 'restaurant' | null;
  name: string | null;
  url: string | null;
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
  byDevice: CountedValue[];
  entities: EventEntity[];
  series: CountPoint[];
}

/**
 * A dimension of a crosstab: for an event `page_type`, `device`, `locale`, `day` or
 * `prop:<key>`; for the traffic the page-level dimensions of a breakdown, and for visits also the
 * visit-level ones.
 */
type CrosstabDimension = string;

/**
 * `GET /v1/admin/analytics/events/:name/crosstab` and `GET /v1/admin/analytics/crosstab`: two
 * dimensions against each other. An event's answer names the event; the traffic's says whether it
 * counted page views or visits.
 */
export interface CrosstabResponse extends AnalyticsWindow {
  name?: string;
  metric?: 'pageviews' | 'visits';
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
  bySurfaceAndDevice: { surface: string; device: string; opened: number }[];
  resultTypes: { surface: string; result: string; clicks: number }[];
  positions: { position: string; clicks: number }[];
  browseItems: { surface: string; item: string; clicks: number }[];
  series: { day: string; surface: string; opened: number; partial?: boolean }[];
  /** Parks by results and suggestions opened, at most 20; absent from an older API. */
  topParks?: RankedEntity[];
  /** Rides by results and suggestions opened, at most 20; absent from an older API. */
  topRides?: RankedEntity[];
}

/** A planner count by one property's value; `none` for an event sent without it. */
interface PlannerCount {
  value: string;
  count: number;
}

/**
 * A park or ride a report ranks by the events that named it; `name` and `url` are `null` once it
 * is gone. A merged one counts for the one it was merged into.
 */
export interface RankedEntity {
  id: string;
  name: string | null;
  /** Frontend path without a locale. */
  url: string | null;
  count: number;
}

/**
 * `GET /v1/admin/analytics/planner`: the trip planner's funnel and steps over its events. A merged
 * park or ride is counted for the one it was merged into.
 */
export interface PlannerOverview extends AnalyticsWindow {
  funnel: {
    opened: number;
    /** Every day that got its first block, however it began. */
    started: number;
    optimized: number;
    /** `share_clicked` with target `trip_plan`. */
    shared: number;
    closedEmpty: number;
    /** Days begun in an opening of the panel. */
    startedInOpening: number;
    /**
     * Days begun with the panel shut, from a ride page's button. A day sent before the site named
     * the way in is in neither this nor `startedInOpening`.
     */
    startedPanelShut: number;
    /** startedInOpening / opened, at most 1. */
    startRate: number;
    /** optimized / started: optimisations per started day, not a share, so it can exceed 1. */
    optimizedPerStarted: number;
    /** shared / started: shares per started day, not a share, so it can exceed 1. */
    sharedPerStarted: number;
  };
  /** Every way in seen, the most opened first; `started` counts the days begun in such an opening. */
  sources: { source: string; opened: number; started: number; startRate: number }[];
  /** Openings that reached each wizard step. */
  wizardSteps: PlannerCount[];
  wizardFinished: number;
  wizardWithHeadliners: number;
  items: { action: 'added' | 'removed'; kind: string; source: string; count: number }[];
  /** `plan_optimized` by mode. */
  optimized: PlannerCount[];
  fitOpened: PlannerCount[];
  fitLevers: PlannerCount[];
  undo: PlannerCount[];
  dayCleared: number;
  sharedOpened: PlannerCount[];
  sharedAdopted: number;
  pushOn: number;
  byPageTypeAndDevice: { pageType: string; device: string; opened: number }[];
  series: { day: string; partial?: boolean; opened: number; started: number; optimized: number }[];
  /** Parks by days started, at most 20. */
  topParks: RankedEntity[];
  /** Rides by times added, at most 20. */
  topRides: RankedEntity[];
}

/** A page of the SEO views: where it is, what kind it is, and how it did against the window before. */
export interface SeoLandingPage {
  path: string;
  pageType: string;
  visits: number;
  /** The visits of the window before; `null` when the window is longer than 180 days. */
  previous: number | null;
  /** `visits - previous`; `null` without a previous window. */
  change: number | null;
  bounceRate: number;
  /** Average foreground seconds of a visit that began here; `null` without a measurement. */
  avgVisitSeconds?: number | null;
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
  avgVisitSeconds?: number | null;
}

/** `GET /v1/admin/analytics/seo/trends`: the pages that gained and lost most search visits. */
export interface SeoTrendsResponse extends AnalyticsWindow {
  channel: string;
  rising: SeoTrendPage[];
  falling: SeoTrendPage[];
}

/** `GET /v1/admin/analytics/seo/not-found`: addresses people asked for that do not exist. */
export interface SeoNotFoundResponse extends AnalyticsWindow {
  items: { path: string; views: number; referrers: { value: string; visits: number }[] }[];
}

/** A park or ride no search visit entered on. */
interface SeoUncoveredItem {
  id: string;
  kind: 'park' | 'attraction';
  name: string;
  /** A ride's park, by name. */
  park?: string;
  /** The public path without the locale. */
  url: string;
}

/**
 * `GET /v1/admin/analytics/seo/uncovered`: parks or rides that no search visit entered on, by
 * name. `items` is cut at the `limit` asked for (200 unless asked otherwise), so it can be shorter
 * than `uncovered`.
 */
export interface SeoUncoveredResponse extends AnalyticsWindow {
  kind: 'park' | 'attraction';
  /** Parks or rides open on the site. */
  total: number;
  /** How many of them no search visit entered on. */
  uncovered: number;
  items: SeoUncoveredItem[];
}

/**
 * `GET /v1/admin/analytics/live`, read by `/admin/traffic/live` every five seconds: the API's
 * per-minute counters in Redis, which live about 35 minutes, so aggregates only. It takes only
 * `locale` and echoes nothing. `path`, `referrer` and `name` are strings visitors sent, so the page
 * renders them as text.
 */

/** One minute of the live chart; `minute` is its start as an ISO timestamp in UTC. */
export interface LiveMinute {
  minute: string;
  pageviews: number;
  events: number;
  /** Distinct visitors in that minute. */
  visitors: number;
}

/** `GET /v1/admin/analytics/live`: who is on the site, what they read, where they came from. */
export interface LiveTraffic {
  /** When the API read its counters, ISO in UTC. */
  at: string;
  /** Distinct visitors over the last five minutes. */
  activeVisitors: number;
  /** The last 30 whole minutes and the current one, oldest first. */
  perMinute: LiveMinute[];
  /** The ten most viewed pages of the last five minutes. */
  pages: { path: string; pageType: string; views: number }[];
  /** Every country with views in the last five minutes, upper-case alpha-2, `ZZ` unknown. */
  countries: { country: string; views: number }[];
  /** Visits started in the last 30 minutes, by channel. */
  channels: { channel: string; visits: number }[];
  /** The ten referrers that started most visits in the last 30 minutes. */
  referrers: { referrer: string; visits: number }[];
  /** Views of the last five minutes by device class. */
  devices: { device: string; views: number }[];
  /** The fifteen most frequent events of the last 30 minutes. */
  events: { name: string; count: number }[];
}
