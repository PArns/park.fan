# SEO analysis: current state, trade-offs, decisions

What park.fan's pages tell a search engine today, the trade-offs left open on purpose, and the
resolved incidents whose fixes must not be undone. Open it before changing metadata, structured
data, robots or a URL scheme; the checklist at the end is for a new page type.

How the share cards are drawn and cached: [OG images](../features/og-images.md).

## Current state

| Area                      | State (verified against the code)                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metadata**              | `generateMetadata` on every page; base URL from `SITE_URL` (`i18n/config.ts`)                                                                                                                                                                                                                                                                                                                               |
| **Canonical URLs**        | Absolute, locale-specific, query parameters stripped; numbered same-name ride slugs and blog EN fallbacks canonicalize to their originals                                                                                                                                                                                                                                                                   |
| **hreflang / alternates** | Absolute URLs plus `x-default` (`generateAlternateLanguages`); blog posts and tags emit only locales that have the page                                                                                                                                                                                                                                                                                     |
| **Open Graph / Twitter**  | Complete, `summary_large_image`; 1200×630 JPEG cards from `app/api/og/[...path]/route.tsx` (the legacy `og.png` name is still answered)                                                                                                                                                                                                                                                                     |
| **Structured data**       | `components/seo/structured-data.tsx`: Organization, WebSite + SearchAction, SiteNavigationElement, AmusementPark (with `containsPlace` rides, restaurants, opening hours and current waits as `Observation`s), TouristAttraction, BreadcrumbList, FAQPage, ItemList (geo hubs), Dataset (calendar, average wait times), BlogPosting/NewsArticle, DefinedTerm(Set), Article (hubs), WebApplication (planner) |
| **Semantic HTML**         | Landmarks, headings, articles and dates per [semantic HTML](semantic-html.md); `pnpm check:semantic-html`                                                                                                                                                                                                                                                                                                   |
| **Sitemaps**              | Four entry points (main, attractions, calendar months, Google News) with observed `<lastmod>`; see [sitemaps](sitemaps.md)                                                                                                                                                                                                                                                                                  |
| **robots.txt**            | `app/robots.txt/route.ts`: `Allow: /api/og/`, `Disallow: /api/` and `/admin`; `/_next/` deliberately not blocked (Google renders with JS and CSS); AI crawler policy in [agent readiness](agent-readiness.md)                                                                                                                                                                                               |
| **noindex**               | Legal pages, `/maintenance`, `/ui`, `/search`, `/compare`, `/favorites`, `/alerts`, `/trip-planner/shared`, prefilled `/contribute?type=…` and `/contribute/thanks`, numbered same-name ride slugs, tags under `TAG_INDEX_MIN_POSTS` (3), admin                                                                                                                                                             |
| **404**                   | Localized `app/[locale]/not-found.tsx` inside the site chrome; `app/not-found.tsx` for non-locale paths                                                                                                                                                                                                                                                                                                     |
| **Icons / manifest**      | Generated by `pnpm generate:icons`, declared only in `app/layout.tsx`; see [favicon](favicon.md)                                                                                                                                                                                                                                                                                                            |
| **Feeds / IndexNow**      | RSS per locale with a WebSub hub ([blog feeds](blog-feeds.md)); IndexNow cron daily 06:00 UTC sends the URLs whose observed `<lastmod>` moved, a full sweep on Mondays ([sitemaps](sitemaps.md#indexnow-submits-what-moved))                                                                                                                                                                                |
| **Rendering**             | Names, descriptions, FAQs and JSON-LD are server-rendered; live values load on the client. The park page's ride list is partly deferred, see below                                                                                                                                                                                                                                                          |

## Accepted trade-offs

### The park page's first HTML holds the first themed area, not every ride

The attractions tab renders the same cards before and after hydration. The first HTML holds the
rope-drop strip, the headliner section and the first themed area (about 14 of Europa-Park's 120
rides, each with link, wait and status); the areas below are `LazyMount` reservations
(`components/parks/lazy-mount.tsx`, `rootMargin: 1200px`) that mount with JavaScript. A crawler
that renders reads as far as its viewport reaches. The **full** ride list stays machine-readable
either way through `containsPlace` in the park's JSON-LD, which is in the first HTML.

No server-only list of every ride sits in front of the grid: one in a different shape from the grid
that replaced it at mount cost 3,145–24,919 px of height difference on the five park pages
Cloudflare scored "Poor" for CLS (1.0458 on Lotte World Adventure at y=3000)
([a streamed section owes the page its height](../rules/a-streamed-section-owes-the-page-its-height.md)).

**Crawled wait values are up to a day old.** The structure fetch is data-cached for a day
(`PARK_REVALIDATE` in `lib/api/parks.ts`); the "as of" row above the ride list
(`components/parks/live-data-freshness.tsx`) says how old the numbers are, before and after the
first poll. A shorter TTL would bring back the data-cache write volume
([caching strategy](../architecture/caching-strategy.md)); the lever for fresher crawled values is
the backend's `revalidateTag('parks')` webhook (open work: PAR-1103). The best-days text and the
least-crowded FAQ seed from the data-cached calendar (`getBestDaysCalendarSeed`, timeout-guarded so
a cold fill never blocks TTFB).

### `error.tsx` is a soft 200

A client error boundary cannot export metadata. The failing route itself returns HTTP 500, so the
impact is small. `/maintenance` is noindex and recovers by a 15 s health poll
(`components/maintenance-page.tsx`).

### A backend re-slug 404s indexed URLs

The July 2026 umlaut transliteration (`bruhl` → `bruehl`) 404ed every indexed Phantasialand and
Legoland Deutschland URL until redirects existed; the mechanisms are in
[routing and URLs](../architecture/routing-and-urls.md). **After any backend slug change:** diff the
Search Console 404 export against `/v1/discovery/geo`, add the redirects, then request indexing
for the top pages. hreflang is correct site-wide; a language swap on google.de only works while
the localized URLs resolve.

## Resolved, and kept resolved

Each of these was a real incident. The fix lives in code; the reason is here so nobody undoes it.

### A renamed park must revalidate the `geo` tag

Nothing used to revalidate `geo`, so the sitemaps listed 546 redirecting ride URLs for three
renamed parks for days, and IndexNow submitted them. The chain is Cloudflare (24 h + 48 h SWR on
the API) → Next Data Cache (24 h) → the sitemap's own ISR entry. The backend's
`ParkRenameService.handlePathChange` now POSTs `/api/revalidate` with `geo`, `parks` and
`attractions`.

### Same-name ride rows and numbered slugs

The park payload deduplicates attractions by **name**, so a park with two rows named "Alice in
Wonderland" serves one of `alice-in-wonderland` / `alice-in-wonderland-2`; a sitemap listing the
other is a 404 (about 400 across six locales before the fix). The backend's
`/v1/sitemap/attractions` lists per name exactly the row the payload serves, and
`getAttractionPaths` does not filter. The ride page marks a numbered slug noindex only when the
base slug carries the **same name**: "Main Train 2", "Anaconda 2" and Cedar Point's
`midnight-2` are different rides. Merging the rows upstream is not possible: on 2026-09-26 none
of 47 pairs was auto-mergeable, all being two ids from one source.

### A JSON-LD reference into another `<script>` carries its `@type`

A consumer that reads one block at a time sees `{"@id": …}` from a sibling script as an untyped
object. Search Console rejected the calendar `Dataset`'s `spatialCoverage` for that reason; six
more references had the same shape. Inside one `@graph`, `@id` alone is enough.
`spatialCoverage` is now a plain `{"@type": "Place", name, url, geo}` **without an `@id`**:
Google's Dataset parser rejects subtypes of `Place` (`AmusementPark`, `Country`), and with the
park's `@id` it would merge into the `AmusementPark` stub of `ParkSubPageStructuredData` again.

### No `Event` from the show list

A show is not an `Event`: Search Console flagged missing `offers`, `performer` and `endDate` on up
to 123 items, and the data has none of the three (shows carry only `startTime`). `price: 0` would
call a show free that needs a park ticket, and an event must be bookable on its own. An honest
`Event` would be a `ParkSeason` with
`separateTicket` (a Halloween night sold on its own ticket): it has dates, `priceFrom`,
`priceCurrency` and a `url`.

### The byline Google reads is the resolved author

`BlogPosting.author` runs through `resolveAuthor` like the visible page, links the on-site
profile (`/{locale}/blog/authors/{key}`) and puts the personal site in `sameAs`, never the
registry key (`"patrick"`).

### The trip planner gets links that carry intent

Beyond header, burger and footer, `ParkPlannerLink` sits in the header of every park page and
calendar with the **park name in the anchor** ("Tag im Phantasialand
planen"), and `/llms.txt` lists the planner. Deliberately not added: a `SoftwareApplication`
node (no rich result without ratings) and a stamped `lastModified`.

## Checklist for a new page type

- `generateMetadata` with canonical and hreflang (`SITE_URL`, `generateAlternateLanguages`), an
  OG image, sensible robots.
- A noindex page stays out of `app/sitemap.ts`; a sitemap entry never answers 3xx or 404.
- Reachable through server-rendered internal links; no `<a href>` or BreadcrumbList `item` that
  answers 3xx ([crawl budget](crawl-budget.md)).
- Structured data passes the Rich Results Test, describes only what the page renders
  (`FAQPage` only beside a rendered `FaqList`), and a cross-`<script>` reference carries `@type`.
- Titles under 60 characters (`MAX_TITLE_LENGTH`), descriptions about 150–160 (`seo.*` in
  `messages/*.json`). Templated titles go through `fitWithin(MAX_TITLE_LENGTH, full, short)`
  (`lib/utils/metadata.ts`) with a `titleTemplateShort` fallback key.
- Don't block crawlable assets in `app/robots.txt/route.ts` (`/api/og/`, `/_next/`).
- The markup rules: [the markup says what each part is](../rules/the-markup-says-what-each-part-is.md).
