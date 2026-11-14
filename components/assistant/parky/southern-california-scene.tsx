'use client';

import { useId } from 'react';
import type { TripRegionSceneProps } from '@/lib/trip-regions/registry';
import { STAR, cabinsOnRim, gold, rail, wheelSpokes } from './drawing';
import {
  HolidayGround,
  HolidayMitten,
  HolidayParky,
  HolidaySceneSvg,
  motionOnce,
  type HolidayEyes,
} from './holiday-parky';

/**
 * Parky on holiday in Southern California, the planner band's picture of the region: the Pacific
 * under a low sun, a pier running out to sea with a small Ferris wheel at its end, tall fan palms,
 * gulls, and Parky on the beach with his surfboard and a shell necklace. By day in the light theme
 * he squints into the sun with a grin; at dusk in the dark one the sun is half in the sea, the pier
 * lights come on and he watches it go down. Built from the live Parky's pieces through
 * `HolidayParky`, in the 320 × 160 frame of the Orlando scene. Decoration: `aria-hidden`; the gulls,
 * the wave and the setting sun move once (`MOTION` below), not at all under reduced motion.
 */

/** The moves, each once: the gulls glide in, the wave runs up the sand, the sun sinks, the pier lights up. */
const MOTION = motionOnce(`
.parky-socal-gull { animation: parky-socal-glide 2.4s cubic-bezier(.2,.7,.3,1) both; }
.parky-socal-wave { animation: parky-socal-wave 1.8s cubic-bezier(.3,.6,.3,1) both; }
.parky-socal-sun { animation: parky-socal-sink 2.8s cubic-bezier(.3,.5,.3,1) both; }
.parky-socal-light { animation: parky-socal-light .5s ease-out both; }
@keyframes parky-socal-glide { from { opacity: 0; transform: translate(-16px, 4px); } }
@keyframes parky-socal-wave { from { opacity: .2; transform: translateY(-5px); } }
@keyframes parky-socal-sink { from { transform: translateY(-10px); } }
@keyframes parky-socal-light { from { opacity: 0; } }
`);

/** A fan palm's frond tips as offsets from the crown, before scaling: short, stiff and all round. */
const FAN_TIPS = [
  [-12, 7],
  [-13, 0],
  [-10, -6],
  [-4, -10],
  [3, -10],
  [9, -7],
  [13, 0],
  [12, 7],
  [5, 10],
  [-5, 10],
] as const;

/** The fan palms' colours by depth and theme: green by day, a dark violet against the dusk. */
const PALM_INK = {
  near: {
    trunk: 'stroke-[oklch(0.55_0.05_60)] dark:stroke-[oklch(0.2_0.04_300)]',
    frond: 'fill-[oklch(0.55_0.12_150)] dark:fill-[oklch(0.2_0.04_300)]',
    skirt: 'fill-[oklch(0.62_0.07_75)] dark:fill-[oklch(0.2_0.04_300)]',
  },
  far: {
    trunk: 'stroke-[oklch(0.6_0.04_70)] dark:stroke-[oklch(0.26_0.05_305)]',
    frond: 'fill-[oklch(0.6_0.09_160)] dark:fill-[oklch(0.26_0.05_305)]',
    skirt: 'fill-[oklch(0.68_0.05_75)] dark:fill-[oklch(0.26_0.05_305)]',
  },
};

/**
 * A Washingtonia, the tall thin palm of the Los Angeles streets: a trunk curving up from its foot,
 * a small round crown of stiff fronds, and the skirt of dead fronds hanging under it.
 */
function FanPalm({
  foot: [bx, by],
  crown: [tx, ty],
  scale: s,
  depth,
}: {
  foot: readonly [number, number];
  crown: readonly [number, number];
  scale: number;
  depth: keyof typeof PALM_INK;
}) {
  const f = (n: number) => n.toFixed(1);
  const fronds = FAN_TIPS.map(([dx, dy]) => {
    const ex = tx + dx * s;
    const ey = ty + dy * s;
    const len = Math.hypot(ex - tx, ey - ty);
    const nx = -(ey - ty) / len;
    const ny = (ex - tx) / len;
    const mx = (tx + ex) / 2;
    const my = (ty + ey) / 2 - 2.2 * s;
    const w = 1.7 * s;
    return `M${tx} ${ty}Q${f(mx + nx * w)} ${f(my + ny * w)} ${f(ex)} ${f(ey)}Q${f(mx - nx * w)} ${f(my - ny * w)} ${tx} ${ty}Z`;
  }).join('');
  const ink = PALM_INK[depth];
  return (
    <g>
      <path
        d={`M${bx} ${by}Q${f((bx + tx) / 2 + (bx - tx) * 0.6)} ${f((by + ty) / 2)} ${tx} ${ty}`}
        fill="none"
        strokeWidth={(1.5 * s).toFixed(2)}
        strokeLinecap="round"
        className={ink.trunk}
      />
      <path
        d={`M${f(tx - 2.6 * s)} ${f(ty + 1 * s)}q${f(2.6 * s)} ${f(9 * s)} ${f(5.2 * s)} 0Z`}
        className={ink.skirt}
      />
      <path d={fronds} className={ink.frond} />
    </g>
  );
}

/** A gull gliding: two wings bowed up from the body. */
const GULL = 'M-4.5 0q2.2-2.6 4.5 0q2.3-2.6 4.5 0';

/** The pier: its deck from the shore out to the wheel, the piles under it, the rail along it. */
const PIER_DECK = 'M-2 86.6H88v1.8H-2Z';
const PIER_PILES =
  'M4 88.4v8M14 88.4v8M24 88.4v8M34 88.4v8M44 88.4v8M54 88.4v8M64 88.4v8M74 88.4v8M86 88.4v8';
const PIER_RAIL = 'M-2 84.2H88M6 84.2v2.4M42 84.2v2.4M58 84.2v2.4M86 84.2v2.4';
/** The pier's Ferris wheel, a small echo of Parky's own: its hub and its rim. */
const PIER_WHEEL = { x: 72, y: 71, r: 10 };
/** The lamps along the pier, lit at dusk one after another from the shore out. */
const PIER_LAMPS = [6, 24, 42, 58, 86] as const;

/** The arcade on the pier, a low hut with a pitched roof. */
const PIER_HUT = 'M16 86.6V80.6h18v6Z';
const PIER_HUT_ROOF = 'M14.6 81 25 76.4 35.4 81Z';

/**
 * A lifeguard tower of the Los Angeles beaches: a hut with a window band round it on four stilts,
 * a ramp down to the sand, and a flag on the roof.
 */
function LifeguardTower() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M98.6 115.6v13M104.4 115.6v13.6M112.8 115.6v13.6M118.4 115.6v13"
        strokeWidth="1.2"
        className="stroke-[oklch(0.93_0.02_90)] dark:stroke-[oklch(0.26_0.05_305)]"
      />
      <path
        d="M98 116.4 85 129.6M98 113.4l-13 13.4"
        strokeWidth="1"
        fill="none"
        className="stroke-[oklch(0.62_0.06_60)] dark:stroke-[oklch(0.26_0.05_305)]"
      />
      <path
        d="M117.6 102.4v-8.6"
        strokeWidth=".7"
        className="stroke-[oklch(0.45_0.02_250)] dark:stroke-[oklch(0.26_0.05_305)]"
      />
      <path d="M117.9 93.8 123 95.4 117.9 97Z" fill={rail} />
      <rect
        x="96.6"
        y="104"
        width="23.6"
        height="12"
        rx="2"
        className="fill-[oklch(0.8_0.09_215)] dark:fill-[oklch(0.3_0.06_310)]"
      />
      <path
        d="M95 104.6 97.4 101.4H119.4L121.8 104.6Z"
        className="fill-white dark:fill-[oklch(0.34_0.06_315)]"
      />
      <rect
        x="98.6"
        y="106.4"
        width="19.6"
        height="3.8"
        rx=".8"
        className="fill-[oklch(0.42_0.06_240)] dark:fill-[oklch(0.78_0.12_70)]/60"
      />
      <path
        d="M100.6 107.4h4"
        stroke="white"
        strokeOpacity=".6"
        strokeWidth=".6"
        className="dark:hidden"
      />
    </g>
  );
}

/**
 * The surfboard Parky leans on, nose up, in his 48-unit space: the deck, a teal and a coral band
 * across it, the stringer down the middle. Its tail is in the sand beside him.
 */
function Surfboard() {
  return (
    <g transform="translate(-2.5 10) rotate(-9)">
      <path
        d="M0 0C3 4 4 14 3.8 22 3.6 30 2.6 35 1.4 37H-1.4C-2.6 35-3.6 30-3.8 22-4 14-3 4 0 0Z"
        fill="oklch(0.97 0.02 90)"
        stroke="oklch(0.72 0.04 70)"
        strokeWidth=".4"
      />
      <path d="M-3.4 8.6Q0 7.4 3.4 8.6V11.6Q0 10.4-3.4 11.6Z" fill="oklch(0.7 0.12 200)" />
      <path d="M-3.7 13Q0 11.8 3.7 13V14.6Q0 13.4-3.7 14.6Z" fill="oklch(0.72 0.16 30)" />
      <path d="M0 1.6V35.4" stroke="oklch(0.62 0.06 60)" strokeWidth=".45" />
    </g>
  );
}

/** Where the shells of his necklace sit: along the curve under his mouth, one bigger in the middle. */
const SHELLS = Array.from({ length: 13 }, (_, i) => {
  const t = 0.06 + (0.88 * i) / 12;
  return {
    x: +(10.6 * (1 - t) ** 2 + 2 * t * (1 - t) * 24 + 37.4 * t ** 2).toFixed(2),
    y: +(36.8 + 2 * t * (1 - t) * 7.8).toFixed(2),
  };
});

/** A necklace of white shell discs, the old surfers' kind, round his middle. */
function ShellNecklace() {
  return (
    <g stroke="oklch(0.68 0.03 60)" strokeWidth=".3">
      {SHELLS.map((shell, i) =>
        i === 6 ? null : (
          <circle key={i} cx={shell.x} cy={shell.y} r=".95" fill="oklch(0.97 0.02 85)" />
        )
      )}
      <circle cx={SHELLS[6].x} cy={SHELLS[6].y + 0.4} r="1.5" fill="oklch(0.86 0.07 45)" />
    </g>
  );
}

/** Parky with his board, by day squinting into the sun, at dusk watching it set. */
function Parky({ ground, eyes }: { ground: string; eyes: HolidayEyes }) {
  return (
    <HolidayParky
      ground={ground}
      eyes={eyes}
      mouth={eyes === 'happy' ? 'grin' : 'smile'}
      behind={<Surfboard />}
      wear={<ShellNecklace />}
      hands={<HolidayMitten ground={ground} x={2.6} y={30.5} />}
    />
  );
}

/** The Southern California scene, filling its box from the right edge (`xMaxYMid slice`). */
export function ParkySouthernCaliforniaScene({ className }: TripRegionSceneProps) {
  const id = useId();
  const sky = `${id}sky`;
  const sea = `${id}sea`;
  const ground = `${id}ground`;
  return (
    <HolidaySceneSvg className={className} motion={MOTION}>
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="94" gradientUnits="userSpaceOnUse">
          <stop
            offset="0"
            className="[stop-color:oklch(0.72_0.11_236)] dark:[stop-color:oklch(0.24_0.08_285)]"
          />
          <stop
            offset=".5"
            className="[stop-color:oklch(0.85_0.07_222)] dark:[stop-color:oklch(0.38_0.13_325)]"
          />
          <stop
            offset=".82"
            className="[stop-color:oklch(0.92_0.06_80)] dark:[stop-color:oklch(0.6_0.17_28)]"
          />
          <stop
            offset="1"
            className="[stop-color:oklch(0.94_0.08_72)] dark:[stop-color:oklch(0.78_0.15_60)]"
          />
        </linearGradient>
        <linearGradient id={sea} x1="0" y1="94" x2="0" y2="122" gradientUnits="userSpaceOnUse">
          <stop
            offset="0"
            className="[stop-color:oklch(0.6_0.12_234)] dark:[stop-color:oklch(0.46_0.12_340)]"
          />
          <stop
            offset="1"
            className="[stop-color:oklch(0.76_0.1_195)] dark:[stop-color:oklch(0.3_0.07_295)]"
          />
        </linearGradient>
        <HolidayGround id={ground} />
      </defs>

      <rect width="320" height="160" fill={`url(#${sky})`} />

      {/* Day: the low sun of the afternoon. Dusk: three stars, and the sun half in the sea. */}
      <g className="dark:hidden">
        <circle cx="146" cy="56" r="22" fill="white" opacity=".3" />
        <circle cx="146" cy="56" r="15" fill="oklch(0.97 0.09 92)" opacity=".7" />
        <circle cx="146" cy="56" r="10.5" fill="oklch(0.92 0.13 85)" />
      </g>
      <g className="hidden dark:inline">
        <g fill={gold} opacity=".8">
          <path d={STAR} transform="translate(64 8) scale(.6) translate(-17 -3)" />
          <path d={STAR} transform="translate(214 10) scale(.5) translate(-17 -3)" />
          <path d={STAR} transform="translate(240 4) scale(.7) translate(-17 -3)" />
        </g>
        <g className="parky-socal-sun">
          <circle cx="146" cy="94" r="34" fill="oklch(0.8 0.16 55)" opacity=".28" />
          <circle cx="146" cy="94" r="22" fill="oklch(0.84 0.15 62)" opacity=".4" />
          <circle cx="146" cy="94" r="13.5" fill="oklch(0.86 0.15 68)" />
        </g>
      </g>

      <g
        fill="none"
        strokeWidth=".9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-[oklch(0.42_0.03_250)] dark:stroke-[oklch(0.2_0.05_300)]"
      >
        <g transform="translate(112 34) scale(1.3)">
          <path className="parky-socal-gull" d={GULL} />
        </g>
        <g transform="translate(128 25)">
          <path className="parky-socal-gull" d={GULL} style={{ animationDelay: '.3s' }} />
        </g>
      </g>

      {/* The headland across the bay. */}
      <path
        d="M-2 94V82q12-8 26-8t26 7 16 6 14 7Z"
        className="fill-[oklch(0.74_0.05_228)] dark:fill-[oklch(0.34_0.08_318)]"
      />
      <path
        d="M-2 94v-6q10-4 22-3t22 4 12 5Z"
        className="fill-[oklch(0.68_0.06_205)] dark:fill-[oklch(0.28_0.06_305)]"
      />

      {/* The sea, the sun's glitter on it, the breakers. */}
      <rect y="93.6" width="320" height="30" fill={`url(#${sea})`} />
      <path
        d="M130 98h8M150 101h12M170 97h6M60 104h10M96 100h8M202 101h10M118 108h14M238 99h8M276 104h10"
        stroke="white"
        strokeOpacity=".7"
        strokeWidth=".9"
        strokeLinecap="round"
        className="dark:hidden"
      />
      <path
        d="M137 97h18M140 100h12M134 103h24M141 106h10M131 110h30M138 114h16M134 118h24"
        stroke="oklch(0.86 0.14 70)"
        strokeOpacity=".7"
        strokeWidth="1.1"
        strokeLinecap="round"
        className="hidden dark:inline"
      />
      <path
        d="M70 110.6q20-2 40 0t40 0 40-.4"
        fill="none"
        strokeWidth="1"
        strokeLinecap="round"
        className="stroke-white/70 dark:stroke-[oklch(0.86_0.06_40)]/50"
      />

      {/* The pier, with its wheel at the end. */}
      <g>
        <g
          fill="none"
          strokeLinecap="round"
          className="stroke-[oklch(0.5_0.04_60)] dark:stroke-[oklch(0.22_0.05_300)]"
        >
          <path d={PIER_PILES} strokeWidth="1" />
          <path d={PIER_RAIL} strokeWidth=".6" />
          <path
            d={`M${PIER_WHEEL.x} ${PIER_WHEEL.y}L${PIER_WHEEL.x - 6} 86.6M${PIER_WHEEL.x} ${PIER_WHEEL.y}L${PIER_WHEEL.x + 6} 86.6`}
            strokeWidth="1.2"
          />
        </g>
        <path
          d={PIER_DECK}
          className="fill-[oklch(0.5_0.04_60)] dark:fill-[oklch(0.22_0.05_300)]"
        />
        <path
          d={PIER_HUT}
          className="fill-[oklch(0.94_0.03_80)] dark:fill-[oklch(0.25_0.05_300)]"
        />
        <path d={PIER_HUT_ROOF} fill={rail} className="dark:fill-[oklch(0.25_0.05_300)]" />
        <circle
          cx={PIER_WHEEL.x}
          cy={PIER_WHEEL.y}
          r={PIER_WHEEL.r}
          fill="none"
          strokeWidth="1"
          className="stroke-[oklch(0.97_0.01_90)] dark:stroke-[oklch(0.24_0.05_300)]"
        />
        <path
          d={wheelSpokes(PIER_WHEEL, cabinsOnRim(PIER_WHEEL))}
          strokeWidth=".45"
          className="stroke-[oklch(0.97_0.01_90)]/80 dark:stroke-[oklch(0.24_0.05_300)]"
        />
        {cabinsOnRim(PIER_WHEEL).map((cabin, i) => (
          <circle
            key={`${cabin.x} ${cabin.y}`}
            cx={cabin.x}
            cy={cabin.y}
            r="1.3"
            className={
              i % 2
                ? 'fill-[oklch(0.72_0.17_355)] dark:fill-[oklch(0.78_0.15_355)]'
                : 'fill-[oklch(0.86_0.15_90)] dark:fill-[oklch(0.9_0.13_90)]'
            }
          />
        ))}
        <g className="hidden dark:inline" fill={gold}>
          {PIER_LAMPS.map((x, i) => (
            <g key={x}>
              <circle
                className="parky-socal-light"
                cx={x}
                cy="83.4"
                r="1.6"
                opacity=".35"
                style={{ animationDelay: `${0.6 + i * 0.18}s` }}
              />
              <circle
                className="parky-socal-light"
                cx={x}
                cy="83.4"
                r=".7"
                style={{ animationDelay: `${0.6 + i * 0.18}s` }}
              />
            </g>
          ))}
        </g>
      </g>

      {/* Two tall palms on the shore, in front of the sun. */}
      <FanPalm foot={[162, 123]} crown={[154, 30]} scale={0.64} depth="far" />
      <FanPalm foot={[176, 123]} crown={[181, 47]} scale={0.52} depth="far" />

      {/* The beach: the wet sand, the wave running up it, the dry sand. */}
      <path
        d="M-2 119.6q16-2 32 0t32 0 32 0 32 0 32 0 32 0 32 0 32 0 32 0 32 0 32 0V160H-2Z"
        className="fill-[oklch(0.8_0.06_75)] dark:fill-[oklch(0.4_0.08_330)]"
      />
      <g className="parky-socal-wave">
        <path
          d="M-2 119.6q16-2 32 0t32 0 32 0 32 0 32 0 32 0 32 0 32 0 32 0 32 0 32 0"
          fill="none"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="stroke-white dark:stroke-[oklch(0.88_0.06_40)]/70"
        />
      </g>
      <path
        d="M-2 128C50 123 110 125 160 127S260 123 322 126V160H-2Z"
        className="fill-[oklch(0.9_0.06_85)] dark:fill-[oklch(0.33_0.05_330)]"
      />
      <LifeguardTower />
      <path
        d="M-2 140C60 135 120 137 170 139S270 135 322 138V160H-2Z"
        className="fill-[oklch(0.86_0.07_80)] dark:fill-[oklch(0.27_0.04_315)]"
      />

      {/* The near palm on the right, framing the picture there; the left is the text's. */}
      <FanPalm foot={[322, 160]} crown={[305, 13]} scale={1.1} depth="near" />

      <ellipse cx="252" cy="131" rx="40" ry="2.8" fill="black" opacity=".12" />

      <g className="dark:hidden" transform="translate(206 38) scale(2)">
        <Parky ground={ground} eyes="happy" />
      </g>
      <g className="hidden dark:inline" transform="translate(206 38) scale(2)">
        <Parky ground={ground} eyes={{ look: { x: -2.2, y: 0.6 } }} />
      </g>
    </HolidaySceneSvg>
  );
}
