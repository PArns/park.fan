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

| URLs                                                         | Priority | changeFrequency | lastModified              |
| ------------------------------------------------------------ | -------- | --------------- | ------------------------- |
| `/{locale}` (home)                                           | 0.9      | weekly          | –                         |
| `/{locale}/parks` (overview hub)                             | 0.8      | weekly          | observed (catalog)        |
| `/{locale}/parks/{continent}` + `/{country}` hubs            | 0.6–0.7  | weekly          | observed (catalog)        |
| `/{locale}/parks/…/{city}` hubs (**only multi-park cities**) | 0.6      | weekly          | observed (catalog)        |
| `/{locale}/parks/{continent}/{country}/{city}/{park}`        | 1.0      | daily           | observed (content change) |
| `/{locale}/parks/…/{park}/{attraction}` (own sitemap)        | 0.6      | weekly          | observed (content change) |
| `/{locale}/{glossary-segment}/{term}`                        | 0.8      | monthly         | `GLOSSARY_CONTENT_DATE`   |
| `/{locale}/blog/{slug}` (**blog-live locales only**)         | 0.6      | monthly         | `updatedAt ?? date`       |
| `/{locale}/blog` + category/tag/author listings              | 0.4–0.7  | daily–weekly    | newest post in the list   |
| `/{locale}/search` (plain, no query)                         | 0.5      | monthly         | –                         |
| `/{locale}/{howto-segment}` (the guide, localized slug)      | 0.8      | monthly         | –                         |
| `/{locale}/{glossary-segment}` (index)                       | 0.5      | weekly          | `GLOSSARY_CONTENT_DATE`   |

The six URLs still marked `–` are `/`, `/search`, `/fancast`, `/contribute`, the guide and the
best-time hub, ×6 locales — 36 in total. They are code, not content: nothing writes down when they
last changed, and the only honest option would be a hand-maintained constant per page that would
be stale within two deploys. `GLOSSARY_CONTENT_DATE` earns its keep because the glossary really is
reviewed as a body of text; these are not.

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

## `<lastmod>`: observed, not stamped

Google **ignores `changefreq` and `priority`** and reads `<lastmod>` only where it is
"consistently and verifiably accurate". Until this existed the attraction children carried
42,756 URLs with none of the three doing anything, and the main sitemap dated 1,662 of its
3,480 — the glossary and the blog posts, which are files in this repo with a date on them.
Everything derived from the API had nothing.

The API is why: it carries **no per-entity content timestamp**. `/v1/sitemap/attractions`
answers `{url, slug}`, and a park payload dates only its live readings
(`analytics.occupancy.updatedAt`, `typicalWaits.dataTo`). So the date is **observed** instead:

1. `/api/cron/content-changes` runs daily at 05:30 UTC, fetches all 212 parks fresh
   (`lib/seo/content-changes/crawl.ts`) and fingerprints the **stable** half of every park and
   ride — name, land, height limits, ride profile, curated park facts, the photos and articles
   the page carries. Everything volatile is excluded by hand, and the exclusion list is the
   whole point: `queues`, `status`, `crowdLevel`, `statistics`, `typicalWaits`, `bestVisitTimes`,
   `ropeDrop`, `weather`, `schedule`, `analytics`. See
   [`fingerprint.ts`](../../lib/seo/content-changes/fingerprint.ts).
2. The run diffs against the stored snapshot and stamps today's date on the keys whose
   fingerprint moved. A date only ever moves forward, and only on a real difference.
3. The snapshot lives in Vercel Blob (`seo/content-changes.json`, local file in dev), because it
   has to survive both a deploy and an ISR regeneration.
4. Both sitemaps read it. A path the crawl has not seen — a ride added since the last run —
   gets **no** tag rather than a guess.

Measured on the first full run: **7,100 of 7,126** attraction URLs per locale carry a date
(42,600 of 42,756 across six), and the main sitemap goes from 1,662/3,480 to **3,444/3,480**.
The 26 attractions without one are in `/v1/sitemap/attractions` but not in their park's payload.

**Why not just stamp today.** A park page repaints every five minutes, so "today" would be
accurate on all 44,000 URLs every day — and a value that is identical everywhere carries nothing
to be accurate about. That is how a sitemap's `lastmod` gets discounted wholesale, and it would
take the glossary's and the blog's honest dates down with it.

Two failure modes are handled explicitly, because both would otherwise be invisible:

- **A park the API does not answer for** keeps the dates it already has (`retainUncovered`).
  Dropping it would re-add its rides tomorrow, and a re-add reads as a change — one five-second
  timeout would become 82 false recrawl invitations.
- **A change to the fingerprint itself** (`FINGERPRINT_VERSION`) makes the stored hashes
  incomparable, which is not the same as the catalog having changed. The diff then adopts the new
  hashes and keeps every date.

`pnpm test:content-changes` pins both, plus the blindness to every live field, since none of it
is visible from a green build.

At **build** time the snapshot may not be readable (no Blob token in the build environment). The
sitemaps then prerender without `lastmod` and pick it up on their next revalidation, within a day.

### IndexNow submits what moved

The same snapshot fixes the same problem one door down: `/api/cron/indexnow` used to hand
IndexNow all ~46,000 URLs every morning, which is the "everything changed" non-signal in
protocol form. It now submits the catalog paths whose date is within `RECENT_DAYS` (2), plus the
static high-value set and the blog surfaces, which are a few hundred URLs and not worth a
detector. Two fallbacks: an unreadable or empty snapshot submits everything, as before, and
Mondays are a full sweep — a fingerprint that silently stopped detecting anything would
otherwise mean this route pings nothing, forever. `?dry=1` builds the list and submits nothing,
which is the only way to see which URLs a run would pick.

---

## Related

- [robots.ts](../../app/robots.ts) — allows `/api/og/` (OG images) explicitly; does **not** block `/_next/`
- [SEO Analysis](analysis.md)
- IndexNow cron (`app/api/cron/indexnow/route.ts`) — daily at 06:00 UTC, changed URLs only (see above)
- Content-change crawl (`app/api/cron/content-changes/route.ts`) — daily at 05:30 UTC, writes the `lastmod` snapshot
