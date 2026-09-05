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
 * comfortably above touch tolerance. It is identical at every breakpoint on
 * purpose. Squeezing the phone would make it the one place a ten-minute gap is
 * invisible, which is the opposite of what this view is for — and deriving it
 * from a container's height would be a measurement arriving after paint, i.e. a
 * resize of the whole grid on every open.
 */
export const PX_PER_MIN = 1.2;

/** Arrival and rope drop happen before opening, so the axis starts before it. */
export const PRE_PAD_MIN = 30;

/**
 * A queue joined near closing overruns it. The pad is where the overrun is
 * drawn, rather than being clipped into a claim that the day ends on time.
 */
export const POST_PAD_MIN = 30;

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
 */
export const MIN_BLOCK_PX = 20;

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
  /** Exclusive end of the operating day. May exceed 1440 on a past-midnight close. */
  closeMin: number;
  gridStartMin: number;
  gridEndMin: number;
  heightPx: number;
  pxPerMin: number;
  /**
   * The API formats hours as `"HH"`, so a park closing at 23:30 reports 23. True
   * until the backend sends a real minute; the band draws its last hour as
   * uncertain while it holds.
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
 * Still INCLUSIVE, like the field it reads: the backend loops `h <= closeHour`
 * and emits a bucket at it. Callers that want an exclusive end add the hour
 * themselves, which is what `buildDayGrid`'s `+ 60` is.
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
  // `closeHour` is INCLUSIVE: the backend loops `h <= closeHour` and emits a
  // bucket AT it, so the axis has to contain that hour rather than end on it.
  // A close past midnight is unfolded rather than refused — the day is still a
  // real span even where the API declines to answer for it. See
  // {@link unfoldedCloseHour}.
  const closeMin = unfoldedCloseHour(openHour, closeHour) * 60 + 60;

  const gridStartMin = openMin - PRE_PAD_MIN;
  const gridEndMin = closeMin + POST_PAD_MIN;

  return {
    openMin,
    closeMin,
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

/** The drawn box: never below {@link MIN_BLOCK_PX}. The fill inside stays exact. */
export function blockBoxFor(grid: DayGrid, minutes: number): number {
  return Math.max(heightFor(grid, minutes), MIN_BLOCK_PX);
}

export function snapTo(minute: number, step: number): number {
  return Math.round(minute / step) * step;
}

/**
 * Where a block may start.
 *
 * The lower bound is the caller's floor (see {@link rideFloor}); the upper bound
 * is on the START, not the end — a 90-minute queue joined at 19:30 in a park
 * closing at 20:00 is a real plan that overruns, and forbidding it would be the
 * grid refusing to draw something a visitor may genuinely intend.
 */
export function clampStart(grid: DayGrid, minute: number, floorMin: number): number {
  return Math.min(Math.max(minute, floorMin), grid.closeMin - SNAP_MIN_FINE);
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
 */
export function nowFloor(grid: DayGrid, clock?: DayClock): number {
  if (clock?.phase !== 'today') return grid.openMin;
  // Snapped UP, not to the nearest: every start in this app sits on a quarter
  // hour, and rounding 14:03 down to 14:00 would file a block three minutes
  // into a past nobody can act on. Capped like the floors below it, so a press
  // made after closing still yields a minute rather than an impossible one.
  return Math.min(
    Math.max(grid.openMin, Math.ceil(clock.nowMinute / SNAP_MIN_FINE) * SNAP_MIN_FINE),
    grid.closeMin - SNAP_MIN_FINE
  );
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
    softMin: Math.min(Math.max(withEntry, nowFloor(grid, clock)), grid.closeMin - SNAP_MIN_FINE),
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

  let candidate = snapTo(Math.max(grid.openMin, floorMin ?? grid.openMin), SNAP_MIN_FINE);
  const last = grid.closeMin - SNAP_MIN_FINE;

  for (const slot of taken) {
    if (candidate + spanMinutes <= slot.from) break;
    if (candidate < slot.to) candidate = snapTo(slot.to + SNAP_MIN_FINE - 1, SNAP_MIN_FINE);
  }

  return Math.min(candidate, last);
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
