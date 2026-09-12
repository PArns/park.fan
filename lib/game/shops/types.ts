/**
 * The shapes every other file in this module agrees on. DOM-free, Babylon-free, import-safe on the
 * worker and in node.
 *
 * Two contracts with the outside world live here and are worth reading before changing anything.
 *
 * **`ShopEntityData` is what a `shop` entity carries in `entity.data`.** Core owns the entity, this
 * module owns the `data` bag on it (ARCHITECTURE §3), and everything in it is optional: a shop
 * placed with nothing but a position must behave exactly like one placed by a build tool that
 * filled every field. That is not politeness — the demo park, a save written before a field
 * existed, and `entity:add` typed into a console all arrive by the same door.
 *
 * **`ShopOffer` is the answer to the question the `guests` module asks**: where is the nearest open
 * thing that relieves need X, and how long is its queue. It carries the frontage point rather than
 * the entity position, because those are not the same point (see `frontageOf` in `sim.ts`) and a
 * consumer that walked to the entity position would walk into the building.
 */

export type Localized = Record<string, string>;

/** Cents. Never a float — money is integers everywhere in this game. */
export type Cents = number;

// ── Content ─────────────────────────────────────────────────────────────────────────────────

/**
 * How a shop building is put together.
 *
 * Every field is a number or a small string union, and nothing in `build.ts` switches on a style
 * **id** — the builder reads this record and draws what it says. `form` is the one closed set, and
 * it is closed the way `thoughts.signal` is closed in the guests module: a pack may combine the
 * five forms with any parameters it likes, and a genuinely new massing is code. That line is
 * stated rather than hidden.
 */
export interface ShopStyleDef {
  id: string;
  /**
   * The massing.
   *
   * `kiosk`   a free-standing rectangular hut with a serving window in its long side
   * `round`   a polygonal pavilion with a conical roof and a wrap-around counter
   * `block`   a low utility block with doors instead of a counter (toilets, changing rooms)
   * `unit`    a retail unit with a glazed shopfront, a door and a fascia
   * `machine` a machine on a plinth under a hood — no interior, no roof
   */
  form: 'kiosk' | 'round' | 'block' | 'unit' | 'machine';
  /** Height to the eaves, metres. */
  wallHeight: number;
  roof: 'hip' | 'gable' | 'cone' | 'flat' | 'shed';
  /** Roof pitch in degrees from horizontal. Ignored by `flat`. */
  roofPitch: number;
  /** Eaves overhang, metres, all round. */
  eaves: number;
  /** Serving bays in the frontage. 0 means the front is doors or glazing instead. */
  counters: number;
  counterHeight: number;
  /** Projection of the awning over the apron, metres. 0 = none. */
  awning: number;
  /** Menu board width as a fraction of the frontage, 0 = none. */
  menuBoard: number;
  /** Doors in the frontage (a toilet block, a changing room). */
  doors: number;
  /** Fraction of the frontage that is glazed shopfront. */
  glazing: number;
  /** Length of queue rail drawn along the apron, metres. 0 = none. */
  rail: number;
  /** Depth of the paved hard standing in front of the frontage, metres. */
  apron: number;
  /** Base course height, metres. 0 = the wall meets the apron. */
  plinth: number;
  /** What the walls are made of. Picks the atlas tile; the colour comes from the palette. */
  cladding: 'render' | 'timber' | 'panel' | 'brick';
  /** Flue height above the ridge, metres. 0 = none. A grill has one; an ice-cream kiosk does not. */
  flue: number;
  /** Bins, a condiment shelf, a planter — the things that stand beside a real kiosk. */
  dressing: boolean;
  palette: ShopPalette;
  sign: ShopSignDef;
}

/** sRGB hex, `#rrggbb`. The builder converts to linear once. */
export interface ShopPalette {
  wall: string;
  trim: string;
  roof: string;
  /** The two awning stripes. Equal values give a plain awning. */
  awningA: string;
  awningB: string;
  metal: string;
  /** The fascia board the lit panel is set into — the dark surround, not the sign face. */
  sign: string;
  /**
   * The lit face of the sign.
   *
   * Separate from `sign` because they are opposite jobs and using one colour for both is a bug you
   * can see: the surround has to be dark so the panel has an edge, and the panel has to be bright
   * so it reads as a sign — so the five shops in the bundled packs that declare no `night.signage`
   * got a fascia in the SURROUND colour and rendered as a black bar across the frontage. A pack's
   * `shops[].night.signage` still wins over this.
   */
  signLit: string;
}

export interface ShopSignDef {
  /** Height of the fascia band over the frontage, metres. 0 = no fascia. */
  fascia: number;
  /**
   * Pictogram on the fascia, by id from the built-in glyph library.
   *
   * A glyph is a list of polylines in a 0..1 box, so `strokes` below lets a pack ship one that the
   * library does not have — the shape is data, not a `switch`. `glyph` is looked up first and
   * `strokes` wins if both are present.
   */
  glyph?: string;
  /** Polylines in a 0..1 box: `[[x0,y0,x1,y1,…], …]`. Drawn as extruded strips. */
  strokes?: number[][];
  /** A projecting bracket sign at the corner of the frontage. */
  bracket: boolean;
  /** Height of a free-standing pylon sign beside the apron, metres. 0 = none. */
  post: number;
}

/**
 * What is on the menu board, what the counter holds, and how fast it serves.
 *
 * A menu is matched to shops by `for`, most specific first: `pack:item`, then a bare `item`, then
 * `kind:<kind>`, then nothing — so a pack can price one shop, every shop with that id in any pack,
 * or every food outlet in the game, with one entry.
 */
export interface ShopMenuDef {
  id: string;
  /** `core-classic:burger` | `burger` | `kind:food` | `*`. */
  for: string;
  items: Array<{ name: Localized; price: Cents }>;
  /** Units the counter holds when full. */
  stock: number;
  /** Units one delivery brings. */
  restockUnits: number;
  /** Park minutes between deliveries. */
  restockMinutes: number;
  /** Park minutes one counter takes over one customer, before variation. */
  serviceMinutes: number;
  /** What one unit costs the park, cents. Reported as COGS; never written to `finance`. */
  unitCost: Cents;
  /** People who will stand in the line per counter before the next one walks off. */
  queuePerCounter: number;
  /** Park minutes the shop is open, `[from, to]`. */
  hours: [number, number];
}

// ── World state ─────────────────────────────────────────────────────────────────────────────

/** What a `shop` entity carries in `entity.data`. Every field optional; see the file docblock. */
export interface ShopEntityData {
  /** Overrides the manifest price, cents. A management module writes this. */
  price?: Cents;
  /** Overrides the style's counter count. */
  counters?: number;
  /** Shut by the operator, whatever the hour. */
  closed?: boolean;
  /** Overrides the menu's opening hours, park minutes since midnight. */
  hours?: [number, number];
  /** Style id override, when a player re-themes one building. */
  style?: string;
}

// ── The public API ──────────────────────────────────────────────────────────────────────────

/** One shop's answer to "can you help me, and how long will it take". */
export interface ShopOffer {
  /** Entity id. */
  id: string;
  /** `pack:item`. */
  key: string;
  /** Where a guest stands to be served. NOT the entity position. */
  frontage: [number, number];
  /** The entity position, for a caller that wants to draw a line to the building. */
  at: [number, number];
  /** Need id this shop answers, or `'none'`. */
  need: string;
  /** Points off the 0..255 need scale one visit removes. */
  relief: number;
  price: Cents;
  /** People in the line right now. */
  queue: number;
  /** Park minutes a guest joining now would wait before being served. */
  waitMinutes: number;
  /** Units left on the counter. `Infinity` is never returned; an unstocked shop is not offered. */
  stock: number;
  open: boolean;
}

/** The receipt a served guest gets back. */
export interface ShopSale {
  shop: string;
  guest: number;
  cents: Cents;
  need: string;
  relief: number;
  /** Park minutes this guest spent in the line. */
  waited: number;
}

/** Why a guest was turned away. Each one is counted, because a shop that fails silently is a bug. */
export type ShopRefusal = 'closed' | 'full' | 'stock' | 'price' | 'unknown';

export interface ShopJoin {
  /** Opaque handle for `place`, `collect` and `leave`. */
  ticket: number;
  /** Where to stand right now. Moves forward as the line shortens. */
  stand: [number, number];
  /** Expected wait in park minutes at the moment of joining. */
  waitMinutes: number;
}

/** One shop as the HUD, the overlay and a critic's probe see it. */
export interface ShopView {
  id: string;
  key: string;
  name: Localized;
  kind: string;
  style: string;
  need: string;
  price: Cents;
  at: [number, number];
  frontage: [number, number];
  yaw: number;
  open: boolean;
  counters: number;
  staffWanted: number;
  queue: number;
  waitMinutes: number;
  stock: number;
  stockCapacity: number;
  servedToday: number;
  takingsToday: Cents;
  /** Cost of the goods sold today. Reported, not booked — see `sim.ts`. */
  cogsToday: Cents;
  refusedToday: Record<ShopRefusal, number>;
  /** 0..1, share of the last hour the counters were busy. */
  utilisation: number;
}

export interface ShopsStats {
  shops: number;
  open: number;
  /** Summed over every shop. */
  queue: number;
  servedToday: number;
  takingsToday: Cents;
  cogsToday: Cents;
  upkeepPerHour: Cents;
  staffWanted: number;
  stockouts: number;
  refusedToday: Record<ShopRefusal, number>;
  /** Need ids no open shop in the park answers. The reason a need runs to critical. */
  unanswered: string[];
  /** Milliseconds the last tick cost this module, by the caller's own clock. */
  tickMs: number;
}

/** What `sim.ts` exposes to `guests`, the HUD, the soak harness and every other sim module. */
export interface ShopsSimApi {
  /** Shops answering `need`, cheapest walk first. `cash` filters out what the guest cannot pay. */
  find(need: string, x: number, z: number, cash?: number, limit?: number): ShopOffer[];
  /** One shop's current offer, or null when it is not a shop this module knows. */
  offer(id: string): ShopOffer | null;
  /** Join the line. Null means refused; `lastRefusal()` says why. */
  join(id: string, guest: number, cash: Cents): ShopJoin | null;
  /** Where the holder of this ticket should be standing now. Null once it is gone. */
  place(id: string, ticket: number): [number, number] | null;
  /** Poll for the receipt. Returns it exactly once, then forgets it. */
  collect(id: string, ticket: number): ShopSale | null;
  /** Give up and walk off. Counted as a balk. */
  leave(id: string, ticket: number): void;
  /** Why the last `join` on this shop was refused. */
  lastRefusal(id: string): ShopRefusal | null;
  /** Where a guest stands to be served at this shop. */
  frontage(id: string): [number, number] | null;
  list(): ShopView[];
  stats(): ShopsStats;
}
