import { pickRandom } from '@/lib/utils/pick-random';
import { parkySwitch } from './easter-eggs';

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

function isEntrance(value: string | null): value is ParkyEntrance {
  return value !== null && value in ENTRANCE_MS;
}

/**
 * This page load's entrance: a random one each time the page loads, `?parky=<entrance>` to see a
 * given one, none without motion. Drawn once per load, so a remount (the button back after the
 * window closed) or React's strict mode gets the same answer, and a client navigation, which keeps
 * the button, none. Browser only.
 */
export function pageEntrance(): ParkyEntrance | null {
  if (drawn !== undefined) return drawn;
  drawn = null;
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return drawn;
  } catch {
    return drawn;
  }
  const asked = parkySwitch();
  drawn = isEntrance(asked) ? asked : pickRandom(ENTRANCES);
  return drawn;
}
