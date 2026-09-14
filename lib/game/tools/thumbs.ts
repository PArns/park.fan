/**
 * The thumbnail studio: one offscreen render per palette item, and nothing per frame.
 *
 * ## Why a picture at all
 *
 * The build bar drew one Lucide line icon per entity KIND, so every ride in the palette was the
 * same pictogram and a carousel and a ferris wheel were the same tile with different words on it.
 * The packs carry an `icons` map, but its values are Lucide names too, so a pack cannot fix it
 * either. What separates a carousel from a ferris wheel is its geometry, and this module already
 * has the geometry.
 *
 * ## Its own scene, and that is the whole reason the picture is stable
 *
 * The park's own scene is lit by a sun that moves and an IBL that turns orange at 18:30 and black
 * at 23:00. A thumbnail rendered in it would change under a player who did nothing but wait, and
 * `--game-stage` — the lit ground the tile draws behind the picture — would have a night mesh
 * standing on a midday lawn. So the studio is a second `Scene` on the SAME engine, with three fixed
 * lights, a small neutral environment cube of its own and an orthographic camera at a fixed
 * three-quarter angle. Nothing in it reads the clock, so the same item renders the same bytes at
 * 09:00 and at 23:00 and in two different runs of the screenshot harness.
 *
 * ## What it costs after the first render: nothing
 *
 * A result is a data URL in a `Map` keyed `pack:item@packVersion`, so a category re-opened is a
 * cache read. Nothing is rendered at boot: a tile asks when it is first drawn, which means opening
 * one tab renders that tab's items and not the catalogue's 55. While the queue has work, ONE
 * thumbnail is rendered per frame of the main scene, on `onAfterRenderObservable` — that is the
 * only moment in a frame when the engine is in a state this can safely borrow, and pacing it to one
 * per frame is what keeps opening a tab from being a stall. The observer is removed the moment the
 * queue empties, so a settled palette costs exactly zero per frame.
 *
 * ## Failure is a Lucide icon and one line in the console
 *
 * A missing thumbnail must never be a blank tile. Every step is guarded, `has()` answers false
 * afterwards, and the tile keeps the kind icon it has today. The warning is logged once per item,
 * because a broken generator would otherwise write a line a frame.
 */

import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Constants } from '@babylonjs/core/Engines/constants';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { RawCubeTexture } from '@babylonjs/core/Materials/Textures/rawCubeTexture';
import { RenderTargetTexture } from '@babylonjs/core/Materials/Textures/renderTargetTexture';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Scene } from '@babylonjs/core/scene';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { MainContext } from '../core/types';
import { createSources, type PreviewBuild, type SourceSet } from './thumb-sources';
import type { PaletteItem } from './types';

/**
 * The picture's own shape, and it is the WELL's shape.
 *
 * Round 1 rendered a 256 × 256 square into a well of 182.4 × 66 CSS px and fitted it with
 * `object-contain`, which fits by the tight axis: the image box collapsed to 66 × 66 in a 182 px
 * well and a wide model — a bench, a shop, a wall panel — then used a third of THAT. Measured on
 * the shipped build the scenery tab averaged 13.3 % of its well and a lamp post managed 4.7 %,
 * which is why every model read as a toy in an empty frame.
 *
 * So the render target, the orthographic box and the tile's well are all one aspect ratio and the
 * fit is exact in both directions. 2:1 rather than the old well's 2.76:1 because the well's shape
 * is this module's to choose too: at 2.76 a ferris wheel can never use more than 36 % of the well
 * however it is framed, since the wheel is square and the well is not.
 *
 * 320 × 160 is 1.75× the desktop well's 182.4 px of width — enough for a 2× display to have
 * something to downsample — and 51,200 pixels against the old square's 65,536, so the readback got
 * cheaper as the picture got bigger.
 */
const THUMB_W = 320;
const THUMB_H = 160;
/** Exported so the tile's well and the studio's frame cannot drift apart. */
export const THUMB_ASPECT = THUMB_W / THUMB_H;
/** How much room to leave around the model inside the frame. */
const PAD = 1.07;
/** How far above the frame's bottom edge the model's lowest point sits, as a fraction of height. */
const FLOOR = 0.06;
/**
 * Frames to wait for a material to compile before giving up on an item.
 *
 * Real frames, not spins: each check costs a full render-list prepare, and this container's
 * Chromium is SwiftShader, where 40 frames is several seconds. A material that is not ready by then
 * is not going to be.
 */
const READY_FRAMES = 40;

/**
 * The three-quarter view, as a direction in world space.
 *
 * +Y up, right-handed, and the camera looks back down this vector at the model's centre. 34° above
 * the horizon: low enough that a ferris wheel is still a wheel and not an ellipse, high enough that
 * a bench is a bench and not a line.
 */
const VIEW_DIR = new Vector3(0.72, 0.56, 0.72);

export interface ThumbnailStats {
  /** Items with a picture in the cache. */
  cached: number;
  /** Items that were asked for and could not be drawn. */
  failed: number;
  /**
   * Milliseconds spent BUILDING and DRAWING, summed — geometry, the render, the readback and the
   * PNG. Not the wall clock from asking to answering, which is dominated by how long a frame takes
   * on the machine: the studio does one item per frame, and this container's SwiftShader renders
   * the demo park at about 0.15 fps, so the two numbers differ by a factor of ten and only this
   * one says anything about the code.
   */
  workMs: number;
  /** Milliseconds the slowest single item's work took. */
  slowestMs: number;
  /** Milliseconds spent waiting for a material to compile, summed. Frames, not work. */
  waitMs: number;
  /** Items still queued. */
  pending: number;
  /** Items waiting for a frame. */
  queued: boolean;
}

/**
 * What one tile gets: the picture, and where the thing in it stands.
 *
 * The contact shadow used to be a fixed `w-[46%]` of the well — 83.9 px at 1440 against a
 * carousel's 38 px of drawn width and a litter bin's 9.5 — i.e. a shadow that said nothing about
 * the object standing on it and contradicted it twice over. The studio already computes the
 * model's ground rectangle to frame it, so it reports it: three fractions of the picture's own
 * box, which is the one thing the tile cannot work out for itself.
 */
export interface ThumbnailPicture {
  /** PNG data URL, `THUMB_W × THUMB_H`. */
  url: string;
  /** The ground rectangle's projected width, as a fraction of the picture's width. */
  shadowWidth: number;
  /** Its projected depth, as a fraction of the picture's height. */
  shadowHeight: number;
  /** The centre of that rectangle above the picture's bottom edge, as a fraction of the height. */
  shadowBottom: number;
  /** The same centre from the picture's left edge. Not 0.5: the frame is centred on the whole
   * model, and a tall thing seen from 34° puts its base off to one side of its own silhouette. */
  shadowLeft: number;
}

export interface ThumbnailStudio {
  /** The cached picture, or null. Synchronous: a tile calls this on every render. */
  get(item: PaletteItem): ThumbnailPicture | null;
  /** True when this item's kind can be drawn at all. */
  covers(item: PaletteItem): boolean;
  /** Queue an item. Resolves with the picture, or null when it cannot be drawn. */
  request(item: PaletteItem): Promise<ThumbnailPicture | null>;
  /**
   * Put these items at the head of the queue, in this order, and drop everything else.
   *
   * The palette opens on whatever category the registry offered first, so 21 scenery tiles are
   * already queued before a player presses a tab — and a FIFO queue then renders all 21 before it
   * reaches the five rides somebody is looking at. Measured on the demo park: after clicking Rides
   * the five tiles still showed their kind icon two minutes later, with the studio reporting five
   * pictures rendered and none of them a ride.
   *
   * Dropping the rest costs nothing: those tiles are unmounted, and re-opening that tab asks
   * again.
   */
  focus(keys: readonly string[]): void;
  stats(): ThumbnailStats;
  dispose(): void;
}

interface Job {
  item: PaletteItem;
  /**
   * Everyone waiting on this render, not one caller.
   *
   * A tab switched away and back unmounts and remounts its tiles, so the second tile asks for a
   * picture whose render is still in the queue. Handing that caller a null would leave the tile on
   * its Lucide icon for ever, with the render it was waiting for landing in the cache one frame
   * later and nothing to tell it.
   */
  waiting: Array<(picture: ThumbnailPicture | null) => void>;
}

function cacheKey(item: PaletteItem, packVersion: string): string {
  // `pack:item@packVersion`, and never the generator name: `kiosk-round` is shared by five shops
  // and `kiosk-a` by three, so a cache keyed by generator would hand the smoothie stand the
  // lemonade stand's picture — which is the failure this whole module exists to end.
  return `${item.key}@${packVersion}`;
}

export function createThumbnailStudio(ctx: MainContext): ThumbnailStudio {
  const engine = ctx.engine as AbstractEngine;
  const host = ctx.scene as Scene;
  const cache = new Map<string, ThumbnailPicture | null>();
  /** In the order they were asked for; one entry per item, however many tiles are waiting. */
  const queue: Job[] = [];
  const pending = new Map<string, Job>();
  const warned = new Set<string>();
  const sources: SourceSet = createSources();
  let stats: ThumbnailStats = {
    cached: 0,
    failed: 0,
    workMs: 0,
    slowestMs: 0,
    waitMs: 0,
    pending: 0,
    queued: false,
  };

  let studio: StudioRig | null = null;
  let observer: ReturnType<Scene['onAfterRenderObservable']['add']> | null = null;
  let busy = false;
  let disposed = false;

  /** The pack set as a string, so a pack registered after boot invalidates nothing but itself. */
  const packVersion = () =>
    ctx.registry
      .packs()
      .map((p) => `${p.id}.${p.version}`)
      .join('+');

  /**
   * Drain the queue, one item at a time, with a budget rather than a fixed rate.
   *
   * One item per frame was the first version and it is the wrong rule at both ends. On a machine
   * drawing 60 fps a palette of 21 tiles should fill in a third of a second, not in 21 frames; on
   * SwiftShader at 0.15 fps a single item already blows any budget and it stays one per frame
   * whatever this says. So: keep going while there is time left in this frame, and hand the rest
   * back to the render loop.
   */
  const FRAME_BUDGET_MS = 12;

  function pump(): void {
    if (busy || disposed) return;
    const job = queue.shift();
    if (!job) {
      detach();
      return;
    }
    const frameStart = performance.now();
    busy = true;
    void renderOne(job.item)
      .catch((err) => {
        warnOnce(job.item, err);
        return null;
      })
      .then((picture) => {
        cache.set(cacheKey(job.item, packVersion()), picture);
        pending.delete(job.item.key);
        stats = picture
          ? { ...stats, cached: stats.cached + 1 }
          : { ...stats, failed: stats.failed + 1 };
        for (const resolve of job.waiting) resolve(picture);
        busy = false;
        stats = { ...stats, queued: queue.length > 0, pending: queue.length };
        if (!queue.length) {
          detach();
          return;
        }
        if (performance.now() - frameStart < FRAME_BUDGET_MS) pump();
      });
  }

  function attach(): void {
    if (observer || disposed) return;
    observer = host.onAfterRenderObservable.add(pump);
  }

  function detach(): void {
    if (!observer) return;
    host.onAfterRenderObservable.remove(observer);
    observer = null;
  }

  function warnOnce(item: PaletteItem, err: unknown): void {
    if (warned.has(item.key)) return;
    warned.add(item.key);
    console.warn(
      `[game/tools] no preview for ${item.key}; falling back to the kind icon`,
      err instanceof Error ? err.message : err
    );
  }

  async function renderOne(item: PaletteItem): Promise<ThumbnailPicture | null> {
    if (disposed) return null;
    const rig = (studio ??= createStudio(engine));
    const build = await sources.build({ scene: rig.scene, registry: ctx.registry }, item);
    if (!build) return null;
    const t0 = performance.now();
    let waited = 0;
    try {
      for (const mesh of build.meshes) {
        mesh.computeWorldMatrix(true);
        mesh.alwaysSelectAsActiveMesh = true;
        mesh.receiveShadows = false;
      }
      const framed = frame(rig, build);
      if (!framed) return null;
      rig.rtt.renderList = build.meshes;
      // A material that has not compiled renders nothing and reports no error, so the first frame
      // of a category would be blank tiles that never fill in. Wait for the shaders rather than
      // render into the void.
      for (let i = 0; i < READY_FRAMES; i++) {
        if (rig.rtt.isReadyForRendering()) break;
        const waitFrom = performance.now();
        await nextFrame();
        waited += performance.now() - waitFrom;
        if (disposed) return null;
      }
      rig.rtt.render();
      const pixels = await rig.rtt.readPixels(0, 0, undefined, true, false);
      if (!pixels) return null;
      const url = toDataUrl(new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength));
      if (!url) return null;
      return { url, ...framed };
    } finally {
      // Nothing is touched once the studio is gone: a render in flight when `host.dispose()` runs
      // would otherwise free its meshes against a scene that has already been disposed.
      if (!disposed) {
        rig.rtt.renderList = [];
        build.dispose();
      }
      const ms = performance.now() - t0 - waited;
      stats = {
        ...stats,
        workMs: stats.workMs + ms,
        waitMs: stats.waitMs + waited,
        slowestMs: Math.max(stats.slowestMs, ms),
      };
    }
  }

  return {
    covers: (item) => sources.covers(item),
    get(item) {
      return cache.get(cacheKey(item, packVersion())) ?? null;
    },
    request(item) {
      const key = cacheKey(item, packVersion());
      if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null);
      if (!sources.covers(item)) return Promise.resolve(null);
      return new Promise<ThumbnailPicture | null>((resolve) => {
        const open = pending.get(item.key);
        if (open) {
          open.waiting.push(resolve);
          return;
        }
        const job: Job = { item, waiting: [resolve] };
        pending.set(item.key, job);
        queue.push(job);
        stats = { ...stats, queued: true, pending: queue.length };
        attach();
      });
    },
    focus(keys) {
      if (!queue.length) return;
      const wanted = new Map(keys.map((key, at) => [key, at]));
      const kept = queue.filter((job) => wanted.has(job.item.key));
      kept.sort((a, b) => wanted.get(a.item.key)! - wanted.get(b.item.key)!);
      const dropped = queue.filter((job) => !wanted.has(job.item.key));
      queue.length = 0;
      queue.push(...kept);
      for (const job of dropped) {
        pending.delete(job.item.key);
        for (const resolve of job.waiting) resolve(null);
      }
      stats = { ...stats, queued: queue.length > 0, pending: queue.length };
      if (!queue.length) detach();
    },
    stats: () => stats,
    dispose() {
      disposed = true;
      detach();
      for (const job of queue.splice(0)) for (const resolve of job.waiting) resolve(null);
      pending.clear();
      sources.dispose();
      studio?.dispose();
      studio = null;
      cache.clear();
    },
  };
}

// ── the rig ──────────────────────────────────────────────────────────────────────────────────

interface StudioRig {
  scene: Scene;
  camera: Camera;
  rtt: RenderTargetTexture;
  dispose(): void;
}

/**
 * The studio, built once.
 *
 * `scene.render()` is never called on it: a second scene rendering to the canvas would fight the
 * park for the frame. Only the render target is asked to draw, which is a supported thing to do to
 * a scene and is what an RTT does inside every frame of the park anyway.
 */
function createStudio(engine: AbstractEngine): StudioRig {
  const scene = new Scene(engine);
  // The park is right-handed and every builder here writes its winding for that. A studio in the
  // other handedness renders each of them inside out.
  scene.useRightHandedSystem = true;
  // The render target takes its clear from the scene, and a studio that does not clear paints each
  // item over the last one.
  scene.autoClear = true;
  scene.autoClearDepthAndStencil = true;
  scene.clearColor = new Color4(0, 0, 0, 0);
  scene.ambientColor = new Color3(0.18, 0.2, 0.24);
  scene.environmentIntensity = 1;
  scene.environmentTexture = studioEnvironment(scene);
  scene.skipFrustumClipping = true;

  const camera = new UniversalCamera('thumb-cam', new Vector3(0, 0, 10), scene);
  camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
  camera.minZ = 0.01;
  camera.maxZ = 4000;
  scene.activeCamera = camera;

  /**
   * Three-point, and every one of them is `includedOnlyMeshes`-free on purpose: nothing else ever
   * stands in this scene.
   *
   * The key comes over the camera's left shoulder so the lit face is the face the camera sees; the
   * fill is a hemispheric with a warm ground term so the underside of a canopy is not black; the
   * rim comes from behind and slightly below to put an edge on the silhouette, which is what stops
   * a dark ride reading as a smudge against the stage's grass.
   */
  const key = new DirectionalLight('thumb-key', new Vector3(-0.55, -0.72, -0.42), scene);
  key.intensity = 3.1;
  key.diffuse = new Color3(1, 0.97, 0.92);
  key.specular = new Color3(0.9, 0.9, 0.88);

  const fill = new HemisphericLight('thumb-fill', new Vector3(0, 1, 0), scene);
  fill.intensity = 0.85;
  fill.diffuse = new Color3(0.82, 0.88, 1);
  fill.groundColor = new Color3(0.34, 0.32, 0.28);
  fill.specular = new Color3(0.1, 0.1, 0.1);

  const rim = new DirectionalLight('thumb-rim', new Vector3(0.62, 0.18, 0.66), scene);
  rim.intensity = 1.15;
  rim.diffuse = new Color3(0.72, 0.82, 1);
  rim.specular = new Color3(0.3, 0.34, 0.4);

  const rtt = new RenderTargetTexture(
    'thumb-rtt',
    { width: THUMB_W, height: THUMB_H },
    scene,
    false,
    true
  );
  rtt.clearColor = new Color4(0, 0, 0, 0);
  rtt.activeCamera = camera;
  rtt.renderList = [];
  rtt.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
  rtt.skipInitialClear = false;

  return {
    scene,
    camera,
    rtt,
    dispose() {
      // Synchronous, and in this order: the render target holds a framebuffer of its own, and the
      // scene takes every material and texture in it with it.
      rtt.dispose();
      scene.dispose();
    },
  };
}

/**
 * A neutral studio environment, six 8² faces written here.
 *
 * Without one, every PBR material in this repo renders its metal black — the ride finishes, a
 * shop's counter trim, a lamp's post — because a metal has no diffuse term and nothing to reflect.
 * It is a plain sky-to-ground gradient rather than a copy of the park's IBL, which is the point: it
 * has no time of day in it. Byte-generated, so it is CC0 the same way the geometry is.
 */
function studioEnvironment(scene: Scene): RawCubeTexture {
  const size = 8;
  const faces: ArrayBufferView[] = [];
  // Face order is +X, -X, +Y, -Y, +Z, -Z — GL's, and Babylon's.
  const sky: [number, number, number] = [188, 208, 232];
  const horizon: [number, number, number] = [150, 156, 166];
  const ground: [number, number, number] = [96, 92, 84];
  for (let f = 0; f < 6; f++) {
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const v = (y + 0.5) / size;
        let c: [number, number, number];
        if (f === 2) c = sky;
        else if (f === 3) c = ground;
        else {
          // The four side faces run sky at the top to ground at the bottom, through the horizon.
          const t = v;
          c =
            t < 0.5 ? mix(sky, horizon, t * 2) : mix(horizon, ground, Math.min(1, (t - 0.5) * 2.4));
        }
        const i = (y * size + x) * 4;
        data[i] = c[0];
        data[i + 1] = c[1];
        data[i + 2] = c[2];
        data[i + 3] = 255;
      }
    }
    faces.push(data);
  }
  const texture = new RawCubeTexture(
    scene,
    faces,
    size,
    Constants.TEXTUREFORMAT_RGBA,
    Constants.TEXTURETYPE_UNSIGNED_BYTE,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE
  );
  texture.name = 'thumb-env';
  texture.gammaSpace = true;
  return texture;
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

type Framed = Omit<ThumbnailPicture, 'url'>;

/**
 * Point the camera at the model, size the orthographic box to it, and report where it stands.
 *
 * The corners of a box are projected through the view matrix, which is what makes the fit tight
 * for a 30 m ferris wheel and for a 0.5 m litter bin with the same code and no per-item number
 * anywhere. Two things changed after round 1 and both were measured on the shipped build.
 *
 * **The box has the picture's aspect ratio, not 1:1.** A square box rendered into a square target
 * and fitted `contain` into a 2.76:1 well is fitted by the well's HEIGHT, so the image collapsed
 * to a square in the middle of it and a wide model then used a third of that square: the scenery
 * tab averaged 13.3 % of its well and a lamp post 4.7 %. `halfY` is now whichever of the two constraints binds, `halfX` is
 * `halfY × aspect`, and the well has the same aspect, so the fit is exact in both directions.
 *
 * **The horizontal extent is the source's own `focus` box when it has one.** A shop's geometry is
 * mostly its apron and a blueprint's is partly its forecourt, so a frame fitted to the bounding box
 * spent two thirds of the tile on paving — which is what made five shops sharing one kiosk
 * generator read as one picture. The vertical extent is always the whole model, so nothing is ever
 * cropped in height; the ground simply runs off the sides, which is what ground does.
 *
 * The vertical centre is biased so the model's lowest point sits `FLOOR` above the bottom edge:
 * the tile draws a contact shadow on the stage's horizon and the picture has to stand ON it. The
 * shadow's own size is the projection of the ground rectangle, returned here because the tile
 * cannot derive it and used to guess it as a flat 46 % of the well.
 */
function frame(rig: StudioRig, build: PreviewBuild): Framed | null {
  const full = worldBox(build.meshes);
  if (!full) return null;
  // The source's own box when it has one, clipped to what was actually drawn: a manifest that
  // over-declares its size may not zoom the picture out past the model.
  const box = build.focus
    ? {
        ...full,
        minX: Math.max(full.minX, build.focus.minX),
        maxX: Math.min(full.maxX, build.focus.maxX),
        minZ: Math.max(full.minZ, build.focus.minZ),
        maxZ: Math.min(full.maxZ, build.focus.maxZ),
      }
    : full;
  const usable = box.maxX > box.minX && box.maxZ > box.minZ ? box : full;

  const centre = new Vector3(
    (usable.minX + usable.maxX) / 2,
    (full.minY + full.maxY) / 2,
    (usable.minZ + usable.maxZ) / 2
  );
  const span = Math.max(
    usable.maxX - usable.minX,
    full.maxY - full.minY,
    usable.maxZ - usable.minZ,
    0.25
  );

  const camera = rig.camera as UniversalCamera;
  // The distance only has to clear the near plane and hold the whole model inside the depth range:
  // an orthographic projection takes its scale from the box below, never from how far away it is.
  const distance = span * 4 + 10;
  camera.position.copyFrom(centre.add(VIEW_DIR.scale(distance)));
  camera.setTarget(centre);
  camera.minZ = Math.max(0.01, distance - span * 3);
  camera.maxZ = distance + span * 3;
  camera.getViewMatrix(true);
  const view = camera.getViewMatrix();

  let vMinX = Infinity;
  let vMinY = Infinity;
  let vMaxX = -Infinity;
  let vMaxY = -Infinity;
  // The four corners of the ground rectangle, tracked separately: they are the contact shadow.
  let gMinX = Infinity;
  let gMinY = Infinity;
  let gMaxX = -Infinity;
  let gMaxY = -Infinity;
  const corner = new Vector3();
  for (let i = 0; i < 8; i++) {
    const onGround = (i & 2) === 0;
    corner.set(
      i & 1 ? usable.maxX : usable.minX,
      onGround ? full.minY : full.maxY,
      i & 4 ? usable.maxZ : usable.minZ
    );
    const p = Vector3.TransformCoordinates(corner, view);
    vMinX = Math.min(vMinX, p.x);
    vMaxX = Math.max(vMaxX, p.x);
    vMinY = Math.min(vMinY, p.y);
    vMaxY = Math.max(vMaxY, p.y);
    if (onGround) {
      gMinX = Math.min(gMinX, p.x);
      gMaxX = Math.max(gMaxX, p.x);
      gMinY = Math.min(gMinY, p.y);
      gMaxY = Math.max(gMaxY, p.y);
    }
  }

  // Whichever constraint binds: a wide model fills the width, a tall one fills the height, and
  // neither is ever cropped. `THUMB_ASPECT` is the picture's and the well's, which is one number.
  const halfY = (Math.max((vMaxY - vMinY) / 2, (vMaxX - vMinX) / 2 / THUMB_ASPECT) || 0.125) * PAD;
  const halfX = halfY * THUMB_ASPECT;
  const cx = (vMinX + vMaxX) / 2;
  const bottom = vMinY - halfY * 2 * FLOOR;
  camera.orthoLeft = cx - halfX;
  camera.orthoRight = cx + halfX;
  camera.orthoBottom = bottom;
  camera.orthoTop = bottom + halfY * 2;
  // The projection is cached per frame and this scene never has one, so it is refreshed by hand.
  camera.getProjectionMatrix(true);

  return {
    shadowWidth: clamp01((gMaxX - gMinX) / (halfX * 2)),
    shadowHeight: clamp01((gMaxY - gMinY) / (halfY * 2)),
    shadowBottom: clamp01(((gMinY + gMaxY) / 2 - bottom) / (halfY * 2)),
    shadowLeft: clamp01(((gMinX + gMaxX) / 2 - (cx - halfX)) / (halfX * 2)),
  };
}

interface Box {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

function worldBox(meshes: AbstractMesh[]): Box | null {
  const box: Box = {
    minX: Infinity,
    minY: Infinity,
    minZ: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    maxZ: -Infinity,
  };
  for (const mesh of meshes) {
    const b = mesh.getBoundingInfo().boundingBox;
    box.minX = Math.min(box.minX, b.minimumWorld.x);
    box.minY = Math.min(box.minY, b.minimumWorld.y);
    box.minZ = Math.min(box.minZ, b.minimumWorld.z);
    box.maxX = Math.max(box.maxX, b.maximumWorld.x);
    box.maxY = Math.max(box.maxY, b.maximumWorld.y);
    box.maxZ = Math.max(box.maxZ, b.maximumWorld.z);
  }
  return Number.isFinite(box.minX) && Number.isFinite(box.maxX) ? box : null;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * One real frame.
 *
 * `requestAnimationFrame` and not the scene's own observable: this is awaited from inside a handler
 * on that observable, and Babylon notifies observers over the live array, so an observer added
 * during a notification is called in the SAME pass. The readiness loop would then spin through its
 * whole budget between two frames — dozens of render-list prepares in one gap, and a shader that
 * needed a frame of driver time reported as never ready.
 */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * RGBA bytes to a PNG data URL.
 *
 * The rows arrive bottom-up, which is how a GL framebuffer is laid out and not a bug to work
 * around anywhere else; they are flipped here, once, while they are copied.
 */
function toDataUrl(pixels: Uint8Array): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = THUMB_W;
  canvas.height = THUMB_H;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const image = context.createImageData(THUMB_W, THUMB_H);
  const row = THUMB_W * 4;
  for (let y = 0; y < THUMB_H; y++) {
    const from = (THUMB_H - 1 - y) * row;
    image.data.set(pixels.subarray(from, from + row), y * row);
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

/** Exported for the selftest: the cache key is the contract this module is judged on. */
export const __test = { cacheKey };
