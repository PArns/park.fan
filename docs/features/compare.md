# Park comparison (`/compare`)

`/[locale]/compare?parks=…`: the visitor picks two to four parks and gets the comparison table the
posts embed with `park-comparison-widget` (park average, longest queue, quietest weekday). Open this
page before changing the page, the `parks` parameter or the picker. Posts link it with a selection
filled in; nothing in the site's navigation does.

| Piece                                        | Job                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| `app/[locale]/compare/page.tsx`              | Reads `?parks=`, resolves it, renders the hero and the tool              |
| `lib/compare/selection.ts`                   | `parseCompareParam`, `serializeCompare`, `MAX_COMPARE_PARKS` (4)         |
| `lib/compare/resolve.ts`                     | `resolveCompareParks`: references → table rows, plus the ambiguous slugs |
| `components/compare/park-compare-tool.tsx`   | The selection, the URL, the table (`ParkComparisonCard`)                 |
| `components/compare/compare-park-picker.tsx` | Park search through `/api/search`                                        |

**Not indexed.** `robots: { index: false, follow: true }` with or without a selection, and not in
the sitemap: the bare page is a search field and every `?parks=` variant is the same table under one
more URL. Whether it should be indexed is an open product decision; the canonical is the bare URL.

## The `parks` parameter

Comma-separated, at most four. Each entry is a bare park slug (`efteling`) or the full path
(`europe/france/paris/disneyland-park`, a leading `/parks/` accepted). A bare slug is not unique
(`disneyland-park` is Paris and Anaheim), so:

- `resolveCompareParks` reads the geo tree, the same cached document the header uses, so it costs no
  request of its own. A full path resolves exactly; a bare slug that two parks share resolves to the
  first in tree order; an unknown park is dropped and the others are shown.
- The page hands the shared slugs (`ambiguousSlugs`) to the client, and `serializeCompare` writes
  the full path only for those, so a shared link keeps its park and every other link stays short.
- Anything that is neither form, a duplicate and a fifth park are dropped, not guessed at: the value
  is typed by hand, pasted from chats and sent by crawlers. `pnpm test:compare-selection`.

## The tool

A pick updates the URL with `history.replaceState`, not `router.replace`: the server has nothing to
add about a pick, and a navigation would render the page again. The table's rows come from each
park's `/stats` aggregate on the client (`useParkComparisonStats`, through `useParkStatsQueries`, so
a ride-waits table on the same page shares the cache). The table's labels are translated on the
server and passed in, because they live in `parks` and `bestTime` namespaces this route does not
ship.

`CompareParkPicker` searches from the third character (`/api/search` answers nothing shorter),
debounced by 250 ms and aborting the request before. It is its own component rather than the trip
planner's park search, which would bring the 17 KB `planner` namespace for three strings.
