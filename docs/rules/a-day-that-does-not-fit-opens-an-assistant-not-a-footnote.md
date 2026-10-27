# A day that does not fit opens an assistant, not a footnote (REQUIREMENT)

Both optimise presses probe first with `needsFitHelp` (`lib/planner/fit.ts`) and, where anything
would be left out, open `PlannerFitAssistant`, which writes nothing until its last step.

- **Every hint is a measured difference between two plans, never advice.** `fitLevers` re-runs the
  whole optimiser once per free block without it and once with it cut to `SHORT_BLOCK_MIN` (30), and
  offers only what buys a ride. Shortening is offered before dropping, and dropping not at all where
  half an hour already solved it. A lever is a toggle: pressing it again puts the break back.
- **The list is `fitOrder`, never a sort of its own**, so what stands at the bottom is what the
  engine gives up first. Each row has a tick (wanted at all) and a pin (`OptimizeInput.priority`),
  both recomputed against the same search the press will run.
- **A ticked wish is re-planned, not parked past the gate**: every ride with a payload row goes to
  the engine as an ADD. `optimizeDay` alone may never delete somebody's entry; this list, where the
  ride is named, is the one place that is relaxed.
- **The visitor's order beats the park's curation**: `isWanted` counts a ride named in `priority` as
  one somebody is there for, so a pinned filler no longer goes before an unpinned headliner.
- **Solving it may not take the screen away.** The dialog's band and the wizard's block carry a
  state: the crowd tint with a warning while something is left out, `status-operating` with a check
  („So passen alle 10 Bahnen in den Tag") once nothing is. The wizard's block stays while anything
  has been answered (`fitChoiceTouched`, derived, never latched, so a change of park or date resets
  it).
- **The wizard asks the same question on its own step** (`park → date → setup → headliners`), and
  `finish` reads the lunch block back out of `evaluateFit`'s answer, so the day filed is the day
  shown.
- **A block past closing says so in two shapes**, because the API reports a closing hour: past
  `closeMin + closeSlackMin` „Liegt nach Parkschluss", inside the hatched hour „Kann schon nach
  Parkschluss liegen", and nothing on a free block. The result line is a bordered warning with an
  „Anpassen" button back into the assistant.
- **The ride page's „In den Plan" is the third press that asks.** `noRoomForRide`
  (`lib/planner/add-ride-fit.ts`) builds the same `FitInput` from `fitWishes` and `fitBlocks`; where
  the day has no room nothing is written, and the assistant opens with the ride in its title
  (`fit.titleFor`) and pinned (`requestedRideChoice`), so the proposed plan cannot give up exactly
  the ride that was asked for. No payload, a walked day, an unlisted ride or a park without readable
  waits file as before.

## Why

Ten headliners and nine hours is a decision the app cannot make, and it used to make it in a grey
eleven-pixel clause („eine passt nicht mehr in den Tag") under a block drawn at 18:45 in a park that
shuts at 18:00. The levers are real: Phantasialand on 2026-09-12 goes from 9 to 10 of 10 without
lunch, Movie Park on 2026-09-20 to 10 of 10 on 30 minutes instead of 60, and Phantasialand on
2026-10-03 says „dann passen 9 von 10" because that is what it is. Over 35 park-days at six parks, 5
do not fit and 2 of them are solved by one lever. Late in the day the ride page's press used to file
blindly: eight presses at 20:10 gave `20:15 · 21:15 · 22:15 · 23:15 · 24:15 · 25:00 · 25:00 · 25:00`.

## Check

`pnpm test:planner-fit` pins the model (sections 12 and 13 cover the ride-page press);
`pnpm check:planner` walks the three steps against a seeded day that cannot fit. Background:
[trip planner → the fit assistant](../features/trip-planner/optimizer.md#the-fit-assistant).
