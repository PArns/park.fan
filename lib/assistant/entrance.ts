import { pickRandom } from '@/lib/utils/pick-random';
import { parkySwitch } from './parky/easter-eggs';
import { parkyStill } from './parky/motion';

/**
 * How Parky arrives in its corner each time a page loads, and how long each takes. Each entrance
 * has a line of its own; the stylesheet (`.parky-enter-*`) reads the length as `--parky-enter`, so
 * it is written here only.
 */
export const ENTRANCE_MS = { scurry: 1700, drop: 1300, roll: 1500, peek: 2200, pop: 900 } as const;

/** One of the entrances in {@link ENTRANCE_MS}. */
export type ParkyEntrance = keyof typeof ENTRANCE_MS;

const ENTRANCES = Object.keys(ENTRANCE_MS) as ParkyEntrance[];

let drawn: ParkyEntrance | null | undefined;

const ENTERED_KEY = 'parkfan:parky-entered';

/** Whether this browser session has seen an entrance already; storage blocked counts as yes. */
function enteredBefore(): boolean {
  try {
    if (window.sessionStorage.getItem(ENTERED_KEY)) return true;
    window.sessionStorage.setItem(ENTERED_KEY, '1');
    return false;
  } catch {
    return true;
  }
}

function isEntrance(value: string | null): value is ParkyEntrance {
  return value !== null && value in ENTRANCE_MS;
}

/**
 * This page load's entrance: a random one on the session's first page load, `?parky=<entrance>`
 * to see a given one on any load, none without motion. A show on every load wore thin by the third
 * page. Drawn once per load, so a remount (the button back after the
 * window closed) or React's strict mode gets the same answer, and a client navigation, which keeps
 * the button, none. Browser only.
 */
export function pageEntrance(): ParkyEntrance | null {
  if (drawn !== undefined) return drawn;
  drawn = null;
  try {
    if (parkyStill()) return drawn;
  } catch {
    return drawn;
  }
  const asked = parkySwitch();
  if (isEntrance(asked)) drawn = asked;
  else if (!enteredBefore()) drawn = pickRandom(ENTRANCES);
  return drawn;
}
