# Media database

One filesystem-backed database for every image the site uses — park photos, ride
photos, blog galleries, diagrams. It replaced three separate systems that each had
their own folder layout, their own generator and their own metadata format:

| before                                                                                  | after                                     |
| --------------------------------------------------------------------------------------- | ----------------------------------------- |
| `public/images/parks/<park>/<ride>.jpg`                                                 | `public/media/<collection>/<name>.jpg`    |
| `public/blog/images/<folder>/` + `captions.json` × 6 locales                            | one sidecar per image, all locales inside |
| `lib/hero-images.ts`, `lib/hero-images-meta.ts`, `lib/attraction-images.ts` (generated) | `lib/media/manifest*.ts` (generated)      |
| `generate-hero-images`, `generate-attraction-images`                                    | `generate:media`                          |
| `fs.existsSync` probing at request time (`park-assets.ts`)                              | a map lookup in the manifest              |

**The authoring contract lives next to the files: [`public/media/README.md`](../../public/media/README.md).**
Read that first — it covers the sidecar format, roles, tags and the focal point.
This document covers how the rest of the app consumes it.

---

## 1. The organizing idea

> A collection is storage. The sidecar is the index.

Nothing queries by folder. An image says what it _shows_ (`park`, `ride`, `area`,
`tags`) and what it is _used for_ (`roles`), and every consumer asks a question
rather than walking a path. A Halloween photo of Troy therefore appears in the blog
gallery it was shot for **and** on Troy's ride page, without being stored twice.

That is also why "blog image" is not a category here. It was the distinction that
forced the same photo to exist in two places; it is now a tag at most.

---

## 2. Reading it

### `@/lib/media` — structure, lookup, search

No `fs`, no `server-only`: it reads the build-time manifest, so it works in Server
Components, route handlers and scripts alike.

```ts
import { getRideImage, getRideImages, getParkBackground, searchMedia } from '@/lib/media';

getParkBackground('europa-park'); // the park's full-bleed photo
getRideImage('toverland', 'troy'); // the canonical ride photo
getRideImages('toverland', 'troy'); // ALL photos of that ride, any collection
getParkOnlyImages('walibi-holland'); // park-level tier: park set, no ride
getHeroImages('toverland'); // hero rotation, optionally per park
searchMedia({ q: 'arach', tags: ['night'] });
```

### `@/lib/media/text` — localized alt/caption

**Kept separate on purpose.** `manifest-text.ts` is six locales of prose for every
image (~37 KB); a route that only resolves a path or runs a search must not pay for
it. Same split as `@/lib/blog/listing` vs `@/lib/blog`.

### `@/lib/media/hero` — client-safe

The hero rotation runs in Client Components, so this module reads a generated ~21 KB
slice (`manifest-hero.ts`) holding only the hero images and only the caption fields.
**Never import `@/lib/media` from a Client Component** — that ships the ~107 KB
catalog to every visitor.

### `@/lib/media/focus` — one crop rule for every surface

`objectPositionForSrc(src, fallback)` resolves an image's focal point to a CSS
`object-position`.

**This module is NOT client-safe** — it imports `./index`, which imports the
manifest, so it is `@/lib/media` with extra steps. The rule above names
`@/lib/media` and `@/lib/media/text`; `focus` belongs on that list, and its absence
is how 80 KB of catalog ended up in the homepage bundle once already.

So a **card never resolves its own photo or focal point**. Both are handed in:
`enrichParksWithImages` / `enrichAttractionsWithImages` attach `backgroundImage` and
`backgroundPosition` together, `getCardObjectPosition` serves direct server call
sites, and the two API proxies that feed client-rendered grids (`/api/discovery`,
`/api/parks/[...path]`) enrich on the way out. `ParkCard`, `AttractionCard`,
`CardPhoto` and `ParkBackground` import nothing from `lib/media` at all.

The cheap check, after a build:

```sh
grep -l "avatar-flight-of-passage/01-hoehlen" .next/static/chunks/*.js   # must be empty
```

A **pre-cut crop** (`…-16x9.jpg`) answers as the image it was cut from — same
credit, same content version — but gets `50% 50%`, not the focal point: the crop was
already cut around that point at build time, and offsetting it again in CSS would
apply the correction twice. `versionedPath(src)` attaches `?v=` to any media path,
crops included; blog `coverImage` frontmatter points straight at a crop, and that is
exactly the file whose bytes get rewritten under an unchanged URL when someone
retargets a focal point.

#### The card photo is two layers, and that is what makes Y work

`object-fit: cover` scales to the **larger** of the two ratios it needs, so it
overflows on one axis and fits exactly on the other. Paint a photo across a whole
card — 405 × 404, aspect ≈ 1.0 — and a landscape photo (4:3, aspect 1.33) fills the
card's _height_ exactly. There is then no vertical overflow, so the Y half of
`object-position` has nothing to move: the focal point renders byte-identical pixels
however far you drag it. Nothing errors, and the build is green.

The framing reference is therefore the **strip the two glass panels leave visible**,
not the card:

- `CardPhotoFrame` lives inside the card's photo-spacer row — 405 × 220, aspect 1.84
  — so a 4:3 photo overflows it by ~84 px and the focal point moves the subject
  through that range. This is the layer a visitor sees and the one the admin tunes.
- `CardPhoto` still covers the whole card underneath, so the frosted panels keep
  something to blur and no gradient band shows through the glass. Its crop is never
  the reference; it is only ever seen through 16–18 px of backdrop blur.

Same URL for both, so it is one request and one decode — the second layer costs a
composite, not a download. Their seam falls under a glass panel, whose own blur
smears it away; where a card renders **no** bottom panel (a ride with no live wait
time) the spacer takes `row-span-2` so the framed layer claims that row too, instead
of leaving its lower edge exposed mid-card.

`pnpm check:card-framing` asserts the invariant against a running site, across ride,
park, blog and home surfaces. It checks the **box** of every card that has a bottom
panel, not the photo in it: a picture that is natively 16:9 has no vertical range in a
1.67 box and never can, which is a property of that picture, and a card with no bottom
panel is legitimately squarer because the whole card is the visible photo there. What
must not happen is a panelled card's box going square — a third badge row or a taller
footer can quietly do that, and then every landscape photo loses its Y axis at once,
with nothing else to notice.

---

## 3. Generated files

`pnpm generate:media` walks `public/media` and writes:

| file                 | size    | holds                                                                |
| -------------------- | ------- | -------------------------------------------------------------------- |
| `manifest.ts`        | ~107 KB | structural rows: paths, size, park/ride, roles, credit, focus, crops |
| `manifest-text.ts`   | ~37 KB  | localized alt/caption per id                                         |
| `manifest-search.ts` | ~81 KB  | the search index (below) + `MEDIA_REVISION`                          |
| `manifest-parks.ts`  | small   | park name/city/country per park, from the API catalog                |
| `manifest-hero.ts`   | ~21 KB  | the client-safe hero slice                                           |

It runs in `prebuild`, **after** `generate:image-crops` — the manifest records which
crops exist, so the structured-data image set never advertises a file that was not
cut, and needs no filesystem probe at request time.

`manifest-parks.ts` is **committed**. It is regenerated only when the API catalog is
reachable, and otherwise left alone: an offline build keeps the last known park
names instead of silently dropping every hero caption, which is exactly how the old
hero generator lost ride names on a single transient API blip.

### The search index

Two structures, because word-prefix and substring search have different right
answers:

- an **inverted index** — a sorted token vocabulary plus postings. A prefix query is
  a binary search and a short forward walk, so cost tracks the number of matches,
  not the number of images. This is what keeps search flat as the database grows.
- a flattened **haystack** per image, as the fallback for a query that starts
  mid-word (`phobia` → Arachnophobia), which no prefix index can answer.

Both fold diacritics, so `grun` finds `grün`. The tokenizer is shared between the
generator and the query side (`lib/media/tokenize.mjs`) — if the two ever disagreed
on what a token is, search would quietly stop matching with nothing broken.

### Build-time validation

The generator is the only thing standing between a typo and a silently missing
image, so it checks and reports:

- unknown park or ride slugs, against the live catalog (skippable with `MEDIA_VERIFY=0`)
- ambiguous park slugs used without `parkPath`
- two images claiming the same `park-background` or `ride-card`
- tags outside the vocabulary, and clashes within an exclusive facet
- how many images still have `license: unknown` or no park

---

## 4. Caching

The database changes only when a deployment ships, which lets it be cached harder
than anything else on the site — but only with one precaution.

**Image URLs carry `?v=<content hash>`.** The hash covers the file bytes _and_ the
focal point. Without it, retargeting a focal point rewrites a crop's bytes at an
unchanged URL, and the CDN plus the Next image optimizer (`minimumCacheTTL` is one
year) would serve the old framing indefinitely. A global build id would work too but
would bust every image cache on every deploy; this token moves only when that
image's pixels do.

`next.config.ts` needs `images.localPatterns` to allow the query on a local image —
an omitted `search` means "any query", which is why `/media/**` has its own entry
and everything else keeps the default no-query rule.

**`/api/media` is cached a day fresh, a week stale-while-revalidate**, with a strong
ETag built from `MEDIA_REVISION` and the query. Note that the route must stay
`force-dynamic`: it is driven entirely by query parameters, and `force-static`
prerenders one response with an empty query and serves it for every request — which
silently returned the whole catalog for every filter. The `Cache-Control` also has
to be repeated in `next.config.ts`'s `headers()` **after** the blanket `/api`
no-store rule, or the route handler's own header is clobbered.

---

## 5. HTTP API

For the native app and any external client.

```
GET /api/media?q=&park=&ride=&collection=&tag=&role=&license=&limit=&offset=&locale=
GET /api/media?facets=1          → tag/park/collection counts + stats
GET /api/media/<collection>/<name>?locale=en
```

`park=` and `ride=` accept an explicit empty value meaning "has none" — that is how
a client asks for the park-level tier.

Each image serializes with a versioned URL, resolved alt/caption for the locale, a
formatted credit line, the park's name and page path, the focal point (so a client
cropping to its own aspect ratio can honour it) and the pre-cut variants. `revision`
is in every payload, so a client can ask "did anything change?" in one conditional
request instead of re-downloading.

`/api/image?park=&attraction=&w=&q=` stays for clients that just want bytes at a
size; it now resolves through the database and redirects to the optimizer.

---

## 6. The admin browser — `/admin/media`

Searchable, filterable grid over the whole database. The quick filters are the
maintenance backlog made visible: rights unknown, no park, low resolution, no focal
point, no alt text.

**Editing** covers every sidecar field, plus moving an image to another collection
(which renames the file and its sidecar).

The editor is a dialog with a pinned header and footer and a scrolling body, because
the two things you always want reachable were the two furthest apart: the title
scrolled away upward while Save sat at the bottom of a twelve-field column. From `lg`
up the two halves scroll **independently** — the framing previews are tall, and one
shared scroll pushed the metadata a screenful away from the picture it describes,
which is the pairing the editor exists for. The fields are grouped by the question
each answers (what it shows · how it is used · tags · words · rights) rather than
stacked flat, where a park slug carried the same weight as a caption.

Everything is edited in memory until Save opens a pull request, so the header carries
an **unsaved** badge, Save is disabled while the draft matches the row, and closing a
dirty draft — X, Escape or a backdrop click — asks first. Escape closes the catalog
picker before the editor when both are open.

**The focal-point editor** previews the result in the **real** cards the site
renders — `AttractionCard`, `ParkCard`, `BlogPostCardView`, `ParkBackground` — rather
than look-alike boxes that could agree today and drift next month. They share one
grid with a pinned 220 px photo track and `grid-template-rows: subgrid`, because that
is the only arrangement that reproduces the real box: give each card its own template
and the photo track absorbs the slack, the box comes out taller than wide, and the
preview lies about the focal point having no effect.

**Replacing the file** (the low-res upgrade path) is the bar above the previews: the
current resolution, and a **drop zone** that swaps the bytes while the id, the sidecar
and every reference to the image stay put. The whole bar takes a drop, not just the
button — an upgraded photo comes from a file manager, so dragging it here is the
shortest path from "this one is too small" to a pull request; clicking anywhere on it
opens the picker instead. A multi-file drop is refused rather than silently using the
first, which is how the wrong photo ends up on a ride. The grid labels the images that
need it — `1024×768 · replace` — rather than marking them with an icon that says
nothing about the fix existing.

**A dropped file is staged, not sent.** It appears in the bar as pending — thumbnail,
name, `1200×900 → 4000×3000`, size — and goes out with the next **Save**, in the
_same_ operation as everything else that was edited. Committing on drop, which this
used to do, made swapping a photo and fixing its caption two commits, and the first
one closed the editor so the caption had to be found again. Staging is also what lets
the alt text and the focal point be set **for the new picture**: while a file is
staged, the focal-point editor and the header thumbnail show it rather than the one it
is about to replace.

Saving then reports back **in the dialog** — "Uploaded and saved", a link to the pull
request and the summary line the PR itself records — instead of closing and leaving a
toast behind. After dropping a 6 MB original, whether the file actually went up is the
one thing worth confirming. The footer says what Save is about to write before you
press it, too (`Will be saved: replace the file with …, alt text`).

Two mechanics worth keeping: the zone is a `div` with an explicit click, **not** a
`<label>` wrapping the input — a label implicitly activates its control, and a drop
landing on it forwarded that activation and tore the panel down mid-drop. And
`dragleave` checks `relatedTarget`, or the highlight flickers off every time the
pointer crosses the icon or the text inside the zone.

### One session, one pull request

A **session** is the branch starting with `media/session-` and the pull request opened
for it. Every save joins it — retagging a shoot is twelve commits in one reviewable
PR, not twelve pull requests. The state lives in git, not in the browser, so a reload,
a second tab and a different machine all land in the same place; `GET
/api/admin/media/session` is what the banner at the top of the browser reads.

It ends the way it began: merge or close the PR, and the next save opens a new one.
**Start a new pull request** in that banner is the early exit, and sends
`newSession: true` with the next commit.

**Finding the right pull request is the whole mechanism** — pushing straight away is
fine, as long as the next save lands as another commit on the one that is already
open. Resolution lives in `lib/admin/media-session.ts`, shared by the commit endpoint
and the banner, and it has to tell four states apart:

| state                                | how it got there                                  | verdict             |
| ------------------------------------ | ------------------------------------------------- | ------------------- |
| open PR with the prefix              | the normal case                                   | **that is it**      |
| branch exists, never had a PR        | commits landed, opening the PR failed (the `207`) | **adopt it**        |
| branch exists, its PR was **merged** | shipped; GitHub kept the head branch              | spent — start fresh |
| branch exists, its PR was **closed** | somebody said no                                  | spent — start fresh |

The second row is the hole that produced a pull request per image: looking only at
_open pull requests_ answers "no session", so the next save forks a second branch —
and every save after it does the same. The last two are why adopting cannot be
unconditional: committing onto a merged branch opens a PR whose diff is everything
`main` gained since, inverted.

Two details in the lookup:

- **The open scan does not filter by base.** A session PR retargeted at another
  branch is still the session, and filtering it out opens a second one.
- **The branch is checked by head ref with `state: 'all'`** (`head: owner:branch`),
  because merged and closed pull requests are exactly what the open list cannot see.

And a failed lookup is an **error, not "no session"**. It used to be swallowed with a
console warning, which meant a token or API hiccup silently promoted every save to
"I am the first one". The endpoint now refuses the save and says why, because
committing blind is what opens the duplicate.

`pnpm test:media-session` exercises all of it against a stubbed GitHub. Every way
this function can be wrong shows the same symptom — a pull request per image,
noticed only once a batch has already scattered across a dozen of them.

The banner also answers **what is already in there**: the PR's own log lines and the
files the branch actually touches (`pulls.listFiles`). Adding to a shared pull request
without being able to see its contents is how the wrong thing gets merged, and only
the file list can't be wrong about it.

One subtlety in the commit endpoint: an operation with no sidecar payload has its
sidecar rebuilt from the **build-time manifest**, which describes the base branch —
writing that back would undo a sidecar edit made earlier in the same session. So a
rebuilt sidecar is only written when the path is not already on the branch. Operations
that carry a payload send the complete sidecar, so writing those is always correct.

And one that bit: a sidecar path carries **no extension**, so replacing a `.png` with
a `.jpg` in place leaves the old and new sidecar at the _same_ path. The move cleanup
deleted `from.sidecar` unconditionally, which threw away the sidecar written two lines
earlier and dropped the image out of the database. It is only removed when the two
paths actually differ.

### The token

Saving commits to this repository, so it needs a GitHub token in
`BLOG_EDITOR_GITHUB_TOKEN` (or `GITHUB_TOKEN`). Without it the admin still renders
and edits; only saving fails, and says so. A **fine-grained PAT** scoped to this one
repository with **Contents: read & write** (branches and files) and **Pull requests:
read & write** (open and update the PR) is the whole requirement — `Metadata:
read-only` is added automatically. A classic PAT works but needs the entire `repo`
scope. Full setup notes in `.env.example`.

**Uploading** is drag & drop, and the batch is walked one photo at a time — see
`upload-walkthrough.tsx`. Thirty rows of a table read as bookkeeping: park and ride
get filled in because the form asks, while the fields that need somebody to LOOK at
the picture (the focal point, the alt text, whether it is a night shot) wait for a
pass that never comes. So the batch becomes a queue: one photo large enough to
judge, the EXIF findings beneath it, the ride shortlist as buttons, and the focal
point set by clicking the picture — the one moment every photo is guaranteed to be
in front of someone. `← → S` walk it. Nothing is written until the review step.

**Every file goes up in its own request.** Both halves used to send the whole batch
at once — `analyze` as a single multipart, `commit` as one JSON with every file
base64-encoded — and Vercel rejects bodies over ~4.5 MB, with base64 adding a third
on top. A single 4 MB photo already exceeded it: the admin advertised hundred-image
batches and could not have committed three. It passed every local test because
`next start` has no such limit. Now the body is one image regardless of batch size,
commits run sequentially so the first opens the session pull request and the rest
join it, and an oversized original is shrunk client-side (`_lib/upload-transport.ts`).

Two details that matter there: `analyze` receives only the first megabyte of an
oversized file, because EXIF sits in an APP1 segment right after the header — that
is what keeps the GPS tag readable without shipping 26 MB. And shrinking re-encodes
through a canvas, which **strips EXIF**, so it runs only after `analyze` has read the
original and the GPS and capture date are written into the sidecar explicitly.

The two stages:

1. `/api/admin/media/analyze` reads each file's EXIF and answers where it was taken.
   Nothing is stored.
2. `/api/admin/media/commit` writes the batch as one draft pull request.

The split between what is auto-filled and what is offered is measured, not guessed.
Against the 55 photos in the database that carry both a GPS tag and a known ride:

| question              | nearest match is right | so the admin…                      |
| --------------------- | ---------------------- | ---------------------------------- |
| which park?           | **89 %**               | fills it in (parks are km apart)   |
| which ride?           | **55 %**               | offers a distance-ranked shortlist |
| ride in top 3 / 5 / 8 | 78 % / 87 % / **95 %** | one click, never auto-assigned     |

Auto-picking the nearest ride would mislabel nearly half of every batch _while
looking reviewed_ — worse than leaving it blank. Park and ride stay editable
regardless of what GPS proposed.

GPS also cross-checks existing images: a photo assigned to `europa-park` whose
coordinates land in Kaatsheuvel is flagged. It never rewrites the assignment — the
failure mode of trusting a fix taken from a car park between two resorts is a
confidently wrong label.

### Writes go out as pull requests

The database is the repository, and on Vercel the filesystem is read-only, so the
admin commits to a branch and opens a draft PR — the same mechanism as the blog
editor. For copyright and attribution data, being reviewable and revertible is worth
more than writing in place.

Sidecars written by the admin go through `lib/media/sidecar.mjs`, the same
normalizer the build generator uses, so a UI-saved file and a hand-authored one are
byte-identical and the PR diff stays readable.

---

## 7. What the migration surfaced

Worth knowing, because each was invisible before:

- **`toverland/maximus-blitzbahn.jpeg` was dead.** The old resolver looked for
  `<attractionSlug>.jpg` on disk, and the API slug is `maximus-blitz-bahn`. The
  sidecar names the ride explicitly, so the filename no longer matters.
- **Two park slugs are not unique** (`disneyland-park`, `universal-islands-of-adventure`).
  The Disneyland background turned out to be Paris, not Anaheim.
- **63 of 113 photos still carry GPS and a capture date**, which is where the park
  verification and the upload suggestions come from.
- **Four photos were in the tree twice, byte for byte.** Three separate folder
  layouts had been merged into one, and each had wanted its own copy:

  | kept                               | was also stored as                  |
  | ---------------------------------- | ----------------------------------- |
  | `efteling/symbolica.jpg`           | `efteling/background.jpg`           |
  | `movie-park-germany/iron-claw.jpg` | `movie-park-germany/background.jpg` |
  | `phantasialand/winjas-fear.jpg`    | `phantasialand/winjas-force.jpg`    |
  | `walibi-holland/yoy-chill.jpg`     | `walibi-holland/yoy-thrill.jpg`     |

  The first two are the same picture doing two jobs, which `roles` already models —
  the survivor carries `park-background` **and** `ride-card` **and** `hero`, and
  `getParkBackground` finds it because it matches the ROLE, never the filename. The
  survivor is the one named after what it shows; see the naming rule in
  [`public/media/README.md`](../../public/media/README.md).

  The last two are different: one photo of two duelling coasters, and `ride` holds
  one slug. Winja's Force and YOY Thrill therefore fall back to their park's photo
  until somebody shoots them their own. That is a real, visible cost of the merge and
  the reason it is written down here rather than quietly absorbed.

---

## Related

- [`public/media/README.md`](../../public/media/README.md) — the authoring contract
- [assets](../development/assets.md) — delivery, quality banding, source-size targets
- [scripts](../development/scripts.md) — `generate:media`, `generate:image-crops`
- [caching](../architecture/caching-strategy.md) — where this fits the wider model
