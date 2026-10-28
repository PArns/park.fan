# Site search over the guides and the news

How the search palette (⌘K / Ctrl K, and the hero's field on the homepage), `/search`, the guides
panel in the header and the `/blog` and `/news` listings find posts, and how the palette ranks and
tabs its results. Open this page before changing any search surface. Which parks and rides the palette
lists is the API's call (`/v1/search`, the backend's
[search architecture](https://github.com/PArns/v4.api.park.fan/blob/main/docs/architecture/search.md)).

Every post surface reads one list of posts, built from the blog manifest and searched in the browser.

| Surface                     | Searches             | Where                                       |
| --------------------------- | -------------------- | ------------------------------------------- |
| Palette and hero field      | guides and news      | `SearchResultGroups`, tabs "Guides", "News" |
| `/search` ("all results")   | guides and news, all | `app/[locale]/search/page.tsx`              |
| Guides panel in the header  | guides               | `BlogMenuPanel`                             |
| `/blog` and its later pages | guides               | `ListingSearch scope="articles"`            |
| `/news` and its later pages | news                 | `ListingSearch scope="news"`                |

## The list

`getPostSearchIndex(locale)` in `lib/navigation/blog-menu.ts`, served by `/api/nav/posts/[locale]`
(static per deployment; ten minutes at the edge and in the browser, the window `/api/blog-latest` has;
`next.config.ts` and the route must agree, `pnpm test:post-search` checks it). Every post of the locale:
the articles first in the guides panel's order (most recently touched first), then the news, newest
first. Each entry is the panel's row (`toMenuPost`) plus three fields the row does not print:

- `terms`: the words of the post's SEO keywords and tags, each once.
- `parks`: the words of the park slugs whose pages list the post (`getParkSlugsOfPost`, the park index
  of `lib/blog/backlinks.ts` read backwards), so `parkLinks` decides here what it decides on park
  pages, and a post with `parkLinks: false` is found by its text only. This finds the posts about a
  park whatever their titles say.
- `news`, set on a news post, which carries its publication date rather than its last edit, because
  every surface shows a news post's age (`NewsAge`).

Size on 2026-10-15, 72 posts per locale: 12.2–13.2 KB brotli, of which the park words are 0.6–0.7 KB.

It is never rendered into a page. A surface asks for it when first used: the palette and the hero at
the first typed letter (most homepage views never search), the guides panel and the listing fields on
the first pointer over the field or its first focus. `usePostSearchIndex`
(`lib/hooks/use-post-search-index.ts`) holds one query key for all of them, so a tab asks once, and
narrows with a module-level `select` (`articles`, `news`), which keeps the narrowed array stable.

## Matching

`lib/navigation/post-search.ts`. Every word of the query must match, accents, case and „ß" folded with
`foldText`. A word matching at a word start counts fully; one inside a word counts half and only from
four letters, so „karte" finds „Jahreskarte" and „dis" does not find „Paradis". Weights
(`FIELD_WEIGHTS`): title 8, category and terms 4, parks 2, teaser 1; a park link ranks below a title
hit because a round-up lists a dozen parks, and above a teaser hit because the park page links the post.
Equal scores keep the list's order. `searchPostsBySection` splits the result into articles and news,
each cut and counted, for the palette and `/search`.

Two letters start a search on the listings and in the panel; the palette waits for three, like its
other queries, and searches its debounced query.

## In the palette

Results from two or more categories get a tab row between the field and the list: "All", then one
tab per category that found something, with its count (`SearchCategoryTabs`). The order is fixed so a
tab keeps its place between queries: places, parks, attractions, shows, restaurants, guides, news,
glossary (`buildSearchGroups`). A category's tab lists every row it has, without a heading: up to ten
of the API's per type, up to 20 guides or news. "All" lists five rows per park or ride group and three
per guides or news group, the heading counting all matches. A refined query keeps its tab while that
category still finds something; a cleared field goes back to "All".

Under "All" parks, places, rides, shows and restaurants come first whatever their score, then guides,
news and glossary (`rankForAll`); within each half groups are ordered by best score, ties in tab order.
A visitor who types a park or ride name wants that park or ride; the posts about it are one tab away.
As one ranking, a guide with "epic universe" in its title (50) beat Universal Epic Universe, whose name
only contains the query (30).

| Group                                                           | Score |
| --------------------------------------------------------------- | ----- |
| A name that is the query                                        | 100   |
| A name that starts with it                                      | 50    |
| A name that merely contains the query                           | 30    |
| Guides or news whose best match carries the query in its title  | 50    |
| Guides or news found by their tags, linked parks or teaser only | 45    |
| Glossary                                                        | 40    |

`titleMatch` on each section of `searchPostsBySection` says which of the two post scores a group gets.

**Keyboard.** Tab moves from the field to the active tab, ← and → switch, ↓ goes back to the field.
Enter on a tab is held in the tab row, since cmdk's root would open the highlighted result. A click on
a tab leaves the caret in the field. After a switch the panel sends cmdk a Home, which highlights the
first row; otherwise cmdk keeps its highlight on a row the new tab no longer lists and Enter opens
nothing. The tab paints on the press and the list follows a `useDeferredValue` copy inside one
force-mounted `TabsContent`
([an interaction may not rebuild the grid in its own commit](../rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md)).

The tab labels (`search.tabs`) ship with the chrome, as the palette's other strings do.

The palette is anchored 12svh from the top from `sm` up rather than centred, so a tab switch moves only
its lower edge. Its list takes the height the viewport leaves, up to 48rem (`LIST_HEIGHT_CLASS` in
`search-dialog.tsx`). The skeleton covers the post list's first fetch as it covers the debounce, so the
groups do not appear under rows already on screen. "All results" also shows when only posts matched.

A pick sends `search_result_clicked` with `result` `guide` or `news` and its place in its group, as
every other result does ([what is counted](#what-is-counted)).

A ride that does not match the query (every Disney Fantasyland ride under "phantasialand") comes from
the API's typo tolerance and is fixed there, not filtered here: the search payload does not carry a
ride's land, which is what matched.

## The list's height eases

The palette and the hero's list change height on every query (browse list → skeleton → results,
and the hero's resting rows opening to the whole list on focus). Both ease over 300 ms:
`useAnimatedHeight` (`lib/hooks/use-animated-height.ts`) watches the content and writes its height
onto the box around it, which carries the transition (`ANIMATED_HEIGHT_CLASS`), since CSS cannot
transition to `height: auto`. The palette wraps its panel in `AnimatedHeight`
(`components/common/animated-height.tsx`); in the hero the box under the field is the one that eases,
and the content inside carries the cap (`--hero-search-max-h`, once the list is opened), so the list
scrolls inside a box whose height is already final.

The hero's resting reservation is measured off the content plus the hairline and the frame's lower
border, not off the box, which is mid-ease when the list collapses back to rest.
`pnpm check:hero-search-rest` reads 485 / 485 / 485 px for the frame on a desktop and 424 / 424 /
424 on a phone, in all six locales ([homepage hero](homepage-hero.md#what-the-list-holds-at-rest)).

## On `/blog` and `/news`

`ListingSearch` (`components/blog/listing-search.tsx`) sits above the category pills on `/blog` and the
park filter on `/news`, and searches every article or every news post, not only the page on screen.
The server-rendered listing below is handed in as `children`; while a search shows results it is
`hidden`, not unmounted, and the field's state stays urgent while the swap reads a deferred copy. The
results are the stream's own entries (`PostSearchResultList`, `PostStreamEntry`). The field adds no
URL, so a listing page keeps its one canonical
([a listing page is a path with its own canonical](../rules/a-listing-page-is-a-path-with-its-own-canonical.md)).
Its strings are in `navigation`, which the chrome ships anyway.

## What is counted

Every search surface reports through our own statistic (`trackSiteEvent`,
`lib/analytics/site-analytics.ts`), never Umami, so a property costs nothing. The question it answers
is which search is used, from which page, and whether it finds what people want: the page type and
the viewport come with every hit, the surface with every search event.

| Surface          | Where                                       | An opening is                                                                                             |
| ---------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `hero`           | the homepage hero, desktop panel and phone  | a focus of the field that follows a blur; on a phone, the palette opened from the field or a tap on a row |
| `home_steps`     | the copy of the hero field in the step card | the same as `hero`                                                                                        |
| `header`         | the header's field and its icon             | the palette opened                                                                                        |
| `keyboard`       | ⌘K / Ctrl K                                 | the palette opened                                                                                        |
| `search_page`    | `/search`                                   | a load of the page (the form reloads it)                                                                  |
| `listing_guides` | `ListingSearch` on `/blog`                  | a focus that follows a blur                                                                               |
| `listing_news`   | `ListingSearch` on `/news`                  | a focus that follows a blur                                                                               |
| `guides_panel`   | the field in the header's guides panel      | a focus that follows a blur                                                                               |

| Event                   | Sent                                                                | Properties                                 |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| `search_opened`         | once per opening                                                    | `surface`                                  |
| `search_typed`          | once per opening, when a query of 3+ characters has settled         | `surface`                                  |
| `search_no_results`     | once per opening, when a settled query found nothing on the surface | `surface`                                  |
| `search_result_clicked` | a result opened                                                     | `surface`, `result` (its kind), `position` |
| `search_browse_clicked` | a row of the list shown before typing opened                        | `surface`, `item`, `position`              |
| `search_view_all`       | „Alle Ergebnisse", on the way to `/search`                          | `surface`                                  |

- **Per opening, so the rates divide.** `createSearchSession` (`lib/analytics/search-session.ts`)
  holds one opening at a time: a second focus inside it, a second query, a second dead end send
  nothing. A click before any opening opens one first (a tap on the hero's resting row on a phone, a
  click on the desktop's resting row without focusing the field); a click after a close counts for
  the opening that closed, because a click on a result blurs the field, and closes the palette,
  before it lands. The click rate and the no-result rate the admin computes therefore stay between
  0 and 1. `pnpm test:search-session`.
- **A blur is only a blur when focus went elsewhere.** Switching to another tab or window blurs the
  field but leaves it the page's focused element; coming back is the same opening
  (`searchFieldFocusProps`).
- **Settled** is the palette's debounced query (`SEARCH_SETTLE_MS`, 300 ms); the fields that search
  on every keystroke wait the same 300 ms (`useSettledQueryEvents`). `/search` counts the query it
  was loaded with.
- **`position`** is the row's place in its own group (the first park, the second guide), bucketed by
  `searchPosition`: 1, 2, 3, 4-5, 6-10, 11+. **`item`** says which list the row came from:
  `nearby_park`, `in_park_ride`, `popular_park`, `news`, `guide`.
- **The palette knows its surface**: `SearchCommand` opens it as its `searchOpenSource`, ⌘K as
  `keyboard`, and the hero's type-anywhere shortcut on a phone as `hero`; every event of that opening
  carries it.
- **Never the query**, not even its length: the events say whether a search ran, not what was
  searched. Lists a Server Component draws (`/search`) or that take no callback
  (`PostSearchResultList`) mark each link with `searchResultData` and count a click with one capture
  listener (`trackResultClick`).
- Only production hosts send, and not under Do Not Track, Global Privacy Control or the privacy
  page's opt-out; the facade decides.
