# A `<lastmod>` is observed, never stamped (REQUIREMENT)

A park or ride URL's `<lastmod>` is the day its content was **seen** to change. The API has no
per-entity content timestamp, so a daily run (`/api/cron/content-changes`, 05:30 UTC) fingerprints
the stable half of every park and ride (`lib/seo/content-changes/`) and stamps today only where the
fingerprint moved. A path the detector has never seen gets no tag rather than a guess.

**The whole value is in what stays out of the hash.** A park page repaints every five minutes, so
`queues`, `status`, `crowdLevel`, `statistics`, `typicalWaits`, `bestVisitTimes`, `ropeDrop`,
`isHeadliner`, `isCurrentlyInSeason`, `weather`, `schedule` and `analytics` are excluded by hand
(`lib/seo/content-changes/fingerprint.ts`). Let one in and all 44,000 URLs change every morning: a
build stamp, and one identical value everywhere is what gets a sitemap's `lastmod` discounted,
taking the glossary's and the blog's honest dates down with it. In goes what a reader sees and what
stays put: name, land, height limits, the ride profile, curated park facts, media versions, blog
backlinks.

Three rules are load-bearing, each for a real hole:

1. **A park the API did not answer keeps its dates** (`retainUncovered`). Dropping it re-adds its
   rides the next day, and a re-add reads as a change: one timeout would be 82 false recrawl
   invitations.
2. **A `FINGERPRINT_VERSION` bump adopts the new hashes and keeps every date.** Editing the detector
   is not the catalogue changing.
3. **Which rides count comes from `getAttractionPaths()`**, the sitemap's own list, never from a
   roster re-derived from the park payload. The two once disagreed on seven rides, which were seven
   `<lastmod>` values for URLs no sitemap listed.

The same snapshot feeds IndexNow, which submits the paths that moved (Mondays still sweep everything,
so a detector that stops detecting cannot silently mute the route).

## Why

Google ignores `changefreq` and `priority`, so before the crawl the attraction sitemaps carried
42,756 URLs and no signal at all, and the main sitemap dated only the glossary and the blog.

## Check

`pnpm test:content-changes` pins the exclusions and the three rules, because a green build shows none
of it. Background: [sitemaps → `<lastmod>`](../seo/sitemaps.md#lastmod-observed-not-stamped).
