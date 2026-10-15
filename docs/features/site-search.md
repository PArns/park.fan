# Site search over the guides and the news

The search palette (⌘K / Ctrl K, and the hero's field on the homepage) used to find parks, rides,
shows, restaurants, places and glossary terms, and nothing anyone had written. A search for
"disneyland" listed the two parks and their rides and none of the twelve posts about them. The
guides panel in the header could search the articles, and `/blog` and `/news` could not be searched
at all.

All of these now read one list of posts, built from the blog manifest and searched in the browser.

| Surface                     | Searches             | Where                                         |
| --------------------------- | -------------------- | --------------------------------------------- |
| Palette and hero field      | guides and news      | `SearchResultGroups`, groups "Guides", "News" |
| `/search` ("all results")   | guides and news, all | `app/[locale]/search/page.tsx`                |
| Guides panel in the header  | guides               | `BlogMenuPanel`                               |
| `/blog` and its later pages | guides               | `ListingSearch scope="articles"`              |
| `/news` and its later pages | news                 | `ListingSearch scope="news"`                  |

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

Two groups, "Guides" and "News", three rows each, the heading counting all matches. Groups are
ordered by their best score, and on equal scores in the order `SearchResultGroups` pushes them:
parks and places, then the guides and the news, then rides, shows and restaurants, then the
glossary.

| Group                                                           | Score |
| --------------------------------------------------------------- | ----- |
| A name that is the query                                        | 100   |
| A name that starts with it                                      | 50    |
| Guides or news whose best match carries the query in its title  | 50    |
| Guides or news found by their tags, linked parks or teaser only | 45    |
| Glossary                                                        | 40    |
| A name that merely contains the query                           | 30    |

The tie at 50 is the point. For "disneyland" the first measured order was Parks, Attractions, Shows
and then Guides, so the Disneyland Paris guide sat under "Disneyland Band at Castle Promenade". It is
Parks, Guides, News, Attractions, Shows now. A post found only through its other fields stays
under the names that start with the query, because there the visitor most likely meant the ride:
for "big thunder" the Big Thunder Mountain rides come first, then the Disneyland Paris guide, which
names the ride in its keywords only. `titleMatch` on each section of `searchPostsBySection` says
which of the two a group is.

The skeleton covers the list's first fetch as it covers the debounce, so the two groups do not
appear under rows already on screen. "All results" now also shows when only posts matched, since
`/search` lists them, each in a section of its own.

A pick sends `search_result_clicked` with `resultType` `guide` or `news`, the position and the
query length: the properties every other result sends
([Umami event budget](../rules/umami-event-budget.md)).

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
