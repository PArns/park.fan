# park.fan frontend — documentation map

Every background page, one line each; a folder is one line here and lists its own pages in its
README. Coding sessions start at [CLAUDE.md](../CLAUDE.md), which routes a task to its rules and
to a section below. Backend contracts (what an API field means) live in the backend repo:
[docs/frontend/](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/README.md).

- [rules/](rules/README.md) — every standing rule in one line, grouped by area; read the section for your task first
- [code-index/](code-index/README.md) — every exported component, hook and helper with its doc comment (generated)

## Keeping the docs in shape

- **CLAUDE.md is indexed, not grown.** A new rule is a new file in `rules/` plus one line in
  [rules/README.md](rules/README.md) (or in CLAUDE.md if every change must follow it). New
  background goes into the page that owns the subject, or a new file plus one line here or in its
  folder's README.
- **One fact, one place.** A rule file owns its rule, a feature page owns the mechanism, the
  backend's `docs/frontend/*.md` owns each API contract. Everywhere else links.
- **One subject per page.** When a page starts covering a second subject, split it and index the parts.
- **No to-do lists.** Open work is a Linear issue (team PAR); a page may name a known limit with its issue id.

## Architecture

- [system-overview](architecture/system-overview.md) — Rendering model, data flow, park page load order wiring and key directories; start here for architecture
- [routing-and-urls](architecture/routing-and-urls.md) — URL scheme, park sub-page segments, API→frontend URL conversion, redirects, locale prefix, link prefetching
- [caching-strategy](architecture/caching-strategy.md) — How each route renders, Data Cache windows and tags, invalidation, ISR write cost, React Query caching
- [cdn-caching](architecture/cdn-caching.md) — Cloudflare and Vercel CDN: dashboard rules, CDN-Cache-Control windows per route, deploy purge, measuring
- [api-budget](architecture/api-budget.md) — Requests and payload bytes per page, what each field is read for, rejected merges; before adding a field

## Cost and performance

- [optimization](optimization/README.md) — Cost track overview: what the bill is made of, the cost model, open levers, measurement traps
- [decisions](optimization/decisions.md) — Decision log of cost changes since the 2026-09-01 baseline, one entry each with its measurement
- [compute-audit](optimization/compute-audit.md) — Active CPU and memory per origin request by route (2026-10-26) and why no code change pays

## API and backend

The frontend side of each API surface; the contract itself is linked from each page.

- [backend-integration](api/backend-integration.md) — How the frontend talks to the API: client and config, crowd-level display, revalidate webhook, favourites
- [calendar-status-closed](api/calendar-status-closed.md) — How the calendar renders UNKNOWN/CLOSED and how scheduleCoverage.to bounds published months
- [seasonal-attractions](api/seasonal-attractions.md) — Every surface that reads a ride's or show's season, and what it does with an out-of-season one
- [parks-without-wait-times](api/parks-without-wait-times.md) — Every surface for a park whose wait times cannot be read, and the data-nosnippet guard

## Features

- [admin](features/admin.md) — The /admin app: shape, UI kit, session auth and Turnstile, login, curated editors, field capture, ML pages
- [attraction-filter-panel](features/attraction-filter-panel.md) — Park page attraction filter panel: layout, phone sheet, pills, rider-height slider, filter composition
- [blog-cover-fallback](features/blog-cover-fallback.md) — BlogCoverFallback for coverless posts: every slot it renders in, `mark` placement, CSS-only, per-slug hue
- [blog-editor](features/blog-editor.md) — The admin blog editor: what it edits, save as draft PR, translate route and its env, known data-loss limits
- [compare](features/compare.md) — /compare: the ?parks= parameter, ambiguous slugs, noindex, picker and table
- [contribute](features/contribute.md) — Visitor photo contributions (/contribute): upload flow, Blob storage, moderation, hand-over into media
- [crowd-calendar](features/crowd-calendar.md) — Crowd calendar route: month URLs and window, redirects, grid, day dialog, best-days chapter, #calendar forward
- [glossary](features/glossary.md) — Glossary: files, URLs, adding a term and its checks, pages, SEO, ride-glossary link, 3-D player, blog use
- [header-navigation](features/header-navigation.md) — Header bar entries, the parks/guides/news/„Mehr"/favorites bands, open-close mechanics, the phone sheet
- [homepage-announcement](features/homepage-announcement.md) — The homepage announcement band with countdown: content/home/announce.<locale>.md, frontmatter, display window
- [homepage-hero](features/homepage-hero.md) — Homepage hero: glass cost over the pan, live counts, inline search, in-park block, placeholders, map, motion
- [how-park-fan-works](features/how-park-fan-works.md) — The guide page: localized URLs and redirects, demos and dated fixtures, motion, six content modules
- [maintenance-page](features/maintenance-page.md) — How an API outage becomes /maintenance (502/1033 digest, error boundary) and the 15 s recovery poll
- [media-database-writes](features/media-database-writes.md) — Writing media: /admin/media browser, session PRs, uploads, moves, unique roles, capture/blog/contribute paths
- [media-database](features/media-database.md) — Media database read side: @/lib/media modules, manifests, ?v= caching, /api/media, native-app R2 export
- [most-read](features/most-read.md) — Most read: page-view beacon, rankings, build snapshot, surfaces, leader badge, popular parks, admin view
- [new-posts-toast](features/new-posts-toast.md) — New-posts toast for returning visitors: when it asks, what counts as new, labels, layout, manual testing
- [og-images](features/og-images.md) — OG image route: which card a path gets, og-assets/, JPEG re-encode, cache windows, pnpm og:preview
- [park-compass](features/park-compass.md) — In-park compass (homepage, park page): when it may appear, dial, bar, list, heading, pocket return, data
- [park-map](features/park-map.md) — The Leaflet park map: map tab and blog widget mounting, markers, #map-show deep link, following the visitor
- [pwa-install](features/pwa-install.md) — Installing park.fan as an app: manifest, InstallAppButton modes, 30-day dismissal, no offline cache
- [ride-alerts](features/ride-alerts.md) — Ride alerts and show reminders, browser side: bells, subscribe flow, local mirror, /alerts, sw.js, timezone sync
- [site-analytics](features/site-analytics.md) — Our own cookieless counter: the client facade and beacon, page types, gates, outbound links, the admin Traffic, event and Search pages
- [site-search](features/site-search.md) — Post search (palette, /search, header panel, /blog and /news): index, matching, tabs, ranking, height ease
- [weather-day-chart](features/weather-day-chart.md) — Weather card day chart: warped time axis, linear fallbacks, DST index, 143 px axis row, ticks, labels, rain
- [trip-planner/](features/trip-planner/README.md) — Trip planner entry: file map, storage, park-local time, how /plan/day is read, index of the parts

## Design

- [design-system](design/design-system.md) — Index of the design docs: stack (Tailwind 4, oklch tokens, shadcn/ui, glass) and one page per subject

## Development

- [setup](development/setup.md) — Local setup, what pnpm build runs, every environment variable with default and reader, the four cron jobs
- [scripts](development/scripts.md) — Every pnpm script and unregistered script by purpose: build, gates, generators, checks, measurements, tests
- [conventions](development/conventions.md) — Where each project convention lives, the asChild trap, Prettier on Markdown, three.js scene checklist
- [datetime-handling](development/datetime-handling.md) — Park-timezone "today", date-only strings, UTC calendar hours and hourly predictions, where each helper is used
- [assets](development/assets.md) — Background photo source size and delivery loader, photo lookup helpers, the homepage announcement band
- [flags-and-debug](development/flags-and-debug.md) — Build-time NEXT_PUBLIC flags, ?sim= in-park and compass simulation, ?state= park-state scenarios
- [analytics](development/analytics.md) — Which system counts what, Umami billing, every event of both systems and its properties, tracker attributes, adding an event
- [deploys](development/deploys.md) — Debounced production deploys via deploy hook, deploying now, setup and checks, why the wait is in Actions
- [vercel-comment-sync](development/vercel-comment-sync.md) — Vercel preview comments mirrored onto the PR: webhook relay, setup, toggles, troubleshooting
- [impeccable](development/impeccable.md) — impeccable design anti-pattern detector (local and PR CI) and the /impeccable live annotation session

## Internationalization

- [internationalization](i18n/internationalization.md) — Locales and config, which message namespaces reach the client per route (with byte tables), language switching
- [translations](i18n/translations.md) — Adding UI strings, geo helpers, ICU plurals and durations, translation checks and crawler, troubleshooting

## SEO

- [analysis](seo/analysis.md) — SEO state of the site, open trade-offs, resolved incidents not to undo, checklist for a new page type
- [sitemaps](seo/sitemaps.md) — The four sitemaps, what is in and out, calendar month window, news sitemap, observed lastmod, IndexNow
- [crawl-budget](seo/crawl-budget.md) — What Googlebot spends requests on: 2026-09-24 Search Console baseline, wasted fetches and their fixes
- [semantic-html](seo/semantic-html.md) — Landmarks, headings, articles and dates per page type: the 2026-10-27 audit and a checklist
- [park-sub-pages](seo/park-sub-pages.md) — Average-wait-times and with-kids park pages: the new-URL rule, gates and census, segments, rendering, cost
- [blog-feeds](seo/blog-feeds.md) — The six RSS feeds: autodiscovery per route, what an item carries, why excerpts, WebSub ping
- [favicon](seo/favicon.md) — The generated icon set: sources, files, where declared, regenerating, caching and stable URLs
- [agent-readiness](seo/agent-readiness.md) — Robots AI policy, RSL licence, llms.txt, API catalog, skills, MCP and WebMCP: how each is built and checked
- [mcp-registry-listing](seo/mcp-registry-listing.md) — How to list the MCP server and API: MCP Registry server.json and DNS auth, awesome-mcp-servers, public-apis

## Product

- [personas-and-scenarios](product/personas-and-scenarios.md) — Six personas through a park visit vs. what ships, gap backlog G1–G9, landing-page pilot order
- [landing-pages](product/landing-pages.md) — Landing-page concept: three kinds, measurements, one primary action per page; the anatomy rule links here
- [attraction-metadata-sources](product/attraction-metadata-sources.md) — Ride metadata sources (height, indoor, intensity, accessibility): what is used, coverage, licences, open

## Writing and content

- [writing/](writing/README.md) — Writing rules start page: §0 strong vs weak tells, §0.1 humour and length floors, chapters per task, map
- [content/blog/README](../content/blog/README.md) — Blog authoring: files and slugs, frontmatter, ref: links, tags, widget fences, embeds, callouts, quotes
- [public/media/README](../public/media/README.md) — Media authoring contract: file layout, sidecar fields, roles, alsoRides, focus, credit, review, tags
- [BRAND](../BRAND.md) — Brand context for the blog skills: audience, positioning, competitors, scope; links into the writing rules
- [VOICE](../VOICE.md) — Voice settings for the blog skills: pronouns, headlines, fingerprint, readability; links into the rules

## Troubleshooting

- [common-issues](troubleshooting/common-issues.md) — Recurring dev problems: broken links, missing translations, CORS, park timezone, ARIA warnings, sim

## History

- [changelog](changelog.md) — internal changelog, one section per released version (written by `pnpm release:cut`)
- [changelog.d/](changelog.d/README.md) — where a pull request writes its changelog fragment, and the format
