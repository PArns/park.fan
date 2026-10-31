/**
 * Parky's rides beyond the loop: each is a track and the car's way along it, worked out from one
 * geometry, so the rails drawn and the motion played cannot drift apart. Coordinates are the
 * 48-unit drawing's; a point is where the car's wheels touch the rail.
 */

/** Where the wheels touch the rail while Parky sits at rest. */
export const REST = { x: 24, y: 49 } as const;

/** The rides Parky can take; `coaster` is the loop, drawn and turned by the stylesheet. */
export const RIDES = ['coaster', 'launch', 'hills', 'tower'] as const;

/** One of {@link RIDES}. */
export type ParkyRide = (typeof RIDES)[number];

/** Whether a name is one of Parky's rides. */
export function isRide(value: string | null | undefined): value is ParkyRide {
  return (RIDES as readonly string[]).includes(value ?? '');
}

/**
 * A moment of a ride: the wheels' place, the car's tilt (degrees, clockwise), how far into the ride
 * (0 to 1), and optionally a squash and how visible Parky is.
 */
export interface RideStop {
  x: number;
  y: number;
  angle: number;
  at: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
}

/** A ride the component plays: the car's stops, the rails' path, and how the hat lifts off. */
export interface RideMotion {
  stops: RideStop[];
  track: string;
  /** The hat's lift above the head (units) at moments of the ride, for the free fall. */
  hat?: { at: number; lift: number }[];
}

const round = (value: number) => Math.round(value * 100) / 100;

function trackOf(points: readonly { x: number; y: number }[]): string {
  return `M${points.map((point) => `${round(point.x)} ${round(point.y)}`).join('L')}`;
}

/**
 * Spreads points over a stretch of the ride by speed: faster low down, slower near the top, as a
 * car runs on what it got from the last drop.
 */
function timed(
  points: readonly { x: number; y: number; angle: number }[],
  from: number,
  to: number,
  topY: number
): RideStop[] {
  const speed = (y: number) => Math.sqrt(0.25 + Math.max(0, y - topY) / (REST.y - topY));
  const steps = points.slice(1).map((point, i) => {
    const prev = points[i];
    const length = Math.hypot(point.x - prev.x, point.y - prev.y);
    return length / ((speed(point.y) + speed(prev.y)) / 2);
  });
  const total = steps.reduce((sum, step) => sum + step, 0) || 1;
  let elapsed = 0;
  return points.map((point, i) => {
    if (i > 0) elapsed += steps[i - 1];
    return { ...point, at: round(from + ((to - from) * elapsed) / total) };
  });
}

/** Camel-back hills to the left: from `x0` to `x1`, `height` high, as points with their tilt. */
function hill(x0: number, x1: number, height: number, count = 10) {
  const width = x0 - x1;
  return Array.from({ length: count + 1 }, (_, i) => {
    const u = i / count;
    const slope = (height * Math.PI * Math.sin(2 * Math.PI * u)) / width;
    return {
      x: x0 - width * u,
      y: REST.y - (height * (1 - Math.cos(2 * Math.PI * u))) / 2,
      angle: (Math.atan(slope) * 180) / Math.PI,
    };
  });
}

/** The curve from the station into the spike: a quarter circle, `radius` round, turning upward. */
function quarter(fromX: number, radius: number, count = 4) {
  return Array.from({ length: count + 1 }, (_, i) => {
    const a = (i / count) * (Math.PI / 2);
    return {
      x: fromX - radius * Math.sin(a),
      y: REST.y - radius + radius * Math.cos(a),
      angle: (a * 180) / Math.PI,
    };
  });
}

/**
 * The launch: shot to the left, up a spike until the speed runs out, a hang at the top, back down
 * backwards through the station and a few swings to rest, like a shuttle coaster.
 */
function launch(): RideMotion {
  const curve = quarter(-14, 20);
  const corner = curve[curve.length - 1];
  const top = { x: corner.x, y: -52, angle: 90 };
  const up = [{ x: REST.x, y: REST.y, angle: 0 }, ...curve, { ...top, y: -40 }, top];
  const out = timed(up, 0.12, 0.4, top.y);
  const back = timed([...up].reverse(), 0.48, 0.66, top.y);
  return {
    stops: [
      { ...REST, angle: 0, at: 0 },
      { x: REST.x + 3, y: REST.y, angle: 0, at: 0.06 },
      ...out,
      { ...top, at: 0.48 },
      ...back.slice(1),
      { x: REST.x + 6, y: REST.y, angle: 0, at: 0.72 },
      { x: REST.x - 7, y: REST.y, angle: 0, at: 0.8 },
      { x: REST.x + 3, y: REST.y, angle: 0, at: 0.87 },
      { x: REST.x - 1, y: REST.y, angle: 0, at: 0.93 },
      { ...REST, angle: 0, at: 1 },
    ],
    track: `${trackOf([{ x: REST.x + 12, y: REST.y }, ...curve])}V${top.y - 9}`,
  };
}

/**
 * Airtime hills: over two camel-backs to the left and out of sight, then back in from the right,
 * as if the circuit ran on behind the page, braking into the station.
 */
function hills(): RideMotion {
  const first = hill(10, -50, 30);
  const second = hill(-50, -100, 20).slice(1);
  const away = [
    { x: REST.x, y: REST.y, angle: 0 },
    ...first,
    ...second,
    { x: -150, y: REST.y, angle: 0 },
  ];
  const run = timed(away, 0.08, 0.62, REST.y - 30);
  run[run.length - 1].opacity = 0;
  return {
    stops: [
      { ...REST, angle: 0, at: 0 },
      { x: REST.x + 3, y: REST.y, angle: 0, at: 0.04 },
      ...run.map((stop) => ({ ...stop, opacity: stop.opacity ?? 1 })),
      { x: REST.x + 70, y: REST.y, angle: 0, at: 0.64, opacity: 0 },
      { x: REST.x + 40, y: REST.y, angle: 0, at: 0.72, opacity: 1 },
      { x: REST.x - 4, y: REST.y, angle: -6, at: 0.84, opacity: 1 },
      { x: REST.x + 1, y: REST.y, angle: 3, at: 0.91, opacity: 1 },
      { ...REST, angle: 0, at: 1, opacity: 1 },
    ],
    track: trackOf([{ x: REST.x + 40, y: REST.y }, ...away.slice(1)]),
  };
}

/** The free fall: pulled up the tower, a shiver at the top, the drop, the brakes. */
function tower(): RideMotion {
  const topY = -55;
  const drop = Array.from({ length: 6 }, (_, i) => {
    const s = (i + 1) / 6;
    return { x: REST.x, y: topY + (REST.y - topY) * s * s, angle: 0, at: round(0.58 + 0.08 * s) };
  });
  return {
    stops: [
      { ...REST, angle: 0, at: 0 },
      { ...REST, angle: 0, at: 0.08 },
      { x: REST.x, y: topY, angle: 0, at: 0.45 },
      { x: REST.x + 0.6, y: topY, angle: 0, at: 0.48 },
      { x: REST.x - 0.6, y: topY, angle: 0, at: 0.51 },
      { x: REST.x + 0.4, y: topY, angle: 0, at: 0.54 },
      { x: REST.x, y: topY, angle: 0, at: 0.58 },
      ...drop.slice(0, -1),
      { ...drop[drop.length - 1], scaleX: 1.14, scaleY: 0.86 },
      { x: REST.x, y: REST.y - 5, angle: 0, at: 0.72, scaleX: 0.95, scaleY: 1.05 },
      { ...REST, angle: 0, at: 0.78 },
      { x: REST.x, y: REST.y - 1.5, angle: 0, at: 0.85 },
      { ...REST, angle: 0, at: 1 },
    ],
    track: `M${REST.x} ${REST.y + 3}V${topY - 30}`,
    hat: [
      { at: 0, lift: 0 },
      { at: 0.6, lift: 0 },
      { at: 0.65, lift: 10 },
      { at: 0.69, lift: 6 },
      { at: 0.73, lift: 0 },
      { at: 1, lift: 0 },
    ],
  };
}

/** The rides played from these stops; the loop is the stylesheet's. */
export const RIDE_MOTION: Record<Exclude<ParkyRide, 'coaster'>, RideMotion> = {
  launch: launch(),
  hills: hills(),
  tower: tower(),
};

/** A stop as a keyframe for the car, turned about the wheels' resting point. */
export function rideKeyframe(stop: RideStop): Keyframe {
  const transform =
    `translate(${round(stop.x - REST.x)}px, ${round(stop.y - REST.y)}px) ` +
    `rotate(${round(stop.angle)}deg) scale(${stop.scaleX ?? 1}, ${stop.scaleY ?? 1})`;
  return {
    offset: stop.at,
    transform,
    ...(stop.opacity !== undefined && { opacity: stop.opacity }),
  };
}
