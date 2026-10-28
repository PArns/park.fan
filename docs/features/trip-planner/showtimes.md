# Showtimes in the planner

How shows reach the day grid, how a projection is told apart from a listing, how a performance
becomes an entry and how the show lines get out of the way. Code: `lib/planner/shows.ts`,
`lib/planner/shows-visible.ts`, `components/planner/planner-show-band.tsx`,
`planner-show-picker.tsx`. The `shows` contract is in the
[API's `/plan/day` shows doc](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/plan-day/shows.md).

## A listing and a projection are not the same thing

Shows arrive inside `/plan/day`, and each carries a `source` the panel may not resolve away:

- `scheduled` — the operator's own listing, published for today and past days only.
- `projected` — the last matching weekday carried forward, with `observedOn` and `sampleDays`.

A projection is drawn softer everywhere: the band says „Voraussichtlich" instead of „Als Nächstes",
the gutter time is prefixed `~`, the rule is dotted rather than dashed and the name italic and
muted. Where several showtimes fold into one rule, one projection in the group decides
(`lineSource`). An empty `shows` array is a statement about the park; the old live-payload source
knew only today.

**A projected time outside the park's published day is dropped; a listing never is.** The
projection comes off another date that is often longer (Phantasialand closed at 18:00 on
2026-09-03; its projection from a late-summer evening put 22 of 48 showtimes past the close). An
operator's listing for the date outranks opening hours we derived (`hoursSource: "observed"`).

**The clip window is unfolded.** A day crossing midnight publishes `closeHour < openHour` (La Ronde
`11 → 1`), and multiplied out the window ran backwards and silently dropped every projection.
`showDayHours()` builds it through the same `unfoldedCloseHour` the axis uses, and both call sites
go through it. The show **times** are not unfolded yet, and that is a bug: since PAR-51 the API files a
performance under the **previous** date when that date's published window still covers it
([backend contract](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/plan-day/shows.md#past-midnight-performances)),
so on a wrap day a 00:00 show arrives in that day's `shows` and lands before the opening
(PAR-1102). `pnpm test:planner-shows` pins the window, the clip and the listing's exemption.

## A performance can be planned

`PlannerShowPicker` sits beside „Eigener Block" and lists the lines the grid draws (same clip, same
`~`). A pick calls `addShowEntry`: a free block (`custom`, icon `show`, `DEFAULT_SHOW_MINUTES` 30)
carrying `showSlug`, which the walking sum uses to find the show's position. The time belongs to the
performance, so `moveEntry`, `setCustomBlock` and `shiftFrom` return a show entry untouched, the
grid starts no drag or resize on it, the action bar offers neither nudge nor edit, and the fit
assistant does not offer it as a lever. Changing it is delete and pick another.

## The show switch

Shows are the one thing on the grid nobody put there, so they switch off
(`lib/planner/shows-visible.ts`, an external store over localStorage). The switch renders only where
there is something to switch (`dayHasShowLines`, asked exactly as the grid asks). Lines stay mounted
and fade (`showsHidden` on the grid, `visibility` flipping at the end).

- **Desktop:** the switch lives in the show band, which stays when shows are off and says
  „Spielzeiten ausgeblendet".
- **Phone:** the band is not drawn (`planner-phone:hidden`; it stood 44 px tall, sticky over the
  axis, repeating what the grid says at every show). The switch is `PlannerShowsButton`, the theatre
  masks at the end of the foot's optimise row, `aria-pressed`, primary tint for on. The trip-planner
  page's demos render the band without a switch.

## A show line does not cover a block

A show pill centred on the axis covered whatever planned ride it fell into (on Europa-Park, with a
show every hour, every other block of a full day). So a block that a show line falls into writes
the show itself (`showLineHost` in `lib/planner/day-grid.ts`, the leftmost of two side by side): on
its second line beside the times, or between name and figure where it has one line, as „🎭 ~15:15
Fina & The Yomis, …". The label is `flex-1` from a basis of 0, so it only takes the room the name,
times and figure leave. The grid then draws nothing for that line. In a gap between blocks the pill
keeps its names at the right end, clear of the transfer chip, and a line that grazes a block edge
gets only the mask, placed by `showLineCover`. A pill whose line falls under the empty-day card is
not drawn. With a fine pointer over any block every show mark fades to 20 % (fine only: a tap leaves
`:hover` stuck on touch).
