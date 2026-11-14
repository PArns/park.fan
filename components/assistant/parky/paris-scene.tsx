'use client';

import { useId } from 'react';
import type { TripRegionSceneProps } from '@/lib/trip-regions/registry';
import { MOON, STAR, gold } from './drawing';
import {
  HolidayGround,
  HolidayMitten,
  HolidayParky,
  HolidaySceneSvg,
  motionOnce,
} from './holiday-parky';

/**
 * Parky on holiday in Paris, the planner band's picture of the region: the Eiffel Tower in the
 * distance over the zinc roofs and the trees, the Seine with a tour boat below the quay, a street
 * lamp, and Parky on a café terrace under a striped awning, a silk scarf round his neck. By day in
 * the light theme he holds his café crème and smiles across at the tower; in the evening in the dark one the
 * cup is on the table, the windows and the lamp are lit, and the tower, golden, sparkles while he
 * looks up at it in wonder. Built from the live Parky's pieces through `HolidayParky`, in the
 * 320 × 160 frame of the Orlando scene. Decoration: `aria-hidden`; the steam rises and the tower
 * sparkles once (`MOTION` below), and under reduced motion the tower stands lit with a few glints.
 */

/** The moves, each once: steam off the cup by day, the tower's sparkle in the evening. */
const MOTION = motionOnce(`
.parky-paris-steam { stroke-dasharray: 1; animation: parky-paris-steam 2s ease-out both; }
.parky-paris-glint { transform-box: fill-box; transform-origin: center;
  animation: parky-paris-glint 1.4s ease-in-out both; }
.parky-paris-glint--stays { animation-name: parky-paris-glint-stays; }
@keyframes parky-paris-steam { from { stroke-dashoffset: 1; opacity: 0; } }
@keyframes parky-paris-glint { from { opacity: 0; transform: scale(.2); }
  35% { opacity: 1; transform: scale(1.25); } to { opacity: 0; transform: scale(.3); } }
@keyframes parky-paris-glint-stays { from { opacity: 0; transform: scale(.2); }
  35% { opacity: 1; transform: scale(1.25); } }
`);

/** The tower's outline, ground to antenna, with its arch and the window under the second floor. */
const TOWER =
  'M147.5 98C150.5 92 152.5 87.5 154.4 84.2H152.8V82.4H155.2C156.4 77 157.6 72.5 158.6 68.6H157.9V67.2H159C160.3 52 161.4 38 162 26.2H161.5V24.6H162.4L162.8 21.6H163.6L163.7 13 164 11.5 164.3 13 164.4 21.6H165.2L165.6 24.6H166.5V26.2H166C166.6 38 167.7 52 169 67.2H170.1V68.6H169.4C170.4 72.5 171.6 77 172.8 82.4H175.2V84.2H173.6C175.5 87.5 177.5 92 180.5 98ZM154.6 98C156 91.5 160 88.6 164 88.6S172 91.5 173.4 98ZM158.4 82.4C159.6 77.6 161.2 75 164 75S168.4 77.6 169.6 82.4Z';
/** Its floors, picked out across it. */
const TOWER_FLOORS = 'M152.8 83.3H175.2M157.9 67.9H170.1M161.5 25.4H166.5';

/**
 * Where the tower sparkles: glints up its legs, its floors and its spire. Most flash and go out;
 * the ones that `stay` are what is left lit, and all that shows without motion.
 */
const GLINTS = [
  { x: 150, y: 94, stay: false },
  { x: 178, y: 94, stay: true },
  { x: 155, y: 86, stay: true },
  { x: 173, y: 87, stay: false },
  { x: 157, y: 77, stay: false },
  { x: 171, y: 77, stay: true },
  { x: 159.6, y: 66, stay: false },
  { x: 168.4, y: 64, stay: false },
  { x: 161, y: 54, stay: true },
  { x: 167, y: 50, stay: false },
  { x: 162.2, y: 40, stay: false },
  { x: 165.6, y: 34, stay: true },
  { x: 164, y: 24, stay: false },
  { x: 164, y: 15, stay: true },
] as const;

/** The trees of the park at the tower's foot. */
const TREES = [
  [136, 94, 6],
  [146, 92, 6.5],
  [156, 96, 5.5],
  [172, 96, 5.5],
  [182, 92, 6.5],
  [192, 94, 6],
] as const;

/** The roofs across the river: three buildings on the left, one behind Parky, mansards and chimneys. */
const ROOFS =
  'M-2 86 2 76H58L62 86ZM60 86 63 78.4H104L107 86ZM104 86 108 74.4H128L132 86ZM188 86 191 77H230L233 86Z';
const CHIMNEYS =
  'M10 76v-4h4v4ZM40 76v-5h5v5ZM72 78.4v-4h4v4ZM96 78.4v-3.6h3.6v3.6ZM116 74.4v-4h3.6v4ZM204 77v-4h4v4Z';
/** The dormer windows in the roofs, and the windows of the façades below. */
const DORMERS = [8, 20, 32, 44, 68, 80, 92, 114, 122, 196, 208, 220] as const;
const WINDOW_ROWS = [88.6, 93.6] as const;
const WINDOW_COLUMNS = [
  4, 10, 16, 22, 28, 34, 40, 46, 52, 66, 72, 78, 84, 90, 96, 110, 116, 122, 192, 198, 204, 210, 216,
  222, 228,
];
/** The windows that are lit in the evening; the iron balconies run under the upper row. */
const LIT_WINDOWS = new Set([
  '10 88.6',
  '28 93.6',
  '46 88.6',
  '72 93.6',
  '90 88.6',
  '116 93.6',
  '204 88.6',
  '222 93.6',
  '16 93.6',
  '84 88.6',
]);

/** The café cup on its saucer, round its own origin, the saucer's middle. */
function CafeCup() {
  return (
    <g>
      <ellipse
        cx="0"
        cy="0"
        rx="3.8"
        ry=".9"
        fill="white"
        stroke="oklch(0.78 0.02 250)"
        strokeWidth=".3"
      />
      <path
        d="M-2.8-5.4H2.8L2.3-1.4Q2-.4 1-.4H-1Q-2-.4-2.3-1.4Z"
        fill="white"
        stroke="oklch(0.78 0.02 250)"
        strokeWidth=".3"
      />
      <path d="M2.6-4.4Q4.4-4.4 4.2-3T2.2-1.8" fill="none" stroke="white" strokeWidth=".8" />
      <ellipse cx="0" cy="-5.4" rx="2.8" ry=".55" fill="oklch(0.62 0.08 60)" />
    </g>
  );
}

/** A silk scarf knotted at his side, coral with white dots, its two ends hanging loose. */
function Scarf() {
  return (
    <g>
      <path d="M10.2 36.4Q24 43 37.8 36.4L37 39.4Q24 45.4 11 39.4Z" fill="oklch(0.68 0.16 28)" />
      <path d="M33 41.2 35.2 48.8 38.4 47.2Z" fill="oklch(0.64 0.16 28)" />
      <path d="M34.6 40.8 40.8 45.6 41.6 42.6Z" fill="oklch(0.7 0.15 30)" />
      <ellipse cx="34.2" cy="41" rx="1.9" ry="1.5" fill="oklch(0.62 0.16 26)" />
      <g fill="oklch(0.97 0.02 85)">
        <circle cx="14.4" cy="39" r=".5" />
        <circle cx="19" cy="40.6" r=".5" />
        <circle cx="24" cy="41.2" r=".5" />
        <circle cx="29" cy="40.6" r=".5" />
        <circle cx="36.4" cy="46" r=".45" />
        <circle cx="39.4" cy="44.6" r=".45" />
      </g>
    </g>
  );
}

/** By day his cup in his hand, steam rising off it; the mitten holds the saucer. */
function CupInHand({ ground }: { ground: string }) {
  return (
    <g>
      <g transform="translate(43.4 37.4)">
        <CafeCup />
      </g>
      <path
        className="parky-paris-steam"
        d="M42.6 30.6Q41.4 28.6 42.6 26.8T42.4 22.6M44.6 30.4Q45.8 28.4 44.6 26.6T44.8 23.4"
        pathLength={1}
        fill="none"
        stroke="white"
        strokeOpacity=".85"
        strokeWidth=".7"
        strokeLinecap="round"
      />
      <HolidayMitten ground={ground} x={42.6} y={39.2} />
    </g>
  );
}

/** The bistro table beside him: marble top, iron foot, a croissant, and in the evening his cup. */
function BistroTable() {
  return (
    <g>
      <path
        d="M186 112.6V128.6M180 130Q186 126.8 192 130"
        fill="none"
        strokeWidth="1.4"
        strokeLinecap="round"
        className="stroke-[oklch(0.3_0.02_250)] dark:stroke-[oklch(0.18_0.03_290)]"
      />
      <ellipse
        cx="186"
        cy="110.4"
        rx="13"
        ry="2.6"
        className="fill-[oklch(0.95_0.01_90)] dark:fill-[oklch(0.62_0.03_300)]"
      />
      <path
        d="M173 110.6Q186 114.6 199 110.6"
        fill="none"
        strokeWidth=".8"
        className="stroke-[oklch(0.6_0.08_70)] dark:stroke-[oklch(0.45_0.05_300)]"
      />
      <ellipse
        cx="193"
        cy="109.6"
        rx="4.6"
        ry="1"
        fill="white"
        className="dark:fill-[oklch(0.82_0.02_290)]"
      />
      <path
        d="M189.2 109.2Q193 104.4 196.8 109.2Q195 107.8 193 108Q191 107.8 189.2 109.2Z"
        fill="oklch(0.76 0.13 70)"
      />
      <path
        d="M191.4 107.4 191.8 106.4M193 107 193 105.6M194.6 107.4 194.2 106.4"
        stroke="oklch(0.58 0.11 60)"
        strokeWidth=".4"
      />
      <g className="hidden dark:inline" transform="translate(180.4 109.8) scale(.6)">
        <CafeCup />
      </g>
    </g>
  );
}

/** A bistro chair of the terraces: a bamboo frame, its back and seat woven in red and cream. */
function BistroChair({ weave }: { weave: string }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M158.4 116 157 129.4M173.6 116 175 129.4M162 116.4 161.6 128.4M170 116.4 170.4 128.4"
        strokeWidth="1"
        className="stroke-[oklch(0.58_0.09_65)] dark:stroke-[oklch(0.22_0.04_300)]"
      />
      <path
        d="M159.4 112.4Q159.2 103.6 166 102.8Q172.8 103.6 172.6 112.4Z"
        fill={`url(#${weave})`}
      />
      <path d="M157 114.4H175L174 116.6H158Z" fill={`url(#${weave})`} />
      <path
        d="M158.2 114.4Q157.4 101.4 166 100.6Q174.6 101.4 173.8 114.4"
        fill="none"
        strokeWidth="1.4"
        className="stroke-[oklch(0.58_0.09_65)] dark:stroke-[oklch(0.22_0.04_300)]"
      />
    </g>
  );
}

/** The street lamp on the quay, its lantern lit in the evening. */
function StreetLamp({ glow }: { glow: string }) {
  return (
    <g>
      <circle className="hidden dark:inline" cx="128" cy="66" r="14" fill={`url(#${glow})`} />
      <g className="fill-[oklch(0.32_0.05_165)] dark:fill-[oklch(0.18_0.03_290)]">
        <path d="M127 128.6V72h2v56.6Z" />
        <path d="M124.4 129.6Q128 126.4 131.6 129.6Z" />
        <path d="M125.6 106h4.8l-.6 1.6h-3.6Z" />
        <path d="M124.6 71.6h6.8L130 70h-4Z" />
        <path d="M125 61.2h6l-3-2.6Z" />
      </g>
      <path
        d="M125.6 61.4H130.4L131.2 69.8H124.8Z"
        className="fill-[oklch(0.92_0.03_220)]/70 dark:fill-[oklch(0.9_0.12_85)]"
      />
      <path
        d="M128 61.4V69.8"
        strokeWidth=".4"
        className="stroke-[oklch(0.32_0.05_165)] dark:stroke-[oklch(0.7_0.12_70)]"
      />
    </g>
  );
}

/** A tour boat on the river: a long low hull and its glass cabin, lit in the evening. */
function TourBoat() {
  return (
    <g>
      <path
        d="M54 111.6H112L108.6 114.6H57Z"
        className="fill-[oklch(0.96_0.01_90)] dark:fill-[oklch(0.3_0.04_290)]"
      />
      <path
        d="M60 111.6V108.6Q60 107.6 61 107.6H104Q105 107.6 105.4 108.6L106.4 111.6Z"
        className="fill-[oklch(0.55_0.06_230)] dark:fill-[oklch(0.82_0.12_80)]"
      />
      <path
        d="M66 107.8v3.6M72 107.8v3.6M78 107.8v3.6M84 107.8v3.6M90 107.8v3.6M96 107.8v3.6M102 107.8v3.6"
        strokeWidth=".5"
        className="stroke-[oklch(0.96_0.01_90)] dark:stroke-[oklch(0.3_0.04_290)]"
      />
    </g>
  );
}

/** The café's awning across the top right: cream and burgundy stripes and a scalloped edge. */
function Awning() {
  const stripes = Array.from({ length: 12 }, (_, i) => 228 + i * 8);
  return (
    <g>
      {stripes.map((x, i) => (
        <path
          key={x}
          d={`M${x} -2h8v15a4 4 0 0 1-8 0Z`}
          className={
            i % 2
              ? 'fill-[oklch(0.96_0.03_85)] dark:fill-[oklch(0.5_0.04_60)]'
              : 'fill-[oklch(0.5_0.15_20)] dark:fill-[oklch(0.3_0.08_15)]'
          }
        />
      ))}
      <path d="M228 2.6H324" stroke="black" strokeOpacity=".12" strokeWidth="1.4" />
    </g>
  );
}

/**
 * Parky on the café terrace: by day with his cup, an eye on the tower; in the evening looking up
 * at its sparkle.
 */
function Parky({ ground, evening }: { ground: string; evening: boolean }) {
  return (
    <HolidayParky
      ground={ground}
      eyes={evening ? { look: { x: -1.8, y: -2.4 } } : { look: { x: -2.2, y: -0.8 } }}
      mouth={evening ? 'wonder' : 'smile'}
      wear={<Scarf />}
      hands={evening ? undefined : <CupInHand ground={ground} />}
    />
  );
}

/** The Paris scene, filling its box from the right edge (`xMaxYMid slice`). */
export function ParkyParisScene({ className }: TripRegionSceneProps) {
  const id = useId();
  const sky = `${id}sky`;
  const river = `${id}river`;
  const lattice = `${id}lattice`;
  const weave = `${id}weave`;
  const glow = `${id}glow`;
  const ground = `${id}ground`;
  return (
    <HolidaySceneSvg className={className} motion={MOTION}>
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop
            offset="0"
            className="[stop-color:oklch(0.76_0.08_240)] dark:[stop-color:oklch(0.2_0.05_270)]"
          />
          <stop
            offset=".65"
            className="[stop-color:oklch(0.88_0.04_232)] dark:[stop-color:oklch(0.3_0.07_285)]"
          />
          <stop
            offset="1"
            className="[stop-color:oklch(0.94_0.045_70)] dark:[stop-color:oklch(0.44_0.09_320)]"
          />
        </linearGradient>
        <linearGradient id={river} x1="0" y1="102" x2="0" y2="118" gradientUnits="userSpaceOnUse">
          <stop
            offset="0"
            className="[stop-color:oklch(0.7_0.07_212)] dark:[stop-color:oklch(0.3_0.06_282)]"
          />
          <stop
            offset="1"
            className="[stop-color:oklch(0.62_0.08_222)] dark:[stop-color:oklch(0.22_0.05_285)]"
          />
        </linearGradient>
        <pattern id={lattice} width="2.4" height="2.4" patternUnits="userSpaceOnUse">
          <path
            d="M0 0 2.4 2.4M2.4 0 0 2.4"
            strokeWidth=".35"
            className="stroke-[oklch(0.42_0.04_45)] dark:stroke-[oklch(0.62_0.13_60)]"
          />
        </pattern>
        <pattern id={weave} width="2" height="2" patternUnits="userSpaceOnUse">
          <rect
            width="2"
            height="2"
            className="fill-[oklch(0.93_0.04_85)] dark:fill-[oklch(0.42_0.04_60)]"
          />
          <path
            d="M0 0h1v1H0ZM1 1h1v1H1Z"
            className="fill-[oklch(0.56_0.16_25)] dark:fill-[oklch(0.3_0.08_20)]"
          />
        </pattern>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="oklch(0.88 0.14 80)" stopOpacity=".7" />
          <stop offset=".5" stopColor="oklch(0.82 0.14 70)" stopOpacity=".22" />
          <stop offset="1" stopColor="oklch(0.82 0.14 70)" stopOpacity="0" />
        </radialGradient>
        <HolidayGround id={ground} />
      </defs>

      <rect width="320" height="160" fill={`url(#${sky})`} />

      {/* Day: soft clouds. Evening: a crescent moon, a few stars. */}
      <g className="dark:hidden" fill="white" opacity=".85">
        <ellipse cx="66" cy="28" rx="15" ry="4.4" />
        <ellipse cx="74" cy="24.4" rx="8" ry="4.6" />
        <ellipse cx="59" cy="25.4" rx="6" ry="3.4" />
        <ellipse cx="206" cy="36" rx="10" ry="3" />
        <ellipse cx="211" cy="33.6" rx="5.6" ry="3.2" />
      </g>
      <g className="hidden dark:inline">
        <path d={MOON} transform="translate(110 10) scale(1.4)" fill="oklch(0.92 0.1 95)" />
        <g fill={gold} opacity=".8">
          <path d={STAR} transform="translate(60 14) scale(.6) translate(-17 -3)" />
          <path d={STAR} transform="translate(210 26) scale(.55) translate(-17 -3)" />
          <path d={STAR} transform="translate(26 34) scale(.5) translate(-17 -3)" />
        </g>
      </g>

      {/* The tower, golden in the evening with a glow round it, and its sparkle. */}
      <ellipse
        className="hidden dark:inline"
        cx="164"
        cy="58"
        rx="30"
        ry="52"
        fill={`url(#${glow})`}
      />
      <path
        d={TOWER}
        fillRule="evenodd"
        className="fill-[oklch(0.6_0.05_45)] dark:fill-[oklch(0.76_0.13_72)]"
      />
      <path d={TOWER} fillRule="evenodd" fill={`url(#${lattice})`} />
      <path
        d={TOWER_FLOORS}
        strokeWidth=".9"
        className="stroke-[oklch(0.48_0.05_45)] dark:stroke-[oklch(0.9_0.12_85)]"
      />
      <g className="hidden dark:inline" fill="white">
        {GLINTS.map((glint, i) => (
          <g
            key={`${glint.x} ${glint.y}`}
            transform={`translate(${glint.x} ${glint.y}) scale(.75)`}
          >
            {/* The animated group carries no transform of its own: the animation's would replace it. */}
            <g
              className={
                glint.stay ? 'parky-paris-glint parky-paris-glint--stays' : 'parky-paris-glint'
              }
              opacity={glint.stay ? 1 : 0}
              style={{ animationDelay: `${0.4 + ((i * 7) % GLINTS.length) * 0.16}s` }}
            >
              <path d={STAR} transform="translate(-17 -3)" />
            </g>
          </g>
        ))}
      </g>

      {/* The park at its foot, then the roofs across the river. */}
      <g className="fill-[oklch(0.62_0.1_145)] dark:fill-[oklch(0.25_0.05_292)]">
        {TREES.map(([x, y, r]) => (
          <circle key={x} cx={x} cy={y} r={r} />
        ))}
      </g>
      <path d={CHIMNEYS} className="fill-[oklch(0.68_0.1_45)] dark:fill-[oklch(0.24_0.04_290)]" />
      <path d={ROOFS} className="fill-[oklch(0.64_0.025_250)] dark:fill-[oklch(0.27_0.04_285)]" />
      <g className="fill-[oklch(0.92_0.02_80)] dark:fill-[oklch(0.36_0.04_290)]">
        {DORMERS.map((x) => (
          <path key={x} d={`M${x} 84.6v-3.4l2-1.6 2 1.6v3.4Z`} />
        ))}
      </g>
      <path
        d="M-2 86H132V100H-2ZM188 86H262V100H188Z"
        className="fill-[oklch(0.9_0.035_80)] dark:fill-[oklch(0.33_0.04_300)]"
      />
      <g>
        {WINDOW_ROWS.flatMap((y) =>
          WINDOW_COLUMNS.map((x) => (
            <rect
              key={`${x} ${y}`}
              x={x}
              y={y}
              width="2.4"
              height="3.2"
              className={
                LIT_WINDOWS.has(`${x} ${y}`)
                  ? 'fill-[oklch(0.5_0.03_250)] dark:fill-[oklch(0.86_0.12_82)]'
                  : 'fill-[oklch(0.5_0.03_250)] dark:fill-[oklch(0.24_0.04_290)]'
              }
            />
          ))
        )}
      </g>

      <path
        d="M-2 92.4H132M188 92.4H262M-2 86.6H132M188 86.6H262"
        strokeWidth=".7"
        className="stroke-[oklch(0.36_0.03_250)] dark:stroke-[oklch(0.2_0.03_290)]"
      />

      {/* The quay across the river, the Seine with its boat, the near parapet. */}
      <path
        d="M-2 100H322V103H-2Z"
        className="fill-[oklch(0.84_0.035_80)] dark:fill-[oklch(0.3_0.04_300)]"
      />
      <rect y="103" width="320" height="15" fill={`url(#${river})`} />
      <path
        d="M20 107h12M140 106h16M60 116h10M228 108h14M276 112h10"
        stroke="white"
        strokeOpacity=".6"
        strokeWidth=".8"
        strokeLinecap="round"
        className="dark:hidden"
      />
      <path
        d="M157 106h14M155 109h18M159 112h10M156 115h16M14 108h4M36 106h3M90 114h4"
        stroke="oklch(0.84 0.13 75)"
        strokeOpacity=".6"
        strokeWidth="1"
        strokeLinecap="round"
        className="hidden dark:inline"
      />
      <TourBoat />
      <path
        d="M-2 117H322V121H-2Z"
        className="fill-[oklch(0.86_0.03_75)] dark:fill-[oklch(0.36_0.04_305)]"
      />

      {/* The terrace. */}
      <path
        d="M-2 121H322V160H-2Z"
        className="fill-[oklch(0.9_0.025_75)] dark:fill-[oklch(0.31_0.04_305)]"
      />
      <path
        d="M-2 140C60 135 120 137 170 139S270 135 322 138V160H-2Z"
        className="fill-[oklch(0.86_0.03_70)] dark:fill-[oklch(0.26_0.04_300)]"
      />

      <StreetLamp glow={glow} />
      <BistroChair weave={weave} />
      <BistroTable />
      <Awning />

      <g fill="black" opacity=".12">
        <ellipse cx="254" cy="131" rx="38" ry="2.8" />
        <ellipse cx="180" cy="130.4" rx="20" ry="1.8" />
      </g>

      <g className="dark:hidden" transform="translate(206 38) scale(2)">
        <Parky ground={ground} evening={false} />
      </g>
      <g className="hidden dark:inline" transform="translate(206 38) scale(2)">
        <Parky ground={ground} evening />
      </g>
    </HolidaySceneSvg>
  );
}
