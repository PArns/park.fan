/**
 * The shapes every other file in this module agrees on. DOM-free, Babylon-free, node-safe.
 *
 * Three contracts with the outside world live here.
 *
 * **A blueprint is data.** `BlueprintDef` is the whole description of a building — masses, storeys,
 * bay patterns, roofs, trim, ground works — and `build.ts` reads it and draws what it says. Nothing
 * in this module switches on a blueprint id or a pack id, which is the axis this module is graded
 * on. The closed sets are the *primitives*: eleven bay codes and eight roof forms, the same line
 * `rides/shapes.ts` draws at its eleven shapes and `shops` at its five massings. A pack combines
 * them at any size, count, colour and material and never needs TypeScript; a genuinely new
 * primitive — a geodesic dome, a cable roof — is code, and that line is stated rather than hidden.
 *
 * **`BuildingEntityData` is what a `building` entity carries in `entity.data`.** Core owns the
 * entity, this module owns the bag on it (ARCHITECTURE §3), and every field in it is optional: a
 * building placed with nothing but a position must behave exactly like one a build tool filled in.
 * The demo park, a save written before a field existed and an `entity:add` typed into a console all
 * arrive through the same door.
 *
 * **`SurfaceName` is the atlas.** A style names its materials by these ids and `geometry.ts` maps
 * them to atlas slots. A pack may name any of them; a name nothing knows falls back to render and
 * warns once, rather than drawing an untextured surface.
 */

export type Localized = Record<string, string>;

/** sRGB hex, `#rrggbb`. Converted to linear exactly once, in `geometry.ts`. */
export type Hex = string;

/** The procedural surfaces the atlas holds. A style names its materials with these. */
export type SurfaceName =
  | 'brick'
  | 'render'
  | 'ashlar'
  | 'timber'
  | 'panel'
  | 'concrete'
  | 'slate'
  | 'pantile'
  | 'zinc'
  | 'shingle'
  | 'paving'
  | 'metal'
  | 'rubble'
  | 'canvas'
  | 'copper';

/**
 * One character of a facade pattern — what stands in one bay of one storey.
 *
 * `s` solid   `w` window   `t` tall window   `a` arched window   `o` oculus
 * `d` door    `D` grand double door          `g` glazed shopfront
 * `v` louvred vent          `n` blind niche  `p` pilaster (a projecting strip, no opening)
 */
export type BayCode = 's' | 'w' | 't' | 'a' | 'o' | 'd' | 'D' | 'g' | 'v' | 'n' | 'p';

export type RoofForm =
  'gable' | 'hip' | 'pyramid' | 'flat' | 'mansard' | 'shed' | 'cone' | 'barrel';

export type FacadeSide = 'front' | 'right' | 'back' | 'left';

// ── Style ───────────────────────────────────────────────────────────────────────────────────

/**
 * What a building is made of and what colour it is painted.
 *
 * Split from the blueprint because they vary independently and that is the whole point of a kit:
 * the same ticket hall in brick with a slate roof and in white render with pantiles is two style
 * ids and one blueprint, and a theme pack ships the style alone.
 */
export interface BuildingStyleDef {
  id: string;
  name?: Localized;
  /** Wall surface for the main storeys. */
  wall: SurfaceName;
  /** Upper storeys, when a building changes material at the string course. Defaults to `wall`. */
  wallUpper?: SurfaceName;
  /** The base course. */
  plinth: SurfaceName;
  roof: SurfaceName;
  palette: BuildingPalette;
  trim: TrimDef;
  /** Panes across and up in a standard window. */
  glazing: { mullions: number; transoms: number };
}

export interface BuildingPalette {
  wall: Hex;
  /** Upper storeys / secondary masses. Defaults to `wall`. */
  wallUpper?: Hex;
  plinth: Hex;
  roof: Hex;
  /** Cornice, string course, quoins, fascia — the stone or painted band. */
  trim: Hex;
  /** Window frames and doors. */
  joinery: Hex;
  /** Railings, gutters, downpipes, canopy frames. */
  metal: Hex;
  /** Daylight glass tint. */
  glass: Hex;
  /** What a lit window looks like after dark. */
  lit: Hex;
  /** The lit face of a sign band. */
  sign: Hex;
}

export interface TrimDef {
  /** Height of the cornice band under the eaves, metres. 0 = none. */
  cornice: number;
  /** Height of the string course between storeys, metres. 0 = none. */
  stringCourse: number;
  /** Rusticated corner blocks. */
  quoins: boolean;
  /** How deep a window sits into the wall, metres. This is most of what stops a facade reading flat. */
  reveal: number;
  /** Projection of a window sill past the wall face, metres. */
  sill: number;
  /** Projection of the cornice past the wall face, metres. */
  corniceOut: number;
}

// ── Blueprint ───────────────────────────────────────────────────────────────────────────────

export interface BlueprintDef {
  id: string;
  name?: Localized;
  /** Style id, resolved against the registered styles. */
  style: string;
  masses: MassDef[];
  ground?: GroundDef;
  night?: NightDef;
  sign?: SignDef;
  /** Overall size for the palette's footprint; derived from the masses when absent. */
  size?: [number, number, number];
}

/**
 * One rectangular (or polygonal) volume of the building.
 *
 * A building is a handful of these: a main block, a wing, a porch, a tower. Everything else — bays,
 * openings, trim, the roof — hangs off one.
 */
export interface MassDef {
  id?: string;
  /** Centre in plan, metres from the building origin. */
  at?: [number, number];
  /** Plan size, x by z, metres. */
  size: [number, number];
  /** Rotation about +Y within the building, degrees. */
  yaw?: number;
  storeys?: number;
  storeyHeight?: number;
  /** Floor level above the building origin, metres. A wing on a terrace. */
  base?: number;
  /** Base course height, metres. */
  plinth?: number;
  /** Target bay width, metres. The real width is the facade divided by a whole number of bays. */
  bay?: number;
  /** Bay patterns per facade. `all` is the default for any side not named. */
  facades?: FacadeMap;
  roof?: RoofDef;
  /** Trim overrides for this mass. */
  trim?: Partial<TrimDef>;
  /** A colonnade or loggia in front of one side. */
  arcade?: ArcadeDef;
  /** Sides ≥ 3 draws a regular polygonal drum instead of a box — a rotunda, a tower. */
  round?: number;
  /** Palette overrides for this mass. */
  wallColor?: Hex;
  roofColor?: Hex;
  /** Material overrides for this mass. */
  wallSurface?: SurfaceName;
  roofSurface?: SurfaceName;
  /** A clock face on the front gable or drum. Diameter in metres; 0 = none. */
  clock?: number;
}

export interface FacadeMap {
  all?: string;
  front?: string;
  right?: string;
  back?: string;
  left?: string;
}

export interface RoofDef {
  form: RoofForm;
  /** Degrees from horizontal. Ignored by `flat`. */
  pitch?: number;
  /** Overhang past the wall face, metres. */
  eaves?: number;
  /** Which axis the ridge runs along, in the mass's own space. */
  ridge?: 'x' | 'z';
  /** Height of the parapet over a flat roof, metres. */
  parapet?: number;
  /** Dormer windows per long slope. */
  dormers?: number;
  chimneys?: number;
  /** A lantern / cupola on the ridge or apex. */
  lantern?: LanternDef;
  material?: SurfaceName;
  color?: Hex;
}

export interface LanternDef {
  height: number;
  radius: number;
  sides: number;
  roof?: 'cone' | 'pyramid';
  /** Glazed sides glow at night. */
  glazed?: boolean;
}

export interface ArcadeDef {
  side: FacadeSide;
  /** How far the colonnade stands out from the wall, metres. */
  depth: number;
  columns: number;
  /** Round-headed arches between the columns rather than a flat architrave. */
  arch?: boolean;
  /** Height to the underside of the entablature, metres. Defaults to the ground storey. */
  height?: number;
}

export interface GroundDef {
  /** Paved skirt around the building, metres past the wall face. 0 = none. */
  apron?: number;
  /** Steps up to the front door. Their number follows the plinth height. */
  steps?: boolean;
  /** A kerb round the apron. */
  kerb?: boolean;
}

export interface NightDef {
  /** Fraction of the windows that are lit after dark, 0..1. */
  litFraction?: number;
  /** Lanterns beside the doors. */
  lanterns?: boolean;
  /** Real point lights this building asks the pool for. Kept small on purpose. */
  spill?: number;
}

export interface SignDef {
  /** Height of the lit band over the entrance, metres. 0 = none. */
  band: number;
  side?: FacadeSide;
  /** Fraction of the facade the band spans. */
  width?: number;
  color?: Hex;
}

// ── Entity ──────────────────────────────────────────────────────────────────────────────────

/** What a `building` entity may carry. Every field optional; see the docblock at the top. */
export interface BuildingEntityData {
  /** Style id override — the same blueprint in another material. */
  style?: string;
  /** Blueprint id override, for a pack item that is a kit piece but was placed as a building. */
  blueprint?: string;
  /** Extra variation seed. Two identical buildings side by side get different brick tones. */
  variant?: number;
}

// ── Resolution ──────────────────────────────────────────────────────────────────────────────

/** What `manifest.ts` hands `build.ts`: everything needed to draw one building, and nothing else. */
export interface ResolvedBuilding {
  /** `pack:item`. */
  key: string;
  name: Localized;
  pack: string;
  item: string;
  /** `blueprint` for a whole building, or the kit category for a single piece. */
  category: 'wall' | 'roof' | 'window' | 'door' | 'floor' | 'trim' | 'column' | 'blueprint';
  /** Declared bounding size, `[x, y, z]`. The palette reads its footprint off this. */
  size: [number, number, number];
  style: BuildingStyleDef;
  /** Present for a whole building; null for a single kit piece. */
  blueprint: BlueprintDef | null;
  /** For a kit piece: which generator draws it. */
  piece: string | null;
  /** Where the record came from, for the report and the console. */
  source: 'pack' | 'builtin' | 'fallback';
  cost: number;
}

/** A window that can light up after dark, in the building's own space. */
export interface WindowSite {
  x: number;
  y: number;
  z: number;
}

/** Where this building would like a real light after dark, in its own space. */
export interface LightSite {
  x: number;
  y: number;
  z: number;
  color: Hex;
  /** Candela before the night factor. */
  intensity: number;
  range: number;
}

export interface BuildBounds {
  min: [number, number, number];
  max: [number, number, number];
}
