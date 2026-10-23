/**
 * Disney's walk-on: 13 minutes, the one posted wait that stays off the five-minute grid. It is the
 * park's signal for „walk straight on", and rounding it to 15 makes it an ordinary short queue.
 * The API keeps it the same way (`WALK_ON_WAIT_MINUTES` in `src/common/utils/wait-time.utils.ts`).
 */
export const WALK_ON_WAIT_MINUTES = 13;

/** The plain five-minute grid, without the walk-on exception. */
function snapWaitTo5(n: number): number {
  return Math.floor((n + 2.5) / 5) * 5;
}

/**
 * Rounds a wait time for display to five-minute steps, except Disney's 13
 * ({@link WALK_ON_WAIT_MINUTES}). Parks post multiples of five; percentiles and averages on top
 * are what produce 51 or 47. The API rounds the same way (`roundToNearest5Minutes`), and this
 * repeats it so a surface is right whatever build or payload answers.
 *
 * Round only what is displayed: a comparison, ranking or peak pick reads the raw value, or the
 * buckets invent ties. See docs/rules/the-guide-page-teaches-the-real-cards-with-the-rides-real.md.
 */
export function roundWaitTo5(value: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 2.5) return 0;
  if (n === WALK_ON_WAIT_MINUTES) return n;
  return snapWaitTo5(n);
}

/**
 * The two figures of the ride panel's „usually X, rarely over Y" line, both rounded for display,
 * or null when there is nothing to say. `rare` is null when the rounded 95th percentile does not
 * rise above the typical wait, so the line never claims a range that is not one.
 */
export function typicalHourFigures(
  typical: number | null | undefined,
  p95: number | null | undefined
): { typical: number; rare: number | null } | null {
  if (typical == null) return null;
  const t = roundWaitTo5(typical);
  if (t === 0) return null;
  const r = p95 == null ? null : roundWaitTo5(p95);
  return { typical: t, rare: r !== null && r > t ? r : null };
}

/**
 * The five-minute grid for a figure this app computes itself, such as a mean over many days. The
 * walk-on 13 is a value a park posts; an average that happens to land on 13 is an ordinary short
 * wait and goes to 15 like 12.8 does.
 */
export function roundAverageWaitTo5(value: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 2.5) return 0;
  return snapWaitTo5(n);
}

/**
 * The same five-minute grid for a DIFFERENCE between two wait times. `roundWaitTo5` floors
 * everything under 2.5 to zero, which is right for a queue and wrong for a delta: it would turn
 * every falling trend into „stable".
 */
export function roundWaitDeltaTo5(value: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  // The plain grid, never `roundWaitTo5`: a trend of +13 is not a walk-on.
  const size = Math.abs(n);
  const rounded = size < 2.5 ? 0 : snapWaitTo5(size);
  return n < 0 ? -rounded : rounded;
}

/**
 * The short-term movement of one queue, as a direction and the number that produced it, from the
 * same arithmetic so arrow and figure cannot disagree. A fixed window of the last two readings
 * against the two before them: a proportional window would compare against hours-old data when
 * the history is sparse. Shared by `AttractionCard` and the ride page's live panel.
 */
export function shortTermWaitTrend(
  history: { waitTime: number }[] | null | undefined
): { direction: 'up' | 'down' | 'stable'; delta: number } | null {
  if (!history || history.length < 4) return null;
  const WINDOW = 2;
  const recent = history.slice(-WINDOW);
  const prior = history.slice(-WINDOW * 2, -WINDOW);
  const avg = (pts: { waitTime: number }[]) =>
    pts.reduce((s, p) => s + (typeof p.waitTime === 'number' ? p.waitTime : 0), 0) / pts.length;
  const delta = roundWaitDeltaTo5(avg(recent) - avg(prior));
  if (delta === 0) return { direction: 'stable', delta: 0 };
  return { direction: delta > 0 ? 'up' : 'down', delta };
}
