# Parks we cannot read (REQUIREMENT)

A park with no wait-time source is byte-for-byte a park shut for the night, so never derive it from
the payload. The API's curated `liveWaitTimes` (`{ available, reason }`) is the only signal, read
through `noLiveWaitTimesReason()` / `hasReadableWaitTimes()` (`lib/utils/live-wait-times.ts`), never
off the field directly. What the flag means (permanent, not a freshness check), what the API
withholds for such a park and where one is added (there, never in a second list here): the backend's
[live-wait-times contract](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/live-wait-times-availability.md).

- **An absent field reads as available**, so older and cached responses keep behaving as before.
- **Listing surfaces strip, they do not flag.** `/api/parks/live`, nearby and favourites drop
  `crowdLevel`, `averageWaitTime` and `operatingAttractions` at the projection boundary
  (`stripUnreadableWaitStats()`), because the poll re-downloads its nine fields per park every
  5 min and this flag never changes.
- **Crowd badges need no special case**: the API sends `unknown`, which renders as "keine Prognose".
- **The notice carries `data-nosnippet`** (`NoLiveWaitTimesNotice`), so „Keine Wartezeiten
  verfügbar" never becomes the search snippet of the park's page while it stays crawled and ranked.
  Google honours the attribute on `div`, `span` and `section` only. `noindex` would be wrong: it
  has no per-element form and would drop the whole park.

## Why

Left alone, Hansa-Park's page filled the gap with the shape of a quiet park: every ride "running" at
`very_low`, Ø 0 min, and an ML forecast built on zero observations.

Background: [parks without wait times](../api/parks-without-wait-times.md) lists every surface and
what it shows, and what the snippet guard does not fix.
