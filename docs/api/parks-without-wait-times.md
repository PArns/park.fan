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
