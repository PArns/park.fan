# Site search over the guides and the news

The search palette (⌘K / Ctrl K, and the hero's field on the homepage) used to find parks, rides,
shows, restaurants, places and glossary terms, and nothing anyone had written. A search for
"disneyland" listed the two parks and their rides and none of the twelve posts about them. The
guides panel in the header could search the articles, and `/blog` and `/news` could not be searched
at all.

All of these now read one list of posts, built from the blog manifest and searched in the browser.

| Surface                     | Searches             | Where                                       |
| --------------------------- | -------------------- | ------------------------------------------- |
| Palette and hero field      | guides and news      | `SearchResultGroups`, tabs "Guides", "News" |
| `/search` ("all results")   | guides and news, all | `app/[locale]/search/page.tsx`              |
| Guides panel in the header  | guides               | `BlogMenuPanel`                             |
| `/blog` and its later pages | guides               | `ListingSearch scope="articles"`            |
| `/news` and its later pages | news                 | `ListingSearch scope="news"`                |

## The list

`getPostSearchIndex(locale)` in `lib/navigation/blog-menu.ts`, served by
`/api/nav/posts/[locale]` (static per deployment, ten minutes at the edge and in the browser, the
window `/api/blog-latest` has; `next.config.ts` and the route must agree, `pnpm test:post-search`
checks it). Every post of the locale, the articles first in the guides panel's order (most recently
touched first), then the news, newest first. Each entry is the panel's row (`toMenuPost`) plus three
fields the row does not print:

- `terms`: the words of the post's SEO keywords and tags, each once.
- `parks`: the words of the park slugs whose pages list the post, each once. They come from
  `getParkSlugsOfPost`, the park index of `lib/blog/backlinks.ts` read backwards, so `parkLinks`
  decides here what it decides on the park pages: a post with `parkLinks: false` is found by its
  text only. This is what finds the posts about a park whatever their titles say ("Single Rider: In
  welchen Parks du allein schneller fährst" for "disneyland").
- `news`, set on a news post. A news entry carries its publication date, not its last edit, because
  every surface shows a news post's age (`NewsAge`).

Measured from the manifest on 2026-10-15, 72 posts per locale (45 articles, 27 news): **12.2 to
13.2 KB brotli** (50.8 to 54.1 KB raw). The park words are 0.6 to 0.7 KB of that. The articles-only
list it replaces was 7.8 to 8.6 KB brotli for the same 45 articles.

It is never rendered into a page. A surface asks for it when it is first used: the palette and the
hero at the first typed letter (the hero mounts on every homepage view, and most of them never
search), the guides panel and the listing fields on the first pointer over the field or its first
focus. `usePostSearchIndex` holds one query key for all of them, so a tab asks once, and narrows the
list with a module-level `select` (`articles`, `news`), which keeps the narrowed array stable for the
fold cache below.

## Matching

`lib/navigation/post-search.ts`. Every word of the query has to match, accents, case and "ß" folded
with `foldText`. A word that starts a word counts fully; one inside a word counts half and only from
four letters, so „karte" finds „Jahreskarte" and „dis" does not find „Paradis". Weights: title 8,
category and terms 4, parks 2, teaser 1. A park link ranks below a title hit because a round-up lists
a dozen parks, and above a teaser hit because the park page links the post. Equal scores keep the
list's order. `searchPostsBySection` splits the result into the articles and the news, each cut and
each counted, for the palette and `/search`.

Two letters start a search on the listings and in the panel; the palette waits for three, like its
other queries, and searches its debounced query.

## In the palette

Results from two categories or more get a tab row between the field and the list: "All", then one
tab per category that found something, with its count (`SearchCategoryTabs`). The order is fixed,
so a tab keeps its place from one query to the next: places, parks, attractions, shows,
restaurants, guides, news, glossary (`buildSearchGroups`). A category's tab lists every row it
has, without a heading: up to ten of the API's per type, up to 20 guides or news. "All" lists five
rows per park/ride group and three per guides or news group, the heading counting all matches.
A refined query keeps its tab while that category still finds something; a cleared field goes
back to "All".

Under "All" the parks, places, rides, shows and restaurants come first, whatever their score, and
the guides, the news and the glossary after them (`rankForAll`). Within each half the groups are
ordered by their best score, and on equal scores in tab order.

| Group                                                           | Score |
| --------------------------------------------------------------- | ----- |
| A name that is the query                                        | 100   |
| A name that starts with it                                      | 50    |
| A name that merely contains the query                           | 30    |
| Guides or news whose best match carries the query in its title  | 50    |
| Guides or news found by their tags, linked parks or teaser only | 45    |
| Glossary                                                        | 40    |

The halves used to be one ranking, and a post with the query in its title tied with a name that
starts with it. For "disneyland" that put the Disneyland Paris guide above the rides; for "epic
universe" it put two guides and a news post above Universal Epic Universe, whose name only contains
the query (30 against 50). A visitor who types a park or a ride wants that park or ride, and the
posts about it are one tab away. `titleMatch` on each section of `searchPostsBySection` still says
which of the two post scores a group gets.

Keyboard: Tab moves from the field to the active tab, ← and → switch, ↓ goes back to the field.
Enter on a tab is held in the tab row, since cmdk's root would open the highlighted result with
it. A click on a tab leaves the caret in the field. After a switch the panel sends cmdk a Home,
which highlights the first row: cmdk would otherwise keep its highlight on a row the new tab no
longer lists, and Enter would open nothing. The tab paints on the press and the list
follows a `useDeferredValue` copy, inside one forced-mounted `TabsContent`
([an interaction may not rebuild the grid in its own commit](../rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md)).

The nine tab labels (`search.tabs`) ship with the chrome, as the palette's other strings do: the
layout's messages went from 9,313 to 9,497 B raw (`pnpm check:client-messages`).

The palette is anchored 12svh from the top on `sm` and wider rather than centred, so a tab switch
moves only its lower edge. Its list takes the height the viewport leaves, up to 48rem
(`LIST_HEIGHT_CLASS` in `search-dialog.tsx`); it was capped at 420px.

The skeleton covers the list's first fetch as it covers the debounce, so the two groups do not
appear under rows already on screen. "All results" now also shows when only posts matched, since
`/search` lists them, each in a section of its own.

A pick sends `search_result_clicked` with `resultType` `guide` or `news`, the position and the
query length: the properties every other result sends
([Umami event budget](../rules/umami-event-budget.md)).

## The list's height eases

The palette and the hero's dropdown change height on every query: the browse list gives way to
the skeleton, the skeleton to the results, and the hero's three resting rows open to the whole
browse list on focus. Both ease there over 300 ms instead of jumping. `useAnimatedHeight`
(`lib/hooks/use-animated-height.ts`) watches the content and writes its height onto the box
around it, which carries the transition (`ANIMATED_HEIGHT_CLASS`), since a CSS transition cannot
follow `height: auto`. The palette wraps its panel in `AnimatedHeight`; in the hero the card
itself is the box, and the content inside it carries the card's `--hero-search-max-h` cap, so the
list scrolls inside a box whose height is already final. The hero animated only the focus change
before, with a GSAP tween; that tween and its `gsap` import are gone.

Measured in Chromium for "phantasialand": the palette went from 431 to 752 px in one frame and now
passes 628, 722 and 749 px; the hero went from 336 to 441 px and now passes 393, 421 and 436 px.

The hero's resting reservation is measured off the content plus the card's border, not off the
card. The card is mid-ease when the list collapses back to rest, and a reservation taken then
would move the pills down and up again. `pnpm check:hero-search-rest` reads 272 / 270.3 / 270.3 px in
all six locales, as before.

Which parks and rides the palette lists is the API's call (`/v1/search`,
[search architecture](https://github.com/PArns/v4.api.park.fan/blob/main/docs/architecture/search.md)).
A ride that does not match the query, such as every Disney Fantasyland ride under
"phantasialand", comes from its typo tolerance and is fixed there rather than filtered here: the
search payload does not carry a ride's land, which is what matched.

## On `/blog` and `/news`

`ListingSearch` (`components/blog/listing-search.tsx`) sits above the category pills on `/blog` and
the park filter on `/news`. It searches every article or every news post, not only the page on
screen. The listing below it is rendered on the server and handed in as `children`; while a search
shows results it is `hidden`, not unmounted, and the field's state stays urgent while the swap reads
a deferred copy
([an interaction may not rebuild the grid in its own commit](../rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md)).
The results are the stream's own entries (`PostSearchResultList`, `PostStreamEntry`). The field adds
no URL, so a listing page keeps its one canonical
([a listing page is a path with its own canonical](../rules/a-listing-page-is-a-path-with-its-own-canonical.md)).

Its strings are in `navigation`, which the chrome ships anyway, so the field costs these pages no
messages. The four new strings (`navigation.searchNews`, `navigation.searchNewsEmpty`,
`search.headings.guides`, `search.headings.news`) grew the chrome's messages by 135 to 170 B raw per
locale.
