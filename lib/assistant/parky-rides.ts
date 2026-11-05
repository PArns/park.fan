/**
 * Parky's rides: beyond the loop each is a track and the car's way along it, worked out from one
 * geometry, so the rails drawn and the motion played cannot drift apart; and for every ride how far
 * it reaches, so that a ride is only taken where it fits on screen. Coordinates are the 48-unit
 * drawing's; a point is where the car's wheels touch the rail.
 */

/** The drawing's width and height in its own units, its `viewBox`. */
export const VIEW = 48;

/** Where the wheels touch the rail while Parky sits at rest. */
export const REST = { x: 24, y: 49 } as const;

/** The hat's hub: the centre of the Ferris wheel set into Parky's head. */
export const HUB = { x: 33, y: 0.5 } as const;

/** The Ferris wheel's radius, from the hub to the cabins' centres. */
export const RIM = 6.5;

/**
 * The coaster's loop: Parky turns about its centre, so the car's wheels, `r` below it, run round
 * the inner rail; the outer rail runs `gauge` further out. The stylesheet's `.parky-act-coaster`
 * turns about the same point.
 */
export const LOOP = { x: 24, y: 16, r: 33, gauge: 2.4 } as const;

/** The rides Parky can take; `coaster` is the loop, drawn and turned by the stylesheet. */
export const RIDES = ['coaster', 'launch', 'hills', 'tower', 'flume', 'teacups'] as const;

/** One of {@link RIDES}. */
export type ParkyRide = (typeof RIDES)[number];

/** Whether a name is one of Parky's rides. */
export function isRide(value: string | null | undefined): value is ParkyRide {
  return (RIDES as readonly string[]).includes(value ?? '');
}

/**
 * A moment of a ride: the wheels' place, the car's tilt (degrees, clockwise), how far into the ride
 * (0 to 1), and optionally a squash, how visible Parky is and his airtime: how far he floats up off
 * his seat (units), while the car stays on the rail.
 */
export interface RideStop {
  x: number;
  y: number;
  angle: number;
  at: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  lift?: number;
}

/** How far a ride takes Parky and its rails to the left and up, in the drawing's units. */
export interface RideReach {
  left: number;
  top: number;
}

/** A ride the component plays: the car's stops, the rails' path, and how the hat lifts off. */
export interface RideMotion {
  stops: RideStop[];
  track: string;
  /** The hat's lift above the head (units) at moments of the ride, for the free fall. */
  hat?: { at: number; lift: number }[];
  /** Where the boat hits the water and when, for the splash drawn there. */
  splash?: { at: number; x: number; y: number };
  reach: RideReach;
}

interface Point {
  x: number;
  y: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

function trackOf(points: readonly Point[]): string {
  return `M${points.map((point) => `${round(point.x)} ${round(point.y)}`).join('L')}`;
}

/** Sixteen points round an ellipse, or round a circle without `ry`. */
function ring(cx: number, cy: number, rx: number, ry = rx): Point[] {
  return Array.from({ length: 16 }, (_, i) => ({
    x: cx + rx * Math.cos((i * Math.PI) / 8),
    y: cy + ry * Math.sin((i * Math.PI) / 8),
  }));
}

/**
 * Parky in its car at rest, as points round the outline `parky-logo.tsx` draws: the bubble and its
 * tail, the Ferris wheel out to its cabins' edge, the car and its two wheels. A ride reaches as far
 * as these go.
 */
const FIGURE: Point[] = [
  ...ring(24, 25.2, 20, 18.2),
  { x: 7.5, y: 46 },
  ...ring(HUB.x, HUB.y, RIM + 1.7),
  { x: 7, y: 38 },
  { x: 41, y: 38 },
  { x: 9.5, y: 45.5 },
  { x: 38.5, y: 45.5 },
  ...ring(14, REST.y - 2, 2),
  ...ring(34, REST.y - 2, 2),
];

/** Half the widest rail's stroke, the tower's mast. */
const RAIL_EDGE = 1.6;

/**
 * Where a stop puts a point of the drawing: squashed, floated up by the airtime, turned about the
 * wheels, then moved; the same order as {@link rideKeyframe}.
 */
function placed(point: Point, stop: RideStop): Point {
  const dx = (point.x - REST.x) * (stop.scaleX ?? 1);
  const dy = (point.y - REST.y) * (stop.scaleY ?? 1) - (stop.lift ?? 0);
  const turn = (stop.angle * Math.PI) / 180;
  return {
    x: stop.x + dx * Math.cos(turn) - dy * Math.sin(turn),
    y: stop.y + dx * Math.sin(turn) + dy * Math.cos(turn),
  };
}

/** The reach of a ride played along `rails`; where Parky has faded out, only the rails count. */
function reachOf(stops: readonly RideStop[], rails: readonly Point[]): RideReach {
  const points = [
    ...stops
      .filter((stop) => stop.opacity !== 0)
      .flatMap((stop) => FIGURE.map((point) => placed(point, stop))),
    ...rails.map((point) => ({ x: point.x - RAIL_EDGE, y: point.y - RAIL_EDGE })),
  ];
  return {
    left: round(Math.min(...points.map((point) => point.x))),
    top: round(Math.min(...points.map((point) => point.y))),
  };
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

/**
 * Camel-back hills to the left: from `x0` to `x1`, `height` high, as points with their tilt. Over
 * the crest Parky floats up to `airtime` off his seat, only near the top.
 */
function hill(x0: number, x1: number, height: number, airtime = 0, count = 10) {
  const width = x0 - x1;
  return Array.from({ length: count + 1 }, (_, i) => {
    const u = i / count;
    const slope = (height * Math.PI * Math.sin(2 * Math.PI * u)) / width;
    const up = (1 - Math.cos(2 * Math.PI * u)) / 2;
    return {
      x: x0 - width * u,
      y: REST.y - height * up,
      angle: (Math.atan(slope) * 180) / Math.PI,
      lift: round(airtime * up ** 3),
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
  const stops: RideStop[] = [
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
  ];
  const rails = [{ x: REST.x + 12, y: REST.y }, ...curve, { x: corner.x, y: top.y - 9 }];
  return { stops, track: trackOf(rails), reach: reachOf(stops, rails) };
}

/**
 * Airtime hills: over two camel-backs to the left and out of sight, then back in from the right,
 * as if the circuit ran on behind the page, braking into the station.
 */
function hills(): RideMotion {
  const first = hill(10, -50, 30, 7);
  const second = hill(-50, -100, 20, 5).slice(1);
  const away = [
    { x: REST.x, y: REST.y, angle: 0 },
    ...first,
    ...second,
    { x: -150, y: REST.y, angle: 0 },
  ];
  const run = timed(away, 0.08, 0.62, REST.y - 30);
  run[run.length - 1].opacity = 0;
  const stops: RideStop[] = [
    { ...REST, angle: 0, at: 0 },
    { x: REST.x + 3, y: REST.y, angle: 0, at: 0.04 },
    ...run.map((stop) => ({ ...stop, opacity: stop.opacity ?? 1 })),
    { x: REST.x + 70, y: REST.y, angle: 0, at: 0.64, opacity: 0 },
    { x: REST.x + 40, y: REST.y, angle: 0, at: 0.72, opacity: 1 },
    { x: REST.x - 4, y: REST.y, angle: -6, at: 0.84, opacity: 1 },
    { x: REST.x + 1, y: REST.y, angle: 3, at: 0.91, opacity: 1 },
    { ...REST, angle: 0, at: 1, opacity: 1 },
  ];
  const rails = [{ x: REST.x + 40, y: REST.y }, ...away.slice(1)];
  return { stops, track: trackOf(rails), reach: reachOf(stops, rails) };
}

/** The free fall: pulled up the tower, a shiver at the top, the drop, the brakes. */
function tower(): RideMotion {
  const topY = -55;
  const drop = Array.from({ length: 6 }, (_, i) => {
    const s = (i + 1) / 6;
    return {
      x: REST.x,
      y: topY + (REST.y - topY) * s * s,
      angle: 0,
      at: round(0.58 + 0.08 * s),
      lift: round(7 * Math.sin(Math.PI * s)),
    };
  });
  const stops: RideStop[] = [
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
  ];
  const rails = [
    { x: REST.x, y: REST.y + 3 },
    { x: REST.x, y: topY - 30 },
  ];
  return {
    stops,
    track: trackOf(rails),
    reach: reachOf(stops, rails),
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

/**
 * The log flume: slowly up a lift hill to the left, a float over the crest, the plunge, a splash at
 * the bottom; the boat drifts on out of sight and floats back in from the right.
 */
function flume(): RideMotion {
  const lift = { x: -29.8, y: 25, angle: 30 };
  const crest = { x: -37, y: 23.5, angle: 0 };
  const bottom = { x: -59, y: REST.y, angle: -10 };
  const stops: RideStop[] = [
    { ...REST, angle: 0, at: 0 },
    { x: 14, y: REST.y, angle: 0, at: 0.08 },
    { x: 10, y: 48, angle: 15, at: 0.11 },
    { ...lift, at: 0.42 },
    { x: -33.5, y: 23.6, angle: 10, at: 0.46 },
    { ...crest, at: 0.5, lift: 3 },
    { x: -40, y: 24.6, angle: -35, at: 0.53, lift: 6 },
    { x: -55.3, y: 46.5, angle: -55, at: 0.58, lift: 2 },
    { ...bottom, at: 0.6, scaleX: 1.12, scaleY: 0.88 },
    { x: -64, y: REST.y, angle: 0, at: 0.64 },
    { x: -80, y: REST.y, angle: 0, at: 0.7, opacity: 0 },
    { x: REST.x + 40, y: REST.y, angle: 0, at: 0.72, opacity: 0 },
    { x: REST.x + 26, y: REST.y, angle: 0, at: 0.8 },
    { x: REST.x + 8, y: REST.y - 0.8, angle: -3, at: 0.88 },
    { x: REST.x + 2, y: REST.y, angle: 2, at: 0.94 },
    { ...REST, angle: 0, at: 1 },
  ].map((stop) => ({ ...stop, opacity: stop.opacity ?? 1 }));
  const rails = [
    { x: REST.x + 40, y: REST.y },
    { x: 14, y: REST.y },
    { x: 10, y: 48 },
    lift,
    { x: -33.5, y: 23.6 },
    crest,
    { x: -40, y: 24.6 },
    { x: -55.3, y: 46.5 },
    bottom,
    { x: -72, y: REST.y },
  ];
  return {
    stops,
    track: trackOf(rails),
    reach: reachOf(stops, rails),
    splash: { at: 0.6, x: bottom.x, y: REST.y },
  };
}

/** The teacups' turntable, which the cup circles: its middle and the cup's way round it. */
export const TURNTABLE = { x: REST.x - 13, y: REST.y, rx: 13, ry: 4.5, rim: 6 } as const;

/**
 * The teacups: twice round the turntable to the left of the station, the cup swaying as it goes
 * and a little smaller at the back, then a wobble to rest.
 */
function teacups(): RideMotion {
  const { x, y, rx, ry, rim } = TURNTABLE;
  const steps = 48;
  const laps: RideStop[] = Array.from({ length: steps + 1 }, (_, i) => {
    const turn = (i / steps) * 4 * Math.PI;
    const back = Math.sin(turn);
    return {
      x: round(x + rx * Math.cos(turn)),
      y: round(y - ry * back),
      angle: round(6 * Math.sin(2 * turn)),
      at: round(0.06 + (0.8 * i) / steps),
      scaleX: round(1 - 0.12 * back),
      scaleY: round(1 - 0.12 * back),
    };
  });
  const stops: RideStop[] = [
    { ...REST, angle: 0, at: 0 },
    ...laps,
    { ...REST, angle: -5, at: 0.92 },
    { ...REST, angle: 3, at: 0.96 },
    { ...REST, angle: 0, at: 1 },
  ];
  const outer = { rx: rx + rim, ry: ry + rim / 2 };
  return {
    stops,
    track:
      `M${x - outer.rx} ${y}a${outer.rx} ${outer.ry} 0 1 0 ${2 * outer.rx} 0` +
      `a${outer.rx} ${outer.ry} 0 1 0 ${-2 * outer.rx} 0Z`,
    reach: reachOf(stops, ring(x, y, outer.rx, outer.ry)),
  };
}

/** The rides played from these stops; the loop is the stylesheet's. */
export const RIDE_MOTION: Record<Exclude<ParkyRide, 'coaster'>, RideMotion> = {
  launch: launch(),
  hills: hills(),
  tower: tower(),
  flume: flume(),
  teacups: teacups(),
};

/**
 * The loop's reach: Parky turns all the way round the loop's centre, never further out than the
 * outer rail or its own farthest point.
 */
const LOOP_EDGE = Math.max(
  LOOP.r + LOOP.gauge + RAIL_EDGE,
  ...FIGURE.map((point) => Math.hypot(point.x - LOOP.x, point.y - LOOP.y))
);
const LOOP_REACH: RideReach = { left: round(LOOP.x - LOOP_EDGE), top: round(LOOP.y - LOOP_EDGE) };

/**
 * Whether a ride keeps Parky and its rails on screen, for a drawing whose box (its
 * `getBoundingClientRect`) starts `left` and `top` pixels into the viewport and is `width` pixels
 * wide. Only those two edges count: every ride heads up or to the left, away from the corner the
 * button sits in; to the right the loop reaches only a little past the drawing, and the hills come
 * back from off the page on purpose. In the open window Parky sits in the top left corner instead,
 * where the launch and the free fall would run off the screen.
 */
export function rideFits(
  ride: ParkyRide,
  box: { left: number; top: number; width: number }
): boolean {
  const reach = ride === 'coaster' ? LOOP_REACH : RIDE_MOTION[ride].reach;
  const unit = box.width / VIEW;
  return box.left + reach.left * unit >= 0 && box.top + reach.top * unit >= 0;
}

/**
 * A stop as a keyframe for Parky in the car, turned about the wheels' resting point. Every frame
 * lists the same functions, the airtime's lift among them, so each interpolates as itself.
 */
export function rideKeyframe(stop: RideStop): Keyframe {
  const transform =
    `translate(${round(stop.x - REST.x)}px, ${round(stop.y - REST.y)}px) ` +
    `rotate(${round(stop.angle)}deg) translate(0px, ${-(stop.lift ?? 0) || 0}px) ` +
    `scale(${stop.scaleX ?? 1}, ${stop.scaleY ?? 1})`;
  return {
    offset: stop.at,
    transform,
    ...(stop.opacity !== undefined && { opacity: stop.opacity }),
  };
}
