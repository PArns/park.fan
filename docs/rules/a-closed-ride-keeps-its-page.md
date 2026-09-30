# A ride that closed for good keeps its page (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning and the pieces that implement it.

## What happened

X2 at Six Flags Magic Mountain was retired on 2026-07-13, and the retirement's reason was our own news post. The API kept answering on the ride's detail endpoint, as the backend's `retiredAt` docstring promises. The ride page looked the ride up in the park payload only, which leaves retired rides out, and called `notFound()`. For two months the post announcing the closure linked to a 404, the post's inline reference read „Geschlossen" as if the ride would open tomorrow, and the URL had also been dropped from the attraction sitemap (2026-09-24, 70 retired rows then). Every ranking the page had earned while the ride ran was being thrown away at the moment people search for it most.

## The rule

A ride retired as **closed** keeps its URL, answers 200, stays indexable and stays in the sitemap. Its page says it is closed permanently and since when, links our news post about it in the reader's language where the retirement names one, and shows what is still true: the waits before the closure, the ride profile, the posts about it. Nothing that describes a running ride is drawn on it: no live wait, today's curve, rope-drop advice, FAQ, planner button or favourite star.

**Two kinds of retirement, and only one is a closure.** The backend's `retiredKind` says which: `closed` for a retirement an editor entered, `reclassified` for one the children sync wrote because the source now lists the entity as a show or a restaurant. Nothing closed in the second case, so it stays a 404 and stays out of the sitemap. Read `retiredKind`, never `retiredReason`: the reason is free English text and the sync's marker wording may change.

**A closed ride is never one of the park's rides today.** The park payload carries it in `closedAttractions`, a list of its own, and never in `attractions`. Every count, filter, planner and crowd figure reads `attractions` as the park as it is now. The park page lists `closedAttractions` under the ride grid (`ClosedRidesList`), each row linking to the ride's page. The ride search on the park page looks through them too: typing „x2" on Magic Mountain's page answered „Keine Attraktionen gefunden" on 2026-09-30. A match is named under the live results, or in place of that line when it is the only one (`ClosedRideMatches`, `closedRideMatches` in `useAttractionFilter`), never as a card in the grid, and no pill or rider height applies to it.

**A year after it closed, a ride leaves its park page on its own.** The API lists it in `closedAttractions` for `CLOSED_RIDE_PARK_PAGE_DAYS` (365) after `retiredAt` and then drops it (`isOnParkPage()` in the backend), so it leaves the list under the grid and the ride search together. From then on it answers only on its own URL. The ride page and the sitemap entry stay, because the URL's ranking does not expire with the visitor's interest in the park's history.

**Hiding does the same sooner, and nothing else.** `retired_hidden` (admin: Stilllegungen → „Auf Parkseite ausblenden") takes a ride off the park page before the year is up. An un-retirement clears the flag. The admin's list says per row whether a ride is on its park page (`onParkPage`), and marks one the year took off.

## Where it lives

| Piece                                   | File                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| Is this a page? News post, source, date | `lib/parks/closed-ride.ts` (`getClosedRide`, `closedRidePost`, …)                       |
| The ride page for it                    | `components/parks/closed-ride-page.tsx`, branch in the `[attraction]` route             |
| Title and description                   | `buildClosedRideTitle` / `buildClosedRideDescription` in `lib/seo/attraction-meta.ts`   |
| The badge „Dauerhaft geschlossen"       | `ParkStatusBadge status="RETIRED"`, also on blog references (`closedPermanently`)       |
| The list on the park page               | `components/parks/closed-rides-list.tsx`                                                |
| The park page's ride search             | `components/parks/closed-ride-matches.tsx`, `closedRidesForSearch`                      |
| The admin switch                        | `setRetiredHidden` in `app/admin/_ui/retirement.ts`                                     |
| Backend                                 | `retiredKindOf()`, `buildClosedAttractions`, `SitemapService` (v4.api.park.fan PAR-607) |

The detail endpoint is asked only after the park payload missed, so a live ride's render costs nothing extra; `generateMetadata` and the page share the answer through `cache()`.

## Not done yet

- A closed ride appears on its park page only once the park payload is rebuilt, and a shut park's payload is cached for up to six hours in the API (`calculateDynamicTTL`) and for a day in the frontend's data cache. Hiding and showing the ride once in the admin (Stilllegungen) evicts both at once.

- The content-change detector fingerprints rides from the park payload, so a closed ride's sitemap entry carries no `<lastmod>`. A path the detector has never seen gets no tag rather than a guess, which is the documented behaviour.
- The ride page's typical waits come from a 365-day window, so a year after the closure the chapter disappears on its own, because the API stops marking the figures `displayable`.

`pnpm test:closed-ride` pins the helpers and the meta builders.
