import { pickRandom } from '@/lib/utils/pick-random';

const PLAYED_KEY = 'parkfan:assistant-entrance';

/**
 * How Parky arrives in its corner, once a session, and how long each takes. Each entrance has a
 * line of its own; the stylesheet (`.parky-enter-*`) reads the length as `--parky-enter`, so it is
 * written here only.
 */
export const ENTRANCE_MS = { scurry: 1700, drop: 1300, roll: 1500, peek: 2200, pop: 900 } as const;

/** One of the entrances in {@link ENTRANCE_MS}. */
export type ParkyEntrance = keyof typeof ENTRANCE_MS;

const ENTRANCES = Object.keys(ENTRANCE_MS) as ParkyEntrance[];

let drawn: ParkyEntrance | null | undefined;

/**
 * This page's entrance: a random one the first time Parky shows in a session, none after that, none
 * without motion and none where storage is blocked (it could not tell a second visit). Drawn once
 * per page, so every later call, a remount or React's strict mode, gets the same answer. Browser
 * only.
 */
export function sessionEntrance(): ParkyEntrance | null {
  if (drawn !== undefined) return drawn;
  drawn = null;
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return drawn;
    if (window.sessionStorage.getItem(PLAYED_KEY)) return drawn;
    window.sessionStorage.setItem(PLAYED_KEY, '1');
  } catch {
    return drawn;
  }
  drawn = pickRandom(ENTRANCES);
  return drawn;
}
