/**
 * The plan of "park.fan Resort": every coordinate the demo park is built from, in one file.
 *
 * It is data rather than code because three different passes read the same geography — the
 * landform flattens the pads, the paint layer follows the zones, and the props stand on the
 * terraces — and a park whose plaza is at z = 168 in one file and z = 170 in another is a park
 * with a step in the middle of it.
 *
 * **The layout is built around the fixed camera presets in `core/host.ts`**, because they are what
 * every screenshot of this game is taken through and a composition none of them frames is a
 * composition nobody will ever see:
 *
 *   `entrance` at (0, 34, 250) looking at (0, 2, 170) — the arch spans the gate walk at z = 210
 *              and the entrance plaza fills the middle of the frame.
 *   `ground`   at (0, 2.2, 132) looking north down the axis — this is the visitor's eye, so the
 *              main street runs dead straight from the entrance plaza to the market square, with
 *              its lamp and lime avenues either side.
 *   `close`    at (27, 12, -27) looking at (0, 2, 0) — the fountain square, the park's hub.
 *   `overview` at (164, 91, -283) looking south-west across the whole park.
 *   `coaster`  at (-90, 10, -40) — which is why the coaster plot is where it is.
 *   `pool`     at (110, 0, 60) — likewise the water-park plot.
 *
 * DOM-free, Babylon-free, node-safe: `scripts/game-soak.mjs` imports the world factory directly.
 */

/** The park is a square of this many metres, centred on the origin. Matches `DEFAULT_PARK_SIZE`. */
export const PARK_SIZE = 512;
export const PARK_HALF = PARK_SIZE / 2;

/**
 * The water table. Everything the landform leaves below this line is drawn as open water, so the
 * rolling ground is clamped above it and only the lake basin is allowed under.
 */
export const WATER_LEVEL = -1.2;

// ── The south–north axis ────────────────────────────────────────────────────────────────────
/**
 * Three terraces on one straight axis, each a step lower than the one south of it: the visitor
 * walks in at 1.2 m and arrives at the fountain at 0.2 m.
 *
 * **The absolute heights are set by a camera, not by taste.** `ground` is a fixed preset — eye at
 * (0, 2.16, 132), looking north along this axis — and it is the only visitor's-eye frame the
 * harness takes. The first version of this park put the main street at 3.09 m there, which is
 * ABOVE that eye: sixteen screenshots came back with the camera under the ground, looking at the
 * inside of the sky dome through a back-culled hillside. So the fall is a metre over 210 m rather
 * than three, and the ramp between the market square and the entrance sits north of z = 150, out
 * of the way of the one place a camera stands.
 */
export interface Terrace {
  x: number;
  z: number;
  /** Circumradius of the plaza polygon. */
  radius: number;
  height: number;
  /** Corners of the plaza polygon; a plaza is a ring, not a disc. */
  corners: number;
  /** Which registered path style paves it. */
  style: string;
}

export const ENTRANCE_PLAZA: Terrace = {
  x: 0,
  z: 178,
  radius: 30,
  height: 1.2,
  corners: 12,
  style: 'pavers',
};
export const MARKET_SQUARE: Terrace = {
  x: 0,
  z: 86,
  radius: 24,
  height: 0.5,
  corners: 10,
  style: 'pavers',
};
export const FOUNTAIN_SQUARE: Terrace = {
  x: 0,
  z: -4,
  radius: 30,
  height: 0.2,
  corners: 12,
  style: 'cobble',
};

/** Half-width of the flattened main-street corridor, and how far the flatten blends out. */
export const STREET_HALF_WIDTH = 26;
export const STREET_BLEND = 24;
export const STREET_FROM_Z = -40;
export const STREET_TO_Z = 222;

/** Height of the main axis at a given z: three terraces joined by two ramps. */
export function streetHeight(z: number): number {
  const toMarket = smooth01(22, 64, z);
  const toEntrance = smooth01(150, 190, z);
  return (
    FOUNTAIN_SQUARE.height +
    (MARKET_SQUARE.height - FOUNTAIN_SQUARE.height) * toMarket +
    (ENTRANCE_PLAZA.height - MARKET_SQUARE.height) * toEntrance
  );
}

// ── The lake ────────────────────────────────────────────────────────────────────────────────
export const LAKE = {
  x: 150,
  z: 150,
  /** Where the waterline sits, metres from the centre. */
  shore: 42,
  /** Where the basin stops overriding the surrounding land. */
  reach: 50,
  fade: 72,
  floor: -6.8,
  /** Height of the bank at `fade`. */
  bank: 3.4,
};

/**
 * The lake bed as a function of distance from its centre.
 *
 * The rise to the waterline is a power curve, not a smoothstep, and that is a picture rather than
 * a preference. A smoothstep flattens as it arrives, so the last eight metres before the shore
 * were under twenty centimetres of water — and the water material fades to nearly clear at that
 * depth, so the lake rendered as a twenty-metre ring of blinding white sand with a small dark
 * puddle in the middle. `t^2.6` puts a metre and a half of water four metres off the beach.
 */
export function lakeProfile(d: number): number {
  if (d <= 10) return LAKE.floor;
  if (d <= LAKE.shore) {
    const t = (d - 10) / (LAKE.shore - 10);
    return LAKE.floor + (WATER_LEVEL - LAKE.floor) * Math.pow(t, 2.6);
  }
  return WATER_LEVEL + (LAKE.bank - WATER_LEVEL) * smooth01(LAKE.shore, 58, d);
}

/** The lakeside promenade's ring, at a radius that keeps it four to ten metres off the water. */
export function lakeRing(index: number, count = 14): [number, number] {
  const a = (index / count) * Math.PI * 2 + 0.22;
  const r = 50 + 4 * Math.sin(3 * a + 1.1) - 2 * Math.cos(2 * a);
  return [LAKE.x + Math.cos(a) * r, LAKE.z + Math.sin(a) * r];
}

// ── Reserved plots ──────────────────────────────────────────────────────────────────────────
/**
 * Land this park deliberately leaves empty, flattened and served by a path, for the six modules
 * that are still being written. They are `Pad`s rather than a comment in a report because the
 * landform reads them: a plot that is not flat is a plot the next builder has to sculpt first.
 */
export interface Pad {
  id: string;
  /** The module that will build here. `park` is the demo park's own ground. */
  owner: 'track' | 'rides' | 'pools' | 'flumes' | 'buildings' | 'shops' | 'park';
  x: number;
  z: number;
  halfX: number;
  halfZ: number;
  /** Metres. `null` means "whatever the street corridor already made it". */
  height: number | null;
  /** Metres over which the flatten blends back into the land around it. */
  blend: number;
  note: string;
}

export const PADS: readonly Pad[] = [
  {
    id: 'coaster',
    owner: 'track',
    x: -96,
    z: -52,
    halfX: 29,
    halfZ: 24,
    height: 8,
    blend: 26,
    note: 'Raised shelf under the hill, ringed by its own path loop. The `coaster` camera preset looks straight at it.',
  },
  {
    id: 'fairground',
    owner: 'rides',
    x: 96,
    z: -46,
    halfX: 24,
    halfZ: 21,
    height: 2.6,
    blend: 22,
    note: 'Flat ground for the flat rides, inside the fairground loop.',
  },
  {
    id: 'water-park',
    owner: 'pools',
    x: 112,
    z: 50,
    halfX: 22,
    halfZ: 16,
    height: 1.2,
    blend: 20,
    note: 'The `pool` camera preset targets (110, 0, 60). Lowest ground in the developed park, next to the lake.',
  },
  {
    id: 'flumes',
    owner: 'flumes',
    x: 168,
    z: 18,
    halfX: 18,
    halfZ: 15,
    height: 2.2,
    blend: 18,
    note: 'East of the water park, on the lakeside link, so a slide tower reads against the lake.',
  },
  {
    id: 'pavilion',
    owner: 'buildings',
    x: -8,
    z: -162,
    halfX: 28,
    halfZ: 16,
    height: 7,
    blend: 20,
    note: 'The north end of the park, behind its own forecourt plaza — a hall, a theatre, whatever buildings wants. Seven metres up, on the shoulder of the ridge, because that is what the ground there already is: cutting it to three left a five-metre scar visible from the overview camera.',
  },
  {
    id: 'pavilion-forecourt',
    owner: 'park',
    x: -8,
    z: -130,
    halfX: 17,
    halfZ: 13,
    height: 7,
    blend: 20,
    note: 'The pavilion plaza. A plaza is a flat thing; this one was drawn on a hillside at 7.6 m and read from the overview as a pale lens lying across a slope.',
  },
  {
    id: 'water-forecourt',
    owner: 'park',
    x: 72,
    z: 54,
    halfX: 17,
    halfZ: 17,
    height: 1.6,
    blend: 18,
    note: 'The water-park plaza, one step above the plot it fronts.',
  },
  {
    id: 'shops-west',
    owner: 'shops',
    x: -19,
    z: 120,
    halfX: 7,
    halfZ: 22,
    height: null,
    blend: 0,
    note: 'Main-street frontage, west side. Already flat: the street corridor made it.',
  },
  {
    id: 'shops-east',
    owner: 'shops',
    x: 19,
    z: 120,
    halfX: 7,
    halfZ: 22,
    height: null,
    blend: 0,
    note: 'Main-street frontage, east side.',
  },
  {
    id: 'shops-market',
    owner: 'shops',
    x: 19,
    z: 44,
    halfX: 7,
    halfZ: 16,
    height: null,
    blend: 0,
    note: 'Between the market square and the fountain square, on the busiest stretch of path in the park.',
  },
];

// ── Landform features ───────────────────────────────────────────────────────────────────────
/** The wooded ridge behind the coaster shelf: the only real skyline the park has of its own. */
export const RIDGE = {
  fromX: -196,
  fromZ: -186,
  toX: -118,
  toZ: -88,
  height: 22,
  sigma: 48,
};

/** A shallow valley down the west side, with the garden walk along its floor. */
export const VALLEY: readonly [number, number][] = [
  [-140, 212],
  [-128, 152],
  [-116, 94],
  [-102, 42],
  [-88, -8],
];
export const VALLEY_DEPTH = 5;
export const VALLEY_HALF = 26;
export const VALLEY_FADE = 74;

/**
 * The rim: the ground rises towards the boundary so the park sits in a bowl, and the woodland band
 * planted on it is what the eye reads as "the park ends there" instead of "the world ends there".
 * The rise is suppressed in a window south of the gate, which is what makes the entrance a gap in
 * the treeline rather than a cutting through a hill.
 */
export const RIM = { from: 190, to: 252, height: 7.5, gateHalfWidth: 34, gateFromZ: 150 };

/** Zones the paint pass uses; `maxNorm` is the Chebyshev distance from the park centre. */
export const CORE_RADIUS = 168;
export const WOODLAND_FROM = 172;

// ── Path network ────────────────────────────────────────────────────────────────────────────
export interface PathPlan {
  id: string;
  form: 'path' | 'plaza';
  style: string;
  width?: number;
  closed?: boolean;
  entrance?: boolean;
  /** Flat `[x, z, …]`. */
  points: number[];
  note: string;
}

/** A regular polygon as a flat point list, for a plaza ring. */
export function polygon(cx: number, cz: number, radius: number, corners: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < corners; i++) {
    const a = (i / corners) * Math.PI * 2 + Math.PI / corners;
    out.push(cx + Math.cos(a) * radius, cz + Math.sin(a) * radius);
  }
  return out;
}

function ring(count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const [x, z] = lakeRing(i, count);
    out.push(x, z);
  }
  return out;
}

/** The vertex of the lakeside ring the walk from the water park runs into. */
export const LAKE_RING_COUNT = 14;
export const LAKE_RING_WEST = lakeRing(6, LAKE_RING_COUNT);
export const LAKE_RING_NORTH = lakeRing(11, LAKE_RING_COUNT);

export const PATHS: readonly PathPlan[] = [
  {
    id: 'gate',
    form: 'path',
    style: 'promenade',
    width: 8,
    entrance: true,
    points: [0, 228, 0, 218, 0, 208, 0, 196],
    note: 'The gate walk. `entrance: true` puts the park gate on its first node, which is what `PathsMainApi.entrance()` answers with.',
  },
  {
    id: 'entrance-plaza',
    form: 'plaza',
    style: ENTRANCE_PLAZA.style,
    points: polygon(
      ENTRANCE_PLAZA.x,
      ENTRANCE_PLAZA.z,
      ENTRANCE_PLAZA.radius,
      ENTRANCE_PLAZA.corners
    ),
    note: 'Clay pavers, twelve sides. The first thing a visitor stands on.',
  },
  {
    id: 'main-street-south',
    form: 'path',
    style: 'promenade',
    width: 8,
    points: [0, 150, 0, 134, 0, 120, 0, 106, 0, 96],
    note: 'Entrance plaza to market square. Dead straight: the `ground` camera stands on it at z = 132 and looks up it.',
  },
  {
    id: 'market-square',
    form: 'plaza',
    style: MARKET_SQUARE.style,
    points: polygon(MARKET_SQUARE.x, MARKET_SQUARE.z, MARKET_SQUARE.radius, MARKET_SQUARE.corners),
    note: 'Where the east avenue and the garden walk leave the axis.',
  },
  {
    id: 'main-street-north',
    form: 'path',
    style: 'promenade',
    width: 8,
    points: [0, 68, 0, 54, 0, 40, 0, 28, 0, 22],
    note: 'Market square to fountain square.',
  },
  {
    id: 'fountain-square',
    form: 'plaza',
    style: FOUNTAIN_SQUARE.style,
    points: polygon(
      FOUNTAIN_SQUARE.x,
      FOUNTAIN_SQUARE.z,
      FOUNTAIN_SQUARE.radius,
      FOUNTAIN_SQUARE.corners
    ),
    note: 'Granite setts, the fountain in the middle. The hub: five paths meet here.',
  },
  {
    id: 'garden-walk',
    form: 'path',
    style: 'pavers',
    width: 6,
    points: [
      -16, 92, -44, 100, -72, 102, -96, 92, -114, 74, -122, 50, -120, 26, -108, 4, -88, -12, -62,
      -20, -38, -18, -18, -12,
    ],
    note: 'The west loop: market square, down into the valley, back up to the fountain square.',
  },
  {
    id: 'coaster-link',
    form: 'path',
    style: 'pavers',
    width: 4,
    points: [-88, -12, -92, -14, -96, -16],
    note: 'Twenty metres of path joining the garden walk to the coaster loop. Both ends sit on a control point of the path they meet, which is what makes the weld certain rather than lucky.',
  },
  {
    id: 'coaster-loop',
    form: 'path',
    style: 'pavers',
    width: 4,
    closed: true,
    points: [
      -96, -16, -60, -30, -62, -56, -72, -78, -96, -90, -122, -86, -136, -66, -136, -40, -122, -22,
    ],
    note: 'Rings the coaster plot at about ten metres clearance, so the track builder gets the whole shelf and the guests get a way round it.',
  },
  {
    id: 'north-walk',
    form: 'path',
    style: 'pavers',
    width: 4,
    points: [
      -96, -90, -80, -110, -56, -122, -28, -126, 4, -126, 34, -120, 58, -104, 72, -84, 76, -72,
    ],
    note: 'Across the top of the park, coaster loop to fairground loop, through the pavilion forecourt.',
  },
  {
    id: 'pavilion-plaza',
    form: 'plaza',
    style: 'pavers',
    points: polygon(-8, -130, 14, 8),
    note: 'Forecourt of the reserved pavilion plot, straddling the north walk.',
  },
  {
    id: 'fairground-link',
    form: 'path',
    style: 'pavers',
    width: 4,
    points: [24, -14, 40, -18, 56, -20, 70, -24],
    note: 'Fountain square to the fairground loop.',
  },
  {
    id: 'fairground-loop',
    form: 'path',
    style: 'pavers',
    width: 4,
    closed: true,
    points: [70, -24, 68, -50, 76, -72, 98, -84, 120, -80, 132, -62, 132, -38, 122, -20, 98, -14],
    note: 'Rings the flat-ride plot.',
  },
  {
    id: 'east-avenue',
    form: 'path',
    style: 'promenade',
    width: 6,
    points: [18, 84, 42, 80, 60, 72, 70, 60],
    note: 'Market square to the water-park forecourt.',
  },
  {
    id: 'water-forecourt',
    form: 'plaza',
    style: 'pavers',
    points: polygon(72, 54, 14, 8),
    note: 'Forecourt of the reserved pools plot; the plot itself starts twenty metres east of it.',
  },
  {
    id: 'lake-walk',
    form: 'path',
    style: 'pavers',
    width: 4,
    points: [80, 62, 92, 80, 100, 98, LAKE_RING_WEST[0], LAKE_RING_WEST[1]],
    note: 'Down to the water. Ends exactly on a vertex of the lakeside ring.',
  },
  {
    id: 'lakeside-promenade',
    form: 'path',
    style: 'boardwalk',
    width: 4,
    closed: true,
    points: ring(LAKE_RING_COUNT),
    note: 'Timber boardwalk all the way round the lake, four to ten metres off the waterline.',
  },
  {
    id: 'lookout',
    form: 'plaza',
    style: 'boardwalk',
    points: polygon(104, 168, 11, 8),
    note: 'A widening of the boardwalk on the west bank, looking across the water at the far shore.',
  },
  {
    id: 'lake-link',
    form: 'path',
    style: 'pavers',
    width: 4,
    points: [
      LAKE_RING_NORTH[0],
      LAKE_RING_NORTH[1],
      158,
      76,
      152,
      54,
      146,
      34,
      142,
      12,
      134,
      -6,
      122,
      -20,
    ],
    note: 'The second way off the lakeside ring: north past the flume plot to the fairground loop, so the east side is a circuit and not a spur.',
  },
  {
    id: 'service-road',
    form: 'path',
    style: 'service-road',
    width: 6,
    points: [
      -26, 196, -50, 192, -74, 186, -98, 172, -116, 152, -124, 126, -122, 98, -116, 72, -120, 50,
    ],
    note: 'Asphalt behind the west treeline, entrance plaza to the garden walk. A park has a back of house and it should be visible from the overview.',
  },
];

// ── Small maths helpers ─────────────────────────────────────────────────────────────────────
export function smooth01(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0 || 1e-6)));
  return t * t * (3 - 2 * t);
}

export function chebyshev(x: number, z: number): number {
  return Math.max(Math.abs(x), Math.abs(z));
}

/** Squared distance from (x, z) to the segment a→b, and where along it the foot lands. */
export function distanceToPolyline(
  x: number,
  z: number,
  points: readonly [number, number][]
): number {
  let best = Infinity;
  for (let i = 0; i + 1 < points.length; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const len2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
    const px = ax + dx * t;
    const pz = az + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < best) best = d;
  }
  return best;
}

/** Standard crossing test. Plazas are convex here, but the paint pass must not assume it. */
export function pointInPolygon(ring: readonly number[], x: number, z: number): boolean {
  let inside = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i * 2];
    const zi = ring[i * 2 + 1];
    const xj = ring[j * 2];
    const zj = ring[j * 2 + 1];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi || 1e-9) + xi) inside = !inside;
  }
  return inside;
}
