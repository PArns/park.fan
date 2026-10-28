import type {
  SearchBrowseItem,
  SearchResultKind,
  SearchSurface,
  SiteEventName,
  SitePageType,
} from '@/lib/analytics/site-analytics';

/**
 * What `GET /v1/admin/analytics/*` answers, read by `/admin/traffic` and `/admin/traffic/search`.
 * The contract is the API's (`docs/frontend/site-analytics.md` in the backend). Every response
 * echoes the window it covers; numbers are integers unless a name ends in `Rate` or is `share`,
 * which are 0..1 floats.
 */

/** The window every response echoes: UTC days, today included, and the language filter. */
export interface AnalyticsWindow {
  from: string;
  to: string;
  days: number;
  /** The language the figures are limited to, `null` for all. */
  locale: string | null;
}

/** The five headline figures of a window. `viewsPerVisit` is a float. */
export interface AnalyticsTotals {
  pageviews: number;
  visits: number;
  visitors: number;
  events: number;
  viewsPerVisit: number;
}

/** One minute of the realtime counter. */
export interface RealtimeMinute {
  minute: string;
  pageviews: number;
}

/** `GET /v1/admin/analytics/overview`: totals against the window before, the daily series, realtime. */
export interface TrafficOverview extends AnalyticsWindow {
  totals: AnalyticsTotals;
  /** The same length of time right before `from`. */
  previous: AnalyticsTotals;
  series: { day: string; pageviews: number; visits: number; visitors: number }[];
  realtime: { activeVisitors: number; perMinute: RealtimeMinute[] };
}

/** What `breakdown` can group by. */
export type BreakdownDimension =
  | 'path'
  | 'page_type'
  | 'entry'
  | 'referrer'
  | 'viewport'
  | 'browser'
  | 'os'
  | 'country'
  | 'locale';

/** `GET /v1/admin/analytics/breakdown`: one dimension, biggest first. */
export interface BreakdownResponse extends AnalyticsWindow {
  dim: BreakdownDimension;
  /** `views` of `entry` and `referrer` are visits started, since they exist only there. */
  total: { views: number; visits: number };
  items: { value: string; views: number; visits: number; share: number }[];
}

/** `GET /v1/admin/analytics/events`: every event of the schema, zeros included. */
export interface EventsResponse extends AnalyticsWindow {
  items: {
    name: SiteEventName;
    count: number;
    previous: number;
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
  kind: 'park' | 'attraction' | 'show';
  name: string;
  url: string;
  count: number;
}

/** `GET /v1/admin/analytics/events/:name`: one event taken apart. */
export interface EventDetailResponse extends AnalyticsWindow {
  name: SiteEventName;
  total: number;
  props: { prop: string; values: CountedValue[] }[];
  byPageType: CountedValue[];
  byViewport: CountedValue[];
  entities: EventEntity[];
  series: { day: string; count: number }[];
}

/** `GET /v1/admin/analytics/search`: the seven search surfaces compared. */
export interface SearchOverview extends AnalyticsWindow {
  surfaces: {
    surface: SearchSurface;
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
  bySurfaceAndPageType: { surface: SearchSurface; pageType: SitePageType; opened: number }[];
  bySurfaceAndViewport: {
    surface: SearchSurface;
    viewport: 'mobile' | 'tablet' | 'desktop';
    opened: number;
  }[];
  resultTypes: { surface: SearchSurface; result: SearchResultKind; clicks: number }[];
  positions: { position: string; clicks: number }[];
  browseItems: { surface: SearchSurface; item: SearchBrowseItem; clicks: number }[];
  series: { day: string; surface: SearchSurface; opened: number }[];
}
