# The guide page teaches the real cards with the ride's real numbers (REQUIREMENT)

The guide page (`app/[locale]/how-park-fan-works/`, localized segment in `lib/howto/segments.ts`)
answers „was macht diese Seite, was ein Wartezeiten-Feed nicht macht". So every block renders a
**production** component (`AttractionCard`, `AttractionTypicalWaits`, `RopeDropCard`,
`ParkCalendarDay`, `NoLiveWaitTimesNotice`, …), and every figure in it is a value the API actually
returned, dated in `_fixtures.ts`. A redrawn lookalike starts lying at the first restyle; an invented
number is worse, because the block beside it links to the ride's own page.

- **Audit before you claim.** Check what a surface really renders before a sentence says so.
  Examples that shipped wrong: four sentences claimed a per-ride sample-day column on the park page,
  in six languages, but no surface puts sample days next to a ride (`ParkStatsAttractionsCard`
  renders rank, ride, now, P50, P90); `AttractionTypicalWaits` prints the weekday's **P90** above
  each bar; `typicalWaitThisHour` and `currentVsTypical` are on the payload and rendered nowhere; the
  calendar reaches a year out only for year-round parks; „früh kommen" is a per-ride finding, not a
  rule (Taron's day is flat where Chiapas climbs 22 minutes).
- **Two live blocks are the exception** (`LiveHourlyProfile`, `LiveTopAttractions`): where the point
  is „das läuft gerade", a frozen copy is the wrong exhibit, and the prose beside them names no
  figure they render.
- **Structured data is Article + Breadcrumb + `FaqList`'s `FAQPage`, never `HowTo`.** `HowTo` is
  deprecated. `FAQPage` still describes the page truthfully and stays, but Google retired FAQ rich
  results for every site on 2026-05-07, so no new page gets `FAQPage` in order to win one, and no
  AI-citation benefit is claimed for it. User-submitted Q&A would be `QAPage`.
- **Six locales, one shape**: each locale is a full `content/<locale>.tsx`; `CHAPTERS` must match the
  rendered `<SectionShell id= index=>` calls, and each file's `locale=` prop on the two live blocks
  must be its own.

## A displayed wait time is a multiple of five

This holds on every surface, not only the guide:

- Parks post waits in steps of five, so every raw observation is one; what breaks it is the maths on
  top (`PERCENTILE_CONT` interpolates, `AVG()` across days blurs), which is how the hourly table
  printed 51, 53 and 47. The API rounds on the way out and `roundWaitTo5` (`lib/utils/wait-time.ts`)
  rounds again at render, so a surface is right whichever build answers.
- **The one exception is 13**: Disney posts it for a walk-on, so both sides return exactly 13
  (`WALK_ON_WAIT_MINUTES`) instead of turning a walk-on into a 15-minute queue. A difference never
  gets the exception.
- **Round only what is displayed.** A crowd ratio, a ranking, a colour tier and the pick of a ride's
  peak hour read the raw value, or five-minute buckets invent ties: rounding first moved Wodan's
  peak from 12:00 to 11:00.
- **A signed delta goes through `roundWaitDeltaTo5`.** `roundWaitTo5` floors everything under 2.5 to
  zero, so pointed at the card's trend delta it deleted the falling half of the scale and every
  shrinking queue on every park page read „stabil".

Background: [the guide page](../features/how-park-fan-works.md) has the URLs, the fixture anchors and
the motion constraints.
