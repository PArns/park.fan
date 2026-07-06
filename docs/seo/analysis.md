# park.fan SEO Analysis

As of June 2026 (full-code review). Earlier February-2026 findings that are done are folded into the table below.

---

## Current State (verified against code)

| Area                      | Status                                                                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metadata**              | `generateMetadata` on all pages (Home, Parks, Geo hubs, Park, Attraction, Search, Blog ×5, Glossary ×2, HowTo, Legal); base URL from `SITE_URL` (`i18n/config.ts`)                                                       |
| **Canonical URLs**        | Absolute, locale-specific, query params stripped; attraction variant slugs + blog EN-fallbacks canonicalize to their originals                                                                                           |
| **hreflang / alternates** | Absolute URLs + `x-default` everywhere; blog posts emit only locales with real translations                                                                                                                              |
| **Open Graph / Twitter**  | Complete incl. images (1200×630 via `/api/og/`), `summary_large_image`                                                                                                                                                   |
| **Structured Data**       | Organization, WebSite (+SearchAction), ThemePark, TouristAttraction, BreadcrumbList, FAQPage (Home/Park/Attraction), Event (Shows), ItemList (hubs), BlogPosting, DefinedTermSet/DefinedTerm (Glossary), Article (HowTo) |
| **Sitemap**               | Single `app/sitemap.ts` — see [sitemaps.md](sitemaps.md); noindex pages excluded                                                                                                                                         |
| **robots.txt**            | `Allow: /api/og/` (OG images crawlable), `Disallow: /api/`; `/_next/` intentionally **not** blocked (Google needs JS/CSS for rendering)                                                                                  |
| **noindex**               | Legal pages, `/maintenance`, `/ui`, search-with-query, attraction variant slugs, admin (meta robots)                                                                                                                     |
| **404**                   | Localized `app/[locale]/not-found.tsx` inside the site chrome (header/footer/internal links); root `app/not-found.tsx` covers non-locale paths                                                                           |
| **Icons / Manifest**      | `app/favicon.ico` + `app/icon.svg` (convention), 180×180 `/apple-touch-icon.png`, manifest with real 192/512 PNGs                                                                                                        |
| **Feeds / IndexNow**      | RSS per locale (`/blog/feed.xml`, linked via `alternates.types`), IndexNow cron daily 06:00 UTC (canonical URLs only)                                                                                                    |
| **Rendering**             | All SEO-critical content (names, descriptions, FAQs, JSON-LD) server-rendered; live data client-loaded                                                                                                                   |

---

## Known Trade-offs / Open Items

0. **Backend re-slugs kill indexed URLs (July 2026 incident)** — the API's umlaut transliteration change (`bruhl` → `bruehl`, `gunzburg` → `guenzburg`) 404ed every indexed Phantasialand/Legoland-Deutschland URL; google.de stopped showing German pages and traffic skewed US. The GSC coverage export (2026-07-06) showed **2,388 known 404s**: ~38 % cross-locale glossary slugs (legacy next-intl auto-alternates), ~25 % stale `_next/static` deploy chunks (harmless, ignore), ~19 % `/v1/*` (already redirecting), the rest relocated cities / renamed parks / the pre-`/parks` URL scheme. Fixed: `findRelocatedParkRedirect` 308s park/attraction URLs whose park slug exists under different geo segments (runs only after an API miss, duplicate slugs disambiguated by continent), `findTermByAnySlug` translates foreign-locale glossary slugs, plus static 301s in `next.config.ts` (rules 6–10). The GSC "Duplicate, Google chose different canonical" report (135 pages) is ~95 % EN water-slide attraction pages — NOT a de→en language problem. **After any future backend slug change:** diff the GSC 404 export against `/v1/discovery/geo`, add redirects, then GSC URL inspection → "Request indexing" on the top pages. hreflang itself is correct site-wide — language swaps on google.de only work while the localized URLs actually resolve. Open backend bug: `universal-studios-hollywood` exists under both `bull-creek` and `los-angeles` in the geo structure (duplicate sitemap entries).
2. **Hub + attraction pages not in sitemap** — deliberate crawl-budget decision; they stay indexable via internal links. Revisit if attraction long-tail traffic matters more.
3. **`error.tsx` is a soft-200 for non-maintenance errors** — client error boundaries can't export metadata; the failing route itself returns HTTP 500, so impact is minimal.
4. **Maintenance flow** — `/maintenance` is noindex and auto-recovers via a 15 s health poll (`components/maintenance-page.tsx`). Crawlers hitting a failing route during an outage get HTTP 500 (retry-later semantics).
5. **Blog pagination** — not yet needed (`BLOG_POSTS_PER_PAGE`); when added, use path-based `/blog/page/[n]`, not query params.

---

## Quick Checklist After Major Changes

- [ ] New page types: `generateMetadata` with canonical + hreflang (use `SITE_URL` + `generateAlternateLanguages`), OG image, sensible robots.
- [ ] noindex pages must NOT be added to `app/sitemap.ts`.
- [ ] New locale-prefixed routes reachable via internal links (header/footer/breadcrumbs).
- [ ] Structured data passes the Google Rich Results Test.
- [ ] Titles < ~60 chars, descriptions ~150–160 chars (see `seo.*` in `messages/*.json`).
- [ ] Don't block crawlable assets in `app/robots.ts` (especially `/api/og/`, `/_next/`).

---

## Related

- [Sitemaps](sitemaps.md)
- [Featured Parks](featured-parks.md)
- [SEO Roadmap](seo-roadmap.md)
- [Internationalization](../i18n/internationalization.md)
