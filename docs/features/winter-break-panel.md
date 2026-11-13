# Winter-break panel

The yellow glass panel a park in its winter break shows on its park page and on every ride page:
the day it opens again, how many weeks that is away, and Parky asleep in his sled. The panel is
`WinterBreakPanel` (`components/parks/winter-break-panel.tsx`), the rule is `winterBreakOf`
(`lib/utils/winter-break.ts`) and the picture is `ParkyWinterNap`
(`components/assistant/parky/winter-nap.tsx`).

## When a park is in its winter break

`winterBreakOf(park, todayIso)` answers from the schedule, never from the live status, which reads
`CLOSED` every night. All of these must hold:

- the park has an operating schedule and today's entry is not `OPERATING`;
- `nextSchedule` names the next opening; its `date`, else the park-local day of its `openingTime`;
- that opening is at least `OFFSEASON_MIN_DAYS` (7, `lib/utils/schedule-utils.ts`) away. It is the
  line the park cards (`getScheduleMessage`) and „Heute im Park" (`useTodaySchedule`) draw between a
  park shut for a few days, which they name the weekday of, and one between seasons, which they
  call „Nebensaison". A park open only at weekends never gets the panel, not even in February;
- at least `WINTER_BREAK_MIN_DAYS` (7) of the days from today to the reopening fall in January,
  February or March (July to September south of the equator);
- the park lies outside the tropics (|latitude| ≥ 23.44°) and has a latitude at all.

December does not count as winter: parks shut into it are mostly waiting for their Christmas season
after their Halloween one. On 13 November 2026 that split the closed European parks into Hansa-Park
(until 25 March) on one side and Parc Astérix, Walibi Rhône-Alpes (until 19 December), Movie Park
and Toverland (late November) on the other. A park whose reopening the API does not know (Heide
Park, Djurs Sommerland that day) shows no panel: it exists to name the date.

`pnpm test:winter-break` holds the cases.

## Where it sits

- **Park page:** above „Heute im Park", before `NoLiveWaitTimesNotice`.
- **Ride page:** under the header card, first of the notes (`NoLiveWaitTimesNotice`,
  `WorksPeriodNote`). The headline speaks of the park („Der Park öffnet wieder am …"), because a ride
  can stay shut after the park reopens.

## Why it is server-only

Both pages are `force-dynamic` and compute the park's day on the server, so the panel is in the
first HTML at its full height and never shifts the page. It has no client code, and its strings are
the top-level `winterBreak` namespace rather than `parks.winterBreak`: the park route sends all of
`parks` to the browser ([translations are routed](../rules/translations-are-routed-not-bundled.md)).

The countdown is `Intl.RelativeTimeFormat` over `weeksUntil` (`lib/utils/park-day.ts`), the same
rounding „Heute im Park" uses, so the two never name different week counts for one date.

## The picture

`ParkyWinterNap` draws a 320 × 160 scene: Parky asleep on a wooden sled with red runners, in his
bobble hat and scarf, the snowman beside the sled and the park's Ferris wheel snowed in behind the
hills. Parky is built from the live Parky's pieces: `BUBBLE`, `SHUT_EYES`, `SMILE`, `CHEEKS`, `ZED`
and `MOON` from `drawing.ts`, the hat, scarf and snowman from `looks.tsx`. The sled is drawn after
him, so its seat covers the bottom of his bubble and the scarf's fringe. It is entirely still, since it sits inside a `backdrop-filter`
([work nobody can see](../rules/work-nobody-can-see-is-still-work.md)): `ParkyLookHat` and
`ParkySnowman` take `still`, which drops the pompom's bob and the snowman's build and melt. Sky,
hills and wheel take their colours from Tailwind classes, so the scene follows the theme. It fills
its box with `slice`; on phones it is a 2 : 1 banner over the text, from `sm` a framed picture to the
right of it.
