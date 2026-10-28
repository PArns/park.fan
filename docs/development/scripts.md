# Scripts

Every `pnpm` script in `package.json`, grouped by purpose, plus the scripts under `scripts/` that
have no `pnpm` entry. Open it to find the command for a job, or to learn what a script in CI or
`prebuild` does. `package.json` is the source of truth for names; setup and the `prebuild` order
are in [setup](setup.md).

A new script is `.mjs` (see [the two `.cjs` files](#the-two-cjs-files)). A script that imports a
`.ts` module runs as `node --experimental-strip-types --import ./scripts/register-path-alias.mjs`,
which resolves the `@/` alias.

## Run and build

| Script               | Does                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`           | `next dev --turbopack`                                                                                                                                                   |
| `pnpm dev:live`      | the same dev server for an [impeccable](impeccable.md) live session; prints how to attach the overlay                                                                    |
| `pnpm build`         | `prebuild`, `next build --turbo`, then `check-no-has.mjs --built` on the emitted CSS                                                                                     |
| `pnpm start`         | `next start` on the last build                                                                                                                                           |
| `pnpm build:webpack` | `prebuild` and a webpack build                                                                                                                                           |
| `pnpm analyze`       | `prebuild` and a webpack build with `ANALYZE=true` (bundle analyzer)                                                                                                     |
| `pnpm typecheck`     | the generators `tsc` imports (build info, message chunks, client glossary, blog and media manifests, an offline most-read seed), then `tsc --noEmit`; CI job `typecheck` |

The `impeccable:detect`, `impeccable:detect:ci`, `impeccable:install` and `impeccable:update`
scripts run the design detector and its skills through `npx`; see [impeccable](impeccable.md).

`next start` does not compress `/api/*`; weigh poll bodies yourself
([byte budget](../rules/a-day-in-the-park-has-a-byte-budget.md)).

## Gates

| Script               | Does                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`          | `eslint . --max-warnings=0`: a warning fails it                                                                                                                        |
| `pnpm lint:fix`      | `eslint . --fix`                                                                                                                                                       |
| `pnpm format`        | `prettier --write .`; on Markdown read the diff first ([conventions](conventions.md#prettier-on-markdown-two-cases-where-format-is-the-cause))                         |
| `pnpm format:check`  | `prettier --check .`, covers `docs/**` and `content/**` too                                                                                                            |
| `pnpm release:check` | lint, format check, `validate:translations`, `check:client-messages`, `check:untranslated`, `check:glossary-slugs`, `check:glossary-content-date`, `test:ignore-build` |
| `pnpm test:unit`     | every `test:*` script that needs no server, browser, network or build, in parallel ([below](#unit-tests))                                                              |

CI (`.github/workflows/checks.yml`) runs, on every pull request and push to `main`: job
`lint-and-format` (`lint`, `format:check`, `check:no-has`, `check:blog-updated-at`,
`check:glossary-content-date`, `check:changelog`), `unit-tests` (`test:unit`), `media-drift`
(`generate:media` must leave `lib/media` unchanged; informational), `code-index-drift`
(`check:code-index`) and `typecheck`.

## Generators

| Script                           | Writes                                                                                                                                                            | Committed?               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `generate-build-info.mjs`        | `build-info.json` (version, commit count, timestamp); `prebuild` only                                                                                             | no                       |
| `pnpm generate:message-chunks`   | `lib/i18n/message-chunks/`, the namespaces a lazy boundary fetches                                                                                                | no                       |
| `pnpm generate:route-namespaces` | `i18n/route-namespaces.generated.ts` ([below](#the-route-namespace-map-is-generated-not-written))                                                                 | **yes**                  |
| `pnpm generate:client-glossary`  | `lib/glossary/client-data.ts` and `lib/glossary/client-data/<locale>.ts`                                                                                          | no                       |
| `pnpm generate:blog-manifest`    | the blog manifests ([below](#the-blog-manifest-is-three-files-on-purpose))                                                                                        | no                       |
| `pnpm generate:most-read-seed`   | `lib/blog/most-read-seed.generated.ts`; `--offline`, `--if-missing` ([most read](../features/most-read.md))                                                       | no                       |
| `pnpm generate:image-crops`      | the 16:9 / 4:3 / 1:1 crops of every media photo, never upscaled; runs before `generate:media`                                                                     | no                       |
| `pnpm generate:og-assets`        | `og-assets/`, the OG function's own asset root ([the rule](../rules/a-runtime-file-read-ships-the-directory-it-is-rooted-at.md))                                  | no                       |
| `pnpm generate:media`            | the media database manifests under `lib/media/` ([media database](../features/media-database.md))                                                                 | `manifest-parks.ts` only |
| `pnpm generate:code-index`       | `docs/code-index/`; `pnpm check:code-index` fails on drift ([the rule](../rules/the-code-index-is-generated-from-the-doc-comments.md))                            | **yes**                  |
| `pnpm generate:icons`            | the favicon set from the brand SVGs; `pnpm check:icons` fails on drift ([favicon](../seo/favicon.md))                                                             | **yes**                  |
| `pnpm generate:brand-pin`        | `public/logo.svg` / `logo-dark.svg`, the footer's pin cut from `logo-big*.svg`; `pnpm check:brand-pin` fails on drift                                             | **yes**                  |
| `generate-hero-world-map.mjs`    | `lib/geo/world-map-data.ts` from `public/world.svg`; manual, look at the map afterwards ([homepage hero](../features/homepage-hero.md#the-map-data-is-generated)) | **yes**                  |
| `export-glossary-term-ids.mjs`   | prints every glossary term id; no consumer since the API reads `GET /api/glossary-term-ids` ([glossary](../features/glossary.md#keeping-term-ids-honest))         | stdout                   |

`prebuild` runs the git-ignored ones and `generate:media`. The other committed outputs are
regenerated by hand, and all but the world map have a check that fails on drift.
`export-glossary-term-ids.mjs` is a candidate for removal: nothing reads its output. Shared logic
lives in one module each, never a second copy in a script: `lib/blog/derive.mjs` (reading time,
park and ride references),
`lib/i18n/route-namespaces.mjs` (the client-boundary walk), `lib/media/sidecar.mjs`.

### The blog manifest is three files, on purpose

`generate-blog-manifest.mjs` writes three git-ignored modules, because the post bodies dwarf
everything else:

| File                          | Contents                                                                                 | Imported by                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------- |
| `lib/blog/manifest.ts`        | `BLOG_POSTS_META`: frontmatter plus build-time derivations (reading time, `parkRefs`, …) | `lib/blog/listing.ts` (every listing surface) |
| `lib/blog/manifest-bodies.ts` | `BLOG_POST_BODIES`: the markdown, keyed `<locale>/<slug>`, ~900 KB                       | `lib/blog/index.ts`, the post page only       |
| `lib/blog/news-redirects.ts`  | `NEWS_POST_TARGETS`: which `/blog/<slug>` is now a news post under `/news`, per locale   | `proxy.ts`, which has no file system          |

Import listings from `@/lib/blog/listing`
([blog manifest is split](../rules/blog-manifest-is-split.md)). The generator **warns** (never
fails) about `parkLinks`/`rideLinks` frontmatter that would fail silently: an invalid slug, an
empty list, or a value that differs between a post's translations.

## Translations

| Script                         | Does                                                                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm validate:translations`   | every locale's key set against `en`, and `LANGUAGE_BANNER_MESSAGES` against `messages/*.json` (fails); lists keys used in code but undefined, and possibly unused keys (reports only) |
| `pnpm check:client-messages`   | fails on a stale route-namespace map, a route missing `<RouteMessages>`, a wrong route key or a superfluous wrapper                                                                   |
| `pnpm check:untranslated`      | fails on German copied verbatim into another locale ([translations](../i18n/translations.md#a-key-can-be-present-and-still-be-german))                                                |
| `pnpm crawl:translations`      | crawls the prerendered HTML in `.next/server/app` for raw keys; after `pnpm build`                                                                                                    |
| `pnpm crawl:translations:live` | crawls a running server (`localhost:3000`), every geo route from `/v1/discovery/geo`, for missing keys, raw templates and 404s                                                        |
| `pnpm test:translations`       | `validate:translations`, `build`, `crawl:translations`; not in `test:unit`                                                                                                            |

### The route namespace map is generated, not written

`generate-route-namespaces.mjs` walks the import graph from every route entry, propagates the
client boundary (`'use client'` plus everything it imports transitively) and records which
namespaces each route ships. The output is committed because a reviewer needs to see it when a
component crosses the boundary and `next dev` needs it on a fresh clone; `check-client-messages.mjs`
re-derives it and diffs. The scan strips comments first: a doc comment quoting
`useTranslations('seo.faq')` would otherwise put that namespace on every route. What the map is
for: [internationalization](../i18n/internationalization.md#which-namespaces-reach-the-client).

### The two `.cjs` files

`validate-translations.cjs` and `crawl-translations.cjs` are the only CommonJS scripts, and the
extension says so because `package.json` declares `"type": "module"`. That declaration is
load-bearing: without it Node parses every `.ts` a script imports twice and prints
`[MODULE_TYPELESS_PACKAGE_JSON]` in every build log. Renaming the two back to `.js` brings the
warning back and breaks `pnpm validate:translations`, which `release:check` runs.

## Content and data checks

No server needed unless noted.

| Script                             | Fails on                                                                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check:prose`                 | the writing rules a regex can decide; surfaces and flags in [writing §7](../writing/7-review.md)                                                                                                |
| `pnpm test:prose-rules`            | one positive and one negative case per pattern of `scripts/prose-slop-patterns.mjs`                                                                                                             |
| `pnpm check:blog-updated-at`       | a post with fewer than six files, files that disagree on `updatedAt`, a news `time` missing, malformed or different ([the rule](../rules/a-post-ships-in-six-languages-in-one-pull-request.md)) |
| `pnpm check:blog-slugs`            | a widget or reference slug the API no longer serves (calls api.park.fan)                                                                                                                        |
| `pnpm check:glossary-slugs`        | a glossary slug that is not URL-safe, or missing in a locale                                                                                                                                    |
| `pnpm check:glossary-content-date` | `GLOSSARY_CONTENT_DATE` (`lib/glossary/content-date.ts`) older than the glossary's content                                                                                                      |
| `pnpm check:no-has`                | a `:has()` that could reach a page's stylesheet; `--built` reads the emitted CSS ([the rule](../rules/no-has-selector-in-the-stylesheet.md))                                                    |
| `pnpm check:changelog`             | a release that breaks [a version is a unit of communication](../rules/a-version-is-a-unit-of-communication.md), then `check:prose --only=changelog`                                             |
| `pnpm test:changelog-fragments`    | runs `release-cut.mjs` and `check-changelog.mjs` in a scratch directory                                                                                                                         |
| `pnpm audit:media`                 | nothing; lists each media file's gaps, split into machine-fixable and person-fixable                                                                                                            |

## Release and publishing

| Script                               | Does                                                                                                                                                                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm release:cut x.y.z --title "…"` | folds `docs/changelog.d/` into `docs/changelog.md`, sets `package.json`, writes a `content/changelog/x.y.z.md` skeleton; `--dry-run`. The flow: [a version is a unit of communication](../rules/a-version-is-a-unit-of-communication.md) |
| `pnpm publish:media`                 | uploads card photos to the R2 bucket behind media.park.fan; `--out <dir>` writes locally. CI: `.github/workflows/publish-media.yml` ([media database](../features/media-database.md))                                                    |
| `pnpm ping:websub`                   | pings the WebSub hub for every locale's feed, after the deploy is live; `--dry` ([blog feeds](../seo/blog-feeds.md))                                                                                                                     |
| `setup-vercel-comment-webhook.mjs`   | registers, lists (`--list`) or deletes (`--delete <id>`) the Vercel `comment.*` webhook ([comment sync](vercel-comment-sync.md))                                                                                                         |
| `ci/sync-vercel-comment.mjs`         | run by `.github/workflows/vercel-comment-sync.yml`                                                                                                                                                                                       |
| `vercel-ignore-build.sh`             | Vercel's Ignored Build Step; `pnpm test:ignore-build` pins it ([deploys](deploys.md))                                                                                                                                                    |
| `patch-sidecars.mjs <patch.json>`    | merges a patch into media sidecars through the same normalizer the admin uses                                                                                                                                                            |

## Checks against a running site

Measure against `pnpm build && pnpm start` at `localhost`, never `next dev` (it ships CSS through
JavaScript) and never `127.0.0.1` (the dev server 403s its own chunks there). Most take `--base=` or
`BASE=`.

| Script                        | Asserts or measures                                                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm measure:cls`            | layout shift per page and reader position ([the rule](../rules/a-streamed-section-owes-the-page-its-height.md); flags in the script header)                                                                |
| `pnpm measure:inp`            | INP of a phone's taps (390 px, `--cpu=4`), split into delay, processing and presentation; `--path=`, `--only=` ([interaction rule](../rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md)) |
| `pnpm measure:mobile-height`  | page height on an iPhone 13 and where it goes, per section; `--json <file>`, `--compare <file>`                                                                                                            |
| `measure-api-calls.mjs`       | `/api/*` requests per route, their size and timing ([API budget](../rules/api-budget-per-page.md))                                                                                                         |
| `pnpm measure:function-size`  | after a build, no server: each Vercel Function's traced size against the 250 MB limit                                                                                                                      |
| `pnpm probe:isr`              | `x-vercel-cache` per route over two requests, to see where ISR writes happen                                                                                                                               |
| `check-cdn-cache.sh`          | cache behaviour of `/*/parks/*` from outside, against Cloudflare ([CDN caching](../architecture/cdn-caching.md#measuring))                                                                                 |
| `pnpm og:preview`             | renders the OG templates to `.og-preview/` with a contact sheet                                                                                                                                            |
| `render-coaster-elements.mjs` | contact sheets of every glossary coaster element, three cameras × two themes ([three.js rule](../rules/threejs-animations.md))                                                                             |
| `pnpm check:header-reach`     | the header nav is reachable at scroll 0 on the six hero pages ([header rule](../rules/the-header-is-48-px.md))                                                                                             |
| `pnpm check:header-links`     | the header puts its hub, continent and country links in the served HTML ([header menu rule](../rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md))                                       |
| `pnpm check:landing-pages`    | the anatomy of every landing page ([the rule](../rules/a-landing-page-has-one-anatomy.md))                                                                                                                 |
| `pnpm check:semantic-html`    | landmarks, headings, navs, articles and dates per page type ([the rule](../rules/the-markup-says-what-each-part-is.md))                                                                                    |
| `pnpm check:hero-search-rest` | the hero's resting search dropdown keeps one height in all six locales ([homepage hero](../features/homepage-hero.md))                                                                                     |
| `pnpm check:admin-login-form` | the admin login is one form with all three fields ([the rule](../rules/the-admin-holds-no-credential.md))                                                                                                  |
| `pnpm check:card-framing`     | a card's photo box stays wider than 1.5 ([card photos](../rules/card-photos-are-two-layers.md))                                                                                                            |
| `pnpm check:media-urls`       | every rendered media URL carries `?v=` and answers                                                                                                                                                         |
| `pnpm check:planner`          | the trip planner in a browser, with or without `/plan/day` ([trip planner](../features/trip-planner/README.md))                                                                                            |
| `pnpm check:agent-ready`      | robots, `llms.txt`, the `.well-known` documents and `/api/mcp` ([agent readiness](../seo/agent-readiness.md))                                                                                              |
| `pnpm check:webmcp`           | the WebMCP tools register and answer ([agent readiness](../seo/agent-readiness.md))                                                                                                                        |

## Unit tests

`pnpm test:unit` (`scripts/run-unit-tests.mjs`) reads the `test:*` scripts from `package.json` and
runs them in parallel, after generating the git-ignored blog and media manifests and the offline
most-read seed once. A new `test:*` script joins the CI job `unit-tests` by existing; one stays out
only through `EXCLUDED` in the runner, with the reason (today `test:translations`, which builds).
`pnpm test:unit --list` prints what would run. Run alone, a test that imports a manifest needs it
generated first. Each script's header comment says what it pins.

- **Trip planner:** `planner-actions`, `planner-assignment`, `planner-climatology`, `planner-estimate`, `planner-fit`, `planner-grid`, `planner-leg`, `planner-month-grid`, `planner-optimize`, `planner-park-time`, `planner-push-topics`, `planner-ride-drag`, `planner-shows`, `planner-unavailable`, `planner-weather-rail`, `trip-share`, `trip-sync`
- **Park page and live data:** `attraction-sort`, `closed-ride`, `covered-rides`, `forecast-opening-hours`, `in-park-block`, `live-data-freshness`, `live-outage`, `live-park-counts`, `live-park-daily-block`, `maze-grouping`, `next-best-ride`, `nowcast-conditions`, `opening-hours-schema`, `outage-estimate`, `park-day-over`, `park-guide`, `park-kids`, `park-null-wait-stats`, `park-phrase`, `park-stats-derive`, `ridden-rides`, `rider-height`, `show-order`, `threshold-minutes`, `works-period`
- **Ride page:** `attraction-history-geometry`, `chapter-panel-padding`, `quietest-day`, `ride-alternatives`, `ride-crowd-scale`, `ride-day-curve`, `ride-figures`, `ride-openings`, `ride-summary`, `typical-hour`, `typical-waits`
- **Calendar and forecasts:** `calendar`, `calendar-month`, `calendar-park-projection`, `day-comparison`, `holiday-names`, `park-best-days`, `weather-chart-axis`, `weekday-forecast`, `yearly-outlook`
- **Location, compass, geo:** `breadcrumb-city`, `compass`, `coordinates`, `country-park-order`, `geolocation-permission`, `maps-links`, `nearby-cache`
- **Favorites, follows, push:** `favorites-band`, `push-arming`, `push-follow-delete`, `push-follow-read`, `push-timezone`, `show-follows-store`
- **Header, search, routing:** `hub-chapters`, `menu-focus`, `post-search`, `unprefixed-redirect`
- **Blog, news, SEO:** `blog-image-sidecar`, `content-changes`, `glossary-ride-href`, `listing-pagination`, `meta-descriptions`, `most-read`, `new-posts`, `news-park`, `news-redirects`, `news-sitemap`, `news-split`, `scheduled-posts`, `viewed-parks`, `widget-park-ref`
- **Media:** `capture-location`, `capture-session`, `crop-box`, `media`, `media-references`, `media-session`, `media-unique-roles`, `photo-backlog`
- **API routes, admin, fetching:** `admin-cookie`, `admin-provenance`, `admin-proxy-path`, `api-build-retry`, `direct-api`, `edge-windows`, `guards`, `is-uuid`, `page-fetch-misses`, `request-ip`, `stats-fetchers`, `turnstile`
- **ML pages:** `compare-selection`, `ml-overview`, `model-comparison`
- **Analytics, release, build:** `admin-site-analytics`, `changelog-fragments`, `ignore-build`, `prose-rules`, `site-analytics`, `umami-events`

## Unregistered leftovers

`scripts/test-url-building.mjs` (URL builders against old 404s) and the four
`scripts/benchmark-search-*.mjs` micro-benchmarks have no `pnpm` entry and nothing runs them.
