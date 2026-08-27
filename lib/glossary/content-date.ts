/**
 * When the glossary was last reviewed — the one date two consumers must agree on.
 *
 * It feeds `dateModified` on the `DefinedTerm`/`DefinedTermSet` JSON-LD **and** `<lastmod>` on the
 * 1,608 glossary URLs in the sitemap (268 terms × 6 locales). Those are the same claim made to the
 * same crawler in two places, so they read one constant rather than each holding a copy.
 *
 * It lives here rather than next to the schema component because `app/sitemap.ts` also needs it,
 * and a sitemap importing from `components/seo/` would be the wrong direction.
 *
 * **Why this one is hand-maintained.** The API carries no per-entity content timestamp —
 * `/v1/sitemap/attractions` answers `{url, slug}`, and the park payloads only date their live
 * readings (`queues[].lastUpdated`, `typicalWaits.generatedAt`) — so park and ride URLs get their
 * `<lastmod>` from an *observed* one: a daily crawl fingerprints the stable half of each page and
 * the day the fingerprint moves is the day the page changed
 * (`lib/seo/content-changes/fingerprint.ts`). Stamping those 44,000 URLs with today's date instead
 * would be accurate and useless, since one moving value everywhere is indistinguishable from a
 * build stamp and is how a sitemap gets its lastmod discounted wholesale.
 *
 * The glossary needs none of that machinery: it is prerendered from files in this repo, so the
 * date it was last reviewed is simply known, and one constant beats fingerprinting 268 terms to
 * rediscover it.
 *
 * Update it when terms are added, removed or rewritten. A stale date here is worse than none:
 * it tells a crawler not to come back for content that did change.
 */
export const GLOSSARY_CONTENT_DATE = '2026-03-17';
