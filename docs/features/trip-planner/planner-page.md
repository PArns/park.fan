# The planner page

`/trip-planner` (localized via `PLANNER_SEGMENTS`) is the planner's own page: the list of planned
days, an article that explains the planner with its own components, the assistant that spreads
parks over a trip, and the page a shared plan opens. Code: `app/[locale]/trip-planner/`,
`components/planner/planner-page-body.tsx`.

## The article explains with the planner's own components

Under the directory sit six numbered chapters, the same six in every locale
(`content/<locale>.tsx`): blocks and transfers (with the demo), where the wait times come from,
height limits and water rides, opening times with shows and breaks, the two sort buttons with the
fit assistant, and the day itself in the park (ticking off, notifications, where the plan is
stored). It describes what a visitor can do and see, not how the planner computes it; the reasoning
lives in these docs. It follows the guide page's rules
([the guide page teaches the real cards](../../rules/the-guide-page-teaches-the-real-cards-with-the-rides-real.md)):

- **The exhibits are production components** — `PlannerDayGrid`, `PlannerShowBand`,
  `PlannerGridActions`, `PlannerContextBand` — rendered by `_demos.tsx`, so a restyle reaches the
  explanation the same day.
- **Every number is one the API returned, dated**: `_fixtures.ts` holds `/plan/day` for
  Phantasialand on Saturday 2026-09-12 as answered on 2026-09-04, verbatim (hourly curves,
  `expectedError` 15.4 on the headliners and 10.9 on the rest, `opensAt` 10:00 against a 09:00
  opening, projected showtimes with their `observedOn`). Captions name the day.

The date being **past** is load-bearing twice: the prose may name a figure the demo draws (which a
live blog widget may never do), and the exhibit is inert — `PlannerDayGrid` gates its weather query
on the forecast horizon — so the page prerenders, ships no request and holds still. The demo is
operable and writes nothing: `_demos.tsx` keeps entries in component state, so a reader can drag a
block and watch heights and transfers recompute without touching their own plan. The guide page
(`how-park-fan-works`) imports the same demo and fixtures. No `FAQPage` markup (see
[a landing page has one anatomy](../../rules/a-landing-page-has-one-anatomy.md)).

`check:planner` asserts the six chapters and their unbroken numbering, seven blocks and at least one
leg in the figure, no raw message keys, the demo leaving the store untouched, and the same in French
(the article is six modules; a missing one is a build error only for its locale).

## Which park on which day

„Parks auf Tage verteilen" opens `PlannerTripAssistant`, a dialog in the fit assistant's shape;
`lib/planner/assign.ts` is the pure part (`pnpm test:planner-assignment`).

- **Nothing is stored except what is accepted.** Window and park choice live in the dialog; there is
  no trip object in the plan, so "several trips" means running it again. Days already in the plan
  are occupied and never move.
- **Ranking:** quietest free day wins, a tie keeps the earlier day. `unknown` (no forecast, or past
  the 90-day snapshot) ranks behind `extreme` and the row says „Keine Prognose"; `closed` is never
  proposed.
- **Countries are blocks:** parks of one `geo.country` lie together; with the switch on, a change of
  country needs a free day between, against the plan's own days too. No distance — the plan stores
  no coordinates.
- **A second day** is offered beside a first day that is `high` or worse, on a free, open, forecast
  neighbour that uses up no travel gap; chosen after the first days, not with them.
- **Accepting** writes `PlannerDay.reserved: true` on empty days, which `isPlannedDay()` counts. The
  field is optional, so older plans read as before. Push and the notification job still key on
  entries.
- **Limits:** `MAX_ASSIGN_DAYS` 31 and `MAX_ASSIGN_PARKS` 8; the search is exact within them.
- **Forecasts** come from the best-days snapshot through `parkBestDaysQueryOptions`, the park page's
  key.

## A shared plan

With push on, the toggle offers a share link (`PlannerShareLink`). The trip id is the credential, so
it travels in the URL **fragment** (`/<locale>/trip-planner/shared#<id>`, `lib/planner/trip-share.ts`):
not sent to the server, not in a `Referer`, excluded from Umami. The page (`PlannerSharedPlan`) is
`noindex` and in no sitemap; it loads the plan from `/api/trips`, shows it, and copies it into this
browser's store only when the button is pressed. The sender's id is kept nowhere, so nothing on that
page can write to the sender's plan. `pnpm test:trip-share`.
