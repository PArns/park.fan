import { parkyDock } from '@/lib/assistant/parky-dock';

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

/** Where the hopping element stands at one end: moved by `x`, `y` and scaled by `s`. */
interface Pose {
  x: number;
  y: number;
  s: number;
}

const AT_REST: Pose = { x: 0, y: 0, s: 1 };

/** The hop's length for this browser: none with reduced motion. */
export function parkyJumpMs(): number {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : PARKY_JUMP_MS;
}

/** The pose that puts an element measured at `rest` onto `target`, feet to feet. */
function poseOn(rest: DOMRect, target: DOMRect): Pose {
  return {
    x: target.left + target.width / 2 - (rest.left + rest.width / 2),
    y: target.bottom - rest.bottom,
    s: target.width / rest.width,
  };
}

/**
 * Down into a crouch, off in a parabola with the body stretched, onto the other end in a squash
 * that springs back, scaling from one end's size to the other's on the way.
 */
function hop(element: HTMLElement, from: Pose, to: Pose): Animation {
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
  // Seen for the whole hop, though the element may otherwise be hidden at one end.
  return element.animate(
    frames.map((frame) => ({ ...frame, opacity: 1, transformOrigin: '50% 100%' })),
    { duration: PARKY_JUMP_MS }
  );
}

/**
 * Parky's face in the chat window hops in from where Parky stands (`open`) or back to it: from the
 * slot that holds him on the page while it is on screen (`parkyDock`), else from his corner button.
 * The face is measured at rest and moved by its transform from its bottom centre, so the hop fits
 * whatever size and place the window has. Null with reduced motion or nowhere to hop from.
 */
export function parkyJump(face: HTMLElement, open: boolean): Animation | null {
  const anchor = parkyDock.element() ?? document.querySelector(`[${PARKY_CORNER_ATTR}]`);
  if (!anchor || parkyJumpMs() === 0) return null;
  const rest = face.getBoundingClientRect();
  const start = anchor.getBoundingClientRect();
  if (rest.width === 0 || start.width === 0) return null;
  const atAnchor = poseOn(rest, start);
  return open ? hop(face, atAnchor, AT_REST) : hop(face, AT_REST, atAnchor);
}

/**
 * Parky in his corner button hops up into the page's slot (`toSlot`), growing to its size, or
 * comes down from it into the corner, shrinking back. The corner drawing is what moves, so the
 * corner is where it rests. Null with reduced motion or a slot or button that takes no room.
 */
export function parkyDockHop(
  corner: HTMLElement,
  slot: HTMLElement,
  toSlot: boolean
): Animation | null {
  if (parkyJumpMs() === 0) return null;
  const rest = corner.getBoundingClientRect();
  const measured = slot.getBoundingClientRect();
  if (rest.width === 0 || measured.width === 0) return null;
  // A slot scrolled far up is left from the screen's top edge, not from where it went.
  const target = new DOMRect(
    measured.left,
    Math.max(measured.top, -measured.height / 2),
    measured.width,
    measured.height
  );
  const atSlot = poseOn(rest, target);
  return toSlot ? hop(corner, AT_REST, atSlot) : hop(corner, atSlot, AT_REST);
}
