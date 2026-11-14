'use client';

import { useId } from 'react';
import type { TripRegionSceneProps } from '@/lib/navigation/trip-regions';
import { STAR, blue, gold } from './drawing';
import {
  HolidayGround,
  HolidayMitten,
  HolidayParky,
  HolidaySceneSvg,
  motionOnce,
  type HolidayEyes,
} from './holiday-parky';

/**
 * Parky on holiday in Japan, the planner band's picture of the region: Mount Fuji with its snow,
 * a bullet train running along a viaduct at its foot, a cherry tree in bloom over him and petals
 * in the air, and Parky with a sprig of blossom tucked behind his ear. By day in the light theme
 * he holds a skewer of hanami dango and smiles at you; in the evening in the dark one the moon
 * rests on the summit, paper lanterns glow along a string under the branches, the train's windows
 * are lit, and he holds a little lantern of his own and looks up. Built from the live Parky's
 * pieces through `HolidayParky`, in the 320 × 160 frame of the Orlando scene. The train is no
 * particular series and wears park.fan's blue. Decoration: `aria-hidden`; the train arrives, the
 * petals fall and the lanterns light once (`MOTION` below), not at all under reduced motion.
 */

/** The moves, each once: the train pulls in, petals drift down, the lanterns light one by one. */
const MOTION = motionOnce(`
.parky-japan-train { animation: parky-japan-arrive 2.4s cubic-bezier(.16,.84,.3,1) both; }
.parky-japan-petal { transform-box: fill-box; transform-origin: center;
  animation: parky-japan-fall 2.6s cubic-bezier(.3,.6,.4,1) both; }
.parky-japan-glow { animation: parky-japan-glow .9s ease-out both; }
@keyframes parky-japan-arrive { from { transform: translateX(-110px); } }
@keyframes parky-japan-fall { from { opacity: 0; transform: translate(-10px, -18px) rotate(-120deg); } 30% { opacity: 1; } }
@keyframes parky-japan-glow { from { opacity: 0; } }
`);

/** Mount Fuji: the long concave slopes and the notched summit. */
const FUJI =
  'M30 107C74 101 112 82 136 37L140.6 33.6 144.6 35.4 149.6 31.4 154.6 34.6 158.8 32.6 164 37C188 82 226 101 270 107Z';
/** Its far flank, in the shadow. */
const FUJI_SHADE =
  'M149.6 31.4 154.6 34.6 158.8 32.6 164 37C188 82 226 101 270 107H190Q160 80 149.6 31.4Z';
/** Its snow, down to a ragged edge on both flanks. */
const SNOW =
  'M136 37 140.6 33.6 144.6 35.4 149.6 31.4 154.6 34.6 158.8 32.6 164 37Q170 47.6 175.4 55.6L171.4 53.2 168 58.4 163.6 52 159.6 59 155 51.6 150.4 57.4 146 51.4 141.6 58.4 137.6 52.4 132.4 57.2 128 55.8Q131.4 48 136 37Z';
/** The snow's far side, in the shadow. */
const SNOW_SHADE =
  'M149.6 31.4 154.6 34.6 158.8 32.6 164 37Q170 47.6 175.4 55.6L171.4 53.2 168 58.4 163.6 52 159.6 59 155 51.6 151.6 55Q153 44 149.6 31.4Z';
/** The gullies running down from the snow. */
const GULLIES = 'M132.6 58l-5 9M141.6 59l-2.6 10M150.4 58v11M159.6 60l2.4 10M168 59l4.6 9';

/** The string of lanterns from the cherry's branch to the left edge, and where each one hangs. */
const LANTERN_STRING = 'M236 4Q118 32-4 4';
const LANTERNS = [
  { x: 214, y: 6.4 },
  { x: 182, y: 8.9 },
  { x: 118, y: 11 },
  { x: 86, y: 10.5 },
  { x: 54, y: 9.1 },
  { x: 22, y: 6.7 },
] as const;

/** The cherry tree on the right: its trunk and boughs, thickest first. */
const BOUGHS = [
  { d: 'M314 162C312 134 304 112 306 94', width: 7 },
  { d: 'M306 94C307 78 300 62 292 48', width: 4.2 },
  { d: 'M292 48C284 30 262 14 236 6', width: 2.6 },
  { d: 'M236 6C224 3 214 1 200-2', width: 1.6 },
  { d: 'M306 94C312 76 318 52 324 32', width: 3.6 },
  { d: 'M300 66C292 64 282 66 272 72', width: 1.8 },
] as const;
/** The blossom on the boughs: clouds of flowers, each a disc and its lighter top. */
const BLOOM = [
  { x: 206, y: 0, r: 6 },
  { x: 222, y: 3, r: 7 },
  { x: 240, y: 6, r: 8 },
  { x: 258, y: 10, r: 8 },
  { x: 276, y: 18, r: 9 },
  { x: 292, y: 30, r: 10 },
  { x: 312, y: 22, r: 11 },
  { x: 322, y: 8, r: 10 },
  { x: 300, y: 48, r: 8 },
  { x: 318, y: 46, r: 9 },
  { x: 272, y: 72, r: 6.5 },
  { x: 286, y: 0, r: 9 },
  { x: 304, y: 4, r: 9 },
] as const;
/** Single flowers picked out on the clouds, so the bloom reads as blossom rather than foam. */
const FLOWERS = [
  [214, 4],
  [246, 10],
  [268, 16],
  [284, 30],
  [300, 22],
  [316, 34],
  [296, 52],
  [276, 74],
  [312, 8],
  [230, 1],
] as const;
/** Petals in the air and on the grass. */
const PETALS = [
  { x: 192, y: 40, turn: 20 },
  { x: 178, y: 66, turn: -30 },
  { x: 204, y: 86, turn: 60 },
  { x: 230, y: 20, turn: -10 },
  { x: 166, y: 30, turn: 40 },
  { x: 300, y: 104, turn: 15 },
  { x: 196, y: 118, turn: -50 },
  { x: 144, y: 74, turn: 80 },
] as const;
const PETAL = 'M0-1.1C1.2-1.6 2.4-.4 1.8.6 1.2 1.4-.6 1.4-1.6.6-2.2.1-1.4-.8 0-1.1Z';

/** A sakura flower: five round petals round a darker heart, `s` units across from the centre. */
function Flower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((angle) => (
        <circle
          key={angle}
          cx={+(1.2 * Math.sin((angle * Math.PI) / 180)).toFixed(2)}
          cy={+(-1.2 * Math.cos((angle * Math.PI) / 180)).toFixed(2)}
          r="1"
          className="fill-[oklch(0.96_0.03_355)] dark:fill-[oklch(0.84_0.07_355)]"
        />
      ))}
      <circle r=".55" className="fill-[oklch(0.7_0.14_355)] dark:fill-[oklch(0.6_0.13_20)]" />
    </g>
  );
}

/**
 * A paper lantern: a round paper body with its ribs, black caps top and bottom, on a short cord.
 * By day it hangs unlit; `lit`, it glows warm with a halo round it.
 */
function Lantern({
  x,
  y,
  scale = 1,
  glow,
  delay = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  /** The halo's radial gradient; a lantern without one hangs unlit. */
  glow?: string;
  delay?: number;
}) {
  const lit = glow !== undefined;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0v2.2" stroke="oklch(0.25 0.03 30)" strokeWidth=".5" />
      {lit && (
        <circle
          className="parky-japan-glow"
          cy="7.4"
          r="12"
          fill={`url(#${glow})`}
          style={{ animationDelay: `${delay}s` }}
        />
      )}
      <rect x="-2.2" y="2" width="4.4" height="1.4" rx=".4" fill="oklch(0.25 0.03 30)" />
      <ellipse
        cy="7.4"
        rx="4.4"
        ry="4.8"
        fill={lit ? 'oklch(0.86 0.14 72)' : 'oklch(0.97 0.02 85)'}
      />
      {lit && (
        <ellipse
          className="parky-japan-glow"
          cy="7.4"
          rx="2.6"
          ry="3.4"
          fill="oklch(0.96 0.08 95)"
          style={{ animationDelay: `${delay}s` }}
        />
      )}
      <path
        d="M-4.1 5.6h8.2M-4.4 7.4h8.8M-4.1 9.2h8.2"
        stroke={lit ? 'oklch(0.66 0.16 45)' : 'oklch(0.62 0.18 25)'}
        strokeWidth=".45"
        strokeOpacity=".8"
      />
      <path
        d="M-3.6 4.4h7.2M-3.6 10.4h7.2"
        stroke={lit ? 'oklch(0.6 0.18 35)' : 'oklch(0.6 0.19 25)'}
        strokeWidth=".9"
      />
      <rect x="-2.2" y="11.4" width="4.4" height="1.4" rx=".4" fill="oklch(0.25 0.03 30)" />
    </g>
  );
}

/** The bullet train: a long white body, its windows, the blue band, the long nose to the right. */
function BulletTrain() {
  return (
    <g>
      <path
        d="M-120 95H158C170 95 182 96.6 192 100Q199 102.6 197 103.4H-120Z"
        className="fill-[oklch(0.98_0.005_250)] dark:fill-[oklch(0.78_0.02_270)]"
      />
      <path
        d="M-120 97.8H150"
        strokeWidth="1.6"
        strokeDasharray="6 1.6"
        className="stroke-[oklch(0.38_0.04_250)] dark:stroke-[oklch(0.88_0.12_85)]"
      />
      <path d="M-120 100.8H168Q186 101 195.4 102.6" fill="none" stroke={blue} strokeWidth="1.1" />
      <path
        d="M168 96.4Q178 96.6 185.4 98.8L182.6 99.4Q175 98 167 97.8Z"
        className="fill-[oklch(0.3_0.04_250)] dark:fill-[oklch(0.3_0.04_270)]"
      />
      <path
        d="M-94 95v8.4M-48 95v8.4M-2 95v8.4M44 95v8.4M90 95v8.4M132 95v8.4"
        strokeWidth=".5"
        className="stroke-[oklch(0.75_0.02_250)] dark:stroke-[oklch(0.5_0.03_270)]"
      />
      <g className="hidden dark:inline">
        <circle cx="195.6" cy="102.4" r="3" fill={gold} opacity=".35" />
        <circle cx="195.6" cy="102.4" r=".9" fill="oklch(0.97 0.06 95)" />
      </g>
    </g>
  );
}

/**
 * A lunch box for the picnic under the blossom, wrapped in an indigo cloth with white dots and
 * knotted on top, where the Orlando scene has its suitcase.
 */
function Furoshiki() {
  return (
    <g transform="translate(176 0)">
      <rect x="0" y="115" width="20" height="14" rx="3" fill="oklch(0.42 0.1 265)" />
      <path
        d="M2 116.4 10 122 18 116.4"
        fill="none"
        stroke="oklch(0.36 0.09 265)"
        strokeWidth=".8"
      />
      <path
        d="M10 115.6C6 115 3.6 112.4 5.2 110.6 6.6 109.2 9 111.6 10 114 11 111.6 13.4 109.2 14.8 110.6 16.4 112.4 14 115 10 115.6Z"
        fill="oklch(0.46 0.1 265)"
      />
      <g fill="white" opacity=".85">
        <circle cx="4" cy="125" r=".7" />
        <circle cx="8.4" cy="127" r=".7" />
        <circle cx="13" cy="125.4" r=".7" />
        <circle cx="16.6" cy="121.6" r=".7" />
        <circle cx="3.6" cy="120" r=".7" />
        <circle cx="7.4" cy="111.8" r=".6" />
        <circle cx="12.8" cy="111.6" r=".6" />
      </g>
    </g>
  );
}

/** The dango of a blossom picnic on a skewer, pink, white and green from the top, in his hand. */
function Dango({ ground }: { ground: string }) {
  return (
    <g>
      <path
        d="M41.4 44 46.8 17.4"
        stroke="oklch(0.74 0.07 75)"
        strokeWidth=".9"
        strokeLinecap="round"
      />
      <circle cx="44.2" cy="30.6" r="2.3" fill="oklch(0.76 0.12 140)" />
      <circle
        cx="45.1"
        cy="26.1"
        r="2.3"
        fill="oklch(0.98 0.01 90)"
        stroke="oklch(0.85 0.02 90)"
        strokeWidth=".3"
      />
      <circle cx="46" cy="21.6" r="2.3" fill="oklch(0.84 0.09 355)" />
      <HolidayMitten ground={ground} x={41.6} y={40.6} />
    </g>
  );
}

/** A little lantern on a stick, in his hand in the evening. */
function HandLantern({ ground, glow }: { ground: string; glow: string }) {
  return (
    <g>
      <path
        d="M41.4 43 47.4 18.6"
        stroke="oklch(0.4 0.04 50)"
        strokeWidth=".8"
        strokeLinecap="round"
      />
      <Lantern x={47.4} y={18.6} scale={0.72} glow={glow} delay={1.4} />
      <HolidayMitten ground={ground} x={41.8} y={40.4} />
    </g>
  );
}

/** A sprig of cherry blossom tucked behind his ear: a twig, two flowers and a bud. */
function Sprig() {
  return (
    <g>
      <path
        d="M12.6 14.2 6 7.6M8.4 10 4.6 11"
        stroke="oklch(0.42 0.05 40)"
        strokeWidth=".7"
        strokeLinecap="round"
      />
      <Flower x={6.2} y={7.4} s={1.5} />
      <Flower x={10.2} y={11.6} s={1.2} />
      <circle cx="4.2" cy="11.2" r=".9" fill="oklch(0.8 0.1 355)" />
    </g>
  );
}

/**
 * Parky under the cherry tree: by day with his dango; given the lanterns' `glow`, in the evening,
 * with a lantern of his own.
 */
function Parky({ ground, glow }: { ground: string; glow?: string }) {
  const evening = glow !== undefined;
  const eyes: HolidayEyes = evening ? { look: { x: -1.8, y: -2.4 } } : { look: { x: 0.3, y: 0.4 } };
  return (
    <HolidayParky
      ground={ground}
      eyes={eyes}
      mouth={evening ? 'smile' : 'grin'}
      wear={<Sprig />}
      hands={evening ? <HandLantern ground={ground} glow={glow} /> : <Dango ground={ground} />}
    />
  );
}

/** The Japan scene, filling its box from the right edge (`xMaxYMid slice`). */
export function ParkyJapanScene({ className }: TripRegionSceneProps) {
  const id = useId();
  const sky = `${id}sky`;
  const fuji = `${id}fuji`;
  const ground = `${id}ground`;
  const glow = `${id}glow`;
  const moonlight = `${id}moonlight`;
  return (
    <HolidaySceneSvg className={className} motion={MOTION}>
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="106" gradientUnits="userSpaceOnUse">
          <stop
            offset="0"
            className="[stop-color:oklch(0.73_0.1_238)] dark:[stop-color:oklch(0.2_0.06_275)]"
          />
          <stop
            offset=".6"
            className="[stop-color:oklch(0.87_0.05_228)] dark:[stop-color:oklch(0.31_0.09_298)]"
          />
          <stop
            offset="1"
            className="[stop-color:oklch(0.95_0.035_20)] dark:[stop-color:oklch(0.48_0.12_345)]"
          />
        </linearGradient>
        <linearGradient id={fuji} x1="0" y1="32" x2="0" y2="107" gradientUnits="userSpaceOnUse">
          <stop
            offset="0"
            className="[stop-color:oklch(0.56_0.08_262)] dark:[stop-color:oklch(0.33_0.07_285)]"
          />
          <stop
            offset="1"
            className="[stop-color:oklch(0.76_0.05_240)] dark:[stop-color:oklch(0.27_0.06_300)]"
          />
        </linearGradient>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="oklch(0.88 0.15 75)" stopOpacity=".7" />
          <stop offset=".45" stopColor="oklch(0.8 0.16 55)" stopOpacity=".25" />
          <stop offset="1" stopColor="oklch(0.8 0.16 55)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={moonlight}>
          <stop offset=".3" stopColor="oklch(0.92 0.06 95)" stopOpacity=".35" />
          <stop offset="1" stopColor="oklch(0.92 0.06 95)" stopOpacity="0" />
        </radialGradient>
        <HolidayGround id={ground} />
      </defs>

      <rect width="320" height="160" fill={`url(#${sky})`} />

      {/* Day: two clouds. Evening: the moon resting on the summit, and a few stars. */}
      <g className="dark:hidden" fill="white" opacity=".85">
        <ellipse cx="54" cy="26" rx="14" ry="4.2" />
        <ellipse cx="62" cy="22.5" rx="8" ry="4.6" />
        <ellipse cx="48" cy="23.5" rx="6" ry="3.4" />
        <ellipse cx="206" cy="40" rx="11" ry="3.2" />
        <ellipse cx="212" cy="37.4" rx="6" ry="3.4" />
      </g>
      <g className="hidden dark:inline">
        <circle cx="149.6" cy="23" r="20" fill={`url(#${moonlight})`} />
        <circle cx="149.6" cy="23" r="7.4" fill="oklch(0.95 0.05 95)" />
        <g fill={gold} opacity=".8">
          <path d={STAR} transform="translate(196 30) scale(.6) translate(-17 -3)" />
          <path d={STAR} transform="translate(34 30) scale(.5) translate(-17 -3)" />
          <path d={STAR} transform="translate(100 36) scale(.7) translate(-17 -3)" />
        </g>
      </g>

      {/* The mountain, its snow and the cloud along its flank. */}
      <path d={FUJI} fill={`url(#${fuji})`} />
      <path
        d={FUJI_SHADE}
        className="fill-[oklch(0.4_0.06_265)]/20 dark:fill-[oklch(0.15_0.04_290)]/30"
      />
      <path d={SNOW} className="fill-white dark:fill-[oklch(0.84_0.03_275)]" />
      <path
        d={SNOW_SHADE}
        className="fill-[oklch(0.88_0.025_250)] dark:fill-[oklch(0.7_0.035_280)]"
      />
      <path
        d={GULLIES}
        strokeWidth=".8"
        strokeLinecap="round"
        className="stroke-white/50 dark:stroke-[oklch(0.84_0.03_275)]/25"
      />
      <g className="fill-white/80 dark:fill-[oklch(0.6_0.05_300)]/30">
        <rect x="74" y="72" width="58" height="4.6" rx="2.3" />
        <rect x="96" y="77.6" width="30" height="3" rx="1.5" />
        <rect x="174" y="76" width="44" height="4" rx="2" />
      </g>

      {/* The hills at its foot, then the viaduct and the train arriving along it. */}
      <path
        d="M-2 108Q30 99 70 102T150 101 230 103 322 100V112H-2Z"
        className="fill-[oklch(0.66_0.11_150)] dark:fill-[oklch(0.24_0.05_292)]"
      />
      <g>
        <path
          d="M10 105.4v9M34 105.4v9M58 105.4v9M82 105.4v9M106 105.4v9M130 105.4v9M154 105.4v9M178 105.4v9M202 105.4v9"
          strokeWidth="2"
          className="stroke-[oklch(0.74_0.02_250)] dark:stroke-[oklch(0.3_0.03_290)]"
        />
        <rect
          x="-2"
          y="103.4"
          width="214"
          height="2.2"
          className="fill-[oklch(0.78_0.02_250)] dark:fill-[oklch(0.33_0.03_290)]"
        />
        <g className="parky-japan-train">
          <BulletTrain />
        </g>
      </g>

      {/* The bank Parky stands on. */}
      <path
        d="M-2 112C60 107 120 110 170 111S270 107 322 109V160H-2Z"
        className="fill-[oklch(0.83_0.1_138)] dark:fill-[oklch(0.31_0.05_305)]"
      />
      <path
        d="M-2 134C60 129 120 131 170 133S270 129 322 132V160H-2Z"
        className="fill-[oklch(0.78_0.1_145)] dark:fill-[oklch(0.26_0.04_300)]"
      />

      {/* The cherry tree, framing the picture on the right; the left is the text's. */}
      <g
        fill="none"
        strokeLinecap="round"
        className="stroke-[oklch(0.42_0.05_40)] dark:stroke-[oklch(0.2_0.04_300)]"
      >
        {BOUGHS.map((bough) => (
          <path key={bough.d} d={bough.d} strokeWidth={bough.width} />
        ))}
      </g>
      <g className="fill-[oklch(0.84_0.08_355)] dark:fill-[oklch(0.5_0.09_345)]">
        {BLOOM.map((cloud) => (
          <circle key={`${cloud.x} ${cloud.y}`} cx={cloud.x} cy={cloud.y} r={cloud.r} />
        ))}
      </g>
      <g className="fill-[oklch(0.91_0.05_355)] dark:fill-[oklch(0.62_0.09_350)]">
        {BLOOM.map((cloud) => (
          <circle
            key={`${cloud.x} ${cloud.y}`}
            cx={cloud.x - cloud.r * 0.25}
            cy={cloud.y - cloud.r * 0.3}
            r={cloud.r * 0.62}
          />
        ))}
      </g>
      {FLOWERS.map(([x, y]) => (
        <Flower key={`${x} ${y}`} x={x} y={y} s={1.3} />
      ))}

      {/* Evening: the lanterns along their string, lighting one after another. */}
      <g className="hidden dark:inline">
        <path d={LANTERN_STRING} fill="none" stroke="oklch(0.2 0.03 300)" strokeWidth=".5" />
        {LANTERNS.map((lantern, i) => (
          <Lantern key={lantern.x} x={lantern.x} y={lantern.y} glow={glow} delay={0.3 + i * 0.22} />
        ))}
      </g>

      <Furoshiki />

      <g fill="black" opacity=".12">
        <ellipse cx="254" cy="131" rx="38" ry="2.8" />
        <ellipse cx="186" cy="129.4" rx="12" ry="1.6" />
      </g>

      <g className="dark:hidden" transform="translate(206 38) scale(2)">
        <Parky ground={ground} />
      </g>
      <g className="hidden dark:inline" transform="translate(206 38) scale(2)">
        <Parky ground={ground} glow={glow} />
      </g>

      <g className="fill-[oklch(0.88_0.08_355)] dark:fill-[oklch(0.72_0.09_355)]">
        {PETALS.map((petal, i) => (
          <g
            key={`${petal.x} ${petal.y}`}
            transform={`translate(${petal.x} ${petal.y}) rotate(${petal.turn}) scale(1.4)`}
          >
            <path
              className="parky-japan-petal"
              d={PETAL}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          </g>
        ))}
      </g>
    </HolidaySceneSvg>
  );
}
