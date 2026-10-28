# Development setup

How to get the frontend running locally and what `pnpm build` does before Next.js starts. Every
other command is in [scripts](scripts.md).

## Prerequisites

- **Node.js 24** or newer, pinned in `.nvmrc` and `package.json` `engines` (the version Vercel
  runs). `nvm use` switches to it.
- **pnpm**, the version in `package.json` `packageManager` (`corepack enable` provides it).

## Install and run

```bash
pnpm install
cp .env.example .env.local   # optional
pnpm dev                     # http://localhost:3000, Turbopack
```

Nothing has to be configured for basic development: the API defaults to `https://api.park.fan`,
and a feature that needs a key or a secret falls back or switches itself off without one. `.env.example` lists
the variables a deployment or a local `.env.local` sets, commented; every variable the code reads,
with its default and its reader, is in [environment variables](#environment-variables) below.

## Build

```bash
pnpm build
pnpm start
```

`pnpm build` runs `prebuild` first, then `next build --turbo`, then `check-no-has.mjs --built`
against the emitted CSS. `prebuild` runs, in order:

| Step                           | Writes / checks                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `generate-build-info.mjs`      | `build-info.json`                                                                                |
| `generate-message-chunks.mjs`  | the per-locale chunks a lazy boundary fetches                                                    |
| `check-client-messages.mjs`    | **fails** on a stale route-namespace map or a mis-wired route                                    |
| `check-untranslated.mjs`       | **fails** on German copied into another locale                                                   |
| `check-blog-updated-at.mjs`    | **fails** when a post's translations disagree on `updatedAt`                                     |
| `generate-client-glossary.mjs` | the client glossary data                                                                         |
| `generate-blog-manifest.mjs`   | the blog manifests                                                                               |
| `generate:most-read-seed`      | the most-read rankings as this build sees them (never fails; empty when the API does not answer) |
| `generate:image-crops`         | the 16:9 / 4:3 / 1:1 crops                                                                       |
| `generate:og-assets`           | `og-assets/`, the OG function's asset root                                                       |
| `generate:media`               | the media database manifests                                                                     |

The three checks fail the build on purpose: each guards something whose failure is otherwise
silent (raw message keys or a page in the wrong language, German on an English page, a
translation left behind). When `check-client-messages` fires, the fix is usually
`pnpm generate:route-namespaces`; see
[internationalization](../i18n/internationalization.md#which-namespaces-reach-the-client).

What each generator writes and which outputs are committed: [scripts](scripts.md#generators).

## Environment variables

Every variable the code reads (`process.env.*`), by purpose. **Public** means `NEXT_PUBLIC_*`:
inlined into the client bundle at build time, so a change needs a rebuild and the value is visible to
anybody. Everything else is server-only. Where a feature owns a page, the page explains the variable
and this table only names it.

**API and site**

| Variable                 | Default                | Kind   | Read by                                                                                                                                                                  |
| ------------------------ | ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`    | `https://api.park.fan` | public | `lib/api/client.ts`: the server's API base and `API_ORIGIN`                                                                                                              |
| `API_AUTH_KEY`           | unset                  | secret | `getServerApiHeaders` (`lib/api/client.ts`), sent as `x-auth-key` on every server request; set it in the build environment too, or the build is rate-limited             |
| `NEXT_PUBLIC_API_DIRECT` | off                    | public | `lib/api/client.ts`; `1` sends the per-visitor requests past Vercel ([flags](flags-and-debug.md#build-time-flags))                                                       |
| `NEXT_PUBLIC_BASE_URL`   | `https://park.fan`     | public | OG image URLs and the OG renderer's absolute fallbacks ([OG images](../features/og-images.md)); every other absolute URL uses the constant `SITE_URL` (`i18n/config.ts`) |
| `PREWARM_BASE_URL`       | `SITE_URL`             | server | `app/api/cron/prewarm/route.ts`, the host the prewarm cron requests                                                                                                      |

**Analytics, maps, bot protection**

| Variable                         | Default                                            | Kind   | Read by                                                                                                                        |
| -------------------------------- | -------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_UMAMI_URL`          | unset: no tracker                                  | public | `app/[locale]/layout.tsx`; the tracker loads only with both Umami variables ([analytics](analytics.md))                        |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID`   | unset: no tracker                                  | public | same                                                                                                                           |
| `NEXT_PUBLIC_CARTO_MAP_KEY`      | CARTO's anonymous endpoint                         | public | `lib/utils/carto-tile-url.ts` ([park map](../features/park-map.md))                                                            |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare's always-passing test key               | public | `components/common/turnstile-widget.tsx`                                                                                       |
| `TURNSTILE_SECRET_KEY`           | unset: check skipped in dev, refused in production | secret | `lib/security/turnstile.ts`, for `/contribute` and the admin login ([admin](../features/admin.md#bot-protection-on-the-login)) |
| `TURNSTILE_HOSTNAMES`            | empty: hostname check skipped                      | server | same; comma-separated hosts a token may be solved on                                                                           |

**Storage**

| Variable                   | Default                                         | Kind   | Read by                                                                                                                                                           |
| -------------------------- | ----------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BLOB_READ_WRITE_TOKEN`    | set by Vercel when a Blob store is linked       | secret | `lib/contribute/driver.ts` picks Blob when it is set; `@vercel/blob` reads it for contributions and the content-change dates (`lib/seo/content-changes/store.ts`) |
| `STORAGE_DRIVER`           | automatic                                       | server | `lib/contribute/driver.ts`: `local` (`./.uploads`, `./.data`) or `vercel-blob`                                                                                    |
| `CONTRIBUTE_TICKET_SECRET` | the Blob token, then a fixed development string | secret | `lib/contribute/ticket.ts` ([contributions](../features/contribute.md))                                                                                           |

**Admin**

| Variable                        | Default                        | Kind   | Read by                                                                                        |
| ------------------------------- | ------------------------------ | ------ | ---------------------------------------------------------------------------------------------- |
| `BLOG_EDITOR_GITHUB_TOKEN`      | `GITHUB_TOKEN`, else none      | secret | `lib/admin/github.ts`; without one the blog editor and the media admin cannot save             |
| `GITHUB_REPOSITORY`             | `PArns/park.fan`               | server | same: the repository those pull requests go to                                                 |
| `BLOG_EDITOR_BASE_BRANCH`       | `main`                         | server | same: their base branch                                                                        |
| `BLOG_EDITOR_ANTHROPIC_API_KEY` | `ANTHROPIC_API_KEY`, else none | secret | `app/api/admin/blog-editor/translate/route.ts`; without a key the translate button answers 500 |
| `BLOG_EDITOR_TRANSLATE_MODEL`   | `claude-sonnet-4-5`            | server | same ([blog editor](../features/blog-editor.md#translate))                                     |

**Secrets that open a route.** Without its secret a route refuses every request (503; the comment
webhook 500), so an unset variable never leaves it open.

| Variable                                                                     | Route                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CRON_SECRET`                                                                | every `/api/cron/*` (`cronUnauthorized`, `lib/security/cron-auth.ts`); see [cron jobs](#cron-jobs)                                                                                                     |
| `REVALIDATE_SECRET`                                                          | `/api/revalidate`, called by the backend ([invalidation](../architecture/caching-strategy.md#invalidation))                                                                                            |
| `VERCEL_DEPLOY_WEBHOOK_SECRET`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` | `/api/webhooks/vercel-deploy`, the Cloudflare purge after a deploy ([CDN caching](../architecture/cdn-caching.md#a-deploy-purges-cloudflare))                                                          |
| `VERCEL_COMMENT_WEBHOOK_SECRET`, `GITHUB_DISPATCH_TOKEN`                     | `/api/webhooks/vercel-comments`; `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID` and the `VERCEL_COMMENT_SYNC*` / `VERCEL_PRODUCTION_BRANCH` toggles are optional ([Vercel comment sync](vercel-comment-sync.md)) |

**Set by the platform**, never by hand: `NODE_ENV`; `NEXT_PHASE` (`phase-production-build` turns on
the build's API retries in `lib/api/client.ts` and the missing-translation log in
`lib/i18n/logger.ts`); `VERCEL_ENV` (the server User-Agent, and `?sim=` outside production, because
`NODE_ENV` is `production` on previews too, `lib/nearby-simulation.ts`); `VERCEL_GIT_COMMIT_SHA`
(the server User-Agent); `VERCEL_DEPLOYMENT_ID` (the deploy webhook acts only on a delivery naming the
live deployment).

**Scripts only.** `GITHUB_TOKEN`, `GITHUB_REPOSITORY`, `VERCEL_API_TOKEN` and `VERCEL_TEAM_ID` are
read by the app as well (above); the rest never reach it.

| Variable                                                                 | Script                                                                                                                                                         | Default                           |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `ANALYZE`                                                                | `next.config.ts` under `pnpm analyze`                                                                                                                          | off                               |
| `IMAGE_CROP_CONCURRENCY`                                                 | `generate-image-crops.mjs`, `generate-og-assets.mjs`                                                                                                           | derived from the CPU count        |
| `MEDIA_VERIFY`                                                           | `generate-media-manifest.mjs`; `0` skips the check against the live catalog                                                                                    | on                                |
| `BASE`                                                                   | the browser checks (`check-header-reach`, `check-card-framing`, `check-admin-login-form`, `check-header-links`, `check-agent-ready`, `check-landing-pages`, …) | `http://localhost:3000`           |
| `CHROMIUM_PATH`                                                          | the same checks and `measure-cls.mjs`                                                                                                                          | `/opt/pw-browsers/chromium`       |
| `CLS_BASE_URL`, `CLS_CHROMIUM`                                           | `measure-cls.mjs`                                                                                                                                              | localhost, `CHROMIUM_PATH`        |
| `MOBILE_HEIGHT_BASE_URL`                                                 | `measure-mobile-height.mjs`                                                                                                                                    | `http://localhost:3000`           |
| `PLAYWRIGHT_CHROMIUM_PATH`                                               | `measure-api-calls.mjs`                                                                                                                                        | Playwright's own                  |
| `OG_BASE`                                                                | `render-og.mjs` (`pnpm og:preview`)                                                                                                                            | `http://localhost:3000`           |
| `CHECK_BASE`, `CHECK_PAGES`                                              | `check-media-urls.mjs`                                                                                                                                         | localhost, none                   |
| `CHECK_API`                                                              | `check-blog-slugs.mjs`                                                                                                                                         | `https://api.park.fan`            |
| `NEXT_PUBLIC_SITE_URL`                                                   | `crawl-translations.cjs`                                                                                                                                       | `http://localhost:3000`           |
| `PLANNER_SHOT_DIR`                                                       | `check-planner.mjs`: writes screenshots there                                                                                                                  | none                              |
| `OUT`, `SAMPLES`                                                         | `render-coaster-elements.mjs`                                                                                                                                  | `.coaster-render`, five positions |
| `BENCH`                                                                  | `test-planner-optimize.mjs`: adds a benchmark                                                                                                                  | off                               |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`   | `publish-media-r2.mjs` ([media database](../features/media-database.md))                                                                                       | none                              |
| `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID`, `WEBHOOK_URL` | `setup-vercel-comment-webhook.mjs`                                                                                                                             | see the script                    |
| `GITHUB_TOKEN`, `GITHUB_REPOSITORY`, `CLIENT_PAYLOAD`, `ASSET_BRANCH`    | `scripts/ci/sync-vercel-comment.mjs`, in GitHub Actions                                                                                                        | set by the workflow               |

## Cron jobs

`vercel.json` schedules four routes, in UTC. Vercel sends `Authorization: Bearer $CRON_SECRET` with
each call, and `cronUnauthorized` refuses anything else, so without `CRON_SECRET` none of them runs.
By hand: `curl -H "Authorization: Bearer $CRON_SECRET" https://park.fan/api/cron/<name>`.

| Schedule    | Route                       | Does                                                                                                                                                                                                                                                                                                     | Also needs                                                                                                                        |
| ----------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 04:00 daily | `/api/cron/prewarm`         | renders every park once in the default locale, most popular first, to fill the Data Cache entry all six locales share; `?include=attractions` adds the rides. Run it by hand after a deploy. ([why one locale](../optimization/decisions.md#2026-09-01--accepted-prewarm-cron-warms-one-locale-not-six)) | `PREWARM_BASE_URL` (optional)                                                                                                     |
| 05:30 daily | `/api/cron/content-changes` | fingerprints the catalogue and records which pages changed today ([sitemaps](../seo/sitemaps.md#lastmod-observed-not-stamped))                                                                                                                                                                           | `BLOB_READ_WRITE_TOKEN`, or the dates stay in `.data/`                                                                            |
| 06:00 daily | `/api/cron/indexnow`        | submits the URLs whose observed date moved, everything on Mondays ([IndexNow](../seo/sitemaps.md#indexnow-submits-what-moved))                                                                                                                                                                           | `BLOB_READ_WRITE_TOKEN` to read the dates; without them it submits everything. The IndexNow key is a constant (`lib/indexnow.ts`) |
| 06:15 daily | `/api/cron/websub`          | pings the WebSub hub for the blog feeds ([blog feeds](../seo/blog-feeds.md#websub))                                                                                                                                                                                                                      | nothing                                                                                                                           |

The order matters: content-changes writes what indexnow reads half an hour later.
