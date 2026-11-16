# Developer portal (`/developers`) and dashboard (`/developers/dashboard`)

The portal tells a developer what api.park.fan serves, which permission of a data key opens what,
who gets a free key, what the backlink must look like and how to send a key. The dashboard is
where a developer registers, files key requests, picks up an approved key and watches, rotates or
revokes it. The owner decides every request on `/admin/api-keys`. Accounts, requests and keys live
in the API (`PArns/v4.api.park.fan`, PAR-1365); this repo stores none of it. Open this page before
changing the permissions, the request form, the dashboard or the review in the admin.

## Pieces

| Concern                                                    | File                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Permission catalog, routes, keyless limits, error codes    | `lib/developers/permissions.ts`                                                                       |
| Request model, tier rule, revenue toggles, suggested limit | `lib/developers/key-request.ts`                                                                       |
| Paths: portal, dashboard, attribution anchor               | `lib/developers/paths.ts`                                                                             |
| Dashboard calls and key state                              | `lib/developers/dashboard.ts`                                                                         |
| Portal page (server, no client JS of its own)              | `app/[locale]/developers/page.tsx`                                                                    |
| Dashboard page (noindex)                                   | `app/[locale]/developers/dashboard/page.tsx`                                                          |
| Sign in and register                                       | `components/developers/developer-auth.tsx`, `app/api/developers/register/`                            |
| Dashboard, key card, request form                          | `components/developers/developer-dashboard.tsx`, `…/developer-key-card.tsx`, `…/key-request-form.tsx` |
| Session proxy for `/v1/developer/*` and `/v1/admin/*`      | `lib/admin/session-proxy.ts`, `app/api/developer/[...path]/route.ts`                                  |
| Admin: usage overview, requests, approve and reject        | `app/admin/api-keys/page.tsx`, `_components/key-requests-panel.tsx`                                   |
| Admin: permission picker and the other key fields          | `app/admin/api-keys/_components/key-fields.tsx`                                                       |
| Admin labels (from `messages/de.json`), approval, mail     | `lib/admin/developer-labels.ts`, `lib/admin/key-requests.ts`                                          |
| Strings                                                    | `developers` and `landing.developers` in `messages/*.json`                                            |
| Terms                                                      | Impressum, `#data-use` (`app/[locale]/impressum/content/`)                                            |
| Tests                                                      | `pnpm test:developer-key-requests`, `pnpm test:forecast-relay`                                        |

## Permissions

Without a key the API answers one route, a park's live wait times. Everything else needs a key
with the matching permission ([the rule](../rules/only-the-wait-times-leave-without-a-key.md)).
There are 19 permissions in 7 groups:

| Group       | Permissions                                                       |
| ----------- | ----------------------------------------------------------------- |
| `live`      | `waits` (also open without a key), `schedule`, `weather`          |
| `parks`     | `directory`, `details`, `seasons`                                 |
| `rides`     | `details` (heights, URLs, area), `profiles` (manufacturer, stats) |
| `stats`     | `live`, `history`, `platform`, `accuracy`                         |
| `forecasts` | `crowd`, `waits`                                                  |
| `planner`   | `day`, `trip`                                                     |
| `travel`    | `regions`, `tickets`, `school-breaks`                             |

`lib/developers/permissions.ts` mirrors the backend's `src/api-keys/permissions.ts` (also served at
`/v1/api-keys/permissions`); the ids must match. `PERMISSION_ROUTES` holds the routes the portal
lists for each. The texts live in `developers.permissions` in all six languages, nested by group
(`items.live.waits`), because next-intl reads a dot as nesting. The admin takes its German names
from the same catalog (`lib/admin/developer-labels.ts`).

A key from before permissions (`permissions: null`) reads everything; the admin marks it as
„Altbestand" and its edit dialog starts with every permission ticked. A key with usage `internal`,
the site's own `API_DATA_KEY`, reads everything too.

## Who gets which key

`requestTier()` decides it the same way in the form and in the API: free only for open source
whose revenue is `none` or `donations` alone. Ads, affiliate or paid links, a price or
subscription, client work, a company product or closed source make it paid, which takes a written
agreement. The tier only labels the request; every request is decided by hand, and an approval
sets permissions, hourly limit, parks and end date.

## The backlink

Chapter 04 of the portal (`#attribution`, `ATTRIBUTION_ANCHOR`) specifies the link a free key
costs, row by row (`ATTRIBUTION_SPEC`): target (the park's or ride's page in the reader's
language, the home page for a view of many parks), link text with the word park.fan, `rel` empty
or `noopener` only, a plain `<a href>` in the server's HTML without redirect, visible, close to the
data, on an indexable page, in apps a visible „Data: park.fan" plus the link on the project's site,
and for as long as the key is used. Then what does not count, how to check it in the page source,
and two snippets built from the locale (`attributionSnippets`). The request form asks for the page
that carries the link and links this chapter; the Impressum repeats the rules in short.

## Accounts

A developer account is an admin account with the role `developer`, ranked below viewer, so the API
lets it reach its own account handlers and `/v1/developer` and nothing else: no admin route, no MCP
tool, no token creation, no TOTP requirement.

- **Register** posts to `app/api/developers/register` (Turnstile action `developer-register`),
  which calls `/v1/developer/register` with the server's headers and the visitor's IP and sets the
  admin session cookie. It sets no admin marker cookie, and `app/api/admin/session` drops it for a
  developer who signs in through the admin form.
- **Sign in** uses the admin's own `/api/admin/session`, TOTP included where the account has it.
- **The session proxy** (`proxySessionRequest`, scopes `admin` and `developer`) forwards
  `/api/developer/*` to `/v1/developer/*` with the cookie's session; only the admin scope revokes
  or rotates sessions.
- A developer who opens `/admin` sees a pointer to the dashboard instead of the admin.

## The dashboard

`DeveloperDashboard` loads `/api/developer/overview` with React Query
(`DEVELOPER_OVERVIEW_QUERY_KEY`); a 401 shows sign-in and registration. Signed in it shows four
tiles (active keys, requests this hour, today, last 30 days, `usageTotals`), a card per key and the
requests.

- **A key card** (`developerKeyState`): `pickup` while an approved key waits unrevealed, then
  `active`, `expired` or `revoked`. Picking up is a rotation with grace 0, which is the only time
  the key appears in clear; the dialog cannot be dismissed by accident. The card shows this hour
  against the limit, the 30 days as bars, last use, end date, permissions and parks, and offers a
  new secret with a grace period (0, 1, 24 or 168 hours), ending the grace early, and revoking.
- **A request** goes through the four steps of `KeyRequestForm`: project, source and money (with
  the tier it leads to), the permissions by group (wait times shown as open), and integration
  (server-side use, caching, the backlink page, terms). At most three can wait per account; a
  pending one can be withdrawn. The owner's note on a decision shows under the request.

## Review in the admin

`/admin/api-keys` (owner only) starts with the usage of all keys: active keys, this hour, today, 30
days and the busiest keys. Then the requests, open ones first, with every answer of the form.

- **Freigeben** opens a dialog prefilled by `approvalDraft()`: the project's name, `commercial`
  for a paid tier, the requested permissions (marked, so additions show), an hourly limit from the
  volume, a note naming the request. The owner picks permissions per group or one by one, sets
  limit, parks, end date, an internal note and a message the developer reads. The API creates the
  key for the developer's account, unrevealed.
- **Ablehnen** takes an optional reason the developer reads. A declined request can be reopened,
  a declined or withdrawn one deleted.
- **Benachrichtigung mailen** (`keyDecisionMailto`) opens the owner's mail client with a short
  note in German or English that points to the dashboard. No mail ever carries a key.
- The key list shows each key's permissions, the developer account, „nicht abgeholt" and legacy
  keys. A key the owner creates by hand belongs to no account and is shown once in the dialog.

An API without these endpoints answers 404 for the requests, and the panel says so instead of
failing, so this repo can deploy first.

## Deploying

The site goes out first, with `API_DATA_KEY` set to a key with usage `internal`. Then the backend,
whose enforcement starts on deploy. Until the API runs with `FORECAST_BYPASS_KEY=off`, the server's
`x-auth-key` opens everything as well.
