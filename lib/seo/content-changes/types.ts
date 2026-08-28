/**
 * The persisted answer to "when did this page's content last change?".
 *
 * Keys are the **locale-agnostic content paths** `lib/content-urls.ts` already
 * speaks in (`/parks/europe/germany/bruehl/phantasialand`,
 * `/parks/europe/germany/bruehl/phantasialand/taron`), so one entry serves all
 * six locale URLs of a page. The six locales of a park page differ in prose, not
 * in when the park changed.
 */
export interface ContentChangeEntry {
  /** Fingerprint of the page's *stable* content — see `lib/seo/content-changes/fingerprint.ts`. */
  hash: string;
  /**
   * `YYYY-MM-DD`, in UTC. Day granularity on purpose: the snapshot is rebuilt
   * once a day, so a timestamp would claim a precision the detector does not
   * have — and `<lastmod>` accepts a bare date.
   */
  changedAt: string;
}

export interface ContentChangeSnapshot {
  /**
   * `FINGERPRINT_VERSION` the entries were computed with. A bump makes the old
   * hashes incomparable, which is **not** the same as the content having
   * changed — see `diffSnapshot`.
   */
  version: number;
  /** When the crawl that produced this snapshot ran (ISO instant, for debugging). */
  generatedAt: string;
  entries: Record<string, ContentChangeEntry>;
  /**
   * Park path → `scheduleCoverage.to`: the last date the API holds a park-level OPERATING row for,
   * `null` when it holds none.
   *
   * It is not a fingerprint and deliberately does not travel through `diffSnapshot` — that function
   * has one careful job (deciding which dates move) and this is a value to carry, not to compare.
   * The cron merges it beside the diff, keeping the previous value for a park that did not answer,
   * the same rule `retainUncovered` applies to dates.
   *
   * Optional because a snapshot written before this shipped has none, and the sitemap that reads it
   * must then behave exactly as it did before rather than truncating the catalogue.
   */
  scheduleCoverage?: Record<string, string | null>;
}

/** Path → fingerprint, as one crawl observed the catalog. */
export type FingerprintMap = ReadonlyMap<string, string>;
