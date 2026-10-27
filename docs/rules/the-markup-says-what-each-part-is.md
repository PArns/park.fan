# The markup says what each part is (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

A page tells a search engine, a crawler without JavaScript and a screen reader which part is the
site's navigation, which is the page's own content, where a chapter starts and what a date or a
definition is. JSON-LD says what the page is about ([structured data](../../components/seo/structured-data.tsx));
the elements say how the page is built. Both have to be right, and only the second one is read on
every page by every reader. The audit and the numbers behind each point:
[semantic HTML](../seo/semantic-html.md).

## Landmarks

- **One `<header>`, one `<main>`, one `<footer>` for the site**, in that order in the served HTML
  ([the chrome is in the first HTML](the-chrome-is-in-the-first-html-in-reading-order.md)). The
  skip link is the first thing in the page and points at `<main id="main-content">`.
- **A `<nav>` is a block of the site's own navigation**: the header, the breadcrumbs, a page's
  chapter list, the footer's popular parks and its site sections. Two links to other sites
  (API docs, GitHub) are a list, not a `<nav>`.
- **Every `<nav>` has a name from `messages/`**, never an English string in the component, and no
  two on a page share one. `Main navigation` and `Breadcrumb` were hard-coded in English on all six
  locales until 2026-10-27.
- **One block, one `<nav>`, whatever the breakpoint.** When a phone and a desktop see different
  markup for the same navigation, both sit inside the one `<nav>` and CSS picks one
  (`BreadcrumbNav`: the phone's back link and the desktop trail). A second copy that only repeats
  the first is not a landmark (`ChapterRail` on the guide is a `<div role="group">` beside
  `ChapterList`).
- **The links of a `<nav>` are a list**: `<ol>` where the order means something (breadcrumbs,
  chapters), `<ul>` otherwise. When the list item breaks a layout that relies on the link being the
  flex or grid item, make the item `flex flex-col` so the link still stretches (the footer's
  columns, the post's previous/next pair).

## Headings

- **One `<h1>`, inside `<main>`, and no level skipped below it.** A card that stands right under the
  `<h1>` takes its heading one level up (`GeoLocationCard headingAs="h2"` on `/parks`).
- **A heading names a chapter or an item.** A label over a widget, a card, a notice or a request is
  a `<p>`: `BlogWidgetLabel` („Park im Fokus", „Wetter", „Karte"), the title of a `GlassNotice`,
  „Am vollsten" over a park in the homepage's statistics, „Du magst park.fan?" in
  `PreferredSourcePrompt` (an `<aside>`). As headings they stood in the outline of every post and
  park page, one of them straight under the `<h1>` of a closed ride.
- **A section that holds items has a heading of its own**, so the items' `<h3>`s do not hang under
  the chapter before it (the homepage's blog band, „Aus dem Blog").
- **In a post, sources are a chapter**: `## Quellen & Weiterlesen` after the `---`, never `###`
  ([blog authoring](../../content/blog/README.md#7-niceties-automatic--nothing-to-write)).

## Articles and cards

- **An `<article>` holds its own heading.** A post's `<article>` wraps the banner's `<header>`
  (`<h1>`, byline, dates), the body and the tags (`<footer>`); sharing, previous/next, related posts
  and the reading lists stand after it (`BlogPostPage`). Before, the `<h1>` stood outside and twelve
  ride names from „Attraktionen im Beitrag" stood inside.
- **A card is an `<article>` with an `<h3>`, and so is its phone row.** `ParkCard` and
  `BlogPostCard` draw two markups and CSS shows one ([a blog card is a row on
  phones](a-blog-card-is-a-row-on-phones.md)); both carry the name as an `<h3>`, so every width has
  one heading per item.
- **A whole card is clickable through its title's link**, stretched over the card
  (`CARD_WIDE_LINK_CLASS`), never by wrapping the card in an `<a>`. That is what lets the title be a
  heading or a `<dt>`.

## Dates, definitions, quotes

- **Every date a reader sees is a `<time datetime>`**, the change date of a post too („Aktualisiert
  …"), so the visible date and `dateModified` can be matched.
- **A glossary is a definition list.** The overview is one `<dl>` per category, each card a
  `<dt>` (the term's link) and `<dd>`s (`GlossaryTermCard`); a term page is an `<article>` whose
  `<h1>` holds the term in a `<dfn>`.
- **A quote is a `<figure>`** with the `<blockquote>` and the source in a `<figcaption>`
  (`BlogQuote`); an image with a caption likewise.

## What the markup does not carry

- **No microdata.** JSON-LD describes the page; an `itemscope` with no `itemprop` under it is an
  empty second item of the same type (four page templates carried one until 2026-10-27). The one
  microdata block left, the glossary widget's `DefinedTerm`, fills its properties.
- **No `id` inside a component that renders more than once per page.** The flags drew their
  stars and clip paths with `<use href="#s">` and `clip-path="url(#s)"`; with a British and an
  American flag on one page, `url(#s)` resolved to the American star. Draw the shape instead, or
  take `useId()` where only React renders it (the flags also render in the OG images, which run no
  hooks).

## Check

`pnpm check:semantic-html` (`scripts/check-semantic-html.mjs`) renders one URL per page type and
fails on: chrome out of order or inside a streamed hole, not exactly one `<h1>` in `<main>`, a
skipped heading level, an unnamed or doubly named `<nav>`, a `<nav>` whose links are in no list, an
`<article>` with text but no heading, a `<time>` without `datetime`, an empty `itemscope`, a
duplicate `id`, an `<img>` without `alt`, and a skip link that does not reach `<main>`. Exceptions
waiting on a decision are listed in its `OPEN` and printed on every run. Needs a running site.
