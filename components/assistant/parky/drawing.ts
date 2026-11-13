import { HUB, RIM } from '@/lib/assistant/parky/rides';

/**
 * The colours and shapes Parky's drawing shares between the face (`parky-logo.tsx`), its props
 * and rides (`props.tsx`) and its dreams (`dreams.tsx`), in the 48-unit drawing.
 */

/** The ink of the pupils, the mouth and every outline drawn dark. */
export const ink = 'oklch(0.25 0.03 240)';
/** The brand's blue, where the bubble's gradient starts. */
export const blue = 'oklch(0.628 0.137 241.275)';
/** The brand's green, where the bubble's gradient ends. */
export const green = 'oklch(0.752 0.181 146.391)';
/** The bubblegum's pink. */
export const pink = 'oklch(0.8 0.13 355)';
/** A night sky's blue that stays apart from the bubble's own: the nightcap, a night dream. */
export const capBlue = 'oklch(0.42 0.13 268)';
/** The red of the rails and the car Parky rides in. */
export const rail = 'oklch(0.6 0.19 25)';
/** The dark blue of the hat's A-frame. */
export const frame = 'oklch(0.48 0.1 245)';
/** The red of a heart. */
export const heartRed = 'oklch(0.64 0.22 15)';
/** Warm gold for stars, sparkles and lit windows. */
export const gold = 'oklch(0.86 0.15 90)';
/** The Ferris wheel's cabins in turn, and confetti in the same colours. */
export const CABIN_COLOURS = ['oklch(0.72 0.17 355)', gold, green, 'oklch(0.76 0.16 55)'];

/** Parky's body: a round speech bubble with its tail at the lower left. */
export const BUBBLE =
  'M24 7c11 0 20 8.1 20 18.2S35 43.4 24 43.4c-2.5 0-4.9-.4-7.1-1.1L7.5 46l2.3-8C6.1 34.7 4 30.2 4 25.2 4 15.1 13 7 24 7Z';

/** Both eyes shut, two arcs bowed down: asleep, or in a nap. */
export const SHUT_EYES = 'M12.4 23.2q4.6 3.4 9.2 0M26.4 23.2q4.6 3.4 9.2 0';

/** The smile Parky wears whenever nothing else takes the mouth. */
export const SMILE = 'M20.5 32.5q3.5 3.2 7 0';

/** One Z of his sleep, over the bubble's top left. */
export const ZED = 'M6.5 6.5h3.4l-3.4 3.8h3.4';

/** The rosy cheeks' centres on the x axis; both sit at y 31. */
export const CHEEKS = [10.8, 37.2] as const;

/** The cheeks' blush. */
export const blush = 'oklch(0.78 0.12 15)';

/** A crescent moon about 9 units across, over the top left: the lights at night, a winter's nap. */
export const MOON = 'M6 -2a4 4 0 1 0 4.2 5.3 3.2 3.2 0 1 1-4.2-5.3Z';

/** A four-pointed star at the centre of the orbit dizzy stars run round, above the left eye. */
export const STAR = 'M17 .2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z';

/** A heart about 10 units wide round the origin, for heart eyes and the ones floating up. */
export const HEART =
  'M0 4C-1.4 2.9-5 .6-5-2.3-5-4.2-3.6-5.3-2.2-5.2-1.2-5.1-.4-4.4 0-3.6.4-4.4 1.2-5.1 2.2-5.2 3.6-5.3 5-4.2 5-2.3 5 .6 1.4 2.9 0 4Z';

/** The open grin of a ride or a cheer, in place of the smile. */
export const GRIN = 'M20 31.5h8q0 5.5-4 5.5t-4-5.5Z';

/** A happy squint: both eyes turned up into arcs. */
export const HAPPY_EYES = 'M12.6 24.2q4.4-5 8.8 0M26.6 24.2q4.4-5 8.8 0';

/** The eyes' centres on the x axis, left and right. */
export const EYES = [17, 31] as const;

/**
 * The hat, a Ferris wheel set into Parky's head: the lowest cabin goes behind it, and the A-frame's
 * right leg runs down the slope of the head, so the wheel stands in it rather than on top. Cabins
 * are circles, so they need no turning back to hang straight while the wheel spins.
 */
export const CABINS = Array.from({ length: 8 }, (_, i) => ({
  x: +(HUB.x + RIM * Math.sin((i * Math.PI) / 4)).toFixed(2),
  y: +(HUB.y - RIM * Math.cos((i * Math.PI) / 4)).toFixed(2),
}));
/** The wheel's spokes, from each cabin across the hub to the one opposite. */
export const SPOKES = CABINS.slice(0, 4)
  .map(({ x, y }) => `M${x} ${y}L${+(2 * HUB.x - x).toFixed(2)} ${+(2 * HUB.y - y).toFixed(2)}`)
  .join('');
/** The wheel's A-frame; the legs end inside the head, which is drawn over them. */
export const A_FRAME = `M${HUB.x} ${HUB.y}L25.5 13M${HUB.x} ${HUB.y}L41.5 20`;

/**
 * The magnifying glass Parky holds to its right eye while a search is open: the lens round the eye,
 * the handle running off down to the right. It swings in from the handle's end.
 */
export const LENS = { x: EYES[1], y: 22.5, r: 7.6 };
const onHandle = (distance: number) => ({
  x: +(LENS.x + distance * Math.SQRT1_2).toFixed(2),
  y: +(LENS.y + distance * Math.SQRT1_2).toFixed(2),
});
const handlePart = (from: number, to: number) =>
  `M${onHandle(from).x} ${onHandle(from).y}L${onHandle(to).x} ${onHandle(to).y}`;
const HANDLE_LENGTH = 10.5;
/** The metal band between the lens and the handle. */
export const FERRULE = handlePart(LENS.r, LENS.r + 2.8);
/** The glass's wooden handle. */
export const HANDLE = handlePart(LENS.r + 2.8, LENS.r + HANDLE_LENGTH);
/** The handle's far end, which the glass swings in from. */
export const HANDLE_END = onHandle(LENS.r + HANDLE_LENGTH);

/**
 * Confetti for a cheer: pieces shot up and out from behind the head, fanned from right to left,
 * each with its own reach and spin, then falling away.
 */
export const CONFETTI = Array.from({ length: 14 }, (_, i) => {
  const angle = Math.PI * (0.06 + (0.88 * i) / 13);
  const reach = 14 + (i % 3) * 6;
  return {
    dx: +(Math.cos(angle) * reach).toFixed(1),
    dy: +(-Math.sin(angle) * reach).toFixed(1),
    spin: (i % 2 ? 1 : -1) * (200 + i * 35),
    round: i % 3 === 0,
  };
});

/** Where the two notes, or hearts, float up beside the right cheek. */
export const FLOATERS = [
  { x: 42, y: 31, colour: blue },
  { x: 45, y: 26, colour: green },
];

/** Where the night's two stars sit, as offsets of {@link STAR}: left of the moon, above the head. */
export const NIGHT_STARS = [
  { x: -18.5, y: 6 },
  { x: -2.5, y: -5.5 },
];

/** The rows of the checklist Parky ticks off for a day plan. */
export const CHECKLIST_ROWS = [35, 39, 43];
