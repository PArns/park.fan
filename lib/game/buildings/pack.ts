/**
 * This module's own content pack.
 *
 * It is a pack and not a TypeScript catalogue on purpose, and that is the whole extensibility
 * argument in one file: the buildings the game ships with go through **exactly the door a third
 * party's would**. Every style and every blueprint here is JSON that `manifest.ts` reads back out of
 * `registry.packs()`; nothing in `build.ts` has ever heard of `grand-pavilion`. Delete this file and
 * the module still draws every building any other pack declares.
 *
 * It also fills a real hole. `core-classic` and `neon-lagoon` declare ten `buildings` entries
 * between them and all ten are kit PIECES — a wall, a window, a door, a roof, a floor, a column. A
 * park needs buildings, the packs are integrator-owned, and a request that has not landed yet is not
 * a park. So the pack ships here, is registered from `main()` (before the worker starts, so both
 * threads see it) and is superseded the moment a pack of the same name arrives.
 *
 * **The blueprints are drawn from real building types**, because "fidelity to the real thing" is a
 * graded axis and a plausible-looking invention is what a 3 looks like on it:
 *
 *   `ticket-hall`     an arcaded entrance building — the loggia holds the queue out of the weather,
 *                     which is why every park gate from 1900 to now has one.
 *   `grand-pavilion`  a Kurhaus: a tall arcaded hall between two pavilions, with a glazed lantern
 *                     over the middle for daylight before electric light was cheap.
 *   `clock-tower`     a town hall / station block: two storeys under a steep pitched roof with
 *                     dormers and chimneys, a four-faced clock tower at one end.
 *   `market-hall`     a barrel-vaulted hall on a colonnade, the nineteenth-century market shed.
 *   `rotunda`         an octagonal bandstand-pavilion: arches all round, a conical roof, a lantern.
 *   `terrace-house`   a narrow three-storey street front with a mansard and dormers, the unit a
 *                     park's main street is built from.
 *   `guest-services`  the modern counter-example: a flat-roofed glazed pavilion in the neon theme,
 *                     to prove the same kit does a building from a different century.
 */

export const ARCHITECTURE_PACK = {
  id: 'parkfan-architecture',
  version: 1,
  name: { en: 'Architecture', de: 'Architektur' },
  requires: [],

  buildingStyles: [
    {
      id: 'old-town-brick',
      name: { en: 'Old town brick', de: 'Altstadt-Ziegel' },
      wall: 'brick',
      plinth: 'ashlar',
      roof: 'slate',
      palette: {
        wall: '#9c4b3c',
        plinth: '#8d8578',
        roof: '#454b54',
        trim: '#e8e0d0',
        joinery: '#2f4a3f',
        metal: '#4b5157',
        glass: '#28353d',
        lit: '#ffcf8a',
        sign: '#d9a441',
      },
      trim: {
        cornice: 0.4,
        stringCourse: 0.24,
        quoins: true,
        reveal: 0.19,
        sill: 0.1,
        corniceOut: 0.3,
      },
      glazing: { mullions: 2, transoms: 3 },
    },
    {
      id: 'resort-render',
      name: { en: 'Resort render', de: 'Kurhaus-Putz' },
      wall: 'render',
      plinth: 'ashlar',
      roof: 'pantile',
      palette: {
        wall: '#efe4cd',
        plinth: '#a9a292',
        roof: '#a85a37',
        trim: '#fbf6ec',
        joinery: '#3a5a68',
        metal: '#59616a',
        glass: '#2b3a42',
        lit: '#ffd79b',
        sign: '#c9432f',
      },
      trim: {
        cornice: 0.46,
        stringCourse: 0.26,
        quoins: true,
        reveal: 0.2,
        sill: 0.11,
        corniceOut: 0.34,
      },
      glazing: { mullions: 3, transoms: 3 },
    },
    {
      id: 'station-stone',
      name: { en: 'Station stone', de: 'Bahnhofsstein' },
      wall: 'ashlar',
      plinth: 'ashlar',
      roof: 'zinc',
      palette: {
        wall: '#cfc7b4',
        plinth: '#8f887a',
        roof: '#7c858c',
        trim: '#e6dfd0',
        joinery: '#6b2f28',
        metal: '#3f464c',
        glass: '#28353d',
        lit: '#ffd08a',
        sign: '#2f5d54',
      },
      trim: {
        cornice: 0.5,
        stringCourse: 0.3,
        quoins: true,
        reveal: 0.22,
        sill: 0.12,
        corniceOut: 0.38,
      },
      glazing: { mullions: 3, transoms: 4 },
    },
    {
      id: 'alpine-timber',
      name: { en: 'Alpine timber', de: 'Alpenholz' },
      wall: 'timber',
      plinth: 'ashlar',
      roof: 'shingle',
      palette: {
        wall: '#7a5236',
        plinth: '#8d8578',
        roof: '#5c4634',
        trim: '#e9dcc2',
        joinery: '#8c3b2c',
        metal: '#4b4137',
        glass: '#2a3a3c',
        lit: '#ffcb84',
        sign: '#c9822f',
      },
      trim: {
        cornice: 0.3,
        stringCourse: 0.18,
        quoins: false,
        reveal: 0.15,
        sill: 0.12,
        corniceOut: 0.5,
      },
      glazing: { mullions: 2, transoms: 2 },
    },
    {
      id: 'lagoon-concrete',
      name: { en: 'Lagoon concrete', de: 'Lagunenbeton' },
      wall: 'concrete',
      plinth: 'concrete',
      roof: 'zinc',
      palette: {
        wall: '#4a6a70',
        plinth: '#3a4d52',
        roof: '#6f797f',
        trim: '#dfe8e6',
        joinery: '#16221f',
        metal: '#2b3438',
        glass: '#1d2c33',
        lit: '#8ff0e2',
        sign: '#16e0c8',
      },
      trim: {
        cornice: 0.24,
        stringCourse: 0,
        quoins: false,
        reveal: 0.13,
        sill: 0.06,
        corniceOut: 0.4,
      },
      glazing: { mullions: 4, transoms: 1 },
    },
  ],

  buildingBlueprints: [
    {
      id: 'ticket-hall',
      name: { en: 'Ticket hall', de: 'Kassenhalle' },
      style: 'station-stone',
      masses: [
        {
          id: 'hall',
          size: [26, 10],
          storeys: 1,
          storeyHeight: 5.6,
          plinth: 0.6,
          bay: 3.4,
          facades: { all: 'w*', front: 'w* D w*', back: 'w* d w*' },
          arcade: { side: 'front', depth: 2.6, columns: 7, arch: true, height: 4.6 },
          roof: {
            form: 'hip',
            pitch: 30,
            eaves: 0.8,
            ridge: 'x',
            lantern: { height: 2.6, radius: 1.6, sides: 8, roof: 'cone', glazed: true },
          },
        },
      ],
      ground: { apron: 1.8, steps: true, kerb: true },
      night: { litFraction: 0.7, lanterns: true },
      sign: { band: 0.95, width: 0.42 },
    },
    {
      id: 'grand-pavilion',
      name: { en: 'Grand pavilion', de: 'Wandelhalle' },
      style: 'resort-render',
      masses: [
        {
          id: 'hall',
          size: [30, 18],
          storeys: 1,
          storeyHeight: 7.4,
          plinth: 0.75,
          bay: 4.0,
          facades: { all: 'a*', front: 'a* D a*' },
          roof: {
            form: 'gable',
            pitch: 34,
            eaves: 0.95,
            ridge: 'x',
            chimneys: 0,
            lantern: { height: 3.2, radius: 2.2, sides: 8, roof: 'cone', glazed: true },
          },
        },
        {
          id: 'west-pavilion',
          at: [-19, 0],
          size: [10, 10],
          storeys: 1,
          storeyHeight: 5.2,
          plinth: 0.75,
          bay: 3.6,
          facades: { all: 'a*', front: 'a*' },
          roof: { form: 'pyramid', pitch: 40, eaves: 0.85 },
        },
        {
          id: 'east-pavilion',
          at: [19, 0],
          size: [10, 10],
          storeys: 1,
          storeyHeight: 5.2,
          plinth: 0.75,
          bay: 3.6,
          facades: { all: 'a*', front: 'a*' },
          roof: { form: 'pyramid', pitch: 40, eaves: 0.85 },
        },
      ],
      ground: { apron: 2.2, steps: true, kerb: true },
      night: { litFraction: 0.62, lanterns: true },
      sign: { band: 0, width: 0.4 },
    },
    {
      id: 'clock-tower',
      name: { en: 'Clock tower hall', de: 'Uhrturmhaus' },
      style: 'old-town-brick',
      masses: [
        {
          id: 'block',
          size: [20, 10],
          storeys: 2,
          storeyHeight: 3.8,
          plinth: 0.6,
          bay: 3.2,
          facades: { all: 'w*', front: 'w* d w*' },
          roof: { form: 'gable', pitch: 46, eaves: 0.6, ridge: 'x', dormers: 3, chimneys: 2 },
        },
        {
          id: 'tower',
          at: [-11.6, -0.6],
          size: [5.6, 5.6],
          storeys: 4,
          storeyHeight: 3.4,
          plinth: 0.6,
          bay: 5.6,
          facades: { all: 's / w / w / v' },
          clock: 2.2,
          roof: {
            form: 'pyramid',
            pitch: 58,
            eaves: 0.45,
            lantern: { height: 1.8, radius: 0.9, sides: 8, roof: 'cone', glazed: true },
          },
        },
      ],
      ground: { apron: 2.2, steps: true, kerb: true },
      night: { litFraction: 0.5, lanterns: true },
    },
    {
      id: 'market-hall',
      name: { en: 'Market hall', de: 'Markthalle' },
      style: 'old-town-brick',
      masses: [
        {
          id: 'hall',
          size: [34, 14],
          storeys: 1,
          storeyHeight: 6.4,
          plinth: 0.5,
          bay: 3.8,
          facades: { all: 'a*', front: 'a* D a*', back: 'a*' },
          arcade: { side: 'front', depth: 2.6, columns: 9, arch: false, height: 4.4 },
          roof: { form: 'barrel', eaves: 0.7, ridge: 'x' },
        },
      ],
      ground: { apron: 2.4, steps: false, kerb: true },
      night: { litFraction: 0.75, lanterns: true },
      sign: { band: 1.0, width: 0.36 },
    },
    {
      id: 'rotunda',
      name: { en: 'Rotunda', de: 'Rotunde' },
      style: 'resort-render',
      masses: [
        {
          id: 'drum',
          size: [16, 16],
          round: 8,
          storeys: 1,
          storeyHeight: 5.4,
          plinth: 0.7,
          bay: 6.5,
          facades: { all: 'a', front: 'D' },
          roof: {
            form: 'cone',
            pitch: 44,
            eaves: 1.1,
            lantern: { height: 2.4, radius: 1.4, sides: 8, roof: 'cone', glazed: true },
          },
        },
      ],
      ground: { apron: 2.8, steps: true, kerb: true },
      night: { litFraction: 0.8, lanterns: true },
    },
    {
      id: 'terrace-house',
      name: { en: 'Terrace house', de: 'Reihenhaus' },
      style: 'old-town-brick',
      masses: [
        {
          id: 'house',
          size: [9, 10],
          storeys: 3,
          storeyHeight: 3.4,
          plinth: 0.45,
          bay: 3.0,
          facades: { all: 'w*', front: 'w d w / w w w' },
          roof: { form: 'mansard', eaves: 0.35, ridge: 'x', dormers: 2, chimneys: 2 },
        },
      ],
      ground: { apron: 1.6, steps: true, kerb: false },
      night: { litFraction: 0.45, lanterns: true },
    },
    {
      id: 'guest-services',
      name: { en: 'Guest services', de: 'Gästeservice' },
      style: 'lagoon-concrete',
      masses: [
        {
          id: 'pavilion',
          size: [14, 9],
          storeys: 1,
          storeyHeight: 4.4,
          plinth: 0.35,
          bay: 3.2,
          facades: { all: 'w*', front: 'g* D g*', back: 's*' },
          roof: { form: 'flat', parapet: 0.75, eaves: 0.5 },
        },
      ],
      ground: { apron: 2.2, steps: false, kerb: true },
      night: { litFraction: 0.9, lanterns: false },
      sign: { band: 1.1, width: 0.5 },
    },
  ],

  /**
   * The palette entries. `size` is the built extent without the apron, because that is what the
   * build tool's ghost has to match; `selftest.mjs` measures the geometry against it.
   */
  buildings: [
    {
      id: 'ticket-hall',
      name: { en: 'Ticket hall', de: 'Kassenhalle' },
      category: 'blueprint',
      size: [27.6, 14.9, 15.2],
      cost: 4200000,
      procedural: 'ticket-hall',
      theme: 'classic-brick',
    },
    {
      id: 'grand-pavilion',
      name: { en: 'Grand pavilion', de: 'Wandelhalle' },
      category: 'blueprint',
      size: [49.7, 21.5, 20.3],
      cost: 9600000,
      procedural: 'grand-pavilion',
      theme: 'garden',
    },
    {
      id: 'clock-tower',
      name: { en: 'Clock tower hall', de: 'Uhrturmhaus' },
      category: 'blueprint',
      size: [25.5, 22.7, 11.6],
      cost: 5400000,
      procedural: 'clock-tower',
      theme: 'classic-brick',
    },
    {
      id: 'market-hall',
      name: { en: 'Market hall', de: 'Markthalle' },
      category: 'blueprint',
      size: [35.4, 11.9, 19.2],
      cost: 6100000,
      procedural: 'market-hall',
      theme: 'classic-brick',
    },
    {
      id: 'rotunda',
      name: { en: 'Rotunda', de: 'Rotunde' },
      category: 'blueprint',
      size: [18.2, 19.1, 18.2],
      cost: 3300000,
      procedural: 'rotunda',
      theme: 'garden',
    },
    {
      id: 'terrace-house',
      name: { en: 'Terrace house', de: 'Reihenhaus' },
      category: 'blueprint',
      size: [9.7, 17.6, 11.8],
      cost: 2100000,
      procedural: 'terrace-house',
      theme: 'classic-brick',
    },
    {
      id: 'guest-services',
      name: { en: 'Guest services', de: 'Gästeservice' },
      category: 'blueprint',
      size: [15.0, 5.6, 10.0],
      cost: 2600000,
      procedural: 'guest-services',
      theme: 'neon',
    },
    {
      id: 'canopy-glass',
      name: { en: 'Glass canopy', de: 'Glasvordach' },
      category: 'trim',
      size: [6, 3.2, 2.4],
      cost: 900000,
      procedural: 'canopy',
      material: 'steel-galvanised',
    },
    {
      id: 'wall-arch',
      name: { en: 'Arched wall', de: 'Bogenwand' },
      category: 'wall',
      size: [4, 5, 0.45],
      cost: 320000,
      procedural: 'wall-arch',
      material: 'plaster-cream',
      theme: 'garden',
    },
    {
      id: 'wall-oculus',
      name: { en: 'Oculus wall', de: 'Ochsenaugenwand' },
      category: 'window',
      size: [4, 4, 0.45],
      cost: 340000,
      procedural: 'wall-oculus',
      material: 'plaster-cream',
      theme: 'garden',
    },
  ],

  icons: {
    'ticket-hall': 'lucide:ticket',
    'grand-pavilion': 'lucide:landmark',
    'clock-tower': 'lucide:clock',
    'market-hall': 'lucide:store',
    rotunda: 'lucide:circle-dot',
    'terrace-house': 'lucide:house',
    'guest-services': 'lucide:concierge-bell',
    'canopy-glass': 'lucide:panel-top',
    'wall-arch': 'lucide:brick-wall',
    'wall-oculus': 'lucide:circle',
  },
};
