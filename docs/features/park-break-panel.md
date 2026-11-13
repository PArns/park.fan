# Break panel

The yellow glass panel a park shows on its park page and on every ride page while it is shut for a
while: the day it opens again, how many weeks that is away, and Parky asleep in a picture of the
season. „Winterpause" for the winter break, „Saisonpause" for any other closure whose reopening is a
week or more away.
The panel is `ParkBreakPanel` (`components/parks/park-break-panel.tsx`), the rule is `parkBreakOf`
(`lib/utils/park-break.ts`) and the picture is `ParkyBreakScene`
(`components/assistant/parky/break-scene.tsx`). `/ui` shows all four forms.

## When a park gets the panel

`parkBreakOf(park, todayIso)` answers from the schedule alone, never from the live status, which
reads `CLOSED` every night:

- the park has an operating schedule and today's entry is not `OPERATING`;
- `nextSchedule` names the next opening; its `date`, else the park-local day of its `openingTime`;
- that opening is at least `OFFSEASON_MIN_DAYS` (7, `lib/utils/schedule-utils.ts`) away. It is the
  line the park cards (`getScheduleMessage`) and „Heute im Park" (`useTodaySchedule`) draw between a
  park shut for a few days, which they name the weekday of, and one between seasons, which they
  call „Nebensaison". A park open only at weekends never gets the panel, not even in February.

The label is „Winterpause" when at least `WINTER_BREAK_MIN_DAYS` (7) of the days from today to the
reopening fall in January, February or March (July to September south of the equator) and the park
lies outside the tropics (|latitude| ≥ 23.44°), „Saisonpause" otherwise. December does not count:
parks shut into it are mostly waiting for their Christmas season after their Halloween one.

On 13 November 2026, 22 of the 209 parks got the panel: Hansa-Park and four water and seasonal
parks with „Winterpause", and 17 with „Saisonpause", among them Movie Park (until 27 November),
Parc Astérix (until 19 December) and Chessington (until 21 November). Heide Park got none: the API
did not know its reopening, and the panel exists to name the date.

`pnpm test:park-break` holds the cases.

## The picture

`scene` comes from the season at the park on the day (meteorological, mirrored in the south, summer
all year in the tropics): winter in its months, autumn in its months, spring in spring and summer.
A winter break shows the snow from November on, and spring once March has come.

| Scene    | Parky                                        | Beside him         | In the sky                 |
| -------- | -------------------------------------------- | ------------------ | -------------------------- |
| `winter` | on a wooden sled, bobble hat and scarf       | the snowman        | moon and stars, snowflakes |
| `autumn` | in a heap of leaves, Ferris wheel hat, scarf | a tree turning red | sun (moon in dark), leaves |
| `spring` | among the tulips, Ferris wheel hat           | a tree in blossom  | sun (moon in dark), petals |

The panel's last sentence follows the picture („Parky schläft so lange im Laub"). Parky is built
from the live Parky's pieces: `BUBBLE`, `SHUT_EYES`, `SMILE`, `CHEEKS`, `ZED` and `MOON` from
`drawing.ts`, the hat, scarf and snowman from `looks.tsx`, the Ferris wheel from `ParkyWheel`
(`wheel.tsx`, which `ParkyLogo` draws its hat with too). The seat, the leaf heap and the tulip bed
are drawn after him, so they cover the bottom of his bubble. Everything is still, since the picture
sits inside a `backdrop-filter` ([work nobody can see](../rules/work-nobody-can-see-is-still-work.md)):
`ParkyLookHat` and `ParkySnowman` take `still`, which drops the pompom's bob and the snowman's build
and melt. Colours come from Tailwind classes, so the scene follows the theme.

## Where it sits and how it is laid out

- **Park page:** above „Heute im Park", before `NoLiveWaitTimesNotice`.
- **Ride page:** under the header card, first of the notes (`NoLiveWaitTimesNotice`,
  `WorksPeriodNote`). The headline speaks of the park („Der Park öffnet wieder am …"), because a ride
  can stay shut after the park reopens.

Below `sm` the picture is a framed 2 : 1 banner over the text. From `sm` it reaches the panel's top,
right and bottom edge and fades into the yellow glass to its left through a `mask-image`, like the
guide in a title card (`WINDOW_EDGE_MASK`). It fills its box with `xMaxYMid slice`, so a box taller
than 2 : 1 loses the Ferris wheel on the left first, where the fade is anyway.

## Why it is server-only

Both pages are `force-dynamic` and compute the park's day on the server, so the panel is in the
first HTML at its full height and never shifts the page. It has no client code, and its strings are
the top-level `parkBreak` namespace rather than under `parks`: the park route sends all of `parks`
to the browser ([translations are routed](../rules/translations-are-routed-not-bundled.md)).

The countdown is `Intl.RelativeTimeFormat` over `weeksUntil` (`lib/utils/park-day.ts`), the same
rounding „Heute im Park" uses, so the two never name different week counts for one date.
