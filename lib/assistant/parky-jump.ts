import { PARKY_TOP_CLEARANCE, parkyDock } from '@/lib/assistant/parky-dock';

/** How long Parky's hop between his corner and the chat window's top edge takes. */
export const PARKY_JUMP_MS = 720;

/** How long his hop between the corner and a slot on the page takes: the longer way, more time. */
export const PARKY_DOCK_HOP_MS = 1100;

/** Marks the drawing in the corner button, where the hop starts and lands. */
export const PARKY_CORNER_ATTR = 'data-parky-corner';

/**
 * Sent on `window` when a hop has landed. Parky's eyes aimed at the pointer from wherever he was
 * mid-air (the page scrolls under a still pointer while he flies), so they aim again from where he
 * stands now.
 */
export const PARKY_LANDED_EVENT = 'parky:landed';

/** How far the arc rises above the higher of its two ends, room under the header allowing. */
const ARC_PX = 80;
/** Share of the hop spent crouching before take-off, and squashing after landing. */
const CROUCH = 0.16;
const LAND = 0.2;
/** Share of the flight spent turning the crouch into the stretch, and the stretch into the impact. */
const BLEND = 0.12;
/** Keyframes the chat window's hop is sampled into: enough for the parabola to read as a curve. */
const SAMPLES = 24;

/** Where the hopping element stands at one end: moved by `x`, `y` and scaled by `s`. */
interface Pose {
  x: number;
  y: number;
  s: number;
}

/** One moment of the hop: moved by `x`, `y`, scaled by `sx` across and `sy` up. */
interface Frame {
  x: number;
  y: number;
  sx: number;
  sy: number;
}

const AT_REST: Pose = { x: 0, y: 0, s: 1 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

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

/** The hat and what else rises over the drawing, as a share of its height. */
const HAT = 0.2;

/** Where the top of the drawing, hat included, stands in a frame of an element measured at `rest`. */
function topOf(rest: DOMRect, frame: Frame): number {
  return rest.bottom + frame.y - rest.height * frame.sy * (1 + HAT);
}

/**
 * How high the arc rises: above the higher end by `ARC_PX`, but never so high that Parky, hat
 * included, leaves the screen or passes over the sticky header, unless an end is already up there.
 * Searched, not solved: the highest point moves towards the higher end, and the body stretches.
 */
function riseFor(rest: DOMRect, from: Pose, to: Pose): number {
  const wanted = Math.abs(from.y - to.y) / 2 + ARC_PX;
  const limit = Math.min(
    PARKY_TOP_CLEARANCE,
    topOf(rest, frameAt(0, from, to, 0)),
    topOf(rest, frameAt(1, from, to, 0))
  );
  const clears = (rise: number) => {
    for (let i = 1; i < SAMPLES; i++) {
      if (topOf(rest, frameAt(i / SAMPLES, from, to, rise)) < limit) return false;
    }
    return true;
  };
  if (clears(wanted)) return wanted;
  let low = 0;
  let high = wanted;
  for (let step = 0; step < 10; step++) {
    const middle = (low + high) / 2;
    if (clears(middle)) low = middle;
    else high = middle;
  }
  return low;
}

/**
 * The hop at `t` (0 to 1): down into a crouch, off in a parabola with the body stretched, onto the
 * other end in a squash that springs back, scaling from one end's size to the other's on the way.
 * Steady across and under constant pull up and down, so he slows to the top and speeds into the
 * landing.
 */
function frameAt(t: number, from: Pose, to: Pose, rise: number): Frame {
  const crouched = { sx: from.s * 1.2, sy: from.s * 0.75 };
  const impact = { sx: to.s * 1.06, sy: to.s * 0.83 };
  if (t <= CROUCH) {
    const u = easeOut(t / CROUCH);
    return {
      x: from.x,
      y: from.y,
      sx: lerp(from.s, crouched.sx, u),
      sy: lerp(from.s, crouched.sy, u),
    };
  }
  const flightEnd = 1 - LAND;
  if (t <= flightEnd) {
    const u = (t - CROUCH) / (flightEnd - CROUCH);
    const s = lerp(from.s, to.s, u);
    const stretch = 1 + 0.18 * Math.abs(1 - 2 * u);
    let sx = s / stretch;
    let sy = s * stretch;
    if (u < BLEND) {
      sx = lerp(crouched.sx, sx, u / BLEND);
      sy = lerp(crouched.sy, sy, u / BLEND);
    } else if (u > 1 - BLEND) {
      const k = (u - (1 - BLEND)) / BLEND;
      sx = lerp(sx, impact.sx, k);
      sy = lerp(sy, impact.sy, k);
    }
    return { x: lerp(from.x, to.x, u), y: lerp(from.y, to.y, u) - 4 * rise * u * (1 - u), sx, sy };
  }
  // The landing: the impact's squash springs up a little, then settles.
  const v = (t - flightEnd) / LAND;
  if (v < 0.5) {
    const k = easeOut(v / 0.5);
    return {
      x: to.x,
      y: to.y - 8 * k,
      sx: lerp(impact.sx, to.s * 0.94, k),
      sy: lerp(impact.sy, to.s * 1.08, k),
    };
  }
  const k = easeOut((v - 0.5) / 0.5);
  return {
    x: to.x,
    y: lerp(to.y - 8, to.y, k),
    sx: lerp(to.s * 0.94, to.s, k),
    sy: lerp(to.s * 1.08, to.s, k),
  };
}

/** A frame as a keyframe; seen for the whole hop, though the element may be hidden at one end. */
function keyframeOf(frame: Frame): Keyframe {
  return {
    transform: `translate(${frame.x.toFixed(1)}px, ${frame.y.toFixed(1)}px) scale(${frame.sx.toFixed(3)}, ${frame.sy.toFixed(3)})`,
    opacity: 1,
    transformOrigin: '50% 100%',
  };
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
  const [from, to] = open ? [atAnchor, AT_REST] : [AT_REST, atAnchor];
  const rise = riseFor(rest, from, to);
  const frames = Array.from({ length: SAMPLES + 1 }, (_, i) => ({
    ...keyframeOf(frameAt(i / SAMPLES, from, to, rise)),
    offset: i / SAMPLES,
  }));
  const animation = face.animate(frames, { duration: PARKY_JUMP_MS });
  animation.addEventListener('finish', () => window.dispatchEvent(new Event(PARKY_LANDED_EVENT)));
  return animation;
}

/** The dock hop in the air, so one that interrupts it takes off from where he is. */
let flying: { element: HTMLElement; frame: Frame } | null = null;

/**
 * Parky in his corner button hops up into the page's slot (`toSlot`), growing to its size, or
 * comes down from it into the corner, shrinking back. The corner drawing is what moves, so the
 * corner is where it rests. Frame by frame, because the page scrolls under him while he flies: the
 * way up aims at where the slot is now, not where it was at take-off, and the way down leaves from
 * where the slot was last seen, but below the header. The first frame is set at once, so a call from a
 * layout effect paints him already on his way, and the last one holds until `stop`, so whoever
 * takes over from him can do it in the same frame. `onLanded` runs once he is there. Returns
 * `stop`, or null with reduced motion or a slot or button that takes no room.
 */
export function parkyDockHop(
  corner: HTMLElement,
  slot: HTMLElement,
  toSlot: boolean,
  onLanded: () => void
): (() => void) | null {
  if (parkyJumpMs() === 0) return null;
  const rest = corner.getBoundingClientRect();
  const measured = slot.getBoundingClientRect();
  if (rest.width === 0 || measured.width === 0) return null;
  const atSlot = (box: DOMRect) =>
    poseOn(
      rest,
      new DOMRect(box.left, Math.max(box.top, PARKY_TOP_CLEARANCE), box.width, box.height)
    );
  const midAir = flying?.element === corner ? flying.frame : null;
  const from: Pose = midAir
    ? { x: midAir.x, y: midAir.y, s: (midAir.sx + midAir.sy) / 2 }
    : toSlot
      ? AT_REST
      : atSlot(measured);
  const target = toSlot ? () => atSlot(slot.getBoundingClientRect()) : () => AT_REST;

  const first = frameAt(0, from, target(), 0);
  flying = { element: corner, frame: first };
  // One keyframe held by `fill`, rewritten every frame: an animation, unlike an inline style,
  // outranks the drawing's own CSS animations.
  const animation = corner.animate([keyframeOf(first), keyframeOf(first)], {
    duration: 1,
    fill: 'forwards',
  });
  const effect = animation.effect as KeyframeEffect;
  const started = performance.now();
  let request = 0;
  const step = (now: number) => {
    const t = Math.min(1, (now - started) / PARKY_DOCK_HOP_MS);
    const to = target();
    const frame = frameAt(t, from, to, riseFor(rest, from, to));
    flying = { element: corner, frame };
    effect.setKeyframes([keyframeOf(frame), keyframeOf(frame)]);
    if (t < 1) {
      request = requestAnimationFrame(step);
      return;
    }
    request = 0;
    flying = null;
    window.dispatchEvent(new Event(PARKY_LANDED_EVENT));
    onLanded();
  };
  request = requestAnimationFrame(step);
  return () => {
    cancelAnimationFrame(request);
    animation.cancel();
    // A hop that takes over does so in the same commit; after that the frame is stale.
    const left = flying;
    requestAnimationFrame(() => {
      if (flying === left) flying = null;
    });
  };
}
