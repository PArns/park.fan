# A server render arms no timer (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

**Nothing a server render runs may leave a timer behind.** A `setTimeout` created during a render
keeps the async context it was created in, and on the server that context is the request: Next's
request store, and through it the Flight stream and the whole rendered tree. The request cannot be
collected until the timer fires or is cleared. Two rules follow:

- **A `QueryClient` comes from `createQueryClient()`** (`lib/query-client.ts`), never from
  `new QueryClient`. On the server it gives every query `gcTime: Infinity`, whatever its hook sets.
- **A timeout that bounds a fetch clears its timer when the fetch wins.** Use `withSeedTimeout`
  (`lib/api/seed-timeout.ts`), which clears it in a `finally`; a bare `Promise.race` against
  `setTimeout` does not.

## What React Query does on the server

TanStack Query's `Query` calls `scheduleGc()` in its constructor, and with a finite `gcTime` that is
a `setTimeout` of that length (`@tanstack/query-core`, `removable.ts`). The server default is
`Infinity`, which arms nothing, but the hooks here set their own: 15 minutes in
`use-attraction-detail.ts`, 90 in `use-park-stats-queries.ts` and `use-park-hourly-profile.ts`, a
day in `use-ride-figures.ts` and `use-ride-positions.ts`, five minutes as the provider's default.
Every client component that calls one of them during SSR armed one timer per query, and each held
its request for that long. TanStack's SSR guide says the same thing from the other side: with a
non-`Infinity` `gcTime` on the server, clearing the cache is the caller's job.

`createQueryClient()` overrides `defaultQueryOptions` on the server, the one function every query
and observer reads its options through, so a new hook with a new `gcTime` cannot bring it back. In
the browser nothing changes. A no-op `timeoutManager` would stop the timers as well, but it also
runs retry backoff, and a server-side retry would then wait forever.

## Measured (2026-10-26, `pnpm build && next start`, 4 cores)

Before the fix (at 4ba37a4), the retained heap after a forced GC grew by 3.5 MB per render of
`/de/blog/europa-park-wartezeiten-tipps` and by 0.5 MB per ride page. A heap snapshot's path from the
root was `clearTimeout` → `timerListMap[300000]` → `Timeout` → `kResourceStore` (the request store) →
`onAllReady` → the Flight response → the tree. After 16 renders the timer lists held 544 timers of
900,000 ms, 192 of 600,000 and 128 of 5,400,000, all from `@tanstack/query-core`. Under load the
test server ran out of memory at 2 GB, with single mark-compact passes of 2.3 and 4.3 s: a render
that takes seconds, from a page whose own work is a few hundred milliseconds.

The private timeout in `lib/api/stats.ts` added its own: 40 pending 3,000 ms timers after the same
renders, because it raced the fetch against a `setTimeout` it never cleared.

After the fix, on Next 16.4.3, one build run twice with the guard switched off and on, three batches of 15 renders of
that post and 15 of `/de/parks/europe/germany/rust/europa-park/silver-star`, heap after `gc()`
and pending timers before the first batch and after each:

| `createQueryClient` guard | Heap (MB)             | Pending `Timeout`s          |
| ------------------------- | --------------------- | --------------------------- |
| off                       | 162 → 209 → 271 → 308 | 176 → 1,106 → 2,036 → 2,966 |
| on                        | 155 → 161 → 162 → 168 | 0 → 0 → 0 → 0               |

With the guard on, `withSeedTimeout` in `lib/api/stats.ts` included, a render leaves no timer at
all.

## Proving a change

Preload a probe into `next start` that runs `global.gc()` and appends
`process.memoryUsage().heapUsed` and the count of `Timeout` entries in
`process.getActiveResourcesInfo()` on a signal, then render the same page in batches and signal
between them. A heap that climbs per batch, or a timer count that grows with the number of renders,
is this bug. A `next dev` server proves nothing here: it holds far more per request on purpose.
