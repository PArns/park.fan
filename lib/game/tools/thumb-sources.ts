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
      return { meshes, dispose: () => meshes.forEach((m) => m.dispose(false, false)) };
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

/**
 * Kind → source. A kind that is not here has no picture and gets the Lucide icon on the stage,
 * which is the documented fallback and is what coasters and flumes get today: both are `route`
 * items with no `procedural` in the manifest, so there is nothing to render until the track tool
 * can hand a layout over.
 */
const SOURCES: Record<string, SourceFactory> = {
  scenery: scenerySource,
  shop: shopSource,
  ride: rideSource,
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
