/**
 * Geometry for the ride day curve (`components/parks/ride-day-curve.tsx`) and
 * for the quiet windows the card marks on it.
 *
 * Pure and out of the component for the reason the weather day chart's axis is:
 * a chart's maths is the part that can be wrong without looking wrong, and the
 * only way to find that out is to run it. Two real bugs shipped in the first
 * draft of this chart and both are now pinned below — an axis whose labels were
 * spaced evenly while the plot placed hours linearly, and a band that could
 * close its polygon across a gap.
 *
 * Everything here works in PARK-LOCAL HOURS, the same units `/stats/hourly`
 * answers in, and never in an index: `hours` may start at 11 and it may skip.
 *
 * Run: pnpm test:ride-day-curve
 */

export const VIEW_W = 720;
/**
 * 720×200 rather than 720×260.
 *
 * The y axis starts at zero, which is right for a magnitude, but it means a ride
 * whose day runs 28–46 minutes on a 0–50 axis only ever uses the top half of the
 * plot. At the taller ratio the other half was a large empty rectangle inside
 * the card. 3.6 : 1 is the mock's own proportion and gives the curve the room it
 * deserves without truncating the scale to fake a steeper day.
 */
export const VIEW_H = 200;
export const PAD_L = 8;
export const PAD_R = 8;
export const PAD_T = 12;
export const PAD_B = 8;

/**
 * A quiet hour is one sitting in the lowest part of the ride's OWN daily range:
 * at or under `min + QUIET_BAND × (max − min)`.
 *
 * Relative to the ride, never an absolute number of minutes — 25 minutes is a
 * quiet hour on a headliner and the busiest hour of the day on a carousel.
 *
 * Against the RANGE rather than against the peak, which is the correction that
 * matters on real data. A share-of-peak threshold assumes the day drops towards
 * zero, and most rides' days do not: Voltron Nevera runs 28–46 minutes, so 55 %
 * of its 46-minute peak is 25 and NOTHING in its day qualified — a chapter
 * headed "two perfect windows" drew a curve with neither marked. Measuring from
 * the day's own floor finds the morning and the evening on a flat day and a
 * peaky one alike.
 */
export const QUIET_BAND = 0.35;

/**
 * How much a day has to move before "quiet" means anything.
 *
 * A ride that sits at 30 minutes from open to close has no quiet window — it has
 * a flat day — and marking one would point at an hour no better than its
 * neighbours. Expressed against the peak so it scales with the ride.
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
 * The plot's scales.
 *
 * `yMax` is clamped to at least 1 so a ride whose every reading is zero (a
 * walk-on all day, which the catalogue does contain) scales instead of dividing
 * by zero and writing `NaN` into every path.
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
 * Which hours get a tick.
 *
 * Always the two ends, plus every third hour between them. The ends are added
 * explicitly and excluded from the middle pass, so a day whose length is a
 * multiple of three does not tick its last hour twice — a duplicate here is a
 * duplicate React key and two labels stacked on one pixel column.
 */
export function axisHours(hours: number[]): number[] {
  if (hours.length < 2) return hours.slice();
  const first = hours[0];
  const last = hours[hours.length - 1];
  return [first, ...hours.filter((h) => h !== first && h !== last && (h - first) % 3 === 0), last];
}

/**
 * Monotone cubic interpolation (Fritsch–Carlson) through a set of points.
 *
 * Returns one tangent per point. The whole reason for this variant rather than a
 * plain Catmull-Rom is OVERSHOOT: a natural spline through 29, 44, 46 bulges
 * above 46 between the last two, and this chart's y axis is minutes of queue —
 * a curve that rises to 49 where nothing ever measured more than 46 is drawing a
 * wait time that did not happen. Fritsch–Carlson clamps the tangents so the
 * interpolant stays monotone on every segment the data is monotone on, which
 * means the curve can round a corner but can never leave the interval its two
 * neighbours define.
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
    // A local extremum gets a flat tangent — that is what keeps the curve from
    // sailing past a peak or a trough.
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
 * One contiguous run of points as a smooth cubic path segment.
 *
 * Emitted as `C` curves rather than `L` lines because a queue does not turn
 * corners on the hour: the readings are hourly samples of something continuous,
 * and a polyline draws the sampling grid as if it were the shape. The
 * interpolation is monotone (see {@link monotoneTangents}), so rounding the
 * corners never invents a value outside the measured range.
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
 * A positional series as an SVG path, broken at every gap.
 *
 * `null` is "the ride reported nothing in that hour", which is not a zero and is
 * not a value to interpolate across: a straight line over the hole is an
 * invented measurement.
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
 * The filled spread band, one closed subpath per contiguous run.
 *
 * A run of fewer than two points is dropped rather than drawn: a one-hour
 * island has no area, and emitting it produced a degenerate `M…L…Z` that some
 * renderers show as a hairline spike. Flushing per run is what stops the
 * polygon closing straight across a gap and claiming a spread nothing measured.
 */
export function bandPath(
  hours: number[],
  lower: Array<number | null>,
  upper: Array<number | null>,
  x: (h: number) => number,
  y: (v: number) => number
): string {
  // Both edges are smoothed with the same interpolation as the median line, or
  // the fill would part company with the curve it is supposed to wrap.
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
    // The bottom edge is appended as a curve of its own, so its leading `M`
    // becomes an `L`: one closed subpath, not two open ones.
    d += `${top}L${bottom.slice(1)}Z `;
  }
  return d.trim();
}

export interface QuietWindow {
  /** Park-local hour the window opens at. */
  fromHour: number;
  /** Park-local hour it closes at — the last quiet hour plus one, clamped to the day. */
  toHour: number;
  /** Mean of the median curve across the window, for the caller to round and label. */
  averageWait: number;
  which: 'opening' | 'closing';
}

/**
 * The quiet run the day opens with and the quiet run it ends with.
 *
 * Derived from the median curve rather than from the API's `ropeDrop`, because
 * the curve is what the reader is looking at: a window that came from a
 * different computation would sooner or later contradict the line it sits on.
 *
 * Either can be absent, and that is a real answer — a ride busy from opening has
 * no morning window, and a day too flat to have a quiet part gets neither. The
 * two can never overlap: the trailing run has to start strictly after the
 * leading one ends.
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
  // A day that barely moves has no window worth pointing at.
  if ((peak - floor) / peak < MIN_RANGE_SHARE) return [];
  const threshold = floor + QUIET_BAND * (peak - floor);
  const quiet = (v: number) => v <= threshold;
  const lastHour = hours[hours.length - 1];
  const mean = (slice: { value: number }[]) =>
    slice.reduce((sum, e) => sum + e.value, 0) / slice.length;

  const windows: QuietWindow[] = [];

  let lead = 0;
  while (lead < known.length && quiet(known[lead].value)) lead++;
  // ONE hour is enough at the edges, and that is the point: rope drop is often a
  // single hour. Voltron Nevera dips to 29 minutes at 09:00 and is at 44 by
  // 10:00 — requiring two consecutive quiet hours threw away the very window the
  // chapter is about. Noise is not the risk here, because a day too flat to have
  // a quiet part was already rejected above, and an interior dip cannot reach
  // this branch: only a run touching the first or last measured hour does.
  //
  // `lead < known.length` still holds the other end: a ride quiet at EVERY hour
  // has no distinguishing window, and marking the whole plot says nothing.
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
      // A window is at least one hour wide. The `lastHour` clamp keeps a window
      // from claiming time the plot does not draw, but for the CLOSING window
      // the run ends on the last hour by definition, so the clamp collapsed it:
      // Big Thunder Mountain's evening window rendered as "22:00–22:00". The
      // hour bucket labelled 22:00 covers 22:00 to 23:00 like every other one,
      // so a single-hour window ends an hour after it starts.
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
