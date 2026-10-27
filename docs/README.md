# park.fan frontend — documentation map

Every page under `docs/`, one line each. Coding sessions start at [CLAUDE.md](../CLAUDE.md), which
routes a task to its rules and to the section below. Backend contracts (what an API field means)
live in the backend repo: [docs/frontend/](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/README.md).

## Start here

- [rules/](rules/README.md) — every standing rule in one line, grouped by area; read the section for your task first
- [writing/](writing/README.md) — how every reader-facing text is written; a table says which chapters a task needs
- [code-index/](code-index/README.md) — every exported component, hook and helper with its doc comment (generated)

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
- [parks-open-past-midnight](api/parks-open-past-midnight.md) — Planner on a day past midnight: unfoldedCloseHour, its four call sites, the grep, the tests

## Features

- [admin](features/admin.md) — The /admin app: shape, UI kit, session auth and Turnstile, login, curated editors, field capture, ML pages
- [attraction-filter-panel](features/attraction-filter-panel.md) — Park page attraction filter panel: layout, phone sheet, pills, rider-height slider, filter composition
- [blog-cover-fallback](features/blog-cover-fallback.md) — BlogCoverFallback for coverless posts: every slot it renders in, `mark` placement, CSS-only, per-slug hue
- [contribute](features/contribute.md) — Visitor photo contributions (/contribute): upload flow, Blob storage, moderation, hand-over into media
- [glossary](features/glossary.md) — Glossary: files, URLs, adding a term and its checks, pages, SEO, ride-glossary link, 3-D player, blog use
- [header-navigation](features/header-navigation.md) — Header bar entries, the parks/guides/news/„Mehr"/favorites bands, open-close mechanics, the phone sheet
- [homepage-hero](features/homepage-hero.md) — Homepage hero: glass cost over the pan, live counts, inline search, in-park block, placeholders, map, motion
- [how-park-fan-works](features/how-park-fan-works.md) — The guide page: localized URLs and redirects, demos and dated fixtures, motion, six content modules
- [media-database-writes](features/media-database-writes.md) — Writing media: /admin/media browser, session PRs, uploads, moves, unique roles, capture/blog/contribute paths
- [media-database](features/media-database.md) — Media database read side: @/lib/media modules, manifests, ?v= caching, /api/media, native-app R2 export
- [most-read](features/most-read.md) — Most read: page-view beacon, rankings, build snapshot, surfaces, leader badge, popular parks, admin view
- [new-posts-toast](features/new-posts-toast.md) — New-posts toast for returning visitors: when it asks, what counts as new, labels, layout, manual testing
- [park-compass](features/park-compass.md) — In-park compass (homepage, park page): when it may appear, dial, bar, list, heading, pocket return, data
- [site-search](features/site-search.md) — Post search (palette, /search, header panel, /blog and /news): index, matching, tabs, ranking, height ease
- [weather-day-chart](features/weather-day-chart.md) — Weather card day chart: warped time axis, linear fallbacks, DST index, 143 px axis row, ticks, labels, rain

### Trip planner

- [trip-planner](features/trip-planner/README.md) — Trip planner entry: file map, storage, park-local time, how /plan/day is read, index of the parts
- [checks](features/trip-planner/checks.md) — Planner tests and check:planner: command list, the hasTouch pass, openSheet and run hardening
- [day-grid](features/trip-planner/day-grid.md) — Planner day grid: axis vs growing canvas, opening/closing edges, early entry, lanes, what a block draws
- [drag-and-drop](features/trip-planner/drag-and-drop.md) — Dragging rides into the planner: payload, the drag chip, refused drops, empty-day guidance
- [leg-chip](features/trip-planner/leg-chip.md) — The chip between two planned blocks: verdict ladder, placement in the drawn gap, the 5-minute ride
- [optimizer](features/trip-planner/optimizer.md) — „Tag optimieren"/„Alle Headliner": objective, beam search, fit assistant, CTA, refusals, undo, the clock
- [panel](features/trip-planner/panel.md) — Planner panel: edge tab/header button, past-day question, page inset and container, photo layer, desktop foot
- [phone](features/trip-planner/phone.md) — Planner on a phone: planner-phone scale, 44/32 px targets, gestures, landscape row, bottom-sheet detents
- [planner-page](features/trip-planner/planner-page.md) — The /trip-planner page: article with live demos, „Parks auf Tage verteilen", shared-plan links
- [push-notifications](features/trip-planner/push-notifications.md) — Planner push switch: availability, plan-before-subscribe, topics, the armed record, trip sync
- [showtimes](features/trip-planner/showtimes.md) — Shows in the planner: scheduled vs projected, clip window, planned performances, show switch, show labels
- [two-day-view](features/trip-planner/two-day-view.md) — Two day columns in a wide planner panel: thresholds, per-column chrome and state, where it is stored
- [wait-figures](features/trip-planner/wait-figures.md) — Where a planned ride's wait comes from: quarter-hour slots, tiers and sources, accuracy, no-source parks
- [wizard](features/trip-planner/wizard.md) — Planner wizard: the four steps, its frame (photo band, rail, footer), the day card, „plan this park" CTA

## Design

- [design-system](design/design-system.md) — Index of the design docs: stack (Tailwind 4, oklch tokens, shadcn/ui, glass) and one page per subject
- [cards-and-heroes](design/cards-and-heroes.md) — Card pointer depth, park and blog cards as rows on phones, full-bleed heroes on phones, landing-page heads
- [chapter-headings](design/chapter-headings.md) — ChapterHeading on every surface: variants, numbering, streamed headings, phone sizes, the twMerge trap
- [header](design/header.md) — Header bar: 48 px and where it is written, controls, width budget, phone sheet, hero states, lockup
- [ride-page](design/ride-page.md) — Ride page: header card shared with the park page, chapter row, rope-drop stand-in, colour rank, history
- [tokens](design/tokens.md) — Colour tokens, crowd and status class faces, badges, glass constants, utility classes, dark-by-default theme
- [touch-targets](design/touch-targets.md) — 44 px phone tier of the button scale, PHONE_HIT_AREA pseudo-element, overlapping and sub-44 px targets

## Development

- [setup](development/setup.md) — Install and run locally, env defaults, what prebuild runs and which of its checks fail the build
- [scripts](development/scripts.md) — Every pnpm script and unregistered script by purpose: build, gates, generators, checks, measurements, tests
- [conventions](development/conventions.md) — Where each project convention lives, the asChild trap, Prettier on Markdown, three.js scene checklist
- [datetime-handling](development/datetime-handling.md) — Park-timezone "today", date-only strings, UTC calendar hours and hourly predictions, where each helper is used
- [assets](development/assets.md) — Background photo source size and delivery loader, photo lookup helpers, the homepage announcement band
- [flags-and-debug](development/flags-and-debug.md) — Build-time NEXT_PUBLIC flags, ?sim= in-park and compass simulation, ?state= park-state scenarios
- [analytics](development/analytics.md) — Umami billing, every event and its properties, tracker attributes, reading the dashboard, adding an event
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
- [featured-parks](seo/featured-parks.md) — Homepage and page-foot popular-park cards: counted parks first, editing the hand-picked fallback list
- [blog-feeds](seo/blog-feeds.md) — The six RSS feeds: autodiscovery per route, what an item carries, why excerpts, WebSub ping
- [favicon](seo/favicon.md) — The generated icon set: sources, files, where declared, regenerating, caching and stable URLs
- [agent-readiness](seo/agent-readiness.md) — Robots AI policy, RSL licence, llms.txt, API catalog, skills, MCP and WebMCP: how each is built and checked
- [mcp-registry-listing](seo/mcp-registry-listing.md) — How to list the MCP server and API: MCP Registry server.json and DNS auth, awesome-mcp-servers, public-apis

## Product

- [personas-and-scenarios](product/personas-and-scenarios.md) — Six personas through a park visit vs. what ships, gap backlog G1–G9, landing-page pilot order
- [landing-pages](product/landing-pages.md) — Landing-page concept: three kinds, measurements, one primary action per page; the anatomy rule links here
- [attraction-metadata-sources](product/attraction-metadata-sources.md) — Ride metadata sources (height, indoor, intensity, accessibility): what is used, coverage, licences, open

## Writing and content

- [writing](writing/README.md) — Writing rules start page: §0 strong vs weak tells, §0.1 humour and length floors, chapters per task, map
- [1-substance](writing/1-substance.md) — §1 Substance: significance, evidence and sources, verdicts, self-reference, empty sentences, gaps
- [2-20-check-patterns](writing/2-20-check-patterns.md) — §2.20 Every named check:prose pattern (#1–113) with threshold and locales; what only the critic sees
- [2-sentence-shape](writing/2-sentence-shape.md) — §2.1–2.19 Sentence shape: parallelism, triads, tails, closers, staccato, things that talk, database prose
- [3-vocabulary](writing/3-vocabulary.md) — §3 Vocabulary: AI word lists per language, the 23 house rules (§3.3), travel-guide copy (§3.4)
- [4-typography](writing/4-typography.md) — §4 Typography: em-dash ban, bold, headings and titles, lists and dates, quotes, plain-text fields
- [5-9-commits-and-tickets](writing/5-9-commits-and-tickets.md) — §5.9 How commit messages, PRs, Linear tickets and code comments are written
- [5-posts-and-news](writing/5-posts-and-news.md) — §5.0 news posts and §5.4 blog posts: titles, sourcing, excerpt, FAQ answers, park-guide chapter order
- [5-site-copy](writing/5-site-copy.md) — §5.1–5.8 UI strings and FAQ, alt and caption, meta templates, heading and dek, glossary, changelog
- [6-translation](writing/6-translation.md) — §6 German first: deriving the five locales, per-language typography, what stays identical, contractions
- [7-review](writing/7-review.md) — §7 pnpm check:prose (flags, errors vs warnings), baselines, review pass, agreement read, critic prompt
- [sources](writing/sources.md) — Studies, field guides and anti-slop rulesets the writing rules are built on, per section
- [content/blog/README](../content/blog/README.md) — Blog authoring: files and slugs, frontmatter, ref: links, tags, widget fences, embeds, callouts, quotes
- [public/media/README](../public/media/README.md) — Media authoring contract: file layout, sidecar fields, roles, alsoRides, focus, credit, review, tags
- [BRAND](../BRAND.md) — Brand context for the blog skills: audience, positioning, competitors, scope; links into the writing rules
- [VOICE](../VOICE.md) — Voice settings for the blog skills: pronouns, headlines, fingerprint, readability; links into the rules

## Troubleshooting

- [common-issues](troubleshooting/common-issues.md) — Recurring dev problems: broken links, missing translations, CORS, park timezone, ARIA warnings, sim

## History

- [changelog](changelog.md) — internal changelog, one section per released version (written by `pnpm release:cut`)
- [changelog.d/](changelog.d/README.md) — where a pull request writes its changelog fragment, and the format
