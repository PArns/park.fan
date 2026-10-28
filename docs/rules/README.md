# Standing rules

The one index of the rules every change in this repo follows. One file per rule: the rule, why it
exists, and, where one exists, the command that checks it. Open the file your task needs, not all of them. A new rule
is a new file here plus one line in this index.

## Every change

The seven rules every change follows are listed in [CLAUDE.md](../../CLAUDE.md#applies-to-every-change),
which every session reads; they are not repeated here.

## Architecture and payload

_Open when you work on page payload, caching, `revalidate`, streaming, CLS, INP, redirects, or translations reaching the client._

- [Park page loading priority](park-page-loading-priority.md) — best-days calendar and historical stats load last, behind `useLoadLast` (`lib/hooks/use-load-last.ts`)
- [A streamed section owes the page its height](a-streamed-section-owes-the-page-its-height.md) — a fallback reserves the real height per breakpoint; `pnpm measure:cls --late` against `pnpm build && pnpm start`
- [An interaction may not rebuild the grid in its own commit](an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md) — control state urgent, derived state via `useDeferredValue`; `pnpm measure:inp`
- [API budget per page](api-budget-per-page.md) — the live poll sends `LiveParkSnapshot`; four kinds of field, `?full=1`; `node scripts/measure-api-calls.mjs`
- [The page render is the bigger half of the API budget](the-page-render-is-the-bigger-half-of-the-api-budget-and-it.md) — a page that renders none of a thing ships none; `leanParkForCalendarShell`
- [A day in the park has a byte budget](a-day-in-the-park-has-a-byte-budget.md) — first wait ≤ 2.5 s Slow 4G / 7.0 s 3G, first visit ≤ 850 KB, lean poll ≤ 5 KB brotli
- [A `revalidate` at a call site is somebody else's page](a-revalidate-at-a-call-site-is-somebody-elses-page.md) — no numeric TTL at a call site; `CACHE_TTL`; `.next/prerender-manifest.json`
- [A redirect thrown from a render carries the layout as its body](a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md) — crawled redirects go in `proxy.ts`; `lib/parks/calendar-redirects.ts`
- [A renamed or moved route keeps its old URL alive](a-renamed-route-keeps-its-old-url.md) — a 308 in the same PR; `redirects()`, `rewrites()`, `proxy.ts`, `lib/utils/redirect-utils.ts`
- [An ISR route needs both halves](an-isr-route-needs-both-halves.md) — unread pages go `force-dynamic` + `CDN-Cache-Control`; `pnpm test:edge-windows`, `generateStaticParams`
- [A runtime file read ships the directory it is rooted at](a-runtime-file-read-ships-the-directory-it-is-rooted-at.md) — root reads at `og-assets/` or name the file; `pnpm measure:function-size`
- [A mount gate reads a store, never a timer](a-mount-gate-reads-a-store-never-a-timer.md) — `useSyncExternalStore`: `useMounted`, `useBrowserNow`, `useMinuteNow`, `useAfterLoad`
- [A server render arms no timer](a-server-render-arms-no-timer.md) — `createQueryClient()` (`lib/query-client.ts`), `withSeedTimeout` (`lib/api/seed-timeout.ts`)
- [A render redoes no work it did last time](a-render-redoes-no-work.md) — formatters from `lib/utils/intl-format.ts`, no `?? []` into `memo`, stores ignore no-ops
- [A subscription lives in the leaf that shows it](a-subscription-lives-in-the-leaf-that-shows-it.md) — read a context or query where it is drawn (`HeaderNearbyPark`, `RideAlertBellDialog`)
- [Work nobody can see is still work](work-nobody-can-see-is-still-work.md) — gate effects on visibility (`useMediaQuery`, observers); no endless animation under `backdrop-filter`
- [No `:has()` in a stylesheet a page loads](no-has-selector-in-the-stylesheet.md) — use `peer-*`, data attributes or call-site classes; `pnpm check:no-has`
- [A popup changes nothing the page inherits](a-popup-changes-nothing-the-page-inherits.md) — keep `PAGE_ROOT_STYLE` in `app/[locale]/layout.tsx`; `pnpm measure:inp`
- [Translations are routed, not bundled](translations-are-routed-not-bundled.md) — `<RouteMessages route="…">`; `pnpm generate:route-namespaces`, `pnpm check:client-messages`
- [The chrome is in the first HTML, in reading order](the-chrome-is-in-the-first-html-in-reading-order.md) — `Header` and `Footer` outside any `<Suspense>`; `pnpm check:semantic-html`

## Data and API

_Open when you work on wait times, seasons, closed rides, a park with no source, or an API route._

- [Parks we cannot read](parks-we-cannot-read.md) — never derive it; `noLiveWaitTimesReason()` / `hasReadableWaitTimes()` (`lib/utils/live-wait-times.ts`)
- [A ride out of season is closed, and is not one of the park's rides today](a-ride-out-of-season-is-closed-and-is-not-one-of-the-parks.md) — `isCurrentlyInSeason !== false`; SQL twin `attractionIsOutOfSeason()`
- [A ride that closed for good keeps its page](a-closed-ride-keeps-its-page.md) — `retiredKind === 'closed'`, `closedAttractions`, `lib/parks/closed-ride.ts`; `pnpm test:closed-ride`
- [An API route passes only slugs upstream, and says a failure is one](an-api-route-passes-only-slugs-upstream.md) — `isSlugPath()`, `cronUnauthorized`, non-200 without cache headers
- [A request no cache can share goes to the API directly](a-request-no-cache-can-share-goes-to-the-api-directly.md) — `browserApiUrl()`, `NEXT_PUBLIC_API_DIRECT`; `pnpm test:direct-api`

## Features

_Open when you work on the trip planner, the header menu, the admin, the weather chart, the guide page, the glossary, blog and news, most read, or location._

- [The planner's day ends when the park closes, and a headliner is not a residual](the-planners-day-ends-when-the-park-closes-and-a-headliner-is.md) — `closeMin`, `closeSlackMin`, `fits = start < closeMin`, `dropWeight`
- [A day that does not fit opens an assistant, not a footnote](a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md) — `needsFitHelp`, `PlannerFitAssistant`, `fitLevers`; `pnpm test:planner-fit`, `pnpm check:planner`
- [Weather day chart is built around the park's hours](weather-day-chart-is-built-around-the-parks-hours.md) — geometry in `lib/utils/weather-chart-axis.ts`; the chart owes the card 143 px
- [The admin holds no credential](the-admin-holds-no-credential.md) — httpOnly cookie, `app/api/admin/[...path]`, Turnstile action + hostname; `pnpm check:admin-login-form`
- [An admin list without an action is unfinished](an-admin-list-without-an-action-is-unfinished.md) — every problem card answers with a button; `useAdminQuery` invalidated so the card goes
- [The header menu is three kinds of content, and the split is about the link graph](the-header-menu-is-three-kinds-of-content-and-the-split-is.md) — `pnpm check:header-links`, `pnpm test:favorites-band`
- [The guide page teaches the real cards with the ride's real numbers](the-guide-page-teaches-the-real-cards-with-the-rides-real.md) — production components, `_fixtures.ts`; waits ×5 except `WALK_ON_WAIT_MINUTES`
- [Ride ↔ Glossary link](ride-and-glossary-link.md) — `rideProfile` term ids in ride order, never deduped or sorted; this app defines the ids
- [Blog manifest is split](blog-manifest-is-split.md) — import listings from `@/lib/blog/listing`, never `@/lib/blog`
- [News is set apart from the articles](news-is-set-apart-from-the-articles.md) — `isNewsCategory()`, `listArticles`, `NewsList`/`NewsRow`, `time: 'HH:MM'`; `pnpm test:news-split`
- [News posts live under `/news`](news-live-under-news.md) — URLs from `postPath` / `categoryPath` (`lib/blog/paths.ts`), `newsRedirect()` in `proxy.ts`; `pnpm test:news-redirects`
- [Most read is counted per language, by a key every language shares](most-read-is-counted-per-language.md) — `translationKey`/UUID + `locale`, `PageViewBeacon`; `pnpm test:most-read`
- [Location is asked for where a page needs it](location-is-asked-for-where-it-is-needed.md) — `useLocationNeeded()` on homepage and park pages only; `pnpm test:geolocation-permission`

## Design and layout

_Open when you work on layout, a component, a breakpoint, the header, a card, an animation, or three.js._

- [A chapter opens the same way everywhere](a-chapter-opens-the-same-way-everywhere.md) — `ChapterHeading` (`components/common/chapter-heading.tsx`); numbers from `extractToc(markdown)`
- [A landing page has one anatomy](a-landing-page-has-one-anatomy.md) — hub, tool or park audience page; one `<h1>`, `FAQPage` only beside `FaqList`; `pnpm check:landing-pages`
- [A client-only preference may not decide server-rendered markup](a-client-only-preference-may-not-decide-server-rendered-markup.md) — both units rendered, `html[data-temp-unit]` and CSS pick one
- [A cell is gated on its content, and a component that fills one may not return `null`](a-cell-is-gated-on-its-content-and-a-component-that-fills-one.md) — `ropeDropCardVariant()`; `pnpm test:typical-waits`
- [The header is 48 px](the-header-is-48-px.md) — `h-12` + `-mt-12` on three heroes; button scale; `@container` breakpoints; `BrandLockup`; `pnpm check:header-reach`
- [three.js animations](threejs-animations.md) — research the reference first, check every camera and both themes: `node scripts/render-coaster-elements.mjs`
- [The quietest weekday is the park's quiet end](the-quietest-weekday-is-the-parks-quiet-end.md) — `tierBuckets` on `avgCrowdScore`, `formatWeekdayList`; `pnpm test:park-stats-derive`
- [Blog spotlight cards](blog-spotlight-cards.md) — the subgrid row template sits on the card's own wrapper, never on one that also holds the heading
- [A blog card is a row on phones](a-blog-card-is-a-row-on-phones.md) — `BlogPostRow` / `data-park-card-row` below `sm`; `HERO_FLOW_INTO_PULL` < the hero's `pb-48`
- [Map tiles are CARTO, never OSM's own tile server](map-tiles-are-carto-not-osms-own-tile-server.md) — `cartoTileUrl()` (`lib/utils/carto-tile-url.ts`), credit OSM and CARTO
- [A keyboard shortcut waits for an unfocused page](a-keyboard-shortcut-waits-for-an-unfocused-page.md) — `nothingFocused()`, never Space, once per page; Escape belongs to focus
- [A fade is animated, never a cut](a-fade-is-animated-never-a-cut.md) — `starting:opacity-0` to appear, `invisible opacity-0` kept mounted to leave

## SEO and the machine-facing surface

_Open when you work on sitemaps, feeds, the favicon, robots and agents, analytics, or semantic markup._

- [The markup says what each part is](the-markup-says-what-each-part-is.md) — named `<nav>`s with list links, one `<h1>`, `<time datetime>`, no microdata; `pnpm check:semantic-html`
- [The favicon is generated from two sources, and it carries no wordmark](the-favicon-is-generated-from-two-sources-and-it-carries-no.md) — only `app/layout.tsx` declares `icons`; `pnpm check:icons`
- [Nothing here has a reader inside the site](nothing-here-has-a-reader-inside-the-site.md) — robots, `llms.txt`, `.well-known`, `/api/mcp`, WebMCP; `pnpm check:agent-ready`, `pnpm check:webmcp`
- [A `<lastmod>` is observed, never stamped](a-lastmod-is-observed-never-stamped.md) — `lib/seo/content-changes/`, volatile fields out of the hash; `pnpm test:content-changes`
- [A feed nobody links to is a file with a URL](a-feed-nobody-links-to-is-a-file-with-a-url.md) — every route passes `blogFeedAlternates(locale)`; the item carries the excerpt
- [A listing page is a path with its own canonical](a-listing-page-is-a-path-with-its-own-canonical.md) — `POSTS_PER_PAGE` (20), `<listing>/page/<n>`; `pnpm test:listing-pagination`
- [Umami event budget](umami-event-budget.md) — every property is billed as an event; nothing Umami already has or a sibling implies

## Content and media

_Open when you write a post, a news item or UI copy, or add an image._

- [A wait time is never typed into a post](a-wait-time-is-never-typed-into-a-post.md) — `ride-waits-widget` / `hourly-profile-widget`; no figure the widget renders in the prose
- [Park/Ride page ↔ blog link](parkride-page-and-blog-link.md) — derived from the post; `parkLinks` / `rideLinks` per post; the primer slot; `pnpm test:park-guide`
- [Media database](media-database.md) — `public/media/<collection>/`, the sidecar is the index; `@/lib/media/{hero,credit,attribution}` client-safe
- [No Creative Commons photos](no-creative-commons-photos.md) — own shoots, `/contribute`, approved press kits, Unsplash; `pnpm generate:media` fails on `cc-by*`
- [One photo can index two rides (`alsoRides`)](one-photo-can-index-two-rides-alsorides.md) — one file, the second slug in `alsoRides`, validated against the park
- [Card photos are two layers](card-photos-are-two-layers.md) — frame against the strip between the panels (`CardPhotoFrame`); `pnpm check:card-framing`
- [A news correction is shown, never silent](a-news-correction-is-shown-never-silent.md) — news only: a dated `> [!CORRECTION]` at the end, label `blog.correction`
- [A news update opens the post](a-news-update-opens-the-post.md) — `> [!UPDATE] YYYY-MM-DD` at the top, `blog.updateOn`, `NewsUpdateBadge`; no signature
- [`updatedAt` is for new content](updated-at-is-for-new-content.md) — new dates, parks, figures or a corrected fact; never a wording pass; `lastTouched`
- [A quote names its source, and a legal claim names its side](a-quote-names-its-source.md) — `> [!QUOTE]` with a source line (`BlogQuote`); legal claims attributed
- [„Werktags" is Monday to Saturday](werktags-is-monday-to-saturday.md) — „Mo–Fr" / „lun–ven" in labels (`formatWeekdayList`); `pnpm check:prose` (`werktag-meaning`)
- [A ride's figure comes from the RCDB](a-ride-figure-comes-from-the-rcdb.md) — height, length, drop, speed; where the park differs, both stand with their owners
