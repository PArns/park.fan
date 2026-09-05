/**
 * Wait times are displayed in five-minute steps, always.
 *
 * Parks post them that way, so every raw observation in the database is already
 * a multiple of five. What breaks it is the maths on top: a percentile
 * interpolates between two stored values and an average across days blurs the
 * rest, which is how the park's hourly table came to print 51, 53 and 47 —
 * readings no park has ever put on a sign.
 *
 * The API rounds these on the way out (`roundToNearest5Minutes` in
 * `src/common/utils/wait-time.utils.ts`, same formula). This is the same rule on
 * the rendering side, so a surface is correct regardless of which API build is
 * answering and regardless of what a third-party payload contains. Rounding an
 * already-rounded value is a no-op, so applying both costs nothing.
 *
 * Round only what is DISPLAYED. Anything that feeds a comparison — a crowd
 * ratio, a ranking, the pick of a ride's peak hour — reads the raw value, or
 * five-minute buckets invent ties the data does not have.
 */
export function roundWaitTo5(value: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 2.5) return 0;
  return Math.floor((n + 2.5) / 5) * 5;
}

/**
 * The same five-minute grid for a DIFFERENCE between two wait times.
 *
 * `roundWaitTo5` floors everything under 2.5 to zero, which is right for a
 * queue — there is no such thing as −15 minutes of waiting. A delta is the
 * other case, and applying the wait-time rule to it silently deleted half the
 * scale: the attraction card's trend compares the last two readings against the
 * two before them, so a queue being worked off produces a negative delta, and
 * every one of them collapsed to 0 → "stable". No ride could show a falling
 * trend at all. It was visible on the guide page itself, where Black Mamba's
 * card sat at a grey "stabil" under a caption saying its queue was shrinking.
 */
export function roundWaitDeltaTo5(value: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? -roundWaitTo5(-n) : roundWaitTo5(n);
}

/**
 * The short-term movement of one queue, as a direction AND the number that produced it.
 *
 * Both halves come from the same arithmetic, and that is the whole point. The ride page's live
 * panel drew its arrow from the API's `trend` field and its figure from an average of today's
 * first half against its second — two different questions — so at 18:00 a queue reading 70, 70,
 * 55, 50 got the API's „falling" arrow next to `+30 min`, because the afternoon had been busier
 * than the morning. Even where the signs agreed the number was answering „how much busier was
 * this afternoon", on a control labelled as a trend.
 *
 * A fixed window of two readings against the two before them, lifted verbatim out of
 * `AttractionCard` where it has always lived: a proportional window compares against hours-old
 * data when the history is sparse (eight points over 100 minutes would report the whole day's
 * change as „recent movement"). Two surfaces one click apart now answer with the same value.
 *
 * `roundWaitDeltaTo5`, never `roundWaitTo5` — the latter floors everything under 2.5 to zero, and
 * a difference is not a wait time.
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
