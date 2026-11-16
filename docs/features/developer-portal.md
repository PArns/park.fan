# Developer portal (`/developers`) and dashboard (`/developers/dashboard`)

The pages a developer uses to work with api.park.fan: what is open without a key (a park's live
wait times, nothing else), which permission of a data key opens what, which key the terms allow,
how the credit link must look, and how a key is sent and checked. Behind it the dashboard, where a
developer registers, files key requests, picks up an approved key and watches, rotates and
revokes it. The owner decides every request on `/admin/api-keys`. Open this page before changing
the permissions, the request form, the dashboard or the review in the admin.

The API owns everything that is stored: accounts (role `developer`), requests, keys and their
permissions (PAR-1365 in `PArns/v4.api.park.fan`, `docs/frontend/api-keys.md` there). This repo
stores nothing of it.

## Pieces

| Concern                                                 | File                                                                               |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Permission catalog, groups, routes, limits, error codes | `lib/developers/permissions.ts` (mirrors the API's)                                |
| Request model, tiers, revenue models, derived values    | `lib/developers/key-request.ts`                                                    |
| Dashboard calls, key states, usage totals               | `lib/developers/dashboard.ts`                                                      |
| Paths, the attribution anchor, the portal URL           | `lib/developers/paths.ts`                                                          |
| Portal page                                             | `app/[locale]/developers/page.tsx`                                                 |
| Dashboard page (noindex)                                | `app/[locale]/developers/dashboard/page.tsx`                                       |
| Sign-in and registration                                | `components/developers/developer-auth.tsx`                                         |
| Dashboard, key card, request form                       | `components/developers/developer-{dashboard,key-card}.tsx`, `key-request-form.tsx` |
| Registration route (Turnstile `developer-register`)     | `app/api/developers/register/route.ts`                                             |
| Session proxy to `/v1/developer/*`                      | `app/api/developer/[...path]/route.ts`, `lib/admin/session-proxy.ts`               |
| Admin: requests, approval, keys with permissions        | `app/admin/api-keys/**`, `lib/admin/key-requests.ts`, `lib/admin/api-keys.ts`      |
| Admin's German labels (read from `messages/de.json`)    | `lib/admin/developer-labels.ts`                                                    |
| Strings                                                 | `developers` and `landing.developers` in `messages/*.json`                         |
| Tests                                                   | `pnpm test:developer-key-requests`, `pnpm test:forecast-relay`                     |

## Permissions

A data key (`pfk_…`) carries permissions, grouped as live, parks, rides, stats, forecasts,
planner and travel (`API_PERMISSION_GROUPS`, 19 in all). Without a key a caller reads
`live.waits`, a park's `/wait-times`, and nothing else (`KEYLESS_PERMISSIONS`). Weather, opening
hours, seasons, ride heights, minimum height and URLs, the directory and search all need a key.

`PERMISSION_ROUTES` lists the routes each opens; the portal, the request form and the admin's
picker read the same list. The ids must match the API's `src/api-keys/permissions.ts`, which
also serves the catalog at `/v1/api-keys/permissions`. The park and ride detail drop the fields a
key has no permission for instead of refusing the whole answer.

A key from before permissions has `permissions: null` and reads everything
(`LEGACY_KEY_PERMISSIONS`); the admin marks it and gives it a list on the next edit. The site's
own key has usage `internal` and reads everything too.

## Tiers and the credit

`requestTier()` decides it, here and in the API alike: a free key only for an open-source project
whose revenue is `none` or `donations`. Ads, affiliate links, a price, client work or a company
behind it make it paid, under a written agreement. The form shows which tier the answers lead to
before sending.

The credit is chapter 04 of the portal (`#attribution`, `ATTRIBUTION_ANCHOR`): the requirements
(wording, link text exactly `park.fan`, the park's page as target, no `nofollow`, `sponsored` or
`ugc`, in the server's HTML on an indexable page, legible size), a rendered preview, and HTML for
a park page and for a site-wide footer. The request form asks for the URL of the page with the
link, and the Impressum's `#data-use` points to the same anchor.

## Accounts and the dashboard

A developer is an admin account with the role `developer`, ranked below `viewer`, so it reaches
no admin route and no MCP tool; the API enforces that. Registration goes through
`/api/developers/register`, which checks Turnstile and sets the same httpOnly session cookie as the
admin login, without the admin marker cookie. Sign-in uses the admin's `/api/admin/session`. An
account with the role `developer` that opens `/admin` sees a pointer to the dashboard.

The dashboard reads `/v1/developer/overview` through React Query (`DEVELOPER_OVERVIEW_QUERY_KEY`);
a 401 shows the sign-in.

- **Pick-up.** An approved key waits unrevealed (`revealedAt: null`). „Abholen" is a rotation
  with no grace period, which returns the secret once; the dialog cannot be dismissed until the
  developer confirms they stored it.
- **Rotate, end grace, revoke** work on the developer's own keys only; another account's key is a
  404 at the API.
- **Requests**: at most three open per account; an open one can be withdrawn. The owner's note on
  a decision shows under the request.

## Review in the admin

`/admin/api-keys` (owner only) shows the use of all keys (this hour, today, 30 days, the busiest
keys), then the requests, then the keys.

- **Freigeben** opens a dialog prefilled by `approvalDraft()`: the project's name, `commercial` for
  a paid tier, the requested permissions (marked with a dot), the allowance its volume suggests,
  and a note naming the request. Permissions are picked per group, with „alle"/„keine" per group.
  The key goes to the developer's account unrevealed; the owner never sees the secret.
- **Ablehnen** takes an optional reason, which the developer reads on the dashboard. A rejected
  request can be reopened; a decided or withdrawn one can be deleted.
- **„Benachrichtigung mailen"** opens a `mailto:` (`keyDecisionMailto`) in the applicant's
  language that points to the dashboard; it never carries a key. The app sends no mail itself.
- An API without the request endpoints answers 404, and the panel says so instead of erroring.

## What leaves park.fan without a key

The site's relays send the server's key, so they answer only park.fan's own pages
(`isSameOriginRequest`), except a park's wait times (`isKeylessRelayPath`). Favorites and nearby
always go through their relays, never straight from the browser to the API. The MCP tools follow
the same line: `get_park_wait_times` works without a key but leaves out crowd level and
maintenance dates; `search_theme_parks` and `get_park_best_days` need a key, which they send to
the API as the caller's own (`keyGrant`, `lib/agents/forecast-access.ts`).

## Deploying

The frontend ships before the API change: the site must already send `API_DATA_KEY` (a key with
usage `internal`) on every server call and route favorites and nearby through the relays, because
the API enforces the permissions from the moment it deploys.
