# Attraction metadata sources

Where per-ride metadata (minimum rider height, intensity, indoor/outdoor, accessibility, duration,
manufacturer) can come from, under what terms, and which sources park.fan uses today. Open it
before adding a ride fact to the API or curating one by hand. This is gap G1 of
[personas and scenarios](personas-and-scenarios.md#4-gap-backlog). Research of July 2026: ✅
verified hands-on (live API calls, source code, terms text), ⚠️ reported but not verified.

## What is in use

| Field                            | Source today                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimumHeight`, `maximumHeight` | ThemeParks.wiki entity documents (the parks' own app data); Six Flags parks, which ThemeParks.wiki leaves empty, are read from sixflags.com ride pages (backend `six-flags.client.ts`); hand corrections as `curatedMinimumHeight` / `curatedMaximumHeight` |
| `mayGetWet`                      | upstream, corrected by `curatedMayGetWet`                                                                                                                                                                                                                   |
| `indoorOutdoor`                  | hand-curated only (backend `indoor-outdoor.type.ts`): no feed carries it; ten parks on 2026-10-22                                                                                                                                                           |
| height, length, speed, duration  | Wikidata (CC0), matched by RCDB id onto the curated ride profile (backend `ride-stats.service.ts`); a post's figures follow [a ride's figure comes from the RCDB](../rules/a-ride-figure-comes-from-the-rcdb.md)                                            |
| intensity, accessibility         | **nothing**: no clean source exists                                                                                                                                                                                                                         |

## Coverage of `minimumHeight` in ThemeParks.wiki (July 2026)

Attractions with the field / all ATTRACTION entities. Not every ride has a restriction (Efteling's
8/36 is close to reality); the zeros are real gaps.

| Park                             | Coverage | Park                                                                          | Coverage     |
| -------------------------------- | -------- | ----------------------------------------------------------------------------- | ------------ |
| Europa-Park                      | 63/86    | Phantasialand                                                                 | 36/41        |
| Parc Astérix                     | 37/41    | Thorpe Park                                                                   | 22/25        |
| Alton Towers                     | 24/45    | Heide Park                                                                    | 17/43        |
| Gardaland                        | 21/36    | Legoland Billund                                                              | 15/48        |
| Efteling                         | 8/36     | Universal IOA / USF                                                           | 14/22, 10/19 |
| All Disney parks (WDW, DLR, DLP) | **0**    | Cedar Point, Six Flags MM, Hansa-Park, PortAventura, Liseberg, Walibi Holland | 0            |

The values come from the parks' own app APIs (Europa-Park `poi.minHeight`, Universal
`MinHeightInInches`, ✅ in the MIT-licensed [parksapi](https://github.com/ThemeParks/parksapi)
source). parksapi's tag schema also defines `MINIMUM_HEIGHT_UNACCOMPANIED`, `MAXIMUM_HEIGHT`,
`MAY_GET_WET`, `UNSUITABLE_PREGNANT`, `CHILD_SWAP` and `ONRIDE_PHOTO`.

## Source comparison

| Source                                                 | Min height                                      | Intensity                          | Indoor                             | Accessibility                                                    | Duration | Manufacturer / year                     | Access                            | Terms                                                                                                                 |
| ------------------------------------------------------ | ----------------------------------------------- | ---------------------------------- | ---------------------------------- | ---------------------------------------------------------------- | -------- | --------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [ThemeParks.wiki](https://api.themeparks.wiki/docs/v1) | ✅ EU + Universal, ❌ Disney                    | ❌                                 | ❌                                 | ❌                                                               | ❌       | ❌                                      | free API (ingested)               | unstated, ask the maintainer (⚠️)                                                                                     |
| [Queue-Times](https://queue-times.com/pages/api)       | ❌                                              | ❌                                 | ❌                                 | ❌                                                               | ❌       | ❌                                      | free API                          | attribution required                                                                                                  |
| [Wartezeiten.app](https://api.wartezeiten.app)         | ❌ (✅ tested)                                  | ❌                                 | ❌                                 | ❌                                                               | ❌       | ❌                                      | free API                          | unstated                                                                                                              |
| RCDB                                                   | partial                                         | ❌                                 | partial                            | ❌                                                               | ✅       | ✅                                      | none                              | ✅ terms forbid building other databases or sites from it without written permission; linking out is fine             |
| [Captain Coaster](https://captaincoaster.com/api)      | ❌                                              | weak (kiddie flag, ratings)        | ✅ `indoor` boolean                | ❌                                                               | ❌       | ✅                                      | API, free key                     | no stated terms, ask (⚠️)                                                                                             |
| Wikidata                                               | ❌ (no such property, ✅)                       | ❌                                 | ❌                                 | ~0 usage                                                         | 93 items | ✅ 1,122 of 1,568 coasters; year patchy | SPARQL, dumps                     | CC0                                                                                                                   |
| Wikipedia (EN)                                         | ✅ `restriction_cm` in the coaster infobox      | weak                               | ❌                                 | ❌                                                               | ✅       | ✅                                      | parse API, DBpedia                | CC BY-SA 4.0                                                                                                          |
| [Coasterpedia](https://coasterpedia.net)               | ✅ `min_height` infobox field                   | category proxy (Kiddie, Family, …) | via categories                     | ❌                                                               | ✅       | ✅                                      | MediaWiki API (✅, set a real UA) | CC BY-SA 4.0 (✅)                                                                                                     |
| OpenStreetMap                                          | tag ~empty (OSM `min_height` is a building tag) | ❌                                 | derivable (`indoor=`, `building=`) | ✅ `wheelchair=*` on ~3k attractions, the only structured source | ❌       | `start_date`                            | Overpass, dumps                   | ODbL                                                                                                                  |
| Official park sites and apps                           | ✅ complete                                     | ✅ (Disney "thrill factor")        | ✅                                 | ✅ (PDF and web guides)                                          | some     | ❌                                      | manual only                       | scraping violates their terms (Efteling embeds a prohibition in its API payload, ✅); the facts are not copyrightable |
| TouringPlans                                           | ⚠️ US Disney/Universal `height_restriction`     | ❌                                 | ❌                                 | ❌                                                               | ❌       | ❌                                      | beta API (406 from here)          | unpublished, ask                                                                                                      |

No commercial vendor had anything licensable (attractions.io is park-facing white-label, The Park
DB is park-level benchmarks), and Coaster-Count's API is user ride counts only.

## Licences

- The code licence (GPL-3.0) and data licences are independent; showing CC BY-SA or ODbL data
  does not conflict with GPL code.
- **CC0** (Wikidata): no obligations.
- **CC BY-SA 4.0** (Coasterpedia, Wikipedia): attribution per ride or on a data-credits page. Data
  redistributed from the public repository goes into a separate CC BY-SA file, not GPL code.
- **ODbL** (OSM): "© OpenStreetMap contributors"; the website is a produced work (attribution
  only); share-alike applies only if the merged database is republished.
- **RCDB**: written permission for any database or website use; link out instead.
- **Official park pages**: the values are facts, so a small hand-curated table is clean; automated
  scraping pipelines against park sites break their terms.

## Still open

- **Intensity:** curate in the backend as a three- or four-step editorial scale (kiddie, family,
  moderate, thrill), seeded from Coasterpedia categories and Captain Coaster's flags (ask first).
- **Accessibility:** OSM `wheelchair=*` as a coarse flag plus hand curation from the official
  accessibility guides of the top parks; nothing structured exists elsewhere.
- **The Disney height gap** (~100 rows from official pages) and Coasterpedia cross-fill for coasters.
- **Avoid:** RCDB ingestion, scraping park sites (the Six Flags reader is the one exception, chosen
  because ~1,400 rides had nothing), hobby aggregators of unclear provenance (tall2ride).
- **Give back:** curated heights to OSM (`minimum_height_requirement=`) and Coasterpedia.
- **Attribution:** the footer and the imprint credit ThemeParks.wiki, Queue-Times (in the wording
  its terms ask for) and Wartezeiten.app. A CC BY-SA or ODbL source joins them when it is used,
  ideally with per-field `source`/`licence` columns on curated rows so a ride can name its own.
