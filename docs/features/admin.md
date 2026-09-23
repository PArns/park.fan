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

## Bot protection on the login

The login form carries the **same Cloudflare Turnstile challenge `/contribute`
uses**, with the same two keys — `NEXT_PUBLIC_TURNSTILE_SITE_KEY` for the widget
and `TURNSTILE_SECRET_KEY` for the check. The widget lives in
`components/common/turnstile-widget.tsx`, the verification in
`lib/security/turnstile.ts`; neither is under `contribute/` any more, because
two surfaces now use them.

`/api/admin/session` verifies the token **before** it forwards anything to
api.park.fan. That ordering is the value of the whole thing. Everything behind
it only starts counting once an attempt has been made: the API's throttle is ten
attempts a minute per address, and the per-account lockout trips after a handful
of wrong passwords. The lockout in particular is a weapon pointed the wrong way
— anybody who knows an editor's e-mail address can spend that account's attempts
whenever they like and keep the person who owns it out. Turnstile is what puts a
price on the attempt itself, and it is charged before either counter is touched.

**`success: true` is not the answer to "may this request proceed".** Cloudflare
confirms that a token is genuine; it says nothing about which form it was solved
on. Two further fields settle that, and both are checked:

- **action** — the label the widget was rendered with (`TURNSTILE_ACTIONS` in
  `lib/security/turnstile-actions.ts`, its own file with no `server-only` so the
  widget and the check can share it across the client boundary). `/contribute`
  is a challenge anybody may solve as often as they like, and it shares this
  widget, so without this check the upload form is a token vending machine for
  the admin login.
- **hostname** — where it was solved, against `TURNSTILE_HOSTNAMES`. A token
  farmed on a copy of the login page hosted elsewhere is a genuine token, and
  this is what refuses it.

The two "not configured" cases are deliberately asymmetric. A missing secret
refuses in production, because there is then nothing to verify with. A missing
hostname allowlist **skips** its check — Cloudflare's own snippet refuses
everything instead, which is right for a fresh integration where setting the
variable is part of the same task, and wrong here: an unset variable would take
the upload form and the admin login down on the deploy that shipped it, with no
way in to fix it. `pnpm test:turnstile` covers both, and the cross-surface case.

Two consequences that are easy to trip over:

- **A token is single-use**, and one login is now one token. It used not to be:
  an account with two-factor signed in over two requests and spent a token on
  each, so the challenge ran twice for one sign-in. One form and one request
  (below) means one solve. The form still resets its widget in the `finally` of
  every attempt, successful or not, because a second attempt after a wrong
  password needs a token Cloudflare has not already retired — which is why
  `canSubmit` includes it and why the button spins while the challenge is still
  running.
- **A missing secret in production is a hard failure**, by design and now on one
  surface more than before. `verifyTurnstile` refuses rather than waving traffic
  through, so an unset `TURNSTILE_SECRET_KEY` on the frontend deployment locks
  the admin out rather than leaving it unguarded. In dev, an unset secret skips
  the check entirely, so a local checkout signs in with no Cloudflare account.

**This side is not the only side, and it could not be.** `POST
/v1/admin/auth/login` is public and reachable directly, so a bot that skips this
app entirely never meets the challenge — the check here defends the path a
browser takes and only that path. api.park.fan asks for a solved token too, of
every caller that does **not** present a valid `THROTTLE_BYPASS_KEYS` value (see
its `docs/admin/authentication.md`). This app is exempt from that because it
cannot comply: a token may be redeemed once, and it redeemed it here. Making the
API the only verifier would mean forwarding the token instead of checking it,
and both repositories would have to be deployed in the same minute for anybody
to sign in. So the split is deliberate — we verify for ourselves, the API
verifies for everyone else, and one shared header decides which is which.

If the challenge itself never loads — an extension, a captive portal, a proxy
that eats `challenges.cloudflare.com` — the form says so and offers a retry that
**remounts** the widget rather than resetting it: there is no widget to reset
when the script never arrived, which is the case the button exists for. The
loader forgets a failed script promise for the same reason, or the first failure
would be cached and every retry would fail instantly without a request.

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

The second-factor field looks like six boxes and is **one input**. The boxes are
drawn — a transparent field lies over the whole row and the cells underneath
render what is in it, with a caret in the one that is next. Six boxes is still
the right picture: it is what makes "which digit am I on" answerable at a glance,
and a mistyped digit costs one backspace instead of a re-read.

The six real `<input>`s it replaces could not be autofilled, and the reason is
worth keeping. Each took `value.replace(/\D/g,'').slice(-1)` on change, which is
exactly right for a person typing one digit into one box. A password manager does
not type: 1Password writes all six characters into the first box in a single
event, the slice kept the last of them, and what came out was a lone `6` in box
one and five empty boxes. No error and nothing in the console — it read as a fill
that had missed. One field carries everything a manager, iOS and Android actually
look for (`autocomplete="one-time-code"`, `inputMode="numeric"`, a six-character
limit).

### There is no second step, and that took three tries to arrive at

The code field used to be a second screen. The login asked for e-mail and
password, sent them, and drew the six boxes once the backend answered
`totp-required`. No password manager would fill them there, and three tickets
tried to fix that by changing what the second form looked like:

| Ticket  | Theory                                                            | Shipped as                                                                                                | Vault test                                            |
| ------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| PAR-291 | A manager needs a username to match the code against              | a hidden `readOnly` `autocomplete="username"` field beside the code, and a per-step `key` on one `<form>` | negative                                              |
| PAR-345 | It fingerprints origin plus field list, so remount is not enough  | two sibling `<form>` elements sharing no node, position or field list                                     | negative                                              |
| PAR-404 | The hidden username field is itself what trips the login detector | that field removed, leaving the code as the only input on the step                                        | negative — no one-time-code suggestion offered at all |

Three theories about the shape of the second form, three negatives. The
assumption they share is the one that was wrong. 1Password's own form design
guidelines say it plainly: _"Don't dynamically add or remove fields from the
DOM. Reuse fields and hide them when you don't need them"_, and _"group related
fields (like usernames and passwords) together in the same `<form>` element"_.
An extension fills a login from what is in the document at the moment it looks.
A field that only exists after a round trip was never part of that login, and no
amount of shaping it afterwards makes it one.

So the second step is gone (PAR-405). One `<form>` holds e-mail, password and
the code from the first paint, and one POST carries all three. **The backend
needed no change**: `AdminAuthService.login()` answers `totp-required` when an
account has a second factor and the request carried no code — it is a reply to
something missing, never a step the API insists on. An account without a second
factor leaves the field empty, gets `ok`, and never sees that answer; an account
with one that submits without a code gets it, and the field is already on screen
to say so in.

Two things follow. A login with a second factor now solves Turnstile **once**
instead of twice — the token is single-use, so two requests meant two
challenges. And the abandoned-step race (PAR-305) is gone with the button that
caused it: "Andere Anmeldung" let somebody leave the code step while an attempt
was in flight, and `needsTotpRef`, `answersTheCurrentStep` and `leaveTotpStep`
existed to keep that answer from being applied to the form they had moved on to.
None of them survive a single step.

The code field takes no focus on mount — the e-mail field does. Most accounts
have no second factor and never touch it, and a caret that starts in the third
field of three starts in the wrong one.

Whether 1Password now fills all three in one pass is, as every time before, a
question about an extension that only a person with a real vault can answer. The
half that _is_ checkable has a check: `pnpm check:admin-login-form` asserts that
the three fields are in the document at the first paint, that they share one
form, that the code field carries `autocomplete="one-time-code"`, that nothing
but the e-mail claims to be the username, that the caret starts in the e-mail
field, and that filling all three sends exactly one POST carrying all three. It
replaces `check-admin-login-step.mjs`, which asserted the split this removed.

A complete code submits itself. That is the other half of making the field
fillable rather than a flourish — six pasted digits sitting behind a button have
saved nobody the typing they came to avoid, and on a phone the keyboard is
covering that button anyway. It waits for the fresh Turnstile token, so a code
that lands first goes as soon as the token does.

The same `autocomplete="one-time-code"` is on the two code fields under
`/admin/account`, where the enrolment link hands the secret to the manager and
the field below it is where the first code comes back.

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

The editor shows one group at a time, as a row of tabs taken from each
descriptor's `group` in the order the backend sends them, today seven for a
ride and seven for a park. With only one group there is no tab row. Each tab counts its
corrected fields, and a primary-coloured badge counts the unsaved edits in it,
so an edit in a group that is not open is still visible; the save bar keeps
listing every change across all groups.

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

## Fastpass, quer über den ganzen Park

Die drei Bahnspalten (`hasFastPass`, `fastPassName`, `fastPassPrice`) und die vier Parkspalten
(Name, Währung, Ab-Preis, Glossarbegriff) erscheinen im generischen Editor wie jedes andere
kuratierte Feld. Trotzdem gibt es dafür einen eigenen Tab auf der Parkseite, und der Grund ist die
Vorlage, aus der abgeschrieben wird: Die Preisseite eines Parks listet zwölf Bahnen auf einmal.
Bahn für Bahn zu öffnen heißt vierzig Seitenaufrufe für eine Entscheidung, und vierzig Speichern
heißt vierzig Revalidierungen ans Frontend.

Der Tab schickt deshalb einen Sammel-PATCH (`/api/admin/content/parks/:id/attractions`) mit nur den
geänderten Zeilen. Jede Bahn bekommt darin ihre eigene Protokollzeile — rückgängig geht weiter
einzeln —, gebündelt werden nur Cache-Leerung und Revalidierung.

Zwei Dinge, die der Tab sagt und der generische Editor nicht sagen könnte: dass dem Park die
Währung fehlt (ohne sie liefert die API keinen Preis über 0 aus), und was 0 bedeutet — kostenlos,
nicht „kein Preis". Leer heißt unbekannt und bleibt leer, wo der Park tagesabhängig bepreist.

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

## Vor Ort — `/admin/capture`

The one screen in here that assumes a hand rather than a desk. It answers two
questions, and the whole design follows from the fact that they are two:

- **What is missing a photograph?** Ranked, so an afternoon in a park is spent on
  the rides anybody looks up.
- **What is in front of me?** The same list, sorted by distance, plus the nearest
  unphotographed ride pulled out on top.

One list under two sort orders rather than two lists. The ordering itself is a pure
function in `lib/media/photo-backlog.ts` with `pnpm test:photo-backlog` behind it,
because it is three layers deep and each layer exists to survive the loss of the one
above it:

1. the rank from `/stats.topAttractions` — measured, it answers with **ten** rows by
   default and eighteen at `topN=30` for Phantasialand, so it covers the top of a
   park and nothing else;
2. `isHeadliner` off the park payload, for the marquee rides `/stats` did not rank,
   and for the case where the cold aggregate times out entirely;
3. today's `peakWaitToday` — which at nine in the morning is zero for the whole
   catalogue, which is exactly why it ranks last and never first.

`/api/nearby` resolves **which park**, and is deliberately not the source of the
ride list: it drops rides without coordinates and rides that are definitively out
of season, and the ride that cannot open before November is precisely the one
nobody has ever photographed. The list comes from `/api/admin/media/backlog`, which
crosses the park payload with the media index server-side and answers a few KB
instead of the 65–85 KB park payload over park WLAN.

### The park is a row too

Above the ride list sits one row for the park itself, and everything it uploads carries
`ride: null` — the entrance, the parade, the Halloween dressing of a path. None of that
belonged to a ride, and until it had a row of its own the field screen was the one way
into the database that could not produce it, because every input on the screen hung off
a ride in the backlog.

It is also the one place on this screen where a tag is chosen by hand. The vocabulary's
`season` facet (`halloween`, `christmas`, `winter`, `spring`, `summer`, `autumn`) is read
from `lib/media/tags.mjs`, the same list the media browser offers, and the chips are
rendered by `_components/park-row.tsx`. The other five facets stay off this screen: 49
chips is a desk's worth of decisions, and subject, weather and light are all readable off
the picture in the evening. Which event a park was dressed for, six months later, is not
reliably readable off anything — and it is what makes the photo findable for a post.

The selection survives the upload rather than resetting with it: an evening at a Halloween
event is a dozen photographs, not one.

### Three ways to a picture, and one of them is why HEIC matters

The camera button carries `capture="environment"` and opens the camera. The library
button does not, which on iOS opens the action sheet — Fotomediathek, Aufnehmen,
Datei auswählen — and that is the path to a photograph that was cropped or
straightened in the Fotos app first. Editing lives there, not here: iOS already
has a better editor than anything worth building in a web view.

Which is how HEIC gets in. `/contribute` accepts it; the media database does not —
`commit`'s extension check lists jpg/jpeg/png/webp/avif/svg. Safari usually converts
on the way out, but "Datei auswählen" does not, and `compressImage` returns anything
under the size cap **untouched**, so a 2 MB HEIC used to sail through analysis,
shrink and upload and fail on the last line with `Bad extension "heic"`. Format is
asked before size now (`toDatabaseFormat`), and both re-encodes strip EXIF, which is
why capture date and coordinates are written into the sidecar explicitly.

### The queue is the point

A park is the worst network this admin will ever see. A failed commit is not an
error message, it is a row in IndexedDB carrying the blob and everything needed to
finish later, retried on the `online` event and from the footer — never on a timer,
because a queue that retries in a dead spot empties the battery that has to last
until closing time. Names are reserved when the shutter closes rather than when the
upload succeeds: `commit` writes by path and does not ask, so two photographs of one
ride would otherwise both be called `troy` and the second would replace the first.

Everything lands with `review: true` (see [media database](media-database.md)), so
the evening's work is a filter in the media browser rather than a memory.

## The admin on a phone

Two things were actually broken, and neither was a layout.

**iOS Safari zooms the page to meet any focused input under 16 px and does not zoom
back on blur.** `text-sm` is 14. So the first tap on the login field left the whole
admin at 1.3× with a horizontal scrollbar and a pinch as the only way out. The
shared controls say `text-base sm:text-sm` and `h-11 sm:h-9` — 44 px is the smallest
target a thumb hits reliably, and the desk keeps the 36 px off the button scale. The
remaining ~40 hand-rolled fields are caught by one rule in `globals.css` scoped to
`[data-admin]`, because a class per field is a class somebody forgets on the next
one and the failure is only visible on a real phone.

**The parks table is five columns.** Below `sm` its header row goes away and each
row becomes a block: town, ride count and season count are hidden and reappear as
one line of meta under the park's name. One markup, not two — a phone-only
component rendering the same parks would drift, and the half nobody looks at on a
laptop would be the half that rots.

The dense monitoring grids (`ml`, `system`) scroll sideways instead. That page is
read at a desk, and "you can still get at it" is the honest answer rather than a
redesign nobody asked for.

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
