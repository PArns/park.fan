const SHOWN_KEY = 'parkfan:assistant-teasers';
const MUTED_KEY = 'parkfan:assistant-muted';
const ANSWERED_KEY = 'parkfan:assistant-answered';

/**
 * One line a visit that nobody asked for, after a short look around: the bubble covers part of the
 * page, so once is enough. The entrance's, the weather's, the live waits' and a bored or woken line
 * spend the same one (`countReaction`).
 */
export const TEASER_SCHEDULE_MS = [8_000] as const;

/** Lines Parky says unasked besides the scheduled one: they share its one a visit. */
export const REACTIONS_PER_SESSION = 1;

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

/** Whether the visit's unasked line is spent: 1 once it is, 0 before; spent where storage is blocked. */
export function reactionsShown(): number {
  return teasersShown() >= TEASER_SCHEDULE_MS.length ? REACTIONS_PER_SESSION : 0;
}

/** A bored, woken, weather or live line was said: it spent the visit's unasked line. */
export function countReaction(): void {
  setTeasersShown(TEASER_SCHEDULE_MS.length);
}

/** No more unasked lines this session: Parky was opened, or a line was closed. */
export function stopTeasers(): void {
  setTeasersShown(TEASER_SCHEDULE_MS.length);
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

function answeredKinds(): string[] | null {
  try {
    return (window.sessionStorage.getItem(ANSWERED_KEY) ?? '').split(',').filter(Boolean);
  } catch {
    return null;
  }
}

/**
 * Whether Parky already answered this kind of action with a line this session (the planner
 * opened, a favourite, …); `true` where storage is blocked. Its act plays every time regardless.
 */
export function answeredWithLine(kind: string): boolean {
  return answeredKinds()?.includes(kind) ?? true;
}

/** Records the line Parky said in answer to a kind of action. */
export function countAnswer(kind: string): void {
  const kinds = answeredKinds();
  if (!kinds || kinds.includes(kind)) return;
  try {
    window.sessionStorage.setItem(ANSWERED_KEY, [...kinds, kind].join(','));
  } catch {
    // Without storage no answer gets a line, which is the quieter mistake.
  }
}
