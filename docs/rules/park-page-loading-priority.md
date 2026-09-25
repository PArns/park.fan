# Park page loading priority (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

the best-travel-time data (best-days calendar + historical stats) must **always load last** — live status, wait times and all weather queries load first. Enforced via `useLoadLast` (`lib/hooks/use-load-last.ts`); see [system-overview](docs/architecture/system-overview.md#4-park-page-loading-priority-requirement).

**One documented exception.** A chapter whose data is stable for a day and should be read by crawlers may be server-rendered instead of fetched behind `useLoadLast`, as long as it sits in its own `<Suspense>` boundary and its fetch is timeout-bounded (`withSeedTimeout`, `lib/api/seed-timeout.ts`). It issues no browser request, so it cannot compete with the live queries, and a client fetch would download bytes the first render already carried and hide the chapter from crawlers. The one case so far is the yearly crowd outlook (PAR-324, `components/parks/park-yearly-outlook-section.tsx`). The best-days calendar and the historical stats still go through `useLoadLast`.
