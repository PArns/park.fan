/**
 * The shapes the track module stores, exposes and serialises. Pure types plus the two small
 * constants everything agrees on; Babylon-free and safe on the worker.
 */

import type { Vec3 } from '../core/types';

/** One element instance in a layout: an element id and the parameters it was placed with. */
export interface TrackPiece {
  element: string;
  params?: Record<string, number>;
}

/** What a stretch of track does to a train that is on it. */
export type DriveKind = 'station' | 'lift' | 'launch' | 'brake' | 'block' | 'transport';

export interface DriveSection {
  kind: DriveKind;
  /** Arc length range, metres from the start of the layout. */
  from: number;
  to: number;
  /**
   * Chain/cable speed for a lift, target speed for a brake or a launch, m/s.
   * A `station` section holds the train; `transport` moves it at walking pace.
   */
  speed: number;
}

/**
 * A coaster layout as it lives in `Entity.data` — the pieces, not the points.
 *
 * Storing the piece list rather than the baked spline is what makes a saved park a few hundred
 * bytes per coaster instead of a few hundred kilobytes, and it is what lets the geometry improve
 * without invalidating a save: rebuild the same pieces with a better `loop` and the loop gets
 * better. The cost is that both threads have to run the same generator, which is why everything
 * from `vec.ts` to `build.ts` is pure.
 */
export interface TrackData {
  /** `pack:id` of a `trackStyles` entry. */
  style: string;
  /** `pack:id` of a `trainStyles` entry, for the heartline height and the physics. */
  train?: string;
  /** `pack:id` of the `rides` entry this layout belongs to, for limits and lift speed. */
  ride?: string;
  /** Where the first piece starts, world metres. */
  origin: Vec3;
  /** Heading at `origin`, radians about +Y. */
  yaw: number;
  /** A circuit returns to its station; a shuttle does not. */
  closed: boolean;
  pieces: TrackPiece[];
  /** Paint override; otherwise the style's own colour. */
  color?: string;
}

/**
 * Heartline height above the rail plane, metres.
 *
 * 1.1 m is a seated rider's chest on a sit-down train. It belongs on the train style — an inverted
 * coaster hangs its riders BELOW the rails and would want a negative number — but `trainStyleSchema`
 * has no field for it, so it is a constant here and a request in `docs/game/requests/track.md`.
 */
export const HEARTLINE_HEIGHT = 1.1;

/** Comfort limits used when a ride definition does not carry its own. */
export const DEFAULT_LIMITS = { vertical: 5.0, lateral: 2.6, negative: -1.6 } as const;
