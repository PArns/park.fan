/** How long Parky's hop between his corner and the chat window's top edge takes. */
export const PARKY_JUMP_MS = 720;

/** Marks the drawing in the corner button, where the hop starts and lands. */
export const PARKY_CORNER_ATTR = 'data-parky-corner';

/** How far the arc rises above the higher of its two ends. */
const ARC_PX = 80;
/** Share of the hop spent crouching before take-off, and squashing after landing. */
const CROUCH = 0.16;
const LAND = 0.2;
/** Points along the flight: enough for the parabola to read as a curve. */
const STEPS = 16;

/** The hop's length for this browser: none with reduced motion. */
export function parkyJumpMs(): number {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : PARKY_JUMP_MS;
}

/**
 * Parky's face in the chat window hops in from the corner button (`open`) or back to it: down into
 * a crouch, off in a parabola with his body stretched, onto the other end in a squash that springs
 * back. The face is measured at rest and moved by its transform from its bottom centre, so the hop
 * fits whatever size and place the window has. Null with reduced motion or no button to hop from.
 */
export function parkyJump(face: HTMLElement, open: boolean): Animation | null {
  const corner = document.querySelector(`[${PARKY_CORNER_ATTR}]`);
  if (!corner || parkyJumpMs() === 0) return null;
  const rest = face.getBoundingClientRect();
  const button = corner.getBoundingClientRect();
  if (rest.width === 0 || button.width === 0) return null;
  // Feet to feet: the face scales from its bottom centre.
  const atCorner = {
    x: button.left + button.width / 2 - (rest.left + rest.width / 2),
    y: button.bottom - rest.bottom,
    s: button.width / rest.width,
  };
  const atWindow = { x: 0, y: 0, s: 1 };
  const [from, to] = open ? [atCorner, atWindow] : [atWindow, atCorner];
  const rise = Math.abs(from.y - to.y) / 2 + ARC_PX;
  const at = (x: number, y: number, sx: number, sy: number) =>
    `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;

  const frames: Keyframe[] = [
    { offset: 0, transform: at(from.x, from.y, from.s, from.s), easing: 'ease-out' },
    {
      offset: CROUCH,
      transform: at(from.x, from.y, from.s * 1.2, from.s * 0.75),
      easing: 'ease-in',
    },
  ];
  // The flight: steady across, a parabola up and down (constant pull, so he slows to the top and
  // speeds into the landing), stretched as he leaves and falls, round at the top.
  for (let i = 1; i <= STEPS; i++) {
    const t = i / STEPS;
    const s = from.s + (to.s - from.s) * t;
    const stretch = 1 + 0.18 * Math.abs(1 - 2 * t);
    frames.push({
      offset: CROUCH + (1 - CROUCH - LAND) * t,
      transform: at(
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t - 4 * rise * t * (1 - t),
        (s / stretch) * (i === STEPS ? 1.25 : 1),
        s * stretch * (i === STEPS ? 0.7 : 1)
      ),
    });
  }
  frames.push(
    { offset: 1 - LAND / 2, transform: at(to.x, to.y - 8, to.s * 0.94, to.s * 1.08) },
    { offset: 1, transform: at(to.x, to.y, to.s, to.s) }
  );
  // Seen for the whole hop, though the closed window's face is otherwise hidden.
  return face.animate(
    frames.map((frame) => ({ ...frame, opacity: 1, transformOrigin: '50% 100%' })),
    { duration: PARKY_JUMP_MS }
  );
}
