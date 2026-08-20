# The admin

`/admin` is a separate application inside this one: its own `<html>`, its own
providers, no next-intl, no theme toggle, `robots: noindex`. It is the surface a
handful of people use to correct what the feeds get wrong, and everything about
its shape follows from that.

## Why it was rebuilt

Three things were wrong at once and each made the next harder to fix.

**There was no authentication.** Every administrative endpoint on
api.park.fan was documented as "protected in production via Cloudflare", which
describes traffic that arrives through Cloudflare and says nothing about traffic
that does not — the API never checked the `pass` parameter it advertised, in any
environment. On this side, the shared password lived in `sessionStorage` and was
attached to every request from client code, so any injected script on the admin
origin could read the one credential that unlocked all of it.

**There was nothing to edit.** `/admin/parks` was a read-only list. Curated ride
profiles were maintained with hand-written SQL against production, matched on
park slug and ride slug together, with a `seeded_at = now()` that had to be
remembered — forget that one column and the correction was written, correct, and
invisible, because it is what the publish job reads to decide whose caches to
drop.

**The same four components existed three times.** `_lib/ui.tsx`,
`media/_components/panel-ui.tsx` and `blog-editor/_components/form-fields.tsx`
each defined a `Section` and a field row, with different padding and different
ideas about where a hint goes.

## Shape

```
app/admin/
  layout.tsx              own document, dark, noindex
  _app/                   providers, session, shell, palette, inspector, nav
  _ui/                    THE component kit — one of each thing
  _lib/                   fetch layer, types, the dashboards' refresh loop
  parks/ attractions/     the editors
  seasons/ history/       cross-cutting views
  account/ users/         identity
  media/ blog-editor/ contributions/   content tools (kept, re-hosted)
  system/ queues/ analytics/ ml/ actions/   monitoring (kept, re-hosted)
```

Three ways to reach everything, on purpose: the sidebar, `⌘K`, and `g`-then-a-
letter. The palette is not a power-user garnish — it is the only practical way to
reach one of 212 parks or one of ~7000 rides, and it searches the **curated**
name, so a park renamed last week is findable under the name it was given.

## Authentication

The session is an opaque token issued by api.park.fan and held in an **httpOnly
cookie** set by this app. The browser never sees it; `/api/admin/[...path]`
turns the cookie into `Authorization: Bearer …` server-side. Consequences worth
knowing:

- Client code sends no credential at all. `adminFetch` is a plain same-origin
  fetch.
- Signing out in one tab signs out in all of them — the next request from any tab
  carries a cookie the server has already dropped.
- An `<img>` can be authenticated, which is why the contribution image endpoint
  no longer needs `&pass=` in its URL (and therefore in browser history, in the
  referrer of anything the page links to, and in this app's access log).
- The proxy moves a re-issued token from a password change into the cookie and
  strips it from the response. Without that, changing your password would log
  you out by succeeding.

Roles are `owner > editor > author > viewer`, ranked rather than enumerated.
Hiding a link a role cannot use is a courtesy; the API is the control.

## Curated fields

The editor is **generated from the backend's field descriptors**
(`GET /v1/admin/content/fields`). Each descriptor carries the value upstream
publishes, the value a human wrote, and the value the API actually serves.
Rendering all three is the entire point: a curated field is a disagreement with
a machine, and the only way to judge one is to see both sides. It is also what
tells an editor that a correction written in March now matches what the sync
publishes and can be removed.

Adding a curated column to the API makes it appear here with no frontend change.
A form written field by field would be a second, drifting copy of which columns
are curatable — and the drift shows up as a field somebody cannot edit and
cannot see why.

Two rules the controls exist to protect:

- **Empty is not zero.** On a curated height, `0` means "there is no minimum at
  all" and empty means "no correction, accept upstream". `NumberInput` keeps
  them apart.
- **A boolean has three states.** `true`, `false`, and "nothing said". A curated
  `false` on `may get wet` is a real correction; clearing it is not the same
  thing.

## Seasons

`park_seasons` is a new table and the editor has two levels, because a season is
very often not a range. Walibi Holland's 2026 calendar is the case: Spooky Days
on five specific October days, Fright Nights on every weekend between 3 October
and 1 November plus three single dates. Stored as a bare range, that tells a
visitor the park is haunted on a Tuesday.

So the range is the outer bound and the calendar underneath is optional. `dates`
is **null or a list, never an empty array** — an empty array would mean "runs on
no day at all", which is what retirement is for, and the API rejects it.

## Two write models, and why they look different

Park and ride data live in the API's database: a save is a row update, it takes
effect immediately, and it is undoable from the history.

Media and blog posts live in **this repository**: images and their sidecars are
committed files, so a save is a branch, a commit and a pull request. That is not
an inconsistency to paper over — it is why the entity media panel is a *view*
with links into the media editor rather than an editor of its own. A save button
that behaved differently from every other save button would be worse than the
extra click.

## Things that will bite

- `app/admin` has **no QueryClientProvider from the `[locale]` tree**. It mounts
  its own in `_app/providers.tsx`. Without one, every `useQuery` throws.
- Do not move the admin under `app/[locale]`. It would pull in the routed-messages
  machinery (`<RouteMessages>`, the generated namespace map,
  `pnpm check:client-messages`) for a surface used in one language.
- The proxy must keep exporting **every verb**. It exported only GET and POST
  before; PATCH and DELETE 405'd at Next without ever reaching the API.
- The API's global `ExcludeNullInterceptor` is exempted for `/admin` paths. It
  strips null object keys everywhere else, and on a curated-field payload the
  nulls *are* the information.
- `pnpm build` is the typecheck. There is no `typecheck` script and CI runs
  neither lint nor tests.

## Related

- [media database](media-database.md) — the other write model
- [glossary](glossary.md) — where the ride-profile term ids come from
- backend: `docs/admin/authentication.md`
