# API budget per page (REQUIREMENT)

The 5-minute live poll sends a **projection, not the park**. `useLiveParkData`
(`lib/hooks/use-live-park-data.ts`) re-fetches for as long as a tab is open, so
`/api/parks/<geo>/<park>` answers with `LiveParkSnapshot` (`lib/api/park-live-projection.ts`: the
volatile fields plus each ride's id, name, slug and land), and `mergeLiveParkSnapshot` lays it back
over the server-rendered park in the hook's `select`. Consumers still read a complete
`ParkWithAttractions`.

Before adding a field anywhere in this path, decide which of four kinds it is:

1. **Rendered and volatile** → the projection.
2. **Rendered and day-stable** → the server render; the merge carries it.
3. **Rendered and day-scoped** (shows, restaurant status) → the `daily` half of the projection,
   asked for with `?full=1` (`leanParkForLivePoll(park, { daily: true })`) on a tab's first poll,
   every 30 min after (`DAILY_BLOCK_INTERVAL_MS`) and when the park's status flips. An absent block
   means unchanged, never empty.
4. **Not rendered** → leave it out. `comparison` arrives on every attraction and is never rendered.

The same holds for the card overlay: `/api/parks/live?regions=…` returns nine fields per park,
never the region's park objects. And **do not merge requests just because there are several**:
`stats` is a cold-compute aggregate and `best-days` a materialized snapshot, so joining them puts the
fast one behind the slow one, and a `nowcast` timing out inside the park fetch once failed the whole
route's prerender.

## Why

The poll runs every five minutes for as long as a tab is open, so every field in it is paid
hundreds of times a day; the projection took it from 90 KB to about 40 KB raw. The day-scoped kind
exists because it looks like the second kind and is not: a server copy written overnight, while the
API reports every show CLOSED, says so all day
([the incident and the per-block sizes](../architecture/api-budget.md#the-live-poll-90-kb--40-kb)).
The server render is fixed from the other side: a per-park cache tag (`parkCacheTag`, the geo path,
because `disneyland-park` is Anaheim and Paris) that the backend POSTs to `/api/revalidate` with
`"expire": 0` at each status flip.

## Check

`node scripts/measure-api-calls.mjs` (needs a running site) before and after, and weigh the server
render too ([the page render is the bigger half](the-page-render-is-the-bigger-half-of-the-api-budget-and-it.md)).

Background: [API budget → reading live data without adding a request](../architecture/api-budget.md#reading-live-data-without-adding-a-request).
