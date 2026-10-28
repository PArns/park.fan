# The media database

The authoring contract for every photo, diagram and illustration the site uses: where a file goes,
what its `<name>.json` sidecar says, and which fields the build checks. Open it when adding or
describing an image. How the app reads it (query API, HTTP API, caching) is in
[media database](../../docs/features/media-database.md); how the admin writes back (the media
browser, session pull requests, uploads, unique roles, the field screen, the blog editor) is in
[writing to the media database](../../docs/features/media-database-writes.md); how `alt` and `caption` are
worded is in the [writing rules §5.2](../../docs/writing/5-site-copy.md#52-alt-and-caption-media-sidecars).

**The filesystem is the database**: an image file is a row, and the `<name>.json` sidecar next to it
is that row's metadata. There is no other store.

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

**A folder is storage. The sidecar is the index.** Nothing in the app queries by folder. A
Halloween photo of Troy stored in the `toverland-halloween` collection still answers "the photos of
the ride `troy`", because its sidecar says `ride: troy`. That lets one pool serve the blog, the park
pages and the ride pages without parallel folders that drift apart. Put a file where it belongs as
a _shoot_ (usually the park slug; a themed outing gets its own name), and say what it _shows_ in the
sidecar. Never infer park, ride or role from a file name or folder
([the rule](../../docs/rules/media-database.md)).

## Naming a file

Lower-case with dashes, named after **what the picture shows**, not the job it happens to do:
`iron-claw.jpg`, not `background.jpg`. The sidecar's `roles` decide what an image is used for, and
one image can hold several. A file called `background` invites a second copy of the same photo
under its real name, which happened four times, byte for byte. `background.jpg` stays right where
the photo is park-level and shows no single ride.

## Adding an image

1. Drop the file into a collection folder.
2. Write `<name>.json` next to it.
3. Run `pnpm generate:media`. It validates everything and says what is wrong.

Or use `/admin/media`, which does all three, opens a pull request and reads the file's GPS tag to
propose the park. An image with **no** sidecar is still valid; it carries no metadata, and the
generator says so. Dropping a file in never breaks the build.

An image dropped into the blog editor arrives with a starter sidecar: the alt text and caption the
post already wrote, in every filled locale, `photo` or `diagram`, and `license: unknown`. Park,
ride, focal point and author stay unset on purpose and show up in the admin's backlog filters
([the blog editor write path](../../docs/features/media-database-writes.md#other-ways-in)).

## The sidecar

Every field is optional. Nothing is inferred from the file name or the folder. The generator
normalizes and validates it through `lib/media/sidecar.mjs`; the types are `MediaSidecar` in
`lib/media/types.ts`.

```jsonc
{
  "title": "Troy", // short label, mainly for the admin
  "park": "attractiepark-toverland", // park slug: what the photo SHOWS
  "parkPath": "europe/…/toverland", // only for ambiguous slugs, see below
  "ride": "troy", // attraction slug (the API's, not the file name)
  "alsoRides": ["winjas-force"], // further rides the SAME photo shows, see below
  "area": "Troy", // themed area (not in the API)
  "collections": ["toverland/halloween"], // further collections besides the folder it sits in
  "roles": ["ride-card", "hero"], // what it is USED for, see below
  "tags": ["photo", "night"], // controlled vocabulary, see Tags
  "alt": { "de": "…", "en": "…" },
  "caption": { "de": "…", "en": "…" },
  "credit": {
    "author": "Patrick Arns",
    "license": "all-rights-reserved", // `unknown` is a real value; never guess
    "source": "own", // own, contribution, press-kit or unsplash (see the credit section)
    "sourceUrl": null, // the page the photo came from; set for Unsplash
    "year": 2025,
  },
  "shotAt": "2024-10-26", // defaults to EXIF DateTimeOriginal
  "gps": { "lat": 51.4, "lon": 6.2 }, // defaults to the EXIF GPS tag
  "focus": { "x": 0.62, "y": 0.38 }, // or "top" / "center" / "bottom-right" / …
  "order": 3, // position in the collection; else file-name order
  "review": true, // set by /admin/capture, see below
}
```

`alt` and `caption` take an object per locale; a bare string means German, and missing locales fall
back `de` → `en` → whatever exists.

### `roles` — what an image is _used_ for

| role              | meaning                                           | uniqueness   |
| ----------------- | ------------------------------------------------- | ------------ |
| `park-background` | the park page's full-bleed photo, and its OG card | one per park |
| `ride-card`       | the canonical photo of a ride                     | one per ride |
| `hero`            | eligible for the homepage hero rotation           | any number   |

Roles are declared, never derived: `background.jpg` and a Halloween snapshot of the same park sit
side by side, and only the sidecar tells them apart. The generator warns when two images claim the
same unique role, and `getRideImage` then shows whichever comes first. Saving from the admin moves a
unique role instead of copying it
([a unique role moves](../../docs/features/media-database-writes.md#a-unique-role-moves-when-another-photo-claims-it));
by hand, take it off the old sidecar in the same commit. A ride can have any number of photos;
`ride-card` picks the one that represents it.

### One photo, two rides: `alsoRides`

Some pairs the API lists as two attractions were built as one structure, and one photograph is of
both (Winja's Fear and Force share a hall; YOY Chill and Thrill share a layout). List the second
slug in `alsoRides` and the image answers for it everywhere: ride page, ride card, gallery,
search. It needs a `ride`, every slug is validated against the park's attractions, and the photo
must be a fair card for every slug listed. A ride merely in the background of the frame does not
belong here; that is what `park` without `ride` is for. Why it exists:
[one photo can index two rides](../../docs/rules/one-photo-can-index-two-rides-alsorides.md).

### `park` without `ride` is a real category

A photo about the park and nothing narrower (a fogged path, a maze facade, a performer between two
queues) gets `park` and **no** `ride`. Forcing a ride onto it would put a wrong photo on that
ride's page.

### `focus` — the point that must survive every crop

The ride card crops a photo wide, the spotlight card tall, the background to the viewport, and
`object-fit: cover` crops from the centre by default, which cuts the head off the Troy horse in
the wide card. One point fixes all of them: it becomes the CSS `object-position` wherever the photo
is painted **and** the offset the 16:9, 4:3 and 1:1 crops are cut at. Set it by clicking the subject
in `/admin/media`, which previews the real card components. Leave it out when the photo is happy
centred; "unset" and "centred" are stored differently so the admin can list what still needs a
look. How the crop is computed: [media database](../../docs/features/media-database.md#libmediafocus-one-crop-rule-for-every-surface).

### `parkPath` — for the slugs that are not unique

`disneyland-park` is both Anaheim and Paris. For an image of a park whose slug the catalog lists
more than once, add the full `continent/country/city/slug` path; the generator warns when it is
missing.

### `credit` — never invent one

**No Creative Commons photos**: a photo is our own, a `/contribute` upload, a press-kit photo with
written approval or an Unsplash photo, and `pnpm generate:media` fails on a `cc-by*` licence
([no Creative Commons photos](../../docs/rules/no-creative-commons-photos.md), which also lists the
`license` and `source` each source takes). `"license": "unknown"` means nobody has established the
rights yet; that is a legitimate state, and the build counts how many are outstanding. Do not fill
in an author to make the warning go away. A photo that is not ours carries its credit on the
picture ([the rule](../../docs/rules/media-database.md)).

### `review` — the photograph nobody has looked at yet

`"review": true` marks a sidecar written by `/admin/capture` in front of the ride: park, ride,
area, date and credit are set; alt text, caption and the tags for what is in frame are not. The
media browser's **Zu prüfen** filter lists them. It is a field, not a tag, because tags say what a
photo shows. Only `true` is ever written; absent and `false` mean the same, so an untouched sidecar
stays byte-identical through a regeneration
([the field workflow](../../docs/features/media-database-writes.md#other-ways-in)).

## Tags

A controlled vocabulary in facets, defined in `lib/media/tags.mjs`: time of day, season and event,
weather, subject, setting, kind. The generator warns on a tag outside it and on two tags from one
exclusive facet (nothing is both `day` and `night`). Adding a tag means editing that file,
deliberately: free-text tags rot into `night`, `nacht` and `bei-nacht` within a month.

## What is generated, and never edited by hand

- `*-16x9.jpg`, `*-4x3.jpg`, `*-1x1.jpg`: crops for structured data, cut around the focal point by
  `pnpm generate:image-crops`. Gitignored.
- `lib/media/manifest*.ts`: the read side, written by `pnpm generate:media`.

Both run in `prebuild`, crops first, because the manifest records which crops exist.
