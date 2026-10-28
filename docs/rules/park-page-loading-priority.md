# Park page loading priority (REQUIREMENT)

On a park page, the best-travel-time data (best-days calendar and historical stats) **always loads
last**. Live status, wait times and every weather query go first. `useLoadLast`
(`lib/hooks/use-load-last.ts`) enforces it: it releases its callers only once every other React
Query fetch on the page has been idle for `SETTLE_GRACE_MS` (300 ms), or after
`SAFETY_TIMEOUT_MS` (5 s) so the sections can never be starved.

- **A new consumer of calendar or stats data goes through the gated hooks**
  (`useParkBestDaysCalendar`, `useParkHistoricalStats`, `useParkStatsQueries`, …). A query with the
  same key started anywhere else would fetch early and bypass the rule.
- **A query that gates itself on `useLoadLast` must not count as traffic for the gate**: its key
  prefix is in `DEFERRED_KEY_PREFIXES`, or it carries `LOAD_LAST_META`. Otherwise two gated queries
  wait for each other and the grace window never closes.
- **Weather loads early.** The hourly day view fetches in parallel with the nowcast; only its
  rendering waits for the nowcast.

## Why

The calendar and the statistics are the largest and slowest park requests (a cold backend compute
takes 10–20 s). They must not compete for bandwidth or backend capacity with the live data a
visitor came for.

## The exception: a server-rendered chapter

A chapter whose data is stable for a day and should be read by crawlers may be server-rendered
instead of fetched behind `useLoadLast`, provided it sits in its own `<Suspense>` boundary and its
fetch is bounded by `withSeedTimeout` (`lib/api/seed-timeout.ts`). It issues no browser request, so
it cannot compete with the live queries, and a client fetch would download bytes the first render
already carried and hide the chapter from crawlers. The one case so far is the yearly crowd outlook
(`components/parks/park-yearly-outlook-section.tsx`). The server-side best-days seed
(`getBestDaysCalendarSeed`) is not an exception either: it reaches the components as props for the
first render only and never starts a client query.
