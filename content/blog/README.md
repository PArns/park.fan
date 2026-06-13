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
coverImage:
  src: /blog/images/welcome-cover.svg
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
avatar: /blog/images/authors/patrick.jpg
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
  Put the image under `/public` (e.g. `public/blog/images/authors/patrick.jpg`).
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

---

## 4. Categories & tags

- **Category** is a single slash-separated path string in frontmatter, e.g.
  `category: reports/europe/europa-park`. Labels per locale come from
  [`categories.json`](./categories.json) — add the path there to get a
  translated label and a tidy category page. Unknown paths fall back to the
  last segment.
- **Tags** are a free-form list. They are slugified for `/blog/tag/<tag>` pages
  and feed the sidebar tag cloud. Reuse existing tags where possible.

---

## 5. Images

Inline images use the alt text to carry a caption and alignment:

```md
![Alt text | Optional caption | align](/blog/images/foo.jpg)
```

- `align` is one of `center` (default), `left`, `right`, `wide`.
- Alignment can also come from a `?align=` query on the src, which wins:
  `![Alt](/blog/images/foo.jpg?align=wide)`.

---

## 6. Live widgets (code fences)

Block widgets are written as fenced code blocks named `<thing>-widget`, with
attributes on the info line (`key=value`, `key: value` or `key="value"`).

````md
```weather-widget slug=europa-park

```
````

| Widget              | Attributes                    | Renders                                  |
| ------------------- | ----------------------------- | ---------------------------------------- |
| `weather-widget`    | `slug`                        | Live weather + nowcast for a park.       |
| `best-days-widget`  | `slug`                        | Quietest upcoming days (crowd calendar). |
| `stats-widget`      | `slug`                        | Typical waits by month / weekday.        |
| `map-widget`        | `slug`                        | Interactive park map.                    |
| `glossary-widget`   | `slug` (a.k.a. `term` / `id`) | Full glossary definition inline.         |
| `gallery-widget`    | `folder` (or line-based body) | Photo gallery (see below).               |
| `park-widget`       | `slug`                        | Park spotlight card — use `ref:…?full`.  |
| `attraction-widget` | `parkSlug`, `slug`            | Ride spotlight card — use `ref:…?full`.  |

`park-widget` / `attraction-widget` still work but are **superseded by
`ref:slug?full`** — prefer the `ref:` form for new posts.

### Gallery

Point at a folder under `/public` (recommended) — every image is picked up,
sorted by filename, and a `captions.json` in that folder can override
alt/caption/credit:

````md
```gallery-widget folder=/blog/images/orlando-2026 heading="The trip in photos"

```
````

Or list images line by line in the body:

````md
```gallery-widget
- /blog/images/a.jpg | Alt text | Caption | © Credit
- /blog/images/b.jpg | Alt text
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

## 8. Before you commit

```bash
pnpm generate:blog-manifest   # pick up new/renamed files
pnpm validate:translations    # message catalogs stay in sync
pnpm lint && pnpm build       # sanity check
```
