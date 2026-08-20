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
- Before it forwards anything, the proxy **validates** the cookie against
  `auth/me` rather than checking that one is present. Reading a cookie back only
  proves the caller can set a header, so `Cookie: parkfan_admin_session=x` used
  to walk past the check that exists to keep strangers away from the deployment's
  `x-auth-key` — the header api.park.fan reads as "this is our own frontend", and
  therefore as permission to skip the throttler and to believe the forwarded
  address. It is deliberately not the role guard the app's own routes use: the
  two endpoints a session with an open obligation may still reach (the password
  change, the TOTP enrolment) are behind this proxy, and a role floor here would
  be a second, drifting copy of the one the API enforces. The deprecated `pass`
  query parameter is dropped instead of relayed; the admin UI has never sent one.

Roles are `owner > editor > author > viewer`, ranked rather than enumerated.
Hiding a link a role cannot use is a courtesy; the API is the control.

## How it looks, and why

The login screen is the photograph, not a card on a wallpaper. Centring a form
over a picture means scrimming the picture hardest exactly where its subject is,
which is how the first version ended up as a grey rectangle floating on a smear.
The form sits in a column on the left, the scrim runs sideways, and the right two
thirds of the photo are left alone. On a phone there is no room for that, so the
scrim runs downwards instead.

The picture comes from `useHeroPhoto` (`_lib/use-hero-photo.ts`), which is the
rotation pool the public homepage uses, read through `@/lib/media/hero` — the
only client-safe slice of the media database, 21 KB against the 107 KB catalog.
It is picked after mount because the choice depends on the clock and the server
would otherwise pick a different one. The dashboard asks for the **same**
half-hour window, so the park somebody signs in on is the park that greets them
once they are in.

The second-factor step is six boxes rather than one field with wide letter
spacing. The digits live in an array of six, not in a string: clearing the third
digit of a full code has to leave a hole rather than slide the last two along one
box each. Paste anywhere in the row fills the row, and `one-time-code` sits on
the first box only, which is what phone autofill looks for.

Inside, three things carry the surfaces. The layout paints one very faint wash of
the brand colour from the top, so a panel has something to be lighter _than_ — a
`bg-card` panel on a `bg-background` page is a six-percent difference in
lightness and reads as a hairline drawn on a flat sheet. `Panel` adds a drop
shadow, an inset ring and a one-pixel highlight along its top edge. And the
dashboard opens on a band of that same photograph, with the three counts its own
queries already return sitting under it.

The two drifting aurora blobs behind the login form are the ones the maintenance
page uses. They are masked to the side the form is on: a blurred blob at that
size covers the viewport whatever its opacity, and unmasked it laid a teal film
across the photograph and undid the reason it is there.

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
- **A URL is opened, not just typed.** Every `url` field has a button next to it
  that opens the address in a new tab, because the one thing no validation can
  check is whether the link goes where it should. A curated link nobody ever
  clicked is how a park page ends up pointing at a parked domain.

The claim that a new column needs no frontend change was tested by the park info
block: eleven columns (website, tickets, Wikipedia, three social profiles,
street, postcode, phone, opening year, area) appeared in the editor under
Links / Contact / Facts with nothing changed here but two new control types —
`url`, and `decimal` so an area can keep its digit after the point.

On the public side they arrive as one `info` object on the park detail payload
and render in `ParkInfoCard` — a Server Component, inline in the first HTML, and
absent entirely for a park nobody has curated rather than an empty frame. The
same values fill in what the park page's `ThemePark` structured data could not
state before: a street, a postcode, a telephone, and `sameAs` pointing at the
park's own site and profiles.

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
an inconsistency to paper over — it is why the entity media panel is a _view_
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
  nulls _are_ the information.
- `pnpm build` is the typecheck. There is no `typecheck` script and CI runs
  neither lint nor tests.

## Related

- [media database](media-database.md) — the other write model
- [glossary](glossary.md) — where the ride-profile term ids come from
- backend: `docs/admin/authentication.md`
