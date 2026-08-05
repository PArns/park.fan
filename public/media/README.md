# The media database

Every photo, diagram and illustration the site uses lives here. **The filesystem is
the database**: an image file is a row, and the `<name>.json` sidecar next to it is
that row's metadata. There is no other store.

```
public/media/
  toverland/
    troy.jpg          ← the image
    troy.json         ← its sidecar
    troy-16x9.jpg     ← generated crop, gitignored, never edited
  halloween-2026/
    kulissen/
      05-arachnophobia-turm.jpg
      05-arachnophobia-turm.json
```

## The one rule that explains the layout

**A folder is storage. The sidecar is the index.**

Nothing in the app queries by folder. A Halloween photo of Troy is stored in the
`toverland-halloween` collection and still answers "give me the photos of the ride
`troy`", because its sidecar says `ride: troy`. That is what lets one pool serve the
blog, the park pages and the ride pages at the same time instead of three parallel
image folders that drift apart.

So: put a file wherever it belongs as a _shoot_ (usually the park slug; a themed
outing gets its own name), and say what it _shows_ in the sidecar.

## Naming a file

Lower-case with dashes, and named after **what the picture shows** — not after the
job it happens to do. `iron-claw.jpg`, not `background.jpg`.

The name is only storage; the sidecar's `roles` decide what an image is used for,
and one image can hold several roles at once. But a file called `background` invites
a second copy of the same photo under its real name, which is exactly what happened:
four images sat in the tree twice, byte for byte, because one park wanted a
`background.jpg` and one ride wanted its own portrait.

`background.jpg` stays correct where the photo genuinely is park-level and shows no
single ride — most parks here are that case. It is wrong the moment the same picture
is also somebody's ride card.

## Adding an image

1. Drop the file into a collection folder.
2. Write `<name>.json` next to it.
3. Run `pnpm generate:media`. It validates everything and tells you what is wrong.

Or use the admin browser at `/admin/media`, which does all three and opens a pull
request — including reading the file's GPS tag to propose the park.

An image with **no** sidecar is still valid; it just carries no metadata, and the
generator says so. Dropping a file in never breaks the build.

### Images dropped into the blog editor

They get a starter sidecar automatically, written by the same normalizer as
everything else. It carries the **alt text and caption the post already wrote** —
`![alt | caption](src)`, read out of every filled locale, so a picture used in six
translations arrives with six languages — plus `photo` or `diagram`, and
`license: unknown`.

Park, ride, focal point and author stay **unset on purpose**. A screenshot in an
article usually shows no ride, nothing has looked at the picture yet, and the
post's author wrote the post, not necessarily the photo. Those images therefore
show up in the admin under _No park_, _No focal point_ and _Rights unknown_, which
is where somebody finishes them. An existing sidecar is never overwritten.

## The sidecar

Every field is optional. Nothing is inferred from the file name or the folder.

```jsonc
{
  "title": "Troy", // short label, mainly for the admin
  "park": "toverland", // park slug — what the photo SHOWS
  "parkPath": "europe/…/toverland", // only for the two ambiguous slugs, see below
  "ride": "troy", // attraction slug (API slug, not the filename)
  "area": "Troy", // themed area
  "roles": ["ride-card", "hero"], // what it is USED for — see below
  "tags": ["photo", "night"], // controlled vocabulary, lib/media/tags.mjs
  "alt": { "de": "…", "en": "…" },
  "caption": { "de": "…", "en": "…" },
  "credit": {
    "author": "Patrick Arns",
    "license": "all-rights-reserved", // `unknown` is a real value — never guess
    "year": 2025,
  },
  "shotAt": "2024-10-26", // defaults to EXIF DateTimeOriginal
  "focus": { "x": 0.62, "y": 0.38 }, // or "top" / "center" / "bottom-right" / …
  "order": 3, // position in the collection; else filename order
}
```

A bare string is accepted wherever a localized object is (`"alt": "…"` means German).

### `roles` — what an image is _used_ for

| role              | meaning                                           | uniqueness   |
| ----------------- | ------------------------------------------------- | ------------ |
| `park-background` | the park page's full-bleed photo, and its OG card | one per park |
| `ride-card`       | the canonical photo of a ride                     | one per ride |
| `hero`            | eligible for the homepage hero rotation           | any number   |

Roles are declared, never derived. In one shared pool `background.jpg` and a
Halloween snapshot of the same park sit side by side, and only the sidecar can tell
them apart. The generator errors loudly if two images claim the same unique role.

A ride can have any number of photos; `ride-card` picks which one represents it.
Everything else still shows up under that ride.

### `park` without `ride` is a real category

Photos that are about the park and nothing narrower — a fogged path, a maze facade,
a performer between two queues — get `park` and **no** `ride`. Forcing a ride onto
them would put a wrong photo on that ride's page.

### `focus` — the point that must survive every crop

A photo is almost never painted at its own aspect ratio. The ride card crops it
wide, the spotlight card tall, the background to whatever the viewport is, and
`object-fit: cover` throws the rest away from the centre by default. That is what
cuts the head off the Troy horse in the wide card while leaving it intact in the
tall one.

One point fixes all of them at once: it becomes the CSS `object-position`
everywhere the photo is painted **and** the offset the 16:9 / 4:3 / 1:1 crops are
cut at. Set it by clicking the subject in `/admin/media`, which previews the result
in the real card components.

Leave it out when the photo is happy centred — "unset" and "centred" are stored
differently on purpose, so the admin can list what still needs a look.

### `parkPath` — for the two slugs that are not unique

Two parks in the catalog share a slug: `disneyland-park` is both Anaheim and Paris,
and `universal-islands-of-adventure` is listed twice. For images of those, add the
full `continent/country/city/slug` path. The generator warns when you forget.

### `alt` and `caption` — and they must not read as AI-written

Two different jobs, and the second is not a longer version of the first.

**`alt`** is for somebody who cannot see the picture. One short, factual sentence:
what is in the frame, in the order it matters. No mood, no atmosphere, no colour
adjectives that carry no information.

**`caption`** is printed under the photo for somebody who _can_ see it, so
repeating the alt text wastes the line. Say the thing the picture does not: where
it is, when, what happened, or a fact worth knowing. It is allowed to be dry, and
it is allowed to be short.

```jsonc
// no
"alt":     "The wooden Trojan horse in Toverland's Ithaka area, guests queuing in
            front of it against an autumn sky."
"caption": "Troy: the wooden coaster by GCI in the Ithaka area."

// yes
"alt":     "Das hölzerne trojanische Pferd, davor die Warteschlange."
"caption": "Troy im Themenbereich Ithaka, eine Holzachterbahn von GCI."
```

The tells are **structural**, and they only become visible across a set:

- the same skeleton in every entry — subject, participle clause, "behind it" /
  "in front of it"
- a full inventory of everything in frame, when two things would do
- decorative adjectives: `bathed in`, `against a summer sky`, `sweeping the night
sky`, `nestled`
- the caption restating the alt
- six captions in a row opening with the ride's name

Write the six locales as six sentences, not as one sentence translated five times:
where a language wants a different word order, let it have one. Rules for prose in
general are in the [blog authoring guide](../../content/blog/README.md#8-writing-style-requirement)
and apply here too, including **no em dash in German running text**.

### `credit` — never invent one

`"license": "unknown"` means nobody has established the rights yet. That is a
legitimate, expected state, and the build counts how many are outstanding. Do not
fill in an author to make the warning go away.

## Tags

A controlled vocabulary, grouped into facets, defined in `lib/media/tags.mjs`:
time of day, season/event, weather, subject, setting, kind. The generator warns on
any tag outside it, and on two tags from the same exclusive facet (nothing is both
`day` and `night`).

Adding a tag means editing that file — deliberately. Free-text tags rot into
`night`, `nacht` and `bei-nacht` within a month, at which point no filter is right.

## What is generated, and never edited by hand

- `*-16x9.jpg`, `*-4x3.jpg`, `*-1x1.jpg` — crops for structured data, cut around the
  focal point by `pnpm generate:image-crops`. Gitignored.
- `lib/media/manifest*.ts` — the read side, built by `pnpm generate:media`.

Both run in `prebuild`, crops first (the manifest records which ones exist).

## Full documentation

`docs/features/media-database.md` — the query API, the HTTP API, the caching model
and how the admin browser writes back.
