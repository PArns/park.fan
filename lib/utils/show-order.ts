/** The earliest showtime of `show` that is still ahead of `nowMs`, in epoch ms, or `null`. */
function nextStartMs(show: { showtimes?: { startTime: string }[] }, nowMs: number): number | null {
  let next: number | null = null;
  for (const { startTime } of show.showtimes ?? []) {
    const t = Date.parse(startTime);
    if (Number.isNaN(t) || t < nowMs) continue;
    if (next === null || t < next) next = t;
  }
  return next;
}

/**
 * Shows with a showtime still to come first, by that showtime; the rest (all times past, or none)
 * after them, each group in the order it came in. `nowMs: null` (server render and hydration
 * render) returns the input order, so both renders agree. Returns the same array when nothing moves.
 */
export function sortShowsByNextStart<T extends { showtimes?: { startTime: string }[] }>(
  shows: T[],
  nowMs: number | null
): T[] {
  if (nowMs === null || shows.length < 2) return shows;
  const upcoming: { show: T; start: number }[] = [];
  const rest: T[] = [];
  for (const show of shows) {
    const start = nextStartMs(show, nowMs);
    if (start === null) rest.push(show);
    else upcoming.push({ show, start });
  }
  if (upcoming.length === 0) return shows;
  // Array.prototype.sort is stable, so equal start times keep the API order.
  upcoming.sort((a, b) => a.start - b.start);
  return [...upcoming.map((u) => u.show), ...rest];
}
