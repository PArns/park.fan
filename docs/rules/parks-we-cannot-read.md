# Parks we cannot read (REQUIREMENT)

A park with no wait-time source is byte-for-byte a park shut for the night: at 03:00 every park has
zero rides operating and an empty `queues`. So never derive it from the payload. The API's curated
`liveWaitTimes` (`{ available, reason }`) is the only signal, read through `noLiveWaitTimesReason()`
/ `hasReadableWaitTimes()` (`lib/utils/live-wait-times.ts`), never off the field directly.

- **An absent field reads as available**, so older and cached responses keep behaving as before.
- **It is not a freshness check**: a feed that went quiet an hour ago stays `available: true`.
- **Listing surfaces strip, they do not flag.** `/api/parks/live`, nearby and favourites drop
  `crowdLevel`, `averageWaitTime` and `operatingAttractions` at the projection boundary
  (`stripUnreadableWaitStats()`), because the poll re-downloads its nine fields per park every
  5 min and this flag never changes.
- **Crowd badges need no special case**: the API sends `unknown`, which renders as "keine Prognose".
- **The notice carries `data-nosnippet`** (`NoLiveWaitTimesNotice`), so „Keine Wartezeiten
  verfügbar" never becomes the search snippet of the park's page while it stays crawled and ranked.
  Google honours the attribute on `div`, `span` and `section` only. `noindex` would be wrong: it
  has no per-element form and would drop the whole park.
- **A new park without a source is added in the API** (`src/parks/data/live-wait-time-sources.ts`),
  never in a second list here.

## Why

Hansa-Park publishes its wait times only in its own app on the park WLAN, so no number will ever
arrive for it. Left alone, the page filled the gap with the shape of a quiet park: 82 of 82 rides
"running" at `very_low`, Ø 0 min, and an ML forecast built on zero observations.

Background: [parks without wait times](../api/parks-without-wait-times.md) lists every surface and
what it shows, and what the snippet guard does not fix.
