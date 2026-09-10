/**
 * Candidate coaster layouts, as piece lists with two free parameters each.
 *
 * A design here is not a layout yet: two of its numbers are unknown and `game-solve-layout.mjs`
 * finds them by driving the circuit's end-to-start error to zero. Once solved, the printed piece
 * list is pasted into `lib/game/track/layouts.ts` with the measured figures in its note.
 *
 * Kept out of `lib/game/` on purpose: this is a workbench, not shipped content, and `lib/game`
 * carries a lint rule about what may live in it.
 */

/**
 * A compact family twister for a STARTER PLOT.
 *
 * The three bundled layouts are out-and-backs of 900-980 m in boxes 390-400 m long, which is a
 * park-defining object rather than a plot occupant: the demo park's reserved coaster shelf is
 * 58 x 48 m and the smallest of the three is 212.6 m long. `docs/game/STATUS.json` has recommended
 * a fourth for exactly this since the mismatch was first measured.
 *
 * The trick a compact layout turns is **height instead of distance**: a descending helix spends
 * 140 m of track inside a 24 m circle, where a turnaround of the same track length reaches 60 m
 * out and back. So this is a lift, one drop, a long descending helix, a small hill, a second short
 * helix the other way to unwind the heading, and the brake run home.
 *
 * The heading closes BY CONSTRUCTION, which is what makes it solvable with two straights: the two
 * helices are +1.5 and -0.5 turns and the two curves are +90 and -90, so the total is exactly one
 * lap. What is left for the solver is the end POINT, and the two free straights are perpendicular
 * to each other, which is why the Jacobian is well conditioned.
 */
const compactTwister = {
  ride: 'core-classic:family-invert',
  style: 'core-classic:steel-tube',
  train: 'core-classic:steel-open-5',
  free: ['runOut', 'returnLeg'],
  start: { runOut: 14, returnLeg: 20 },
  bounds: { runOut: [3, 140], returnLeg: [3, 140] },
  pieces: (v) => [
    { element: 'station', params: { length: 16 } },
    { element: 'transport', params: { length: 8, speed: 2 } },
    { element: 'lift-hill', params: { height: 17, angle: 30, radius: 13, speed: 2.5 } },
    { element: 'drop', params: { height: 12, angle: 44, crestRadius: 13, pullout: 16 } },
    { element: 'helix', params: { turns: 1.5, radius: 12, drop: 7, hand: 1 } },
    { element: 'straight', params: { length: v.runOut } },
    { element: 'curve', params: { angle: 90, radius: 12 } },
    { element: 'airtime-hill', params: { height: 4, g: 0.1, gLoad: 1.4 } },
    { element: 'helix', params: { turns: 0.5, radius: 11, drop: 3, hand: -1 } },
    { element: 'straight', params: { length: v.returnLeg } },
    { element: 'curve', params: { angle: -90, radius: 12 } },
    { element: 'brake-run', params: { length: 18, speed: 4 } },
    { element: 'level', params: { length: 10 } },
  ],
};

/**
 * Second attempt, and the first one's measurement is why it exists.
 *
 * v1 put the station, the lift and the drop in one line and the solver answered honestly: it
 * needed a 97 m run-out and produced 528 m in a 77 x 163 m box. The arithmetic is not subtle —
 * a 16 m station plus 8 m of transport plus a 17 m lift at 30 degrees (29 m of horizontal run)
 * plus a drop's 16 m pullout is 69 m in a straight line, against a plot 48 m deep. **A compact
 * layout cannot have its lift in line with its station.**
 *
 * So the lift turns off the station: quarter turn out, climb along the plot's long side, quarter
 * turn back, and the drop falls the way it came. That is how a wild mouse and a family twister
 * are actually laid out, and it is the difference between a footprint set by the lift's length
 * and one set by its height.
 */
const compactTwister2 = {
  ride: 'core-classic:family-invert',
  style: 'core-classic:steel-tube',
  train: 'core-classic:steel-open-5',
  free: ['runOut', 'returnLeg'],
  start: { runOut: 12, returnLeg: 14 },
  bounds: { runOut: [2, 90], returnLeg: [2, 90] },
  pieces: (v) => [
    { element: 'station', params: { length: 14 } },
    { element: 'curve', params: { angle: 90, radius: 9 } },
    { element: 'transport', params: { length: 5, speed: 2 } },
    { element: 'lift-hill', params: { height: 14, angle: 38, radius: 10, speed: 2.5 } },
    { element: 'curve', params: { angle: 90, radius: 9 } },
    { element: 'drop', params: { height: 10, angle: 45, crestRadius: 10, pullout: 12 } },
    { element: 'helix', params: { turns: 1.5, radius: 10, drop: 5, hand: -1 } },
    { element: 'straight', params: { length: v.runOut } },
    { element: 'curve', params: { angle: -90, radius: 9 } },
    { element: 'airtime-hill', params: { height: 3, g: 0.1, gLoad: 1.4 } },
    { element: 'straight', params: { length: v.returnLeg } },
    { element: 'curve', params: { angle: -90, radius: 9 } },
    { element: 'helix', params: { turns: 0.5, radius: 9, drop: 2, hand: -1 } },
    { element: 'brake-run', params: { length: 15, speed: 4 } },
    { element: 'level', params: { length: 8 } },
  ],
};

/**
 * Third attempt, and again the previous measurement is the design note.
 *
 * v2 turned the lift off the station and the box went from 77 x 163 m to 99 x 60 — but the solver
 * pinned `runOut` at its floor and still reported 15.5 m of overshoot in z, i.e. it wanted a
 * NEGATIVE straight. That is a topology answer, not a numbers answer: after a 1.5-turn helix the
 * train was heading BACK towards the station, so the free straight and the brake run pushed the
 * end point the same way and nothing in the design could pull it back.
 *
 * v3 turns the helix one full turn instead of one and a half, which leaves the train heading away
 * from the station, and swings the two closing curves the other way so the return leg travels
 * back along x. Both free straights now SUBTRACT from the residual, which is the property that
 * makes a two-parameter solve possible at all.
 */
const compactTwister3 = {
  ride: 'core-classic:family-invert',
  style: 'core-classic:steel-tube',
  train: 'core-classic:steel-open-5',
  free: ['runOut', 'returnLeg'],
  start: { runOut: 14, returnLeg: 16 },
  bounds: { runOut: [2, 90], returnLeg: [2, 90] },
  pieces: (v) => [
    { element: 'station', params: { length: 12 } },
    { element: 'curve', params: { angle: 90, radius: 8 } },
    { element: 'transport', params: { length: 5, speed: 2 } },
    { element: 'lift-hill', params: { height: 16, angle: 38, radius: 10, speed: 2.5 } },
    { element: 'curve', params: { angle: 90, radius: 8 } },
    { element: 'drop', params: { height: 12, angle: 45, crestRadius: 10, pullout: 12 } },
    { element: 'helix', params: { turns: 1, radius: 10, drop: 4, hand: -1 } },
    { element: 'straight', params: { length: v.runOut } },
    { element: 'curve', params: { angle: 90, radius: 8 } },
    { element: 'airtime-hill', params: { height: 3, g: 0.1, gLoad: 1.4 } },
    { element: 'straight', params: { length: v.returnLeg } },
    { element: 'curve', params: { angle: 90, radius: 8 } },
    { element: 'brake-run', params: { length: 14, speed: 4 } },
    { element: 'level', params: { length: 6 } },
  ],
};

/**
 * Fourth attempt. v3 stalled ten metres in, and that is the design note.
 *
 * v2 and v3 both put a curve between the station and the lift to keep the lift off the plot's
 * long axis — and the physics answered `stall: the train runs out of energy 10 m in and rolls
 * back`, because a curve has no drive: the station releases at walking pace and the train has to
 * coast twelve metres of arc before the chain picks it up. **The drive sections have to be
 * contiguous from the station to the top of the lift.**
 *
 * So the lift goes back in line with the station and the FOLDING happens after it, where the
 * train has 14 m of potential energy to spend. Station, transport and lift are 35.7 m of +z
 * against a 48 m plot; everything after the crest turns.
 *
 * **This is the best of the four and it still does not ship.** It closes properly — the solver
 * reaches 1.71 m of residual in five iterations, against 0.85, 1.33 and 2.17 for the three
 * layouts that shipped — and it is 371 m, which is the right length. Two things are wrong and
 * both are measured:
 *
 * - The box is **70.6 x 110.4 m**, because the solve wants a 64.7 m out-leg. Under a plot depth
 *   of 48 that is not close.
 * - `stall: the train runs out of energy 19 m in`. Moving the lift to the gentler, proven
 *   parameters of `kleiner-kreisel` (28 degrees, radius 16) does not fix it — the stall simply
 *   MOVES to 59 m, which is the curve after the crest. That is the finding: **after the crest
 *   the train has only chain speed and cannot coast through a curve before it drops.** A fifth
 *   attempt that put the turn inside the descent broke the heading closure instead (-135 degrees,
 *   5.63 g, 188 s) and is not kept.
 *
 * Constraint (1) — a lift in line with the station eats 69 m of a 48 m plot — and this one are
 * very nearly contradictory in the element table as it stands, and that is the real result of
 * these four attempts: **there is no curved drop.** `drop` descends straight and `helix` turns at
 * a constant gradient off a level entry; nothing spends the crest's height and its heading at the
 * same time. A `curved-drop` element (a drop whose pullout carries an arc) is what a compact
 * layout is missing, and it is an entry in `elements.ts` rather than a layout.
 */
const compactTwister4 = {
  ride: 'core-classic:family-invert',
  style: 'core-classic:steel-tube',
  train: 'core-classic:steel-open-5',
  free: ['outLeg', 'returnLeg'],
  start: { outLeg: 10, returnLeg: 12 },
  bounds: { outLeg: [2, 70], returnLeg: [2, 70] },
  pieces: (v) => [
    { element: 'station', params: { length: 12 } },
    { element: 'transport', params: { length: 7, speed: 2 } },
    { element: 'lift-hill', params: { height: 14, angle: 40, radius: 10, speed: 2.5 } },
    { element: 'curve', params: { angle: 90, radius: 9 } },
    { element: 'drop', params: { height: 10, angle: 45, crestRadius: 10, pullout: 10 } },
    { element: 'helix', params: { turns: 1, radius: 9, drop: 4, hand: -1 } },
    { element: 'curve', params: { angle: 90, radius: 9 } },
    { element: 'straight', params: { length: v.outLeg } },
    { element: 'curve', params: { angle: 90, radius: 9 } },
    { element: 'airtime-hill', params: { height: 3, g: 0.1, gLoad: 1.4 } },
    { element: 'straight', params: { length: v.returnLeg } },
    { element: 'curve', params: { angle: 90, radius: 9 } },
    { element: 'brake-run', params: { length: 14, speed: 4 } },
    { element: 'level', params: { length: 6 } },
  ],
};

export const DESIGNS = {
  'compact-twister': compactTwister,
  'compact-twister-2': compactTwister2,
  'compact-twister-3': compactTwister3,
  'compact-twister-4': compactTwister4,
};
