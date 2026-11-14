# Trip regions

A trip region is a set of parks a visitor plans as one trip: a crowd calendar hub with its month
pages, best-time pages and the trip planner. Orlando is the first; Southern California, Japan and
Paris are in the registry and not live yet. Open this page before adding a region, changing a
region's URL or moving code between the shared part and a region's own. What one hub shows is
[orlando-hub](orlando-hub.md), the planner [orlando-planner](orlando-planner.md), the best-time pages
[orlando-best-time](orlando-best-time.md); those pages describe Orlando, and every other region gets
the same pages from the same code.

## A region is config, messages and a scene

| Part     | Where                                                           | What                                                                                                                                                                                   |
| -------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Config   | `lib/trip-regions/registry.ts`, `lib/trip-regions/regions/*.ts` | `TRIP_REGIONS`: slug, `live`, URL segment per locale, zone, centre, photo, scene, best-time pages, hub (hero photos, the FAQ's parks and questions), hotels, ticket step, storm season |
| Messages | `tripRegions.<slug>` in `messages/*.json`                       | the region's own words: `nav`, `hub`, `bestTime`, `planner`, `homeStory`                                                                                                               |
| Scene    | `components/assistant/parky/<slug>-scene.tsx`                   | the Parky picture of the planner band's tile, built on `HolidayParky` (`holiday-parky.tsx`)                                                                                            |
| API      | `/v1/trip-regions/<slug>` and its routes                        | parks, groups, hotel areas, travel, calendar, plan, tickets: everything the code does not hold                                                                                         |

Nothing outside `lib/trip-regions/registry.ts` and `lib/trip-regions/regions/` names a region. The
rest of the code reads the registry: `LIVE_TRIP_REGIONS` for what a reader may see,
`tripRegionConfig(slug)` / `requireTripRegion(slug)` for a slug a page or an answer carries. The
modules are `lib/trip-regions/` and `components/trip-regions/`; Orlando's own rules (its resorts,
its ticket entries, the hurricane season, Magic Kingdom's fireworks, the TTC transfer) are fields of
`regions/orlando.ts`, so the planner asks the fireworks question, keeps "Disney days and Universal
days" together and names a storm season only where a region's entry says so.

A region with `live: false` has no page (the routes answer 404), no sitemap entry, no menu tile,
no band, no search row and no OG card. The relay serves it to the admin alone, whose ticket page
switches between every region of the registry, so a catalog is filled before its region goes live.

## One route folder, rewritten from each region's segments

Every region's hub, months and best-time pages are one route folder,
`app/[locale]/trip-regions/[region]/[[...date]]` and `…/best-time-to-visit/[[...resort]]`.
`next.config.ts` builds three sets of rules for each live region from the registry
(`lib/trip-regions/routes.ts`):

| Rule     | Example                                                                                  |
| -------- | ---------------------------------------------------------------------------------------- |
| rewrite  | `/de/kalifornien` → `/de/trip-regions/southern-california`                               |
| rewrite  | `/de/orlando/beste-reisezeit/disney-world` → `…/orlando/best-time-to-visit/disney-world` |
| redirect | `/de/trip-regions/orlando` → `/de/orlando`: the folder is never a second address         |
| redirect | `/de/california` → `/de/kalifornien`, `/fr/japan` → `/fr/japon`                          |
| redirect | `/kalifornien` → `/de/kalifornien`, where one locale spells the segment                  |
| redirect | `/de/orlando/best-time-to-visit` → `/de/orlando/beste-reisezeit`                         |
| window   | the hub and the best-time pages an hour, a month page twelve hours (`CDN-Cache-Control`) |

A segment every locale shares (`/orlando`, `/paris`) has no unprefixed redirect; the proxy
negotiates the language as before. The proxy's month redirects (`tripRegionRedirect`), the
sitemap, hreflang (each locale's own segment), `localizedPath` (a written `/kalifornien` respelled
for the reader) and the language switcher (which follows hreflang) read the same registry.

**Why one folder and not a folder per region.** A region's URL is spelled per locale
(`/kalifornien`, `/california`, `/californie`), so a folder per region would still need a rewrite
for every other spelling, and its two `page.tsx` files would be copies that differ in one constant.
The folder would also put the region's name back into the code, which is the coupling this work
removes. With one folder a region is an entry, and the rules that serve it are generated and
tested from the same entry (`pnpm test:trip-regions` runs them for every region, live or not, with
Next's own path matcher). A dynamic `app/[locale]/[region]` beside the other top-level folders was
not an option either: it would answer every unknown first segment, beside `[...rest]`. The cost of
the rewrite is the one redirect that keeps the folder's own path from being a second address, and
that `test:trip-regions` checks a segment never equals a route folder or the best-time hub.

## Data

`lib/trip-regions/api.ts` reads a region's routes on the server under its own tags,
`trip-region:<slug>` and `trip-tickets:<slug>` (the API's revalidation webhook names them); the
browser asks through the relay, `/api/trip-regions/<slug>/…` (`tripRegionRelayUrl`), which accepts
the registry's slugs. Query keys and the planner's stored choices carry the region
(`parkfan_<slug>_view`, `parkfan_<slug>_tickets_asked`, so Orlando's browsers keep theirs).

The planner band's park count and its longest trip are the API's: `GET /v1/trip-regions` (the
list of regions, a day in the Data Cache under `trip-regions`; `parkCount`, `maxTripDays`), else
each region route's `parks[]` for the count and `MAX_TRIP_DAYS` for the days
(`getTripRegionNavFacts`). Both reads go at once, bounded to 1.5 s, so a slow API costs the band its
count chip and nothing else. A failed list read is not asked again for ten minutes in that process,
since the Data Cache keeps only a 200.

A best-time page whose `/when` fails (a 401 from a revoked data key, a timeout) renders with
`noWhenAnswer`, an answer without windows, weeks or months, and says it has no figures yet, as the
hub does; it never answers 500.

## Messages

| Namespace              | What                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `tripHub`              | the hub's words every region shares: the calendar, the key, the day sheet, the band       |
| `tripBestTime`         | the best-time pages' shared chapters                                                      |
| `tripPlanner`          | the planner's shared words                                                                |
| `tripRegions.<slug>.*` | the region's own: titles, intro, FAQ, method, its hotels, ticket entries, school holidays |

A Server Component reads a region's words with `getRegionTranslations(slug, part)`. A Client
Component cannot name a region, so it reads them under the alias `tripRegion`
(`useTranslations('tripRegion.planner.options')`); the route ships the region's copy under that
alias (`<RouteMessages route=… region={slug}>`, `pickRouteMessages`), and only that region's. The
route-namespace walk sees the alias like any namespace, so `pnpm check:client-messages` covers it.
Where an API code may be said a region's own way (`no_school_break` is "No US school holidays" in
Orlando), `regionOrShared` takes the region's words if it has the key and the shared ones else.

## For every hub

The hub is one component for every region, so its contract is the same for each: which blocks it
draws, which words each needs from `tripRegions.<slug>`, and what a block does without them. A block
reads a region key through `ownWords` (`lib/trip-regions/region-words.ts`) and draws nothing where
the region has not written it; a key path is never printed (on the server the request config also
renders a missing `tripRegions.*` key as nothing).

| Block        | Region keys (`tripRegions.<slug>.…`)                                                                                                                                                                     | Shared words (`tripHub`)                                                                                                                                                                                                                         | Region config or data                                                        | Without the region's words                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Head         | `hub.title`, `hub.monthTitle` (the H1's search term), `hub.lead`, `hub.leadMonth`, `hub.glance.zone` („Ortszeit Orlando“), `hub.meta*` (`metaTitle` takes `{years}`, `tripRegionYears`), `hub.dataset.*` | `question` (hub and months alike), `plan`, `toCalendar`, `glance.*`                                                                                                                                                                              | `hub.heroPhotos` (none: the gradient head)                                   | title, meta and dataset are required (`pnpm test:trip-regions`); no lead, no line; no zone, the date alone |
| 01 Calendar  | `hub.calendar.caption`, `hub.lanes.break`, `.unnamedBreak`, `.none`, `hub.monthIndexLabel`, `hub.sheet.kicker`, `hub.sheet.early.<kind>`, `hub.sheet.travelTransfer`                                     | `calendar.*`, `legend.*`, `parksIndex.*`, `sheet.*` (`travel` by the leg's mode), `accuracy.line` (hub only, with `/accuracy`)                                                                                                                   | `timezone`, the API's groups, parks and legs, `hub.defaultArea`              | no school-holiday lane, no early slot, the plain travel line; the caption falls back to the list's label   |
| 02 Planner   | `planner.*` ([the planner](orlando-planner.md))                                                                                                                                                          | `planner.title`                                                                                                                                                                                                                                  | hotels, tickets, fireworks, blocks, storm season                             | the planner's own rules                                                                                    |
| 03 Best time | `hub.when.title`, `.titleNoYear`, `.pageLink`, `.pageLinkNoYear`, `.kicker`                                                                                                                              | `when.*`                                                                                                                                                                                                                                         | `bestTime` pages, `/when`                                                    | no chapter (and no band button) without best-time pages or their title                                     |
| 04 Questions | `hub.faq.title`, `hub.faq.quietest.{q,qMonth,resort,day,dayAlone}`, and per data question its `q` and `a` (`party`, `epic`, `distance`, `early`), per fixed question its `q` and `a`                     | `faq.*`: the title's fallback, `quietestOnly`, the data questions every region gets (`events`, `weekdays`, `parks`, `breaks`, `hours`, `closures`, each `q` and `qMonth`), the four on the figure (the hub only), `lastYearNote`, the links line | `hub.faq`: `partyPark`, `weekendPark`, `distance`, `earlySlots`, `questions` | a question without its data, its config or its words is left out; no question, no chapter and no `FAQPage` |
| Band         | `hub.next.title`                                                                                                                                                                                         | `band.title` with the region's `nav.name` as its fallback, `plan`                                                                                                                                                                                | `bestTime` pages (the second button)                                         | the shared title                                                                                           |

`resort` takes `{resort}`, `{days}` and `{busy}`; `day` takes `{date}`, `{park}` and `{minutes}`;
`dayAlone` (`{date}`, `{minutes}`) is used where every date names one park whose name the resort's
already says (Universal Studios Japan). A region that never wrote `busy` into `resort` simply does
not show it. The shared data questions need no region words: their facts come from the calendar
(`lib/trip-regions/hub-facts.ts`) and the breaks answer names the breaks in the region's own
`hub.lanes.break`. The hub asks ten questions within 800 words, a month only about itself within
250 to 500 ([the Orlando hub](orlando-hub.md#chapters)).

A trip across several cities (Japan, Paris) has no drive-between-resorts question until the bases
UI exists: `baseLegs` are typed, not shown. A region without a party park or fireworks asks neither,
and a region with a typhoon season instead of hurricanes says so on its best-time page
(`stormSeason`).

## Ways in

All from the registry: the header's planner band and its phone sheet (a crowd calendar link per
region), the More menu (a wide tile per region), the footer's „Reiseplaner" (the first live
region), the homepage stop (one per live region), `TripPlannerBand` (the region whose `parks[]`
holds the page's park), the search palette and `/search` (`matchTripRegion` over every live
region), the OG cards (`<locale>/<slug>`, `<locale>/<slug>/best-time-to-visit[/<resort>]`), the
sitemap and the admin's ticket page. The trip events carry `region` (the slug), and „Plan this
day" opens the day planner with the source `<slug>-hub` (`orlando-hub`, as before).

## The planner band with several regions

One region is the large card beside the day planner (unchanged). From two on, the regions are a
row of tiles over the day planner and the parks, after the four-region design: each tile its
scene, area, name (up to two balanced lines, nothing cut) and arrow; the line every region shares
stands once on the row's heading (`MenuSectionHeading aside`). Two tiles share a row up to a
1024 px bar, then one each up to four (`REGION_COLUMNS`). Under the row the quick starts are one
column of four below a 1280 px bar, so no park name is cut, and two columns of six from there. In
the phone sheet each region is a 44 px row with a 56 × 36 cut of its scene, its name and its area
(`SheetRegionLink`, `RegionSceneCut`), loaded when the sheet opens; one region stays a plain row.
`node scripts/shoot-planner-regions.mjs` draws the real panel and the sheet's rows with two to four
regions (`scripts/fixtures/planner-menu/regions.tsx`) at 390, 1024 and 1440 px, in both themes, and
fails when a name runs past its tile. A region's scene is `components/assistant/parky/<slug>-scene.tsx`,
built on `HolidayParky`, and its entry's `scene` loads it.

## Adding a region

1. Write its entry in `lib/trip-regions/regions/<slug>.ts` with `live: false`, register it in
   `registry.ts`, and start with its segments, zone and centre.
2. Fill in what the region has: `bestTime` (the region's page `region` first, then its resorts),
   `hub` (hero photos, the FAQ's parks and fixed questions), `hotels`, `parkNameSuffixes`,
   `parkShortNames` (where a park's derived two letters say little: Southern California's USH, DCA,
   SFMM), `resortWords`, `stormSeason`, `blockResorts`, `fireworks`, and a `tickets` step where it
   sells tickets the step should ask for. A ticket catalog is the admin's (`/admin/tickets?region=`).
3. Write `tripRegions.<slug>` in all six message files, in the shape of `tripRegions.orlando`
   (`pnpm validate:translations` keeps the locales in step; `pnpm test:trip-regions` checks the
   keys a live region needs).
4. Draw its scene in `components/assistant/parky/<slug>-scene.tsx` and point `scene` at it.
5. Add the zone's VTIMEZONE to `lib/trip-regions/plan-ics.ts` if it is a new one
   (`test:trip-regions` fails without it).
6. Set `live: true`. The routes, rewrites, edge windows, sitemap, menus, band and OG cards follow.
   Run `pnpm test:unit`, and against a build `pnpm check:landing-pages`, `pnpm check:semantic-html`
   and `pnpm check:planner` with the region's URLs added to their lists.

## What the API sends and how the site reads it

The contract is the API's `docs/frontend/trip-regions.md`. Every region-specific value arrives as a
code; the words for a code are the region's messages, and a code without words draws nothing rather
than a raw key, so the API can ship a region's codes before its words land here.

| From the API                                            | Read by                                                                                                                                                                                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the list's `parkCount`, `maxTripDays`                   | the band's chips (`getTripRegionNavFacts`), with the fallbacks above                                                                                                                                                                         |
| the region's `hotels: [{ key, perks }]`                 | the planner's hotel options (`tripHotelKinds`): the API's kinds in its order, each with the area the registry pairs it with; without them the registry's `hotels`. A region may have several areas or none                                   |
| an early slot's code (`early.kind`, a hotel's `perks`)  | `tripPlanner.marker.early.<kind>`, `tripPlanner.details.earlyYours.<kind>`, `tripRegion.planner.details.earlyOthers.<kind>`, `tripRegion.hub.sheet.early.<kind>`: Orlando's two now, `happy_entry` and `extra_magic_time` with their regions |
| `ticketMarkets.home`                                    | the "Sold outside the US" tag (`entryMarket` against `ticketHomeMarket`); the registry's `tickets.homeMarket` until the API sends it                                                                                                         |
| `hurricane_*`, `typhoon_*`, `rainy_season` warnings     | the climate chips (`climateChips`, `tripPlanner.climate`, unknown codes filtered with `has`), `rankedLower`; a month's `hurricaneSeason`, `typhoonSeason`, `rainySeason` on the best-time pages, by the entry's `stormSeason`                |
| a ticket's `entryFrom`, `validDays` (an evening ticket) | typed on `TicketProduct`; the API places an owned one on its days. The ticket step's entries for them come with the region that sells them                                                                                                   |
| `school-breaks` by country                              | the holiday picker asks for DE, NL and GB (`WHEN_HOLIDAY_COUNTRIES`); ES and IT join once the API's data for them reaches half a year ahead, and the locale's own country is already first                                                   |
| `bases`, `baseLegs` (a trip across several cities)      | typed, not shown: a region that needs them waits for the bases UI                                                                                                                                                                            |

A region the API does not curate yet answers 404 on its routes, which leaves its band and links
out.

## Checks

`pnpm test:trip-regions` (registry, generated URLs for every region, the alias, the code words, the
calendar zones), `pnpm test:edge-windows` (every live region's windows), `pnpm test:orlando-hub`,
`pnpm test:orlando-plan`, `pnpm test:orlando-best-time`, `pnpm test:planner-menu`; against a build,
`pnpm check:landing-pages`, `pnpm check:semantic-html` and `pnpm check:planner`.
