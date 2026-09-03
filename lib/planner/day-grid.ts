import type { PlanDayRide } from '@/lib/api/types';

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
  // real span even where the API declines to answer for it.
  const closeMin = (closeHour < openHour ? closeHour + 24 : closeHour) * 60 + 60;

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
 * The two floors under a ride, and the difference between them is the point.
 *
 * The HARD floor is the park's published opening — a fact — because no per-ride
 * opening time exists in any payload today. When one does (`opensAtMinute` with
 * a measured confidence) it raises this line and nothing else changes. It is
 * what a DRAG is clamped to, so nothing here can refuse a placement a visitor
 * insists on.
 *
 * The SOFT floor also carries {@link GATE_TO_FIRST_RIDE_MIN} where the park's
 * own opening is all we have: it is where a new block is FILED, and filing the
 * first ride of the day at the exact minute the gates open plans a walk nobody
 * can make.
 *
 * The SOFT floor is the first hour this ride has a curve for, and it is a
 * statement about MEASUREMENT rather than about opening: the backend skips hours
 * with no observations, so a ride merely unobserved at 09:00 would otherwise be
 * clamped as though it opened at 11:00. It never stops a drag. Entering it costs
 * the block its figure, which is exactly what `estimateFor` already returns —
 * the truth, rather than a prohibition dressed as one.
 *
 * The gates are deliberate: at least a month of measured days, and at least an
 * hour past the park's own opening, or a single quiet morning becomes a wall.
 */
/**
 * How long after the gates open somebody can actually be queueing.
 *
 * Nobody is at a ride's entrance in the second the park opens. There is a
 * turnstile, a bag check and a walk — Phantasialand's gate to Klugheim is the
 * better part of a kilometre — and the planner was filing the first ride of the
 * day at exactly `openMin`, which is a plan no visitor has ever executed.
 *
 * The same family of judgement as `EXIT_MIN` and `SAME_LAND_CEIL_MIN` in
 * `leg.ts`, and named as one: an allowance, not a measurement. It is deliberately
 * NOT a claim that any ride is shut — no payload anywhere carries a per-ride
 * opening time, and for Phantasialand tomorrow `/plan/day` reports Taron with a
 * 30-minute queue in its 09:00 hour, so the data says the opposite. What this
 * says is where the VISITOR is, which is a different sentence.
 *
 * It moves the default placement only. Dragging a block onto the opening minute
 * is still allowed, because somebody who knows their park better than this
 * constant does must not be argued with.
 */
export const GATE_TO_FIRST_RIDE_MIN = 15;

export function rideFloor(grid: DayGrid, ride: PlanDayRide | undefined | null): RideFloor {
  const hardMin = grid.openMin;

  const first = ride?.hours?.[0]?.hour;
  const measuredEnough = (ride?.sampleDays ?? 0) >= SOFT_FLOOR_MIN_SAMPLE_DAYS;
  const raised =
    ride && first !== undefined && measuredEnough && first * 60 >= hardMin + 60
      ? first * 60
      : hardMin;

  // The gate allowance applies to the park's own opening, never on top of a
  // raised ride floor: a ride whose curve starts at 11:00 is already a statement
  // about being able to queue at 11:00, and adding a walk to it would push the
  // block past the first hour anybody could ride it.
  const withEntry = raised > hardMin ? raised : hardMin + GATE_TO_FIRST_RIDE_MIN;
  return {
    hardMin,
    softMin: Math.min(withEntry, grid.closeMin - SNAP_MIN_FINE),
    reason: raised > hardMin ? 'ride' : 'park',
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

/** Show lines with labels closer than {@link SHOW_LABEL_MIN_GAP_PX} folded together. */
export function showLinePositions(
  grid: DayGrid,
  showMinutes: readonly number[]
): ShowLinePosition[] {
  const sorted = [...new Set(showMinutes)].sort((a, b) => a - b);
  const out: ShowLinePosition[] = [];

  for (const minute of sorted) {
    const y = yFor(grid, minute);
    const previous = out.at(-1);
    if (previous && y - previous.y < SHOW_LABEL_MIN_GAP_PX) {
      previous.collapsedWith.push(minute);
      continue;
    }
    out.push({ minute, y, collapsedWith: [] });
  }

  return out;
}
