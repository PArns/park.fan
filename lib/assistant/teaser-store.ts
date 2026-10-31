const SHOWN_KEY = 'parkfan:assistant-teasers';
const REACTIONS_KEY = 'parkfan:assistant-reactions';
const MUTED_KEY = 'parkfan:assistant-muted';
const PARKS_KEY = 'parkfan:assistant-parks';

/** A park's own line comes once per park and at most this often a session. */
export const PARK_LINES_PER_SESSION = 3;

/** Two lines a session at most: one after a short look around, one a good while later. */
export const TEASER_SCHEDULE_MS = [8_000, 90_000] as const;

/** Lines Parky says when it gets bored or is woken up, at most this many a session. */
export const REACTIONS_PER_SESSION = 3;

function readCount(key: string, blocked: number): number {
  try {
    return Number(window.sessionStorage.getItem(key)) || 0;
  } catch {
    return blocked;
  }
}

function writeCount(key: string, count: number): void {
  try {
    window.sessionStorage.setItem(key, String(count));
  } catch {
    // Without storage the lines stop for this page, which is the quieter mistake.
  }
}

/** How many teaser lines this session has shown; "all of them" where storage is blocked. */
export function teasersShown(): number {
  return readCount(SHOWN_KEY, TEASER_SCHEDULE_MS.length);
}

/** Records the lines shown; `stopTeasers` ends them for the session (opened, or closed by hand). */
export function setTeasersShown(count: number): void {
  writeCount(SHOWN_KEY, count);
}

/** How many bored or woken lines this session has shown; "all of them" where storage is blocked. */
export function reactionsShown(): number {
  return readCount(REACTIONS_KEY, REACTIONS_PER_SESSION);
}

/** Records one more bored or woken line. */
export function countReaction(): void {
  writeCount(REACTIONS_KEY, reactionsShown() + 1);
}

/** No more invitations or reactions this session: Parky was opened, or a line was closed. */
export function stopTeasers(): void {
  setTeasersShown(TEASER_SCHEDULE_MS.length);
  writeCount(REACTIONS_KEY, REACTIONS_PER_SESSION);
}

/**
 * A line closed by hand: Parky stops talking for the session, its easter eggs included, which
 * opening Parky leaves alone.
 */
export function muteLines(): void {
  stopTeasers();
  writeCount(MUTED_KEY, 1);
}

/** Whether a line was closed by hand this session; `true` where storage is blocked. */
export function linesMuted(): boolean {
  return readCount(MUTED_KEY, 1) > 0;
}

function parksGreeted(): string[] {
  try {
    const parks: unknown = JSON.parse(window.sessionStorage.getItem(PARKS_KEY) ?? '[]');
    return Array.isArray(parks) ? parks.filter((park) => typeof park === 'string') : [];
  } catch {
    return [];
  }
}

/** Whether Parky may still say a park's own line: not muted, not this park yet, not too often. */
export function parkLineDue(path: string): boolean {
  if (linesMuted()) return false;
  const greeted = parksGreeted();
  return !greeted.includes(path) && greeted.length < PARK_LINES_PER_SESSION;
}

/** Records that Parky said a park's own line. */
export function markParkLine(path: string): void {
  try {
    window.sessionStorage.setItem(PARKS_KEY, JSON.stringify([...parksGreeted(), path]));
  } catch {
    // Without storage the line may come again on the next load.
  }
}
