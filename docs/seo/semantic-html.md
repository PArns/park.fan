# Semantic HTML

What the markup of a page tells a reader that is not a person looking at it: Google's indexer, a
crawler that runs no JavaScript, a screen reader. JSON-LD ([structured data](../../components/seo/structured-data.tsx),
[analysis](analysis.md)) says what a page is about; the elements say how it is built, which part
is navigation, where the content starts and ends, what is a chapter and what a date.

The two standing rules:

- [The chrome is in the first HTML, in reading order](../rules/the-chrome-is-in-the-first-html-in-reading-order.md)
- [The markup says what each part is](../rules/the-markup-says-what-each-part-is.md)

Both are checked by `pnpm check:semantic-html` against a running site.

## Why it matters here

- **Google separates boilerplate from content by the landmarks.** The header's 99 links and the
  footer's 45 are on every page; inside `<header>`/`<nav>`/`<footer>` they read as the site's
  navigation, and the content is what `<main>` and the page's `<article>` hold. A post whose
  `<article>` also held the related posts and the ride list of „Attraktionen im Beitrag" offered
  those as part of the post.
- **Headings are how a long page is cut into passages.** A post with a „Du magst park.fan?" `<h2>`
  between its chapters, or sources as an `<h3>` under its FAQ, has an outline that does not match
  what it says.
- **Not every crawler renders.** GPTBot, ClaudeBot, PerplexityBot and Common Crawl read the HTML as
  served; for them, content that React moves into place by script is content in a `<div hidden>`.
  This site publishes `llms.txt` and an MCP endpoint for those readers ([agent
  readiness](agent-readiness.md)).

## The audit (2026-10-27)

Every page type rendered in German, counted in the DOM after hydration, and the production HTML of
a post read as served (Vercel deployment `dpl_AJKJhTqF7zBfkPAanYy1oRZrNBvt`).

| Finding                                   | Before                                                                                    | After                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Site header and footer in the served HTML | after `</main>`, in `<div hidden id="S:0">` and `"S:14"`                                  | header before `<main>`, footer right after `</main>`        |
| `<nav>` landmarks per page                | 7–12; „Breadcrumb" twice; „Main navigation" and „Breadcrumb" in English on every locale   | 3–7, each named once, from `messages/`                      |
| Footer                                    | 6 `<nav>`, 45 links, 0 lists, `<section>`s without a heading                              | 2 `<nav>` (popular parks, site sections), 9 lists           |
| Breadcrumbs                               | links and arrows straight in the `<nav>`                                                  | one `<nav>`, an `<ol>` of steps, `aria-current` on the leaf |
| Blog post `<article>`                     | started below the banner: no `<h1>`, no byline, no date; ended after „Meistgelesen"       | banner `<header>` to the tags `<footer>`                    |
| „Aktualisiert …" on a post                | plain text                                                                                | `<time datetime>`                                           |
| Sources in 55 posts × 6 locales           | `### Quellen & Weiterlesen`, under the FAQ                                                | `## Quellen & Weiterlesen`, a chapter                       |
| Glossary overview                         | 322 headings, one `<h3>` per term                                                         | 12 `<dl>`, 13 headings                                      |
| Glossary term page                        | no `<dfn>`                                                                                | `<dfn>` in the `<h1>`, inside an `<article>`                |
| `/parks`                                  | `<h1>` → `<h3>` (the continents)                                                          | `<h1>` → `<h2>`                                             |
| Closed ride (X2)                          | `<h1>` → `<h3>` (the notice's title)                                                      | notice title is a `<p>`                                     |
| Park and post cards on desktop            | name in a `<span>`; only the phone row had the `<h3>`                                     | both have the `<h3>`                                        |
| Microdata                                 | `itemscope` with no `itemprop` on the park, ride, closed park and closed ride `<article>` | none; JSON-LD only                                          |
| Duplicate `id`s                           | `s`, `s4`, `s5`, `s9`, `s18` from the flags on every page                                 | none                                                        |
| Skip link                                 | none                                                                                      | first in the page, to `<main id="main-content">`            |

The flags were more than invalid HTML. `FlagGB` clipped its whole drawing with
`clip-path="url(#s)"` and `FlagUS` named its star `id="s"`, so on a page with both the British flag
was clipped by the American star. `FlagUS` also stacked its rows with nested `<use>`s, one of them
pointing at an `#s3` that never existed, and drew stars outside the canton. Both are plain shapes
now; at 600 × 300 px the British flag renders the same as before, the American one with its 50
stars.

## Checklist by page type

Every page: one `<h1>` in `<main>`, no skipped level, the site's `<header>`/`<main>`/`<footer>` in
order in the served HTML, every `<nav>` named once and its links in a list, every visible date in a
`<time datetime>`, no `itemscope`, no duplicate `id`.

| Page type                                        | What to look at                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blog post, news post (`BlogPostPage`)            | `<article>` = banner `<header>` (`<h1>`, author link, `<time>` published and changed) + body + tags `<footer>`. ToC is `<nav>` + `<ol>` in an `<aside>`. Chapters are `##` (`ChapterHeading`), sources a `##` too. A widget's label is a `BlogWidgetLabel`, not a heading. Quotes and images are `<figure>`s. |
| Blog and news listings                           | Each entry an `<article>` with its title in an `<h3>` and its date in a `<time>`; pagination a named `<nav>` with a list (`ListingPagination`); categories a named `<nav>`.                                                                                                                                   |
| Park page                                        | `<article>` around the park; breadcrumbs as one `<nav>`; ride cards `<article>` + `<h3>`; the address in `<address>`; tabs as `tablist`/`tabpanel` with every panel in the HTML.                                                                                                                              |
| Ride page, closed ride                           | `<article>` with the `<h1>`; the section tiles are a named `<nav>` (open: its links are grid cells, not a list); a notice's title is a `<p>`.                                                                                                                                                                 |
| Park sub-pages (calendar, statistics, with kids) | One `<h1>`; the calendar's month index a `<nav>` with a list of years; tables with `<thead>` and `<th scope>`.                                                                                                                                                                                                |
| Geo hubs (`/parks`, continent, country, city)    | Cards directly under the `<h1>` take `headingAs="h2"`; under a city's `<h2>`, park cards keep their `<h3>`.                                                                                                                                                                                                   |
| Glossary                                         | Overview: a `<dl>` per category under its `ChapterHeading`. Term: `<article>`, `<dfn>` in the `<h1>`, related terms in a named `<aside>`.                                                                                                                                                                     |
| Landing pages and hubs                           | The anatomy of [a landing page](../rules/a-landing-page-has-one-anatomy.md) (`pnpm check:landing-pages`) plus the above; a chapter list is one `<nav>` with an `<ol>` (`ChapterList` on the guide).                                                                                                           |
| Homepage                                         | Every band of items opens with its own `<h2>`; a label over a featured item is a `<p>`.                                                                                                                                                                                                                       |

## Left open on purpose

- **`<section>` without a name.** 26 on the homepage. A named section becomes a `region` landmark,
  and twenty regions on one page are a list a screen reader user has to read past; search engines
  read the headings inside them either way. Name a section only where it is one of a page's few
  main areas.
- **The ride page's section tiles** (`RideNavTiles`) are a `<nav>` whose links are the grid cells;
  their hairlines are drawn by the cells, so a list item between grid and link needs a design pass.
  Listed in the check's `OPEN`.
- **A spotlight card in a post's lead** (`[Park](ref:park?full)` before the first `##`) puts the
  card's `<h3>` straight under the `<h1>`; where it stands is the author's call. Listed in `OPEN`.
- **The phone menu** is a Radix sheet that unmounts when closed, so it is in no HTML a crawler gets;
  the header's `<nav>` carries the same links.

## Verifying a change

```bash
pnpm dev                    # or pnpm build && pnpm start
pnpm check:semantic-html    # every page type, both passes
```

To see the served order by hand, read byte offsets from the HTML as served:

```bash
curl -s localhost:3000/de/blog/europa-park-oder-phantasialand -o /tmp/p.html
grep -bo '<header\|<main\|</main>\|<footer\|hidden id="S:' /tmp/p.html | head
```
