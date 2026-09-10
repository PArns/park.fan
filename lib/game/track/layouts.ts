/**
 * Three complete coaster layouts, as piece lists.
 *
 * They are here rather than in `showcase.ts` because they are the module's worked examples: a
 * layout is what the element table is FOR, and a change to an element that quietly ruins one of
 * these should be visible in `selftest.mjs` rather than in a screenshot two rounds later.
 *
 * **Every number in them was solved, not typed.** A circuit closes when the ground distance out
 * equals the ground distance back, and no human gets that within a metre by eye — so each layout
 * was built open, its residual measured end-to-start, and two lengths driven to zero by a
 * two-variable Newton step (`Nordwind`: a straight after the loop and an s-bend offset;
 * `Alte Mühle`: the return straight; `Kleiner Kreisel`: an s-bend and a straight). The residuals
 * that remain are **0.85 m, 1.33 m and 2.17 m** over 979 m, 900 m and 610 m, and `build.ts` blends
 * those away over the last quarter of the track.
 *
 * **A layout is tuned for a train.** The ops shape themselves from a running speed estimate, and
 * that estimate reads the train's drag area and rolling resistance — so a car 5 cm narrower builds
 * a different track. Two of these three closed five metres worse under a hand-written train spec
 * than under the one the registry resolves for them, which is why `selftest.mjs` validates them
 * through `buildOptionsFor(registry, data)` and not through a spec of its own.
 *
 * All three complete with no issues: `Nordwind` peaks at 4.20 g in its loop against a 5.0 limit,
 * and `Alte Mühle` spends **12.0 seconds** below 0.3 g, which is what an out-and-back is for.
 */

import type { TrackData, TrackPiece } from './types';
import type { Vec3 } from '../core/types';

export interface LayoutPreset {
  id: string;
  name: string;
  /** `pack:id` of the ride definition this layout is drawn for. */
  ride: string;
  style: string;
  train: string;
  pieces: TrackPiece[];
  /** Where the station starts and which way it faces, for the showcase. */
  origin: Vec3;
  yaw: number;
  /** One line for the report and for a future build-menu blurb. */
  note: string;
  /** Fewer trains than the ride allows, when the circuit is too short for them. */
  trainsMax?: number;
}

/**
 * A steel looper: 40 m chain lift, a 46 m first drop into a clothoid loop, an overbanked return
 * leg with a zero-g roll and a corkscrew, a mid-course block and a brake run home.
 */
const NORDWIND: LayoutPreset = {
  id: 'nordwind',
  name: 'Nordwind',
  ride: 'core-classic:steel-hyper',
  style: 'core-classic:steel-box',
  train: 'core-classic:steel-open-7',
  origin: [-185, 9, -155],
  yaw: 0,
  note: '979 m · 104 km/h · 46 m drop · loop, zero-g roll, corkscrew · 4.20 g peak · 88 s',
  pieces: [
    { element: 'station', params: { length: 24 } },
    { element: 'transport', params: { length: 14, speed: 2.5 } },
    { element: 'lift-hill', params: { height: 40, angle: 28, radius: 22, speed: 4 } },
    { element: 'drop', params: { height: 46, angle: 53, crestRadius: 24, pullout: 34 } },
    { element: 'loop', params: { g: 3.4 } },
    { element: 'straight', params: { length: 21 } },
    { element: 'turnaround', params: { radius: 30, hand: 1 } },
    { element: 'airtime-hill', params: { height: 13, g: -0.2 } },
    { element: 'zero-g-roll', params: { height: 12, g: 0.2, hand: 1 } },
    { element: 's-bend', params: { offset: 16.4, radius: 50, hand: 1 } },
    { element: 'corkscrew', params: { radius: 5, turns: 1, g: 3, hand: -1 } },
    { element: 'block-brake', params: { length: 24, speed: 11 } },
    { element: 'turnaround', params: { radius: 30, hand: 1 } },
    { element: 'brake-run', params: { length: 30, speed: 5 } },
    { element: 'level', params: { length: 16 } },
  ],
};

/**
 * A wooden out-and-back: one big hill out, a flat-ish turnaround, and eight bunny hops home.
 *
 * The turnarounds carry `bankFactor: 0.78` on purpose — a wooden coaster is deliberately
 * under-banked, and the 0.44 g of lateral that leaves in the turn is where its reputation for
 * rattling comes from. Full banking would make it a smoother ride and a worse woodie.
 */
const ALTE_MUEHLE: LayoutPreset = {
  id: 'alte-muehle',
  name: 'Alte Mühle',
  ride: 'core-classic:wooden-classic',
  style: 'core-classic:wood',
  train: 'core-classic:wood-6',
  origin: [40, 9, -165],
  yaw: 0,
  note: '900 m · 82 km/h · 30 m drop · nine hops · 12.0 s of airtime · 104 s',
  pieces: [
    { element: 'station', params: { length: 22 } },
    { element: 'transport', params: { length: 12, speed: 2 } },
    { element: 'lift-hill', params: { height: 30, angle: 27, radius: 20, speed: 3 } },
    { element: 'drop', params: { height: 29, angle: 50, crestRadius: 20, pullout: 28 } },
    { element: 'airtime-hill', params: { height: 12, g: -0.25, gLoad: 2 } },
    { element: 'bunny-hop', params: { height: 7, g: -0.35 } },
    { element: 'turnaround', params: { radius: 24, hand: 1, bankFactor: 0.78 } },
    { element: 'bunny-hop', params: { height: 10, g: -0.35 } },
    { element: 'straight', params: { length: 26 } },
    { element: 'bunny-hop', params: { height: 9, g: -0.35 } },
    { element: 'bunny-hop', params: { height: 8, g: -0.35 } },
    { element: 'bunny-hop', params: { height: 6, g: -0.3 } },
    { element: 'bunny-hop', params: { height: 5, g: -0.3 } },
    { element: 'bunny-hop', params: { height: 4, g: -0.3 } },
    { element: 'bunny-hop', params: { height: 3.5, g: -0.25 } },
    { element: 'bunny-hop', params: { height: 3, g: -0.25 } },
    { element: 'straight', params: { length: 62 } },
    { element: 'turnaround', params: { radius: 24, hand: 1, bankFactor: 0.78 } },
    { element: 'brake-run', params: { length: 28, speed: 5 } },
    { element: 'level', params: { length: 14 } },
  ],
};

/** A family twister: 19 m lift, a descending helix and two low hills, nothing over 2.2 g. */
const KLEINER_KREISEL: LayoutPreset = {
  id: 'kleiner-kreisel',
  name: 'Kleiner Kreisel',
  ride: 'core-classic:family-invert',
  style: 'core-classic:steel-tube',
  train: 'core-classic:steel-open-5',
  origin: [-62, 8, -80],
  yaw: 0,
  note: '610 m · 58 km/h · 19 m lift · descending helix · 2.15 g peak · 72 s',
  pieces: [
    { element: 'station', params: { length: 18 } },
    { element: 'transport', params: { length: 10, speed: 2 } },
    { element: 'lift-hill', params: { height: 19, angle: 26, radius: 16, speed: 2.5 } },
    { element: 'drop', params: { height: 13, angle: 42, crestRadius: 16, pullout: 22 } },
    { element: 'helix', params: { turns: 1.5, radius: 19, drop: 6, hand: 1 } },
    { element: 'airtime-hill', params: { height: 5, g: 0.1, gLoad: 1.4 } },
    { element: 's-bend', params: { offset: 8.7, radius: 34, hand: -1 } },
    { element: 'airtime-hill', params: { height: 4, g: 0.15, gLoad: 1.4 } },
    { element: 'straight', params: { length: 16.8 } },
    { element: 'turnaround', params: { radius: 26, hand: 1 } },
    { element: 'brake-run', params: { length: 22, speed: 4 } },
    { element: 'level', params: { length: 12 } },
  ],
};

/**
 * The starter-plot layout, and the first one in this file that was solved by a TOOL.
 *
 * The three above are out-and-backs of 900-980 m in boxes 390-400 m long — a park-defining
 * object rather than a plot occupant, which is why the demo park's reserved 58 x 48 m coaster
 * shelf could hold none of them. This one is 345 m in **56 x 112 m**: the width fits the shelf
 * and the depth still overhangs it, onto open ground the fit check clears.
 *
 * `scripts/game-solve-layout.mjs` drove the closure to **0.089 m of residual in four
 * iterations**, against the 0.85, 1.33 and 2.17 m the three above were hand-solved to. Six
 * designs went through it and the five that failed are kept in `scripts/game-layout-designs.mjs`
 * with what each one measured, because the reasons are the interesting part. Three of them are
 * rules about this element table that nothing else writes down:
 *
 * - **A curve carries no drive.** Turning the lift off the station to save depth stalls the
 *   train ten metres in, at walking pace, before the chain can pick it up. Station, transport
 *   and lift have to be contiguous — which is where the 42 m of straight +z comes from.
 * - **A train leaves the crest with chain speed and nothing else**, so it cannot coast through a
 *   flat curve before it drops. The descent has to start at the crest.
 * - **`helix` with a fractional `turns` IS a curved drop** — its ops pitch the nose over, turn
 *   while pitched and level out. That is what resolves the two rules above, and it was missed
 *   for four designs because the conclusion had been read off the element NAMES rather than
 *   their ops.
 *
 * The two numbers that are not round are the solved pair, and neither is a length chosen for
 * looks: 15.51 m of drop-helix radius and 19.43 m of out-leg. The helix's `hand` is +1 against
 * the return path's -1 so their sideways displacements OPPOSE — inverted, the same design leaves
 * 63 m of residual with both parameters pinned at their bounds.
 */
const STARTER_TWISTER: LayoutPreset = {
  id: 'kleiner-wirbel',
  name: 'Kleiner Wirbel',
  ride: 'core-classic:family-invert',
  style: 'core-classic:steel-tube',
  train: 'core-classic:steel-open-5',
  origin: [-62, 8, -80],
  yaw: 0,
  note: '345 m · 56 km/h · 19 m drop · curved drop into a full helix · 2.69 g peak · 45 s',
  // One train. `family-invert` allows two and its 610 m sibling runs two; on 345 m they close to
  // 18.1 m on a 13 m train and one of them never completes a lap. See `TrackData.trainsMax`.
  trainsMax: 1,
  pieces: [
    { element: 'station', params: { length: 12 } },
    { element: 'transport', params: { length: 8, speed: 2 } },
    { element: 'lift-hill', params: { height: 15, angle: 34, radius: 12, speed: 2.5 } },
    // The curved drop: off the crest, no flat to coast, 180 degrees while it falls.
    { element: 'helix', params: { turns: 0.5, radius: 15.512, drop: 11, hand: 1 } },
    { element: 'airtime-hill', params: { height: 2.5, g: 0.2, gLoad: 1.8 } },
    { element: 'helix', params: { turns: 1, radius: 12, drop: 4, hand: -1 } },
    { element: 'straight', params: { length: 19.431 } },
    { element: 'curve', params: { angle: 90, radius: 9 } },
    { element: 'straight', params: { length: 5 } },
    { element: 'curve', params: { angle: 90, radius: 9 } },
    { element: 'brake-run', params: { length: 14, speed: 4 } },
    { element: 'level', params: { length: 6 } },
  ],
};

export const TRACK_LAYOUTS: readonly LayoutPreset[] = [
  NORDWIND,
  ALTE_MUEHLE,
  KLEINER_KREISEL,
  STARTER_TWISTER,
];

export function layoutData(preset: LayoutPreset): TrackData {
  return {
    style: preset.style,
    train: preset.train,
    ride: preset.ride,
    origin: preset.origin,
    yaw: preset.yaw,
    closed: true,
    pieces: preset.pieces,
    ...(preset.trainsMax !== undefined ? { trainsMax: preset.trainsMax } : {}),
  };
}
