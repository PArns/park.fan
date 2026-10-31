const SHOWN_KEY = 'parkfan:assistant-teasers';

/** Two lines a session at most: one after a short look around, one a good while later. */
export const TEASER_SCHEDULE_MS = [8_000, 90_000] as const;

/** How many teaser lines this session has shown; "all of them" where storage is blocked. */
export function teasersShown(): number {
  try {
    return Number(window.sessionStorage.getItem(SHOWN_KEY)) || 0;
  } catch {
    return TEASER_SCHEDULE_MS.length;
  }
}

/** Records the lines shown; `stopTeasers` ends them for the session (opened, or closed by hand). */
export function setTeasersShown(count: number): void {
  try {
    window.sessionStorage.setItem(SHOWN_KEY, String(count));
  } catch {
    // Without storage the lines stop for this page, which is the quieter mistake.
  }
}

/** No more lines this session: Parky was opened, or a line was closed. */
export function stopTeasers(): void {
  setTeasersShown(TEASER_SCHEDULE_MS.length);
}
