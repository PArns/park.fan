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
`object-position`. Server-side; Client Components take it as a prop
(`CardPhoto`, `ParkBackground`).

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

**The focal-point editor** previews the result in the **real** cards the site
renders — `AttractionCard`, `ParkCard`, `BlogPostCardView`, `ParkBackground` — rather
than look-alike boxes that could agree today and drift next month. They share one
grid with a pinned 220 px photo track and `grid-template-rows: subgrid`, because that
is the only arrangement that reproduces the real box: give each card its own template
and the photo track absorbs the slack, the box comes out taller than wide, and the
preview lies about the focal point having no effect.

**Replacing the file** (the low-res upgrade path) is the bar above the previews: the
current resolution, and one button that swaps the bytes while the id, the sidecar and
every reference to the image stay put. The grid labels the images that need it —
`1024×768 · replace` — rather than marking them with an icon that says nothing about
the fix existing.

**Uploading** is drag & drop, in two stages:

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

---

## Related

- [`public/media/README.md`](../../public/media/README.md) — the authoring contract
- [assets](../development/assets.md) — delivery, quality banding, source-size targets
- [scripts](../development/scripts.md) — `generate:media`, `generate:image-crops`
- [caching](../architecture/caching-strategy.md) — where this fits the wider model
