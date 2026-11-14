import type { ParkyOutfit } from '@/lib/assistant/parky/look';
import type { ParkBreakScene } from '@/lib/utils/park-break';
import {
  BUBBLE,
  CHEEKS,
  MOON,
  SHUT_EYES,
  SMILE,
  STAR,
  ZED,
  blue,
  blush,
  gold,
  green,
  ink,
} from './drawing';
import { FLAKE, ParkyLookHat, ParkyLookWear, ParkySnowman, ice } from './looks';
import { ParkyWheel } from './wheel';
import { HolidaySceneSvg } from './holiday-parky';

/** What Parky wears in each picture: the bobble hat in winter, the scarf until spring. */
const OUTFIT: Record<ParkBreakScene, ParkyOutfit> = {
  winter: { hat: 'beanie', scarf: true, umbrella: false, sky: null },
  autumn: { hat: null, scarf: true, umbrella: false, sky: null },
  spring: { hat: null, scarf: false, umbrella: false, sky: null },
};

/**
 * Where Parky sits and how big: his 48-unit drawing at twice its size. Lower outside winter,
 * because the Ferris wheel on his head stands taller than the bobble hat.
 */
const PARKY_AT: Record<ParkBreakScene, string> = {
  winter: 'translate(162 15) scale(2)',
  autumn: 'translate(162 22) scale(2)',
  spring: 'translate(162 22) scale(2)',
};

/** The sky's gradient, top and bottom stop, light and dark theme. */
const SKY: Record<ParkBreakScene, readonly [string, string]> = {
  winter: [
    '[stop-color:oklch(0.84_0.06_240)] dark:[stop-color:oklch(0.24_0.06_265)]',
    '[stop-color:oklch(0.95_0.025_225)] dark:[stop-color:oklch(0.38_0.07_250)]',
  ],
  autumn: [
    '[stop-color:oklch(0.86_0.06_55)] dark:[stop-color:oklch(0.24_0.05_285)]',
    '[stop-color:oklch(0.95_0.04_85)] dark:[stop-color:oklch(0.38_0.07_40)]',
  ],
  spring: [
    '[stop-color:oklch(0.84_0.07_220)] dark:[stop-color:oklch(0.24_0.06_260)]',
    '[stop-color:oklch(0.96_0.03_150)] dark:[stop-color:oklch(0.36_0.06_200)]',
  ],
};

/** The far and the near hill: snow, a stubble field, a spring meadow. */
const HILLS: Record<ParkBreakScene, readonly [string, string]> = {
  winter: [
    'fill-[oklch(0.97_0.012_235)] dark:fill-[oklch(0.78_0.03_245)]',
    'fill-white dark:fill-[oklch(0.9_0.02_240)]',
  ],
  autumn: [
    'fill-[oklch(0.85_0.08_95)] dark:fill-[oklch(0.4_0.04_70)]',
    'fill-[oklch(0.78_0.1_85)] dark:fill-[oklch(0.34_0.04_65)]',
  ],
  spring: [
    'fill-[oklch(0.86_0.1_135)] dark:fill-[oklch(0.42_0.06_150)]',
    'fill-[oklch(0.8_0.13_140)] dark:fill-[oklch(0.36_0.06_150)]',
  ],
};

/** The leaves' colours in turn: orange, red, yellow. */
const LEAF_COLOURS = ['oklch(0.7 0.17 50)', 'oklch(0.6 0.19 30)', 'oklch(0.82 0.15 85)'];

/** The blossom's colours in turn, pink to white. */
const BLOSSOM_COLOURS = ['oklch(0.84 0.09 350)', 'oklch(0.94 0.035 350)', 'oklch(0.76 0.12 355)'];

/** The tulips' colours in turn: red, pink, yellow, orange. */
const TULIP_COLOURS = [
  'oklch(0.6 0.2 25)',
  'oklch(0.72 0.16 355)',
  'oklch(0.85 0.15 90)',
  'oklch(0.72 0.17 55)',
];

/** An almond leaf about eight units long round the origin, and its midrib. */
const LEAF = 'M0-4C2.6-2.6 2.6 2.6 0 4C-2.6 2.6-2.6-2.6 0-4Z';
const LEAF_RIB = 'M0-3.4V3.4';

/** A tulip's cup, its base at the origin. */
const TULIP = 'M-3 0Q-3.6-5-1.8-6.4L0-4.4L1.8-6.4Q3.6-5 3 0Z';

/** The sled's wood, its darker struts and edges, its red runners and its rope. */
const wood = 'oklch(0.68 0.12 62)';
const woodDark = 'oklch(0.5 0.1 50)';
const runnerRed = 'oklch(0.52 0.17 25)';
const rope = 'oklch(0.78 0.06 80)';
const bark = 'oklch(0.45 0.07 50)';

/** The Zs over his right shoulder, growing as they rise, in the picture's units. */
const ZEDS = [
  { x: 256, y: 48, scale: 1.1 },
  { x: 269, y: 34, scale: 1.4 },
  { x: 283, y: 18, scale: 1.7 },
];

/**
 * What drifts through the sky, clear of Parky's head and the Zs, with its size: snowflakes,
 * leaves or petals.
 */
const DRIFT = [
  [18, 20, 1.4],
  [44, 48, 1],
  [100, 12, 1.2],
  [196, 8, 1.2],
  [160, 14, 1],
  [12, 96, 1.2],
  [158, 46, 1],
  [112, 44, 1.3],
  [296, 66, 1.2],
  [286, 96, 1],
] as const;

/** Stars, mostly seen against the dark theme's night sky. */
const STARS = [
  [28, 10, 0.9],
  [74, 22, 0.7],
  [140, 24, 0.8],
  [236, 8, 0.7],
] as const;

/** The leaves heaped in front of Parky in autumn: where, turned how far, which colour. */
const PILE_LEAVES = [
  [154, 126, 30],
  [162, 118, -20],
  [172, 111, 60],
  [184, 107, -40],
  [196, 105, 10],
  [208, 104, -70],
  [220, 105, 35],
  [232, 107, -15],
  [244, 111, 50],
  [254, 117, -35],
  [260, 125, 20],
  [166, 126, 80],
  [180, 120, -50],
  [194, 114, 25],
  [210, 112, -10],
  [226, 114, 70],
  [240, 120, -60],
  [250, 126, 15],
  [200, 124, 40],
  [222, 124, -30],
  [186, 128, 10],
  [236, 128, 55],
] as const;

/** The tulips in front of Parky in spring, their cups' bases, all below his smile. */
const TULIPS = [
  [158, 120],
  [172, 113],
  [189, 108],
  [207, 106],
  [225, 108],
  [242, 113],
  [256, 120],
] as const;

/** The Ferris wheel asleep behind the hills: its hub, its rim and its eight cabins. */
const WHEEL = { x: 66, y: 76, r: 36 };
const WHEEL_CABINS = Array.from({ length: 8 }, (_, i) => ({
  x: +(WHEEL.x + WHEEL.r * Math.sin((i * Math.PI) / 4)).toFixed(1),
  y: +(WHEEL.y - WHEEL.r * Math.cos((i * Math.PI) / 4)).toFixed(1),
}));

/**
 * A wooden sled from the side, in the picture's units: the seat Parky sits on, three struts, the
 * red runners curling up at the front, and the rope lying in the snow. Drawn after Parky, so the
 * seat covers the bottom of his bubble and he sits in it.
 */
function Sled() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M164 114v15M204 114v15M244 114v15" stroke={woodDark} strokeWidth="3" />
      <path
        d="M144 129H254C270 129 277 115 269 105C265 100 258 103 261 107"
        fill="none"
        stroke={runnerRed}
        strokeWidth="3"
      />
      <path d="M262 107C274 120 284 128 298 126" fill="none" stroke={rope} strokeWidth="1.2" />
      <rect
        x="148"
        y="103"
        width="112"
        height="11"
        rx="3"
        fill={wood}
        stroke={woodDark}
        strokeWidth=".8"
      />
      <path d="M152 105H256" stroke="white" strokeOpacity=".3" strokeWidth=".9" />
      <path d="M178 109h14M216 111h10" stroke={woodDark} strokeOpacity=".5" strokeWidth=".7" />
      {/* A little snow on the seat's front end. */}
      <path d="M236 103.4q6-3 12-1.4 6 1.4 10 1.4Z" fill="white" />
    </g>
  );
}

/** One leaf at `x, y`, turned by `turn` degrees, in the `i`-th colour. */
function Leaf({
  x,
  y,
  turn,
  i,
  scale = 1.4,
}: {
  x: number;
  y: number;
  turn: number;
  i: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${scale})`}>
      <path d={LEAF} fill={LEAF_COLOURS[i % LEAF_COLOURS.length]} />
      <path d={LEAF_RIB} stroke="oklch(0.45 0.1 40)" strokeOpacity=".5" strokeWidth=".4" />
    </g>
  );
}

/**
 * The heap of leaves Parky sleeps in, drawn after him like the sled: a rusty mound, leaves all over
 * it.
 */
function LeafPile() {
  return (
    <g>
      <path
        d="M148 131C150 116 162 106 178 104C192 101 204 104 214 102C230 100 248 104 258 112C264 118 266 125 266 131Z"
        fill="oklch(0.6 0.14 45)"
      />
      {PILE_LEAVES.map(([x, y, turn], i) => (
        <Leaf key={`${x} ${y}`} x={x} y={y} turn={turn} i={i} />
      ))}
    </g>
  );
}

/** The bed of tulips Parky dozes in, drawn after him: a green mound, the tulips standing in it. */
function TulipBed() {
  return (
    <g strokeLinecap="round">
      <path
        d="M148 131C152 118 166 110 184 108C200 106 220 106 236 108C252 110 262 120 266 131Z"
        fill="oklch(0.62 0.14 145)"
      />
      {TULIPS.map(([x, y], i) => (
        <g key={x}>
          <path d={`M${x} ${y}V${y + 22}`} stroke="oklch(0.52 0.13 145)" strokeWidth="1.6" />
          <path
            d={`M${x} ${y + 18}q${i % 2 ? 6 : -6}-4 ${i % 2 ? 5 : -5}-11`}
            fill="none"
            stroke="oklch(0.6 0.15 140)"
            strokeWidth="2.2"
          />
          <path
            d={TULIP}
            transform={`translate(${x} ${y}) scale(1.6)`}
            fill={TULIP_COLOURS[i % TULIP_COLOURS.length]}
          />
        </g>
      ))}
    </g>
  );
}

/** A small tree beside Parky: bare branches under a crown of `colours`, autumn's or spring's. */
function Tree({ colours }: { colours: readonly string[] }) {
  return (
    <g>
      <path
        d="M128 131V88M128 106l-10-12M128 99l11-10"
        stroke={bark}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {[
        [116, 82, 13],
        [140, 80, 13],
        [128, 67, 15],
        [128, 86, 11],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={colours[i % colours.length]} opacity=".92" />
      ))}
    </g>
  );
}

/** What drifts through the sky in each picture. */
function Drift({ scene }: { scene: ParkBreakScene }) {
  if (scene === 'winter') {
    return (
      <g
        fill="none"
        strokeWidth=".8"
        strokeLinecap="round"
        className="stroke-[oklch(0.7_0.08_235)] dark:stroke-white"
      >
        {DRIFT.map(([x, y, s]) => (
          <path key={`${x} ${y}`} d={FLAKE} transform={`translate(${x} ${y}) scale(${s})`} />
        ))}
      </g>
    );
  }
  if (scene === 'autumn') {
    return (
      <g>
        {DRIFT.map(([x, y, s], i) => (
          <Leaf key={`${x} ${y}`} x={x} y={y} turn={(i * 47) % 180} i={i} scale={s} />
        ))}
      </g>
    );
  }
  return (
    <g fill={BLOSSOM_COLOURS[2]}>
      {DRIFT.map(([x, y, s], i) => (
        <ellipse
          key={`${x} ${y}`}
          rx={1.8 * s}
          ry={1.1 * s}
          transform={`translate(${x} ${y}) rotate(${(i * 53) % 180})`}
        />
      ))}
    </g>
  );
}

/**
 * Parky asleep through a park's break, the picture on its panel, in the season the break falls in:
 * in winter in his sled, in bobble hat and scarf, the snowman beside it; in autumn in a heap of
 * leaves under a tree turning red; in spring among the tulips under a tree in blossom. Behind him
 * the park's Ferris wheel and two hills, a moon by night and, outside winter, a sun by day. Drawn
 * in a 320 × 160 space from the same pieces as the live Parky (`drawing.ts`, `looks.tsx`,
 * `ParkyWheel`) and entirely still: it sits in a glass panel, where no endless animation may run.
 * Decorative; the panel's text says what it shows.
 *
 * Fills its box (`slice`) from the right, so a narrow box loses the wheel on the left first; the
 * caller sets the size.
 */
export function ParkyBreakScene({
  scene,
  className,
}: {
  scene: ParkBreakScene;
  className?: string;
}) {
  const winter = scene === 'winter';
  return (
    <HolidaySceneSvg className={className}>
      <defs>
        <linearGradient id="parky-break-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={SKY[scene][0]} />
          <stop offset="1" className={SKY[scene][1]} />
        </linearGradient>
        <linearGradient id="parky-break-ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={blue} />
          <stop offset="1" stopColor={green} />
        </linearGradient>
      </defs>

      <rect width="320" height="160" fill="url(#parky-break-sky)" />

      {/* Night in winter; outside it a sun by day, and the moon only in the dark theme. */}
      <g className={winter ? undefined : 'hidden dark:inline'}>
        <g fill={gold}>
          {STARS.map(([x, y, s]) => (
            <path
              key={`${x} ${y}`}
              d={STAR}
              transform={`translate(${x} ${y}) scale(${s}) translate(-17 -3)`}
            />
          ))}
        </g>
        <path d={MOON} transform="translate(116 14) scale(2.6)" fill="oklch(0.92 0.1 95)" />
      </g>
      {!winter && (
        <g className="dark:hidden" fill="oklch(0.9 0.13 85)">
          <circle cx="128" cy="26" r="15" opacity=".35" />
          <circle cx="128" cy="26" r="9.5" />
        </g>
      )}

      <g
        fill="none"
        strokeLinecap="round"
        className="stroke-[oklch(0.72_0.05_245)] dark:stroke-[oklch(0.56_0.06_255)]"
      >
        <path
          d={`M${WHEEL.x} ${WHEEL.y}L${WHEEL.x - 22} 130M${WHEEL.x} ${WHEEL.y}L${WHEEL.x + 22} 130`}
          strokeWidth="2.2"
        />
        <circle cx={WHEEL.x} cy={WHEEL.y} r={WHEEL.r} strokeWidth="1.8" />
        <path
          d={WHEEL_CABINS.slice(0, 4)
            .map(({ x, y }) => `M${x} ${y}L${2 * WHEEL.x - x} ${2 * WHEEL.y - y}`)
            .join('')}
          strokeWidth=".9"
        />
      </g>
      {WHEEL_CABINS.map(({ x, y }) => (
        <g key={`${x} ${y}`}>
          <rect
            x={x - 3.6}
            y={y - 1}
            width="7.2"
            height="6.4"
            rx="1.6"
            className="fill-[oklch(0.78_0.05_245)] dark:fill-[oklch(0.5_0.06_255)]"
          />
          {/* Snow on every cabin's roof. */}
          {winter && <path d={`M${x - 4.2} ${y - 0.4}q4.2-3.4 8.4 0Z`} fill="white" />}
        </g>
      ))}

      {/* Two hills, the far one hiding the wheel's foot; only snow gets an icy edge. */}
      <path
        d="M0 116C60 102 120 108 170 114S270 102 320 110V160H0Z"
        className={HILLS[scene][0]}
        stroke={winter ? ice : 'none'}
        strokeOpacity=".5"
        strokeWidth=".8"
      />
      <path
        d="M0 140C60 128 110 128 160 130S260 128 320 131V160H0Z"
        className={HILLS[scene][1]}
        stroke={winter ? ice : 'none'}
        strokeOpacity=".6"
        strokeWidth=".8"
      />

      <Drift scene={scene} />

      {/* Shadows on the ground under the companion and under Parky's seat. */}
      <g fill={winter ? ice : 'black'} opacity={winter ? 0.3 : 0.12}>
        <ellipse cx="128" cy="130.5" rx="14" ry="2.4" />
        <ellipse cx="206" cy="130" rx="62" ry="3.2" />
      </g>

      {winter ? (
        <g transform="translate(146 4) scale(2.6)">
          <ParkySnowman still />
        </g>
      ) : (
        <Tree colours={scene === 'autumn' ? LEAF_COLOURS : BLOSSOM_COLOURS} />
      )}

      <g transform={PARKY_AT[scene]}>
        {winter ? <ParkyLookHat hat="beanie" still /> : <ParkyWheel />}
        <path d={BUBBLE} fill="url(#parky-break-ground)" />
        <ParkyLookWear outfit={OUTFIT[scene]} ground="parky-break-ground" />
        <path d={SHUT_EYES} fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
        {CHEEKS.map((x) => (
          <ellipse key={x} cx={x} cy="31" rx="2.4" ry="1.4" fill={blush} opacity=".7" />
        ))}
        <path d={SMILE} fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
      </g>
      {scene === 'winter' && <Sled />}
      {scene === 'autumn' && <LeafPile />}
      {scene === 'spring' && <TulipBed />}

      <g
        fill="none"
        stroke={blue}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:stroke-[oklch(0.82_0.09_235)]"
      >
        {ZEDS.map(({ x, y, scale }) => (
          <path
            key={x}
            d={ZED}
            transform={`translate(${x} ${y}) scale(${scale}) translate(-8.2 -8.4)`}
          />
        ))}
      </g>
    </HolidaySceneSvg>
  );
}
