# Blog authoring guide

What you can write in a post and how it renders: files and slugs, frontmatter, `ref:` links,
categories and tags, images, the live widget fences, embeds, callouts and quotes. Open it when
writing or editing a file under `content/blog/`. How the text itself is written (for posts and every
other text on the site) is in the [writing rules](../../docs/writing/README.md).

After adding or renaming files, regenerate the manifest with `pnpm generate:blog-manifest` (it also
runs in `prebuild`).

## 1. Files & folders

```
content/blog/
  categories.json          # category path → localized labels (see §4)
  authors/<key>.md         # one file per author (see §2.1)
  de|en|nl|fr|es|it/<slug>.md
```

- **The file name is the URL slug**: `de/willkommen-im-park-fan-blog.md` →
  `/de/blog/willkommen-im-park-fan-blog` (news: `/de/news/…`).
- **Translations of one post share a `translationKey`.** Slugs may differ per language; the key
  links them for hreflang alternates and the English fallback. Every post and every later update
  ships in all six locales in one PR, with the same `updatedAt`
  ([the rule](../../docs/rules/a-post-ships-in-six-languages-in-one-pull-request.md),
  `pnpm check:blog-updated-at`). What stays identical across the six files:
  [writing rules §6](../../docs/writing/6-translation.md).
- A locale without its own file falls back to the English version with a "translation not ready"
  notice. That is a safety net, not a way to publish.
- **No year in the slug** unless the post is about that one season
  (`halloween-freizeitparks-2026` is; a park guide updated in place is not).
- **Renaming a published post means a 301.** Add the pair to `renamedPosts` in `next.config.ts`
  (redirect rule 12), which redirects the locale-prefixed and the bare form, or the indexed URL
  404s.

## 2. Frontmatter

YAML between `---` fences at the top of the file.

```yaml
---
title: 'park.fan is live, and we write now too' # required
translationKey: welcome-to-park-fan-blog # shared across locales; defaults to the slug
date: '2026-05-20' # required, YYYY-MM-DD
time: '13:30' # required on news, HH:MM Europe/Berlin
updatedAt: '2026-05-22' # only for new content
author: patrick # key of authors/<key>.md (§2.1)
mode: published # published | hidden | draft
featured: true # promoted in listings and feeds
excerpt: >- # required; cards, feed, meta description fallback
  One to three sentences with the finding.
tags: [meta, launch] # tag pages and the tag cloud (§4)
category: news # slash-path (§4)
parkLinks: [europa-park] # park pages that link back (§3)
rideLinks: [europa-park/voltron-nevera-powered-by-rimac] # ride pages that link back (§3)
relatedParks: [efteling] # extra park references besides the body's
relatedAttractions: [{ parkSlug: efteling, slug: joris-en-de-draak }]
coverImage:
  src: /media/universal-islands-of-adventure/welcome-cover.jpg
  alt: 'Cover alt text'
  caption: 'Optional caption'
  credit: 'park.fan'
gallery: halloween-2026 # optional: a media collection, { folder: … } or a list of images
readingTime: 7 # optional; calculated when left out
seo:
  title: 'Custom <title>' # defaults to title
  description: 'Meta description, at most 155 characters' # defaults to excerpt; pnpm test:meta-descriptions
  ogImage: /media/… # defaults to the cover when it is a raster image
  keywords: ['extra', 'keywords'] # string or array
  noindex: false
  canonical: 'https://…'
---
```

The types are `BlogFrontmatter` in `lib/blog/types.ts`.

- **`updatedAt`** decides what the site calls new: the header's blog panel and the homepage strips
  sort by it, the panel and the post banner print it, and it is `dateModified` and `<lastmod>`.
  Move it only for new content, never for a wording pass; news never carries it
  ([`updatedAt` is for new content](../../docs/rules/updated-at-is-for-new-content.md)).
- **`time`** is the minute a news post goes out, quoted, the same in all six files. `/news`, the
  header's news panel, the feed and the news sitemap order a day by it, and it goes into
  `datePublished`. Set it when the post is merged; `pnpm check:blog-updated-at` fails a news post
  without one. Articles may leave it out
  ([order within a day](../../docs/rules/news-is-set-apart-from-the-articles.md#order-within-a-day)).
- **A post dated in the future is held back**: while its `date` (and `time`, when set) is after now
  in Europe/Berlin it is in no listing, feed, sitemap or hreflang set and its URL answers 404. It
  appears with the first production build after that moment; nothing revalidates for it.
  `pnpm test:scheduled-posts` pins the gate.

### 2.1 Authors

Each author is defined once in [`authors/`](./authors) and referenced by key (the file name) from
`author:`. Each author gets a profile page at `/blog/authors/<key>` listing their posts.

```md
---
name: Patrick Arns
shortName: Patrick # byline in post headers and cards; defaults to `name`
role: Gründer von park.fan # shown under the name
location: Deutschland
url: https://arns.dev # primary website, rel=author
avatar: /media/authors/patrick.jpg # optional; '' falls back to the initials
bio: 'One-line bio for post headers and cards.'
links: # pills on the profile page: website, github, x, mastodon, instagram, linkedin
  website: https://arns.dev
  github: https://github.com/PArns
---

The Markdown body is the long bio on the profile page.
```

- `shortName` is the byline in a post header and on a card; the full `name` stays in structured
  data, the feed and the profile page.
- An inline object still works (`author: { name: … }`), and an unknown string is shown as a
  literal name with no profile page.
- **Translations**: `authors/<key>.md` is the base (English). `authors/<key>.<locale>.md`
  (`patrick.de.md`) carries only the translatable fields (`role`, `location`, `bio` and the body);
  the rest is inherited, and a locale without a file falls back to the base.

### `mode` lifecycle

| Value       | Listed? | Reachable by URL? | Notes                              |
| ----------- | ------- | ----------------- | ---------------------------------- |
| `published` | yes     | yes               | The default for a live post.       |
| `hidden`    | no      | yes               | Unlisted; share the link directly. |
| `draft`     | no      | no (dev only)     | Work in progress.                  |

Hidden and draft posts drop out of the category tree and the tag counts too.

**Visibility is locale-scoped.** A locale shows blog surfaces (nav link, index, category, tag and
author pages, feed, sitemap entries) only if it lists at least one post itself, and a post's
hreflang lists only locales whose translation is `published`.

## 3. References (`ref:`) — link a park or ride

A normal Markdown link with a `ref:` href. **Park or ride is decided by a slash** in the key: the
park slug, or `parkSlug/rideSlug`. Live data (status, current wait) is resolved automatically.

```md
[Europa-Park](ref:europa-park) → inline park link
[Voltron](ref:europa-park/voltron-nevera…) → inline ride link
[Europa-Park](ref:europa-park?full) → full park spotlight card
[Voltron](ref:europa-park/voltron-nevera…?full) → full ride spotlight card
```

A `?full` card must sit on its own line (its own paragraph); it renders as a block and is hoisted
out of the paragraph.

| Option     | Effect                                                     |
| ---------- | ---------------------------------------------------------- |
| `full`     | Render the full spotlight card instead of an inline link.  |
| `bare`     | Inline link without the short info annotation.             |
| `short`    | Park links show the city only, instead of "city, country". |
| `calendar` | Park links point at the park's wait-time calendar.         |

Combine options with `&`. An option this table does not list is dropped silently and renders the
default, so a typo is not an error. `park:slug` and `attraction:parkSlug/slug` are aliases of
`ref:` with the same options; new posts use `ref:`. A slug that exists twice takes the full path
form (`ref:/parks/europe/france/paris/disneyland-park`, see §6).

### Linking another post

A plain relative link: `[unser Halloween-Guide](/blog/halloween-freizeitparks-2026)`. Any
`/blog/<slug>` or `/news/<slug>` href (a locale prefix works too) renders as a `BlogPostLink`: the
dotted underline of park and ride references, plus a hover preview with the target's
`BlogPostCard`, resolved in the current locale with the English fallback. An unresolvable slug
degrades to a plain link, so a typo is silent; check that the hover appears.

### The other direction: park and ride pages linking back

Every park page carries a "{park} im Blog" section and every ride page a "{ride} im Blog" chapter,
built from the posts themselves (`lib/blog/backlinks.ts`): a post appears wherever it references
via `ref:`, `park:` or `attraction:` links, the `park-widget`, `map-widget` and `attraction-widget`
fences (a ride counts for its park too), or `relatedParks` / `relatedAttractions`. Normally there is
nothing to configure. Use the frontmatter keys when the automatic result is wrong:

```yaml
parkLinks: false # never link this post from a park page
parkLinks: # …or exactly these parks, ignoring the body
  - attractiepark-toverland
  - /parks/europe/france/paris/disneyland-park # full path pins a slug that exists twice

rideLinks: # the same for ride pages
  - attractiepark-toverland/* # every Toverland ride the article links
  - efteling/joris-en-de-draak # plus this one
```

- An explicit list **replaces** detection: anything not listed does not get the post, however often
  the body links it. Use it for rides a comparison only name-drops.
- `parkSlug/*` (`rideLinks` only) means every ride of that park the article links.
- The two keys are independent, and they belong to the **post**, not to one translation: one
  locale's value governs all six, but write it into every file so whoever edits the English sees
  it. `pnpm generate:blog-manifest` warns when translations disagree or an entry is not a valid
  slug.
- How the posts are ranked on a page, why a round-up that must reach every park names them in
  `parkLinks`, and how a guide becomes a park's first-visit primer (the first entry of its
  `parkLinks`):
  [park/ride page and blog link](../../docs/rules/parkride-page-and-blog-link.md).

## 4. Categories & tags

- **Category** is one slash-separated path, e.g. `category: reports/europe/europa-park`. Labels per
  locale come from [`categories.json`](./categories.json); add the path there for a translated
  label and a tidy category page. An unknown path falls back to its last segment. News is
  `category: news` ([news is set apart](../../docs/rules/news-is-set-apart-from-the-articles.md)).
- **Tags** are a free list, slugified for `/blog/tag/<tag>` and the tag cloud. Reuse existing tags.
- **Translate tags, and keep them in the same order in every language.** Tags carry no
  `translationKey`, so the tag pages derive their hreflang alternates by matching one post's tag
  arrays by position across locales (`buildTagAlternates`, `lib/blog/tags.ts`). Reordering or adding
  a tag in one language drops that post's tags from the mapping, and those tag pages lose their
  language alternates. Brand names stay untranslated (`park-fan`, `wintertraum`).

## 5. Images

Inline images carry caption and alignment in the alt text:

```md
![Alt text | Optional caption | align](/media/<collection>/foo.jpg)
```

`align` is `center` (default), `left`, `right` or `wide`; a `?align=` query on the src wins. An
image dropped into the blog editor gets a starter sidecar with this alt text and caption
([media database](../../public/media/README.md)). Writing `alt` and `caption`:
[writing rules §5.2](../../docs/writing/5-site-copy.md#52-alt-and-caption-media-sidecars).

## 6. Live widgets (code fences)

Block widgets are fenced code blocks named `<thing>-widget`, with attributes on the info line
(`key=value`, `key: value` or `key="value"`) or as `key: value` lines inside the fence.

````md
```weather-widget slug=europa-park

```
````

| Widget                   | Attributes                                       | Renders                                     |
| ------------------------ | ------------------------------------------------ | ------------------------------------------- |
| `weather-widget`         | `slug`                                           | Live weather and nowcast for a park.        |
| `best-days-widget`       | `slug`                                           | Quietest upcoming days (crowd calendar).    |
| `stats-widget`           | `slug`, `show`                                   | Typical waits: top rides, months, weekdays. |
| `park-comparison-widget` | `slugs`, `show`, `highlight`                     | Median wait across several parks.           |
| `ride-waits-widget`      | `park`+`top`, or `rides`; `columns`, `highlight` | Wait-time table for rides.                  |
| `hourly-profile-widget`  | `slug`, `top`, `from`, `to`                      | Queue by hour of the day, ride by ride.     |
| `map-widget`             | `slug`                                           | Interactive park map.                       |
| `glossary-widget`        | `slug` (or `term`, `id`)                         | Full glossary definition inline.            |
| `gallery-widget`         | `folder`, `heading` (or a body)                  | Photo gallery.                              |
| `cta-widget`             | `href`, `label`, `text`                          | One action as a button.                     |
| `park-widget`            | `slug`                                           | Park spotlight card; prefer `ref:…?full`.   |
| `attraction-widget`      | `parkSlug`, `slug`                               | Ride spotlight card; prefer `ref:…?full`.   |

A widget is how a wait time gets into a post: a figure that moves is never typed into the text or a
Markdown table, and a sentence next to a widget does not name a figure the widget renders
([a wait time is never typed into a post](../../docs/rules/a-wait-time-is-never-typed-into-a-post.md)).
What each widget may fetch is in the [API budget](../../docs/architecture/api-budget.md#blog-widgets-what-a-post-may-fetch).
Attendance figures (TEA index, curated once a year, not in our API) have no widget and belong in the
prose.

### Naming a park whose slug exists twice

Every attribute that names a park (`slug`, `park`, `parkSlug`, `slugs`, the park half of `rides`)
takes the bare slug or the full path form:

````md
```stats-widget slug=/parks/europe/france/paris/disneyland-park show=attractions

```
````

**`disneyland-park` names two parks**, Paris and Anaheim, and the bare lookup answers **Anaheim**
(last write wins over the geo walk). A bare `slug=disneyland-park` in a post about Paris renders
Californian medians with no error; the Europa-Park guide's comparison table compared Anaheim to six
European parks that way, in six languages. `pnpm check:blog-slugs` validates every slug against the
API and the long form against the geo path, but cannot tell that a bare slug meant the other park,
so write the long form.

**`highlight=` must match the form you wrote** (in `park-comparison-widget` and in
`ride-waits-widget`'s `rides=` mode): it is compared against the reference as written, and a stale
`highlight=disneyland-park` drops the bold row silently. Nothing checks it.

### `stats-widget show=…` — one table at a time

Without `show` the widget renders all three cards (top rides, by month, by weekday), as on the park
page. A post usually argues from one at a time, in sections far apart, so name the cards:

````md
```stats-widget slug=europa-park show=attractions

```
````

`show` takes any comma-separated subset of `attractions`, `months`, `weekdays`. With `show` the
widget drops its own `<h2>` and sits under the post's heading. A value naming nothing valid falls
back to the full bundle.

### `park-comparison-widget` — several parks side by side

````md
```park-comparison-widget slugs=europa-park,phantasialand,efteling highlight=europa-park show=quietest

```
````

- Rows keep the order you list them in, because the sentence under such a table usually depends on
  it.
- The park median is weighted by measured days; the "longest queue" column considers only rides
  with at least 100 measured days.
- `show=quietest` (opt-in) adds the quiet end of each park's week, the days the park page header
  names, with their median wait. The cell may name several days (Europa-Park: Thursday, Friday and
  Sunday; Phantasialand „Mo–Fr"), which is a finding, not a failure to choose. It may also be an em
  dash, for a park whose week is too flat or too unevenly measured to have a quiet end, and the
  column is left out when no park has one
  ([the rule](../../docs/rules/the-quietest-weekday-is-the-parks-quiet-end.md)).
- It renders the same `ParkComparisonCard` as the best-travel-time hub, so a figure in a post and on
  that page cannot drift apart.

### `ride-waits-widget` — the wait-time table you would otherwise type out

One park's ranking, or a hand-picked list (usually across parks):

````md
```ride-waits-widget park=efteling top=10 columns=land,peak,days highlight=joris-en-de-draak

```
````

````md
```ride-waits-widget rides=attractiepark-toverland/troy|Troy|Holz;efteling/joris-en-de-draak|Joris en de Draak|Holz columns=park,type,peak highlight=attractiepark-toverland/troy

```
````

- `rides` is **semicolon-separated**, because a build type can hold a comma
  ("Dive Coaster, Stahl"). Each entry is `parkSlug/rideSlug`, optionally followed by `|Label` and
  `|Type`, both positional. They are author-supplied on purpose: a layout is a stable fact, the
  minutes are what drifts and never appear in the fence. Use `|Label` for a park that publishes a
  name like "WODAN - Timburcoaster", or to keep a parenthetical the comparison rests on.
- `columns` takes any comma-separated subset of `park`, `land`, `type`, `peak`, `days`; the ride
  name and the median are always there. A column the data cannot fill is not rendered.
- **Order**: `park` mode is ranked by the data, because the ranking is the claim; `rides` mode keeps
  your order.
- **Thin rows**: in `rides` mode a ride under 60 measured days shows dashes, because that table
  invites subtracting one number from another. `park` mode adds no floor (the API already refuses
  rides under 20 days) and the `days` column states each row's basis.

### `hourly-profile-widget` — when the queue happens, not how long it is

````md
```hourly-profile-widget slug=europa-park top=8

```
````

One row per ride, one column per hour the park is open, each ride's busiest hour in bold; both axes
come from the data. `from=2025-12-01 to=2026-10-21` reads that window of park-local days (both
inclusive) instead of the last year. Give both or neither; a pair that is not two real days in
order, or spans more than 1,830 days, is ignored. Two fences with different windows show a before
and after without typing a wait time. It renders **nothing** when the park has too few measured
days or fewer than three hours qualify as columns, so the paragraph above it must be a complete
thought.

### Gallery

Point at a **collection** in the media database; every image in it is picked up in gallery order,
with the alt text, caption and credit its sidecar carries:

````md
```gallery-widget folder=orlando-2026 heading="The trip in photos"

```
````

Captions are per image, in the sidecar, in all six languages (falling back `de` → `en` → whatever
exists); edit them in `/admin/media` or in `public/media/<collection>/<name>.json`, then run
`pnpm generate:media` ([media database](../../public/media/README.md)). Or list images line by
line:

````md
```gallery-widget
- /media/<collection>/a.jpg | Alt text | Caption | © Credit
- /media/<collection>/b.jpg | Alt text
```
````

### `cta-widget`: the one action a post asks for

````md
```cta-widget
href: https://www.openpetition.de/petition/online/fuer-eine-verantwortungsvolle-erweiterung-des-phantasialands
label: Petition auf openPetition unterschreiben
text: Die Petition läuft bis zum 23. November.
```
````

A box with the line of text and a link drawn as a button (`BlogCtaWidget`). Use it once per post,
for the action the post exists to ask for; every other link stays in its sentence. `label` says
what the reader does („Petition unterschreiben“), never „Hier klicken“; `text` is optional. `href`
must be an http(s) URL or a path on this site, or the widget renders nothing. The feed carries only
the excerpt, so the sentence that first mentions the action keeps its own inline link.

### Video & social embeds

A **YouTube or Instagram link on its own line** (its own paragraph) becomes an embed; a link inside
a sentence stays a link.

```md
https://youtu.be/dQw4w9WgXcQ

[Optional caption shown under the video](https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s)
```

- **YouTube**: `youtu.be/<id>`, `watch?v=<id>`, `/shorts/<id>`, `/embed/<id>`, `/live/<id>`. A
  `?t=` / `&t=` start time (`90`, `1m30s`) is honoured; custom link text becomes the caption.
- **Instagram**: post, reel and tv permalinks (`/p/…`, `/reel/…`, `/tv/…`).
- **Suno**: full song URLs (`suno.com/song/<id>`) become an audio player; short share links
  (`suno.com/s/<code>`) are not embeddable.

### Callouts, the update box and the correction note

GitHub-style alerts render as boxes: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`,
`> [!CAUTION]` (`lib/blog/remark-callouts.ts`). `> [!UPDATE]` and `> [!CORRECTION]` are ours, for
**news posts only**.

`> [!UPDATE]` goes **at the top of the body**. The marker line carries the date as `YYYY-MM-DD` and
nothing else; the label prints it in the reader's language (`blog.updateOn`), so the text does not
repeat it. The post then carries `NewsUpdateBadge` in every news listing
([a news update opens the post](../../docs/rules/a-news-update-opens-the-post.md)).

```md
> [!UPDATE] 2026-10-22
> Dønnervind is running again. …
```

`> [!CORRECTION]` goes **at the end**, under the `Quellen:` line or above the `---` that opens a
sources section. It renders as a quiet grey box with the translated label `blog.correction`, so the
text starts with the date and says what was wrong and what is right
([a news correction is shown, never silent](../../docs/rules/a-news-correction-is-shown-never-silent.md)).
In German the date goes on the marker line (`> [!CORRECTION] 25. September 2026: …`), because a line
starting with „25." reads as a numbered list item.

```md
> [!CORRECTION]
> 25 September 2026: The first version said the free sister-park visits for 2027
> were still open. They are already part of the 2027 pass.
```

### Quotes

A sentence somebody else said or wrote is a `> [!QUOTE]` block whose **last paragraph is the
source line**: who, in what role, where, with a link to the place you read it
([a quote names its source](../../docs/rules/a-quote-names-its-source.md)).

```md
> [!QUOTE]
> Fahrsicherheit ist ein Grundpfeiler unseres Geschäfts.
>
> [en] Ride safety is a cornerstone of our business.
>
> Brian Oerding, Parkchef von Six Flags Magic Mountain, in der [Mitteilung vom 29. September 2026](https://www.sixflags.com/blog/retiring-x2-magic-mountain), aus dem Englischen übersetzt
```

- It renders as `BlogQuote` (`components/blog/blog-quote.tsx`); `remarkCallouts` turns the last
  paragraph into the `<figcaption>`, so a one-paragraph block renders without a source line
  (`check:prose` fails on it). Leave out „…“ around the words.
- **A translated quote carries its original** in its own paragraph starting with the language code
  in brackets (`[en] …`), before the source line, verbatim, with `[…]` for cuts. Readers open it on
  hover, tap or focus (`BlogQuoteOriginal`, label `blog.quoteOriginal`, `lang` set on the text); an
  `EN` mark says there is one. `check:prose` warns when a source line says "translated" and no
  original is there. In the language of the original there is nothing to add.
- A fragment of a few words inside a sentence stays inline in „…“, with the speaker in the same
  sentence.

## 7. Niceties (automatic — nothing to write)

- **Table of contents** from the `##` / `###` headings, shown when a post has enough of them.
- **Sources are a chapter of their own**: `## Quellen & Weiterlesen` (and its translation), never a
  `###`, which would hang it under the FAQ as if it answered one of its questions.
- **Glossary terms** in body text are linked to their definitions automatically.
- Tables, blockquotes, lists and a reading-progress bar work out of the box.

## 8. Before you commit

```bash
pnpm generate:blog-manifest   # pick up new or renamed files
pnpm check:prose              # the writing rules, then the review pass (docs/writing/7-review.md)
pnpm check:blog-updated-at    # six locales per translationKey, one updatedAt
pnpm check:blog-slugs         # every widget and ref slug against the API
pnpm validate:translations    # message catalogs stay in sync
pnpm lint && pnpm build
```
