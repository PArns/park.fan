# Sitemap Strategy

park.fan uses **two sitemaps**, both referenced from `robots.txt`:

1. `/sitemap.xml` (`app/sitemap.ts`) — all core pages, every entry with the full hreflang alternate block.
2. `/sitemap-attractions.xml` (`app/sitemap-attractions.xml/route.ts`) — ~35k attraction URLs (≈5.8k attractions × 6 locales) as **lean `<loc>`-only entries**: with per-entry alternates the file would approach the 50 MB limit, and hreflang in sitemaps is optional — the attraction pages emit the complete set in their `<head>`.

Hub + attraction pages were re-added in July 2026: SERP checks showed competitors ranking exactly these page types (queue-times/wartezeiten.app ride pages for "taron wartezeit", country overviews for "freizeitparks deutschland") while park.fan kept them out of the sitemap.

---

## What IS in the sitemaps

| URLs                                                         | Priority | changeFrequency | lastModified         |
| ------------------------------------------------------------ | -------- | --------------- | -------------------- |
| `/{locale}` (home)                                           | 0.9      | weekly          | –                    |
| `/{locale}/parks` (overview hub)                             | 0.8      | weekly          | –                    |
| `/{locale}/parks/{continent}` + `/{country}` hubs            | 0.6–0.7  | weekly          | –                    |
| `/{locale}/parks/…/{city}` hubs (**only multi-park cities**) | 0.6      | weekly          | –                    |
| `/{locale}/parks/{continent}/{country}/{city}/{park}`        | 1.0      | daily           | – (no API timestamp) |
| `/{locale}/parks/…/{park}/{attraction}` (own sitemap)        | 0.6      | weekly          | –                    |
| `/{locale}/{glossary-segment}/{term}`                        | 0.8      | monthly         | –                    |
| `/{locale}/blog` + posts + categories + tags + authors       | 0.4–0.7  | daily–monthly   | posts: `updatedAt`   |
| `/{locale}/search` (plain, no query)                         | 0.5      | monthly         | –                    |
| `/{locale}/howto`, `/{locale}/{glossary-segment}` (index)    | 0.4–0.5  | monthly/weekly  | –                    |

Every `/sitemap.xml` entry carries absolute `alternates.languages` (hreflang) for all 6 locales plus `x-default` (EN); the attractions sitemap deliberately does not (see above).

**Blog fallback rule:** a post URL/alternate is only emitted for locales with a **real translation**. EN-fallback URLs (e.g. `/de/blog/<en-slug>`) serve duplicate EN content, canonicalize to the EN original, and are excluded from the sitemap and hreflang.

---

## What is NOT in the sitemaps (deliberate)

| Page                                      | Reason                                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/impressum`, `/datenschutz`              | **noindex** pages — listing them triggers Search Console errors                                        |
| Single-park city hubs                     | The city page 308s to its only park (thin-duplicate rule) — a redirecting URL doesn't belong           |
| Attraction variant slugs (e.g. `taron-2`) | noindex, canonical points to base slug — the attractions route mirrors the page's base-exists check    |
| `/search?q=...`                           | noindex (duplicate content risk); only the plain `/search` is listed                                   |
| Blog EN-fallback URLs                     | Canonicalize to EN original (see above)                                                                |

---

## Related

- [robots.ts](../../app/robots.ts) — allows `/api/og/` (OG images) explicitly; does **not** block `/_next/`
- [SEO Analysis](analysis.md)
- IndexNow cron (`app/api/cron/indexnow/route.ts`) submits the same URL set daily at 06:00 UTC
