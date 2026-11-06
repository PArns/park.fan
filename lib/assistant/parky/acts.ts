import { pickRandom } from '@/lib/utils/pick-random';
import { sceneFits, type ParkyLookAct } from './look';
import type { ParkyReactionAct } from './reactions';
import { RIDES, rideFits, type ParkyRide } from './rides';

/**
 * Parky's little acts and how long each runs. The stylesheet reads the length as `--parky-act`,
 * so a duration is written here only.
 */
export const ACT_MS = {
  hop: 1400,
  tilt: 1600,
  look: 1800,
  spin: 2200,
  wink: 900,
  wiggle: 1100,
  yawn: 2600,
  whistle: 3200,
  gum: 3400,
  roll: 1600,
  twirl: 1400,
  dance: 2400,
  read: 4200,
  nap: 5000,
  doze: 2000,
  startle: 900,
  stretch: 1600,
  groggy: 2000,
  shakeoff: 1000,
  coaster: 3600,
  launch: 4400,
  hills: 4800,
  tower: 4200,
  flume: 5200,
  teacups: 4400,
  dizzy: 2700,
  plan: 4200,
  cheer: 2400,
  love: 2600,
  bell: 2200,
  shades: 3000,
  lights: 3400,
  nightcap: 3800,
  ghost: 3600,
  snowglobe: 4200,
  fireworks: 3800,
  snowman: 6500,
  brolly: 2400,
  shiver: 1600,
  fan: 3000,
  candy: 3200,
  churro: 3400,
  balloon: 3800,
  map: 4200,
  photo: 3000,
  slurp: 3600,
  airtime: 2200,
  grumpy: 3200,
} as const satisfies Record<string, number> &
  Record<ParkyRide, number> &
  Record<ParkyReactionAct, number> &
  Record<ParkyLookAct, number>;
/** One of Parky's acts by name, as {@link ParkyCue} asks for one. */
export type ParkyAct = keyof typeof ACT_MS;

/**
 * An act that always comes straight after another: off a ride Parky is dizzy, and out of the log
 * flume he shakes the water off.
 */
export const FOLLOW_UP: Partial<Record<ParkyAct, ParkyAct>> = {
  coaster: 'dizzy',
  launch: 'dizzy',
  hills: 'dizzy',
  tower: 'dizzy',
  teacups: 'dizzy',
  flume: 'shakeoff',
};

/** How long an act runs with the one that follows it, for a page that plays acts in turn. */
export function actLength(act: ParkyAct): number {
  const after = FOLLOW_UP[act];
  return ACT_MS[act] + (after ? ACT_MS[after] : 0);
}

/**
 * An act asked for from outside, to play at once: the ride an easter egg ends with (`ride` for any
 * of them), Parky's answer to something the visitor did, or any act on Parky's own page. A new
 * `id` plays it again.
 */
export interface ParkyCue {
  act: ParkyAct | 'ride';
  id: number;
}

/**
 * An act by name, or for `ride` a random one of the rides that fit on screen round the drawing at
 * `box`; `null` when none does. A ride asked for by name plays wherever Parky is, as on its page's
 * stage. Without a box (nothing measured yet) everything fits.
 */
export function actFor(act: ParkyAct | 'ride', box: DOMRect | undefined): ParkyAct | null {
  // A scene beside him (the snowman, the fireworks) passes its turn where it would be cut off.
  if (act !== 'ride') return !box || sceneFits(act, box) ? act : null;
  const room = box ? RIDES.filter((ride) => rideFits(ride, box)) : RIDES;
  return room.length > 0 ? pickRandom(room) : null;
}

/**
 * Parky's life of its own comes in classes, and what he does is drawn from the one for the moment.
 * The blink runs underneath all of them, in CSS (`parky-blink`), and so do the acts that answer
 * what the visitor does (cues, moods, searching along).
 *
 * - `fidget`: small and easy to miss, starting 7 to 10 s apart while somebody is on the page.
 * - `showy`: something to notice, about every half minute in place of a fidget. Each entry is a
 *   ticket: two for each of his tricks (a spin, a twirl, the sunglasses, the lit wheel, a dance, a
 *   quick nod-off …), one for each moment of a park day (cotton candy, a churro, a balloon, the
 *   map, a photo, a drink, airtime), and seven `ride`s, so about one showy act in five is a ride.
 *   `grumpy` is no ticket: it answers long queues.
 * - `sleepy`: after a minute without anybody moving, until he falls asleep at a minute and a half.
 * - asleep he now and then dreams (`DREAMS`).
 */
export const CLASS_ACTS: Record<'fidget' | 'showy' | 'sleepy', readonly (ParkyAct | 'ride')[]> = {
  fidget: ['wink', 'look', 'tilt', 'wiggle'],
  showy: [
    ...(['ride', 'ride', 'ride', 'ride', 'ride', 'ride', 'ride'] as const),
    ...(
      [
        'hop',
        'spin',
        'roll',
        'twirl',
        'dance',
        'shades',
        'lights',
        'whistle',
        'gum',
        'read',
        'doze',
      ] as const
    ).flatMap((act) => [act, act]),
    'candy',
    'churro',
    'balloon',
    'map',
    'photo',
    'slurp',
    'airtime',
  ],
  sleepy: ['yawn', 'nap', 'nightcap', 'doze'],
};

/** How Parky wakes up when somebody moves, calm or not. */
export const WAKE_ACTS = [
  'startle',
  'stretch',
  'groggy',
  'shakeoff',
] as const satisfies readonly ParkyAct[];

/**
 * The rest after an act before the class's next one, as the shortest wait and a random spread on
 * top. A fidget lasts about a second and a half, so fidgets start 7 to 10 s apart; a dream comes
 * 15 to 25 s after the last one ended.
 */
export const CLASS_PAUSE_MS: Record<keyof typeof CLASS_ACTS | 'dream', readonly [number, number]> =
  {
    fidget: [5_500, 3_000],
    showy: [27_000, 6_000],
    sleepy: [8_000, 4_000],
    dream: [15_000, 10_000],
  };

/** A wait drawn from a class's pause. */
export function pauseOf(kind: keyof typeof CLASS_PAUSE_MS): number {
  const [shortest, spread] = CLASS_PAUSE_MS[kind];
  return shortest + Math.random() * spread;
}
