# Developer portal (`/developers`)

The page a developer lands on to use api.park.fan: what is open, which scope of a data key opens
what, how to send and check a key, the terms in short, and the form that requests a key. Requests
are reviewed on `/admin/api-keys`, where one becomes a key. Open this page before changing the
scopes, the form, the request store or the review in the admin.

## Pieces

| Concern                                                  | File                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| Scope catalog: scopes, their routes, open routes, limits | `lib/developers/scopes.ts`                                           |
| Request schema, revenue models, derived values           | `lib/developers/key-request.ts`                                      |
| Portal URL and the form's anchor                         | `lib/developers/paths.ts`                                            |
| Request store (private JSON per request)                 | `lib/developers/key-request-store.ts`, `lib/storage/private-json.ts` |
| Public page                                              | `app/[locale]/developers/page.tsx`                                   |
| Request form                                             | `components/developers/key-request-form.tsx`                         |
| Public route (Turnstile, schema, store)                  | `app/api/developers/key-request/route.ts`                            |
| Admin routes (list, decide, delete; owner only)          | `app/api/admin/developer-requests/**`                                |
| Admin review panel                                       | `app/admin/api-keys/_components/key-requests-panel.tsx`              |
| Admin labels, key dialog prefill, reply mails            | `lib/admin/key-requests.ts`                                          |
| Scopes on a key in the admin                             | `lib/admin/api-keys.ts` (`apiStoresScopes`, `effectiveScopes`)       |
| Strings                                                  | `developers` and `landing.developers` in `messages/*.json`           |
| Tests                                                    | `pnpm test:developer-key-requests`                                   |

## Scopes

A data key (`pfk_…`) carries scopes, one per kind of data park.fan makes itself. What the live
sources deliver (wait times, opening hours, weather) and the park directory stay open, because
park.fan holds no rights to them and cannot grant any (`OPEN_API_ROUTES`).

| Scope        | Opens                                                                  | Enforced by the API |
| ------------ | ---------------------------------------------------------------------- | ------------------- |
| `forecasts`  | crowd calendar, best days, yearly predictions, `?forecast=true` fields | yes                 |
| `planner`    | `/plan/day`, `/plan/optimize`, the trip regions' plans and ideas       | yes                 |
| `statistics` | `/stats`, `/stats/hourly`, `/stats/day`, best times, forecast accuracy | not yet             |
| `curated`    | seasons and events, glossary terms per ride                            | not yet             |
| `travel`     | trip regions, hotel areas and travel times, tickets, school breaks     | not yet             |

`API_SCOPE_DEFINITIONS` holds the routes of each, and the portal, the form and the admin's dialog
read the same list, so a scope cannot be offered in one place and missing in another. `enforced`
is what the page says in the badge: „key required" or „key required soon".

Storing and enforcing scopes is the API's job (PAR-1365). Until the API stores them:

- **A key opens what every key opens**: `LEGACY_KEY_SCOPES`, forecasts and planner. The API reads
  a key without a scope list the same way once it knows scopes, so no key issued earlier loses a
  route.
- **The admin sends no scopes.** `apiStoresScopes()` is true only when the key list carries the
  field `scopes`; before that the dialogs say what every key opens instead of offering toggles,
  because an API without the field would refuse it as unknown.

When `api-key-scope-missing` goes live, it joins `API_KEY_ERRORS` and the error table in all six
languages.

## The request form

The form asks what decides the key: who to reach (name, email, organisation), what the project
is (name, website, kind, description of at least 40 characters, open source with the repository
or not), how it earns money, which scopes it needs, how many requests a day, which parks, and
consent to the terms. Turnstile action `developer-key-request`.

- **Revenue is several answers, and `none` stands alone.** `toggleRevenue()` clears the others
  when „none" is ticked and clears „none" when anything else is. Ads, affiliate or paid links, a
  price or subscription, client work and a company product are commercial
  (`COMMERCIAL_REVENUE`), the terms' own examples; donations are not. A commercial answer shows
  the agreement notice before sending, so nobody learns it from a rejection.
- **The schema is the server's.** `keyRequestInputSchema` runs in the route; the form checks only
  what enables the button and marks the fields the route names in `fields` on a 422. A bare host
  becomes `https://…`, a non-http URL is refused, scopes are stored in the catalog's order.
- **Answers:** 201 stored, 403 Turnstile, 409 `already-pending` (an undecided request from the
  same address), 422 `invalid-form` with `fields`, 503 `queue-full` (more than
  `MAX_PENDING_REQUESTS` undecided), 500 `store-failed`. Every answer is `no-store`.

## The store

One private JSON document per request at `developer-requests/<id>.json` in the Blob store, or
under `.data/` in offline dev (`resolveDriver()`), through `lib/storage/private-json.ts`, which
the content-change dates and the contributions' records use too. A request holds a name and an
email address, so only the owner's admin routes read it, an id reaches the store only as a UUID,
and deleting a request deletes the document.

## Review in the admin

`/admin/api-keys` shows the requests above the keys, open ones first; decided ones behind a
switch. Each card shows the answers with commercial or not, open source or not, kind and language
as chips.

- **„Key erstellen"** opens the key dialog with `keyRequestPrefill()`: the project's name, the
  applicant's address, `commercial` when the revenue says so, an hourly allowance from the volume
  (`suggestedRequestsPerHour`, at least the API's default of 1,000, none for the open bracket),
  the requested scopes, and a note naming the request. The parks the applicant typed stand in the
  parks field's hint, to pick from the list.
- **Once the key exists** the request is marked approved with the key's id and prefix. The dialog
  then offers „Antwort mit Key", a `mailto:` with the key, its scopes and allowance, the `curl`
  line, the server-only rule, the credit and the links, in German for a request from the German
  page and in English otherwise. That is the one moment the key exists in clear; nothing stores it.
- **Ablehnen** asks for an optional reason, which the rejection mail carries. A rejected request
  can be opened again. Deleting removes the request, never a key issued for it.

The app sends no mail itself: there is no mail service in this repo, and a key reply from the
owner's own address is what an applicant can answer.

## The old `/developers`

`/developers` was once a list of the agent documents and then answered 308 to the
Swagger UI. That redirect is gone. A browser that followed the 308 may keep going to Swagger from
its cache until it drops the entry; the portal links the same reference.
