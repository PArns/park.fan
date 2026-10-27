# Compute audit: what one origin request costs

What a request that reaches Vercel costs in Active CPU and provisioned memory, per route (PAR-379,
measured 2026-10-26), and why none of it is worth a code change. Open it before profiling a route
for CPU. **Result:** the CPU is spent where the markup is, inside Next's renderer, and no piece of
our own code is large enough to be worth a pull request.

## Where the numbers come from

- **Billing, 18–25 October** (`vercel api /v1/billing/charges`, records tagged `park.fan`). This is
  the only per-project source the account has.
- **Request records, 25 Oct 16:00 to 26 Oct 16:00 UTC** (`vercel logs requests`, filtered to
  `pathType:(streaming_func OR func OR prerender)`, 42,725 records). They carry the route and the
  cache result, but no CPU, duration or memory.
- **Not available:** CPU time, peak memory, duration or cold-start type per route. Every
  `vercel metrics` query, grouped or not, answers `payment_required: Observability Plus is required
for this query`. So the per-route CPU below is a local measurement weighted by real request counts,
  not a number read off Vercel.
- **Local:** `pnpm build && pnpm start` on an M-series Mac, Node 26.7, warm Data Cache. CPU is the
  `ps` time of the `next-server` process across one pass over 60 real URLs per route taken from the
  request records, after one warm-up pass. Profiles with `--cpu-prof`.

## The bill for one week

| item (park.fan, 18–25 Oct)   |            used | effective cost |
| ---------------------------- | --------------: | -------------: |
| Build CPU Minutes            |         988 min |          $3.46 |
| ISR Writes                   |     588k writes |          $2.35 |
| Fast Origin Transfer         |         38.3 GB |          $2.30 |
| **Fluid Active CPU**         | **11.64 CPU-h** |      **$2.13** |
| **Fluid Provisioned Memory** |   **46.4 GB-h** |      **$0.70** |
| ISR Reads                    |     1.14M reads |          $0.46 |
| Function Invocations         |         566,591 |          $0.34 |

Active CPU is the fourth line, not the first, and memory is a third of it. 11.64 CPU-hours over
566,591 billed invocations is **74 ms of Active CPU per invocation** on average.

**98.4 % of the CPU runs in `fra1`** (11.46 h); `iad1` has 0.14 h and every other region less than
0.03 h. The project lists `fra1, iad1, arn1` as function regions, but the traffic is European and
lands in one place, so there is no idle second region to cut. Memory per CPU-hour is the same in
`fra1` (4.0 GB-h) and `iad1` (3.8 GB-h).

## The three most expensive routes

Function executions in the 24 hours of request records (everything that was not a CDN `HIT` or a
prebuilt `PRERENDER`), times the local CPU of one warm render:

| route                                 | executions/day | local CPU per request | share of measured CPU |
| ------------------------------------- | -------------: | --------------------: | --------------------: |
| `…/[park]/[attraction]` (ride page)   |         17,128 |            14.0–16 ms |              **55 %** |
| `…/[park]/wait-time-calendar/[[...]]` |          6,226 |          17.7–20.5 ms |              **25 %** |
| `…/[park]` (park page)                |          2,032 |          26.2–28.7 ms |              **12 %** |
| `/[locale]/glossary/[term]`           |          1,198 |               15.9 ms |                   4 % |
| `/api/parks/[...path]`                |          5,338 |            3.0–3.7 ms |                   4 % |

Not measured locally: `/api/mcp` (1,865), `/api/parks/live` (1,618), `/[locale]/contribute` (741),
`average-wait-times` (524) and `/api/og/[...path]` (488 renders a day against the ~300 expected; the
next thing to read if the OG route ever matters).

`/api/parks/[...path]`, the first suspect, is a relay: 3 ms per call, a fifth of a page render. Its
volume is high and its cost is not.

The 2026-10-20 entry in [decisions.md](./decisions.md) put one core of this Mac at about 4× a
Vercel build core. If function cores are similar, a ride render is roughly 60 ms there, which is in
line with the 74 ms average.

## What a render spends its CPU on

CPU profiles of 180 ride renders and of 120 calendar plus 120 park renders, self time with idle
removed:

| where                                              |  ride | calendar + park |
| -------------------------------------------------- | ----: | --------------: |
| Next's app-page runtime (React Flight and Fizz)    |  33 % |            38 % |
| module loading (`cjs/loader`, turbopack runtime)   |  10 % |             5 % |
| garbage collector                                  |   3 % |           3.5 % |
| `use-intl` (message formatting)                    |   2 % |           3.5 % |
| `lucide-react` icon component                      | 1.5 % |           2.8 % |
| `lib/glossary` auto-link (`parseGlossarySegments`) | 3.6 % |           1.4 % |
| everything else, each below 1 %                    |  rest |            rest |

No function of ours reaches 4 %. The largest is the glossary auto-link regex, about 0.6 ms per ride
render: halving it would move about 2 % of the ride route's CPU, which is 1 % of the bill line,
about two cents a week. The renderer cost scales with the markup each page sends, and the biggest
fixed part of that is the layout's header, whose hidden mega-menu panels are server-rendered for
the link graph on purpose
([header rule](../rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md)). That is a
product decision, already recorded in the 2026-10-16 and 2026-10-20 entries, not a CPU bug.

## Found and not fixed, with the reason

**Redirects and 404s on the ride route render the whole layout.** 572 renamed or relocated park
URLs a day answer 308 and 822 retired-ride URLs answer 404, together 8 % of the ride route's
executions. Each costs 12.0–12.7 ms (308) or 14.0 ms (404) locally, 80–90 % of a real render, and
ships a 76 KB body. The 308s come from `findRenamedParkRedirect` and `findRelocatedParkRedirect`
(for example `…/sevenum/toverland/…` to `…/sevenum/attractiepark-toverland/…`), which need the park
from the API. Moving them into `proxy.ts` would put that lookup on every request to save the body
on a few hundred; the [redirect rule](../rules/a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md)
already decided that these redirects stay in the render. A static old-to-new list in
`next.config.ts` would be hand-kept curation for under 3 % of the ride route's CPU. Neither is done.

**A smaller memory size.** There is no `functions` block, so every function runs at the project
default, `standard` (2 GB). Billing shows 4 GB-h of provisioned memory per CPU-hour: an instance
is provisioned about twice as long as it computes, because a render mostly waits for api.park.fan.
The local server peaks at 370–700 MB RSS. A lower size might be possible, but the whole line is
$0.70 a week, so the ceiling of the saving is about $1.50 a month. Without per-function peak
memory (Observability Plus) the size would be a guess, an out-of-memory crash is a 500 for a
visitor, and a route with its own `functions` entry is bundled into its own function, which means
cold starts of its own.

**Cold starts.** A fresh `next start` uses 0.53–0.56 s of CPU before it answers, 0.21 s more for
the first ride render, and 40–60 ms for each of the next few while the JIT warms up, against 15 ms
once warm. One cold instance costs as much CPU as about 50 warm ride renders. How many there are on
Vercel is not visible without `functionStartType`, which needs Observability Plus. Each production
deploy starts every instance cold, so the deploy debounce of 2026-10-26 (fewer deploys a day) is
the lever that already exists.

**`maxDuration` on the crons.** The four crons run once a day each. Fluid bills Active CPU, not the
time a function waits, and the instance is shared with other requests while it waits. Even if all
four waited their full limit at 2 GB, that would be under 0.7 GB-h a day. Not worth a change.

## Open question

The request records show about **40,200 function executions** in the 24 hours to 26 October
16:00 UTC. Billing counts **76,849 invocations** for the day to 26 October 07:00 UTC. Roughly half
of what is billed does not appear as a request. Candidates are background executions, which the
request records exclude by design (crons, and ISR regeneration, though the 1,085 `STALE` answers of
the day explain only a small part), and the
`proxy.ts` middleware, if Vercel counts it as an invocation of its own. It matters, because the
average of 74 ms per invocation and the per-route shares above are only as good as this split. The
**Compute** tab of the Vercel dashboard, grouped by route and by function start type, would answer
it in one look; the API equivalent needs Observability Plus.
