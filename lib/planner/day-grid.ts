import type { PlanDayRide } from '@/lib/api/types';
import type { DayClock } from './park-time';

/**
 * The day grid's geometry. Pure — no React, no DOM, no clock.
 *
 * The axis is **uniform and linear**, and that is a decision against the
 * precedent next door. `lib/utils/weather-chart-axis.ts` draws an open hour four
 * times as wide as a closed one, and it is right to: a weather chart must render
 * all 24 hours because the weather at 03:00 exists. A plan must not — the
 * planner refuses a time outside the park's hours already, and `PlanDayRide`
 * carries one entry per OPEN hour and nothing else. Running a linear axis over
 * just the operating day plus a small pad gives the opening hours ≈92 % of the
 * canvas against the warp's documented 74 %, with a one-line inverse.
 *
 * And a warp would cost the one property this whole view is about. On a
 * piecewise axis a minute costs a different number of pixels depending on where
 * it falls, so two identical 40-minute queues would draw at different heights —
 * invisibly, with no legend able to explain it. `heightFor` therefore takes a
 * DURATION and no start position, which is what makes the invariant enforceable
 * rather than merely stated.
 */

/**
 * Pixels per minute. 72 px per hour.
 *
 * Chosen from content rather than from a viewport: a 40-minute queue — the
 * common headliner figure — is 48 px, which is two lines of `text-sm` plus a
 * `text-[10px]` meta line and 6 px of padding; a 15-minute drag step is 18 px,
 * comfortably above touch tolerance. Deriving it from a container's height would
 * be a measurement arriving after paint, i.e. a resize of the whole grid on
 * every open, so it is a constant per pointer class and not a function of the
 * box.
 */
export const PX_PER_MIN = 1.2;

/**
 * The same axis on a phone. 108 px per hour.
 *
 * It is NOT a preference and not a squeeze in the other direction — the value
 * follows from what is left of the sheet. At 390×844 the sheet is 716 px, of
 * which the handle, the header and the push toggle take 122, the day's foot 182
 * and the column's own chrome 163: about 250 px for the axis and the ride search
 * together (the arithmetic is `planner-day-column.tsx`'s own, measured by its
 * author). At 1.2 px per minute a floor of 140 px is two hours of a nine-hour
 * day; at 1.8 the same floor is one hour twenty, which is worse — so this number
 * only pays off together with the chrome Etappe 2 gives back, and both land in
 * the same change.
 *
 * What it buys is the block, not the axis: a 20-minute queue is 24 px at 1.2 and
 * **36 px** at 1.8, i.e. the difference between a bar and something with a name
 * on it, and a coarse snap step goes from 36 px to 54 — far enough that a drag
 * of a thumb's width lands on the step it looks like it lands on.
 *
 * Every derived figure reads `grid.pxPerMin` and never this constant, so the
 * axis, the blocks and the inverse of `yFor` cannot disagree. The one place it
 * is read is {@link usePlannerPxPerMin}.
 */
export const PX_PER_MIN_COARSE = 1.8;

/** Arrival and rope drop happen before opening, so the axis starts before it. */
export const PRE_PAD_MIN = 30;

/**
 * A queue joined near closing overruns it. The pad is where the overrun is
 * drawn, rather than being clipped into a claim that the day ends on time.
 */
export const POST_PAD_MIN = 30;

/**
 * How much later than {@link DayGrid.closeMin} the park might really shut.
 *
 * The API reports `closeHour` as an HOUR — the hour its closing time falls in —
 * and this axis used to read that as "the last hour the park is open" and add
 * sixty minutes to it. On a park closing at 18:00 that made the planner believe
 * in a day ending at 19:00, and the optimiser filled it: Phantasialand on
 * Saturday 2026-09-12 came back with Winja's Fear queued at **18:15** and the
 * day finishing at 18:55, an hour after the gates shut. The `+ 60` was not a
 * rounding error but a whole extra hour of plan, on every park that closes on
 * the hour.
 *
 * Which is most of them, and that is measured rather than assumed: over 3,540
 * operating park-days from the catalogue's own calendars, **3,046 close exactly
 * on the hour (86.0 %)**, 486 at half past and 8 at quarter to. So the hour is
 * the closing time for six days in seven and the truncation is real for the
 * seventh — and the two facts point opposite ways, which is why there are now
 * two numbers instead of one.
 *
 * {@link DayGrid.closeMin} is the CERTIFIABLE end: the park is open until then,
 * and nothing this app plans by itself may run past it. This is the slack above
 * it, where the park may or may not still be open — drawn, draggable, never
 * planned into. It is the same hard/soft split {@link rideFloor} makes at the
 * other end of the day, and for the same reason: a fact decides what the app
 * may assert, a guess decides only what it draws.
 *
 * Sixty because that is the width of the API's own rounding. It goes to zero
 * the day the backend sends a real minute, and every rule keyed to it then
 * reduces to "the park closes when it closes".
 */
export const CLOSE_SLACK_MIN = 60;

/** Outlook's own drag granularity. 18 px here. */
export const SNAP_MIN_FINE = 15;

/** 36 px. Fifteen minutes under a finger reads as jitter, not as a choice. */
export const SNAP_MIN_COARSE = 30;

/**
 * The smallest BOX a block may occupy — not a claim about its height.
 *
 * 20 px is the smallest box a `text-[11px]` line sits in. It corresponds to 16.7
 * minutes, so every shorter queue gets it; the tinted fill inside is still drawn
 * to the true height, so the box grows and the ink does not lie. `heightFor`
 * never consults this: `blockBoxFor` is the layout-only twin, and the two being
 * separate functions is what keeps the floor out of the measurement.
 *
 * Stated at {@link PX_PER_MIN} and scaled by the axis in {@link minBlockPxFor},
 * so the floor stays the same number of MINUTES at every scale. Left as a flat
 * 20 px it would be 11.1 minutes at {@link PX_PER_MIN_COARSE} — a floor that
 * quietly does less the moment the axis it is a floor on gets taller.
 */
export const MIN_BLOCK_PX = 20;

/**
 * The same floor as {@link MIN_BLOCK_PX}, in minutes — 16.7 of them.
 *
 * This is the scale-free statement of it, and it is what a caller wants whenever
 * it needs the floor as a DURATION rather than as a height: the span a block
 * occupies for lane packing, say. Reading `MIN_BLOCK_PX / grid.pxPerMin` gave
 * the same number and made the caller depend on the axis for a value that does
 * not vary with it.
 */
export const MIN_BLOCK_MIN = MIN_BLOCK_PX / PX_PER_MIN;

/**
 * Below this the uncertainty band is not drawn.
 *
 * `bar-geometry.ts` used `0.005` — half a percent of a fixed-width track, which
 * means nothing against a variable height. Restated in pixels: under 3 px (2.5
 * minutes) a band is an antialiasing artefact rather than a statement.
 */
export const MIN_BAND_PX = 3;

/** Three 112 px columns still fit a truncated name and a figure on a phone. */
export const MAX_LANES = 3;

/** Outlook's own gap between concurrent columns. */
export const LANE_GUTTER_PX = 2;

/** One `text-[10px]` line. Show pills closer than this collapse into one. */
export const SHOW_LABEL_MIN_GAP_PX = 14;

/**
 * The most show lines an axis may carry, however many the park runs.
 *
 * {@link SHOW_LABEL_MIN_GAP_PX} keeps two LABELS from overlapping and is a
 * statement about text; this is a statement about the drawing. Europa-Park on a
 * Sunday returns 33 shows, whose times land roughly every quarter hour — far
 * enough apart that nothing folded, so a nine-hour axis carried 28 dashed rules
 * and 28 centred pills, and the two blocks somebody had actually planned sat
 * behind them. Measured on that day at a 389 px column: the grid was 756 px and
 * every 27 px of it had a line in it.
 *
 * The cap is spent on the fold that already exists rather than on dropping
 * anything: the extra times keep their place inside the line they fold into and
 * are still counted in its "+n", which is what makes this a density limit and
 * not a promise the panel breaks. Twelve leaves ~60 px between lines on a
 * nine-hour day, which is two blocks' worth of room.
 */
export const MAX_SHOW_LINES = 12;

/**
 * Days of measurement below which a missing early hour says more about our
 * sampling than about the ride.
 */
export const SOFT_FLOOR_MIN_SAMPLE_DAYS = 30;

export interface DayGrid {
  /** Park-local minutes since midnight. */
  openMin: number;
  /**
   * The minute the park is known to be open until. May exceed 1440 on a
   * past-midnight close.
   *
   * A CEILING and not merely an axis end: nothing this app files by itself —
   * the optimiser, a click on a headliner pill, the ride search — may put a
   * block that runs past it. What the park does in the hour above it is
   * {@link closeSlackMin}.
   */
  closeMin: number;
  /**
   * How much later the park might really shut. See {@link CLOSE_SLACK_MIN}.
   *
   * Drawn as uncertain and reachable by a drag; never planned into.
   */
  closeSlackMin: number;
  gridStartMin: number;
  gridEndMin: number;
  heightPx: number;
  pxPerMin: number;
  /**
   * Whether {@link closeMin} is the hour the API rounded to rather than a real
   * closing minute — i.e. whether {@link closeSlackMin} is anything at all.
   * True until the backend sends minutes.
   */
  closeIsTruncated: boolean;
}

/**
 * The closing hour on the day's own axis, which is not always the clock's.
 *
 * `closeHour` is a wall-clock hour, so a park running 16:00–01:00 reports
 * `closeHour: 1` and every naive comparison against `openHour: 16` reads it as
 * a day that ends nine hours before it starts. Unfolded, that day closes in
 * hour 25, and the axis, the hour test in `estimate.ts` and anything else
 * asking "is this minute inside the day" all agree again.
 *
 * It lives here, exported, rather than inline in `buildDayGrid`, because the
 * one copy of the rule was the bug: the grid unfolded and `estimateFor` did
 * not, so every block of a past-midnight park was answered with
 * `outside-hours` — including the ones in the middle of the evening — and the
 * planner's totals came out as zero minutes of queueing for a whole night. Two
 * halves of one statement, in two files, with nothing comparing them.
 *
 * The hour the closing time FALLS IN, like the field it reads — not the last
 * hour the park is open. Phantasialand shuts at 18:00 and the API answers
 * `closeHour: 18`; Toverland shuts at 17:30 and answers 17. So the hour is the
 * park's own closing minute for the 86 % of days that end on the hour, and up
 * to 59 minutes early for the rest, which is what {@link CLOSE_SLACK_MIN} is
 * for. `buildDayGrid` used to add sixty minutes here on the opposite reading
 * and gave the planner an hour of park that does not exist.
 *
 * The bucket at `closeHour` that the backend emits is therefore an hour the
 * park is mostly shut for. `estimateFor` still answers for it on purpose — a
 * block a visitor drags there is worth a figure rather than an em dash, and on
 * a park closing at 17:30 that hour is half real. Nothing this app files by
 * itself goes there; see {@link DayGrid.closeMin}.
 */
export function unfoldedCloseHour(openHour: number, closeHour: number): number {
  return closeHour < openHour ? closeHour + 24 : closeHour;
}

/**
 * The day's axis, or `null` when the park's hours are unknown.
 *
 * `null` is the honest answer and the caller must handle it: inventing
 * 00:00–24:00 asserts a park that never closes, and inventing 09:00–18:00
 * invents a schedule. The panel falls back to its flat list there.
 */
export function buildDayGrid(
  openHour: number | null | undefined,
  closeHour: number | null | undefined,
  pxPerMin: number = PX_PER_MIN
): DayGrid | null {
  if (openHour === null || openHour === undefined) return null;
  if (closeHour === null || closeHour === undefined) return null;

  const openMin = openHour * 60;
  // `closeHour` is the hour the park's closing time falls in, so this IS the
  // closing minute wherever the park closes on the hour — and the earliest it
  // can close where it does not. A close past midnight is unfolded rather than
  // refused: the day is still a real span even where the API declines to answer
  // for it. See {@link unfoldedCloseHour} and {@link CLOSE_SLACK_MIN}.
  const closeMin = unfoldedCloseHour(openHour, closeHour) * 60;

  const gridStartMin = openMin - PRE_PAD_MIN;
  // The canvas is unchanged: it holds the slack the park might still be open
  // for AND the overrun of a queue joined at the end of it.
  const gridEndMin = closeMin + CLOSE_SLACK_MIN + POST_PAD_MIN;

  return {
    openMin,
    closeMin,
    closeSlackMin: CLOSE_SLACK_MIN,
    gridStartMin,
    gridEndMin,
    heightPx: (gridEndMin - gridStartMin) * pxPerMin,
    pxPerMin,
    closeIsTruncated: true,
  };
}

/**
 * The axis, widened until it contains the plan drawn on it.
 *
 * `buildDayGrid` answers a question about the PARK — when it opens, when it
 * shuts, plus half an hour either side for the arrival and for a queue joined
 * near closing. A plan is not bound by that. `clampStart` lets a block START up
 * to fifteen minutes before the park shuts, which for a sixty-minute free block
 * puts its foot forty-five minutes past `closeMin` against a canvas that ends
 * thirty past it; a hotel check-in written at 18:30 for an hour simply ran off
 * the bottom, drawn over the gutter label that says when the day ends.
 *
 * So the park's own hours stay exactly as they were — `openMin` and `closeMin`
 * are what the opening-hours band is drawn from, and moving them would be the
 * panel inventing a longer day — and only the CANVAS grows. The room that
 * appears is outside opening hours by construction, so it is hatched like every
 * other minute out there, which is the honest drawing of "you have planned
 * something for a time the park is shut".
 *
 * Rounded out to the full hour, for two reasons that happen to agree: the hour
 * ticks down the gutter stay whole numbers, and the axis then grows in steps a
 * reader notices once instead of by the minute while a block is being resized.
 *
 * Fed from the COMMITTED entries and never from a drag in flight. Growing the
 * canvas mid-gesture would move every other block under the pointer, because
 * `yFor` is measured from `gridStartMin` — the axis settles when the block
 * lands, which is also when the visitor can see what they did.
 */
export function growGridForSpans(
  grid: DayGrid | null,
  spans: readonly { startMinute: number; spanMinutes: number }[]
): DayGrid | null {
  if (!grid || spans.length === 0) return grid;

  let earliest = grid.gridStartMin;
  let latest = grid.gridEndMin;
  for (const span of spans) {
    if (!Number.isFinite(span.startMinute)) continue;
    const end = span.startMinute + Math.max(0, span.spanMinutes || 0);
    if (span.startMinute - PRE_PAD_MIN < earliest) earliest = span.startMinute - PRE_PAD_MIN;
    if (end + POST_PAD_MIN > latest) latest = end + POST_PAD_MIN;
  }

  // Rounded only where it actually moved. The base canvas already carries a
  // deliberate half-hour pad at each end — rounding that to the hour would add
  // thirty minutes of empty axis to every plan that fits comfortably.
  const gridStartMin =
    earliest < grid.gridStartMin ? Math.floor(earliest / 60) * 60 : grid.gridStartMin;
  const gridEndMin = latest > grid.gridEndMin ? Math.ceil(latest / 60) * 60 : grid.gridEndMin;
  if (gridStartMin === grid.gridStartMin && gridEndMin === grid.gridEndMin) return grid;

  return {
    ...grid,
    gridStartMin,
    gridEndMin,
    heightPx: (gridEndMin - gridStartMin) * grid.pxPerMin,
  };
}

/** Pixels from the canvas top for a park-local minute. */
export function yFor(grid: DayGrid, minute: number): number {
  return (minute - grid.gridStartMin) * grid.pxPerMin;
}

/** The exact inverse of {@link yFor}. This is the half of a drag that can be wrong without looking wrong. */
export function minuteAt(grid: DayGrid, y: number): number {
  return grid.gridStartMin + y / grid.pxPerMin;
}

/**
 * A duration in pixels.
 *
 * Takes minutes and NOT a start, which is the whole point: forty minutes is the
 * same height wherever it sits, and a future change that gives this function a
 * position would break the invariant loudly instead of quietly.
 */
export function heightFor(grid: DayGrid, minutes: number): number {
  return minutes * grid.pxPerMin;
}

/**
 * The floor under a block's box, on THIS axis.
 *
 * {@link MIN_BLOCK_PX} is 20 px at {@link PX_PER_MIN}, which is 16.7 minutes.
 * Scaling it by the axis keeps those minutes rather than those pixels, so a
 * phone's taller axis raises the floor with everything else instead of leaving
 * a 20 px box that now stands for eleven minutes.
 */
export function minBlockPxFor(grid: DayGrid): number {
  // `(MIN_BLOCK_PX * pxPerMin) / PX_PER_MIN`, in that order, and not the
  // `MIN_BLOCK_MIN * pxPerMin` the constant below reads as: the same value in
  // binary floating point comes out 30.000000000000004 one way round and 30 the
  // other, and this number is a pixel height a test compares exactly.
  return (MIN_BLOCK_PX * grid.pxPerMin) / PX_PER_MIN;
}

/** The drawn box: never below {@link minBlockPxFor}. The fill inside stays exact. */
export function blockBoxFor(grid: DayGrid, minutes: number): number {
  return Math.max(heightFor(grid, minutes), minBlockPxFor(grid));
}

export function snapTo(minute: number, step: number): number {
  return Math.round(minute / step) * step;
}

/**
 * Where a block a VISITOR places may start.
 *
 * The lower bound is the caller's floor (see {@link rideFloor}); the upper bound
 * is on the START, not the end — a 90-minute queue joined at 19:30 in a park
 * closing at 20:00 is a real plan that overruns, and forbidding it would be the
 * grid refusing to draw something a visitor may genuinely intend.
 *
 * The ceiling includes {@link DayGrid.closeSlackMin}, which is what keeps this
 * gesture exactly as far-reaching as it was before that field existed: the API
 * rounds the closing time down to the hour, the park may still be open up there,
 * and the person dragging knows which of those it is. `nextFreeStart` and the
 * optimiser stop at {@link DayGrid.closeMin} instead — the same hard/soft split
 * {@link rideFloor} makes at the other end of the day. What the app asserts by
 * itself is bounded by the fact; what it lets somebody assert is not.
 */
export function clampStart(grid: DayGrid, minute: number, floorMin: number): number {
  return Math.min(Math.max(minute, floorMin), latestStart(grid));
}

/**
 * {@link clampStart}'s ceiling as a number, for the two call sites that hand a
 * `maxMinute` to a block rather than clamping a value.
 *
 * Exported so the drag, the keyboard nudge and the clamp cannot drift: they
 * were three copies of `closeMin - SNAP_MIN_FINE`, and the slack made that
 * expression wrong in all three at once.
 */
export function latestStart(grid: DayGrid): number {
  return grid.closeMin + grid.closeSlackMin - SNAP_MIN_FINE;
}

export interface RideFloor {
  /** The drag stops here. A published fact, never a statistic. */
  hardMin: number;
  /** Advisory. Equal to `hardMin` unless there is a measured reason to raise it. */
  softMin: number;
  reason: 'park' | 'ride';
}

/**
 * `HH:mm` in the park's own clock, as minutes since midnight. `null` on
 * anything that is not that shape — the field is optional and comes from an
 * API, so a bad value must degrade to "not known" rather than to minute zero.
 */
export function opensAtMinute(opensAt: string | null | undefined): number | null {
  if (!opensAt) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(opensAt.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * How long after the gates open somebody can actually be queueing.
 *
 * Nobody is at a ride's entrance in the second the park opens: there is a
 * turnstile, a bag check and a walk — Phantasialand's gate to Klugheim is the
 * better part of a kilometre — and the planner filed the first ride of the day
 * at exactly `openMin`, which is a plan nobody has executed.
 *
 * The same family of judgement as `EXIT_MIN` and `SAME_LAND_CEIL_MIN` in
 * `leg.ts`, and named as one: an allowance, not a measurement. So it belongs to
 * the SOFT floor — where a block is filed — and never to the hard one, which is
 * for facts. `opensAt` is the fact, and it arrived; this is what is left over
 * for a ride that has none.
 */
export const GATE_TO_FIRST_RIDE_MIN = 15;

/**
 * The earliest minute a block may be FILED at today, and `openMin` on every
 * other date.
 *
 * The planner files a block at a minute it picks itself in four places — the
 * optimiser, a headliner pill, a ride-search row and a free block — and none of
 * them knew what time it was. Pressed at 14:00, all four still filed into the
 * morning: a queue nobody can join, on a day the visitor is standing in.
 *
 * It raises the SOFT floor and never the hard one (see {@link rideFloor}): a
 * drag into the recorded morning stays legal, because writing down when you
 * actually rode something is the reason a day is kept at all.
 *
 * **It is not capped at the end of the day, and that cap was the bug.** It used
 * to be clamped to `closeMin - SNAP_MIN_FINE` on the theory that a press made
 * after closing should still yield a usable minute — but the clamp beats the
 * very lower bound this function exists to impose, so at 17:58 in a park
 * shutting at 18:00 it answered **17:45**, and "plan every headliner" filed a
 * forty-minute queue thirteen minutes before the press. Worse, `hasStarted`
 * then read that block as already under way and froze it. Past the last slot
 * the honest answer is a minute the day has no room for, which is exactly what
 * every caller needs: `placementsFrom` finds no option and leaves the ride out,
 * `nextFreeStart` files into the hatched hours where a reader can see it.
 */
export function nowFloor(grid: DayGrid, clock?: DayClock): number {
  if (clock?.phase !== 'today') return grid.openMin;
  // Snapped UP, not to the nearest: every start in this app sits on a quarter
  // hour, and rounding 14:03 down to 14:00 would file a block three minutes
  // into a past nobody can act on.
  return Math.max(grid.openMin, Math.ceil(clock.nowMinute / SNAP_MIN_FINE) * SNAP_MIN_FINE);
}

/**
 * The two floors under a ride, and the difference between them is the point.
 *
 * The HARD floor is a FACT and is what a drag is clamped to: the ride's own
 * `opensAt` where the API has one, the park's published opening otherwise.
 * That field closed a real hole — Phantasialand's gates open at 09:00 and
 * sixteen of its rides do not run until 10:00, so the planner was offering two
 * hours of queue that did not exist, reported three times before there was any
 * data to prove it. It is rounded to the quarter hour upstream, because a raw
 * 10:10 is five-minute polling plus feed lag on a 10:00 opening.
 *
 * The SOFT floor is where a new block is FILED, and it carries two things the
 * hard floor may not. The first hour this ride has a curve for, which is a
 * statement about MEASUREMENT rather than about opening — the backend skips
 * hours with no observations, so a ride merely unobserved at 09:00 must not be
 * clamped as though it opened at 11:00, and entering that window costs the
 * block its figure rather than refusing the placement. And
 * {@link GATE_TO_FIRST_RIDE_MIN}, for the walk from the gates, which is a
 * judgement and therefore may not refuse anything either.
 *
 * The measurement gates are deliberate: at least a month of measured days, and
 * at least an hour past the floor, or a single quiet morning becomes a wall.
 *
 * The soft floor carries a third thing, and it is not about the ride: today's
 * clock, through {@link nowFloor}. A block filed before now is a queue nobody
 * can join. `clock` is optional and every other phase reduces to the expression
 * this function had before it existed.
 */
export function rideFloor(
  grid: DayGrid,
  ride: PlanDayRide | undefined | null,
  clock?: DayClock
): RideFloor {
  const opens = opensAtMinute(ride?.opensAt);
  const knowsOpening = opens !== null && opens > grid.openMin;
  const hardMin = Math.min(knowsOpening ? opens : grid.openMin, grid.closeMin - SNAP_MIN_FINE);

  const first = ride?.hours?.[0]?.hour;
  const measuredEnough = (ride?.sampleDays ?? 0) >= SOFT_FLOOR_MIN_SAMPLE_DAYS;
  const raised =
    ride && first !== undefined && measuredEnough && first * 60 >= hardMin + 60
      ? first * 60
      : hardMin;

  // The walk applies to a ride that opens WITH the park and to nothing else: a
  // ride whose own opening is later is already a statement about when somebody
  // can queue, and adding a turnstile to it would push the block past the first
  // hour anybody could ride it.
  const withEntry = knowsOpening ? raised : Math.max(raised, hardMin + GATE_TO_FIRST_RIDE_MIN);

  return {
    hardMin,
    // The RIDE's own reasons are capped at the last slot of the day — a curve
    // that starts after closing is a statement about measurement, not a plan —
    // and the clock is then allowed to raise it past that cap. At 17:58 in a
    // park shutting at 18:00 this is 18:00, which is no slot at all, which is
    // the true answer. See {@link nowFloor}.
    softMin: Math.max(Math.min(withEntry, grid.closeMin - SNAP_MIN_FINE), nowFloor(grid, clock)),
    reason: raised > hardMin || knowsOpening ? 'ride' : 'park',
  };
}

export interface LaneInput {
  id: string;
  topMin: number;
  /** Already includes the uncertainty band and the minimum box. */
  bottomMin: number;
}

export interface LanePlacement {
  column: number;
  columns: number;
  /** Blocks past {@link MAX_LANES} in this cluster, reported on the last column. */
  overflow: number;
}

/**
 * Which column each block sits in, Outlook-style.
 *
 * A cluster is a maximal transitively-overlapping run, and its width is the
 * cluster's peak concurrency — not its size. Three blocks where a overlaps b and
 * b overlaps c but a and c are disjoint make two columns, not three, which is
 * what stops a long day collapsing into slivers.
 *
 * The spans handed in are the DRAWN ones — fill plus band, floored at the
 * minimum box — because two blocks a reader sees touching must be laid out as
 * touching. Ties keep insertion order, which is the only stable ordering the
 * plan has.
 */
export function packLanes(blocks: readonly LaneInput[]): Map<string, LanePlacement> {
  const out = new Map<string, LanePlacement>();
  if (blocks.length === 0) return out;

  const sorted = blocks
    .map((block, index) => ({ block, index }))
    .sort((a, b) => a.block.topMin - b.block.topMin || a.index - b.index);

  let cluster: typeof sorted = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (cluster.length === 0) return;

    // Column assignment: the first column whose last block has ended.
    const columnEnds: number[] = [];
    const placed: { id: string; column: number }[] = [];
    let overflowCount = 0;

    for (const { block } of cluster) {
      let column = columnEnds.findIndex((end) => end <= block.topMin);
      if (column === -1) {
        if (columnEnds.length < MAX_LANES) {
          column = columnEnds.length;
          columnEnds.push(block.bottomMin);
        } else {
          // Past the lane budget: it rides in the last column and is counted.
          column = MAX_LANES - 1;
          overflowCount++;
          columnEnds[column] = Math.max(columnEnds[column], block.bottomMin);
        }
      } else {
        columnEnds[column] = block.bottomMin;
      }
      placed.push({ id: block.id, column });
    }

    const columns = Math.max(1, columnEnds.length);
    for (const { id, column } of placed) {
      out.set(id, { column, columns, overflow: 0 });
    }
    if (overflowCount > 0) {
      // Reported once, on the last block of the crowded column.
      const last = placed.filter((p) => p.column === MAX_LANES - 1).at(-1);
      if (last) out.set(last.id, { column: MAX_LANES - 1, columns, overflow: overflowCount });
    }

    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const entry of sorted) {
    if (cluster.length > 0 && entry.block.topMin >= clusterEnd) flush();
    cluster.push(entry);
    clusterEnd = Math.max(clusterEnd, entry.block.bottomMin);
  }
  flush();

  return out;
}

/**
 * Where a newly added ride goes.
 *
 * The earliest snapped minute at or after {@link floorMin} whose block would
 * overlap nothing already planned. The old rule — an hour after the last entry —
 * put five rides added from the search on one minute, because the search
 * bypassed it entirely and filed everything at the opening hour.
 *
 * `floorMin` defaults to the park's opening and is meant to be the RIDE's own
 * floor (`rideFloor().softMin`): a ride whose curve starts at 11:00 was being
 * filed at 09:00 with the park, which is the planner asserting a queue in an
 * hour nothing was ever measured in. Passing the park's opening for every ride
 * is what made "this ride is not even open yet" a thing the grid could say.
 *
 * The ceiling is {@link DayGrid.closeMin} and NOT the slack above it, unlike
 * {@link clampStart}: this is the app choosing a minute, and it may not choose
 * one in an hour the park has told us it is shut for.
 */
export function nextFreeStart(
  existing: readonly { startMinute: number; spanMinutes: number }[],
  grid: DayGrid,
  spanMinutes = 45,
  floorMin?: number
): number {
  const taken = existing
    .map((e) => ({ from: e.startMinute, to: e.startMinute + Math.max(e.spanMinutes, 15) }))
    .sort((a, b) => a.from - b.from);

  const floor = snapTo(Math.max(grid.openMin, floorMin ?? grid.openMin), SNAP_MIN_FINE);
  let candidate = floor;
  const last = grid.closeMin - SNAP_MIN_FINE;

  for (const slot of taken) {
    if (candidate + spanMinutes <= slot.from) break;
    if (candidate < slot.to) candidate = snapTo(slot.to + SNAP_MIN_FINE - 1, SNAP_MIN_FINE);
  }

  // The cap may not pull the answer BELOW the floor it was given. It used to,
  // and on a day whose slots are gone that meant filing into the past: pressed
  // at 17:58 in a park shutting at 18:00 the floor is 18:00 and the cap 17:45,
  // so a ride added from the search landed thirteen minutes before the tap. A
  // block in the hatched hours is a visible answer; a block behind the clock is
  // not an answer at all.
  return Math.max(floor, Math.min(candidate, last));
}

export interface ShowLinePosition {
  minute: number;
  y: number;
  /** Further showtimes this line stands for, because their labels would collide. */
  collapsedWith: number[];
}

/**
 * Show lines with labels closer than {@link SHOW_LABEL_MIN_GAP_PX} folded
 * together — and no more than {@link MAX_SHOW_LINES} of them, whatever that
 * takes.
 *
 * The gap widens rather than the tail being cut, so the park with 33 shows and
 * the park with four are drawn by one rule: a line always stands for every
 * showtime around it, and `collapsedWith` says how many. `heightPx / MAX` is
 * the gap that would leave exactly the cap on a full axis; the real count comes
 * out at or under it because folding is greedy from the top.
 */
export function showLinePositions(
  grid: DayGrid,
  showMinutes: readonly number[]
): ShowLinePosition[] {
  const sorted = [...new Set(showMinutes)].sort((a, b) => a - b);
  const gap =
    sorted.length > MAX_SHOW_LINES
      ? Math.max(SHOW_LABEL_MIN_GAP_PX, grid.heightPx / MAX_SHOW_LINES)
      : SHOW_LABEL_MIN_GAP_PX;
  const out: ShowLinePosition[] = [];

  for (const minute of sorted) {
    const y = yFor(grid, minute);
    const previous = out.at(-1);
    if (previous && y - previous.y < gap) {
      previous.collapsedWith.push(minute);
      continue;
    }
    out.push({ minute, y, collapsedWith: [] });
  }

  return out;
}
