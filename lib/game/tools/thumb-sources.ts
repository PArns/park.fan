/**
 * Where a thumbnail's geometry comes from: the game's own builders, in a scene of our own.
 *
 * The owner's complaint was that every ride is the same Lucide pictogram, so a carousel and a
 * ferris wheel are indistinguishable in the palette. The answer may not be a folder of drawings —
 * this repo carries no non-CC0 art, and a hand-drawn icon per item would break the module's own
 * extensibility rule, which says a new item is a manifest entry and no code. So a tile's picture is
 * a **render of the thing that will actually be placed**, built by the same functions the park
 * builds it with. CC0 by construction: it is our own geometry.
 *
 * ## Why this is a table of kinds and not a table of items
 *
 * `lib/game/tools/` may name no pack id and no item id, and does not. What it names here is an
 * ENTITY KIND, which is schema: the same discriminator `palette.ts` already routes on, and the same
 * one core uses to decide which module draws an entity. A pack that adds a fortieth ride gets a
 * picture with no change to this file; a pack that brings a kind nobody has written a module for
 * falls back to the Lucide icon, which is what it does everywhere else in this module.
 *
 * The clean version of this is a `preview()` on each module's own main API — `scenery` already has
 * one, for the build ghost — and that is filed as a request. Until it exists, the modules' pure
 * geometry builders are imported directly and lazily, each behind its own `try`, so a module that
 * moves an export costs one kind its pictures and nothing else.
 *
 * ## What a source may assume
 *
 * Nothing about the main scene. Every builder here is handed the STUDIO's scene and makes its own
 * materials in it, because a material belongs to one scene and the studio's lighting has to be
 * fixed: a thumbnail rendered against the park's own sun would be a different picture at 23:00 than
 * at 13:00, and the palette would change under a player who did nothing but wait.
 */

import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { Scene } from '@babylonjs/core/scene';
import type { Registry } from '../core/registry';
import type { PaletteItem } from './types';

/** One item's geometry, alive in the studio scene until it is disposed. */
export interface PreviewBuild {
  meshes: AbstractMesh[];
  /**
   * The ground rectangle the picture should be FRAMED on, when the source knows one.
   *
   * A shop's geometry is mostly its plot — `shops/build.ts` draws the apron, its kerb, its queue
   * rail and its planters into the same surface as the kiosk — so a frame fitted to the bounding
   * box spent two thirds of the tile on concrete, which is what made five shops sharing the
   * `kiosk-round` generator read as one picture: the things separating them (sign colour, glyph,
   * menu board) were the smallest things in the frame.
   *
   * The first fix was a heuristic — drop everything below hip height and take the X/Z extent of
   * what is left — and it was wrong on both ends: a queue rail is 1.05 m tall and runs the whole
   * length of the apron, so the frame did not move, while a fountain's upper tiers are narrower
   * than its basin, so the basin would have been cropped. There is no height that means "ground
   * furniture" for every model.
   *
   * So the SOURCE says it, because the source is the only one that knows. `shops` is handed the
   * building's own footprint and reports where it put the front face; `buildings` declares its
   * built extent in the manifest, apron excluded. `scenery` and `rides` leave it out: a tree and a
   * carousel have no plot, and their bounding box is the model.
   *
   * The vertical extent always comes from the whole geometry, so nothing is ever cropped in
   * height — this box only decides how wide the picture is, and the ground outside it runs off
   * the frame's edges, which is what ground does.
   */
  focus?: { minX: number; maxX: number; minZ: number; maxZ: number };
  dispose(): void;
}

export interface StudioScene {
  scene: Scene;
  registry: Registry;
}

/** A source owns one entity kind, and keeps whatever it had to build once for all of them. */
interface Source {
  build(studio: StudioScene, item: PaletteItem): Promise<PreviewBuild | null>;
  dispose(): void;
}

type SourceFactory = () => Source;

/**
 * The studio's own texture budget.
 *
 * Every one of these modules generates its material textures procedurally at a resolution its
 * quality preset picks. A 66 px tile does not need the park's: the studio asks for the smallest
 * size each builder accepts, which is what keeps the first thumbnail of a category from being a
 * visible hitch. Measured figures are in the report.
 */
const STUDIO_TEXTURE_PX = 96;
/**
 * How far a shop's awning, bracket sign and condiment shelf hang off its front wall.
 *
 * One number rather than a second bounding-box pass: everything that overhangs a kiosk's face
 * does so by well under a metre, and the frame's own 7 % padding covers the rest. Too small and
 * an awning is clipped at the frame's edge; too large and the apron is back.
 */
const AWNING_M = 0.9;
/** Fixed, because a thumbnail may not differ between two players or between two runs. */
const STUDIO_SEED = 20260909;

/**
 * A kit that is built once, lazily, and thrown away SYNCHRONOUSLY.
 *
 * The first version held the boot promise and disposed through it — `void ready?.then((kit) =>
 * kit.dispose())` — which is one microtask too late. `host.dispose()` disposes the scenes and then
 * the engine in the same turn, so those materials were freed against a dead GL context and
 * `pnpm game:teardown` logged `TypeError: Cannot read properties of null (reading 'program')` on
 * every one of its three cycles. Nothing else in the walk noticed: the engine context was released,
 * the handle was gone, and only the console said so.
 *
 * So the resolved kit is kept in a plain variable as well as in the promise, `dispose()` reads that
 * variable, and a kit that finishes booting after the studio is gone disposes itself instead of
 * joining a scene nobody owns.
 */
interface LazyKit<T> {
  get(studio: StudioScene): Promise<T | null>;
  /** False once the studio has been torn down. Read after every `await`. */
  alive(): boolean;
  dispose(): void;
}

function lazyKit<T extends { dispose(): void }>(
  boot: (studio: StudioScene, alive: () => boolean) => Promise<T | null>
): LazyKit<T> {
  let pending: Promise<T | null> | null = null;
  let live: T | null = null;
  let dead = false;
  const drop = (kit: T | null) => {
    if (!kit) return;
    try {
      kit.dispose();
    } catch {
      // A studio scene that is already gone takes its materials with it; this is the tidy-up path
      // and it may not be the thing that throws during a teardown.
    }
  };
  const alive = () => !dead;
  return {
    alive,
    get(studio) {
      if (dead) return Promise.resolve(null);
      pending ??= boot(studio, alive).then(
        (kit) => {
          if (dead || !kit) {
            drop(kit);
            return null;
          }
          live = kit;
          return kit;
        },
        () => null
      );
      return pending;
    },
    dispose() {
      dead = true;
      drop(live);
      live = null;
      pending = null;
    },
  };
}

// ── scenery and foliage ──────────────────────────────────────────────────────────────────────

interface SceneryKit {
  catalog: Map<string, import('../scenery/catalog').PropSpec>;
  materials: import('../scenery/materials').MaterialLibrary;
  toMesh: typeof import('../scenery/geometry').toMesh;
  generatorFor: typeof import('../scenery/generators').generatorFor;
  dispose(): void;
}

function scenerySource(): Source {
  async function boot(studio: StudioScene, alive: () => boolean): Promise<SceneryKit | null> {
    const [catalogMod, generators, geometry, textures, materialsMod, wind] = await Promise.all([
      import('../scenery/catalog'),
      import('../scenery/generators'),
      import('../scenery/geometry'),
      import('../scenery/textures'),
      import('../scenery/materials'),
      import('../scenery/wind'),
    ]);
    // The window this closes is the one `pnpm game:teardown` found: these imports are still in
    // flight when `host.dispose()` runs, and a texture generated one tick later is generated on a
    // disposed scene against a dead GL context.
    if (!alive()) return null;
    const tex = textures.createSceneryTextures(studio.scene, STUDIO_SEED, STUDIO_TEXTURE_PX);
    const lib = materialsMod.createMaterials(studio.scene, tex, wind.createWindState(), {
      webgl: true,
    });
    return {
      catalog: catalogMod.buildCatalog(studio.registry),
      materials: lib,
      toMesh: geometry.toMesh,
      generatorFor: generators.generatorFor,
      dispose() {
        lib.dispose();
        tex.dispose();
      },
    };
  }

  const kit_ = lazyKit(boot);
  return {
    async build(studio, item) {
      const kit = await kit_.get(studio);
      // Twice, and the second time is not paranoia: `get` may have resolved from a promise that
      // was already in flight when the studio was torn down, and everything below builds meshes.
      if (!kit || !kit_.alive()) return null;
      // The catalogue is keyed `pack:item`, which is the palette's own key.
      const spec = kit.catalog.get(item.key);
      if (!spec) return null;
      const build = kit.generatorFor(spec.generator)({
        spec,
        lod: 0,
        // A fixed variant: two players opening the same tab see the same picture, and so do two
        // runs of the screenshot harness.
        seed: 1234,
        night: spec.night,
      });
      const meshes: AbstractMesh[] = [];
      for (const part of build.parts) {
        if (!part.surface.indices.length) continue;
        const material =
          part.material === 'emissive'
            ? kit.materials.emissive(part.emissiveColor ?? '#ffd9a0')
            : kit.materials[part.material];
        if (!material) continue;
        meshes.push(
          kit.toMesh(studio.scene, `thumb:${item.key}:${part.material}`, part.surface, material)
        );
      }
      if (!meshes.length) return null;
      return { meshes, dispose: () => meshes.forEach((m) => m.dispose(false, false)) };
    },
    dispose: () => kit_.dispose(),
  };
}

// ── shops ────────────────────────────────────────────────────────────────────────────────────

interface ShopKit {
  resolveShop: typeof import('../shops/manifest').resolveShop;
  buildShop: typeof import('../shops/build').buildShop;
  seedForShop: typeof import('../shops/build').seedForShop;
  materials: import('../shops/materials').ShopMaterials;
  toMesh: typeof import('./thumb-mesh').surfaceToMesh;
  dispose(): void;
}

function shopSource(): Source {
  async function boot(studio: StudioScene, alive: () => boolean): Promise<ShopKit | null> {
    const [manifest, build, materialsMod, textures, mesh] = await Promise.all([
      import('../shops/manifest'),
      import('../shops/build'),
      import('../shops/materials'),
      import('../shops/textures'),
      import('./thumb-mesh'),
    ]);
    if (!alive()) return null;
    const atlas = textures.createShopAtlas(studio.scene, STUDIO_SEED, STUDIO_TEXTURE_PX);
    const materials = materialsMod.createShopMaterials(studio.scene, atlas);
    // The night rig is off in the studio, but signage is the one thing that separates five shops
    // sharing a kiosk form, so it is lit to its full value and not to the park's clock.
    materials.setNight(1);
    return {
      resolveShop: manifest.resolveShop,
      buildShop: build.buildShop,
      seedForShop: build.seedForShop,
      materials,
      toMesh: mesh.surfaceToMesh,
      dispose() {
        materials.dispose();
        atlas.dispose();
      },
    };
  }

  const kit_ = lazyKit(boot);
  return {
    async build(studio, item) {
      const kit = await kit_.get(studio);
      if (!kit || !kit_.alive()) return null;
      const entry = studio.registry.item('shops', item.key);
      if (!entry) return null;
      const def = entry.def as import('../shops/manifest').ShopItemLike;
      const resolved = kit.resolveShop(item.pack, item.item, def);
      const footprint = def.footprint ?? [4, 4];
      const build = kit.buildShop({
        shop: resolved,
        footprint: [footprint[0], footprint[1]],
        seed: kit.seedForShop(item.key),
        signage: def.night?.signage,
      });
      const meshes: AbstractMesh[] = [];
      const add = (
        surface: import('../shops/geometry').Surface,
        name: string,
        material: import('@babylonjs/core/Materials/material').Material
      ) => {
        if (!surface.indices.length) return;
        meshes.push(kit.toMesh(studio.scene, `thumb:${item.key}:${name}`, surface, material));
      };
      add(build.kit, 'kit', kit.materials.kit);
      add(build.glass, 'glass', kit.materials.glass);
      add(build.sign, 'sign', kit.materials.emissive(build.signColour));
      if (!meshes.length) return null;
      // The building stands with its front face at `-setback` and runs back by its own depth;
      // `AWNING_M` is the awning, the bracket sign and the condiment shelf, which hang off that
      // face and are part of the shop rather than part of its plot.
      const half = footprint[0] / 2 + AWNING_M;
      return {
        meshes,
        focus: {
          minX: -half,
          maxX: half,
          minZ: -build.setback - footprint[1],
          maxZ: -build.setback + AWNING_M,
        },
        dispose: () => meshes.forEach((m) => m.dispose(false, false)),
      };
    },
    dispose: () => kit_.dispose(),
  };
}

// ── flat rides ───────────────────────────────────────────────────────────────────────────────

interface RideKit {
  resolveFlatRide: typeof import('../rides/manifest').resolveFlatRide;
  renderer: import('../rides/geometry').RideRenderer;
  dispose(): void;
}

function rideSource(): Source {
  async function boot(studio: StudioScene, alive: () => boolean): Promise<RideKit | null> {
    const [manifest, materialsMod, geometry] = await Promise.all([
      import('../rides/manifest'),
      import('../rides/materials'),
      import('../rides/geometry'),
    ]);
    if (!alive()) return null;
    const materials = materialsMod.createRideMaterials(studio.scene, STUDIO_SEED);
    const renderer = geometry.createRideRenderer(studio.scene, materials);
    return {
      resolveFlatRide: manifest.resolveFlatRide,
      renderer,
      dispose() {
        renderer.dispose();
        materials.dispose();
      },
    };
  }

  const kit_ = lazyKit(boot);
  return {
    async build(studio, item) {
      const kit = await kit_.get(studio);
      if (!kit || !kit_.alive()) return null;
      const profile = kit.resolveFlatRide(studio.registry, item.pack, item.item);
      if (!profile) return null;
      kit.renderer.setPlacements(
        [{ id: 'thumb', key: item.key, position: [0, 0, 0], yaw: 0, scale: 1 }],
        (key) => (key === item.key ? profile : null)
      );
      // A null frame is the machine at rest: spin 0, drive 0. That is the pose a picture of a ride
      // wants — a carousel caught mid-revolution is the same silhouette and a worse thumbnail —
      // and it is also the one pose that cannot depend on how long the tab has been open.
      kit.renderer.update(null, null, 0, []);
      const meshes = kit.renderer.meshes() as unknown as AbstractMesh[];
      if (!meshes.length) return null;
      // The renderer owns one batch at a time and rebuilds it per item, so the caller must not
      // dispose the meshes: clearing the placements is what releases them.
      return { meshes, dispose: () => kit.renderer.setPlacements([], () => null) };
    },
    dispose: () => kit_.dispose(),
  };
}

// ── buildings ────────────────────────────────────────────────────────────────────────────────

interface BuildingKit {
  resolveBuilding: typeof import('../buildings/manifest').resolveBuilding;
  buildBuilding: typeof import('../buildings/build').buildBuilding;
  buildKitPiece: typeof import('../buildings/build').buildKitPiece;
  seedForBuilding: typeof import('../buildings/build').seedForBuilding;
  materials: import('../buildings/materials').BuildingMaterials;
  toMesh: typeof import('./thumb-mesh').surfaceToMesh;
  dispose(): void;
}

/**
 * The twenty tiles that had no picture at all.
 *
 * `building` is the palette's largest kind — 20 of 65 items across the two bundled packs and the
 * architecture pack — and every one of them drew the same grey Lucide `Home`: "Brick wall",
 * "Arched window", "Slate roof" and "Timber floor" were four names over one glyph, which is the
 * complaint this whole studio exists to answer. Round 1 left it out because that folder had a
 * builder in it at the time; it has been graded since, and the seam it needed was already exported:
 * `buildKitPiece` for a wall, a roof, a floor or a column, and `buildBuilding` for a blueprint.
 *
 * Which of the two is not a decision this file makes — `resolveBuilding` answers it, from the
 * item's own `category`, which is schema. A pack that adds a twenty-first piece gets a picture.
 *
 * **`setAtlasResolution` is deliberately not called here.** It writes a MODULE-GLOBAL half-texel
 * inset that `buildings/geometry.ts` bakes into every UV it emits, so a studio setting it to its
 * own 96 px would change the UVs of the next building the PARK builds. The studio takes whatever
 * inset the park has set instead, and pays for it in a fraction of a texel of atlas bleed on a
 * 91 px tile. A thumbnail may not reach into the scene it is a thumbnail of.
 */
function buildingSource(): Source {
  async function boot(studio: StudioScene, alive: () => boolean): Promise<BuildingKit | null> {
    const [manifest, build, materialsMod, textures, mesh] = await Promise.all([
      import('../buildings/manifest'),
      import('../buildings/build'),
      import('../buildings/materials'),
      import('../buildings/textures'),
      import('./thumb-mesh'),
    ]);
    if (!alive()) return null;
    const atlas = textures.createBuildingAtlas(studio.scene, STUDIO_SEED, STUDIO_TEXTURE_PX);
    const materials = materialsMod.createBuildingMaterials(studio.scene, atlas);
    // Daylight: a window with a light behind it is a dark pane at noon, and a sign band is a
    // painted panel until dusk. Both are what `buildings/materials.ts` says night 0 means.
    materials.setNight(0);
    return {
      resolveBuilding: manifest.resolveBuilding,
      buildBuilding: build.buildBuilding,
      buildKitPiece: build.buildKitPiece,
      seedForBuilding: build.seedForBuilding,
      materials,
      toMesh: mesh.surfaceToMesh,
      dispose() {
        materials.dispose();
        atlas.dispose();
      },
    };
  }

  const kit_ = lazyKit(boot);
  return {
    async build(studio, item) {
      const kit = await kit_.get(studio);
      if (!kit || !kit_.alive()) return null;
      const resolved = kit.resolveBuilding(studio.registry, item.pack, item.item);
      if (!resolved) return null;
      const seed = kit.seedForBuilding(resolved.key);
      const built = resolved.blueprint
        ? kit.buildBuilding({ blueprint: resolved.blueprint, style: resolved.style, seed })
        : kit.buildKitPiece({
            piece: resolved.piece ?? 'wall',
            size: resolved.size,
            style: resolved.style,
            seed,
          });
      const meshes: AbstractMesh[] = [];
      const add = (
        surface: import('./thumb-mesh').PlainSurface,
        name: string,
        material: import('@babylonjs/core/Materials/material').Material
      ) => {
        if (!surface.indices.length) return;
        meshes.push(kit.toMesh(studio.scene, `thumb:${item.key}:${name}`, surface, material));
      };
      add(built.kit, 'kit', kit.materials.kit);
      add(built.glass, 'glass', kit.materials.glass);
      add(built.lit, 'lit', kit.materials.emissive(built.litColour, 'window'));
      add(built.sign, 'sign', kit.materials.emissive(built.signColour, 'sign'));
      // `halo` is the additive spill a lit window throws after dark. At night 0 it contributes
      // black, so it is a draw call that renders nothing; the studio has no clock and never will.
      if (!meshes.length) return null;
      // `size` is the pack's own built extent WITHOUT the apron — the manifest says so, and the
      // buildings selftest measures the geometry against it — so it is exactly the box a picture
      // of the building wants. `groundWorks` paves around it and runs off the frame.
      return {
        meshes,
        focus: {
          minX: -resolved.size[0] / 2,
          maxX: resolved.size[0] / 2,
          minZ: -resolved.size[2] / 2,
          maxZ: resolved.size[2] / 2,
        },
        dispose: () => meshes.forEach((m) => m.dispose(false, false)),
      };
    },
    dispose: () => kit_.dispose(),
  };
}

// ── coasters ─────────────────────────────────────────────────────────────────────────────────

interface CoasterKit {
  layouts: typeof import('../track/layouts').TRACK_LAYOUTS;
  layoutData: typeof import('../track/layouts').layoutData;
  buildTrack: typeof import('../track/build').buildTrack;
  buildOptionsFor: typeof import('../track/resolve').buildOptionsFor;
  buildTrackGeometry: typeof import('../track/profile').buildTrackGeometry;
  buildSupports: typeof import('../track/supports').buildSupports;
  buildStation: typeof import('../track/station').buildStation;
  resolveStyle: typeof import('../track/resolve').resolveStyle;
  resolveColor: typeof import('../track/resolve').resolveColor;
  materials: import('../track/materials').TrackMaterials;
  toMesh: typeof import('./thumb-mesh').surfaceToMesh;
  dispose(): void;
}

/**
 * The eight tiles the owner was looking at when they asked for pictures.
 *
 * The docblock this replaced said coasters get the Lucide glyph "until the track tool can hand a
 * layout over", and that is exactly what changed: a `coasterLayouts` catalogue makes a layout a
 * point item with a footprint, so there is now a thing to render. Eight coaster tiles over one
 * grey pictogram was the last place in the palette where the names did all the work.
 *
 * **The whole circuit, and it has to be.** What separates these four is their PLAN -- 392 m of
 * out-and-back against a 112 m twister -- so a picture of the station, or of the lift hill, would
 * make the two layouts a player is actually choosing between look identical. It costs what a
 * coaster costs: rails, spine and ties from `buildTrackGeometry`, the supports under them, and the
 * station, i.e. the same five surfaces `track/main.ts` draws, out of the same functions.
 *
 * **`ground` is a flat zero and that is not a shortcut.** In the park a support reaches down to the
 * terrain under it; in the studio there is no terrain, and a footing that stops at y=0 under a
 * layout built at y=0 is the machine standing on its own pad. Handing it the park's sampler would
 * be worse than useless -- the picture would change depending on where the player last looked.
 *
 * Nothing here names a layout: `item.item` is a value the palette carried in, and the catalogue is
 * searched by it. A pack that adds a fifth layout gets a picture.
 */
function coasterSource(): Source {
  async function boot(studio: StudioScene, alive: () => boolean): Promise<CoasterKit | null> {
    const [layouts, build, profile, supports, station, resolve, materialsMod, mesh] =
      await Promise.all([
        import('../track/layouts'),
        import('../track/build'),
        import('../track/profile'),
        import('../track/supports'),
        import('../track/station'),
        import('../track/resolve'),
        import('../track/materials'),
        import('./thumb-mesh'),
      ]);
    if (!alive()) return null;
    const materials = materialsMod.createTrackMaterials(
      studio.scene,
      STUDIO_SEED,
      STUDIO_TEXTURE_PX
    );
    return {
      layouts: layouts.TRACK_LAYOUTS,
      layoutData: layouts.layoutData,
      buildTrack: build.buildTrack,
      buildOptionsFor: resolve.buildOptionsFor,
      buildTrackGeometry: profile.buildTrackGeometry,
      buildSupports: supports.buildSupports,
      buildStation: station.buildStation,
      resolveStyle: resolve.resolveStyle,
      resolveColor: resolve.resolveColor,
      materials,
      toMesh: mesh.surfaceToMesh,
      dispose: () => materials.dispose(),
    };
  }

  const kit_ = lazyKit(boot);
  return {
    async build(studio, item) {
      const kit = await kit_.get(studio);
      if (!kit || !kit_.alive()) return null;
      const preset = kit.layouts.find((p) => p.id === item.item);
      if (!preset) return null;

      const data = { ...kit.layoutData(preset), origin: [0, 0, 0] as [number, number, number], yaw: 0 };
      const built = kit.buildTrack(data, kit.buildOptionsFor(studio.registry, data));
      const style = kit.resolveStyle(studio.registry, data.style);
      const geometry = kit.buildTrackGeometry(built.spline, style);
      const paint = kit.materials.paint(kit.resolveColor(studio.registry, data));
      const timber = style.supports === 'timber';
      const structureMaterial = timber ? kit.materials.timber() : paint;
      const depth = style.rail.radius * 2 + (style.spine ? style.spine.size + 0.12 : 0.3) + 0.05;
      const legs = kit.buildSupports(built.spline, geometry.frames, {
        kind: style.supports,
        ground: () => 0,
        load: () => 1,
        structureDepth: depth,
      });
      const platform = kit.buildStation(built.spline, built.drives, { ground: () => 0 });

      const meshes: AbstractMesh[] = [];
      const add = (name: string, geo: { positions: number[]; normals: number[]; uvs: number[]; indices: number[] }, material: import('@babylonjs/core/Materials/material').Material) => {
        if (geo.indices.length === 0) return;
        // `surfaceToMesh` wants vertex colours; track's geometry carries none, and an empty array
        // is what its own `applyToMesh` path does with them.
        meshes.push(kit.toMesh(studio.scene, `thumb-track-${name}`, { ...geo, colors: [] }, material));
      };
      add('rail', geometry.groups.rail, kit.materials.rail());
      add('spine', geometry.groups.spine, paint);
      add('tie', geometry.groups.tie, timber ? kit.materials.timber() : paint);
      add('support', legs.member, structureMaterial);
      add('footing', legs.footing, kit.materials.concrete());
      add('station-deck', platform.deck, kit.materials.concrete());
      add('station-structure', platform.structure, paint);
      add('station-rail', platform.rail, kit.materials.rail());
      if (!meshes.length) return null;
      return {
        meshes,
        dispose() {
          for (const m of meshes) m.dispose();
        },
      };
    },
    dispose: () => kit_.dispose(),
  };
}

/**
 * Kind → source. A kind that is not here has no picture and gets the item's own icon on the stage,
 * which is the documented fallback and is what `flume` gets today: its items carry no footprint,
 * so they are `route` items and there is nothing a click could place yet.
 */
const SOURCES: Record<string, SourceFactory> = {
  scenery: scenerySource,
  shop: shopSource,
  ride: rideSource,
  building: buildingSource,
  coaster: coasterSource,
};

export interface SourceSet {
  build(studio: StudioScene, item: PaletteItem): Promise<PreviewBuild | null>;
  /** True when this item's kind has a source at all — the tile asks before it queues a render. */
  covers(item: PaletteItem): boolean;
  dispose(): void;
}

export function createSources(): SourceSet {
  const live = new Map<string, Source>();
  return {
    covers: (item) => item.kind in SOURCES,
    async build(studio, item) {
      const factory = SOURCES[item.kind];
      if (!factory) return null;
      let source = live.get(item.kind);
      if (!source) {
        source = factory();
        live.set(item.kind, source);
      }
      return source.build(studio, item);
    },
    dispose() {
      for (const source of live.values()) source.dispose();
      live.clear();
    },
  };
}
