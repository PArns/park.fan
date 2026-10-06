/**
 * When the glossary was last reviewed: `dateModified` in its JSON-LD and `<lastmod>` on its
 * sitemap URLs, one claim in two places, so one constant. Hand-maintained because the glossary is
 * prerendered from files in this repo, unlike park and ride pages, whose `<lastmod>` is observed
 * (`lib/seo/content-changes/fingerprint.ts`). A stale date tells a crawler not to come back for
 * content that did change, so `pnpm check:glossary-content-date` fails when
 * `GLOSSARY_CONTENT_HASH` moves without it. Bump both, with the date the content changed.
 */
export const GLOSSARY_CONTENT_DATE = '2026-10-03';

/**
 * SHA-256 (16 hex chars) over the glossary's reader-visible content: term ids, categories, player
 * elements, all six locales' slugs, and every name, definition, related id and alias. It hashes
 * values, not their spelling, so a quote-style pass does not move it.
 * `scripts/check-glossary-content-date.mjs` prints the new value when it fails.
 */
export const GLOSSARY_CONTENT_HASH = '33a87233c05fb2d1';
