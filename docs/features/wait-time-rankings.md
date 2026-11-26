# Wait-time rankings

A country's rides ranked by how long their queues were over one calendar year, on a page of its
own, quoted on the ride pages and answered by Parky. The figures come from the API's
`/v1/rankings/attractions/:continent/:country?year=` (contract: the API repo's
`docs/frontend/attraction-rankings.md`), which merges each park's `topAttractions` query run over
the year. The order is the one the park's own wait-time record prints, across all parks.

## The page

`/<locale>/parks/<continent>/<country>/<segment>/<year>`, under the country page like a park's
sub-pages sit under the park, segments in `RANKING_SEGMENTS` (`lib/rankings/segments.ts`):
`longest-wait-times`, `laengste-wartezeiten`, `plus-longues-attentes`, `attese-piu-lunghe`,
`langste-wachttijden`, `esperas-mas-largas`. The English slug is the route folder
(`app/[locale]/parks/[continent]/[country]/longest-wait-times/[year]`); `next.config.ts` rewrites the
other five onto it and gives every segment a day's `CDN-Cache-Control` (`pnpm test:edge-windows`).
A city slugged like a segment would be shadowed, as at park level. `localizedPath` respells the
segment in a link written in English, and `unprefixedPathRedirect` sends a path without a locale to
the segment's own.

The rankings first went live at `/<locale>/<segment>/<continent>/<country>/<year>` for about an hour
on 2026-11-26 and moved under the country page; the old paths have no redirect.

`force-dynamic` behind the edge window, like the park sub-pages: the ranking is recomputed once a
day and data-cached for a day (`CACHE_TTL.stats`). A year before `FIRST_RANKING_YEAR` (2026), after
the running year, or a country with no ranked ride answers 404. Below `RANKING_MIN_INDEXED_RIDES`
(5) rides the page renders but is `noindex` and stays out of the sitemap.

| Part    | Renders                                                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Header  | country crumbs, „Längste Wartezeiten 2026: Deutschland", how many rides and parks, how far a running year is measured                                  |
| Podium  | `RankingPodium`: places 1 to 3 as cards with the ride's photo (else its park's), peak and typical                                                      |
| Table   | `AttractionRankingTable`: places 4 to 50 with the park under the ride and a bar for the peak against place 1; peak (the order), typical, measured days |
| Parks   | `RankingParks`: the listed rides counted per park, most first, with each park's best place                                                             |
| Method  | which rides enter (60 measured days), P50 and P90 per opening hour, closed days left out                                                               |
| JSON-LD | `BreadcrumbList`, `ItemList` of the rides                                                                                                              |

The year 2025 holds a few days of history and ranks nothing, which is why `FIRST_RANKING_YEAR` is 2026.

## The hub

`/<locale>/parks/<segment>` (`app/[locale]/parks/longest-wait-times`), under the parks hub: every
country ranked for the quoted year as a card with its first place and how many rides it lists,
longest lists first (`getRankedCountries`), with `BreadcrumbList` and `ItemList`. 404 while no
country is ranked. The header's „Mehr" band and the phone sheet link it (`MoreMenuLinks`).

## Links between the rankings

Under each ranking, `MoreRankings` links the hub, the other countries of the same year and the
country's other ranked years. The lists come from the data-cached requests the pages answer with,
so no link is a 404; the countries wait at most 3 s (`getRankedCountriesSeed`).

## Which year the site quotes

`currentRankingYear()` (`lib/rankings/year.ts`): the running year from March on, the previous one
in January and February, when a new year has too few measured days for the API's 60-day floor. The country
page's link, the ride pages and the sitemap all ask it, and Parky's `get_wait_ranking` follows the
same rule (`defaultRankingYear` in the API).

## Ways in

- **The country page** links „Längste Wartezeiten 2026" under its header, once the ranking ranks a
  ride.
- **A park's wait-time record** (`…/durchschnittliche-wartezeiten`) links its country's ranking
  under the method.
- **The header's „Mehr" band and the phone sheet** link the hub.
- **A ride page** in the top `RIDE_RANK_SHOWN` (10) of its country names its place in the data card
  („Platz 1 der längsten Wartezeiten 2026, Deutschland", with a link) and in its meta description
  (`factRank`, right after the ride type). Both read `getRideRank` (`lib/rankings/ride-rank.ts`).
- **The sitemap** lists every year from 2026 to the quoted one, per country, gated like the
  `noindex`, and the hub.
- **Parky** answers „längste Wartezeiten in Deutschland" and „welchen Platz hat Taron" with
  `get_wait_ranking` and links the page.

The quotes read `getCurrentRankingSeed`, bounded at 3 s by `withSeedTimeout`: the first request of
a day computes the country in the API across all its parks, and a page renders without the quote
rather than wait. `getCountryAttractionRanking` answers `null` on any failure, including an API
deployed before the route existed, so the frontend can ship first: the quotes stay away and the
pages 404 until the API has the route.
