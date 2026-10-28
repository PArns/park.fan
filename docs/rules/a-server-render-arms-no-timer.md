# A server render arms no timer (REQUIREMENT)

**Nothing a server render runs may leave a timer behind.** A `setTimeout` created during a render
keeps the async context it was created in, and on the server that context is the request: Next's
request store, and through it the Flight stream and the whole rendered tree. The request cannot be
collected until the timer fires or is cleared.

- **A `QueryClient` comes from `createQueryClient()`** (`lib/query-client.ts`), never from
  `new QueryClient`. On the server it overrides `defaultQueryOptions`, which every query and
  observer reads its options through, to `gcTime: Infinity`, so a new hook with its own `gcTime`
  cannot arm a timer. In the browser nothing changes.
- **A timeout that bounds a fetch clears its timer when the fetch wins.** Use `withSeedTimeout`
  (`lib/api/seed-timeout.ts`), which clears it in a `finally`; a bare `Promise.race` against
  `setTimeout` does not.

## Why

TanStack Query's `Query` calls `scheduleGc()` in its constructor, and with a finite `gcTime` that is
a `setTimeout` of that length. The hooks here set their own: 15 minutes in `use-attraction-detail.ts`,
90 in `use-park-stats-queries.ts` and `use-park-hourly-profile.ts`, a day in `use-ride-figures.ts`
and `use-ride-positions.ts`. Every client component calling one during SSR armed a timer per query
that held its request for that long. A no-op `timeoutManager` would stop the timers as well, but it
also runs retry backoff, and a server-side retry would then wait forever.

Measured 2026-10-26 on a production build: before the fix the retained heap grew by 3.5 MB per
render of a blog post and 0.5 MB per ride page, the heap snapshot's path ran from a pending
`Timeout` through the request store to the Flight response, and under load the server ran out of
memory at 2 GB with mark-compact passes of 2–4 s. Three batches of 15 renders of a post and 15 of a
ride page:

| `createQueryClient` guard | Heap (MB)             | Pending `Timeout`s          |
| ------------------------- | --------------------- | --------------------------- |
| off                       | 162 → 209 → 271 → 308 | 176 → 1,106 → 2,036 → 2,966 |
| on                        | 155 → 161 → 162 → 168 | 0 → 0 → 0 → 0               |

`lib/api/stats.ts` added 40 pending 3,000 ms timers of its own until it used `withSeedTimeout`.

## Check

Preload a probe into `next start` that runs `global.gc()` and records
`process.memoryUsage().heapUsed` and the count of `Timeout` entries in
`process.getActiveResourcesInfo()` on a signal, then render the same page in batches and signal
between them. A heap that climbs per batch, or a timer count that grows with the renders, is this
bug. `next dev` proves nothing here: it holds far more per request on purpose.
