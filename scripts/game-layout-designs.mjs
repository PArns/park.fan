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
 * Constraint (1) — a lift in line with the station eats 69 m of a 48 m plot — and this one look
 * contradictory, and the note here used to conclude that the element table has no curved drop and
 * needs a new entry in `elements.ts`. **That was wrong, and v5 below disproves it.** `helix` takes
 * `turns` down to 0.25, so a fractional helix with a large `drop` already IS a curved drop. The
 * conclusion was drawn from the element NAMES; reading their ops answers it.
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

/**
 * Fifth attempt, and it exists because v4's conclusion was WRONG.
 *
 * v4's note says the element table has no curved drop and that a compact layout therefore needs a
 * new entry in `elements.ts`. It does not. `helix` takes `turns` down to **0.25**, and a quarter
 * or a half turn with a large `drop` is exactly a curved drop: its own ops pitch the nose over
 * first (`-atan(drop / (2*pi*radius*turns))`), turn while pitched, and level out. A half turn at
 * radius 10 dropping 11 m is a 19.3-degree descent over 31 m of arc that turns 180 degrees —
 * which is the manoeuvre v4 said was missing, spelled with a parameter rather than with code.
 *
 * Reading the ops rather than the element names is what found it.
 *
 * **Measured, and it solves constraint (4):** with the curved drop off the crest there is no
 * stall at the lift at all — v4 stalled at 19 m and, with gentler lift numbers, at 59 m; v5 gets
 * the train round to 291 m before anything complains. That was the blocker, and it is gone.
 *
 * It still does not ship, and the two reasons are different from every previous attempt's:
 *
 * - The solve leaves **97 m of residual in x** with `returnLeg` pinned at its floor. In this
 *   topology both free straights move the end point mostly along z, so the pair does not span
 *   the plane — the same conditioning failure v3 had, in the other axis. The fix is a different
 *   pair of free parameters, not different values: one of them wants to be a curve's radius or
 *   the transport, which move x.
 * - `-19.7 g at 291 m` and 7.8 g sideways: the airtime hill sits straight after a 14 m curve
 *   that the train now takes far faster than v4's did. An airtime hill is sized from the speed
 *   at its own crest, so it has to be re-parameterised for the speed this layout actually
 *   carries there, or moved.
 *
 * Both are ordinary work with the solver rather than research. What is no longer in the way is
 * the thing four attempts spent themselves on.
 */
const compactTwister5 = {
  ride: 'core-classic:family-invert',
  style: 'core-classic:steel-tube',
  train: 'core-classic:steel-open-5',
  free: ['outLeg', 'returnLeg'],
  start: { outLeg: 10, returnLeg: 12 },
  bounds: { outLeg: [2, 70], returnLeg: [2, 70] },
  pieces: (v) => [
    { element: 'station', params: { length: 12 } },
    { element: 'transport', params: { length: 8, speed: 2 } },
    { element: 'lift-hill', params: { height: 15, angle: 34, radius: 12, speed: 2.5 } },
    // The curved drop: off the crest, no flat to coast, 180 degrees while it falls.
    { element: 'helix', params: { turns: 0.5, radius: 10, drop: 11, hand: -1 } },
    { element: 'helix', params: { turns: 1, radius: 12, drop: 4, hand: -1 } },
    { element: 'straight', params: { length: v.outLeg } },
    { element: 'curve', params: { angle: 90, radius: 14 } },
    { element: 'airtime-hill', params: { height: 3, g: 0.1, gLoad: 1.4 } },
    { element: 'straight', params: { length: v.returnLeg } },
    { element: 'curve', params: { angle: 90, radius: 14 } },
    { element: 'brake-run', params: { length: 14, speed: 4 } },
    { element: 'level', params: { length: 6 } },
  ],
};

/**
 * Sixth attempt: v5's topology with the two things v5 measured.
 *
 * **The free pair spans the plane now.** Both of v5's straights moved the end point along z, so
 * the solve left 97 m in x with one of them pinned at its floor. The curved drop is a HALF turn,
 * which displaces the track by twice its radius sideways — so its radius is a free parameter that
 * moves x, and the out-leg still moves z. That is the property a two-parameter solve needs and
 * neither v3 nor v5 had.
 *
 * **And the airtime hill moved.** In v5 it sat straight after a 14 m curve the train now takes
 * far faster than v4's did, and produced -19.7 g. `airtime-hill` sizes its crest from the speed
 * at that crest, so the same numbers behave completely differently a hundred metres earlier or
 * later; it is on the straight out of the second helix here, where the train is still fast but
 * not yet cornering, and gentler.
 *
 * ## This one works, and it still does not fit
 *
 * **345.2 m · 55.7 km/h · 19 m drop · 2.69 g peak · 45.4 s · `complete: true`**, solved to 0.089 m
 * of residual in four iterations with a closure of 3.99 m, and one warning (15.5 g/s of jerk at
 * 147 m against a limit of 12). It is the first of the six that a train gets round at all. Two
 * numbers made it work and neither is a length: the drop helix's `hand` was **inverted**, so its
 * sideways displacement opposes the return path's instead of adding to it — v6 with `hand: -1`
 * left 63 m of residual with both parameters pinned — and the two closing curves went from
 * radius 14 to 9, which is what took the solved drop radius from 24.9 m to 15.5 and the box from
 * 75 x 130 to **56 x 112 m**.
 *
 * 56 m of width fits the reserved 58 m shelf. **112 m of depth does not fit its 48 m**, and the
 * remaining attempt says why it will not: folding the descent further (a 0.75-turn drop helix)
 * destroys the solve's conditioning outright — both parameters pin, 64 m of residual, 14.9 g.
 * The depth is spent before the first turn, by the 12 m station plus 8 m of transport plus a 15 m
 * lift at 34 degrees, which is 42 m of straight +z, and a curve cannot go in front of it because
 * a curve carries no drive (v2, v3).
 *
 * So the honest reading of six attempts is that **the plot is the wrong shape, not the layout**.
 * A coaster in this element set wants a corridor: 58 x 120 m would hold this one as it stands.
 * That is a `demo-park` decision about the `coaster` pad and a far smaller one than the 70 x 400 m
 * corridor STATUS.json contemplated for the bundled out-and-backs.
 */
const compactTwister6 = {
  ride: 'core-classic:family-invert',
  style: 'core-classic:steel-tube',
  train: 'core-classic:steel-open-5',
  free: ['dropRadius', 'outLeg'],
  start: { dropRadius: 10, outLeg: 14 },
  bounds: { dropRadius: [7, 30], outLeg: [2, 70] },
  pieces: (v) => [
    { element: 'station', params: { length: 12 } },
    { element: 'transport', params: { length: 8, speed: 2 } },
    { element: 'lift-hill', params: { height: 15, angle: 34, radius: 12, speed: 2.5 } },
    { element: 'helix', params: { turns: 0.5, radius: v.dropRadius, drop: 11, hand: 1 } },
    { element: 'airtime-hill', params: { height: 2.5, g: 0.2, gLoad: 1.8 } },
    { element: 'helix', params: { turns: 1, radius: 12, drop: 4, hand: -1 } },
    { element: 'straight', params: { length: v.outLeg } },
    { element: 'curve', params: { angle: 90, radius: 9 } },
    { element: 'straight', params: { length: 5 } },
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
  'compact-twister-5': compactTwister5,
  'compact-twister-6': compactTwister6,
};
