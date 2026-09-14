/**
 * Entity → everything a slide is: the style, the descent, the spline, the speeds and the wall.
 *
 * Pure, Babylon-free and DOM-free, so the worker resolves the same slide the renderer draws —
 * which is not a nicety here but the whole basis of the rider transforms: `sim.ts` publishes an arc
 * length and `main.ts` turns it into a position, and the two only agree because both call this.
 *
 * ## `quick: true`, and why it is the load-bearing line in the file
 *
 * `buildTrack` runs a second pass that re-banks every auto-banked node to the resultant of
 * `v²·κ⃗ + g⃗` at the speed the vehicle really carries — the rule a coaster is designed to, and
 * exactly the wrong rule for a slide. Bank a flume to the resultant and every rider sits flat in
 * the bottom of the trough, the wall never has to grow, and the module becomes a coaster with a wet
 * floor. A real slide is deliberately under-banked; riding up the wall is the ride. So the build is
 * asked for one pass, every turn gets the style's own `bankFactor` (0.3 on a body chute, 0.55 on a
 * tube pipe), and the remainder of the turn is answered by the wall rule in `geom.ts`.
 *
 * ## The rider is the "train"
 *
 * `simulateTrack` is an energy march over a spline with a mass, a drag area and a friction
 * coefficient, and none of those three words are specific to a coaster. A body slide is a
 * one-"car" train of one seat, no vehicle mass and µ = 0.12; a family raft is one seat-count of
 * five on 95 kg of hull at µ = 0.09 with 2.1 m² of drag. Everything else — the mean-height term
 * that makes a long vehicle crest what a short one stalls on, the normal-force-scaled friction that
 * makes a hook cost more than the straight before it — is right for both.
 */

import type { Registry } from '../core/registry';
import type { Entity, Vec3 } from '../core/types';
import {
  buildTrack,
  extrusionStations,
  resolveStyle,
  simulateTrack,
  speedAt,
  type BuiltTrack,
  type TrackData,
  type TrackPhysics,
  type TrackSpline,
  type TrainSpec,
} from '../track';
import { defaultLayoutFor, flumeLayout, flumeStyle, flumeTower } from './manifest';
import { G, wallExtents, type FlumeStation, type TowerPlacement, type V3 } from './geom';
import type {
  FlumeEntityData,
  FlumeLayoutSpec,
  FlumeNightRig,
  FlumeStyleSpec,
  ResolvedFlume,
} from './types';

/**
 * Comfort limits for a slide.
 *
 * Generous against a coaster's, because they mean something different: a flume never inverts, its
 * lateral load is what throws the rider up the wall rather than something to be cancelled, and the
 * only value that matters is the one that says the layout does not work at all. They are reported,
 * never enforced.
 */
const FLUME_LIMITS = { vertical: 4.5, lateral: 3.2, negative: -1.2 };

/** Speed the shaping estimate assumes while it draws a layout, m/s. A fast slide runs at 14. */
const DESIGN_SPEED = 14;

/**
 * Metres of structure below the trough's floor.
 *
 * `buildSupports` measures its columns from `HEARTLINE_HEIGHT + structureDepth` below the spline,
 * because on a coaster the spline is the rider's chest. This module's spline is the trough FLOOR,
 * so the offset it wants is the cradle beam alone and the heartline has to be taken back off.
 * `main.ts` does that arithmetic in one named place; the request to have `buildSupports` take the
 * offset whole is in `docs/game/requests/flumes.md`.
 */
export const CRADLE_DEPTH = 0.34;

export interface FlumeBuild {
  flume: ResolvedFlume;
  spline: TrackSpline;
  physics: TrackPhysics;
  /** Extrusion stations with the wall rule already resolved. */
  stations: FlumeStation[];
  /** Metres of trough. */
  length: number;
  /** Metres from the tower deck to the lowest point of the run. */
  drop: number;
  topSpeed: number;
  rideSeconds: number;
  /** Where the run-out ends, world metres — the point a splash is drawn at. */
  exit: Vec3;
  warnings: string[];
}

/** The `TrainSpec` a rider is, for the energy march. See the file docblock. */
export function riderSpec(style: FlumeStyleSpec): TrainSpec {
  return {
    cars: 1,
    carLength: Math.max(1.5, style.rig.hullRadius * 2.1),
    seatsPerCar: style.rig.seats,
    massPerCar: style.vehicleMass,
    riderMass: style.riderMass,
    dragArea: style.dragArea,
    rollingResistance: style.friction,
  };
}

/**
 * Metres the trough's exit sits above the ground it discharges onto.
 *
 * A slide's run-out lip is a hand's breadth over the water of the basin it empties into. It is not
 * a taste decision: below zero the last few metres of trough are buried in the pool deck, and a
 * metre above it the flume ends in mid-air and the rider falls out of the picture.
 */
export const EXIT_CLEARANCE = 0.4;

/**
 * The layout's pieces as the `track` module wants them, anchored on the entity.
 *
 * Two things are injected rather than repeated in every layout. The **origin's height** is the
 * tower, and `buildFlume` derives that from the descent so the two cannot drift apart. And
 * `bankFactor` comes off the STYLE wherever a piece does not name one of its own — under-banking is
 * a property of the kind of slide (a body chute barely banks at all, a tube pipe banks freely), so
 * a layout is not the place to restate it, and `resolveParams` drops the key on the elements that
 * have no such parameter.
 */
export function trackDataFor(flume: ResolvedFlume, towerHeight = flume.towerHeight): TrackData {
  return {
    style: flume.trackStyle ? `${flume.pack}:${flume.trackStyle}` : '',
    ride: flume.key,
    origin: [flume.position[0], flume.position[1] + towerHeight, flume.position[2]],
    yaw: flume.yaw,
    closed: false,
    pieces: flume.layout.pieces.map((p) => ({
      element: p.element,
      params: { bankFactor: flume.style.bankFactor, ...(p.params ?? {}) },
    })),
    color: flume.color,
  };
}

interface FlumeRideDef {
  id: string;
  kind?: string;
  name?: Record<string, string>;
  flumeStyle?: string;
  trackStyle?: string;
  cost?: number;
  upkeep?: number;
  power?: number;
  water?: number;
  minHeightCm?: number;
  night?: { light?: FlumeNightRig };
}

/**
 * Resolve a `flume` entity against the registry.
 *
 * Returns null rather than throwing when the pack it names is not loaded: a park saved with a
 * theme pack that is no longer registered has to load with a gap in it, not with an exception in
 * the middle of the world walk.
 */
export function resolveFlume(
  registry: Registry,
  entity: Entity,
  ground: number
): ResolvedFlume | null {
  if (entity.kind !== 'flume') return null;
  const key = `${entity.pack}:${entity.item}`;
  const def = registry.item('rides', key)?.def as FlumeRideDef | undefined;
  if (!def || def.kind !== 'flume') return null;
  const data = (entity.data ?? {}) as FlumeEntityData;

  // The layout decides the style, not the ride's four-way enum. See `manifest.ts`.
  const layout: FlumeLayoutSpec | undefined = data.layout
    ? flumeLayout(data.layout)
    : defaultLayoutFor(def.flumeStyle);
  if (!layout) return null;
  const style = flumeStyle(layout.style);
  const tower = flumeTower(layout.tower);
  if (!style || !tower) return null;

  // No content id from a bundled pack in this file: `resolveStyle` answers an absent key with
  // `track`'s own `FALLBACK_STYLE`, and a slide style may declare its own `radius` instead.
  const trackStyleId = def.trackStyle ?? '';
  const shape = resolveStyle(registry, trackStyleId ? `${entity.pack}:${trackStyleId}` : undefined);
  const night = def.night?.light
    ? {
        color: def.night.light.color,
        intensity: def.night.light.intensity,
        height: def.night.light.height ?? 0.5,
        range: def.night.light.range ?? 8,
        mode: def.night.light.mode ?? 'steady',
        colors: def.night.light.colors ?? [def.night.light.color],
      }
    : null;

  return {
    id: entity.id,
    key,
    pack: entity.pack,
    item: entity.item,
    trackStyle: trackStyleId,
    name: def.name ?? { en: entity.item },
    style,
    layout,
    tower,
    radius: style.radius > 0 ? style.radius : shape.rail.radius,
    color: data.color ?? shape.color ?? style.shell,
    position: [entity.position[0], entity.position[1] || ground, entity.position[2]],
    yaw: entity.yaw,
    // 0 means "derive it from the descent"; `buildFlume` does that. See `EXIT_CLEARANCE`.
    towerHeight: data.towerHeight ?? layout.towerHeight,
    running: data.running !== false,
    cost: def.cost ?? 0,
    upkeep: def.upkeep ?? 0,
    power: def.power ?? 0,
    water: def.water ?? 0,
    night,
    minHeightCm: def.minHeightCm ?? null,
  };
}

/**
 * Build the descent: the spline, the speeds and the wall.
 *
 * The stations are `track`'s own adaptive spacing (`extrusionStations`) — a chord that never sags
 * more than a centimetre from the curve, denser through a hook and sparse down a straight — so the
 * trough is drawn at exactly the resolution the geometry needs and the wall rule is evaluated at
 * the same points.
 */
export function buildFlume(input: ResolvedFlume): FlumeBuild {
  const train = riderSpec(input.style);
  const options = {
    train,
    limits: FLUME_LIMITS,
    dispatchSpeed: input.style.entrySpeed,
    ratedSpeed: DESIGN_SPEED,
    quick: true,
  };

  /**
   * The tower is as tall as the descent needs, and that is a derivation rather than a number in
   * the manifest.
   *
   * A layout carrying its own `towerHeight` is two numbers that have to agree, and they will not:
   * every edit to a drop moves the exit, so the run-out ends four metres underground or three in
   * the air, silently, with the geometry still valid and the physics still right. Measured over the
   * five built-in descents before this existed: −4.45, −3.43, −2.34, −5.24 and −1.07 m.
   *
   * So the layout is built once from the ground to measure what it falls, and again from a tower
   * that tall. The second build is not a refinement — a vertical translation changes no tangent, no
   * curvature and no speed — it is just the cheapest way to move an immutable spline. An entity may
   * still override the height, for a park designer who wants the run-out over a deeper basin.
   */
  const probe = buildTrack(trackDataFor(input, 0), options);
  let lowestProbe = Infinity;
  for (const s of probe.spline.march(2)) lowestProbe = Math.min(lowestProbe, s.p[1]);
  const descent = input.position[1] - lowestProbe;
  const towerHeight = input.towerHeight > 0 ? input.towerHeight : descent + EXIT_CLEARANCE;
  const flume: ResolvedFlume = { ...input, towerHeight };

  const data = trackDataFor(flume);
  const built: BuiltTrack = buildTrack(data, options);
  const spline = built.spline;
  // Re-run the march at a finer step than the build's default: the wall rule reads speeds at every
  // extrusion station, and a half-metre march interpolated over a 9 m hook is where the wall would
  // visibly lag the turn.
  const physics = simulateTrack({
    spline,
    drives: built.drives,
    train,
    limits: FLUME_LIMITS,
    dispatchSpeed: flume.style.entrySpeed,
    ratedSpeed: DESIGN_SPEED,
    step: 0.25,
  });

  const riderRadius = Math.max(flume.style.rig.riderRadius, flume.style.rig.hullRadius * 0.85);
  const stations: FlumeStation[] = [];
  for (const s of extrusionStations(spline)) {
    const frame = spline.frameAt(s);
    const v = speedAt(physics, s);
    const kappa = spline.curvatureAt(s);
    const force: V3 = [kappa[0] * v * v, kappa[1] * v * v + G, kappa[2] * v * v];
    const walls = wallExtents({
      force,
      up: frame.up as V3,
      right: frame.right as V3,
      radius: flume.radius,
      riderRadius,
      style: flume.style,
    });
    stations.push({
      s,
      frame,
      v,
      phiL: walls.left,
      phiR: walls.right,
      climb: walls.climb,
      fall: Math.max(0, -frame.tangent[1]),
    });
  }

  let lowest = Infinity;
  for (const st of stations) lowest = Math.min(lowest, st.frame.p[1]);
  const end = spline.frameAt(spline.length());

  return {
    flume,
    spline,
    physics,
    stations,
    length: spline.length(),
    drop: flume.position[1] + flume.towerHeight - lowest,
    topSpeed: physics.maxSpeed,
    rideSeconds: physics.rideTimeSeconds,
    exit: [end.p[0], end.p[1], end.p[2]],
    warnings: built.warnings,
  };
}

/**
 * Where the tower stands, from the BUILT slide.
 *
 * This exists because of the one line that failed round 1. `towerHeight` on the pre-build resolve
 * is the manifest's value, and every built-in layout leaves it **0** — the sentinel for "derive it
 * from the descent". `buildFlume` resolves it and writes the answer onto `build.flume`; `main.ts`
 * read the pre-build object instead, so `buildTower` was handed `deckY = ground` and `height = 1`,
 * and all five towers were 2 m tall and lay in the grass 12–17 m under their own chutes. The
 * selftest then built its tower with the same wrong argument and printed the derived height beside
 * the triangle count of the wrong one, so 94/94 passed over a park nobody could have shipped.
 *
 * A shared function is the fix rather than a corrected line, because two call sites computing the
 * same placement from the same fields is the bug, not the arithmetic. Everything here reads
 * `build.flume`; there is nowhere left to read the request from.
 */
export function towerPlacement(build: FlumeBuild, ground: number): TowerPlacement {
  const flume = build.flume;
  const deckY = flume.position[1] + flume.towerHeight;
  return {
    spec: flume.tower,
    // The deck sits BEHIND the start of the chute, so the flume leaves it rather than starting in
    // mid-air off its edge: back off along the layout's heading by half the footprint.
    centre: [
      flume.position[0] - Math.sin(flume.yaw) * (flume.tower.footprint[1] / 2 - 0.4),
      deckY,
      flume.position[2] - Math.cos(flume.yaw) * (flume.tower.footprint[1] / 2 - 0.4),
    ],
    yaw: flume.yaw,
    ground,
    deckY,
    chuteWidth: flume.radius * 2 + flume.style.thickness * 2,
  };
}

/**
 * The capacity the dispatch interval implies, riders per hour.
 *
 * Reported rather than counted, and the distinction matters: the visible dispatches run on the
 * slide clock (`SLIDE_SECONDS_PER_TICK`), which is not the park's compressed hour, so counting
 * them would give a management panel a number sixty times too large. This is what an operator
 * would quote — a body slide at 11 s intervals is 327/h, a five-seat raft at 28 s is 643/h.
 */
export function ridersPerHour(style: FlumeStyleSpec): number {
  return Math.round((3600 / style.dispatchSeconds) * style.rig.seats);
}
