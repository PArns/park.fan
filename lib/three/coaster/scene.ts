/**
 * The 3-D player for one coaster element from the registry: a meadow in front of a mountain, a
 * train under transport controls and three camera modes. Every glossary term with a player uses
 * this factory, so only the element data differs. A `dual` element builds two tracks around a
 * shared centreline, each with its own train.
 *
 * Client-only (WebGL): load it behind an `ssr:false` dynamic import.
 */

import * as THREE from 'three';
import {
  Tracker,
  createCtx,
  framesAlongCurve,
  frameAt,
  makeSkyTexture,
  buildMeadow,
  buildMountains,
  buildClouds,
  PAL,
  type CurveFrames,
} from './kit';
import { getCoasterElement, type ElementKeyPoint } from './elements';

export type CoasterView = 'front' | 'follow' | 'onboard';
export type SceneTheme = 'light' | 'dark';

export interface CoasterSceneOptions {
  element: string;
  theme: SceneTheme;
  reducedMotion?: boolean;
  view?: CoasterView;
  onReady?: () => void;
  /** Fired every frame with the current playhead (0..1) and whether it's playing. */
  onTick?: (progress: number, playing: boolean) => void;
}

export interface CoasterSceneHandle {
  resize(w: number, h: number): void;
  setTheme(theme: SceneTheme): void;
  play(): void;
  pause(): void;
  toggle(): boolean;
  seek(progress: number): void;
  setView(view: CoasterView): void;
  getProgress(): number;
  isPlaying(): boolean;
  readonly keyPoints: ElementKeyPoint[];
  readonly view: CoasterView;
  dispose(): void;
}

const DEG = Math.PI / 180;
const TAU_SCENE = Math.PI * 2;
const GAUGE = 0.36;
const RAIL_R = 0.12;
const CARS = 4;
const CAR_GAP_T = 0.014;

/** Mounts the player for one coaster element on `canvas`. */
export function createCoasterScene(
  canvas: HTMLCanvasElement,
  opts: CoasterSceneOptions
): CoasterSceneHandle {
  const def = getCoasterElement(opts.element);
  if (!def) throw new Error(`Unknown coaster element: ${opts.element}`);
  const duration = def.duration ?? 9;
  // Captured out here: the narrowing from the guard above does not survive into
  // the nested builders below.
  const lsm = def.lsm;
  const brake = def.brake;
  const tt = def.turntable;

  const track = new Tracker();
  const ctx = createCtx(track);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 820px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const dayFog = new THREE.Fog(0xdce8ec, 70, 200);
  const nightFog = new THREE.Fog(0x101a36, 60, 190);
  scene.fog = dayFog;

  // Tight near/far for depth precision against z-fighting; everything past the fog is invisible
  // anyway.
  const camera = new THREE.PerspectiveCamera(50, 1, 0.25, 320);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x6b7f55, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(-30, 40, 30);
  scene.add(sun);
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const daySky = makeSkyTexture(track, false);
  const nightSky = makeSkyTexture(track, true);
  scene.background = daySky;

  const world = new THREE.Group();
  scene.add(world);
  world.add(buildMeadow(ctx));
  world.add(buildMountains(ctx));
  const clouds = buildClouds(ctx);
  world.add(clouds.group);

  const railMat = ctx.lit({ color: PAL.rail, roughness: 0.6 }, 0.22);
  const spineMat = ctx.mat({ color: 0x33415a, roughness: 0.8 });
  const tieMat = ctx.mat({ color: PAL.tie, roughness: 1 });
  const tieGeo = ctx.track.geo(new THREE.BoxGeometry(GAUGE * 2.4, 0.08, 0.18));
  const supMat = ctx.mat({ color: PAL.support, roughness: 1 });

  // Riders — a few bright shirt colours + one skin tone, all shared.
  const peepShirts = [0xffd24a, 0xff6f43, 0x4fc3f7, 0xab47bc, 0x66bb6a, 0xff5277, 0xffffff].map(
    (c) => ctx.mat({ color: c, roughness: 0.85, flatShading: false })
  );
  const peepSkin = ctx.mat({ color: 0xf1c79f, roughness: 0.9, flatShading: false });
  const peepTorsoGeo = ctx.track.geo(new THREE.CapsuleGeometry(0.1, 0.16, 3, 8));
  const peepHeadGeo = ctx.track.geo(new THREE.SphereGeometry(0.1, 10, 8));
  const peepArmGeo = ctx.track.geo(new THREE.BoxGeometry(0.045, 0.2, 0.045));

  function buildPeep(shirt: number, armsUp: boolean): THREE.Group {
    const g = new THREE.Group();
    const shirtMat = peepShirts[shirt % peepShirts.length];
    const torso = new THREE.Mesh(peepTorsoGeo, shirtMat);
    torso.position.y = 0.12;
    g.add(torso);
    const head = new THREE.Mesh(peepHeadGeo, peepSkin);
    head.position.y = 0.32;
    g.add(head);
    for (const s of [-1, 1]) {
      const arm = new THREE.Mesh(peepArmGeo, shirtMat);
      if (armsUp) {
        arm.position.set(s * 0.11, 0.27, 0.02);
        arm.rotation.z = s * 0.45;
      } else {
        arm.position.set(s * 0.13, 0.12, 0);
      }
      g.add(arm);
    }
    return g;
  }

  // Local axes after orientation: +x = right, +y = up, +z = backward (so the
  // car's NOSE points at local −z, the travel direction). Everything is seated
  // ABOVE the rails (y > rail radius) so the train never z-fights the track.
  const carBodyGeo = ctx.track.geo(new THREE.BoxGeometry(GAUGE * 1.95, 0.42, 1.2));
  const carChassisGeo = ctx.track.geo(new THREE.BoxGeometry(GAUGE * 1.5, 0.22, 1.06));
  const carNoseGeo = ctx.track.geo(new THREE.ConeGeometry(GAUGE * 0.95, 0.5, 4));
  const wheelGeo = ctx.track.geo(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10));
  const chassisMat = ctx.mat({ color: 0x2a3344, roughness: 0.85 });
  const wheelMat = ctx.mat({ color: 0x161b24, roughness: 0.7 });

  function buildCar(leadCar: boolean, accentColor: number): THREE.Group {
    const g = new THREE.Group();
    const bodyMat = ctx.lit({ color: accentColor, roughness: 0.45, flatShading: false }, 0.3);

    const chassis = new THREE.Mesh(carChassisGeo, chassisMat);
    chassis.position.y = 0.3;
    g.add(chassis);

    const body = new THREE.Mesh(carBodyGeo, bodyMat);
    body.position.y = 0.52;
    g.add(body);

    // wheels (just visual hints, low on the chassis)
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(sx * GAUGE * 0.95, 0.2, sz * 0.42);
        g.add(w);
      }
    }

    // lead car gets a pointed nose at the front (local −z)
    if (leadCar) {
      const nose = new THREE.Mesh(carNoseGeo, bodyMat);
      nose.position.set(0, 0.5, -0.74);
      nose.rotation.x = -Math.PI / 2; // apex toward −z
      nose.rotation.y = Math.PI / 4; // square the 4-sided cone to the body
      g.add(nose);
    }

    const p1 = buildPeep(leadCar ? 0 : 2, true);
    p1.position.set(-0.12, 0.7, 0.08);
    g.add(p1);
    const p2 = buildPeep(leadCar ? 3 : 5, true);
    p2.position.set(0.12, 0.7, 0.08);
    g.add(p2);

    return g;
  }

  function buildTrain(accentColor: number): THREE.Group[] {
    const cars: THREE.Group[] = [];
    for (let k = 0; k < CARS; k++) {
      const car = buildCar(k === 0, accentColor);
      world.add(car);
      cars.push(car);
    }
    return cars;
  }

  function buildTrackGeometry(frames: CurveFrames) {
    const total = frames.points.length - 1;
    // A turntable carries its own rails, so the fixed track stops at the disc rim.
    let N = total;
    if (tt) {
      const at = new THREE.Vector3(...tt.at);
      while (N > 1 && frames.points[N].distanceTo(at) < tt.radius) N--;
    }
    const left: THREE.Vector3[] = [];
    const right: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const off = frames.rights[i].clone().multiplyScalar(GAUGE);
      left.push(frames.points[i].clone().add(off));
      right.push(frames.points[i].clone().sub(off));
    }
    for (const arr of [left, right]) {
      const c = new THREE.CatmullRomCurve3(arr, false, 'catmullrom', 0.5);
      world.add(
        new THREE.Mesh(ctx.track.geo(new THREE.TubeGeometry(c, N, RAIL_R, 7, false)), railMat)
      );
    }
    // spine (centre box rail) for a chunkier read
    const sc = new THREE.CatmullRomCurve3(frames.points.slice(0, N + 1), false, 'catmullrom', 0.5);
    world.add(
      new THREE.Mesh(ctx.track.geo(new THREE.TubeGeometry(sc, N, RAIL_R * 0.6, 6, false)), spineMat)
    );

    for (let i = 0; i <= N; i += 4) {
      const mid = left[i].clone().add(right[i]).multiplyScalar(0.5);
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.copy(mid);
      tie.quaternion.setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(
          frames.rights[i],
          frames.ups[i],
          frames.tangents[i].clone().negate()
        )
      );
      world.add(tie);
    }

    // LSM stator packs on the launch run-in. Pairs flanking the centreline,
    // because that is the real geometry: the stators sit either side of a
    // reaction fin under the train's bogies. Inside the GAUGE so they read as
    // track hardware rather than trackside scenery, and short enough that the
    // rails still dominate the silhouette.
    if (lsm) {
      const span = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * N);
      const i0 = span(lsm.from);
      const i1 = span(lsm.to);
      const finGeo = ctx.track.geo(new THREE.BoxGeometry(0.06, 0.22, 0.62));
      // White, with a touch of the accent glow so the run still reads at night
      // — plain white goes muddy grey once the dark theme dims the lighting.
      const finMat = ctx.lit({ color: 0xf7fafc, roughness: 0.4 }, 0.12);
      // Spaced so the packs read as discrete units with a gap between them.
      // Denser than this and the 0.62-long fins overlap into one continuous
      // bar, which is not what a stator run looks like.
      const STEP = Math.max(3, Math.round(N / 33));
      for (let i = i0; i <= i1; i += STEP) {
        const basis = new THREE.Matrix4().makeBasis(
          frames.rights[i],
          frames.ups[i],
          frames.tangents[i].clone().negate()
        );
        for (const side of [-1, 1]) {
          const fin = new THREE.Mesh(finGeo, finMat);
          fin.position
            .copy(frames.points[i])
            .addScaledVector(frames.rights[i], side * 0.15)
            .addScaledVector(frames.ups[i], 0.04);
          fin.quaternion.setFromRotationMatrix(basis);
          world.add(fin);
        }
      }
    }

    // Brake run: caliper housings flanking the centreline, in a signal colour.
    // Longer and more widely spaced than the stator fins, so a brake run and a
    // launch run never read alike.
    if (brake) {
      const span = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * N);
      const caliperGeo = ctx.track.geo(new THREE.BoxGeometry(0.1, 0.2, 0.9));
      const caliperMat = ctx.lit({ color: 0xe8573a, roughness: 0.5 }, 0.2);
      const STEP = Math.max(4, Math.round(N / 20));
      for (let i = span(brake.from); i <= span(brake.to); i += STEP) {
        const basis = new THREE.Matrix4().makeBasis(
          frames.rights[i],
          frames.ups[i],
          frames.tangents[i].clone().negate()
        );
        for (const side of [-1, 1]) {
          const caliper = new THREE.Mesh(caliperGeo, caliperMat);
          caliper.position
            .copy(frames.points[i])
            .addScaledVector(frames.rights[i], side * 0.13)
            .addScaledVector(frames.ups[i], 0.05);
          caliper.quaternion.setFromRotationMatrix(basis);
          world.add(caliper);
        }
      }
    }
  }

  interface TrackBuild {
    frames: CurveFrames;
    cars: THREE.Group[];
  }
  const tracks: TrackBuild[] = [];

  if (def.dual) {
    // Centreline hump, then two tracks orbiting it ±gap/2, rotated by twist(t).
    const cN = Math.max(300, def.points.length * 36);
    const cPts = def.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const cFrames = framesAlongCurve(cPts, cN, { closed: false });
    const half = def.dual.gap / 2;
    const aPts: THREE.Vector3[] = [];
    const bPts: THREE.Vector3[] = [];
    const dir = new THREE.Vector3();
    for (let i = 0; i <= cN; i++) {
      const th = def.dual.twist(i / cN);
      dir
        .copy(cFrames.rights[i])
        .multiplyScalar(Math.cos(th))
        .addScaledVector(cFrames.ups[i], Math.sin(th));
      aPts.push(cFrames.points[i].clone().addScaledVector(dir, half));
      bPts.push(cFrames.points[i].clone().addScaledVector(dir, -half));
    }
    const dualRoll = def.dual.roll;
    const specs: { pts: THREE.Vector3[]; accent: number }[] = [
      { pts: aPts, accent: PAL.carLead },
      { pts: bPts, accent: PAL.car },
    ];
    for (const sp of specs) {
      // Both trains barrel-roll the same way (both ascend AND invert); the
      // half-turn orbit is what swaps them over/under each other at the apex.
      const frames = framesAlongCurve(sp.pts, sp.pts.length - 1, { closed: false, roll: dualRoll });
      buildTrackGeometry(frames);
      tracks.push({ frames, cars: buildTrain(sp.accent) });
    }
  } else {
    const N = Math.max(150, def.points.length * 18);
    const pts = def.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const frames = framesAlongCurve(pts, N, { closed: false, roll: def.roll });
    buildTrackGeometry(frames);
    tracks.push({ frames, cars: buildTrain(PAL.carLead) });
  }
  const mainFrames = tracks[0].frames;

  // A rotating platform with its own rails, rim marks and hub. Everything on it
  // turns with the train; the marks around the rim are what make the turn read
  // from above, since the rails and the train are the same both ways round.
  const disc = new THREE.Group();
  if (tt) {
    const R = tt.radius;
    disc.position.set(tt.at[0], tt.at[1], tt.at[2]);
    const slab = new THREE.Mesh(
      ctx.track.geo(new THREE.CylinderGeometry(R, R, 0.3, 40)),
      ctx.mat({ color: 0x58667f, roughness: 0.9 })
    );
    slab.position.y = -0.2; // top face sits just under the ties
    disc.add(slab);
    const hub = new THREE.Mesh(
      ctx.track.geo(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 20)),
      ctx.mat({ color: 0x1c2433, roughness: 0.8 })
    );
    hub.position.y = -0.04;
    disc.add(hub);
    const markGeo = ctx.track.geo(new THREE.BoxGeometry(0.62, 0.05, 0.3));
    const markA = ctx.lit({ color: 0xffc83d, roughness: 0.5 }, 0.25);
    const markB = ctx.mat({ color: 0x1c2433, roughness: 0.8 });
    const MARKS = 24;
    for (let i = 0; i < MARKS; i++) {
      const a = (i / MARKS) * TAU_SCENE;
      const m = new THREE.Mesh(markGeo, i % 2 ? markB : markA);
      m.position.set(Math.cos(a) * (R - 0.22), -0.035, -Math.sin(a) * (R - 0.22));
      m.rotation.y = a;
      disc.add(m);
    }
    // the rails across the disc, end to end with the fixed track at the rim
    const chord = 2 * Math.sqrt(R * R - GAUGE * GAUGE);
    const railGeo = ctx.track.geo(new THREE.CylinderGeometry(RAIL_R, RAIL_R, chord, 7));
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.rotation.z = Math.PI / 2;
      rail.position.z = side * GAUGE;
      disc.add(rail);
    }
    const spine = new THREE.Mesh(
      ctx.track.geo(new THREE.CylinderGeometry(RAIL_R * 0.6, RAIL_R * 0.6, 2 * R - 0.4, 6)),
      spineMat
    );
    spine.rotation.z = Math.PI / 2;
    disc.add(spine);
    for (let x = -R + 0.9; x < R - 0.5; x += 0.8) {
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.rotation.y = Math.PI / 2;
      tie.position.x = x;
      disc.add(tie);
    }
    world.add(disc);
  }

  const allPoints: THREE.Vector3[] = [];
  for (const tb of tracks) allPoints.push(...tb.frames.points);
  const box = new THREE.Box3().setFromPoints(allPoints);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Supports: columns under each track where it sits low enough to be supported (not up inside
  // the figure), spaced by arc length so the density does not depend on curve resolution.
  {
    const COL_SPACING = 3.2;
    // Every track sample, so a column can be rejected if it would spear through
    // a lower stretch of track at ~the same ground footprint (e.g. a helix or
    // any figure that passes over itself).
    const allPts = tracks.flatMap((tb) => tb.frames.points);
    for (const tb of tracks) {
      const f = tb.frames;
      const M = f.points.length - 1;
      let nextAt = 1.2;
      for (let i = 1; i < M; i++) {
        if (f.arc[i] < nextAt) continue;
        nextAt = f.arc[i] + COL_SPACING;
        const p = f.points[i];
        if (p.y > 1.6 && p.y < 5.5) {
          // Skip a column that would pass through a lower stretch of track at
          // ~the same ground footprint (e.g. a helix's lower spiral, or the far
          // side of a steep figure) rather than spearing it.
          const pierces = allPts.some(
            (q) => q.y < p.y - 0.6 && Math.hypot(q.x - p.x, q.z - p.z) < 0.85
          );
          if (pierces) continue;
          const h = p.y - 0.2;
          const col = new THREE.Mesh(
            ctx.track.geo(new THREE.CylinderGeometry(0.12, 0.16, h, 6)),
            supMat
          );
          col.position.set(p.x, h / 2, p.z);
          world.add(col);
        }
      }
    }
  }

  let view: CoasterView = opts.view ?? (def.defaultView as CoasterView | undefined) ?? 'front';
  const frontPos = new THREE.Vector3();
  const frontTarget = center.clone();
  function computeFront(aspect: number) {
    const fovV = 50 * DEG;
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * Math.max(aspect, 0.6));
    // Frame the ELEMENT, not the long approach track: drive distance from the
    // height + a capped horizontal window so the figure fills the frame.
    const halfV = Math.max(size.y, 6) / 2 + 1.4;
    const halfH = Math.min(Math.max(size.x, 8), 16) / 2 + 1;
    const dist = Math.max(halfV / Math.tan(fovV / 2), halfH / Math.tan(fovH / 2)) * 1.12 + size.z;
    frontPos.set(center.x, center.y, center.z + dist);
    frontTarget.copy(center);
  }
  computeFront(1.6);

  const reduced = !!opts.reducedMotion;
  let progress = 0;
  let playing = !reduced;
  // start a reduced-motion frame at the most illustrative key-point
  if (reduced) {
    const apex =
      def.keyPoints.find((k) => /invert|airtime|celest/i.test(k.label)) ??
      def.keyPoints[Math.floor(def.keyPoints.length / 2)];
    progress = apex ? apex.t : 0.5;
  }

  const f0 = {
    pos: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    up: new THREE.Vector3(),
    right: new THREE.Vector3(),
  };
  const fLook = {
    pos: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    up: new THREE.Vector3(),
    right: new THREE.Vector3(),
  };
  const carBasis = new THREE.Matrix4();
  const _lookM = new THREE.Matrix4();
  const _quat = new THREE.Quaternion();
  const desiredPos = new THREE.Vector3();
  const desiredUp = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const _side = new THREE.Vector3();
  const _wup = new THREE.Vector3(0, 1, 0);
  let camStarted = false;

  // Progress → position along the curve. Most figures ride at a constant speed
  // (the curve is arc-length parameterised, so linear progress = linear speed).
  // Elements whose whole point IS the speed change — a launch accelerating, a
  // train hanging at the top of a scorpion tail, a drop track standing still
  // before the floor goes — supply a `pace` that remaps it.
  const pace = def.pace ?? ((t: number) => t);

  // A turntable run spaces the cars by arc length (the track is short, so the
  // fixed fraction would pile them on top of each other) and turns them as one
  // rigid body about the disc centre while the train stands on it.
  const gapT = tt ? 1.35 / mainFrames.length : CAR_GAP_T;
  const ttCentre = tt ? new THREE.Vector3(...tt.at) : null;
  const _yawQ = new THREE.Quaternion();
  const _off = new THREE.Vector3();
  let ttYaw = 0;

  function placeTurntableTrain() {
    const mid = pace(progress);
    ttYaw = tt!.yaw(progress);
    _yawQ.setFromAxisAngle(_wup, ttYaw);
    // Before the turn the nose leads up the curve, after it the other end does.
    const dir = ttYaw >= Math.PI ? -1 : 1;
    const spinning = ttYaw > 0 && ttYaw < Math.PI;
    const tb = tracks[0];
    for (let k = 0; k < CARS; k++) {
      const slot = (1.5 - k) * gapT;
      const t = THREE.MathUtils.clamp(mid + dir * slot, 0, 1);
      frameAt(tb.frames, t, f0);
      carBasis.makeBasis(f0.right, f0.up, f0.tangent.clone().negate());
      tb.cars[k].quaternion.setFromRotationMatrix(carBasis);
      if (spinning || dir < 0) {
        // The cars stand where they stood before the turn, swung round the centre.
        if (spinning) {
          _off.copy(f0.pos).sub(ttCentre!).applyQuaternion(_yawQ);
          f0.pos.copy(ttCentre!).add(_off);
        }
        tb.cars[k].quaternion.premultiply(_yawQ);
      }
      tb.cars[k].position.copy(f0.pos);
    }
    disc.rotation.y = ttYaw;
  }

  function placeTrain() {
    if (tt) {
      placeTurntableTrain();
      return;
    }
    const head = pace(progress);
    for (const tb of tracks) {
      for (let k = 0; k < CARS; k++) {
        const t = THREE.MathUtils.clamp(head - k * gapT, 0, 1);
        frameAt(tb.frames, t, f0);
        tb.cars[k].position.copy(f0.pos);
        carBasis.makeBasis(f0.right, f0.up, f0.tangent.clone().negate());
        tb.cars[k].quaternion.setFromRotationMatrix(carBasis);
      }
    }
  }

  function updateCamera(snap: boolean) {
    // lead car of the primary track drives follow / onboard
    frameAt(mainFrames, pace(progress), f0);
    // The train's own heading. On a turntable run it is the curve's tangent turned
    // by the disc, so the chase and onboard cameras swing round with the train.
    if (tt) f0.tangent.applyAxisAngle(_wup, ttYaw);
    if (view === 'front') {
      desiredPos.copy(frontPos);
      desiredUp.set(0, 1, 0);
      lookTarget.copy(frontTarget);
    } else if (view === 'follow') {
      // 3/4 chase from behind + above + to one side, in WORLD up (stable through
      // inversions); the horizontal tangent keeps it from going edge-on.
      desiredUp.set(0, 1, 0);
      const fwdH = tmp.set(f0.tangent.x, 0, f0.tangent.z);
      if (fwdH.lengthSq() < 0.04) fwdH.set(0, 0, 1);
      fwdH.normalize();
      _side.set(fwdH.z, 0, -fwdH.x); // horizontal perpendicular
      desiredPos
        .copy(f0.pos)
        .addScaledVector(fwdH, -6.5)
        .addScaledVector(_side, 3.2)
        .addScaledVector(_wup, 3.4);
      lookTarget.copy(f0.pos).addScaledVector(fwdH, 1.5);
    } else {
      // onboard — head height above the lead car; look at a point further ALONG
      // the track (not straight down the instantaneous tangent) so the view
      // follows the hill/twist instead of staring at the sky on a climb. Up
      // rolls with the frame so the horizon inverts through the figure.
      desiredUp.copy(f0.up);
      if (tt) {
        // from the nose car, looking along where the train is pointing
        const nose = tracks[0].cars[0];
        desiredPos
          .copy(nose.position)
          .addScaledVector(f0.up, 0.95)
          .addScaledVector(f0.tangent, 0.5);
        lookTarget.copy(desiredPos).addScaledVector(f0.tangent, 6).addScaledVector(f0.up, -0.6);
      } else {
        desiredPos.copy(f0.pos).addScaledVector(f0.up, 0.95).addScaledVector(f0.tangent, 0.5);
        frameAt(mainFrames, Math.min(pace(progress) + 0.12, 1), fLook);
        lookTarget.copy(fLook.pos).addScaledVector(f0.up, 0.35);
      }
    }
    // Matrix4.lookAt uses the CAMERA convention (−z faces the target); building
    // the quaternion this way avoids the inverted facing a plain Object3D.lookAt
    // would give.
    _lookM.lookAt(desiredPos, lookTarget, desiredUp);
    _quat.setFromRotationMatrix(_lookM);
    if (snap || !camStarted) {
      camera.position.copy(desiredPos);
      camera.quaternion.copy(_quat);
      camStarted = true;
    } else {
      const k = view === 'front' ? 0.12 : 0.5;
      camera.position.lerp(desiredPos, k);
      camera.quaternion.slerp(_quat, k);
    }
  }

  function applyTheme(theme: SceneTheme) {
    const night = theme === 'dark';
    scene.background = night ? nightSky : daySky;
    scene.fog = night ? nightFog : dayFog;
    hemi.intensity = night ? 0.35 : 0.9;
    hemi.color.set(night ? 0x223052 : 0xffffff);
    hemi.groundColor.set(night ? 0x0c1428 : 0x6b7f55);
    sun.intensity = night ? 0.55 : 2.0;
    sun.color.set(night ? 0x9fb4e0 : 0xffffff);
    ambient.intensity = night ? 0.18 : 0.35;
    renderer.toneMappingExposure = night ? 0.95 : 1.0;
  }
  applyTheme(opts.theme);

  let raf = 0;
  let last = performance.now();
  let disposed = false;
  let readyFired = false;

  function renderFrame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (playing && !reduced) {
      progress += dt / duration;
      if (progress >= 1) progress -= 1; // loop (restart)
    }
    clouds.update(now / 1000);
    placeTrain();
    updateCamera(false);
    renderer.render(scene, camera);
    opts.onTick?.(progress, playing);
    if (!readyFired) {
      readyFired = true;
      opts.onReady?.();
    }
    // Only re-arm while playing: a paused loop must not keep rendering, and play() must start
    // exactly one chain. pause() cancels the pending frame.
    if (!disposed && !reduced && playing) raf = requestAnimationFrame(renderFrame);
  }

  placeTrain();
  updateCamera(true);
  renderer.render(scene, camera);
  if (reduced) {
    requestAnimationFrame(() => opts.onReady?.());
  } else {
    raf = requestAnimationFrame(renderFrame);
  }

  return {
    keyPoints: def.keyPoints,
    get view() {
      return view;
    },
    resize(w: number, h: number) {
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      computeFront(camera.aspect);
      if (view === 'front') updateCamera(true);
      // `setSize` clears the canvas, and with no loop running (reduced motion, or paused) nothing
      // would draw it again until the next scrub. Same as `park-scene.ts`.
      if (!playing || reduced) renderer.render(scene, camera);
    },
    setTheme(theme: SceneTheme) {
      applyTheme(theme);
      if (reduced) renderer.render(scene, camera);
    },
    play() {
      if (reduced || playing) return;
      playing = true;
      last = performance.now();
      raf = requestAnimationFrame(renderFrame);
    },
    pause() {
      if (!playing) return;
      playing = false;
      cancelAnimationFrame(raf);
      // The loop does not tick while paused, so sync the UI (play button) once.
      opts.onTick?.(progress, playing);
    },
    toggle() {
      if (playing) this.pause();
      else this.play();
      return playing;
    },
    seek(p: number) {
      progress = THREE.MathUtils.clamp(p, 0, 1);
      placeTrain();
      updateCamera(!playing); // snap when paused/scrubbing, ease while playing
      if (!playing || reduced) renderer.render(scene, camera);
      opts.onTick?.(progress, playing);
    },
    setView(v: CoasterView) {
      view = v;
      camStarted = false; // re-seat the camera cleanly on the new view
      if (!playing || reduced) {
        updateCamera(true);
        renderer.render(scene, camera);
      }
    },
    getProgress() {
      return progress;
    },
    isPlaying() {
      return playing;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      track.dispose();
      renderer.dispose();
      // dispose() frees GPU objects but keeps the WebGL context alive; browsers cap live
      // contexts (~16) and drop the oldest, so element switches would leak contexts until
      // other canvases go black. Release it explicitly.
      renderer.forceContextLoss();
    },
  };
}
