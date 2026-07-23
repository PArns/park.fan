# Attraction Metadata (G1) — Data Source Research

> **Status:** Research result · July 2026 · companion to [Personas & Scenarios](personas-and-scenarios.md) gap **G1**
> **Question:** where can park.fan get per-attraction metadata — minimum rider height, intensity, indoor/outdoor, accessibility — and under what terms?
>
> Legend: ✅ verified hands-on during this research (live API calls / source code / ToS text) · ⚠️ reported, not directly verified.

---

## Headline finding

**ThemeParks.wiki — which park.fan already ingests — carries `minimumHeight` (cm) on its entity documents, and our sync currently discards it.** ✅ Verified live: Taron → `140`, Silver Star → `140`. Consuming one extra field in the existing ingestion closes the biggest part of the min-height gap for EU parks at near-zero cost.

Measured coverage (attractions with `minimumHeight` / total ATTRACTION entities):

| Park                                 | Coverage | Park                                                                          | Coverage     |
| ------------------------------------ | -------- | ----------------------------------------------------------------------------- | ------------ |
| Europa-Park                          | 63/86    | Phantasialand                                                                 | 36/41        |
| Parc Astérix                         | 37/41    | Thorpe Park                                                                   | 22/25        |
| Alton Towers                         | 24/45    | Heide Park                                                                    | 17/43        |
| Gardaland                            | 21/36    | Legoland Billund                                                              | 15/48        |
| Efteling                             | 8/36     | Universal IOA / USF                                                           | 14/22, 10/19 |
| **All Disney parks (WDW, DLR, DLP)** | **0**    | Cedar Point, Six Flags MM, Hansa-Park, PortAventura, Liseberg, Walibi Holland | 0            |

(Not every ride _has_ a restriction — Efteling 8/36 is close to reality; the zeros are genuine gaps.) The data originates from the parks' own app APIs (Europa-Park `poi.minHeight`, Universal `MinHeightInInches` — ✅ confirmed in the MIT-licensed [parksapi](https://github.com/ThemeParks/parksapi) source), so it is as accurate as the official apps and maintained upstream. The parksapi tag schema also defines `MINIMUM_HEIGHT_UNACCOMPANIED`, `MAXIMUM_HEIGHT`, `MAY_GET_WET`, `UNSUITABLE_PREGNANT`, `CHILD_SWAP`, `ONRIDE_PHOTO` — only `minimumHeight` was observed in live v1 responses.

---

## Source comparison

| Source                                                     | Min height                                                                                        | Intensity                             | Indoor                             | Accessibility                                                                             | Duration | Manufacturer/Year                                         | Access                                     | License / terms                                                                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[ThemeParks.wiki](https://api.themeparks.wiki/docs/v1)** | ✅ EU + Universal, ❌ Disney                                                                      | ❌                                    | ❌                                 | ❌                                                                                        | ❌       | ❌                                                        | free API (already ingested)                | unstated — ask maintainer (⚠️)                                                                                                                                 |
| [Queue-Times](https://queue-times.com/pages/api)           | ❌                                                                                                | ❌                                    | ❌                                 | ❌                                                                                        | ❌       | ❌                                                        | free API                                   | attribution required                                                                                                                                           |
| [Wartezeiten.app](https://api.wartezeiten.app)             | ❌ (✅ tested)                                                                                    | ❌                                    | ❌                                 | ❌                                                                                        | ❌       | ❌                                                        | free API                                   | unstated                                                                                                                                                       |
| RCDB                                                       | partial                                                                                           | ❌                                    | partial                            | ❌                                                                                        | ✅       | ✅                                                        | none                                       | ✅ **ToS prohibits reuse** ("constructing other databases, websites or applications requires prior written permission") — **avoid**; linking out is fine       |
| [Captain Coaster](https://captaincoaster.com/api)          | ❌                                                                                                | weak (kiddie flag, ratings)           | **✅ `indoor` boolean**            | ❌                                                                                        | ❌       | ✅                                                        | API, free key                              | no stated terms — ask (⚠️)                                                                                                                                     |
| Wikidata                                                   | ❌ (no such property exists — ✅ verified)                                                        | ❌                                    | ❌                                 | ~0 usage                                                                                  | 93 items | ✅ 1,122 of 1,568 coasters have manufacturer; year patchy | SPARQL/dumps                               | **CC0** — zero friction                                                                                                                                        |
| Wikipedia (EN)                                             | ✅ `restriction_cm` in coaster infobox                                                            | weak                                  | ❌                                 | ❌                                                                                        | ✅       | ✅                                                        | parse API / DBpedia                        | CC-BY-SA 4.0 (attribute)                                                                                                                                       |
| **[Coasterpedia](https://coasterpedia.net)**               | **✅ `min_height` infobox field**                                                                 | category proxy (Kiddie/Family/Hyper…) | implicit via categories            | ❌                                                                                        | ✅       | ✅                                                        | MediaWiki API (✅ tested; set a proper UA) | **CC-BY-SA 4.0** (✅ verified) · 24k articles, active community                                                                                                |
| OpenStreetMap                                              | tag exists but ~empty (524 uses; ✅ note: OSM `min_height` is a _building_ tag, not rider height) | ❌                                    | derivable (`indoor=`, `building=`) | **✅ `wheelchair=*` on ~3k attractions — the only structured accessibility source found** | ❌       | `start_date`                                              | Overpass/dumps                             | ODbL (attribute; share-alike on redistributed DB)                                                                                                              |
| Official park sites/apps                                   | ✅ complete facts                                                                                 | ✅ (Disney "thrill factor" facets)    | ✅                                 | ✅ (PDF/web guides)                                                                       | some     | ❌                                                        | manual only                                | scraping violates ToS (Efteling even embeds a prohibition in its API payload — ✅ seen); **facts themselves are not copyrightable → manual curation is clean** |
| TouringPlans                                               | ⚠️ US Disney/Universal `height_restriction`                                                       | ❌                                    | ❌                                 | ❌                                                                                        | ❌       | ❌                                                        | beta API (calls 406'd from here)           | unpublished — ask                                                                                                                                              |
| Commercial vendors                                         | —                                                                                                 | —                                     | —                                  | —                                                                                         | —        | —                                                         | —                                          | ✅ nothing licensable found (attractions.io is park-facing white-label; The Park DB is park-level benchmarks)                                                  |

Coaster-Count's API is user ride-count stats only — not a metadata source.

---

## License assessment (GPL-3.0 code, free website)

- The **code license (GPL-3.0) and data licenses are independent** — displaying CC-BY-SA/ODbL data does not conflict with GPL code.
- **CC0** (Wikidata): no obligations.
- **CC-BY-SA 4.0** (Coasterpedia, Wikipedia): attribute per ride or on a data-credits page ("Data: Coasterpedia, CC-BY-SA 4.0" + link). If derived data is redistributed (e.g. seed files in the public repo), keep it in a separate, clearly CC-BY-SA-licensed file rather than GPL-ing it.
- **ODbL** (OSM): "© OpenStreetMap contributors"; the website is a Produced Work (attribution only); share-alike applies only if the merged database itself is republished.
- **RCDB**: written permission required for any database/website use — do not scrape; link out instead (explicitly encouraged by their ToS).
- **Official park pages**: min-height values are non-copyrightable facts; a small hand-curated table sourced from official pages is legally safe. Automated scraping pipelines against park sites are not (ToS).

---

## Recommendation

1. **Min height (phase 1, cheapest win):** ingest `minimumHeight` from ThemeParks.wiki in the existing sync — one field. Fill the Disney gap by manual curation from official pages (~15 restricted rides × 6–8 Disney parks ≈ 100 rows; values change rarely). Cross-fill remaining coasters from Coasterpedia (`min_height`, CC-BY-SA).
2. **Indoor/outdoor + intensity (phase 1b, editorial):** no clean source exists. Curate in-repo (~30 top parks × ~40 rides ≈ 600–800 rows; ~40 new rows/year). Seed from Captain Coaster's `indoor` flag (coasters; ask first) and Coasterpedia categories; model intensity as a 3–4 level editorial scale (kiddie / family / moderate / thrill).
3. **Manufacturer / year / duration (nice-to-have):** Wikidata (CC0) matched by name+park, backfilled from Coasterpedia.
4. **Accessibility (phase 2):** OSM `wheelchair=*` as a coarse flag plus manual curation from official accessibility guides for the top ~10 parks. Nothing structured exists anywhere else.
5. **Avoid:** RCDB ingestion, automated scraping of park sites/apps, hobby aggregators of unclear provenance (tall2ride).
6. **Give back:** contribute curated min-heights to OSM (`minimum_height_requirement=`) and Coasterpedia — reduces long-term sole-maintainer burden.

**Backend architecture note:** add an `attraction_metadata` table keyed to existing attraction IDs with per-field `source` + `license` columns (`themeparks_wiki | coasterpedia | wikidata | osm | manual`), so attribution can be rendered per ride and CC-BY-SA/ODbL-derived rows can ship as separately-licensed seed files. Add a "Data credits" page (Queue-Times attribution is already required anyway; add ThemeParks.wiki, Coasterpedia CC-BY-SA, OSM ODbL, Wikidata CC0).
