# The admin

`/admin` is the surface a handful of editors use to correct what the feeds get wrong: the curated
park and ride fields, seasons, the photo backlog in the park, the ML dashboards. Open this page
before changing anything under `app/admin/` or `app/api/admin/`.

Two standing rules govern it: [the admin holds no credential](../rules/the-admin-holds-no-credential.md)
(session cookie, proxy, Turnstile, the one-step login) and
[an admin list without an action is unfinished](../rules/an-admin-list-without-an-action-is-unfinished.md).
The API side lives in the backend repo:
[authentication](https://github.com/PArns/v4.api.park.fan/blob/main/docs/admin/authentication.md)
(sessions, roles, lockout, the API's own Turnstile check) and
[curation](https://github.com/PArns/v4.api.park.fan/blob/main/docs/admin/curation.md) (what each
curated column means, the write order, seasons, undo, merges).

## Shape

`/admin` is a separate application inside this one: its own `<html>` (`data-admin`, dark,
`robots: noindex`), its own providers, no next-intl, no theme toggle.

```
app/admin/
  layout.tsx                own document
  _app/                     providers, session, shell, ⌘K palette, inspector, nav, login screen
  _ui/                      the component kit: one of each thing
  _lib/                     fetch layer (adminFetch, useAdminQuery), types, formatters, hooks
  parks/ attractions/       the editors
  seasons/ retirement/ duplicates/ history/   cross-cutting curation views
  data-quality/             detectors with an answer button per card
  capture/                  the field screen (below)
  media/ blog-editor/ contributions/          content tools
  system/ queues/ analytics/ popularity/ ml/ actions/   monitoring
  account/ users/           identity
  go/                       a public URL or slugs → the editor that owns it
```

The kit's surfaces are in `_ui/primitives.tsx`, its form controls in `_ui/controls.tsx`. A section
of a page is a `Panel` with a `PanelHeader` and a `PanelBody`. A box inside a panel or a dialog is a
`Tile`, a single big figure a `StatTile`, a label over a value `Meta`. Every pill is a `Chip` in one
of five tones: `severityTone` and `statusTone` map the monitoring words onto them, and
`crowdChipClass` takes the public site's crowd palette, so `moderate` is the same green "Normal"
here as there. Pure formatters live in `_lib/format.ts`, never next to the components.

Everything is reachable three ways: the sidebar, `⌘K` and `g`-then-a-letter
(`_app/admin-shell.tsx`). The palette is the practical way to reach one of hundreds of parks or
thousands of rides, and it searches the **curated** name as well as the upstream one, so a park
renamed last week is found under the name it was given.

## Authentication

The session is an opaque token issued by api.park.fan and held in an **httpOnly cookie** set by
this app; `app/api/admin/[...path]` turns it into `Authorization: Bearer …` server-side
(`lib/admin/session.ts`, `denyUnlessAdmin` for this app's own admin routes). The rule page lists
the four things in that proxy that are load-bearing. Consequences worth knowing:

- Client code sends no credential. `adminFetch` is a plain same-origin fetch.
- Signing out in one tab signs out in all of them: the next request from any tab carries a cookie
  the server has already dropped.
- An `<img>` can be authenticated, so the contribution image route needs no secret in its URL.

Roles are `owner > editor > author > viewer` (defined by the API). Hiding a link a role cannot use
(`useCan`) is a courtesy; the API is the control.

### Bot protection on the login

The login form carries the same Cloudflare Turnstile challenge as `/contribute`, with the same keys:
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` for the widget (`components/common/turnstile-widget.tsx`) and
`TURNSTILE_SECRET_KEY` for the check (`verifyTurnstile`, `lib/security/turnstile.ts`).
`/api/admin/session` verifies the token **before** it forwards anything to api.park.fan, because
the API's throttle and its per-account lockout only count attempts that were already made.

The check also compares the token's **action** (`TURNSTILE_ACTIONS`, `lib/security/turnstile-actions.ts`,
a file without `server-only` so widget and check share it) and its **hostname** (`TURNSTILE_HOSTNAMES`,
comma-separated). A missing secret refuses in production and skips the check in dev, so a local
checkout signs in without a Cloudflare account; a missing hostname list only skips the hostname
check, with a warning. `pnpm test:turnstile` covers both and the cross-surface case. Why each of
these is so is in the rule page; the API's own check, for callers that skip this app, is in the
backend's authentication doc.

A token is single-use, so the form resets its widget in the `finally` of every attempt, and
`canSubmit` waits for a fresh token. If the challenge never loads (an extension, a captive portal,
a proxy that eats `challenges.cloudflare.com`), the form says so and offers a retry that
**remounts** the widget, since there is nothing to reset when the script never arrived. The loader
forgets a failed script promise for the same reason; otherwise every retry would fail instantly.

## The login screen

One `<form>` holds e-mail, password and the six-digit code from the first paint and sends all three
in one POST; the API answers `totp-required` only when an account has a second factor and the code
was left empty. The code field looks like six boxes and is **one input**
(`autocomplete="one-time-code"`, `inputMode="numeric"`, six characters) with the boxes drawn under a
transparent field. Why it is one field and one step, and the three attempts that failed before, is
in [the rule](../rules/the-admin-holds-no-credential.md). `pnpm check:admin-login-form` holds the
shape. Whether 1Password fills all three in one pass can only be tested by a person with a vault.

- The e-mail field takes the focus on mount, not the code field: most accounts have no second
  factor.
- A complete code submits itself, once the fresh Turnstile token is there.
- The two code fields under `/admin/account` (TOTP enrolment) carry `autocomplete="one-time-code"`
  too.

The screen is the photograph, not a card on a wallpaper: the form sits in a column on the left with
a sideways scrim, and the right two thirds of the photo stay untouched; on a phone the scrim runs
downwards. The photo comes from `useHeroPhoto` (`_lib/use-hero-photo.ts`), the homepage's rotation
pool read through `@/lib/media/hero` (the client-safe slice, see
[media database](media-database.md#libmediahero--client-safe)), picked after mount because the
choice depends on the clock. The dashboard uses the same 30-minute window, so the park on the login
screen is the park that greets the editor inside. The two drifting blobs behind the form are the
maintenance page's (`maintenance-drift-*`), masked to the form's side; unmasked they laid a teal film
over the whole photograph.

Inside, the layout paints a faint brand-colour wash from the top so a `Panel` has something to be
lighter than, and `Panel` adds a drop shadow, an inset ring and a one-pixel top highlight.

## Curated fields

The park and ride editors are **generated from the backend's field descriptors**
(`GET /v1/admin/content/fields`, rendered by `_ui/curated-fields.tsx`). Each descriptor carries the
value upstream publishes, the value a human wrote, and the value the API serves; all three are shown,
because a curated field is a disagreement with a machine and the only way to judge one is to see
both sides. It also shows when a correction now matches the sync and can be removed. A new curated
column on the API appears here with no frontend change; a hand-written form would be a second,
drifting list of what is curatable. The park info block proved it: eleven columns (links, contact,
facts) appeared with only two new control types added, `url` and `decimal`.

The editor shows one group at a time, as tabs from each descriptor's `group` in the backend's order
(no tab row for a single group). Each tab counts its corrected fields and, in a primary badge, its
unsaved edits; the save bar lists every change across groups.

The controls protect three distinctions:

- **Empty is not zero.** A curated height of `0` means "no minimum at all", empty means "no
  correction". `NumberInput` keeps them apart.
- **A boolean has three states**: `true`, `false`, nothing said (`TriSwitch`). A curated `false` is a
  real correction.
- **A URL is opened, not just typed.** Every `url` field has a button that opens it in a new tab;
  no validation can check that a link goes where it should.

On the public side the park facts arrive as one `info` object on the park detail payload and render
in `ParkInfoCard` (`components/parks/park-info-card.tsx`), a Server Component that renders nothing
for a park nobody has curated. The same values add street, postcode, telephone and `sameAs` to the
park page's `ThemePark` structured data.

### The features tab: one decision across the whole park

The park editor's **Merkmale** tab (`?tab=features`, `parks/_components/attraction-features-editor.tsx`)
edits five per-ride facts as one table, one chip per column: Fast Pass (`hasFastPass`,
`fastPassPrice`), Virtual Line, Single Rider, Indoor/Outdoor and Typ (`attractionKind`). The generic
editor shows the same columns, but the source is a park's price or info page listing a dozen rides
at once; ride by ride that is forty page views and forty revalidations. The list delivers the
columns raw (`null` = not checked), the select options come from the field descriptors, and edits
survive switching chips.

Save sends one batch PATCH (`/api/admin/content/parks/:id/attractions`) with only the changed rows
and, in each, only the changed fields; each ride keeps its own audit row and undo, and only the
cache eviction and revalidation are batched (backend: curation → editing a whole park's list). The
Fast Pass chip says what the generic editor cannot: that the park has no currency set (the API
serves no price above 0 without one), and that 0 means free, not unknown.

### Seasons

`park_seasons` is edited on two levels because a season is often not a range: the range is the
outer bound and an optional list of dates underneath picks the days. `dates` is `null` or a
non-empty list, never `[]` (the API rejects it). Semantics and the Walibi Holland example are in
the backend's curation doc.

## Two write models

Park and ride data live in the API's database: a save is a row update, effective immediately and
undoable from the history.

Media and blog posts live in **this repository**: a save is a branch, a commit and a pull request
([writing to the media database](media-database-writes.md)). That is why the entity media panel
(`_ui/entity-media.tsx`) is a view with links into the media editor rather than an editor of its
own: a save button that behaved differently from every other one would be worse than the extra
click.

## Field capture: `/admin/capture`

The one screen that assumes a hand rather than a desk. It answers two questions with one list under
two sort orders: what is missing a photograph (ranked, so an afternoon in a park goes to the rides
people look up), and what is in front of me (by distance, with the nearest unphotographed ride on
top).

The ranking is a pure function in `lib/media/photo-backlog.ts` (`pnpm test:photo-backlog`), three
layers deep, each there to survive the loss of the one above:

1. the rank from `/stats.topAttractions`, which covers only the top of a park (ten rows by default,
   eighteen at `topN=30` for Phantasialand);
2. `isHeadliner` from the park payload, for marquee rides `/stats` did not rank and for when the
   cold aggregate times out;
3. today's `peakWaitToday`, last, because at nine in the morning it is zero everywhere.

`/api/nearby` resolves **which park** and is deliberately not the source of the ride list: it drops
rides without coordinates and rides definitively out of season, and the ride that cannot open
before November is the one nobody has photographed. The list comes from `/api/admin/media/backlog`,
which crosses the park payload with the media index server-side and answers a few KB instead of the
65–85 KB park payload over park Wi-Fi.

### Which park, and how fast the position follows

The `in_park` answer of `/api/nearby` names the park by slug and name and carries **no URL** (all
210 parks checked on 2026-09-27). The geo path therefore comes from the first ride URL in the same
answer, or, when the ride list is empty, from a second request with `radius=0`, whose
`nearby_parks` entries carry their URL, matched by slug. Both readers live in
`capture/_lib/use-park-location.ts` and reuse `parkGeoFromUrl`.

A "no park" answer is not final: the first fix is often coarse, so the hook asks again every 15 s
(`RETRY_WITHOUT_PARK_MS`) until a park is found, and „Neu orten" asks at once. Once found, the park
is not asked for again while walking. While the tab is in front the watch publishes every fix and
accepts a cached fix of at most 15 s; a movement gate and a 60 s cache made the nearest-ride card lag
the walk, so neither exists. The watch is released while the tab is hidden.
`pnpm test:capture-location` pins this.

### The park is a row too

Above the ride list sits one row for the park itself; what it uploads carries `ride: null` (the
entrance, a parade, a path dressed for Halloween). It is the one place on the screen where a tag is
chosen by hand: the `season` facet (`halloween`, `christmas`, `winter`, `spring`, `summer`,
`autumn`) from `lib/media/tags.mjs`, rendered by `capture/_components/park-row.tsx`. The other facets
stay off the screen because they can be read off the picture in the evening; which event a park was
dressed for cannot, six months later. The selection survives the upload, since an evening at a
Halloween event is a dozen photographs.

### Three ways to a picture, and why HEIC matters

The camera button carries `capture="environment"`. The library button does not, which on iOS opens
the action sheet (photo library, camera, file picker), the path to a photo cropped or straightened
in the Photos app first; editing is left to iOS.

The file picker is how HEIC gets in: `/contribute` accepts it, the media database does not (`commit`
accepts jpg, jpeg, png, webp, avif and svg), and `compressImage` returns anything under the size cap
untouched. Format is therefore checked before size (`toDatabaseFormat`, `app/admin/_lib/upload-transport.ts`).
Both re-encodes strip EXIF, so capture date and coordinates are written into the sidecar explicitly.

### The queue is the point

A park is the worst network the admin will see. A failed commit becomes a row in IndexedDB
(`capture/_lib/queue.ts`) carrying the blob and everything needed to finish later, retried on the
`online` event and from the footer, never on a timer, because a queue retrying in a dead spot drains
the battery that has to last until closing time. Names are reserved when the shutter closes
(`capture/_lib/naming.ts`), not when the upload succeeds: `commit` writes by path and does not ask,
so two photos of one ride would otherwise both be `troy` and the second would replace the first.

Everything lands with `review: true` ([media database README](../../public/media/README.md)), so
the evening's work is the **Zu prüfen** filter in the media browser.

### The open pull request counts

The media index is built from `main`, and a photo taken today waits in the session's draft pull
request until it is merged. Reading the index alone put every ride photographed today back under
„Fehlt noch" after a reload and named the next photo after the first (measured on 2026-09-27 at
Phantasialand: 10 rides and 12 file names in the PR, none on `main`).

`/api/admin/media/backlog` therefore also reads the session's files (`resolveSession` and
`sessionFiles`, `lib/admin/media-session.ts`). File names join `takenNames`; rides are read out of
the sidecars, never off a file name (`lib/media/session-photos.ts`), and an added sidecar comes whole
in its patch, so this costs no extra request per photo. A ride found there counts as photographed
and carries an „im PR" chip. When GitHub cannot be asked, the backlog answers from `main` with
`sessionChecked: false` and the screen says the list may still hold rides photographed today.

On the phone, reserved names only ever grow, per collection: a backlog refetch (the admin refetches
on focus) or a reload must not drop the names of photos still in the queue.
`pnpm test:capture-session`.

## ML-Zentrale: `/admin/ml`

The page the owner opens to decide something, so above the fold it answers three questions in this
order: what is up for a decision, where which model is better, whether every model and job ran.
Everything comes from one backend call (`GET /v1/admin/ml-overview`); the page derives only wording,
order and bar width (`lib/admin/ml-overview.ts`, `pnpm test:ml-overview`).

- **A ready decision moves to the top** with a green edge; the rest keep the backend's order. The bar
  follows whichever of days and parks is further from the switch rule.
- **Problems sort first in „Läuft alles?"**: failed, late, unknown, warming, running.
- **Times are UTC**, the clock the backend states each cadence in, so the last and the expected run
  can be compared; a model runs for all parks at once, so no park's zone applies. A bare
  `YYYY-MM-DD` in `lastRunAt` is a job that scores a whole day and reads „Tag 10.10.".
- **An unknown state, status or role reads neutral** („unbekannt") instead of breaking the row, so
  the backend can add one first.
- **„Details" is three folds that fetch only while open**: training progress with the CatBoost
  training-vs-live table, the best and worst rides, alerts and anomalies.
- **A decision names its `evaluateOn`** until its frozen `report` exists; then the row shows the
  report (`_components/decision-report.tsx`): the verdict, a „mit Vorbehalt" chip and the failed
  checks when `warning` is set, the window, and per cell the difference, the gate's interval (parks ×
  days) beside the parks-only one, and the weekday, holiday and season mix. The report carries no
  unit, so its figures are bare. A cell with `expect: 'not_better'` backs switching a model off:
  there `worse` and `unclear` are green, `better` is red.
- **„Wird ein Modell schlechter?" is the drift watch** (`drift`, `_components/drift-panel.tsx`): per
  served model the last 7 days against the 28 before, error beside the weekday median's, their ratio,
  q0.8/q0.95 coverage and the crossed thresholds. Absent from the payload, absent from the page.
- **„Wie breit ist die CatBoost-Spanne?" is the band calibration** (`bandCalibration`,
  `_components/band-calibration-panel.tsx`): per lead bucket the pooled factor on `q0.95 − q0.5`,
  coverage before and after, and how many segments borrow the pooled factor. `null` means not fitted
  or expired, and the band is served raw.
- **`?beispiel=1`** shows `lib/admin/ml-overview-fixture.ts` (the approved mockup's values plus an
  invented report, band calibration and drift watch); a 404 from the backend offers it.

## Modellvergleich: `/admin/ml/vergleich`

The page the decision about which model the app serves is made on, written for someone who does not
know what `d5` means: every row is a question the app answers, in plain German with its forecast
distance (`leadLabel`), every cell one circle. The verdicts come from the backend
(`GET /v1/admin/model-comparison`); the page derives only columns for model ids the report forgot to
list and the chart geometry (`lib/admin/model-comparison.ts`, `pnpm test:model-comparison`).

- **`diff` is the model's error minus the reference's; negative favours the model.** Every question
  is `lowerIsBetter`. A `unit: 'rate'` (`cal_rank`) is the share of wrongly ordered day pairs in
  percentage points, so it reads `+2,6 pp` and a cell's own figure `31,2 %` (`formatDiff`,
  `formatError`).
- **Before 14 days of live data most cells are `pending` or `unclear`**, and the page says so above
  the matrix, counting from `window.firstDate`.
- **`?beispiel=1`** shows `lib/admin/model-comparison-fixture.ts`: the mockup's verdicts and real
  Europa-Park archive rows of 2026-10-10; its two `live` blocks are invented to show the interval
  drawing.

## The admin on a phone

- **iOS Safari zooms to any focused input under 16 px and does not zoom back.** The shared controls
  are `text-base sm:text-sm` and `h-11 sm:h-9` (`CONTROL_HEIGHT`; 44 px for a thumb, the desk keeps
  36 px), and one rule in `app/globals.css` scoped to `[data-admin]` covers every hand-written field,
  because a class per field is one somebody forgets.
- **The parks table** drops its header row below `sm` and each row becomes a block, town, ride count
  and season count folded into one meta line. One markup, not a phone-only copy that would drift.
- The dense tables („Läuft alles?", `system`) scroll sideways inside their card; they are read at a
  desk.

## Things that will bite

- `app/admin` mounts its own `QueryClientProvider` in `_app/providers.tsx`; it is not under the
  `[locale]` tree, and without one every `useQuery` throws.
- Do not move the admin under `app/[locale]`: it would pull in the routed-messages machinery
  (`<RouteMessages>`, the generated namespace map, `pnpm check:client-messages`) for a surface used
  in one language.
- The API exempts `/v1/admin/*` from its global `ExcludeNullInterceptor`: on a curated-field payload
  the nulls are the information.

## Related

- [Writing to the media database](media-database-writes.md): the media browser, sessions and uploads
- [Contributions](contribute.md): the moderation queue at `/admin/contributions`
- [Most read](most-read.md#the-admin): `/admin/popularity`
- [Glossary](glossary.md#ride--glossary-link): where the ride-profile term ids come from
