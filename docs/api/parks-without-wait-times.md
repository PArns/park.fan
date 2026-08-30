# Parks whose wait times we cannot read

Hansa-Park serves its wait times from its own app, to devices on the park's WLAN, and
nowhere else. The API has never held a single wait time for it — `/stats` has stood at
`totalSampleDays: 0` since ingestion began — while the ride catalog (82 attractions), the
schedule feed and the weather all work normally.

Before this, the park page filled that gap with the shape of a quiet park: during opening
hours it read **OPERATING with 82 of 82 rides running**, every one of them `very_low`,
Ø 0 min, peak 0 min. The ride pages went further and served an ML forecast — 10 min at
67 % confidence, every slot of every day — built from zero observations of this park.

## The signal

`liveWaitTimes` from the API (`v4.api.park.fan`, `docs/frontend/live-wait-times-availability.md`):

```ts
{ available: false, reason: 'in_park_app_only' | 'not_published' }
```

**Never derive this from the payload.** At 03:00 local every park in the catalog reports
zero rides operating and an empty `queues` array — a park with no source and a park shut for
the night are indistinguishable from the data alone. The difference is knowledge about where
the park publishes, and it lives in one curated list in the API.

**It is not a freshness signal either.** A park whose feed went quiet an hour ago stays
`available: true`; the API's staleness and movement rules own that case.

Read it through **`noLiveWaitTimesReason()` / `hasReadableWaitTimes()`**
(`lib/utils/live-wait-times.ts`), never off the field directly: an absent `liveWaitTimes`
reads as available, so responses predating the field — and cached ones — keep behaving
exactly as before instead of warning about parks that are fine.

## Where it lands

| Surface                                 | Behaviour                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------- |
| Park page                               | `<NoLiveWaitTimesNotice scope="park">` above the ride tabs                |
| Ride page                               | `<NoLiveWaitTimesNotice scope="ride">` inside the "wait time now" chapter |
| `ParkStatus` (`detailed`/`card`/`hero`) | wait/peak/occupancy/open-count cards dropped                              |
| `AttractionWaitOverview`                | the SEO summary line becomes "no wait times available"                    |
| `LandSection`                           | "82 attractions" instead of "0/82 operating"                              |
| Ride cards & the ride page's live panel | `UNKNOWN` status, `unknown` crowd — both already supported                |
| `/api/parks/live`, nearby, favourites   | wait-derived fields stripped at the projection boundary                   |

### Out of the snippet, never out of the index

The two surfaces above are the most quotable prose on the strongest page the site has, and a
result that answers "Hansa-Park Wartezeiten" with **"Keine Wartezeiten verfügbar"** is a
result nobody clicks.

Google is not doing that today: checked on 2026-08-30, the head query renders the meta
description verbatim. But a snippet is chosen per query — the more specific the query, the
likelier Google builds a description out of the page rather than the tag — so both surfaces
carry `data-nosnippet` as prevention.

`noindex` is the wrong instrument twice over: it has **no per-element form** (there is no
fragment-level directive — `<!--googleoff:index-->` was a Search Appliance feature and that
product is dead), and the page-level one would drop the whole park out of Google rather than
one sentence out of one snippet.

`data-nosnippet` is the directive that _does_ apply to a fragment. The marked text is still
crawled, still counts for ranking and still stands in front of the visitor who opens the
page — it is only barred from becoming the snippet, so Google falls back to the meta
description. It rides on:

| Element                                                  | Why it is marked                                                                       |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `NoLiveWaitTimesNotice`'s root `<section>`               | the title + reason sentence, the page's most quotable prose                            |
| `AttractionWaitOverview`'s summary line (inner `<span>`) | first prose under the "Wartezeiten" `<h2>`, and the pre-mount markup Googlebot indexes |

Google honours the attribute on **`div`, `span` and `section` only**, which is why the
summary line wraps its text in a `<span>` instead of taking the attribute on its `<p>`. It is
a boolean attribute (any value is ignored, so React's `data-nosnippet="true"` is fine),
structured data inside a marked element stays usable, and it must not be toggled from
JavaScript — both of ours are server-rendered and never change.

Two things this does **not** fix, both visible in the same result:

- Title and meta description still promise "Wartezeiten LIVE" for a park that has none, and
  the FAQ's `waitTimesNoDataA` still points at "die Live-Wartezeiten oben". Rewriting the
  title is a ranking decision on the site's biggest page.
- The result carries a stale date ("vor 6 Tagen"). The page prints today's date as visible
  text — "Heute, Sonntag, 30. August 2026, hat der Hansa-Park von 10:00 bis 18:00 Uhr
  geöffnet.", in the FAQ block and again inside the FAQPage JSON-LD — and there is no
  `datePublished`/`dateModified` anywhere, so what Google shows is the date it read on its
  last crawl. On a page selling live data that reads as six days out of date.

The crowd badges are deliberately **not** special-cased: the API sends `crowdLevel: 'unknown'`
for these parks, which the existing badge renders as "keine Prognose" — already the right
answer.

### Why the listing surfaces strip instead of flagging

`/api/parks/live` is a nine-field projection re-downloaded for every park in a region on
every 5-minute poll, and `liveWaitTimes` never changes — putting it in there would break the
[API budget rule](../architecture/api-budget.md) for a field that is constant. So the proxy
drops `crowdLevel` / `averageWaitTime` / `operatingAttractions` instead. Cards already lay
out around those being absent (it is what they show while a poll is in flight), so no card
needed a new branch and no explanatory copy had to fit on a surface with no room for it.
`totalAttractions` survives — the ride catalog is real.

The same rule is applied in `lib/api/discovery.ts` (nearby) and the favourites proxy via
`stripUnreadableWaitStats()`.

## Adding a park

Not here — in the API's `src/parks/data/live-wait-time-sources.ts`. The frontend must not
keep a second list.
