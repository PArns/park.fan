# A render redoes no work it did last time (REQUIREMENT)

Park pages re-render on the minute clock, on every live poll and on every filter tap, with 50 to 150
cards on screen, so anything a render repeats is multiplied by that. Four rules, each found broken
more than once in the 2026-09-28 audit:

1. **An `Intl` formatter is built once, not per call.** Use the factories in
   `lib/utils/intl-format.ts` (`getDateTimeFormat`, `formatTime`, `getNumberFormat`,
   `getRelativeTimeFormat`, `getListFormat`), never `new Intl.DateTimeFormat(...)` or
   `toLocaleDateString` / `toLocaleTimeString` / `toLocaleString(locale, options)` in a render. Those
   build a formatter inside, 65–80 µs each against about 1 µs for a cached `.format()`, with
   identical output. `ParkTime` built up to three per card footer, the planner's month calendar 42
   per render.
2. **A prop a memoised child reads holds still.**
   - `?? []` in JSX is a new array per render and defeats the child's `memo`; use a module constant
     (`NO_HEADLINERS`, `NO_FEATURED_PARKS`).
   - A child built inline by a parent that re-renders on interactions is `memo`ised when its props do
     not change with them (`ParkTabsList`, `LiveDataFreshness`, `RopeDropHeadliners`, the header's
     mega-menu panels, `GlossaryTermCard`, 270 of them per keystroke).
   - A Map or Set derived from a snapshot is `useMemo`ised on the snapshot (`liveWaitsFor`,
     `closedNowFor` in the planner column).
   - A memo that splits cheap from expensive keeps the expensive identity stable: the planner's axis
     is memoised apart from its growth, so "Tag optimieren" does not re-run in an edit's commit.
3. **A store ignores a no-op.** A reducer that changed nothing returns the state it was given, and
   the store checks `next === previous` before writing (`plannerStore.update`): a resize step that
   snapped to the same minute used to write the plan to localStorage, re-render every `usePlanner`
   subscriber and re-arm the trip sync. A parse of a persisted value is cached by its raw string
   (`lib/nearby/nearby-cache.ts`), because `placeholderData` calls the reader on every render.
4. **A search runs where its answer is read, once, on the inputs it reads.** The planner wizard ran
   `evaluateFit` (up to five beam searches) three times per change on steps that never draw it. Gate
   the computation on the step, pass in a result the caller already holds (the `base` argument of
   `fitLevers` and `fitLeverView`), and key a search on what it reads (`searchKeyOf`: slug, start,
   duration, done), not on an object that changes for other reasons.

**And the opposite:** a `useMemo` whose dependency list leaves out a prop that changes is a stale
value, not a saving. `DailyWaitTimeChartClient` memoised on mount behind an `eslint-disable` while
its data polled every five minutes, and kept the first response for as long as the tab was open. An
`exhaustive-deps` suppression names what it leaves out and why.
