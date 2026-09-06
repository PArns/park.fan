/**
 * Unit tests for everything in this module a screenshot cannot show.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/camera/selftest.mjs
 *
 * A `.mjs` next to the code rather than a `scripts/test-game-*.mjs`, for the reason `paths`,
 * `track` and `shops` all give: these checks are about this module's internals and a builder may
 * not edit `package.json`. The request to wire it into `pnpm test:game` is in
 * `docs/game/requests/camera.md`.
 *
 * What is worth testing here is the arithmetic that is invisible in a still frame and expensive
 * when it is wrong: the sign of a drag, whether a pivot really stays on its pixel, whether the
 * leash and the ground floor actually bind, and whether a preset written by a pack survives the
 * parser. Everything imported is pure — no Babylon, no DOM.
 */

import {
  DEFAULT_BOUNDS,
  alphaToBearing,
  bearingToAlpha,
  betaMaxFor,
  betaToPitch,
  clampPose,
  damp,
  distanceForRadius,
  eyeOf,
  horizonRow,
  planeHit,
  rightOf,
  rotateRigAbout,
  scaleRigAbout,
  screenRay,
  wrapPi,
} from '@/lib/game/camera/pose';
import {
  CAMERA_PRESET_MANIFEST,
  attachCameraPresets,
  cameraPreset,
  cameraPresets,
  parseCameraPreset,
  poseFromPreset,
  registerCameraPreset,
  resetCameraPresets,
} from '@/lib/game/camera/manifest';
import { AnchorTable } from '@/lib/game/camera/anchors';
import { createCameraController } from '@/lib/game/camera/controller';
import { createViewStore } from '@/lib/game/camera/view-state';

let failures = 0;
let checks = 0;
function ok(condition, label, detail = '') {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}
function near(actual, expected, tolerance, label) {
  ok(
    Math.abs(actual - expected) <= tolerance,
    label,
    `${actual.toFixed(4)} vs ${expected.toFixed(4)} (±${tolerance})`
  );
}
const section = (name) => console.log(name);

const FOV = 0.9;
const ASPECT = 1280 / 720;

// A hill in the middle of a plain, so the ground rules have something to bind against.
const ground = (x, z) => 20 * Math.exp(-((x + 60) ** 2 + (z - 40) ** 2) / 3000);
const flat = () => 0;
/** A raycast against `ground`, marched the same way `terrain/heightfield.ts` marches. */
function raycastAgainst(height) {
  return (origin, direction, maxDistance = 3000) => {
    const len = Math.hypot(...direction) || 1;
    const d = direction.map((c) => c / len);
    let prev = 0;
    if (origin[1] - height(origin[0], origin[2]) <= 0) return [...origin];
    for (let t = 1; t <= maxDistance; t += 1) {
      const p = [origin[0] + d[0] * t, origin[1] + d[1] * t, origin[2] + d[2] * t];
      if (p[1] - height(p[0], p[2]) <= 0) {
        let lo = prev;
        let hi = t;
        for (let k = 0; k < 20; k++) {
          const mid = (lo + hi) / 2;
          const q = [origin[0] + d[0] * mid, origin[1] + d[1] * mid, origin[2] + d[2] * mid];
          if (q[1] - height(q[0], q[2]) <= 0) hi = mid;
          else lo = mid;
        }
        return [origin[0] + d[0] * hi, origin[1] + d[1] * hi, origin[2] + d[2] * hi];
      }
      prev = t;
    }
    return null;
  };
}

// ── 1. the angle conventions the host docblock is about ───────────────────────────────────────
section('angles');
{
  // Babylon's own formula, re-derived: eye = target + r(cos a sin b, cos b, sin a sin b).
  const pose = { target: [0, 0, 0], alpha: -Math.PI / 3, beta: 1.3, radius: 340 };
  const eye = eyeOf(pose);
  near(eye[1], 340 * Math.cos(1.3), 1e-9, 'the eye is radius*cos(beta) above the target');
  near(Math.hypot(eye[0], eye[2]), 340 * Math.sin(1.3), 1e-9, 'and radius*sin(beta) out from it');

  // The two numbers the `overview` bug was about.
  near(betaToPitch(1.3), 15.52, 0.01, 'beta 1.30 is 15.52 degrees below the horizon');
  near((FOV / 2 / Math.PI) * 180, 25.78, 0.01, 'the vertical half-FOV at fov=0.9 is 25.78 degrees');
  near(horizonRow(15.52, FOV, 720), 153, 1, 'and it puts the horizon on row 153 of 720');
  // The framing the host says could contain no sky at all: beta = PI/3.4 → 37.1 degrees down.
  const bad = betaToPitch(Math.PI / 3.4);
  near(bad, 37.06, 0.02, 'the old overview looked 37.1 degrees down');
  ok(
    horizonRow(bad, FOV, 720) < 0,
    'so its horizon row is off the top of the frame',
    `${horizonRow(bad, FOV, 720).toFixed(1)}`
  );

  near(alphaToBearing(-Math.PI / 3), 210, 1e-6, 'alpha −PI/3 is a bearing of 210 degrees');
  near(bearingToAlpha(210), -Math.PI / 3, 1e-9, 'and the conversion round-trips');
  for (const b of [0, 45, 90, 180, 270, 359]) {
    near(alphaToBearing(bearingToAlpha(b)), b, 1e-6, `bearing ${b} round-trips`);
  }
  // North is −Z: a camera on bearing 0 must look towards −Z.
  const north = { target: [0, 0, 0], alpha: bearingToAlpha(0), beta: Math.PI / 2, radius: 10 };
  const nEye = eyeOf(north);
  ok(
    nEye[2] > 9.9,
    'bearing 0 puts the camera south of its target, looking north',
    `z=${nEye[2].toFixed(3)}`
  );
  const east = eyeOf({
    target: [0, 0, 0],
    alpha: bearingToAlpha(90),
    beta: Math.PI / 2,
    radius: 10,
  });
  ok(
    east[0] < -9.9,
    'bearing 90 puts it west of the target, looking east',
    `x=${east[0].toFixed(3)}`
  );
}

// ── 2. the ray, and the sign of a drag ────────────────────────────────────────────────────────
section('rays and drag direction');
{
  const pose = { target: [0, 0, 0], alpha: -Math.PI / 3, beta: 1.1, radius: 120 };
  const centre = screenRay(pose, { x: 0, y: 0 }, FOV, ASPECT);
  const hit = planeHit(centre, 0);
  ok(hit !== null, 'the centre ray reaches the ground plane');
  near(Math.hypot(hit[0] - pose.target[0], hit[2] - pose.target[2]), 0, 1e-6, 'through the target');

  // Screen-right must be to the RIGHT. Take the ray a little right of centre; its ground hit has
  // to sit on the positive side of the camera's right axis.
  const r = rightOf(pose.alpha);
  const rightHit = planeHit(screenRay(pose, { x: 0.5, y: 0 }, FOV, ASPECT), 0);
  const along = (rightHit[0] - hit[0]) * r[0] + (rightHit[2] - hit[2]) * r[2];
  ok(along > 1, 'a point right of centre lies to the camera right', `${along.toFixed(2)} m`);
  // And up-screen must be further away.
  const upHit = planeHit(screenRay(pose, { x: 0, y: 0.5 }, FOV, ASPECT), 0);
  const eye = eyeOf(pose);
  ok(
    Math.hypot(upHit[0] - eye[0], upHit[2] - eye[2]) > Math.hypot(hit[0] - eye[0], hit[2] - eye[2]),
    'a point above centre lies further from the camera'
  );
  // A ray genuinely above the horizon must return null, not the point behind the camera where the
  // line meets the plane. At beta 1.50 the view axis is 4.06 degrees down and the top of the frame
  // is 25.78 above it, so ndc.y = 0.99 points 21.4 degrees at the sky.
  const skyward = { target: [0, 0, 0], alpha: -1, beta: 1.5, radius: 100 };
  ok(
    planeHit(screenRay(skyward, { x: 0, y: 0.99 }, FOV, ASPECT), 0) === null,
    'a ray above the horizon returns null rather than a point behind the camera'
  );
}

// ── 3. the pivot really stays on its pixel ────────────────────────────────────────────────────
section('pivot stability');
{
  const pose = { target: [10, 2, -30], alpha: -1.0, beta: 1.15, radius: 140 };
  const ndc = { x: -0.42, y: -0.31 };
  const pivot = planeHit(screenRay(pose, ndc, FOV, ASPECT), 0);
  ok(pivot !== null, 'the test pivot exists');

  // Projection: where does a world point land in NDC for a pose?
  const project = (p, q) => {
    const eye = eyeOf(p);
    const f = [
      -Math.cos(p.alpha) * Math.sin(p.beta),
      -Math.cos(p.beta),
      -Math.sin(p.alpha) * Math.sin(p.beta),
    ];
    const rr = rightOf(p.alpha);
    const u = [
      -f[1] * rr[2] + f[2] * rr[1],
      -f[2] * rr[0] + f[0] * rr[2],
      -f[0] * rr[1] + f[1] * rr[0],
    ];
    const v = [q[0] - eye[0], q[1] - eye[1], q[2] - eye[2]];
    const zf = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
    const xr = v[0] * rr[0] + v[1] * rr[1] + v[2] * rr[2];
    const yu = v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
    const ty = Math.tan(FOV / 2);
    return { x: xr / (zf * ty * ASPECT), y: yu / (zf * ty) };
  };

  const zoomed = scaleRigAbout(pose, pivot, 0.55);
  const pz = project(zoomed, pivot);
  near(pz.x, ndc.x, 1e-6, 'zooming towards the cursor leaves the pivot on the same x');
  near(pz.y, ndc.y, 1e-6, 'and the same y');
  near(zoomed.radius, pose.radius * 0.55, 1e-9, 'and scales the radius by exactly the factor');

  const turned = rotateRigAbout(
    pose,
    pivot,
    0.7,
    -0.12,
    DEFAULT_BOUNDS.betaMin,
    DEFAULT_BOUNDS.betaMaxNear
  );
  const pr = project(turned, pivot);
  near(pr.x, ndc.x, 1e-6, 'orbiting about the cursor leaves the pivot on the same x');
  near(pr.y, ndc.y, 1e-6, 'and the same y');
  near(turned.radius, pose.radius, 1e-6, 'and does not change the radius');
  near(turned.beta, pose.beta - 0.12, 1e-9, 'and applies the tilt it was asked for');

  // A tilt past the limit is clamped in the DELTA, so the pivot still holds.
  const pinned = rotateRigAbout(
    pose,
    pivot,
    0,
    -5,
    DEFAULT_BOUNDS.betaMin,
    DEFAULT_BOUNDS.betaMaxNear
  );
  near(pinned.beta, DEFAULT_BOUNDS.betaMin, 1e-9, 'a huge tilt lands exactly on the limit');
  const pp = project(pinned, pivot);
  near(pp.x, ndc.x, 1e-6, 'and the pivot is still on its pixel afterwards');
  near(pp.y, ndc.y, 1e-6, 'in both axes');
}

// ── 4. the leash and the ground floor ─────────────────────────────────────────────────────────
section('bounds');
{
  const b = DEFAULT_BOUNDS;
  // The dome arithmetic: apron rim 1756 m, dome radius 900 m drawn at the camera.
  ok(
    b.maxEyeRadius + 900 <= 1756,
    'the eye leash keeps the apron rim behind the sky dome',
    `${b.maxEyeRadius} + 900 = ${b.maxEyeRadius + 900} <= 1756`
  );
  ok(
    Math.hypot(256, 256) < b.targetRadius,
    'the park corner is inside the target leash',
    `${Math.hypot(256, 256).toFixed(1)} < ${b.targetRadius}`
  );

  const far = clampPose({ target: [900, 0, 0], alpha: 0, beta: 1.2, radius: 480 }, b, flat);
  near(
    Math.hypot(far.pose.target[0], far.pose.target[2]),
    b.targetRadius,
    1e-6,
    'the target is pulled onto the leash'
  );
  const eye = eyeOf(far.pose);
  ok(
    Math.hypot(eye[0], eye[2]) <= b.maxEyeRadius + 1e-6,
    'and the eye stays inside its own leash',
    `${Math.hypot(eye[0], eye[2]).toFixed(1)} m`
  );
  ok(
    far.clamped.includes('target') && far.clamped.includes('eye-leash'),
    'both limits are reported'
  );

  // Worst case over the whole reachable set: no pose may put the eye past the leash.
  let worst = 0;
  for (let a = 0; a < 32; a++) {
    for (let t = 0; t <= 8; t++) {
      const ang = (a / 32) * Math.PI * 2;
      const p = clampPose(
        {
          target: [Math.cos(ang) * 900, 0, Math.sin(ang) * 900],
          alpha: ang,
          beta: 0.2 + t * 0.15,
          radius: 4000,
        },
        b,
        flat
      );
      const e = eyeOf(p.pose);
      worst = Math.max(worst, Math.hypot(e[0], e[2]));
    }
  }
  ok(
    worst <= b.maxEyeRadius + 1e-6,
    'over 288 extreme poses the eye never escapes',
    `worst ${worst.toFixed(2)} m`
  );

  // The ground floor. A near-horizontal camera standing off the hill and looking at its foot puts
  // its own eye inside the hill: target at (0, 40) on the flat, eye 60 m away at (−60, 40), which
  // is the 20 m summit.
  const sunk = { target: [0, ground(0, 40), 40], alpha: Math.PI, beta: 1.56, radius: 60 };
  const before = eyeOf(sunk);
  ok(
    before[1] < ground(before[0], before[2]),
    'the unclamped pose really is underground',
    `eye ${before[1].toFixed(2)} vs ground ${ground(before[0], before[2]).toFixed(2)}`
  );
  const lifted = clampPose(sunk, b, ground);
  const after = eyeOf(lifted.pose);
  ok(
    after[1] >= ground(after[0], after[2]) + b.eyeClearance - 1e-6,
    'and the clamp lifts it clear',
    `${(after[1] - ground(after[0], after[2])).toFixed(2)} m of air`
  );
  ok(
    lifted.clamped.some((c) => c.startsWith('ground')),
    'and says so'
  );

  // The beta ceiling tightens with distance: a far camera may not lie on the ground.
  ok(
    betaMaxFor(20, b) > betaMaxFor(480, b),
    'a close camera may get more horizontal than a far one'
  );
  near(betaMaxFor(480, b), b.betaMaxFar, 1e-9, 'and the far end is exactly betaMaxFar');
  near(480 * Math.cos(b.betaMaxFar), 132.3, 0.5, 'which keeps a 480 m camera 132 m up');
}

// ── 5. damping settles and never overshoots ───────────────────────────────────────────────────
section('damping');
{
  ok(damp(0, 100, 22, 1000) <= 100, 'a huge dt cannot overshoot');
  ok(damp(0, 100, 22, 1000) > 99.99, 'and does settle');
  ok(damp(0, 100, 22, 0.1) < 100, 'a normal step does not jump to the goal');
  near(damp(0, 100, 0, 0.016), 100, 1e-9, 'rate 0 snaps');
  // Frame-rate independence: the same elapsed time in one step and in sixty.
  let a = 0;
  for (let i = 0; i < 60; i++) a = damp(a, 100, 12, 1 / 60);
  near(a, damp(0, 100, 12, 1), 1e-9, 'sixty small steps equal one big one');
  near(wrapPi(Math.PI * 3), -Math.PI, 1e-9, 'angles wrap to [−PI, PI)');
  near(wrapPi(-Math.PI * 3), -Math.PI, 1e-9, 'from both sides');
  near(wrapPi(0.3 - 6.1), 0.3 - 6.1 + 2 * Math.PI, 1e-9, 'and take the short way round');
}

// ── 6. the controller, driven the way a hand drives it ────────────────────────────────────────
section('controller');
{
  const deps = { ground, raycast: raycastAgainst(ground), fov: () => FOV, aspect: () => ASPECT };
  const c = createCameraController(deps, {
    target: [0, 0, 0],
    alpha: -1.05,
    beta: 1.2,
    radius: 200,
  });

  // Grab-the-world, on flat ground, end to end: the point picked at pointer-down must still be
  // under the cursor after the drag AND after the ease has settled.
  //
  // Flat on purpose, and the reason is a real limit of the algorithm rather than a convenience.
  // The drag holds the grabbed point on the horizontal PLANE it was picked on, because that is the
  // only surface a pointer motion can be inverted against in closed form. Over relief the terrain
  // and that plane diverge, so on the hill below the same drag slips 10.66 m — the picture is that
  // the ground under the cursor slides when you drag across a hillside. It is what every RTS does
  // and it is still worth writing down.
  const flatDeps = {
    ground: flat,
    raycast: raycastAgainst(flat),
    fov: () => FOV,
    aspect: () => ASPECT,
  };
  const cf = createCameraController(flatDeps, {
    target: [0, 0, 0],
    alpha: -1.05,
    beta: 1.2,
    radius: 200,
  });
  const from = { x: -0.3, y: -0.2 };
  const to = { x: 0.25, y: 0.1 };
  const grabbed = cf.pickGround(from);
  ok(grabbed !== null, 'the grab point exists');
  cf.beginDrag('pan', from);
  cf.dragTo(to);
  cf.endDrag();
  for (let i = 0; i < 400; i++) cf.update(1 / 60);
  const landed = cf.pickGround(to);
  ok(landed !== null, 'the released point resolves');
  const slip = Math.hypot(landed[0] - grabbed[0], landed[2] - grabbed[2]);
  ok(
    slip < 0.5,
    'the grabbed point is still under the cursor after the drag',
    `${slip.toFixed(3)} m`
  );

  // Over relief the plane invariant still holds exactly, which is the thing the code promises.
  const gp = c.pickGround(from);
  c.beginDrag('pan', from);
  c.dragTo(to);
  const onPlane = planeHit(screenRay(c.goal(), to, FOV, ASPECT), gp[1]);
  c.endDrag();
  ok(
    Math.hypot(onPlane[0] - gp[0], onPlane[2] - gp[2]) < 0.01,
    'over a hill the grabbed point holds on its own plane to a centimetre',
    `${Math.hypot(onPlane[0] - gp[0], onPlane[2] - gp[2]).toFixed(4)} m`
  );

  // Direction: dragging the cursor right moves the world right, i.e. the camera left.
  const c2 = createCameraController(deps, {
    target: [0, 0, 0],
    alpha: -Math.PI / 2,
    beta: 1.2,
    radius: 200,
  });
  const startX = c2.goal().target[0];
  c2.beginDrag('pan', { x: 0, y: -0.3 });
  c2.dragTo({ x: 0.4, y: -0.3 });
  c2.endDrag();
  const r2 = rightOf(c2.goal().alpha);
  const movedAlongRight =
    (c2.goal().target[0] - startX) * r2[0] + (c2.goal().target[2] - 0) * r2[2];
  ok(
    movedAlongRight < -1,
    'dragging right moves the camera left',
    `${movedAlongRight.toFixed(2)} m`
  );

  // Momentum: a fling keeps going and then stops on its own.
  const c3 = createCameraController(deps, {
    target: [0, 0, 0],
    alpha: -1.0,
    beta: 1.2,
    radius: 200,
  });
  c3.beginDrag('pan', { x: 0, y: 0 });
  for (let i = 1; i <= 6; i++) {
    c3.dragTo({ x: i * 0.05, y: 0 });
    c3.update(1 / 60);
  }
  const atRelease = [...c3.goal().target];
  c3.endDrag();
  c3.update(1 / 60);
  const oneFrameLater = [...c3.goal().target];
  const carried = Math.hypot(oneFrameLater[0] - atRelease[0], oneFrameLater[2] - atRelease[2]);
  ok(carried > 0.05, 'the release carries on moving', `${carried.toFixed(3)} m in one frame`);
  for (let i = 0; i < 600; i++) c3.update(1 / 60);
  const settledA = [...c3.goal().target];
  for (let i = 0; i < 120; i++) c3.update(1 / 60);
  const settledB = [...c3.goal().target];
  near(
    Math.hypot(settledB[0] - settledA[0], settledB[2] - settledA[2]),
    0,
    1e-6,
    'and then settles rather than drifting'
  );
  ok(!c3.moving(), 'and reports itself stopped');

  // Zoom towards the cursor: the pivot holds and the radius shrinks.
  const c4 = createCameraController(deps, {
    target: [0, 0, 0],
    alpha: -1.0,
    beta: 1.2,
    radius: 200,
  });
  const zndc = { x: 0.4, y: -0.25 };
  const zpivot = c4.pickGround(zndc);
  c4.zoomAt(zndc, 3);
  for (let i = 0; i < 400; i++) c4.update(1 / 60);
  ok(
    c4.goal().radius < 200,
    'three notches in shrink the radius',
    `${c4.goal().radius.toFixed(1)} m`
  );
  const zafter = c4.pickGround(zndc);
  const zslip = Math.hypot(zafter[0] - zpivot[0], zafter[2] - zpivot[2]);
  ok(zslip < 3, 'and the point under the cursor stays there', `${zslip.toFixed(2)} m`);

  // The camera can never be driven under the ground, however hard it is pushed.
  const c5 = createCameraController(deps, {
    target: [-60, ground(-60, 40), 40],
    alpha: 0,
    beta: 1.2,
    radius: 40,
  });
  let worstAir = Infinity;
  for (let i = 0; i < 900; i++) {
    c5.setPanAxis(Math.sin(i / 37) * 3, Math.cos(i / 23) * 3);
    c5.setSpinAxis(Math.sin(i / 11), 1);
    c5.setZoomAxis(1);
    c5.update(1 / 60);
    const e = eyeOf(c5.pose());
    worstAir = Math.min(worstAir, e[1] - ground(e[0], e[2]));
  }
  ok(
    worstAir >= DEFAULT_BOUNDS.eyeClearance - 1e-3,
    '900 frames of hostile input never break the floor',
    `worst ${worstAir.toFixed(4)} m`
  );

  // Adopting an outside write (a showcase setting alpha/beta directly).
  const c6 = createCameraController(deps, { target: [0, 0, 0], alpha: 0, beta: 1, radius: 100 });
  c6.adopt({ target: [12, 3, -8], alpha: 2, beta: 0.8, radius: 60 });
  near(c6.pose().alpha, 2, 1e-9, 'an adopted pose is shown at once');
  near(c6.goal().radius, 60, 1e-9, 'and becomes the goal, so nothing eases back');
}

// ── 7. presets are content ────────────────────────────────────────────────────────────────────
section('presets');
{
  resetCameraPresets();
  ok(cameraPresets().length === CAMERA_PRESET_MANIFEST.length, 'the built-ins are all registered');
  for (const name of ['overview', 'entrance', 'close', 'ground', 'coaster', 'pool', 'night']) {
    ok(!!cameraPreset(name), `the harness's "${name}" preset exists`);
  }

  // A pack entry.
  const def = registerCameraPreset({
    id: 'lookout',
    anchor: 'xz:120,-40 | park:centre',
    height: 4,
    bearing: 45,
    pitch: 18,
    distance: 90,
  });
  ok(cameraPreset('lookout') === def, 'a pack preset lands in the catalogue');
  // And can replace a built-in in place.
  registerCameraPreset({ id: 'overview', target: [1, 2, 3], bearing: 90, pitch: 30, distance: 50 });
  near(cameraPreset('overview').distance, 50, 1e-9, 'a pack may redefine a built-in by id');
  resetCameraPresets();
  near(
    cameraPreset('overview').distance,
    CAMERA_PRESET_MANIFEST.find((p) => p.id === 'overview').distance,
    1e-9,
    'and the reset restores it'
  );

  // The parser refuses what it cannot use, with the field named.
  const bad = [
    [{}, 'no id'],
    [{ id: 'Nope', bearing: 0 }, 'a capital in the id'],
    [{ id: 'x', bearing: 0 }, 'no anchor and no target'],
    [{ id: 'x', anchor: 'park:centre' }, 'no bearing'],
    [{ id: 'x', anchor: 'park:centre', bearing: 0, frameRadius: 'huge' }, 'a bad frameRadius'],
    [{ id: 'x', target: [1, 2], bearing: 0 }, 'a two-element target'],
  ];
  for (const [entry, why] of bad) {
    let threw = false;
    try {
      parseCameraPreset(entry);
    } catch {
      threw = true;
    }
    ok(threw, `the parser refuses ${why}`);
  }

  // The pack seam, both halves: packs already registered AND packs registered later.
  const early = {
    id: 'early',
    cameraPresets: [
      { id: 'early-shot', anchor: 'park:centre', bearing: 10, pitch: 20, distance: 60 },
    ],
  };
  const late = {
    id: 'late',
    cameraPresets: [
      { id: 'late-shot', anchor: 'park:centre', bearing: 20, pitch: 20, distance: 70 },
    ],
  };
  const claimed = [];
  const listeners = [];
  const fakeRegistry = {
    registerPackCategory: (c, o) => claimed.push(`${c}:${o}`),
    packs: () => [early],
    onPack: (fn) => {
      listeners.push(fn);
      return () => {};
    },
  };
  const detach = attachCameraPresets(fakeRegistry);
  ok(claimed.includes('cameraPresets:camera'), 'the module claims its pack category');
  ok(!!cameraPreset('early-shot'), 'a pack registered BEFORE the module was built is read');
  listeners[0](late);
  ok(!!cameraPreset('late-shot'), 'and one registered after it is read too');
  // A broken entry in a pack must not take the others down. The module warns; muted here so the
  // expected warning does not read as a test failure.
  const warn = console.warn;
  console.warn = () => {};
  listeners[0]({
    id: 'mixed',
    cameraPresets: [
      { id: 'BAD ID' },
      { id: 'good-shot', anchor: 'park:centre', bearing: 0, pitch: 20, distance: 30 },
    ],
  });
  console.warn = warn;
  ok(!!cameraPreset('good-shot'), 'one bad entry does not lose the rest of the pack');
  detach();
  resetCameraPresets();
}

// ── 8. preset → pose ──────────────────────────────────────────────────────────────────────────
section('preset framing');
{
  const anchor = { x: 10, z: -20, y: 4, radius: 30, from: 'test' };
  const p = poseFromPreset(
    { id: 't', anchor: 'x', height: 2, bearing: 210, pitch: 15.5, distance: 340 },
    anchor,
    FOV
  );
  near(p.target[1], 6, 1e-9, 'height is measured from the anchor ground');
  near(p.radius, 340, 1e-9, 'and the distance is taken as written');
  near(betaToPitch(p.beta), 15.5, 1e-9, 'and the pitch survives the conversion');

  // `frameRadius: auto` frames what the anchor reported.
  const framed = poseFromPreset(
    { id: 'f', anchor: 'x', bearing: 0, pitch: 20, frameRadius: 'auto', fill: 0.5 },
    anchor,
    FOV
  );
  near(framed.radius, distanceForRadius(30, FOV, 0.5), 1e-9, 'auto framing uses the anchor radius');
  ok(
    framed.radius > 100,
    'a 30 m thing at half the frame height needs a real distance',
    `${framed.radius.toFixed(1)} m`
  );

  // `eyeHeight` solves the pitch instead of the author doing it in their head.
  const eyeLevel = poseFromPreset(
    { id: 'g', anchor: 'x', height: 1.6, eyeHeight: 1.75, bearing: 0, distance: 26 },
    anchor,
    FOV
  );
  const e = eyeOf(eyeLevel);
  near(e[1] - anchor.y, 1.75, 1e-6, 'the eye lands at exactly the height asked for');
  ok(
    Math.abs(horizonRow(betaToPitch(eyeLevel.beta), FOV) - 360) < 6,
    'and the horizon lands within six pixels of the frame centre',
    `${horizonRow(betaToPitch(eyeLevel.beta), FOV).toFixed(1)}`
  );

  ok(
    poseFromPreset({ id: 'n', anchor: 'x', bearing: 0, pitch: 20, distance: 10 }, null, FOV) ===
      null,
    'a preset whose whole anchor chain fails yields no pose'
  );
}

// ── 9. anchors ────────────────────────────────────────────────────────────────────────────────
section('anchors');
{
  const entities = [
    { id: 'a', kind: 'shop', pack: 'p', item: 'i', position: [10, 0, 10], yaw: 0 },
    { id: 'b', kind: 'shop', pack: 'p', item: 'i', position: [-10, 0, 30], yaw: 0 },
    { id: 'c', kind: 'scenery', pack: 'p', item: 'i', position: [200, 0, 200], yaw: 0 },
  ];
  const ctx = {
    ground: (x, z) => 1 + x * 0 + z * 0,
    entities: () => entities,
    half: 256,
    waterLevel: () => -1,
    entrance: () => ({ x: 0, z: 228 }),
    plots: () => [{ id: 'coaster', x: -96, z: -52, sizeX: 58, sizeZ: 48 }],
  };
  const table = new AnchorTable();
  near(table.resolve('park:centre', ctx).x, 0, 1e-9, 'park:centre is the origin');
  near(
    table.resolve('park:entrance', ctx).z,
    228,
    1e-9,
    'park:entrance comes from the paths module'
  );
  const plot = table.resolve('plot:coaster', ctx);
  near(plot.x, -96, 1e-9, 'plot: comes from the demo park');
  near(plot.radius, 29, 1e-9, 'and its radius is half its longest side');
  const shops = table.resolve('kinds:shop', ctx);
  near(shops.x, 0, 1e-9, 'kinds: is the centroid of the entities of those kinds');
  near(shops.z, 20, 1e-9, 'in both axes');
  ok(table.resolve('kinds:pool', ctx) === null, 'and answers null when there are none');
  // The chain: first hit wins, misses fall through.
  ok(
    table.resolve('kinds:pool | plot:coaster | park:centre', ctx).from === 'plot:coaster',
    'a chain falls through to the first thing that exists'
  );
  ok(table.resolve('kinds:pool | kinds:flume', ctx) === null, 'a chain of misses is a miss');
  ok(table.resolve('entity:b', ctx).z === 30, 'entity: finds one by id');
  ok(
    table.resolve('nonsense:x | park:centre', ctx).from === 'park:centre',
    'an unknown prefix is a miss, not a throw'
  );

  // A module can add its own resolver, and shadow a built-in.
  const off = table.register('ride', () => ({ x: 5, z: 5, y: 0, radius: 9, from: 'ride:test' }));
  ok(table.resolve('ride:anything', ctx).from === 'ride:test', 'a registered resolver answers');
  off();
  ok(table.resolve('ride:anything | park:centre', ctx).from === 'park:centre', 'and unregisters');
}

// ── 10. the view store is honest about a storage that refuses ─────────────────────────────────
section('view state');
{
  const map = new Map();
  const fake = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
  const store = createViewStore('w:1', fake);
  ok(store.read() === null, 'an empty store reads null');
  store.write({ target: [1.234, 2, 3], alpha: 0.5, beta: 1.2, radius: 90 });
  near(store.read().target[0], 1.23, 1e-9, 'a written pose reads back');
  map.set('parkfan-coaster:view:w:1', '{not json');
  ok(store.read() === null, 'a corrupt entry reads as no view rather than throwing');
  map.set('parkfan-coaster:view:w:1', JSON.stringify({ v: 99, t: [0, 0, 0], a: 0, b: 1, r: 1 }));
  ok(store.read() === null, 'and so does one from a future version');
  const throwing = createViewStore('w:1', {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
    removeItem: () => {
      throw new Error('blocked');
    },
  });
  ok(throwing.read() === null, 'a browser with site data blocked reads null');
  throwing.write({ target: [0, 0, 0], alpha: 0, beta: 1, radius: 1 });
  ok(true, 'and swallows the write');
}

console.log(
  failures === 0
    ? `\n✓ camera selftest: ${checks} checks clean`
    : `\n✗ camera selftest: ${failures} of ${checks} checks failed`
);
process.exit(failures === 0 ? 0 : 1);
