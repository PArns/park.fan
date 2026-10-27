# A ride that closed for good keeps its page (REQUIREMENT)

A ride retired as **closed** keeps its URL, answers 200, stays indexable and stays in the sitemap.
Its page says it is closed permanently and since when, links our news post about it in the
reader's language where the retirement names one, and shows what is still true: the waits before the
closure, the ride profile, the posts about it. Nothing that describes a running ride is drawn: no
live wait, today's curve, rope-drop advice, FAQ, planner button or favourite star.

- **Only `retiredKind === 'closed'` is a closure**, an editor's retirement. `reclassified` is one the
  backend's children sync wrote because the source now lists the entity as a show or a restaurant;
  it stays a 404 and out of the sitemap. Read `retiredKind`, never `retiredReason`, which is free
  text whose wording may change.
- **A closed ride is never one of the park's rides today.** The park payload carries it in
  `closedAttractions`, never in `attractions`, so every count, filter, planner and crowd figure reads
  the park as it is now. The park page lists `closedAttractions` under the ride grid
  (`ClosedRidesList`), and the park page's ride search finds them: a match is named under the live
  results, or in place of the empty line (`ClosedRideMatches`, `closedRideMatches` in
  `useAttractionFilter`), never as a card in the grid, and no filter pill applies to it.
- **A year after it closed, a ride leaves its park page by itself.** The API lists it in
  `closedAttractions` for `CLOSED_RIDE_PARK_PAGE_DAYS` (365) after `retiredAt` (`isOnParkPage()` in
  the backend). The ride page and its sitemap entry stay.
- **`retired_hidden` does the same sooner, and nothing else** (admin: Stilllegungen → „Auf Parkseite
  ausblenden"). An un-retirement clears it. The admin list shows per row whether a ride is on its
  park page (`onParkPage`).
- **A park that closed for good keeps its page too.** The park payload carries `retiredAt` and
  `retiredReason`; `isClosedPark` reads them, and the park route renders `ClosedParkPage` instead of
  the live shell: the same notice, post and closed-ride list, no live waits, crowd level, forecast,
  calendar or opening hours. Its JSON-LD drops opening hours and wait-time observations, and its
  calendar URL 308s to the park page.

## Why

X2 at Six Flags Magic Mountain was retired on 2026-07-13, with our own news post as the reason. The
ride page looked the ride up in the park payload only, which leaves retired rides out, and called
`notFound()`. For two months the post announcing the closure linked to a 404 and the URL was dropped
from the sitemap, throwing away every ranking the page had earned at the moment people search for
it most. Typing „x2" into Magic Mountain's ride search answered „Keine Attraktionen gefunden".

## Where it lives

| Piece                                    | File                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Is this a page? News post, source, date  | `lib/parks/closed-ride.ts` (`getClosedRide`, `isClosedRide`, `closedRidePost`, …)                            |
| The park page for a closed park          | `components/parks/closed-park-page.tsx`, `isClosedPark`, branch in the `[park]` route                        |
| The ride page                            | `components/parks/closed-ride-page.tsx`, branch in the `[attraction]` route                                  |
| Title and description                    | `buildClosedRideTitle` / `buildClosedRideDescription` in `lib/seo/attraction-meta.ts`                        |
| The badge „Dauerhaft geschlossen"        | `ParkStatusBadge status="RETIRED"`, also on blog references (`closedPermanently`)                            |
| The list and the search on the park page | `components/parks/closed-rides-list.tsx`, `components/parks/closed-ride-matches.tsx`, `closedRidesForSearch` |
| The admin switch                         | `setRetiredHidden` in `app/admin/_ui/retirement.ts`                                                          |
| Backend (v4.api.park.fan)                | `retiredKindOf()`, `buildClosedAttractions`, `SitemapService`                                                |

The detail endpoint is asked only after the park payload missed, so a live ride's render costs
nothing extra; `generateMetadata` and the page share the answer through `cache()`.

**Known limits.** A newly closed ride appears on its park page only once the park payload is
rebuilt; a shut park's payload is cached up to six hours in the API (`calculateDynamicTTL`) and a
day in the frontend's data cache, and hiding and showing the ride once in the admin evicts both. A
closed ride's sitemap entry carries no `<lastmod>`, because the content-change detector fingerprints
rides from the park payload. Its typical waits come from a 365-day window, so that chapter
disappears a year after the closure.

## Check

`pnpm test:closed-ride` pins the helpers and the meta builders.
