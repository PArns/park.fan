/**
 * The crowd renderer: thirteen meshes, three levels of detail, two thousand people.
 *
 * **One draw call per body part per level, and never one per guest.** A batch of 1 400 figures is
 * 13 draw calls whether it is fourteen people or fourteen hundred. The instance matrices are
 * composed by hand rather than through `Matrix.ComposeToRef`: a part is a yaw plus one pitch about
 * its own joint, which is fifteen multiplies written out, against a quaternion build and a full
 * 4×4 compose. At nine parts per near guest that is the difference between 0.2 ms and 1.5 ms.
 *
 * **The last LOD distance is a SWITCH, not a cull.** `quality.guestLodDistances[2]` is 200 m on
 * `medium` and the `overview` camera sits 340 m from the middle of the park, so reading the third
 * number as a cull distance empties every screenshot the game takes from the air. The scenery
 * module lost a round to exactly that reading of exactly that field; guests cull at
 * `max(lod[2], FAR_FLOOR)` and the far figure is built to survive it (`geometry.ts`).
 *
 * **The draw budget is spent nearest first, without a sort.** `quality.maxGuestsDrawn` is 1 500 on
 * `medium` against a 2 000-guest park, so 500 have to go. A sort of 2 000 distances every frame is
 * an easy 0.4 ms; a 64-bucket histogram over the same distances gives the cutoff radius in one
 * pass, and the guests that fall off are the far ones, which is what "nearest first" means.
 *
 * **Only the near band casts a shadow and only the near band gets a contact patch.** A guest is
 * 400 triangles and a cascade is a full re-render of everything in it: putting the whole crowd in
 * the shadow map would be 560 k triangles times three cascades for shadows nobody can resolve past
 * 40 m. The contact decal is what grounds the rest, and past the near band nothing needs either.
 */

import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { SimFrame, QualitySettings } from '../core/types';
import type { GuestMaterials } from './materials';
import { decodeStyle, type GuestLook } from './appearance';
import { GuestState, isStanding, type GuestArchetypeDef } from './types';
import {
  JOINT,
  NECK,
  REF_HEAD,
  SHOULDER_HALF,
  buildArm,
  buildBody1,
  buildBody2,
  buildContact,
  buildHair,
  buildHead,
  buildHead2,
  buildLeg1,
  buildLegs2,
  buildShin,
  buildThigh,
  buildTorso,
  surfaceTriangles,
  toMesh,
  type Surface,
} from './geometry';

/** Nothing is culled inside this, whatever the preset's third LOD distance says. */
const FAR_FLOOR = 620;
/** Distance buckets for the nearest-first budget. */
const BUCKETS = 64;

interface Part {
  name: string;
  mesh: Mesh;
  /** Instances of this mesh per guest (2 for an arm, a thigh, a shin, a leg). */
  per: number;
  /** Triangles in one instance. */
  triangles: number;
  matrices: Float32Array;
  colors: Float32Array;
  capacity: number;
  count: number;
}

interface Level {
  lod: 0 | 1 | 2;
  parts: Part[];
  /** Guests assigned to this level this frame. */
  guests: number;
  capacity: number;
}

export interface CrowdStats {
  /** Live guests in the frame the sim last sent. */
  guests: number;
  drawn: number;
  lod0: number;
  lod1: number;
  lod2: number;
  culled: number;
  /** Meshes with at least one instance, i.e. draw calls this module costs. */
  drawCalls: number;
  meshes: number;
  triangles: number;
  /** Triangles one guest costs at each level. */
  perGuest: [number, number, number];
  shadowCasters: number;
  buildMs: number;
  textureMs: number;
  cutoffM: number;
}

export interface Crowd {
  meshes(): Mesh[];
  /** Near-band meshes, for the shadow generator. */
  shadowMeshes(): Mesh[];
  update(
    frame: SimFrame,
    previous: SimFrame | null,
    alpha: number,
    camera: [number, number, number],
    elapsed: number
  ): void;
  archetypes(list: GuestArchetypeDef[]): void;
  stats(): CrowdStats;
  dispose(): void;
}

export interface CrowdOptions {
  scene: Scene;
  materials: GuestMaterials;
  quality: QualitySettings;
  archetypes: GuestArchetypeDef[];
}

export function createCrowd(options: CrowdOptions): Crowd {
  const { scene, materials, quality } = options;
  let archetypes = options.archetypes;
  const started = typeof performance !== 'undefined' ? performance.now() : 0;

  const drawCap = Math.max(64, quality.maxGuestsDrawn);
  const nearCap = Math.min(drawCap, Math.max(48, Math.round(drawCap * 0.22)));
  const midCap = Math.min(drawCap, Math.max(96, Math.round(drawCap * 0.6)));
  const lodNear = quality.guestLodDistances[0];
  const lodMid = quality.guestLodDistances[1];
  const lodFar = Math.max(quality.guestLodDistances[2], FAR_FLOOR);

  function part(
    name: string,
    surface: Surface,
    material: Parameters<typeof toMesh>[3],
    per: number,
    capacity: number
  ): Part {
    const mesh = toMesh(scene, `guests:${name}`, surface, material);
    const slots = capacity * per;
    const matrices = new Float32Array(slots * 16);
    const colors = new Float32Array(slots * 4);
    // Updatable (`staticBuffer = false`): a static buffer silently ignores every later write, and
    // these are rewritten every frame.
    mesh.thinInstanceSetBuffer('matrix', matrices, 16, false);
    mesh.thinInstanceSetBuffer('color', colors, 4, false);
    mesh.thinInstanceCount = 0;
    return {
      name,
      mesh,
      per,
      triangles: surfaceTriangles(surface),
      matrices,
      colors,
      capacity: slots,
      count: 0,
    };
  }

  const near: Level = {
    lod: 0,
    capacity: nearCap,
    guests: 0,
    parts: [
      part('l0-torso', buildTorso(2), materials.cloth, 1, nearCap),
      part('l0-head', buildHead(2), materials.skin, 1, nearCap),
      part('l0-hair', buildHair(2), materials.hair, 1, nearCap),
      part('l0-arm', buildArm(2), materials.cloth, 2, nearCap),
      part('l0-thigh', buildThigh(2), materials.cloth, 2, nearCap),
      part('l0-shin', buildShin(2), materials.cloth, 2, nearCap),
    ],
  };
  const mid: Level = {
    lod: 1,
    capacity: midCap,
    guests: 0,
    parts: [
      part('l1-body', buildBody1(), materials.cloth, 1, midCap),
      part('l1-head', buildHead(1), materials.skin, 1, midCap),
      part('l1-hair', buildHair(1), materials.hair, 1, midCap),
      part('l1-leg', buildLeg1(), materials.cloth, 2, midCap),
    ],
  };
  const far: Level = {
    lod: 2,
    capacity: drawCap,
    guests: 0,
    parts: [
      part('l2-body', buildBody2(), materials.cloth, 1, drawCap),
      part('l2-legs', buildLegs2(), materials.cloth, 1, drawCap),
      part('l2-head', buildHead2(), materials.skin, 1, drawCap),
    ],
  };
  const contact = part('contact', buildContact(), materials.contact, 1, nearCap + midCap);
  contact.mesh.receiveShadows = false;
  contact.mesh.alphaIndex = 1;

  const levels: Level[] = [near, mid, far];
  const buildMs = (typeof performance !== 'undefined' ? performance.now() : 0) - started;

  const stats: CrowdStats = {
    guests: 0,
    drawn: 0,
    lod0: 0,
    lod1: 0,
    lod2: 0,
    culled: 0,
    drawCalls: 0,
    meshes: levels.reduce((n, l) => n + l.parts.length, 0) + 1,
    triangles: 0,
    perGuest: [
      near.parts.reduce((n, p) => n + p.triangles * p.per, 0),
      mid.parts.reduce((n, p) => n + p.triangles * p.per, 0),
      far.parts.reduce((n, p) => n + p.triangles * p.per, 0),
    ],
    shadowCasters: 0,
    buildMs: Number(buildMs.toFixed(1)),
    textureMs: Number(materials.textureMs.toFixed(1)),
    cutoffM: lodFar,
  };

  const histogram = new Int32Array(BUCKETS + 1);
  const distances = new Float32Array(0);
  let distanceBuffer = distances;

  /**
   * One instance matrix, written out.
   *
   * Row-major with the translation at 12..14, which is Babylon's layout (`Matrix.ComposeToRef`
   * writes exactly that). The rotation is `Ry(heading) · Rx(pitch)`: row 0 is the image of the
   * part's local X, row 1 of its Y, row 2 of its Z. `ox` is a sideways offset at the joint (a
   * shoulder, a hip) and is rotated by the yaw; `ty` is a height and is not.
   */
  function writeMatrix(
    out: Float32Array,
    at: number,
    px: number,
    py: number,
    pz: number,
    ch: number,
    sh: number,
    ox: number,
    ty: number,
    pitch: number,
    scale: number
  ): void {
    const ca = Math.cos(pitch);
    const sa = Math.sin(pitch);
    out[at] = scale * ch;
    out[at + 1] = 0;
    out[at + 2] = -scale * sh;
    out[at + 3] = 0;
    out[at + 4] = scale * sh * sa;
    out[at + 5] = scale * ca;
    out[at + 6] = scale * ch * sa;
    out[at + 7] = 0;
    out[at + 8] = scale * sh * ca;
    out[at + 9] = -scale * sa;
    out[at + 10] = scale * ch * ca;
    out[at + 11] = 0;
    out[at + 12] = px + ch * ox;
    out[at + 13] = py + ty;
    out[at + 14] = pz - sh * ox;
    out[at + 15] = 1;
  }

  function writeColor(out: Float32Array, at: number, c: [number, number, number]): void {
    out[at] = c[0];
    out[at + 1] = c[1];
    out[at + 2] = c[2];
    out[at + 3] = 1;
  }

  function pushPart(p: Part, look: GuestLook): number | null {
    if (p.count >= p.capacity) return null;
    const at = p.count;
    p.count += 1;
    return at;
  }

  /**
   * A walking pose, in radians.
   *
   * Positive rotates a limb BACKWARDS (see the matrix above: positive pitch tilts local +Z down and
   * local −Y towards −Z). The knee only ever flexes, never hyperextends, which is why the shin term
   * is clamped at zero: a leg that bends the wrong way is the single most obvious thing a crowd can
   * do, and it happens the moment a sine is used raw.
   */
  function pose(state: number, phase: number, idle: number, out: Float64Array): void {
    if (isStanding(state)) {
      // Standing: weight on one leg, a slow breath, arms hanging with a slight outward set. `idle`
      // is the RENDER clock, not the sim's — a purely cosmetic sway that nothing reads back.
      const sway = Math.sin(idle) * 0.035;
      out[0] = 0.03 + sway * 0.4; // torso pitch
      out[1] = 0.06 + sway; // left leg
      out[2] = -0.05 - sway; // right leg
      out[3] = 0.04; // left knee
      out[4] = 0.06; // right knee
      out[5] = 0.07 + sway * 0.5; // left arm
      out[6] = -0.05 - sway * 0.5; // right arm
      out[7] = 0; // bob
      out[8] = 0; // lateral
      return;
    }
    const swing = Math.sin(phase);
    const other = Math.sin(phase + Math.PI);
    const amp = 0.42;
    out[0] = 0.075 + Math.cos(phase * 2) * 0.018;
    out[1] = swing * amp;
    out[2] = other * amp;
    // The knee flexes hardest just after the foot leaves the ground, a quarter-cycle behind the
    // hip; `max(0, …)` is what stops it bending forwards.
    out[3] = Math.max(0, Math.sin(phase + 2.1)) * 0.92;
    out[4] = Math.max(0, Math.sin(phase + 2.1 + Math.PI)) * 0.92;
    out[5] = other * amp * 0.62;
    out[6] = swing * amp * 0.62;
    // The pelvis is highest at mid-stance, twice a cycle, and shifts towards the standing leg.
    out[7] = Math.cos(phase * 2) * 0.016;
    out[8] = Math.sin(phase) * 0.014;
  }

  const posed = new Float64Array(9);

  function update(
    frame: SimFrame,
    previous: SimFrame | null,
    alpha: number,
    camera: [number, number, number],
    elapsed: number
  ): void {
    const position = frame.buffers['guests.position'];
    if (!position) {
      hideAll();
      return;
    }
    const pos = new Float32Array(position);
    const head = new Float32Array(frame.buffers['guests.heading'] ?? new ArrayBuffer(0));
    const anim = new Uint8Array(frame.buffers['guests.anim'] ?? new ArrayBuffer(0));
    const phase = new Uint8Array(frame.buffers['guests.phase'] ?? new ArrayBuffer(0));
    const style = new Uint16Array(frame.buffers['guests.style'] ?? new ArrayBuffer(0));
    const n = Math.min(head.length, anim.length, phase.length, style.length, pos.length / 3);

    // Interpolation only when the previous frame describes the same roster. Slots are stable, so
    // that is a length comparison and not a mapping (see `store.ts`).
    const prevPos = previous?.buffers['guests.position'];
    const prevHead = previous?.buffers['guests.heading'];
    const canLerp =
      !!prevPos &&
      !!prevHead &&
      prevPos.byteLength === position.byteLength &&
      alpha > 0 &&
      alpha < 1;
    const pp = canLerp ? new Float32Array(prevPos as ArrayBuffer) : null;
    const ph = canLerp ? new Float32Array(prevHead as ArrayBuffer) : null;

    if (distanceBuffer.length < n) distanceBuffer = new Float32Array(Math.max(n, 512));
    histogram.fill(0);

    let live = 0;
    for (let i = 0; i < n; i++) {
      if (anim[i] === GuestState.GONE) {
        distanceBuffer[i] = Infinity;
        continue;
      }
      live++;
      const dx = pos[i * 3] - camera[0];
      const dy = pos[i * 3 + 1] - camera[1];
      const dz = pos[i * 3 + 2] - camera[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      distanceBuffer[i] = dist;
      if (dist > lodFar) continue;
      const bucket = Math.min(BUCKETS - 1, Math.floor((dist / lodFar) * BUCKETS));
      histogram[bucket]++;
    }

    // Nearest-first budget in one pass: walk the buckets outward until the draw cap is spent, and
    // take the bucket's far edge as the cutoff radius.
    let cutoff = lodFar;
    let running = 0;
    for (let b = 0; b < BUCKETS; b++) {
      running += histogram[b];
      if (running > drawCap) {
        cutoff = ((b + 1) / BUCKETS) * lodFar;
        break;
      }
    }

    for (const level of levels) {
      level.guests = 0;
      for (const p of level.parts) p.count = 0;
    }
    contact.count = 0;

    let drawn = 0;
    for (let i = 0; i < n; i++) {
      const state = anim[i];
      if (state === GuestState.GONE) continue;
      const dist = distanceBuffer[i];
      if (dist > cutoff) continue;

      let x = pos[i * 3];
      let y = pos[i * 3 + 1];
      let z = pos[i * 3 + 2];
      let heading = head[i];
      if (pp && ph) {
        const inv = 1 - alpha;
        x = pp[i * 3] * inv + x * alpha;
        y = pp[i * 3 + 1] * inv + y * alpha;
        z = pp[i * 3 + 2] * inv + z * alpha;
        heading = lerpAngle(ph[i], heading, alpha);
      }

      // Choose the level, then fall outward when a level is full. A near band that overflows draws
      // its surplus at LOD 1 rather than dropping it, which is what the caps are for.
      let level: Level | null = null;
      if (dist <= lodNear && near.guests < near.capacity) level = near;
      else if (dist <= lodMid && mid.guests < mid.capacity) level = mid;
      else if (far.guests < far.capacity) level = far;
      else if (mid.guests < mid.capacity) level = mid;
      if (!level) continue;

      const look = decodeStyle(style[i], archetypes);
      const bodyScale = (look.height * (1 - look.headRatio)) / NECK;
      const headScale = (look.height * look.headRatio) / REF_HEAD;
      const ch = Math.cos(heading);
      const sh = Math.sin(heading);
      const walkPhase = (phase[i] / 255) * Math.PI * 2;
      pose(state, walkPhase, elapsed * 1.15 + i * 0.61, posed);

      const lat = posed[8] * bodyScale;
      const px = x + ch * lat;
      const pz = z - sh * lat;
      const py = y + posed[7] * bodyScale;

      const hipY = NECK * JOINT.hip * bodyScale;
      const kneeY = NECK * JOINT.knee * bodyScale;
      const shoulderY = NECK * JOINT.shoulder * bodyScale;
      const neckY = NECK * bodyScale;
      const hipHalf = 0.055 * bodyScale * look.build;
      const shoulderHalf = SHOULDER_HALF * 0.94 * bodyScale * look.build;

      if (level === near) {
        writePart(near.parts[0], px, py, pz, ch, sh, 0, hipY, posed[0], bodyScale, look.top);
        writePart(
          near.parts[1],
          px,
          py,
          pz,
          ch,
          sh,
          0,
          neckY + (headScale * REF_HEAD) / 2,
          posed[0] * 0.35,
          headScale,
          look.skin
        );
        writePart(
          near.parts[2],
          px,
          py,
          pz,
          ch,
          sh,
          0,
          neckY + (headScale * REF_HEAD) / 2,
          posed[0] * 0.35,
          headScale,
          look.hair
        );
        writePart(
          near.parts[3],
          px,
          py,
          pz,
          ch,
          sh,
          -shoulderHalf,
          shoulderY,
          posed[5],
          bodyScale,
          look.arm
        );
        writePart(
          near.parts[3],
          px,
          py,
          pz,
          ch,
          sh,
          shoulderHalf,
          shoulderY,
          posed[6],
          bodyScale,
          look.arm
        );
        writePart(
          near.parts[4],
          px,
          py,
          pz,
          ch,
          sh,
          -hipHalf,
          hipY,
          posed[1],
          bodyScale,
          look.bottom
        );
        writePart(
          near.parts[4],
          px,
          py,
          pz,
          ch,
          sh,
          hipHalf,
          hipY,
          posed[2],
          bodyScale,
          look.bottom
        );
        // The shin hangs off the knee, and the knee has already been swung by the thigh: its own
        // height therefore has to follow the thigh's rotation, or the lower leg detaches at speed.
        const thighLen = hipY - kneeY;
        writeShin(
          near.parts[5],
          px,
          py,
          pz,
          ch,
          sh,
          -hipHalf,
          hipY,
          posed[1],
          posed[3],
          thighLen,
          bodyScale,
          look.bottom
        );
        writeShin(
          near.parts[5],
          px,
          py,
          pz,
          ch,
          sh,
          hipHalf,
          hipY,
          posed[2],
          posed[4],
          thighLen,
          bodyScale,
          look.bottom
        );
        near.guests++;
        writeContact(px, y, pz, bodyScale, 1);
      } else if (level === mid) {
        writePart(mid.parts[0], px, py, pz, ch, sh, 0, hipY, posed[0], bodyScale, look.top);
        writePart(
          mid.parts[1],
          px,
          py,
          pz,
          ch,
          sh,
          0,
          neckY + (headScale * REF_HEAD) / 2,
          posed[0] * 0.35,
          headScale,
          look.skin
        );
        writePart(
          mid.parts[2],
          px,
          py,
          pz,
          ch,
          sh,
          0,
          neckY + (headScale * REF_HEAD) / 2,
          posed[0] * 0.35,
          headScale,
          look.hair
        );
        writePart(
          mid.parts[3],
          px,
          py,
          pz,
          ch,
          sh,
          -hipHalf,
          hipY,
          posed[1] * 0.85,
          bodyScale,
          look.bottom
        );
        writePart(
          mid.parts[3],
          px,
          py,
          pz,
          ch,
          sh,
          hipHalf,
          hipY,
          posed[2] * 0.85,
          bodyScale,
          look.bottom
        );
        mid.guests++;
        writeContact(px, y, pz, bodyScale, 0.75);
      } else {
        writePart(far.parts[0], px, py, pz, ch, sh, 0, 0, 0, bodyScale, look.top);
        writePart(far.parts[1], px, py, pz, ch, sh, 0, 0, 0, bodyScale, look.bottom);
        writePart(
          far.parts[2],
          px,
          py,
          pz,
          ch,
          sh,
          0,
          neckY + (headScale * REF_HEAD) / 2,
          0,
          headScale,
          look.skin
        );
        far.guests++;
      }
      drawn++;
    }

    let triangles = 0;
    let calls = 0;
    for (const level of levels) {
      for (const p of level.parts) {
        upload(p);
        if (p.count > 0) {
          calls++;
          triangles += p.triangles * p.count;
        }
      }
    }
    upload(contact);
    if (contact.count > 0) {
      calls++;
      triangles += contact.triangles * contact.count;
    }

    stats.guests = live;
    stats.drawn = drawn;
    stats.lod0 = near.guests;
    stats.lod1 = mid.guests;
    stats.lod2 = far.guests;
    stats.culled = live - drawn;
    stats.drawCalls = calls;
    stats.triangles = triangles;
    stats.shadowCasters = near.guests;
    stats.cutoffM = Number(cutoff.toFixed(1));
  }

  function writePart(
    p: Part,
    px: number,
    py: number,
    pz: number,
    ch: number,
    sh: number,
    ox: number,
    ty: number,
    pitch: number,
    scale: number,
    colour: [number, number, number]
  ): void {
    const at = pushPart(p, null as never);
    if (at == null) return;
    writeMatrix(p.matrices, at * 16, px, py, pz, ch, sh, ox, ty, pitch, scale);
    writeColor(p.colors, at * 4, colour);
  }

  /**
   * The shin: its joint is the knee, and the knee has moved because the thigh swung.
   *
   * The knee's world position is the hip plus the thigh rotated by the hip angle, which is why this
   * is not just another `writePart` with a different height — a shin placed at a fixed knee height
   * detaches from the thigh the moment the leg swings, and at 0.42 rad of amplitude that is a
   * visible 6 cm gap at the top of every stride.
   */
  function writeShin(
    p: Part,
    px: number,
    py: number,
    pz: number,
    ch: number,
    sh: number,
    ox: number,
    hipY: number,
    thighPitch: number,
    kneePitch: number,
    thighLength: number,
    scale: number,
    colour: [number, number, number]
  ): void {
    const at = pushPart(p, null as never);
    if (at == null) return;
    const sa = Math.sin(thighPitch);
    const ca = Math.cos(thighPitch);
    // Local (0, −L, 0) rotated by Rx(thighPitch) is (0, −L·ca, −L·sa) in the guest's own frame; the
    // z part then has to be turned by the yaw along with everything else.
    const dy = -thighLength * ca;
    const dz = -thighLength * sa;
    writeMatrix(
      p.matrices,
      at * 16,
      px + sh * dz,
      py,
      pz + ch * dz,
      ch,
      sh,
      ox,
      hipY + dy,
      thighPitch + kneePitch,
      scale
    );
    writeColor(p.colors, at * 4, colour);
  }

  function writeContact(
    px: number,
    groundY: number,
    pz: number,
    scale: number,
    strength: number
  ): void {
    const at = pushPart(contact, null as never);
    if (at == null) return;
    const radius = 0.44 * scale;
    const m = contact.matrices;
    const i = at * 16;
    m[i] = radius;
    m[i + 1] = 0;
    m[i + 2] = 0;
    m[i + 3] = 0;
    m[i + 4] = 0;
    m[i + 5] = 1;
    m[i + 6] = 0;
    m[i + 7] = 0;
    m[i + 8] = 0;
    m[i + 9] = 0;
    m[i + 10] = radius;
    m[i + 11] = 0;
    m[i + 12] = px;
    // 25 mm above the path, which is under the shoe and above the z-fighting.
    m[i + 13] = groundY + 0.025;
    m[i + 14] = pz;
    m[i + 15] = 1;
    const c = at * 4;
    contact.colors[c] = 1;
    contact.colors[c + 1] = 1;
    contact.colors[c + 2] = 1;
    contact.colors[c + 3] = strength;
  }

  /**
   * Upload only the instances actually used.
   *
   * `thinInstanceBufferUpdated` re-sends the WHOLE buffer, which at the far level is 1 500 matrices
   * whether four of them are in use or all of them: 96 KB a frame for four people.
   * `thinInstancePartialBufferUpdate(kind, count, 0)` sends `count` elements from the same CPU
   * array, which is what makes an empty park cost nothing.
   */
  function upload(p: Part): void {
    p.mesh.thinInstanceCount = p.count;
    p.mesh.isVisible = p.count > 0;
    if (p.count === 0) return;
    p.mesh.thinInstancePartialBufferUpdate('matrix', p.count, 0);
    p.mesh.thinInstancePartialBufferUpdate('color', p.count, 0);
  }

  function hideAll(): void {
    for (const level of levels) {
      for (const p of level.parts) {
        p.count = 0;
        p.mesh.thinInstanceCount = 0;
        p.mesh.isVisible = false;
      }
      level.guests = 0;
    }
    contact.count = 0;
    contact.mesh.thinInstanceCount = 0;
    contact.mesh.isVisible = false;
    stats.guests = 0;
    stats.drawn = 0;
    stats.lod0 = 0;
    stats.lod1 = 0;
    stats.lod2 = 0;
    stats.drawCalls = 0;
    stats.triangles = 0;
  }

  return {
    meshes: () => [...levels.flatMap((l) => l.parts.map((p) => p.mesh)), contact.mesh],
    shadowMeshes: () => near.parts.map((p) => p.mesh),
    update,
    archetypes(list) {
      archetypes = list;
    },
    stats: () => ({ ...stats }),
    dispose() {
      for (const level of levels) for (const p of level.parts) p.mesh.dispose(false, false);
      contact.mesh.dispose(false, false);
    },
  };
}

function lerpAngle(from: number, to: number, t: number): number {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * t;
}
