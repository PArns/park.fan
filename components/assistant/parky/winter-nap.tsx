import { cn } from '@/lib/utils';
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
import type { ParkyOutfit } from '@/lib/assistant/parky/look';

/** What Parky wears through the winter: the woolly hat and the scarf, nothing in his hands. */
const WINTER_OUTFIT: ParkyOutfit = { hat: 'beanie', scarf: true, umbrella: false, sky: null };

/** Where Parky sits in the picture and how big: his 48-unit drawing, about 107 units tall here. */
const PARKY_AT = 'translate(170 32) scale(2)';

/** The snowman beside him, drawn at nearly his height rather than at an act's small scale. */
const SNOWMAN_AT = 'translate(176 -16) scale(3)';

/** The Zs over his right shoulder, growing as they rise, in the picture's units. */
const ZEDS = [
  { x: 262, y: 52, scale: 1.1 },
  { x: 274, y: 38, scale: 1.4 },
  { x: 288, y: 22, scale: 1.7 },
];

/** Snowflakes in the sky, clear of Parky's head and the Zs, with their size. */
const FLAKES = [
  [18, 20, 1.4],
  [44, 48, 1],
  [100, 12, 1.2],
  [196, 10, 1.2],
  [166, 14, 1],
  [12, 96, 1.2],
  [134, 92, 1],
  [114, 66, 1.3],
  [300, 78, 1.2],
  [284, 104, 1],
] as const;

/** Stars, mostly seen against the dark theme's night sky. */
const STARS = [
  [28, 10, 0.9],
  [74, 22, 0.7],
  [140, 24, 0.8],
  [236, 8, 0.7],
] as const;

/** The Ferris wheel asleep behind the hills: its hub, its rim and its eight cabins. */
const WHEEL = { x: 66, y: 76, r: 36 };
const WHEEL_CABINS = Array.from({ length: 8 }, (_, i) => ({
  x: +(WHEEL.x + WHEEL.r * Math.sin((i * Math.PI) / 4)).toFixed(1),
  y: +(WHEEL.y - WHEEL.r * Math.cos((i * Math.PI) / 4)).toFixed(1),
}));

/**
 * Parky's winter nap, the picture on the winter-break panel: he sleeps in the snow in his woolly
 * hat and scarf, the snowman he built beside him, the park's Ferris wheel snowed in behind the
 * hills under the moon. Drawn in a 320 × 160 space from the same pieces as the live Parky
 * (`drawing.ts`, `looks.tsx`) and entirely still: it sits in a glass panel, where no endless
 * animation may run. Decorative; the panel's text says what it shows.
 *
 * Fills its box (`slice`), so the caller sets the size; essentials stay inside x 30 to 290.
 */
export function ParkyWinterNap({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 160"
      preserveAspectRatio="xMidYMid slice"
      className={cn('block', className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="parky-winter-sky" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            className="[stop-color:oklch(0.84_0.06_240)] dark:[stop-color:oklch(0.24_0.06_265)]"
          />
          <stop
            offset="1"
            className="[stop-color:oklch(0.95_0.025_225)] dark:[stop-color:oklch(0.38_0.07_250)]"
          />
        </linearGradient>
        <linearGradient id="parky-winter-ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={blue} />
          <stop offset="1" stopColor={green} />
        </linearGradient>
      </defs>

      <rect width="320" height="160" fill="url(#parky-winter-sky)" />

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
          <path d={`M${x - 4.2} ${y - 0.4}q4.2-3.4 8.4 0Z`} fill="white" />
        </g>
      ))}

      {/* Two hills of snow, the far one hiding the wheel's foot. */}
      <path
        d="M0 116C60 102 120 108 170 114S270 102 320 110V160H0Z"
        className="fill-[oklch(0.97_0.012_235)] dark:fill-[oklch(0.78_0.03_245)]"
        stroke={ice}
        strokeOpacity=".5"
        strokeWidth=".8"
      />
      <path
        d="M0 140C60 126 120 124 180 130S280 122 320 128V160H0Z"
        className="fill-white dark:fill-[oklch(0.9_0.02_240)]"
        stroke={ice}
        strokeOpacity=".6"
        strokeWidth=".8"
      />

      <g
        fill="none"
        strokeWidth=".8"
        strokeLinecap="round"
        className="stroke-[oklch(0.7_0.08_235)] dark:stroke-white"
      >
        {FLAKES.map(([x, y, s]) => (
          <path key={`${x} ${y}`} d={FLAKE} transform={`translate(${x} ${y}) scale(${s})`} />
        ))}
      </g>

      {/* Blue shadows on the snow under the two of them. */}
      <g fill={ice} opacity=".3">
        <ellipse cx="155" cy="129.5" rx="17" ry="2.6" />
        <ellipse cx="218" cy="129" rx="38" ry="3.4" />
      </g>

      <g transform={SNOWMAN_AT}>
        <ParkySnowman still />
      </g>
      <g transform={PARKY_AT}>
        <ParkyLookHat hat="beanie" still />
        <path d={BUBBLE} fill="url(#parky-winter-ground)" />
        <ParkyLookWear outfit={WINTER_OUTFIT} ground="parky-winter-ground" />
        <path d={SHUT_EYES} fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
        {CHEEKS.map((x) => (
          <ellipse key={x} cx={x} cy="31" rx="2.4" ry="1.4" fill={blush} opacity=".7" />
        ))}
        <path d={SMILE} fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
      </g>

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
    </svg>
  );
}
