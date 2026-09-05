/**
 * Units and the numbers a builder must not invent.
 *
 * Metres, +Y up, right-handed — the same convention glTF uses, so an imported model needs no
 * axis fix-up and a "why is this rotated 90°" bug never happens.
 */

export interface Vec2 {
  x: number;
  z: number;
}
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Free placement is the default; snapping is opt-in and these are the two steps it offers. */
export const SNAP_METRES = 0.25;
export const SNAP_DEGREES = 15;

/** Terrain heightfield cell size. Sculpting works in metres and samples this bilinearly. */
export const TERRAIN_CELL_M = 1;

/** Path widths, in metres. The default is the middle one. */
export const PATH_WIDTHS = [2, 4, 6, 8] as const;
export const PATH_WIDTH_DEFAULT = 4;

/** Pool depth zones, in metres. Named because a lifeguard's rules key off the name, not the number. */
export const POOL_DEPTHS = {
  wading: 0.4,
  shallow: 0.9,
  swimming: 1.6,
  diving: 3.6,
} as const;
export type PoolDepthZone = keyof typeof POOL_DEPTHS;

/** A guest, for camera framing, collision radius and the crowd instance bounds. */
export const GUEST_HEIGHT_M = 1.72;
export const GUEST_RADIUS_M = 0.225;

/** Simulation clock. 20 Hz, fixed, never scaled by real elapsed time inside a tick. */
export const TICK_HZ = 20;
export const TICK_MS = 1000 / TICK_HZ;

/**
 * In-game minutes per simulated second at speed 1.
 *
 * A park day of 12 opening hours runs in 12 real minutes at 1×, which is the pace at which a
 * queue visibly fills and a guest's hunger visibly moves without the player waiting on either.
 */
export const GAME_MINUTES_PER_SECOND = 1;
export const TICKS_PER_GAME_MINUTE = TICK_HZ / GAME_MINUTES_PER_SECOND;
export const TICKS_PER_GAME_DAY = TICKS_PER_GAME_MINUTE * 60 * 24;

export const SIM_SPEEDS = [0, 1, 2, 4, 8] as const;
export type SimSpeed = (typeof SIM_SPEEDS)[number];

export function snapMetres(value: number, step: number = SNAP_METRES): number {
  return Math.round(value / step) * step;
}

export function snapDegrees(deg: number, step: number = SNAP_DEGREES): number {
  return Math.round(deg / step) * step;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Shortest-arc angle interpolation, radians. Guests turn the short way round. */
export function lerpAngle(a: number, b: number, t: number): number {
  let delta = (b - a) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return a + delta * t;
}

export function distance2(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/** Money is integer cents everywhere. A float currency accumulates a rounding drift over a park-year. */
export type Cents = number;

export function formatCents(cents: Cents, locale = 'de-DE', currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

/** In-game clock derived from the tick. Pure, so the HUD and the sim cannot disagree. */
export interface GameClock {
  day: number;
  hour: number;
  minute: number;
  /** Minutes since midnight, for anything comparing against opening hours. */
  minuteOfDay: number;
}

export function clockFromTick(tick: number): GameClock {
  const totalMinutes = Math.floor(tick / TICKS_PER_GAME_MINUTE);
  const day = Math.floor(totalMinutes / (60 * 24));
  const minuteOfDay = totalMinutes - day * 60 * 24;
  return {
    day,
    hour: Math.floor(minuteOfDay / 60),
    minute: minuteOfDay % 60,
    minuteOfDay,
  };
}
