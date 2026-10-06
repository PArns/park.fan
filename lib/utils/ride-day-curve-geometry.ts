/**
 * Geometry for the ride day curve (`components/parks/ride-day-curve.tsx`) and the quiet windows
 * the card marks on it. Pure so `pnpm test:ride-day-curve` can run it: a chart's maths can be
 * wrong without looking wrong.
 *
 * Everything works in PARK-LOCAL HOURS, the units `/stats/hourly` answers in, never in an index:
 * `hours` may start at 11 and it may skip.
 */

/** viewBox width of the plot. */
export const VIEW_W = 720;
/**
 * viewBox height. The y axis starts at zero, so a ride running 28–46 minutes uses only the top
 * half of the plot; a taller box left a large empty rectangle in the card.
 */
export const VIEW_H = 200;
/** Left inner padding of the plot, in viewBox units. */
export const PAD_L = 8;
/** Right inner padding. */
export const PAD_R = 8;
/** Top inner padding. */
export const PAD_T = 12;
/** Bottom inner padding. */
export const PAD_B = 8;

/**
 * A quiet hour sits at or under `min + QUIET_BAND × (max − min)` of the ride's OWN day.
 * Relative to the ride, because 25 minutes is quiet on a headliner and peak on a carousel; and
 * against the range rather than the peak, because most days never drop toward zero and a
 * share-of-peak threshold then marks nothing.
 */
export const QUIET_BAND = 0.35;

/**
 * How much a day has to move, as a share of its peak, before „quiet" means anything. A ride at 30
 * minutes all day has a flat day, not a quiet window.
 */
export const MIN_RANGE_SHARE = 0.15;

/** Round a max up to a friendly gridline so the axis labels are readable numbers. */
export function niceMax(value: number): number {
  if (value <= 20) return 20;
  if (value <= 50) return 50;
  if (value <= 100) return 100;
  return Math.ceil(value / 50) * 50;
}

/**
 * Horizontal guide values for the plot, top first. The divisor is the first of 5, 4, 3, 2 whose
 * step is a multiple of five, because 12.5 / 25 / 37.5 reads worse than no guides;
 * {@link niceMax}'s values always allow one.
 */
export function gridValues(yMax: number): number[] {
  const divisor = [5, 4, 3, 2].find((n) => {
    const step = yMax / n;
    return step >= 5 && step % 5 === 0;
  });
  if (!divisor) return [yMax, yMax / 2];
  const step = yMax / divisor;
  return Array.from({ length: divisor }, (_, i) => yMax - i * step);
}

/**
 * The plot's scales. `yMax` is clamped to at least 1 so a ride that is a walk-on all day does not
 * divide by zero and write `NaN` into every path.
 */
export function makeScales(hours: number[], yMax: number) {
  const firstHour = hours[0];
  const lastHour = hours[hours.length - 1];
  const span = lastHour - firstHour || 1;
  const safeMax = yMax > 0 ? yMax : 1;
  return {
    firstHour,
    lastHour,
    x: (hour: number) => PAD_L + ((hour - firstHour) / span) * (VIEW_W - PAD_L - PAD_R),
    y: (value: number) => PAD_T + (1 - value / safeMax) * (VIEW_H - PAD_T - PAD_B),
  };
}

/**
 * Which hours get a tick: the two ends, plus every third hour between them. The ends are excluded
 * from the middle pass so the last hour cannot tick twice (a duplicate React key).
 */
export function axisHours(hours: number[]): number[] {
  if (hours.length < 2) return hours.slice();
  const first = hours[0];
  const last = hours[hours.length - 1];
  return [first, ...hours.filter((h) => h !== first && h !== last && (h - first) % 3 === 0), last];
}

/**
 * Monotone cubic interpolation (Fritsch–Carlson): one tangent per point. Used instead of
 * Catmull-Rom because a natural spline overshoots, and a curve rising to 49 where nothing measured
 * over 46 draws a wait that did not happen.
 */
function monotoneTangents(xs: number[], ys: number[]): number[] {
  const n = xs.length;
  if (n < 2) return new Array(n).fill(0);

  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    slopes.push(dx === 0 ? 0 : (ys[i + 1] - ys[i]) / dx);
  }

  const m: number[] = new Array(n);
  m[0] = slopes[0];
  m[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    // A local extremum gets a flat tangent, which keeps the curve from sailing past it.
    m[i] = slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  }

  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slopes[i];
    const b = m[i + 1] / slopes[i];
    const h = Math.hypot(a, b);
    if (h > 3) {
      m[i] = (3 / h) * a * slopes[i];
      m[i + 1] = (3 / h) * b * slopes[i];
    }
  }
  return m;
}

/**
 * One contiguous run of points as a smooth cubic path segment. A queue does not turn corners on
 * the hour, and the monotone interpolation never invents a value outside the measured range.
 */
export function smoothSegment(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return '';
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const m = monotoneTangents(xs, ys);

  let d = `M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const h = xs[i + 1] - xs[i];
    const c1x = xs[i] + h / 3;
    const c1y = ys[i] + (m[i] * h) / 3;
    const c2x = xs[i + 1] - h / 3;
    const c2y = ys[i + 1] - (m[i + 1] * h) / 3;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${xs[i + 1].toFixed(1)},${ys[i + 1].toFixed(1)}`;
  }
  return d;
}

/** Split a positional series into the contiguous runs that actually have values. */
export function runsOf(
  hours: number[],
  series: Array<number | null>
): Array<Array<{ hour: number; value: number }>> {
  const runs: Array<Array<{ hour: number; value: number }>> = [];
  let run: Array<{ hour: number; value: number }> = [];
  series.forEach((value, i) => {
    if (value == null || hours[i] == null) {
      if (run.length) runs.push(run);
      run = [];
      return;
    }
    run.push({ hour: hours[i], value });
  });
  if (run.length) runs.push(run);
  return runs;
}

/**
 * A positional series as an SVG path, broken at every gap. `null` means the ride reported nothing
 * that hour; a line across the hole would be an invented measurement.
 */
export function linePath(
  hours: number[],
  series: Array<number | null>,
  x: (h: number) => number,
  y: (v: number) => number
): string {
  return runsOf(hours, series)
    .map((run) => smoothSegment(run.map((p) => ({ x: x(p.hour), y: y(p.value) }))))
    .filter(Boolean)
    .join(' ');
}

/**
 * The filled spread band, one closed subpath per contiguous run, so the polygon never closes
 * across a gap. A run under two points has no area and is dropped.
 */
export function bandPath(
  hours: number[],
  lower: Array<number | null>,
  upper: Array<number | null>,
  x: (h: number) => number,
  y: (v: number) => number
): string {
  // Both edges use the median line's interpolation, or the fill would part from the curve.
  const paired: Array<number | null> = hours.map((_, i) =>
    upper[i] == null || lower[i] == null ? null : 1
  );
  let d = '';
  for (const run of runsOf(hours, paired)) {
    if (run.length < 2) continue;
    const idx = run.map((p) => hours.indexOf(p.hour));
    const top = smoothSegment(idx.map((i) => ({ x: x(hours[i]), y: y(upper[i] as number) })));
    const bottomPts = [...idx].reverse().map((i) => ({ x: x(hours[i]), y: y(lower[i] as number) }));
    const bottom = smoothSegment(bottomPts);
    if (!top || !bottom) continue;
    // The bottom edge's leading `M` becomes an `L`: one closed subpath, not two open ones.
    d += `${top}L${bottom.slice(1)}Z `;
  }
  return d.trim();
}

/** A quiet run at the start or end of the ride's day. */
export interface QuietWindow {
  /** Park-local hour the window opens at. */
  fromHour: number;
  /** The last quiet hour plus one, clamped to the day. */
  toHour: number;
  /** Mean of the median curve across the window, for the caller to round and label. */
  averageWait: number;
  which: 'opening' | 'closing';
}

/**
 * The quiet run the day opens with and the one it ends with, derived from the median curve rather
 * than the API's `ropeDrop` so a window cannot contradict the line it sits on. Either can be
 * absent; the two never overlap.
 */
export function quietWindows(hours: number[], p50: Array<number | null>): QuietWindow[] {
  const known = p50
    .map((v, i) => ({ hour: hours[i], value: v }))
    .filter((e): e is { hour: number; value: number } => e.value != null && e.hour != null);
  if (known.length < 3) return [];

  const values = known.map((e) => e.value);
  const peak = Math.max(...values);
  const floor = Math.min(...values);
  if (peak <= 0) return [];
  if ((peak - floor) / peak < MIN_RANGE_SHARE) return [];
  const threshold = floor + QUIET_BAND * (peak - floor);
  const quiet = (v: number) => v <= threshold;
  const lastHour = hours[hours.length - 1];
  const mean = (slice: { value: number }[]) =>
    slice.reduce((sum, e) => sum + e.value, 0) / slice.length;

  const windows: QuietWindow[] = [];

  let lead = 0;
  while (lead < known.length && quiet(known[lead].value)) lead++;
  // One hour is enough at the edges: rope drop is often a single hour. A flat day was rejected
  // above, and only a run touching the first or last hour reaches this. A ride quiet at every hour
  // has no distinguishing window.
  if (lead >= 1 && lead < known.length) {
    const slice = known.slice(0, lead);
    windows.push({
      fromHour: slice[0].hour,
      toHour: Math.min(lastHour, slice[slice.length - 1].hour + 1),
      averageWait: mean(slice),
      which: 'opening',
    });
  }

  let tail = known.length - 1;
  while (tail >= 0 && quiet(known[tail].value)) tail--;
  const tailStart = tail + 1;
  if (tail >= 0 && known.length - tailStart >= 1 && tailStart > lead) {
    const slice = known.slice(tailStart);
    const from = slice[0].hour;
    windows.push({
      fromHour: from,
      // At least one hour wide: the closing run ends on the last hour, so the `lastHour` clamp
      // alone would collapse it to „22:00–22:00".
      toHour: Math.max(from + 1, Math.min(lastHour, slice[slice.length - 1].hour + 1)),
      averageWait: mean(slice),
      which: 'closing',
    });
  }

  return windows;
}

/** The ride's busiest measured hour, for the chart's screen-reader summary. */
export function peakOf(
  hours: number[],
  p50: Array<number | null>
): { hour: number; value: number } | null {
  return p50.reduce<{ hour: number; value: number } | null>((best, v, i) => {
    if (v == null || hours[i] == null) return best;
    return best == null || v > best.value ? { hour: hours[i], value: v } : best;
  }, null);
}
