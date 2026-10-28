# The quietest weekday is the park's quiet end, and a thin day drops out rather than ending the vote (REQUIREMENT)

The quietest weekday is the park header's quiet end, everywhere it is named: the comparison table
behind `park-comparison-widget`, the best-travel-time hub, the wait-time record page's lead sentence
and the header itself. `deriveParkStatsFindings` and `deriveParkBestDays`
(`lib/parks/park-stats-derive.ts`) read it from one function, `tierBuckets`, which works on
`avgCrowdScore`, never on the rounded P50 wait. The busiest month follows the same rule.

- **Several days are a finding.** Five days at the quiet end is the working week, printed the way the
  header prints it, „Mo–Fr" or a span such as „Di–Fr", never „Werktags"
  ([„Werktags" is Monday to Saturday](werktags-is-monday-to-saturday.md)). Tables join the days with
  `&` („Do, Fr & So"). Both come from `formatWeekdayList` (`lib/utils/day-runs.ts`).
- **A weekday measured far more rarely than the others drops out** without ending the vote (Movie
  Park has 13 Mondays against 23 Sundays). A week too flat to have a quiet end still names nothing.
- **The wait printed beside the days** is their median, weighted by measured days (`quietestP50`). It
  is not the reason the days were picked.
- **A column with nothing in it goes.** `ParkComparisonCard` drops the quietest-day column when no
  park in the table has a quiet end; a row still loading keeps the column until it answers.
- **In that card the park name is never the cell that gives way.** `table-layout: auto` hands width
  to the widest unbreakable content, so `max-w-0` on the park column collapsed it to "Europa-P…"
  beside a 39-character ride name. `w-full max-w-0` goes on the longest-queue cell. In
  `RideWaitTable` the ride column claims the slack only when it is the only text column.

## Why

The P50 arrives rounded to five minutes, and it ties: on 2026-10-22 Europa-Park read 20 on five
weekdays and Phantasialand 25 on four. The old wait-based rule refused any week with three days
sharing the minimum, so 6 of the blog's 18 comparison tables showed only dashes, while the header,
already on the crowd score, named Thursday, Friday and Sunday for Europa-Park. Two rules gave two
answers for one park on one site. With one rule, 0 of 18 tables are empty; dashes are left only for
parks whose week really is flat (Toverland, Plopsaland Deutschland).

## Check

`pnpm test:park-stats-derive` holds both parks' weeks as the API returned them and checks that the
findings name the header's days.
