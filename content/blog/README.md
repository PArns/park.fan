# Blog authoring guide

This folder holds the blog content. One Markdown file per post, grouped by
locale. This README is the reference for **what you can write and how** —
frontmatter, references, images, and the live widgets.

> After adding or renaming files, regenerate the manifest:
> `pnpm generate:blog-manifest` (also runs automatically on `prebuild`).

---

## 1. Files & folders

```
content/blog/
  categories.json          # category path → localized labels (see §4)
  README.md                # this file
  en/<slug>.md             # English posts
  de/<slug>.md             # German posts
  nl|fr|es|it/<slug>.md    # other locales (optional)
```

- **The file name is the URL slug**: `de/willkommen-im-park-fan-blog.md`
  → `/de/blog/willkommen-im-park-fan-blog`.
- **Translations of the same post share a `translationKey`** (see frontmatter).
  Slugs may differ per language; the `translationKey` links them for hreflang
  alternates and EN fallback.
- Locales without their own file fall back to the English version with a
  "translation not ready" notice.
- **No year in the slug** unless the post really is about that one season
  (`halloween-freizeitparks-2026` is; a park guide that gets updated in place
  is not). A `-2026` in an evergreen URL just makes it look stale a year later.
- **Renaming a published post means a 301.** Add the pair to `renamedPosts` in
  `next.config.ts` (rule 12), locale-prefixed _and_ bare, or the indexed URL
  404s.

---

## 2. Frontmatter

YAML block at the very top of the file, between `---` fences.

```yaml
---
title: 'park.fan is live — and we're writing now, too'   # required
translationKey: welcome-to-park-fan-blog                 # share across locales
date: '2026-05-20'                                       # required, YYYY-MM-DD
updatedAt: '2026-05-22'                                  # optional
author: patrick                                          # key from authors.json (see §2.1)
mode: published                                          # published | hidden | draft
featured: true                                           # promote in listings/feeds
excerpt: >-                                               # required, used in cards & meta
  One or two sentences summarising the post.
tags:                                                    # drives tag pages + tag cloud
  - meta
  - launch
category: news                                           # slash-path, see §4
parkLinks: [europa-park]                                 # park pages linking back, see §3
rideLinks: [europa-park/voltron-nevera-powered-by-rimac] # ride pages linking back, see §3
coverImage:
  src: /media/universal-islands-of-adventure/welcome-cover.jpg
  alt: 'Cover alt text'
  credit: 'park.fan'
seo:
  title: 'Custom <title> (defaults to title)'
  description: 'Meta description (defaults to excerpt)'
  keywords: ['extra', 'seo', 'keywords']                 # string or array
  noindex: false                                         # opt out of indexing
  canonical: 'https://…'                                 # optional override
---
```

### 2.1 Authors

Define each author once as a Markdown file in [`authors/`](./authors) and
reference them by key (the file name) from `author:`. No more repeating
name/bio/url in every post. Each author also gets a profile page at
`/blog/authors/<key>` listing all of their posts.

`content/blog/authors/patrick.md`:

```md
---
name: Patrick Arns
role: Gründer von park.fan # short title, shown under the name
location: Deutschland
url: https://arns.dev # primary website / rel=author
avatar: /media/authors/patrick.jpg
bio: 'One-line bio for post headers and cards.'
links: # rendered as pills on the profile page
  website: https://arns.dev
  github: https://github.com/PArns
  x: https://x.com/…
  mastodon: https://…
  instagram: https://…
  linkedin: https://…
---

The **markdown body** is the long-form bio shown on the author page.
Write as much as you like here — paragraphs, links, emphasis.
```

- `author: patrick` → resolves to `authors/patrick.md`.
- `bio` (frontmatter) is the short one-liner used in post headers/cards; the
  **body** is the rich bio on the profile page.
- `avatar` is optional — leave it `''` to fall back to the name initials.
  Put the image under `/public` (e.g. `public/media/authors/patrick.jpg`).
- An **inline object** still works (`author: { name: … }`), and an unknown
  string is treated as a literal display name (no profile page).

**Translations.** `authors/<key>.md` is the base (default locale, `en`). Add
`authors/<key>.<locale>.md` to translate — e.g. `patrick.de.md`. Locale files
only need the translatable fields (`role`, `location`, `bio` + the body);
language-neutral fields (`name`, `url`, `avatar`, `links`) are inherited from
the base, and any locale without a file falls back to it.

```md
---
# authors/patrick.de.md — only the translated fields
role: Gründer von park.fan
location: Deutschland
bio: 'Kurzbio für Beitrags-Header und Karten.'
---

Lange Bio auf Deutsch …
```

### `mode` lifecycle

| Value       | Listed? | Reachable by URL? | Notes                              |
| ----------- | ------- | ----------------- | ---------------------------------- |
| `published` | yes     | yes               | The default for a live post.       |
| `hidden`    | no      | yes               | Unlisted; share the link directly. |
| `draft`     | no      | no (dev only)     | Work in progress.                  |

Hidden/draft posts also drop out of the category tree and tag cloud counts.

**Visibility is locale-scoped.** A locale shows blog surfaces (nav link, index,
category/tag/author pages, RSS feed, sitemap entries) only if it lists at least
one post itself. Publishing e.g. only the DE translation launches /de/blog while
every other locale stays blog-free (404) — and the post's hreflang lists only
locales whose translation is actually `published`.

---

## 3. References (`ref:`) — link a park or ride

Use a normal Markdown link with a `ref:` href. **Park vs. ride is detected by a
slash** in the key.

```md
[Europa-Park](ref:europa-park) → inline park link
[Voltron](ref:europa-park/voltron-nevera…) → inline ride link
[Europa-Park](ref:europa-park?full) → full park spotlight card
[Voltron](ref:europa-park/voltron-nevera…?full) → full ride spotlight card
```

- The key is the **park slug**, or **`parkSlug/rideSlug`** for a ride.
- Live data (status, current wait, etc.) is resolved automatically.
- A `?full` card must sit **on its own line/paragraph** — it renders as a block
  card and is hoisted out of the paragraph automatically.

### Options (append after `?`, combine with `&`)

| Option | Effect                                                    |
| ------ | --------------------------------------------------------- |
| `full` | Render the full spotlight card instead of an inline link. |
| `bare` | Inline link **without** the short info annotation.        |
| `info` | Force the inline annotation on (default for parks/rides). |
| `long` | Park links show the longer "city, country" form.          |

> `park:slug` and `attraction:parkSlug/slug` are kept as **aliases** of `ref:`
> and accept the same options, but new posts should use `ref:`.

### Linking another post

Write a plain relative link, nothing special:

```md
… siehe [unser Halloween-Guide](/blog/halloween-freizeitparks-2026).
```

Any `/blog/<slug>` href (a locale prefix like `/de/blog/…` works too) is picked
up automatically and rendered as a `BlogPostLink`: the same dotted-underline
style as park and ride references, plus a hover preview showing the target's
`BlogPostCard` (cover, category, title, excerpt, date, reading time, author).
The target is resolved **in the current locale**, so a German post hovering a
cross-reference shows the German card, falling back to English like the index
does. An unresolvable slug degrades to a plain link rather than disappearing,
but that means a typo is silent — check the hover appears.

### The other direction: park and ride pages linking back

Every park page carries a **"{park} im Blog"** section, and every ride page a
**"{ride} im Blog"** chapter, listing the posts that talk about it
(`ParkBlogPostsSection` / `AttractionBlogPostsSection`, fed by
[`lib/blog/backlinks.ts`](../../lib/blog/backlinks.ts)). Both are built from the
post, so **normally there is nothing to configure**: a post shows up wherever it
references — `ref:`/`park:`/`attraction:` links, the `park-widget` /
`map-widget` / `attraction-widget` fences (a ride reference also counts for its
parent park) and anything in `relatedParks` / `relatedAttractions`.

That default is what a round-up wants: the Halloween guide references ten parks
and appears on all ten pages, no list to maintain.

Use the frontmatter keys when the automatic result is wrong. They are
independent — a park guide is often right on the park page and far too broad on
a dozen ride pages:

```yaml
parkLinks: false # never link this post from a park page
parkLinks: # …or: exactly these parks, ignoring the body
  - attractiepark-toverland
  - efteling
parkLinks: # full path form pins a slug that exists twice
  - /parks/europe/france/paris/disneyland-park

rideLinks: # the same for ride pages
  - attractiepark-toverland/* # every Toverland ride the article links
  - efteling/joris-en-de-draak # plus this one by name
```

- An explicit list **replaces** the automatic detection — anything not listed
  doesn't get the post, however often the body links it. Use it for the rides a
  comparison table name-drops: the Troy guide belongs on Troy's page and on
  Joris en de Draak's, not on Balder's because one sentence lists it as
  competition.
- **`parkSlug/*`** (`rideLinks` only) means "every ride of that park this
  article links" — a park guide keeps its own twelve rides without listing them.
- Both keys are a property of the **post**, not of one translation: setting one
  in any locale file governs every language, so a rewritten paragraph in one
  translation can't silently change which pages link the article. Still, write
  it into all locale files — a frontmatter block that only exists in German is
  invisible to whoever edits the English one. `pnpm generate:blog-manifest`
  warns when translations disagree, and when an entry isn't a valid slug.
- Ordering: explicit configuration first, then posts whose tags or category name
  the park/ride, then the rest, newest-first within each group. Only the top
  three are shown.
- Drafts, hidden posts and locales without blog surfaces are excluded
  automatically — the section renders nothing rather than an empty heading.

---

## 4. Categories & tags

- **Category** is a single slash-separated path string in frontmatter, e.g.
  `category: reports/europe/europa-park`. Labels per locale come from
  [`categories.json`](./categories.json) — add the path there to get a
  translated label and a tidy category page. Unknown paths fall back to the
  last segment.
- **Tags** are a free-form list. They are slugified for `/blog/tag/<tag>` pages
  and feed the sidebar tag cloud. Reuse existing tags where possible.
- **Translate tags, and keep them in the same order in every language.** Tags
  carry no `translationKey`, so the tag pages derive their hreflang alternates by
  matching the arrays of one post **by position** across locales
  (`buildTagAlternates`, `lib/blog/tags.ts`) — that is what maps `wartezeiten` →
  `wait-times` → `tempi-di-attesa`. Reordering or adding a tag in only one
  language silently drops that post's tags from the mapping (the lengths no
  longer match), and the affected tag pages lose their language alternates.
  Leave brand names untranslated (`park-fan`, `wintertraum`) — they just map to
  themselves.

---

## 5. Images

Inline images use the alt text to carry a caption and alignment:

```md
![Alt text | Optional caption | align](/media/<collection>/foo.jpg)
```

- `align` is one of `center` (default), `left`, `right`, `wide`.
- Alignment can also come from a `?align=` query on the src, which wins:
  `![Alt](/media/<collection>/foo.jpg?align=wide)`.

---

## 6. Live widgets (code fences)

Block widgets are written as fenced code blocks named `<thing>-widget`, with
attributes on the info line (`key=value`, `key: value` or `key="value"`).

````md
```weather-widget slug=europa-park

```
````

| Widget                   | Attributes                    | Renders                                     |
| ------------------------ | ----------------------------- | ------------------------------------------- |
| `weather-widget`         | `slug`                        | Live weather + nowcast for a park.          |
| `best-days-widget`       | `slug`                        | Quietest upcoming days (crowd calendar).    |
| `stats-widget`           | `slug`, `show`                | Typical waits: top rides, months, weekdays. |
| `park-comparison-widget` | `slugs`, `show`, `highlight`  | Median wait across several parks.           |
| `ride-waits-widget`      | `park`+`top`, or `rides`      | Wait-time table for rides (see below).      |
| `hourly-profile-widget`  | `slug`, `top`                 | Queue by hour of the day, ride by ride.     |
| `map-widget`             | `slug`                        | Interactive park map.                       |
| `glossary-widget`        | `slug` (a.k.a. `term` / `id`) | Full glossary definition inline.            |
| `gallery-widget`         | `folder` (or line-based body) | Photo gallery (see below).                  |
| `park-widget`            | `slug`                        | Park spotlight card — use `ref:…?full`.     |
| `attraction-widget`      | `parkSlug`, `slug`            | Ride spotlight card — use `ref:…?full`.     |

### `stats-widget show=…` — one table at a time

Without `show` the widget renders all three cards (top rides, by month, by weekday), which is
what the park page shows. A post usually argues from **one** of them at a time, in sections that
sit hundreds of words apart, so embedding the bundle twice would show a reader the weekday chart
while the prose is still on ride queues. Name the cards you want instead:

````md
```stats-widget slug=europa-park show=attractions

```
````

`show` takes any comma-separated subset of `attractions`, `months`, `weekdays`. With `show` the
widget also drops its own `<h2>`, so it sits under the post's heading rather than starting a
second heading ladder. An attribute naming nothing valid falls back to the full bundle — that is
a typo in the post, not a request for an empty card.

**Prefer this over typing the numbers into a Markdown table.** Those figures move every single
day: over one night this post's Saturday median went 27 → 28, which silently falsified three
sentences that had been derived from it.

### `park-comparison-widget` — several parks side by side

````md
```park-comparison-widget slugs=europa-park,phantasialand,efteling highlight=europa-park

```
````

Rows appear in the order you list them and are never re-sorted, because the sentence under such
a table usually depends on that order. The park median is weighted by measured days, and the
"longest queue" column only considers rides with at least 100 measured days — otherwise a
children's coaster on a thin basis represents a whole park.

`show=quietest` adds a fourth column: the weekday with the lowest median wait at each park, and
that day's median.

````md
```park-comparison-widget slugs=europa-park,phantasialand,efteling show=quietest

```
````

It is opt-in because a post arguing about queue lengths does not want a weekday column in the
middle of its table.

**The cell may name two days**, and that is a finding rather than a failure to choose: Disneyland
Paris measures the same median on Sunday and Wednesday, Heide Park on Sunday and Friday. Do not
write around it as if one day were meant.

**It may also be empty, and that is not a gap to write around either.** A weekday measured far
more rarely than the rest is dropped from the comparison — Movie Park closes on many weekdays out
of season, so its Mondays carry 13 measured days against 22 Sundays, and comparing those two is a
claim about different parts of the year. If fewer than four evenly-measured weekdays survive, if
three or more days share the minimum (Disney Adventure World reads 39 minutes on four of them:
that is a park with no quiet day, not four quiet ones), or if the quietest day is not actually
below the park's own median, the column shows an em dash — the same reason `stats-widget` refuses
to draw a chart from a thin sample.

Both this and the best-travel-time hub render the same `ParkComparisonCard`, so a number quoted
in a post and the one on that page cannot drift apart.

It costs about 3 KB per park (~21 KB for seven), which is why this one is a client fetch.

### `ride-waits-widget` — the wait-time table you would otherwise type out

Two shapes, because posts write two. **One park's ranking:**

````md
```ride-waits-widget park=efteling top=10 columns=land,peak,days highlight=joris-en-de-draak

```
````

**A hand-picked list, usually across parks:**

````md
```ride-waits-widget rides=attractiepark-toverland/troy|Troy|Holz;efteling/joris-en-de-draak|Joris en de Draak|Holz columns=park,type,peak highlight=attractiepark-toverland/troy

```
````

`rides` is **semicolon-separated**, not comma-separated: a build type routinely holds a comma
("Dive Coaster, Stahl"), and a separator a value can contain is not one. Each entry is
`parkSlug/rideSlug`, optionally followed by `|Label` and `|Type` — both positional, both optional.

Those two are author-supplied on purpose. A coaster's layout does not change between two page
loads, so the type is a stable fact that belongs in the post; **the minutes are what drifts, and
they never appear in the fence.** Use `|Label` for a park that publishes something like
"WODAN - Timburcoaster", or to keep a parenthetical the comparison rests on ("Troy (GCI, 2007)").

`columns` takes any comma-separated subset of `park`, `land`, `type`, `peak`, `days`; the ride
name and the median are always there. A column the data cannot fill is not rendered at all — ask
for `land` at a park whose lands the API does not publish and you get no column rather than a
header over six dashes.

Two things differ between the modes, and both are deliberate:

- **Order.** `park` mode is ranked by the data, because the ranking IS the claim. `rides` mode
  keeps the order you wrote, because the sentence under such a table depends on it.
- **How thin a row may be.** In `rides` mode a ride under 60 measured days shows dashes: that
  table invites the reader to subtract one number from the other, and the thinner one would carry
  the argument. In `park` mode there is no extra floor — the API already refuses anything under 20
  days before ranking it, and the `days` column states each row's basis. That is what lets the
  Efteling post keep its paragraph about the steam train sitting seventh on a thinner sample.

### `hourly-profile-widget` — when the queue happens, not how long it is

````md
```hourly-profile-widget slug=europa-park top=8

```
````

One row per ride, one column per hour the park is open, each ride's own busiest hour in bold.
Both axes come from the data: a park that opens at 11 starts at 11, and an hour that was only
measured on a handful of late-summer evenings does not become a column.

It renders **nothing** when the park has too few measured days, or when fewer than three hours
were measured often enough to be columns — so write the paragraph above it as a complete thought
rather than a sentence the table has to finish.

### Never type a wait time into a Markdown table

Every widget here exists because that is what these posts used to be. Four of them carried
twenty-two hand-maintained tables across six languages, and they had already drifted: the Efteling
post quoted 34 minutes for Joris en de Draak while the park page said 35, and two tables in the
same Toverland post disagreed with each other by a minute because they were typed a week apart.
Nothing detects this — a stale number in Markdown looks exactly like a fresh one.

If a sentence next to a widget names a figure the widget also renders, the sentence loses. Write
the shape instead ("a good half hour", "roughly halves after noon"): that stays true while the
number moves, which it does, most nights.

See [API budget per page](../../docs/architecture/api-budget.md).

**Attendance figures have no column here on purpose.** They come from the TEA index, are curated
once a year and are not in our API. A number that changes annually belongs in the prose; a number
that changes daily belongs in the widget.

`park-widget` / `attraction-widget` still work but are **superseded by
`ref:slug?full`** — prefer the `ref:` form for new posts.

### Gallery

Point at a **collection** in the media database — every image in it is picked up,
in gallery order, with the alt text, caption and credit its sidecar already carries:

````md
```gallery-widget folder=orlando-2026 heading="The trip in photos"

```
````

**Localized captions are per image, not per gallery.** Each image's sidecar holds
`alt` and `caption` as `{ de, en, nl, fr, es, it }`, so there is nothing to keep in
sync across six files any more — the old `captions.json` + `captions.<locale>.json`
pair is gone. Missing locales fall back through `de` → `en` → whatever exists, so a
gallery renders the moment the German text is written.

Edit them in `/admin/media`, or by hand in `public/media/<collection>/<name>.json`.
Regenerate with `pnpm generate:media` (also runs in `prebuild`).

The same photos answer park and ride queries at the same time, so a gallery of a
Halloween evening also supplies that park's and those rides' pages — see
[`public/media/README.md`](../../public/media/README.md).

Or list images line by line in the body:

````md
```gallery-widget
- /media/<collection>/a.jpg | Alt text | Caption | © Credit
- /media/<collection>/b.jpg | Alt text
```
````

### Video & social embeds

Put a **YouTube or Instagram link on its own line** (its own paragraph) and it
becomes an embed automatically — no widget needed. Links inside a sentence stay
plain text links.

```md
Watch the on-ride POV:

https://youtu.be/dQw4w9WgXcQ

[Optional caption shown under the video](https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s)

https://www.instagram.com/reel/CxYz123/
```

- **YouTube**: `youtu.be/<id>`, `watch?v=<id>`, `/shorts/<id>`, `/embed/<id>`,
  `/live/<id>`. A `?t=` / `&t=` start time (e.g. `90`, `1m30s`) is honoured. If
  the link has custom text, it's used as the caption.
- **Instagram**: post / reel / tv permalinks (`/p/…`, `/reel/…`, `/tv/…`).
- **Suno**: full song URLs (`suno.com/song/<id>`) become an audio player. Short
  share links (`suno.com/s/<code>`) aren't embeddable — use the full song URL.

---

## 7. Niceties (automatic — nothing to write)

- **Table of contents** is built from your `##` / `###` headings (and the post
  title links back to the top). Shown only when a post has enough headings.
- **Glossary terms** in body text are auto-linked to their definitions.
- Standard Markdown tables, blockquotes, lists, and a reading-progress bar all
  work out of the box.

---

## 8. Writing style (REQUIREMENT)

Posts must not read like they were generated. That is a hard requirement, not a
preference — a reader who smells a language model stops trusting the numbers
too. Write the way a person who actually stood in the queue would write.

**Never use "ehrlich" and its whole family.** No `ehrlich gesagt`, no
`der ehrlichste Coaster`, no `um ehrlich zu sein`, no "honest" framing at all.
It is the single clearest tell. The same goes for the neighbouring register that
performs sincerity instead of just saying the thing:

| Don't write                           | Write instead                         |
| ------------------------------------- | ------------------------------------- |
| `der ehrlichste Woodie Europas`       | say what makes it good, with a number |
| `Fairness-Hinweis in eigener Sache`   | `Eine Einschränkung dazu:`            |
| `Was sie unbestreitbar ist:`          | `Eines ist sie auf jeden Fall:`       |
| `bezahlte Vorfahrt`                   | `sich an der Schlange vorbeikaufen`   |
| `ein weiterer Datenpunkt`             | `noch eine Zahl`                      |
| `die These dieses Artikels`           | drop it, or name the claim            |
| `in Wartezeit-Währung`                | `da stehst du am längsten an`         |
| `ein weltweit erstmalig gebauter Typ` | `den es sonst nirgends gibt`          |
| `Es ist ein schönes Muster.`          | cut, or say what it produced          |

Further rules that keep German prose sounding human:

- **Vary the sentence openings.** Three paragraphs in a row starting with
  `Und` or `Das ist` reads like autocomplete.
- **No coined metaphor-currencies** (`X-Währung`, `Lebenszeit-Konto`). One
  figure of speech per section is plenty, and it should be a normal one.
- **No em dash (`—`) in running text.** It is the most-recognised AI tell there
  is, and in German it is also simply the wrong character: German typography
  uses the Halbgeviertstrich `–` with spaces around it, not the Geviertstrich
  `—`. Reach for a comma, a full stop or a colon instead — an em dash almost
  always marks a sentence that wanted to be two. The **only** `—` in a post is
  the signature line `— Patrick`. Ranges and compounds keep the en dash without
  spaces (`90–140 cm`, `Venlo–Eindhoven`, `2007 – Ithaka`).
  Check with `grep -c "—" <post>`: the answer should be `1`.
- **Don't announce the structure** (`Und jetzt der Grund, warum dieses Kapitel
hier steht`, `Kommen wir nun zu`). Just write the next paragraph.
- **Articles and prepositions matter, and check the gender before "fixing" one
  in.** Dutch park names take the same neuter article the German ones do: it is
  **das** Efteling, exactly like `das Toverland` and `das Phantasialand`. So
  `zum Efteling`, `im Efteling`, `dem Efteling`, `das Efteling ist …` — never
  `der Efteling` and never `zur Efteling`.
- **Superlatives need a source or a number** right next to them, otherwise cut.
- **Hedge thin data explicitly** rather than rounding it into confidence: if a
  month has four measured days, say so.

### The aphoristic closer — the one that keeps coming back

The single most persistent tell, and it survives every other check: a short,
symmetrical, abstract sentence parked at the end of a post, a section or a
landing page, restating what was just said as a maxim. It contains no
information. It exists only to sound like an ending.

Real examples that were written and had to be removed:

| Shipped                                                                                            | Why it fails                                                                                                                         |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `Und wenn du das nächste Mal vor einer Zahl stehst: Sie ist nicht die Antwort. Sie ist die Frage.` | Antithesis + the number turned into a metaphor. The whole text was about a concrete queue; the last line abandons it for philosophy. |
| `Such dir einen Park und lies eine Zahl.`                                                          | Imperative two-parter with a symmetrical beat. Tells the reader nothing they cannot already see.                                     |
| `Das ist die ganze Geschichte in einer Tabelle.`                                                   | Restates the section, adds nothing.                                                                                                  |
| `X ist kein Y, sondern ein Z.`                                                                     | The antithesis frame itself.                                                                                                         |

The shapes to grep for: `ist nicht … , sondern …` in a final sentence,
`Sie ist nicht X. Sie ist Y.`, two imperatives joined by `und` as a heading,
any sentence where a concrete thing (a wait time, a park, a queue) becomes a
stand-in for an abstract one (an answer, a question, a promise).

**What to do instead.** Three endings that work:

1. **The concrete next action**, with the specifics kept: „Schau nach, was an
   dieser Bahn an einem Dienstag normal ist." Not „Schau genauer hin."
2. **A fact that has not been said yet** — a caveat, a number, a date.
3. **Nothing.** Let the last real paragraph be the last paragraph. A section is
   allowed to just stop.

The test: cover the last sentence and read the text without it. If nothing is
lost, it was decoration. If what is lost is only a _feeling of closure_, it was
the antipattern.

### Copy must not describe the page's own layout

`Links steht, was am Eingang hängt. Rechts dieselbe Zahl …` was wrong on every
phone, where the two panels stack. Same for „die letzte Stufe rechts" next to a
`flex-wrap` badge row, and „Chiapas daneben" next to a table where Chiapas is a
row _below_.

Describe the thing, not where it sits. Vertical order is usually safe („weiter
unten auf der Parkseite"), horizontal order almost never is, and „daneben" is
only safe when the two things are in one row at every breakpoint.

### Structural slop — the tells that survive a vocabulary pass

Swapping out banned words is the easy half. What actually makes a text read as
generated is its _rhythm_, and that survives any find-and-replace. Grep for
these before publishing:

- **`nicht X, sondern Y`.** The single most recognisable German LLM cadence.
  Two or three per long post is normal writing; eight is a machine.
  `grep -c "sondern"` — if it's above ~5 in 5.000 words, thin it out.
- **The `Claim: elaboration` colon.** Fine as a list introducer, exhausting as a
  paragraph rhythm. If most paragraphs pivot on a colon, rewrite half of them
  into plain sentences.
- **Triads everywhere** (`kompakt, begehrt und anstrengend`). One per section
  lands; three per section is a tic.
- **Paragraphs of uniform length.** Real writing has a two-line paragraph next
  to an eight-line one. Even blocks are a generation artefact.
- **Symmetrical closers** that restate the section in one tidy sentence
  (`Das ist die ganze Geschichte in einer Tabelle.`). Let a section just end.
- **Self-commentary of any kind** — the post referring to itself, its chapters,
  its own thesis, or how well it is written.
- **Both-sides hedging with no verdict** (`einerseits … andererseits`, `es kommt
darauf an`). Have an opinion; the byline is a person.

The check that catches the rest: read the finished post aloud. Anywhere the
rhythm turns metronomic, break the pattern — a short sentence, a dropped
connective, an aside.

Voice reference: `de/phantasialand-tipps.md` and
`de/toverland-troy-wartezeiten-tipps.md`.

---

## 9. Before you commit

```bash
pnpm generate:blog-manifest   # pick up new/renamed files
pnpm validate:translations    # message catalogs stay in sync
pnpm lint && pnpm build       # sanity check
```
