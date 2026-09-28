# A render redoes no work it did last time (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

Park pages re-render on the minute clock, on every live poll and on every filter tap, with 50 to 150
cards on screen. Anything a render repeats is multiplied by that. Four ways it went wrong, each
found more than once in the 2026-09-28 audit:

## 1. An `Intl` formatter is built once, not per call

`new Intl.DateTimeFormat(...)`, and `date.toLocaleDateString(locale, options)` /
`toLocaleTimeString(locale, options)` / `toLocaleString(locale, options)`, which build one inside,
cost around 65–80 µs each against about 1 µs for a cached `.format()`. Use the factories in
`lib/utils/intl-format.ts`: `getDateTimeFormat`, `formatTime`, `getNumberFormat`,
`getRelativeTimeFormat`. The output is identical (checked for all six locales and several zones).

This was [conventions §13](../development/conventions.md#13-never-build-an-intl-formatter-per-item)
for months and was still broken in `ParkTime` (up to three formatters per instance, one per card
footer and two per calendar day), `getScheduleMessage` (up to three per call, twice per ParkCard),
`useTodaySchedule` (up to five per render), `NewsAge`, the ML countdown's one-second tick, the
planner's month calendar (42 per render) and the proxy's calendar redirect. A convention nobody
reads is not a rule; this page is why it is one now.

## 2. A prop a memoised child reads holds still

- `?? []` in JSX is a new array per render and defeats the child's `memo`. Use a module constant
  (`NO_HEADLINERS`, `NO_FEATURED_PARKS`).
- A child built inline by a parent that re-renders on interactions is `memo`ised when its props do
  not change with them: `ParkTabsList`, `LiveDataFreshness`, `RopeDropHeadliners` (every search
  keystroke), the header's mega-menu panels (every burger tap, also where they are hidden),
  `GlossaryTermCard` (270 of them per keystroke).
- A Map or Set derived from a snapshot is `useMemo`ised on the snapshot (`liveWaitsFor`,
  `closedNowFor` in the planner column); a fresh one per render re-runs every memo that keys on it.
- A memo that splits cheap from expensive keeps the expensive identity stable: the planner's axis
  is memoised apart from its growth, so the grid keeps its identity across edits and the "Tag
  optimieren" search does not re-run in the edit's own commit.

## 3. A store ignores a no-op

A reducer that changed nothing returns the state it was given, and the store must not turn that
into a write. `plannerStore.update` spread every result into a new object for the version bump, so a
resize step that snapped to the same minute stringified the whole plan into localStorage,
re-rendered every `usePlanner` subscriber and re-armed the trip sync. Check `next === previous`
before writing. A parse of a persisted value is cached by its raw string
(`lib/nearby/nearby-cache.ts`), because `placeholderData` calls the reader on every render.

## 4. A search runs where its answer is read, once, on the inputs it reads

- The planner wizard ran `evaluateFit` (up to five beam searches) on the date and setup steps,
  three times per change with the same arguments, for a result only the last step draws. Gate the
  computation on the step, and pass in a result the caller already holds (the `base` argument of
  `fitLevers` and `fitLeverView`) instead of recomputing it.
- A search keyed on an object that changes for reasons it does not read is keyed on what it reads:
  the pre-search behind "Tag optimieren" ran per keystroke of a free block's label until it was
  keyed on `searchKeyOf` (slug, start, duration, done).

## And one that looks like the opposite

A `useMemo` whose dependency list leaves out a prop that changes is a stale value, not a saving.
`DailyWaitTimeChartClient` memoised on mount and timezone behind an `eslint-disable`, while its data
props polled every five minutes: the chart kept the first response for as long as the tab was open.
An `exhaustive-deps` suppression names what it leaves out and why.
