/**
 * Geometry for the weather card's hourly day chart (`WeatherHourlyChart`).
 *
 * The day axis is piecewise linear: an open hour is drawn {@link OPEN_HOUR_RATIO}× as wide as a
 * closed one, and the two kinks sit on the opening-hours band's dashed borders so the eye can
 * explain them. `buildDayScale` returns `null` (a linear axis) when there is no schedule, the park
 * is open around the clock, or the gain is too small.
 *
 * Everything works in a continuous index `s ∈ [0, n]` over the hourly points, not in hours since
 * midnight: on a DST changeover Open-Meteo returns 23 or 25 points. Column `i` spans `[i, i + 1]`
 * with its point at `i + 0.5`. All x values are viewBox percentages (0–100).
 * See docs/rules/weather-day-chart-is-built-around-the-parks-hours.md.
 */

/** How much wider an open hour is drawn than a closed one. */
export const OPEN_HOUR_RATIO = 4;
/** The opening hours never take more than this share of the axis. */
export const MAX_OPEN_SHARE = 0.8;
/** Width floor per closed hour, so a night hour stays a column and not a hairline. */
export const MIN_CLOSED_UNIT_PCT = 1.2;
/** Minimum share the warp has to win over a linear axis to be worth drawing. */
export const MIN_GAIN = 0.06;
/** Windows shorter than this leave too little curve to expand. */
export const MIN_OPEN_HOURS = 3;
/** Windows longer than this are close enough to a full day that a warp is noise. */
export const MAX_OPEN_HOURS = 21;

/** The piecewise-linear day scale: where the axis changes gear and the width per index unit. */
export interface DayScale {
  /**
   * Where the axis changes gear, at the column centre (`9 + 0.5` for 09:00) where the hour tick
   * sits, so the kink, the band border and the label line up.
   */
  sOpen: number;
  /** Same, for the closing instant. */
  sClose: number;
  /** viewBox % per index unit inside the opening hours. */
  openUnit: number;
  /** viewBox % per index unit outside them. */
  closedUnit: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Park-local hour of each hourly point, parsed from its naive "YYYY-MM-DDTHH:MM". */
export function hoursOf(points: { time: string }[]): number[] {
  return points.map((p) => parseInt(p.time.slice(11, 13), 10));
}

/**
 * Wall-clock minute of the day → continuous index into the hourly points. Monotone: on the autumn
 * changeover the later repeated hour wins, and a skipped spring hour maps onto the start of the
 * hour that replaced it.
 */
export function indexForMinute(hours: number[], minute: number): number {
  if (hours.length === 0) return 0;
  const m = clamp(minute, 0, 24 * 60);
  let i = 0;
  for (let k = 0; k < hours.length; k++) {
    if (hours[k] * 60 <= m) i = k;
    else break;
  }
  return i + clamp((m - hours[i] * 60) / 60, 0, 1);
}

/**
 * The piecewise-linear day scale, or `null` when the day should stay linear.
 *
 * `sOpen`/`sClose` are continuous indices (see {@link indexForMinute}); pass
 * `null` for either when today has no OPERATING schedule.
 */
export function buildDayScale(
  n: number,
  sOpen: number | null,
  sClose: number | null
): DayScale | null {
  if (sOpen == null || sClose == null || !(n > 0)) return null;

  const open = clamp(sOpen, 0, n);
  const close = clamp(sClose, 0, n);
  const openUnits = close - open;
  const closedUnits = n - openUnits;
  if (openUnits < MIN_OPEN_HOURS || openUnits > MAX_OPEN_HOURS || closedUnits <= 0) return null;

  const natural = openUnits / n;
  let share = (OPEN_HOUR_RATIO * openUnits) / (OPEN_HOUR_RATIO * openUnits + closedUnits);
  share = Math.min(share, MAX_OPEN_SHARE, 1 - (MIN_CLOSED_UNIT_PCT / 100) * closedUnits);
  // The caps can only pull `share` down and the floor is the linear share, so a warp never makes
  // the opening hours narrower.
  share = Math.max(share, natural);
  if (share - natural < MIN_GAIN) return null;

  return {
    sOpen: open,
    sClose: close,
    openUnit: (share * 100) / openUnits,
    closedUnit: ((1 - share) * 100) / closedUnits,
  };
}

/** Continuous index → viewBox %. Strictly monotone, `x(0) = 0`, `x(n) = 100`. */
export function makeXEdge(n: number, scale: DayScale | null): (s: number) => number {
  if (!scale || !(n > 0)) {
    return (s) => (clamp(s, 0, Math.max(n, 1)) / Math.max(n, 1)) * 100;
  }
  const { sOpen, sClose, openUnit, closedUnit } = scale;
  const atOpen = sOpen * closedUnit;
  const atClose = atOpen + (sClose - sOpen) * openUnit;
  return (s) => {
    const t = clamp(s, 0, n);
    if (t <= sOpen) return t * closedUnit;
    if (t <= sClose) return atOpen + (t - sOpen) * openUnit;
    return atClose + (t - sClose) * closedUnit;
  };
}

/** What an axis tick marks: an ordinary hour, or the opening or closing time. */
export type AxisTickKind = 'hour' | 'open' | 'close';

/** One tick on the hour axis, with the density tier it belongs to. */
export interface AxisTick {
  /** Hourly point whose weather icon and hour label the tick shows. */
  index: number;
  x: number;
  kind: AxisTickKind;
  /** 0 = always drawn, 1 = only once the chart itself is wide enough. */
  tier: 0 | 1;
}

/**
 * Centre-to-centre room two hour labels need, in viewBox %, sized for the widest locale label
 * (German „14 Uhr") on a phone-width plot.
 */
export const TICK_GAP_BASE = 10.5;
/** Same, once the chart is at least {@link TICK_WIDE_MIN_PX} wide. */
export const TICK_GAP_WIDE = 6.5;
/** Where the second tier of ticks switches on — a container query, not a viewport one. */
export const TICK_WIDE_MIN_PX = 440;
/** Room a plain hour label needs, as a multiple of the tier's budget. */
export const HOUR_LABEL_WEIGHT = 1;
/** An opening/closing time that spells out minutes ("9:30 AM") needs about a third more. */
export const TIME_LABEL_WEIGHT = 1.3;
/** Hour ticks on a linear day. */
export const LINEAR_TICK_STEP = 3;

const STEP_LADDER = [1, 2, 3, 4, 6];

/** Smallest hour step whose spacing still clears `gap`. */
function stepFor(unitPct: number, gap: number): number {
  return STEP_LADDER.find((step) => step * unitPct >= gap) ?? 6;
}

/** An opening or closing tick passed into {@link buildAxisTicks}. */
export interface AxisEdgeTick {
  kind: 'open' | 'close';
  x: number;
  /** Hourly point whose hour the tick sits in. */
  index: number;
  /**
   * Label width: {@link HOUR_LABEL_WEIGHT} for a time on the hour, {@link TIME_LABEL_WEIGHT} for
   * one with minutes („9:30 AM"). Most parks open on the hour, and charging all of them for the
   * long form costs an hour tick that fitted.
   */
  weight: number;
}

/** Input to {@link buildAxisTicks}. */
export interface AxisTickParams {
  hours: number[];
  /** x of the hourly point at index `i` (its column centre). */
  xForIndex: (index: number) => number;
  scale: DayScale | null;
  /** Opening/closing ticks. Empty when today has no window. */
  edges: AxisEdgeTick[];
}

/**
 * Which hours get a tick, at two densities. Both tiers are in the DOM and CSS picks one, so the
 * row's height never depends on the viewport. On a linear day this is every third hour.
 */
export function buildAxisTicks({ hours, xForIndex, scale, edges }: AxisTickParams): AxisTick[] {
  if (!scale) {
    return hours
      .map((hour, index) => ({
        index,
        x: xForIndex(index),
        kind: 'hour' as const,
        tier: 0 as const,
      }))
      .filter((_, index) => hours[index] % LINEAR_TICK_STEP === 0);
  }

  const accepted: (AxisTick & { weight: number })[] = [];
  // Two ticks must clear half of each label. The clearance scales with the tier being filled, not
  // the stricter one a tick was accepted at, or the wide tier would have nothing left to add.
  const accept = (tick: AxisTick, tierGap: number, weight: number) => {
    const room = (other: (typeof accepted)[number]) => (tierGap * (weight + other.weight)) / 2;
    if (accepted.some((other) => Math.abs(other.x - tick.x) < room(other))) return;
    accepted.push({ ...tick, weight });
  };

  // Opening first: it anchors the expanded region, so it outranks every hour.
  for (const edge of edges) {
    accept({ index: edge.index, x: edge.x, kind: edge.kind, tier: 0 }, TICK_GAP_BASE, edge.weight);
  }

  const inWindow = (index: number) => index + 0.5 >= scale.sOpen && index + 0.5 <= scale.sClose;
  // In-window ticks phase on the first open hour („n hours into the visit"); the compressed ones
  // phase on midnight, so 00:00 always ticks.
  const firstOpenIndex = Math.min(
    Math.max(Math.ceil(scale.sOpen - 0.5), 0),
    Math.max(hours.length - 1, 0)
  );
  const firstOpenHour = hours[firstOpenIndex] ?? 0;

  // Inside the window a step keeps labels on round hours. Outside it every hour is a candidate,
  // because a step would round away the one label a short compressed segment has room for.
  const passes: { tier: 0 | 1; open: boolean; step: number; gap: number }[] = [
    { tier: 0, open: true, step: stepFor(scale.openUnit, TICK_GAP_BASE), gap: TICK_GAP_BASE },
    { tier: 0, open: false, step: 1, gap: TICK_GAP_BASE },
    { tier: 1, open: true, step: stepFor(scale.openUnit, TICK_GAP_WIDE), gap: TICK_GAP_WIDE },
    { tier: 1, open: false, step: 1, gap: TICK_GAP_WIDE },
  ];

  for (const pass of passes) {
    for (let index = 0; index < hours.length; index++) {
      if (inWindow(index) !== pass.open) continue;
      const phase = pass.open ? hours[index] - firstOpenHour : hours[index];
      if (((phase % pass.step) + pass.step) % pass.step !== 0) continue;
      accept(
        { index, x: xForIndex(index), kind: 'hour', tier: pass.tier },
        pass.gap,
        HOUR_LABEL_WEIGHT
      );
    }
  }

  return accepted
    .map(({ index, x, kind, tier }) => ({ index, x, kind, tier }))
    .sort((a, b) => a.x - b.x);
}

/** An extra temperature label inside the opening hours, with its density tier. */
export interface ExtraTempLabel {
  index: number;
  tier: 0 | 1;
}

/** Horizontal room a temperature label needs, in viewBox %. */
export const EXTRA_LABEL_GAP = 9;
/**
 * Within this many gaps of an existing label, a new one must also show a different value: „32°"
 * a short way from „33°" adds no fact. Further out the same number is fine.
 */
export const EXTRA_LABEL_VALUE_GAPS = 3;
/** How many extra labels a narrow chart carries. */
export const EXTRA_LABEL_BASE_MAX = 3;
/** Hard cap including the ones only a wide chart shows. */
export const EXTRA_LABEL_MAX = 5;
/** A swing smaller than this is not worth a number, whatever the day's range. */
export const EXTRA_TOL_MIN_K = 1.5;
/** …and on a swingy day the bar rises with the range rather than staying absolute. */
export const EXTRA_TOL_SPAN_SHARE = 0.18;

/** A temperature label already on the chart. */
export interface PlacedLabel {
  x: number;
  value: number;
}

/** Input to {@link pickExtraTemperatureLabels}. */
export interface ExtraTempParams {
  /** Point indices inside the opening hours, ascending, all with a temperature. */
  candidates: number[];
  temps: (number | null)[];
  /** x per point index. */
  xs: number[];
  /** The labels the chart already draws (the day's min and max). */
  placed: PlacedLabel[];
}

/**
 * The handful of extra temperatures worth printing inside the opening hours.
 * Arrival and departure come first (Douglas-Peucker can never pick the endpoints), then the hour
 * furthest from the polyline through those already labelled, until the deviation drops under a
 * tolerance scaled to the day's range; a steadily warming day gets only its two ends. Independent
 * of the current time, so the set does not reshuffle every minute.
 */
export function pickExtraTemperatureLabels({
  candidates,
  temps,
  xs,
  placed,
}: ExtraTempParams): ExtraTempLabel[] {
  if (candidates.length < 3) return [];

  const values = candidates.map((i) => temps[i] as number);
  const span = Math.max(...values) - Math.min(...values);
  const tolerance = Math.max(EXTRA_TOL_MIN_K, EXTRA_TOL_SPAN_SHARE * span);

  const placedLabels = [...placed];
  const picked: number[] = [];
  const free = (index: number) => {
    const x = xs[index];
    const value = temps[index] as number;
    return placedLabels.every((other) => {
      const distance = Math.abs(other.x - x);
      if (distance < EXTRA_LABEL_GAP) return false;
      if (distance >= EXTRA_LABEL_VALUE_GAPS * EXTRA_LABEL_GAP) return true;
      return Math.abs(other.value - value) >= tolerance;
    });
  };
  const take = (index: number) => {
    picked.push(index);
    placedLabels.push({ x: xs[index], value: temps[index] as number });
  };

  const opening = candidates[0];
  if (free(opening)) take(opening);
  const closing = candidates[candidates.length - 1];
  if (free(closing)) take(closing);

  // Grown even by hours that end up unlabelled, so later rounds measure against the shape the
  // reader can infer.
  const polyline = [0, candidates.length - 1];
  while (picked.length < EXTRA_LABEL_MAX) {
    let best = -1;
    let bestDev = 0;
    for (let k = 1; k < candidates.length - 1; k++) {
      if (polyline.includes(k)) continue;
      let lo = 0;
      let hi = candidates.length - 1;
      for (const p of polyline) {
        if (p < k && p > lo) lo = p;
        if (p > k && p < hi) hi = p;
      }
      const xa = xs[candidates[lo]];
      const xb = xs[candidates[hi]];
      const chord =
        xb === xa
          ? values[lo]
          : values[lo] + ((values[hi] - values[lo]) * (xs[candidates[k]] - xa)) / (xb - xa);
      const dev = Math.abs(values[k] - chord);
      if (dev > bestDev) {
        bestDev = dev;
        best = k;
      }
    }
    if (best < 0 || bestDev < tolerance) break;
    polyline.push(best);
    polyline.sort((a, b) => a - b);
    if (free(candidates[best])) take(candidates[best]);
  }

  return picked
    .map((index, order) => ({ index, tier: (order < EXTRA_LABEL_BASE_MAX ? 0 : 1) as 0 | 1 }))
    .sort((a, b) => a.index - b.index);
}

/** A run of consecutive wet hours, `[from, to)` in point indices. */
export interface RainRun {
  from: number;
  /** One past the last. */
  to: number;
  totalMm: number;
}

/** mm in an hour slot that counts as rain outright. */
export const RAIN_RUN_MM = 0.2;
/** …and the lighter amount that still counts when the forecast is confident. */
export const RAIN_RUN_LIGHT_MM = 0.1;
/** Minimum precipitation probability (%) for the lighter amount to count. */
export const RAIN_RUN_PROB = 70;
/** Drawing more than this many turns the baseline into a dotted line. */
export const MAX_RAIN_RUNS = 2;

/**
 * The longest wet stretches of the day (two hours or more), as index ranges. Under the warp a
 * night hour is a few pixels wide and drizzle bars read as noise; one rule under the run says „it
 * rains all morning" at any width, and on a phone where tooltips never open.
 */
export function findRainRuns(mm: (number | null)[], probability: (number | null)[]): RainRun[] {
  const wet = (i: number) => {
    const amount = mm[i] ?? 0;
    return (
      amount >= RAIN_RUN_MM ||
      (amount >= RAIN_RUN_LIGHT_MM && (probability[i] ?? 0) >= RAIN_RUN_PROB)
    );
  };

  const runs: RainRun[] = [];
  let start = -1;
  for (let i = 0; i <= mm.length; i++) {
    if (i < mm.length && wet(i)) {
      if (start < 0) start = i;
      continue;
    }
    if (start >= 0 && i - start >= 2) {
      let total = 0;
      for (let k = start; k < i; k++) total += mm[k] ?? 0;
      runs.push({ from: start, to: i, totalMm: total });
    }
    start = -1;
  }

  return runs
    .sort((a, b) => b.totalMm - a.totalMm)
    .slice(0, MAX_RAIN_RUNS)
    .sort((a, b) => a.from - b.from);
}
