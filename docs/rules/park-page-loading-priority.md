# Park page loading priority (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

the best-travel-time data (best-days calendar + historical stats) must **always load last** — live status, wait times and all weather queries load first. Enforced via `useLoadLast` (`lib/hooks/use-load-last.ts`); see [system-overview](docs/architecture/system-overview.md#4-park-page-loading-priority-requirement).
