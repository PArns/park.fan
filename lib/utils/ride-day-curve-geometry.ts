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
export const VIEW_H = 260;
export const PAD_L = 8;
export const PAD_R = 8;
export const PAD_T = 12;
export const PAD_B = 8;

/**
 * A quiet hour is one whose median sits at or under this share of the ride's own
 * peak hour.
 *
 * Relative to the ride, never an absolute number of minutes: 25 minutes is a
 * quiet hour on a headliner and the busiest hour of the day on a carousel, and
 * one threshold in minutes would mark the whole day quiet on half a park's
 * catalogue and none of it on the other half.
 */
export const QUIET_RATIO = 0.55;

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
  let d = '';
  let open = false;
  series.forEach((value, i) => {
    if (value == null || hours[i] == null) {
      open = false;
      return;
    }
    d += `${open ? 'L' : 'M'}${x(hours[i]).toFixed(1)},${y(value).toFixed(1)} `;
    open = true;
  });
  return d.trim();
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
  let d = '';
  let run: number[] = [];
  const flush = () => {
    if (run.length < 2) {
      run = [];
      return;
    }
    const top = run.map((i) => `${x(hours[i]).toFixed(1)},${y(upper[i] as number).toFixed(1)}`);
    const bottom = [...run]
      .reverse()
      .map((i) => `${x(hours[i]).toFixed(1)},${y(lower[i] as number).toFixed(1)}`);
    d += `M${top.join('L')}L${bottom.join('L')}Z `;
    run = [];
  };
  hours.forEach((_, i) => {
    if (upper[i] == null || lower[i] == null) flush();
    else run.push(i);
  });
  flush();
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
 * no morning window, one that never calms down has neither. The two can never
 * overlap: the trailing run has to start strictly after the leading one ends,
 * which is what stops a flat ride reporting its whole day as both.
 */
export function quietWindows(hours: number[], p50: Array<number | null>): QuietWindow[] {
  const known = p50
    .map((v, i) => ({ hour: hours[i], value: v }))
    .filter((e): e is { hour: number; value: number } => e.value != null && e.hour != null);
  if (known.length < 3) return [];

  const peak = Math.max(...known.map((e) => e.value));
  if (peak <= 0) return [];
  const quiet = (v: number) => v <= peak * QUIET_RATIO;
  const lastHour = hours[hours.length - 1];
  const mean = (slice: { value: number }[]) =>
    slice.reduce((sum, e) => sum + e.value, 0) / slice.length;

  const windows: QuietWindow[] = [];

  let lead = 0;
  while (lead < known.length && quiet(known[lead].value)) lead++;
  // A ride quiet at EVERY measured hour has no distinguishing window, so it gets
  // none — marking the whole plot says nothing a reader can act on.
  if (lead >= 2 && lead < known.length) {
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
  if (tail >= 0 && known.length - tailStart >= 2 && tailStart > lead) {
    const slice = known.slice(tailStart);
    windows.push({
      fromHour: slice[0].hour,
      toHour: Math.min(lastHour, slice[slice.length - 1].hour + 1),
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
