# The quietest weekday may be two days, and a thin day drops out rather than ending the vote (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

## The rule now: one quiet end, read off the crowd score

The quietest weekday is the park header's quiet end, everywhere it is named: the comparison table behind `park-comparison-widget`, the best-travel-time hub, the wait-time record page's lead sentence and the header itself. `deriveParkStatsFindings` and `deriveParkBestDays` read it from one function, `tierBuckets` in `lib/parks/park-stats-derive.ts`. It works on `avgCrowdScore`, never on the P50 wait. The busiest month follows the same rule.

The P50 arrives rounded to five minutes, and it ties. On 2026-10-22, Europa-Park read 20 on Sunday, Monday, Wednesday, Thursday and Friday, and Phantasialand read 25 on four weekdays. The old wait-based rule refused any week with three days sharing the minimum. It named no day for either park, and of the 18 comparison tables in the blog, **6 showed only dashes** in the column. The header, which had moved to the crowd score in PAR-914, named the days all along: Thursday, Friday and Sunday for Europa-Park, the working week for Phantasialand. Two rules gave two answers for one park on one site. With one rule, **0 of 18** tables are empty, and dashes are left only for parks whose week really is flat (Toverland, Plopsaland Deutschland).

What follows from it:

- **Several days are a finding.** Five days at the quiet end is the working week, and every place prints it the way the header does: „Werktags", or a span such as „Di.–Fr." (`formatWeekdayList` in `lib/utils/day-runs.ts`). The two-day cap is gone. A week too flat to have a quiet end still names nothing, and a weekday measured far more rarely than the others still drops out without ending the vote.
- **The wait printed beside the days** is their median, weighted by measured days (`quietestP50`). It is not the reason the days were picked.
- **A column with nothing in it goes.** `ParkComparisonCard` drops the quietest-day column when no park in the table has a quiet end. A row still loading keeps the column until it answers.

`pnpm test:park-stats-derive` holds both parks' weeks as the API returned them, and checks that the findings name the header's days.

## History: the tie that counted as „cannot choose"

the best-travel-time hub showed an em dash for **3 of 6** featured parks, correctly by the old rules and wrongly all the same. A weekday measured far more rarely than the others used to refuse the whole park — Movie Park has 13 Mondays against 23 Sundays — when dropping that one day leaves four comparable ones that do say something; and a tie counted as "cannot choose" when Disneyland Paris measuring 32 minutes on Sunday **and** Wednesday means the park has two quiet days, not none. Both days are named now. Measured across the eighteen parks this table is ever asked about: **12/18 filled → 17/18**, with no park that already had an answer getting a different one. Three refusals remain and each fired on a real park: fewer than four evenly-measured weekdays left, three or more days sharing the minimum (Disney Adventure World reads 39 on four of them — a park with no quiet day), and a "quietest" day not actually below the park's own median. In the same card the **park name is never the cell that gives way**: `table-layout: auto` hands width to the widest unbreakable content, so `max-w-0` on the park column collapsed it to "Europa-P…" while "34 Min. · Voltron Nevera powered by Rimac" kept all 39 characters. The name is the row's subject, a ride name a detail of one column — `w-full max-w-0` moved to the longest-queue cell instead. Same trap one layer over in `RideWaitTable`: the ride column may only claim the slack when it is the **only** text column, or park and type collapse to "Ph… Mult…" beside 500 px of empty name column.
