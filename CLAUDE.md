# park.fan Frontend

Theme park wait times and statistics frontend for **[api.park.fan](https://api.park.fan)**.
**Technology Stack:** Next.js 16 (App Router), React 19, TypeScript.
**Routing:** This project uses **`proxy.ts`** for routing and i18n middleware, **not** a standard `middleware.ts`.
Multilingual (EN/DE/NL/FR/ES/IT), Server Components by default. All detailed documentation lives in **`docs/`** - start at **[docs/README.md](docs/README.md)**.

## How to read this file

This file is an **index**. It carries the facts that apply to every task and one line per standing
rule; the rules themselves live in `docs/rules/` and the measurements behind them in `docs/`.
**Open only what your task needs** — the routing table below says which page that is. Reading all of
it costs more than it returns: it was one 118 KB file, read in full before every change, and almost
no change needs more than one of its rules.

**This file is indexed, not grown (REQUIREMENT).** A new rule, a new measurement or a new piece of
background goes into the page that owns the subject — an existing one under `docs/rules/` or `docs/`,
or a **new file** when no page owns it yet — and this file gets **one line** pointing at it. Never
append the prose here. A paragraph added to this file is paid for by every session on every task,
whether or not it is about the thing that session is changing; a paragraph in a linked page is paid
for by the sessions that need it. The same rule governs those pages: once a page stops being about
one subject, split it and index the parts rather than letting it grow. An entry here carries the
rule and the identifiers needed to grep for it and nothing else — if it does not fit in two or
three lines, the rest belongs in the page.

| Working on …                                                                          | Open                                                                 |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| page payload, caching, `revalidate`, streaming, CLS, translations reaching the client | [architecture rules](docs/rules/README.md#architecture-and-payload)  |
| wait times, seasons, a park with no source                                            | [data and API rules](docs/rules/README.md#data-and-api)              |
| trip planner, header menu, admin, weather chart, guide page, glossary, blog manifest  | [feature rules](docs/rules/README.md#features)                       |
| layout, a component, a breakpoint, the header, a card, three.js                       | [design rules](docs/rules/README.md#design-and-layout)               |
| sitemaps, feeds, favicon, robots and agents, analytics                                | [SEO rules](docs/rules/README.md#seo-and-the-machine-facing-surface) |
| a blog post, UI strings, images, captions                                             | [content and media rules](docs/rules/README.md#content-and-media)    |

## Applies to every change

- **[Reuse existing components](docs/rules/reuse-existing-components.md) (REQUIREMENT):** always reuse what exists (`ParkStatusBadge`,
  `CrowdLevelBadge`, `Badge`, `ParkCard`) instead of re-implementing UI inline. Only build new when
  nothing suitable exists. See [conventions](docs/development/conventions.md#11-reuse-existing-components).
- **No text may read as AI-generated (REQUIREMENT):** this governs every string a human ever sees —
  posts, UI strings, `alt`/`caption`, meta descriptions, empty states, commit messages, PR bodies.
  `pnpm check:prose` decides the half a machine can. Rules:
  [the rule](docs/rules/no-text-may-read-as-ai-generated.md)
  and [docs/blog.md](docs/blog.md).
- **Six locales.** A new UI string needs all of them.
- **Routing and i18n run through `proxy.ts`**, not `middleware.ts`. Server Components are the default.

## The rules

Each line is the rule. Open the link when you are about to touch the thing it governs — that page
carries the reasoning, the measurements and the counter-examples.

### Architecture and payload

- **[Park page loading priority](docs/rules/park-page-loading-priority.md)** — best-travel-time data (best-days calendar + historical stats) loads
  **last**; live status, wait times and every weather query go first. Enforced by `useLoadLast`
  (`lib/hooks/use-load-last.ts`).
- **[A streamed section owes the page its height](docs/rules/a-streamed-section-owes-the-page-its-height.md)** — a `<Suspense>` fallback reserves the height its
  content will take, per breakpoint, measured off the real thing. `fallback={null}` is honest only
  when nothing renders below it. Prove a fix with `pnpm measure:cls --late` against
  `pnpm build && pnpm start` at `localhost` — never `next dev`, never `127.0.0.1`. A score
  belongs to a **reader position**, printed as `y=` on every line: from `y=0` these pages read
  0.0002 while the field scores 0.98.
- **[An interaction may not rebuild the grid in its own commit](docs/rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md)** — a control's own state
  stays urgent, everything derived from it reads a `useDeferredValue` copy (search, tabs, the five
  filter pills). Measure `event` entries inside the page, against `pnpm build && pnpm start`.
- **[API budget per page](docs/rules/api-budget-per-page.md)** — the 5-minute live poll sends `LiveParkSnapshot`, a projection, never the
  park. Before adding a field, decide which of four kinds it is. Measure with
  `node scripts/measure-api-calls.mjs` before and after.
- **[The page render is the bigger half of the API budget (ANTI-PATTERN)](docs/rules/the-page-render-is-the-bigger-half-of-the-api-budget-and-it.md)** — the RSC payload is roughly
  half these pages' bytes and is paid by every request including the crawler's. A page that renders
  none of a thing must not ship it. Judge compressed, A/B both sides in one build, and measure on a
  cache-busted URL.
- **[A `revalidate` at a call site is somebody else's page](docs/rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md)** — Next takes the shortest `revalidate` a
  route executes. Never pass a numeric TTL at a call site: put it in `CACHE_TTL` or the helper's
  default, and set it from the data's cadence, not as a floor under some page. Prove it against
  `initialRevalidateSeconds` in `.next/prerender-manifest.json`.
- **[A redirect thrown from a render carries the layout as its body](docs/rules/a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md)** — `permanentRedirect()` from a page
  answers `308` with an 81,963 B not-found document, uncompressed. On a crawled surface hoist it
  into `proxy.ts` and import the rule rather than restating it (`lib/parks/calendar-redirects.ts`).
- **[An ISR route needs both halves](docs/rules/an-isr-route-needs-both-halves.md)** — `export const revalidate` alone caches nothing: every
  fetch needs `next: { revalidate }`, and an all-dynamic route needs a `generateStaticParams`
  (empty is right) or it never enters `dynamicRoutes`. Prove it in `.next/prerender-manifest.json`.
- **[A runtime file read ships the directory it is rooted at](docs/rules/a-runtime-file-read-ships-the-directory-it-is-rooted-at.md)** — an unresolvable
  `join(process.cwd(), <root>, <var>)` bundles the whole root into the function (three failed
  deploys); `outputFileTracing*` is inert under `--turbo`. Root it at a purpose-built directory
  (`og-assets/`) or name the file literally. Prove it with `pnpm measure:function-size`.
- **[Translations are routed, not bundled](docs/rules/translations-are-routed-not-bundled.md)** — the locale layout ships only the chrome; each route adds
  its delta via `<RouteMessages route="…">`. Never hand-edit `i18n/route-namespaces.generated.ts`;
  re-run `pnpm generate:route-namespaces` and keep `pnpm check:client-messages` green.

### Data and API

- **[Parks we cannot read](docs/rules/parks-we-cannot-read.md)** — a park with no wait-time source is byte-for-byte a park shut for the
  night. Never derive it: read the curated flag through `noLiveWaitTimesReason()` /
  `hasReadableWaitTimes()` (`lib/utils/live-wait-times.ts`).
- **[A ride out of season is closed, and is not one of the park's rides today](docs/rules/a-ride-out-of-season-is-closed-and-is-not-one-of-the-parks.md)** — `isCurrentlyInSeason`
  has three values, and `null` must behave exactly as before. Test `!== false`, never `=== true`
  (`lib/utils/season.ts`). A live `OPERATING` row still beats the season. The SQL twin
  `attractionIsOutOfSeason()` changes with the TS rule or not at all.

### Features

- **[The planner's day ends when the park closes, and a headliner is not a residual](docs/rules/the-planners-day-ends-when-the-park-closes-and-a-headliner-is.md)** —
  `closeHour` is the hour the closing time falls in. `closeMin` is the certifiable end,
  `closeSlackMin` (60) is drawn and draggable but never planned into. The rule runs on the start
  (`fits = start < closeMin`). Which headliner falls out is decided by `dropWeight`, not by cost.
- **[A day that does not fit opens an assistant, not a footnote](docs/rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md)** — both presses probe with
  `needsFitHelp` and open `PlannerFitAssistant`. Every hint is a measured difference between two
  plans (`fitLevers`), never advice. `pnpm test:planner-fit`, `pnpm check:planner`.
- **[Weather day chart is built around the park's hours](docs/rules/weather-day-chart-is-built-around-the-parks-hours.md)** — the time axis is piecewise linear and both
  kinks sit on the opening-hours band's dashed borders. Geometry lives in
  `lib/utils/weather-chart-axis.ts`, never in the component. The chart owes the card 143 px.
- **[The admin holds no credential](docs/rules/the-admin-holds-no-credential.md)** — an httpOnly session cookie; `adminFetch` is a plain same-origin
  fetch and `app/api/admin/[...path]` turns the cookie into a bearer token server-side. Four things
  in that proxy are load-bearing. Turnstile is checked for **action and hostname**, not just
  `success: true`. The login asks for e-mail, password and code in **one** form and one request —
  `pnpm check:admin-login-form`.
- **[The header menu is three kinds of content, and the split is about the link graph](docs/rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md)** — the parks
  panel server-renders continents and countries only; cities and parks arrive per opened country.
  The band is glass, positioned against the `<header>`. Card widths come from
  `lib/utils/favorites-band-plan.ts`. A row leaves only where the server let it go: API first,
  local mirror second. `pnpm check:header-links`, `pnpm test:favorites-band`,
  `pnpm test:push-follow-delete`, `pnpm test:push-follow-read`.
- **[The guide page teaches the real cards with the ride's real numbers](docs/rules/the-guide-page-teaches-the-real-cards-with-the-rides-real.md)** — every block renders a
  production component, and every figure is a value the API returned, dated in `_fixtures.ts`.
  Audit before you claim. A displayed wait time is always a multiple of five; round only what is
  displayed, and send signed deltas through `roundWaitDeltaTo5`.
- **[Ride ↔ Glossary link](docs/rules/ride-and-glossary-link.md)** — `rideProfile` figures are glossary term ids **in ride order**; repeats
  are intentional. Never dedupe or sort. This app is the only place a term id is defined.
- **[Blog manifest is split](docs/rules/blog-manifest-is-split.md)** — import listings from `@/lib/blog/listing`; `@/lib/blog` drags every
  post body into the bundle of a route the root layout imports.
- **[News is set apart from the articles](docs/rules/news-is-set-apart-from-the-articles.md)** — teasers (homepage, header menu, park/ride
  pages) list articles and news separately (`isNewsPost`, `listArticlesByRecency`, `NewsRow`/`NewsList`). News shows its
  age (`NewsAge`) and is never hidden for it.
- **[News lives under `/news`](docs/rules/news-live-under-news.md)** — every post URL comes from `postPath` /
  `categoryPath` (`lib/blog/paths.ts`); `proxy.ts` 308s old `/blog/` news URLs via `newsRedirect()`.
  `pnpm test:news-redirects`.

### Design and layout

- **[A chapter opens the same way everywhere](docs/rules/a-chapter-opens-the-same-way-everywhere.md)** — one component draws every chapter header,
  `ChapterHeading` (`components/common/chapter-heading.tsx`). A number must not skip, so it comes
  from `extractToc(markdown)` and never from a render-time counter.
- **[A client-only preference may not decide server-rendered markup](docs/rules/a-client-only-preference-may-not-decide-server-rendered-markup.md)** — temperatures render in both
  units and CSS shows one. Hydration is not one pass, so the guard belongs to the consumer, not the
  provider.
- **[A cell is gated on its content, and a component that fills one may not return `null` — nor one line](docs/rules/a-cell-is-gated-on-its-content-and-a-component-that-fills-one.md)** — make the component total (`ropeDropCardVariant()`), or export the predicate so the count
  and the cell ask the same question. One colour rank in every place a number appears; a boundary
  that must be seen is a line, not a wash. `pnpm test:typical-waits`.
- **[The header is 48 px, and its height is written down in four places](docs/rules/the-header-is-48-px-and-its-height-is-written-down-in-four.md)** — control heights come off
  the button scale in `components/ui/button.tsx`, not out of the air. Its breakpoints ask the **bar's**
  width (`@container` on `<header>`), not the window's. `BrandLockup` is one component rendered
  twice, and a lockup's height is the mark's height, so all four SVGs carry a measured ink box.
- **[three.js animations](docs/rules/threejs-animations.md)** — research the real-world reference **first**, then verify every animation
  from all camera perspectives and both themes via `node scripts/render-coaster-elements.mjs`.
  A green build is not enough.
- **[The quietest weekday may be two days, and a thin day drops out rather than ending the vote](docs/rules/the-quietest-weekday-may-be-two-days-and-a-thin-day-drops-out.md)** —
  three refusals remain and each fired on a real park. In that card the park name is never the cell
  that gives way: `w-full max-w-0` goes on the longest-queue cell, not on the park column.
- **[Blog spotlight cards](docs/rules/blog-spotlight-cards.md)** — the row template sits on the card itself, never on a shared wrapper that
  also holds the heading.
- **[A blog card is a row on phones](docs/rules/a-blog-card-is-a-row-on-phones.md)** — below `sm` the card is not rendered at all; `BlogPostRow` is.
  Two markups, not one responsive tree. The hero overlap is safe by construction:
  `HERO_FLOW_INTO_PULL` (176 px) must stay smaller than the hero's mobile `pb-48`.
- **[Map tiles are CARTO, never OSM's own tile server](docs/rules/map-tiles-are-carto-not-osms-own-tile-server.md)** —
  `tile.openstreetmap.org` is for OSM's own site, not for embedding; hotlinking it got park.fan
  hard-blocked on 2026-09-18. Both `TileLayer`s use CARTO's basemap CDN, credited alongside OSM.

### SEO and the machine-facing surface

- **[The favicon is generated from two sources, and it carries no wordmark](docs/rules/the-favicon-is-generated-from-two-sources-and-it-carries-no.md)** — the simple pin for
  `favicon.ico`, `icon.svg` and `apple-touch-icon.png`, the detailed pin for the manifest icons.
  Only `app/layout.tsx` may declare `icons`. `pnpm generate:icons`, `pnpm check:icons`.
- **[Nothing here has a reader inside the site](docs/rules/nothing-here-has-a-reader-inside-the-site.md)** — robots, `llms.txt`, the `.well-known` documents,
  `/api/mcp` and the WebMCP tools are rendered by no page and can rot through a green build.
  `pnpm check:agent-ready` and `pnpm check:webmcp` fetch them from outside; a new document joins that
  script in the same commit.
- **[A `<lastmod>` is observed, never stamped](docs/rules/a-lastmod-is-observed-never-stamped.md)** — the fingerprint covers what a reader sees and what
  stays put; let one volatile field in and all 44,000 URLs change every morning. Three rules are
  load-bearing. `pnpm test:content-changes`.
- **[A feed nobody links to is a file with a URL](docs/rules/a-feed-nobody-links-to-is-a-file-with-a-url.md)** — every route carries its own
  `blogFeedAlternates(locale)`, because Next replaces the whole `alternates` object at the nearest
  declaring segment instead of merging. A widget fence must never be rendered into the feed.
- **[Umami event budget](docs/rules/umami-event-budget.md)** — every event property is billed as another event. Never send what Umami
  already has, never what a sibling property implies, and price load-fired events by their property
  count.

### Content and media

- **[No text may read as AI-generated](docs/rules/no-text-may-read-as-ai-generated.md)** — see _Applies to every change_ above. The full rulebook is
  [docs/blog.md](docs/blog.md).
- **[Blog writing style](docs/rules/blog-writing-style.md)** — never „ehrlich" in any form, no em dash in German running text, and check
  the article before correcting one in (**das** Efteling).
- **[A wait time is never typed into a post](docs/rules/a-wait-time-is-never-typed-into-a-post.md)** — every such table is a fence (`ride-waits-widget`,
  `hourly-profile-widget`). A sentence next to a widget must not name a figure the widget renders.
- **[Park/Ride page ↔ blog link](docs/rules/parkride-page-and-blog-link.md)** — the relation is derived from the post itself; `parkLinks` and
  `rideLinks` override it, independently of each other and **per post, not per locale**.
- **[Media database](docs/rules/media-database.md)** — one filesystem-backed database under `public/media/<collection>/`, and the
  sidecar is the index: never infer park, ride or role from a filename or folder.
  `@/lib/media/hero` is the only client-safe import.
- **[One photo can index two rides (`alsoRides`)](docs/rules/one-photo-can-index-two-rides-alsorides.md)** — names the further rides a photo answers for, every
  slug validated against the park's attractions.
- **[Card photos are two layers](docs/rules/card-photos-are-two-layers.md)** — the framing reference is the strip between the glass panels
  (`CardPhotoFrame`), never the whole card. `pnpm check:card-framing`.
- **[Localized blog gallery captions](docs/rules/localized-blog-gallery-captions.md)** — a gallery is a collection, and its captions live per image in
  the sidecar.
- **[A version is a unit of communication](docs/rules/a-version-is-a-unit-of-communication.md)** — no bump per merge; the PO cuts one, MINOR for a new
  visible capability, PATCH for a bundle of fixes. `docs/changelog.md` is the internal log and
  `content/changelog/<version>.md` the public entry at `/en/changelog`; never parse one into the
  other, and a blog post is never a release.

---

## Documentation (links)

| Topic           | Doc                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Writing**     | [blog.md — writing rules for every text](docs/blog.md) · [blog authoring](content/blog/README.md) · [image text](public/media/README.md)                                                                                                                                                                                                                                                                                                              |
| **Docs home**   | [docs/README.md](docs/README.md)                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Architecture    | [system-overview](docs/architecture/system-overview.md) · [routing-urls](docs/architecture/routing-and-urls.md) · [caching](docs/architecture/caching-strategy.md) · [API integration](docs/architecture/api-integration.md)                                                                                                                                                                                                                          |
| Development     | [setup](docs/development/setup.md) · [scripts](docs/development/scripts.md) · [datetime](docs/development/datetime-handling.md) · [assets](docs/development/assets.md) · [flags](docs/development/flags-and-debug.md) · [conventions](docs/development/conventions.md) · [impeccable](docs/development/impeccable.md) · [vercel comment sync](docs/development/vercel-comment-sync.md) · [notes for sessions](docs/development/notes-for-sessions.md) |
| Design          | [design system](docs/design/design-system.md)                                                                                                                                                                                                                                                                                                                                                                                                         |
| i18n            | [internationalization](docs/i18n/internationalization.md) · [translations](docs/i18n/translations.md) · [pluralization](docs/i18n/pluralization.md)                                                                                                                                                                                                                                                                                                   |
| Features        | [admin](docs/features/admin.md) · [media database](docs/features/media-database.md) · [glossary](docs/features/glossary.md) · [the guide page](docs/features/how-park-fan-works.md) · [trip planner](docs/features/trip-planner.md) · [new-posts toast](docs/features/new-posts-toast.md)                                                                                                                                                             |
| API & backend   | [backend integration](docs/api/backend-integration.md) · [calendar status](docs/api/calendar-status-closed.md) · [parks without wait times](docs/api/parks-without-wait-times.md)                                                                                                                                                                                                                                                                     |
| SEO             | [SEO analysis](docs/seo/analysis.md) · [agent readiness](docs/seo/agent-readiness.md) · [featured parks](docs/seo/featured-parks.md) · [sitemaps](docs/seo/sitemaps.md) · [crawl budget](docs/seo/crawl-budget.md)                                                                                                                                                                                                                                    |
| Troubleshooting | [common issues](docs/troubleshooting/common-issues.md)                                                                                                                                                                                                                                                                                                                                                                                                |
| Other           | [changelog](docs/changelog.md)                                                                                                                                                                                                                                                                                                                                                                                                                        |

---

## External

- [API docs](https://api.park.fan/api)
- [Live site](https://park.fan)
- [Backend repo (v4.api.park.fan)](https://github.com/park-fan/v4.api.park.fan)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
