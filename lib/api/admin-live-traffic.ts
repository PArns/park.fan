/**
 * What `GET /v1/admin/analytics/live` answers, read by `/admin/traffic/live` every five seconds.
 * The API serves it from per-minute counters in Redis that live about 35 minutes, so it is
 * aggregates only: no visitor, no visit, no timestamp of anybody's hit. The contract is the API's
 * (`docs/frontend/site-analytics.md` in the backend).
 *
 * `path`, `referrer` and `name` are strings visitors sent (validated by the API, but chosen by
 * whoever sent the hit), so the page renders them as text and never as markup.
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
  /** Views of the last five minutes by window width class. */
  devices: { viewport: string; views: number }[];
  /** The fifteen most frequent events of the last 30 minutes. */
  events: { name: string; count: number }[];
}
