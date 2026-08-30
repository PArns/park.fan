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
