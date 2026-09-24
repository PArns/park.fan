# Crawl budget: what Googlebot spends its requests on

Measured from the Search Console exports of 2026-09-24 (page indexing with four category
drilldowns, crawl stats for 2026-06-26…09-22) and from production probes on the same day. The
numbers are a baseline to compare the next export against. Analysis and tickets: PAR-369, PAR-495,
PAR-496, PAR-497, PAR-498, PAR-499; the PO's reading of the same data is M-7 in Linear
("Marktbeobachtung & Funde").

## Baseline (2026-09-24)

| Page indexing                            |  Pages |
| ---------------------------------------- | -----: |
| Indexed                                  | 25,999 |
| Discovered – currently not indexed       | 27,952 |
| Page with redirect                       | 17,189 |
| Crawled – currently not indexed          | 11,236 |
| Alternate page with proper canonical tag |  5,133 |
| Not found (404)                          |  4,606 |
| Blocked by robots.txt                    |  3,252 |
| Excluded by noindex                      |  2,531 |
| Blocked due to access forbidden (403)    |    399 |

Indexed pages fell for the first time on 2026-09-19 (27,311 → 25,999) while "Page with redirect"
rose by 1,272 in the same step, which is one calendar month across all parks (210 × 6).

Crawl stats, park.fan host, 225,088 requests in 90 days, all hosts "no problems":

| Response             |  Share | File type        |  Share |
| -------------------- | -----: | ---------------- | -----: |
| 200                  | 81.4 % | HTML             | 51.2 % |
| 301/308              |  8.2 % | JavaScript       | 19.5 % |
| 302/307              |  5.9 % | Other            | 15.5 % |
| 404                  |  4.1 % | Image            |  7.9 % |
| other 4xx (the 403s) |  0.4 % | Unknown (failed) |  4.5 % |
| 5xx                  | 0.01 % | CSS              |  1.5 % |

Requests per day went from 600–1,100 (July to mid-August) to 2,000–10,000 after the first fetch
of the calendar sitemap (26,518 on 2026-08-28). The average response time went from 150–250 ms to
360–540 ms over the same change.

## Reading the exports

- **Two file types are response codes in disguise.** "Unknown (failed requests)" (4.47 %) matches
  404 + other 4xx (4.46 %), and "Other file type" (15.45 %) is mostly the redirects (14.14 %), which
  carry no document. So about 27 % of Googlebot's _page_ fetches (HTML 51.2 % + redirects + 4xx)
  returned no content.
- **A drilldown can be filtered without saying so.** A "Discovered – currently not indexed" export
  whose metadata read "All known pages" held 655 URLs where the overview said 27,952. Its URLs were
  exactly the page types of `sitemap.xml` (parks, multi-park cities, hubs, glossary, blog) and no
  ride or calendar URL, so it was filtered to that sitemap. The unfiltered drilldown matched the
  overview. Check the chart total against the overview before reading the table.
- **The example table is a sample of at most 1,000 rows**, and "Discovered" rows show
  `1970-01-01` as last crawl: never fetched.

What the four drilldowns contained:

| Category                          | Sample                                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Discovered – not indexed (27,952) | 87 % ride pages, 10 % calendar months, 1.6 % parks; all six locales about equally, English included  |
| … filtered to `sitemap.xml`       | 655 of 5,557 never fetched, 433 of them park pages (`/en/…/parc-asterix`, `epcot`, `alton-towers` …) |
| Alternate with canonical (5,133)  | 737 prefilled `/contribute?type=…`, 263 current month `/2026/9` → hub; both intended                 |
| Duplicate without canonical (5)   | five English ride pages last crawled in June; all exist today                                        |
| Temporary redirect (crawl stats)  | 971 of 981 without a locale prefix — see below                                                       |

## Where crawl requests were wasted, and what answers each

1. **Unprefixed paths out of the RSC payload.** `Link` from `@/i18n/navigation` takes a
   locale-relative `href`, and the prop is serialized into `self.__next_f.push(…)` at the end of the
   document. A French park page carried 32 such strings and none in its anchors. Google requests
   them without `Accept-Language`; next-intl answered 307 → `/en/…`, and 305 of the 981 examples
   carried another locale's calendar or stats segment, so the 307 ended in a 404.
   `proxy.ts` now answers with a 308 where the target does not depend on the visitor
   (`lib/i18n/unprefixed-redirect.ts`, [routing](../architecture/routing-and-urls.md#locale-prefix)).
   The cause is still there: a server-rendered link list could compute `getPathname({ href, locale })`
   on the server and render the finished path, so the payload holds a URL that answers 200.
2. **Links that point at a redirect.** The park, ride, calendar and stats breadcrumbs linked the
   city, and 103 of 144 cities hold one park and 308 to it — every page of those parks, 4,338 of
   the 7,374 rides among them. The crumb is now left out where `cityHasOwnPage()` says no. A
   rendered page should not contain an `<a href>` or a BreadcrumbList `item` that answers 3xx.
3. **Sitemap entries the page cannot render.** `/v1/sitemap/attractions` listed every attraction
   row, while the ride page resolves a ride only from the park payload, which drops retired rides
   and deduplicates by name. Measured by fetching every park payload and diffing: 82 listed slugs
   404ed (492 URLs) — 70 retired (fixed in the backend query) and 12 name duplicates (PAR-498), 9
   of which also kept the working `-2` page out of the sitemap.
4. **A 404 for an outage.** Pages turned any failed API fetch into `notFound()`, which Cloudflare
   and ISR then cached. See "A negative cache may only hold a settled answer" in
   [caching-strategy](../architecture/caching-strategy.md).
5. **Calendar months that fell out of the window** keep answering 308, about 21,948 URLs plus 1,260
   at every month rollover. That one is a standing, accepted cost (PAR-368), not an error.

The 3,252 robots.txt blocks are the `/api/…` requests the pages make while Google renders them;
they are meant to stay blocked, and validating that category in Search Console fails by design.

## Why Googlebot sees slow responses although the shell is cached

The park and ride pages render a status-free shell and fetch live data on the client. The origin
sends `Cache-Control: private, no-store` (that is what `force-dynamic` produces), and the shared
caches read `CDN-Cache-Control` from `next.config.ts` instead: park 1 h, ride 24 h, calendar
month 7 days; the stats page is ISR with a day. Measured from a runner in Europe against the `fra1`
region: a Cloudflare HIT answers in 0.17–0.34 s, a MISS renders in 0.2–0.8 s to first byte.

Googlebot mostly crawls the long tail — 43k ride URLs, each fetched about every 42 hours — so most
of its requests are misses, and it crawls from the US. Next 16's options for caching the shell at
Vercel as well (Cache Components/PPR, or ISR with an empty `generateStaticParams`) each cost one
write per URL, which was measured and rejected (`docs/optimization/decisions.md`). What is left to
move the number is fewer URLs and less work per render:

- The HTML is large: park pages 0.82–0.99 MB uncompressed, the homepage about 1 MB, roughly half of
  it RSC payload. Googlebot reads the first 2 MB of a document.
- Six locales of every ride page are 42,606 sitemap URLs.

**Measuring against production:** the Cloudflare bypass parameter from the cloud-runner playbook is
part of the URL, so it is a cache key of its own and the first request is always a MISS. Request the
same URL twice and read the second response for cache behaviour; on a Cloudflare HIT the
`x-vercel-cache` value is the one frozen at the fill.
