# Sitemap Strategy

park.fan uses **two sitemap entry points**, both referenced from `robots.txt`:

1. `/sitemap.xml` (`app/sitemap.ts`) — all core pages, every entry with the full hreflang alternate block.
2. `/sitemap-attractions.xml` (`app/sitemap-attractions.xml/route.ts`) — a **sitemap index** over six per-locale children, `/sitemap-attractions/<locale>.xml` (`app/sitemap-attractions/[locale]/route.ts`), each holding that locale's 7,101 attraction URLs as **lean `<loc>`-only entries**.

The URL of the index is the one submitted in Search Console, which is why the split kept it and changed only what it contains.

**Why it is an index and not one file.** It was one file, and two ceilings were closing in on it. 7,101 attractions × 6 locales is **42,606 URLs against a limit of 50,000** — room for 1,232 more attractions on a catalogue that went from ~5,800 to 7,101 in about a year, so the file was going to stop validating on its own schedule. And the 50 MB byte limit is what rules out per-entry hreflang: the alternate block is seven near-full URLs, which multiplies the file 6.9× to 49 MiB, 98 % of the limit. Split by locale each child is 1.16 MiB and holds 7,101 URLs, so neither ceiling is a deadline any more.

hreflang still stays out of the children: every attraction page already serves the complete alternate set from its `<head>`, which Google weighs the same, so 42 MB of XML would buy a second copy of a signal that is already there. Search Console also reports coverage per sitemap file, so the split turns one undiagnosable number into six comparable ones — expect the six children to appear as "Discovered" with coverage starting from zero for the first few weeks.

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
| `/{locale}/blog` + posts etc. (**blog-live locales only**)   | 0.4–0.7  | daily–monthly   | posts: `updatedAt`   |
| `/{locale}/search` (plain, no query)                         | 0.5      | monthly         | –                    |
| `/{locale}/{howto-segment}` (the guide, localized slug)      | 0.8      | monthly         | –                    |
| `/{locale}/{glossary-segment}` (index)                       | 0.5      | weekly          | –                    |

Every `/sitemap.xml` entry carries absolute `alternates.languages` (hreflang) for all 6 locales plus `x-default` (EN); the attraction children deliberately do not (see above).

**Blog fallback rule:** a post URL/alternate is only emitted for locales with a **real translation**. EN-fallback URLs (e.g. `/de/blog/<en-slug>`) serve duplicate EN content, canonicalize to the EN original, and are excluded from the sitemap and hreflang.

---

## What is NOT in the sitemaps (deliberate)

| Page                                      | Reason                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `/impressum`, `/datenschutz`              | **noindex** pages — listing them triggers Search Console errors                                     |
| Single-park city hubs                     | The city page 308s to its only park (thin-duplicate rule) — a redirecting URL doesn't belong        |
| Attraction variant slugs (e.g. `taron-2`) | noindex, canonical points to base slug — the attractions route mirrors the page's base-exists check |
| `/search?q=...`                           | noindex (duplicate content risk); only the plain `/search` is listed                                |
| Blog EN-fallback URLs                     | Canonicalize to EN original (see above)                                                             |

---

## Related

- [robots.ts](../../app/robots.ts) — allows `/api/og/` (OG images) explicitly; does **not** block `/_next/`
- [SEO Analysis](analysis.md)
- IndexNow cron (`app/api/cron/indexnow/route.ts`) submits the same URL set daily at 06:00 UTC
