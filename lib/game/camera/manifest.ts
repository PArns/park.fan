/**
 * Camera presets are content.
 *
 * A scenario that opens on its own vista, a pack that ships a park and the shot it wants to be
 * seen from, a critic who wants a fifth angle — none of them should need a TypeScript edit, and
 * none of them do: a preset is a JSON object under a pack's `cameraPresets` key, validated here,
 * and the module never learns its id. `registerPackCategory('cameraPresets', 'camera')` claims the
 * key so `unclaimedPackKeys()` stops reporting it, which is the mechanism `terrain/manifest.ts`
 * and `guests/manifest.ts` already use.
 *
 * **Both halves are needed.** `registry.onPack` fires on REGISTRATION, and `host.boot()` registers
 * the bundled packs at step 2 — before any module's `main()` runs at step 5. A listener alone
 * would therefore miss exactly the packs the game ships with, which is the trap four modules fell
 * into before this one. So: walk `registry.packs()` for what is already there, and subscribe for
 * what comes later.
 *
 * Pure — no Babylon, no DOM, no registry import (the slice it needs is an interface below), so
 * `selftest.mjs` can exercise the parser under node.
 */

import type { AnchorSample, CameraPose, CameraPresetDef } from './types';
import { bearingToAlpha, clamp, distanceForRadius, pitchToBeta } from './pose';

/**
 * The seven presets `core/host.ts` asks for, and what each one is trying to show.
 *
 * The angles are authored as `bearing` (compass, from north) and `pitch` (degrees below the
 * horizon) rather than as `alpha`/`beta`, for the reason `types.ts` gives at length. Where a
 * number is inherited from `FALLBACK_PRESETS` it is inherited on purpose — the host's docblock
 * records two rounds of getting `overview` wrong and one round of reading a frame with no horizon
 * in it as evidence about the sky, and 15.5 degrees is the number that came out of that. It puts
 * the horizon on row 153 of 720 and gives the sky the top fifth of the frame.
 *
 * What has changed is not the geometry but what the geometry is aimed at: every target is an
 * anchor chain resolved against the world, so the height comes off the terrain instead of being
 * guessed (the fallback's `overview` floats its target at y = 8 over ground at y = 0.2), and
 * `coaster` / `pool` / `close` follow the things they are named after as soon as those exist.
 */
export const CAMERA_PRESET_MANIFEST: readonly CameraPresetDef[] = [
  {
    // The whole park with the sky over it. 15.5 degrees is inherited deliberately — see above.
    //
    // The bearing and the distance are not. Shot both ways against the same stepped world: at the
    // fallback's 210 the camera stands north-north-east and the built half of the park (gate,
    // main street, both plazas) is in the FAR third at 340 m, with the near half empty grass. At
    // 30 it stands south-south-west with that half nearest, and 400 m is what stops the entrance
    // plaza being cut by the bottom edge — 340 and 360-with-offset both cut it.
    id: 'overview',
    anchor: 'park:centre',
    height: 8,
    bearing: 30,
    pitch: 15.5,
    distance: 400,
  },
  {
    // The gate arch in the near third, the plaza and the main street behind it.
    //
    // Aimed at the gate itself the first time, which was worse than the fallback and measurably
    // so: `paths.entrance()` is the gate NODE at (0, 228), so the camera sat at z = 316.7 — 88 m
    // out over the apron, with the arch 107 m away instead of the fallback's 44. `offset` puts
    // the target 55 m up the street, which lands the eye at z = 259 against the fallback's 254
    // while still following the gate wherever a park puts it.
    id: 'entrance',
    anchor: 'park:entrance | park:centre',
    height: 3,
    offset: 55,
    bearing: 0,
    pitch: 21,
    distance: 88,
  },
  {
    // The shop frontages on the main street — the densest built thing in the park — from the
    // south, looking up it. Falls back to the middle of the park when nothing is built yet.
    //
    // A fixed distance rather than `frameRadius: 'auto'`, and the first version got that wrong:
    // the shop row is 137 m long, so framing its whole 68.4 m radius put the camera 228 m out —
    // a second overview under the name `close`, against the fallback's 40 m. `close` means close.
    id: 'close',
    anchor: 'kinds:shop,ride,coaster,flume,pool,building | park:centre',
    height: 3,
    bearing: 15,
    pitch: 22,
    distance: 40,
  },
  {
    // Standing in the middle of the main street, looking up it. `eyeHeight` solves the pitch so
    // the eye sits 1.75 m over the ground; the ground clamp then raises it to 1.81 m here because
    // the street climbs 0.9 m over the 26 m ahead, which is the clamp doing its job.
    //
    // The 105 m is the one number in the built-in set that is tuned to the demo park, and it is
    // here because the alternative was measurably worse: anchored on the centroid of the built
    // things the camera stands at x = 6.86, i.e. on the east kerb of an 8 m street, and both the
    // noon and the night frame have the avenue running out of the left of the picture. Off the
    // gate plus 105 m it stands at x = 0 and the avenue is symmetrical. A pack that disagrees
    // replaces this entry with one JSON object.
    id: 'ground',
    anchor: 'park:entrance | park:centre',
    height: 1.6,
    offset: 105,
    bearing: 0,
    eyeHeight: 1.75,
    distance: 26,
  },
  {
    // 20 degrees, not the fallback's 30: at 30 the whole frame is ground. `horizonRow()` says
    // −70 of 720 for the fallback and 89 for this, and a frame with no horizon in it is the exact
    // shape of the mistake `core/host.ts` spent two rounds on.
    id: 'coaster',
    anchor: 'kinds:coaster | plot:coaster | park:centre',
    height: 10,
    bearing: 200,
    pitch: 20,
    frameRadius: 'auto',
    fill: 0.5,
  },
  {
    id: 'pool',
    anchor: 'kinds:pool | park:water | plot:water-park | park:centre',
    height: 4,
    bearing: 300,
    pitch: 20,
    frameRadius: 'auto',
    fill: 0.55,
  },
  {
    // Not a second overview. At 22:00 the thing worth photographing is the lit part of the park —
    // lamp posts, shop signage, guests still walking — and from an overview's 400 m those are a
    // scatter of dots. This sits over the main street at 150 m, which is the distance at which a
    // 3.2 m lamp post is still an object.
    id: 'night',
    anchor: 'kinds:shop,ride,coaster,flume,pool,building | park:centre',
    height: 5,
    bearing: 15,
    pitch: 18,
    distance: 150,
  },
];

const presets = new Map<string, CameraPresetDef>(
  CAMERA_PRESET_MANIFEST.map((p) => [p.id, { ...p }])
);

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

/** Validate one manifest entry. Throws with the offending field named. */
export function parseCameraPreset(input: unknown): CameraPresetDef {
  const raw = input as Partial<CameraPresetDef> | null;
  if (!raw || typeof raw !== 'object') throw new Error('camera preset: not an object');
  if (typeof raw.id !== 'string' || !/^[a-z0-9-]+$/.test(raw.id)) {
    throw new Error(`camera preset: id "${String(raw.id)}" must match /^[a-z0-9-]+$/`);
  }
  const bearing = num(raw.bearing);
  if (bearing === undefined) throw new Error(`camera preset "${raw.id}": bearing must be a number`);
  if (raw.anchor !== undefined && typeof raw.anchor !== 'string') {
    throw new Error(`camera preset "${raw.id}": anchor must be a string chain`);
  }
  if (raw.target !== undefined) {
    const t = raw.target as unknown;
    if (!Array.isArray(t) || t.length !== 3 || t.some((n) => typeof n !== 'number')) {
      throw new Error(`camera preset "${raw.id}": target must be [x, y, z]`);
    }
  }
  if (
    raw.frameRadius !== undefined &&
    raw.frameRadius !== 'auto' &&
    num(raw.frameRadius) === undefined
  ) {
    throw new Error(`camera preset "${raw.id}": frameRadius must be a number or "auto"`);
  }
  if (raw.anchor === undefined && raw.target === undefined) {
    throw new Error(`camera preset "${raw.id}": needs an anchor chain or an explicit target`);
  }
  const def: CameraPresetDef = {
    id: raw.id,
    bearing,
    anchor: raw.anchor,
    target: raw.target,
    height: num(raw.height),
    offset: num(raw.offset),
    pitch: num(raw.pitch),
    eyeHeight: num(raw.eyeHeight),
    distance: num(raw.distance),
    frameRadius: raw.frameRadius === 'auto' ? 'auto' : num(raw.frameRadius),
    fill: num(raw.fill),
  };
  if (def.pitch === undefined && def.eyeHeight === undefined) def.pitch = 20;
  if (def.distance === undefined && def.frameRadius === undefined) def.distance = 120;
  return def;
}

/** Add or replace a preset by id. A pack naming a built-in id replaces it in place. */
export function registerCameraPreset(input: unknown): CameraPresetDef {
  const def = parseCameraPreset(input);
  presets.set(def.id, def);
  return def;
}

export function cameraPreset(id: string): CameraPresetDef | undefined {
  return presets.get(id);
}

export function cameraPresets(): readonly CameraPresetDef[] {
  return [...presets.values()];
}

/** Restore the built-ins; the selftest uses it so one case cannot leak into the next. */
export function resetCameraPresets(): void {
  presets.clear();
  for (const p of CAMERA_PRESET_MANIFEST) presets.set(p.id, { ...p });
}

/**
 * Turn a preset plus a resolved anchor into a pose.
 *
 * `eyeHeight` is solved rather than authored: the eye sits `distance * cos(beta)` above the
 * target, so `sin(pitch) = (eyeHeight - height) / distance`. An eye-level preset written any
 * other way is a person doing that arithmetic in their head, which is the same class of mistake
 * as writing `beta = PI/2.05` and hoping.
 */
export function poseFromPreset(
  def: CameraPresetDef,
  anchor: AnchorSample | null,
  fov: number,
  ground: (x: number, z: number) => number = () => 0
): CameraPose | null {
  let x: number;
  let z: number;
  let base: number;
  let contentRadius = 30;
  if (def.target) {
    [x, base, z] = def.target;
  } else if (anchor) {
    // Slide along the bearing before reading the ground, so `height` is measured where the camera
    // is actually pointed rather than at the anchor it started from.
    const b = def.bearing * (Math.PI / 180);
    const lead = def.offset ?? 0;
    x = anchor.x + Math.sin(b) * lead;
    z = anchor.z - Math.cos(b) * lead;
    base = (lead === 0 ? anchor.y : ground(x, z)) + (def.height ?? 2);
    contentRadius = anchor.radius;
  } else {
    return null;
  }

  let distance = def.distance ?? 120;
  if (def.frameRadius !== undefined) {
    const r = def.frameRadius === 'auto' ? contentRadius : def.frameRadius;
    distance = distanceForRadius(r, fov, def.fill ?? 0.8);
  }
  distance = Math.max(2, distance);

  let pitch: number;
  if (def.eyeHeight !== undefined) {
    const rise = clamp((def.eyeHeight - (def.height ?? 2)) / distance, -1, 1);
    pitch = (Math.asin(rise) * 180) / Math.PI;
  } else {
    pitch = def.pitch ?? 20;
  }

  return {
    target: [x, base, z],
    alpha: bearingToAlpha(def.bearing),
    beta: pitchToBeta(pitch),
    radius: distance,
  };
}

/** The slice of `Registry` this needs, so the file stays free of a core import. */
export interface CameraPresetRegistry {
  registerPackCategory(category: string, owner: string): void;
  packs(): readonly unknown[];
  onPack(fn: (pack: unknown) => void): () => void;
}

/**
 * Claim `cameraPresets` and read it off every pack, present and future.
 *
 * A bad entry is named and skipped rather than thrown: one broken preset in a third-party pack
 * must not take the other seven — and with them every screenshot the harness can take — down with
 * it.
 */
export function attachCameraPresets(registry: CameraPresetRegistry): () => void {
  registry.registerPackCategory('cameraPresets', 'camera');
  const read = (pack: unknown): void => {
    const manifest = pack as { id?: string; cameraPresets?: unknown };
    if (!Array.isArray(manifest.cameraPresets)) return;
    for (const entry of manifest.cameraPresets) {
      try {
        registerCameraPreset(entry);
      } catch (error) {
        console.warn(`[game/camera] pack "${manifest.id}" has a bad camera preset`, error);
      }
    }
  };
  for (const pack of registry.packs()) read(pack);
  return registry.onPack(read);
}
