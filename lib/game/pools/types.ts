/**
 * The pool vocabulary: what a basin, a tile style, an edge treatment and a deck item are.
 *
 * Pure declarations. This file is reachable from the worker (`sim.ts` sizes a pool's capacity and
 * its water bill from the same records the renderer draws), so it stays Babylon-free, DOM-free and
 * strip-only: no enums, no namespaces, no constructor parameter properties.
 *
 * Every field here comes out of a manifest. Nothing in this module switches on a pool id — it
 * switches on an `outline` algorithm, a `profile` algorithm and a tile `pattern`, which is the
 * same line `rides` draws at its eleven shapes and `paths` at its five surface patterns: a pack
 * may combine them at any size, depth, colour and count, and it may not invent a sixth primitive
 * out of JSON.
 */

/** How the basin's plan is generated. */
export type PoolOutline = 'rect' | 'ellipse' | 'stadium' | 'lobed' | 'polygon';

/** How the floor falls away from the shallow end. */
export type PoolProfile = 'flat' | 'slope' | 'dish' | 'beach' | 'channel';

/** What gets built where a swimmer gets in. */
export type PoolEntry = 'none' | 'corner-steps' | 'roman-steps' | 'beach' | 'ladder';

export type PoolTilePattern = 'mosaic' | 'ceramic' | 'slate' | 'pebble' | 'lanes';

export type PoolCoping = 'rolled' | 'square' | 'deck-level' | 'none';

export type PoolDeckSurface = 'concrete' | 'timber' | 'stone' | 'sand' | 'none';

export type PoolDeckShape =
  'lounger' | 'parasol' | 'ring-post' | 'ladder' | 'towel-box' | 'planter';

/** What a pool is for. Drives the sim's temperature target and the default furniture density. */
export type PoolRole = 'swim' | 'lap' | 'kids' | 'spa' | 'splashdown';

export interface PoolDepthSpec {
  profile: PoolProfile;
  /** Metres at the shallow end. `0` with `beach` is a zero-entry edge. */
  min: number;
  /** Metres at the deep end. */
  max: number;
  /** Which way the floor falls. `z` is the long axis of a lap pool as authored. */
  axis: 'x' | 'z';
  /** 0..1 of the pool's length the zero-entry shelf covers (`beach` only). */
  beach: number;
}

export interface PoolShapeSpec {
  /** `pack:id`. */
  key: string;
  id: string;
  name: Record<string, string>;
  outline: PoolOutline;
  /** Full extents in metres, x by z. */
  size: [number, number];
  /** Corner radius in metres (`rect`). */
  corner: number;
  /** Lobe count and depth as a fraction of the radius (`lobed`). */
  lobes: number;
  lobeDepth: number;
  lobePhase: number;
  /** Explicit closed outline in UNIT space (−1..1), flat `[x, z, …]` (`polygon`). */
  points: number[];
  /** Outline samples. More is rounder and costs two triangles per step. */
  segments: number;
  depth: PoolDepthSpec;
  entry: PoolEntry;
  /** Where the entry sits, radians about +Y from +x. */
  entryYaw: number;
  role: PoolRole;
  /** Default content keys; an entity may override either. */
  tile: string;
  edge: string;
  /** Furniture per 100 m² of deck. 0 leaves the deck bare. */
  deckDensity: number;
  /** m³/h of make-up water and filtration, for the management module's bill. */
  water: number;
  cost: number;
}

export interface PoolTileSpec {
  key: string;
  id: string;
  name: Record<string, string>;
  pattern: PoolTilePattern;
  /** Metres one texture repeat covers. */
  tileMetres: number;
  /** sRGB hex. A tile picks one of these by a hash of its own cell. */
  colors: string[];
  grout: string;
  /** The band of tile at the waterline, sRGB hex. */
  waterline: string;
  /** Lane line colour and width in metres (`lanes`). */
  lane: string;
  laneWidth: number;
  /** Roughness at the top of a tile and down in the grout. */
  roughness: [number, number];
  /** Height of the relief the normal map is built from, 0..1. */
  relief: number;
  /** How glazed the ceramic is: drives specular intensity and the clear-coat sheen. */
  glaze: number;
  /** Linear RGB the water body absorbs towards. Chlorinated blue by default. */
  waterTint: [number, number, number];
  /** Linear RGB of this pool's underwater lamps. */
  nightTint: [number, number, number];
  /** Candela-ish, before the night ramp. The renderer's own scale, documented in `main.ts`. */
  nightIntensity: number;
}

export interface PoolEdgeSpec {
  key: string;
  id: string;
  name: Record<string, string>;
  coping: PoolCoping;
  /** Metres. */
  copingWidth: number;
  /** Metres the coping stands above the deck. */
  copingRise: number;
  copingColor: string;
  deck: PoolDeckSurface;
  deckWidth: number;
  deckColor: string;
  /** Handrails beside the entry. */
  rail: boolean;
  railColor: string;
}

export interface PoolDeckItemSpec {
  key: string;
  id: string;
  name: Record<string, string>;
  shape: PoolDeckShape;
  /** Relative weight when the deck is populated. */
  weight: number;
  /** Metres of clearance the item wants from its neighbours. */
  clearance: number;
  colors: string[];
  accent: string;
}

/** What a `pool` entity carries in `entity.data`. Every field is optional and falls back to the shape. */
export interface PoolEntityData {
  /** Registered shape key, `pack:id`. */
  shape?: string;
  tile?: string;
  edge?: string;
  /** Metres, overriding the shape's own extents. */
  size?: [number, number];
  /** Metres at the deep end, overriding the shape's own. */
  depth?: number;
  /** Metres the water sits below the coping. */
  freeboard?: number;
  role?: PoolRole;
  heated?: boolean;
  /** Furniture per 100 m² of deck; 0 leaves it bare. */
  deckDensity?: number;
  /** A slide's run-out lane points at this pool. Set by `flumes`, read by nobody else. */
  splashdownFor?: string;
}

/** A pool as both halves of the module see it once the manifest has been applied. */
export interface ResolvedPool {
  id: string;
  /** Centre of the basin in world metres, and the coping's height. */
  position: [number, number, number];
  yaw: number;
  shape: PoolShapeSpec;
  tile: PoolTileSpec;
  edge: PoolEdgeSpec;
  /** Full extents after any entity override. */
  size: [number, number];
  /** Metres at the deep end after any entity override. */
  maxDepth: number;
  /** Metres below the coping the water surface sits. */
  freeboard: number;
  role: PoolRole;
  heated: boolean;
  deckDensity: number;
  /** World Y of the water surface. */
  waterY: number;
  /** m², plan area inside the coping. */
  area: number;
  /** m³ of water at the design level. */
  volume: number;
}

/** What the sim keeps per pool. Written by the worker, never by the main thread. */
export interface PoolState {
  /** °C. Integrated towards the target every tick. */
  temperatureC: number;
  /** 0..1, 1 is clear. Falls with swimmers, recovers with filtration. */
  clarity: number;
  /** Swimmers in the water right now. The guests module drives this when it exists. */
  swimmers: number;
  /** Metres the level sits off its design height — evaporation, or a level a player set. */
  levelOffset: number;
}

/** The stats the sim publishes each frame. */
export interface PoolsStats {
  pools: number;
  waterM3: number;
  /** m³/h of make-up water and filtration across every pool. */
  waterPerHour: number;
  swimmers: number;
  capacity: number;
}

/** One vertex stream, grouped by the material it is drawn with. */
export type PoolSurfaceName =
  'tile' | 'wall' | 'coping' | 'deck' | 'metal' | 'fabric' | 'timber' | 'glow' | 'water';

export interface PoolSurface {
  name: PoolSurfaceName;
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
  indices: number[];
}

/** Where a niche light sits, in the pool's local space. */
export interface PoolLightSite {
  /** Local metres. */
  x: number;
  y: number;
  z: number;
  /** Outward normal of the wall it is set into. */
  nx: number;
  nz: number;
}

export interface PoolBuild {
  surfaces: PoolSurface[];
  /** The outline in local metres, flat `[x, z, …]`, closed. */
  outline: number[];
  lights: PoolLightSite[];
  /** Deck furniture, in local metres. */
  props: Array<{
    shape: PoolDeckShape;
    x: number;
    z: number;
    yaw: number;
    scale: number;
    item: PoolDeckItemSpec;
  }>;
  triangles: number;
}
