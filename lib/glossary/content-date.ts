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
 * **Why the glossary gets a lastmod when almost nothing else does.** The API carries no per-entity
 * content timestamp — `/v1/sitemap/attractions` answers `{url, slug}`, and the park payloads only
 * date their live readings (`queues[].lastUpdated`, `typicalWaits.generatedAt`). Park and ride
 * pages are `force-dynamic` and genuinely differ every day, so stamping them with today's date
 * would be accurate but would put one moving value on ~44,000 URLs, which is indistinguishable
 * from a build stamp and is how a sitemap gets its lastmod discounted wholesale. The glossary is
 * the opposite case and the reason this is worth having: it is prerendered, it really has not
 * changed since this date, and saying so lets a crawler skip 1,608 static pages and spend the
 * budget on the ones that move.
 *
 * Update it when terms are added, removed or rewritten. A stale date here is worse than none:
 * it tells a crawler not to come back for content that did change.
 */
export const GLOSSARY_CONTENT_DATE = '2026-03-17';
