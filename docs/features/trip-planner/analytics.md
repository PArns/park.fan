# What the planner counts

The planner's events in our own statistic, beside the open/close funnel
([analytics](../../development/analytics.md#the-planner-funnel)). They answer where people leave the
wizard, what they plan, which tools they use and whether plans travel. Open this before adding a
planner event or changing where one fires.

## The events

| Event                     | Fires                                                              | Properties                      | Entity           |
| ------------------------- | ------------------------------------------------------------------ | ------------------------------- | ---------------- |
| `planner_wizard_step`     | a wizard step on screen for the first time in an opening           | `step`                          | the park         |
| `planner_wizard_finished` | the wizard's last press                                            | `headliners` (flag)             | the park         |
| `plan_item_added`         | one block into a plan                                              | `kind`, `source`                | the ride or show |
| `plan_item_removed`       | one block out of a plan                                            | `kind`, `source`                | the ride or show |
| `plan_optimized`          | a re-plan that changed the day                                     | `mode` (day, headliners, fit)   | the park         |
| `planner_fit_opened`      | the fit assistant asks                                             | `source`                        | the park         |
| `planner_fit_lever`       | a lever switched on (off is not counted)                           | `lever`                         |                  |
| `planner_undo`            | a day put back to before the last optimisation or assistant answer | `source` (optimize, add_button) | the park         |
| `planner_day_cleared`     | a whole day dropped                                                | none                            | the park         |
| `planner_shared_opened`   | a shared plan's link opened and its answer arrived                 | `outcome`                       |                  |
| `planner_shared_adopted`  | a shared plan taken over                                           | none                            |                  |
| `planner_push_on`         | push for the plan on and accepted by the API                       | none                            |                  |

`share_clicked` with `target: trip_plan` is the plan's share link; it stays where it was.

## How each one counts

- **The wizard's steps are counted once per opening.** `createPlannerWizardSession` keeps the steps
  an opening has shown; the dialog is mounted per opening and holds one session, so going back to
  „Tag" and forward again counts nothing. A seeded wizard (a park, or a park and a date, handed in)
  starts on a later step and never reports the earlier ones. A step is completed when the next one
  is reached; the last is completed by `planner_wizard_finished`. `headliners` says whether the
  finish planned them.
- **`plan_item_added` and `plan_item_removed` are sent by `usePlanner`**, the one place every write
  passes, so each caller names its control and nothing else: `addRide`, `addShow`, `addCustom`,
  `applyPlan` and `removeRide` take a required `source`. `applyPlan` counts one add per ride it adds
  (a stop without an entry), so „Alle Headliner" with six rides is six adds. `kind` is `ride`,
  `show` or `block` (a block of the visitor's own, the wizard's lunch included).
- **Add sources:** `search` (the panel's ride search), `add_button` (a ride page's „Zum Plan",
  through the fit assistant too), `drag` (a card dropped on a column), `missing_headliners` (the
  missing-headliner pills), `show_picker`, `block_menu` (a free block from a column or the panel),
  `wizard`, `headliners` (the optimise row's „Alle Headliner", through the assistant too).
- **Remove sources:** `block` (the block's own ✕), `action_bar`, `keyboard` (Delete or Backspace on
  a selected block), `timeline` (the list drawn where a day has no axis). A block the fit assistant
  leaves out is not a removal; its lever is counted instead.
- **`planner_fit_opened`** fires where the question is put: `optimize` when the optimise row opens
  the dialog (and again on „Anpassen"), `add_button` when a ride page's press opens it, `wizard`
  once per opening when the last step shows the levers inline.
- **`planner_fit_lever`** fires in `PlannerFitLevers` when a lever goes from off to on, so the
  wizard and the dialog count alike. `lever` is `FitLeverKind` with underscores.
- **`planner_shared_opened`** fires once per answer of `/v1/trips/<id>`, a retry being a new answer;
  `outcome` says whether the link held a plan. `planner_shared_adopted` fires on „Übernehmen".
- **`planner_push_on`** fires where `usePushSubscription.enable` reaches `on`, after the API took
  the subscription, not on the press.

## Which park, which ride

The plan stores slugs, and an event names its subject by UUID. `lib/planner/entity-ids.ts` keeps
the ids a page has already named, in memory for the tab, never in the plan:

- the page's park, from `PlannerPageParkBeacon` (`id`) on every park-scoped route;
- the park picked in the wizard, from the search hit's `id`;
- the park and the ride of a ride page's „Zum Plan" (`parkId`, `attractionId`);
- a `/plan/day` answer's `parkId`, `rides[].attractionId` and `shows[].showId`, where the API sends
  them.

A slug no page has named goes without an entity, never with a guess. An item event names the ride
or the show and never the park, so the ranking of planned rides holds rides only; the park ranking
comes from the park events (`plan_day_started` above all). Nothing here is about the visitor:
counts per day, like every other event.

## Checks

`pnpm test:planner-events` pins the wizard's once-per-opening counting, the entity rules and the
lever names; `pnpm test:umami-events` keeps the open/close funnel.
