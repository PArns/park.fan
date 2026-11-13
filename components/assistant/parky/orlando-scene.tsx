import { cn } from '@/lib/utils';
import type { TripRegionSceneProps } from '@/lib/navigation/trip-regions';
import {
  BUBBLE,
  BURST,
  CHEEKS,
  EYES,
  GRIN,
  MOON,
  STAR,
  blue,
  blush,
  gold,
  green,
  ink,
  rail,
} from './drawing';
import { LOOK_GAZE, ParkyShades } from './looks';
import { ParkyMap } from './props';
import { ParkyWheel } from './wheel';
import { ParkyEyeWhite, ParkyPupil } from './eyes';

/**
 * Parky on holiday in Orlando, the planner band's picture of the region: a lake with a coaster on
 * the far shore, a flamingo, a suitcase, palms, a launch from the coast, and Parky with his map.
 * By day in the light theme, sunglasses on; in the evening in the dark one, the glasses pushed up
 * and his eyes on the fireworks. Built from the live Parky's pieces (`drawing.ts`, the wheel, the
 * shades and the fireworks' burst of `looks.tsx`, the map of `props.tsx`), in the 320 × 160 frame
 * of `ParkyBreakScene`. Decoration: `aria-hidden`, and the launch and the bursts play once
 * (`.parky-orlando-*` in `app/parky.css`), not at all under reduced motion.
 */

/** Where the evening's bursts open: centre, colour, size and when, over the lake's left half. */
const BURSTS = [
  { x: 46, y: 34, colour: 'oklch(0.72 0.17 355)', scale: 3.4, delay: 0 },
  { x: 92, y: 18, colour: gold, scale: 3.8, delay: 0.35 },
  { x: 134, y: 44, colour: 'oklch(0.7 0.15 200)', scale: 3, delay: 0.7 },
  { x: 18, y: 64, colour: green, scale: 2.2, delay: 1.05 },
];

/** The coaster on the far shore: lift hill, drop, a loop, the run-out; its supports; its lights. */
const COASTER =
  'M8 94 L30 52 Q35 44 40 52 L54 86 Q58 92 64 88 Q68 84 72 86 Q80 90 86 88 A12.5 12.5 0 1 1 87.4 88.2 Q96 92 106 86 Q112 82 118 90 L128 94';
const SUPPORTS =
  'M14 94V83M20 94V71M26 94V60M32 94V49M38 94V49M46 94V68M86 94V64M74 94V87M112 94V85';
const COASTER_LIGHTS = [
  [24, 63],
  [33, 47],
  [44, 62],
  [60, 90],
  [82, 77],
  [93, 66],
  [112, 84],
] as const;

/** A frond's tip as an offset from the crown, before scaling: eight round the top of a palm. */
const FROND_TIPS = [
  [-19, 7],
  [-17, -3],
  [-9, -10],
  [3, -11],
  [13, -6],
  [19, 4],
  [9, 10],
  [-8, 11],
] as const;

/** The palm's colours: a near one, darker and greener, and the far ones, paler, by theme. */
const PALM_INK = {
  near: {
    trunk: 'stroke-[oklch(0.52_0.07_55)] dark:stroke-[oklch(0.22_0.04_300)]',
    frond: 'fill-[oklch(0.58_0.14_150)] dark:fill-[oklch(0.22_0.04_300)]',
  },
  far: {
    trunk: 'stroke-[oklch(0.55_0.06_120)] dark:stroke-[oklch(0.27_0.05_300)]',
    frond: 'fill-[oklch(0.56_0.1_160)] dark:fill-[oklch(0.27_0.05_300)]',
  },
};
const NUT = 'fill-[oklch(0.45_0.07_55)] dark:fill-[oklch(0.22_0.04_300)]';

/**
 * A palm: a leaning trunk from its foot to its crown, and fronds whose spines arch up before they
 * droop to the tip. `scale` sizes the crown and the trunk's width.
 */
function Palm({
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
  const fronds = FROND_TIPS.map(([dx, dy]) => {
    const ex = tx + dx * s;
    const ey = ty + dy * s;
    const len = Math.hypot(ex - tx, ey - ty);
    const nx = -(ey - ty) / len;
    const ny = (ex - tx) / len;
    const mx = (tx + ex) / 2;
    const my = (ty + ey) / 2 - 5 * s;
    const w = 2.6 * s;
    return `M${tx} ${ty}Q${f(mx + nx * w)} ${f(my + ny * w)} ${f(ex)} ${f(ey)}Q${f(mx - nx * w)} ${f(my - ny * w)} ${tx} ${ty}Z`;
  }).join('');
  const bend = [(bx + tx) / 2 + (bx - tx) * 0.25, (by + ty) / 2];
  return (
    <g>
      <path
        d={`M${bx} ${by}Q${f(bend[0])} ${f(bend[1])} ${tx} ${ty}`}
        fill="none"
        strokeWidth={(2.4 * s).toFixed(2)}
        strokeLinecap="round"
        className={PALM_INK[depth].trunk}
      />
      <path d={fronds} className={PALM_INK[depth].frond} />
      <circle cx={tx - 1.2 * s} cy={ty + 1.6 * s} r={(1.2 * s).toFixed(2)} className={NUT} />
      <circle cx={tx + 1.2 * s} cy={ty + 1.8 * s} r={(1.2 * s).toFixed(2)} className={NUT} />
    </g>
  );
}

/** A rocket, nose up at the origin: white body, red nose and fins, a gold flame. */
function Rocket() {
  return (
    <g>
      <path d="M-1 4.6Q0 10.5 1 4.6Z" fill={gold} />
      <path d="M-1.7 1.8-3.6 5.4-1.7 4.6ZM1.7 1.8 3.6 5.4 1.7 4.6Z" fill={rail} />
      <rect
        x="-1.7"
        y="-5"
        width="3.4"
        height="9.8"
        rx="1"
        fill="white"
        stroke="oklch(0.7 0.02 250)"
        strokeWidth=".3"
      />
      <path d="M-1.7-4.6Q0-10 1.7-4.6Z" fill={rail} />
      <circle cy="-2" r=".85" fill={blue} stroke="white" strokeWidth=".3" />
    </g>
  );
}

/** A flamingo standing in the shallows, on one leg, and its reflection. */
function Flamingo() {
  const pink = 'oklch(0.76 0.13 0)';
  return (
    <g transform="translate(100 0)">
      <g strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M-1 116.5 L-1 126 M1.5 116 L3 120.5 L-.5 122"
          fill="none"
          stroke="oklch(0.62 0.14 5)"
          strokeWidth=".9"
        />
        <ellipse cx="0" cy="113.5" rx="6.2" ry="3.5" fill={pink} />
        <path d="M-4.5 112.5q-3.4 .4-4.8 2.6 3.2-.4 5.6-.8Z" fill="oklch(0.66 0.15 0)" />
        <path
          d="M4.6 112.2C7.8 109 5.2 105 6 101.6 6.6 99 9.4 98.6 10.2 100.6"
          fill="none"
          stroke={pink}
          strokeWidth="1.6"
        />
        <circle cx="9.6" cy="100.2" r="1.7" fill={pink} />
        <path d="M10.9 99.6l2.4 1.6-1.2 1.4Z" fill={ink} />
      </g>
      <ellipse cx="0" cy="128" rx="6" ry="1.4" fill={pink} opacity=".22" />
    </g>
  );
}

/** A suitcase with two stickers, a gold star and a pink label. */
function Suitcase() {
  return (
    <g transform="translate(166 0)">
      <path
        d="M6 112v-3.6q0-1.6 1.6-1.6h6.8q1.6 0 1.6 1.6V112"
        fill="none"
        stroke="oklch(0.42 0.06 250)"
        strokeWidth="1.3"
      />
      <rect x="0" y="111" width="22" height="19" rx="2.6" fill="oklch(0.66 0.13 210)" />
      <path d="M5 111v19M17 111v19" stroke="oklch(0.52 0.12 215)" strokeWidth="1.6" />
      <circle cx="11" cy="118" r="3.2" fill={gold} />
      <path d={STAR} transform="translate(11 118) scale(.7) translate(-17 -3)" fill={rail} />
      <rect
        x="6.6"
        y="123"
        width="9"
        height="4.4"
        rx="1"
        fill="oklch(0.72 0.17 355)"
        transform="rotate(-8 11 125)"
      />
    </g>
  );
}

/**
 * Parky in his 48-unit space: the wheel, his head, the face of the hour, the map held low. By day
 * the shades are on and the grin open; in the evening the shades sit on his head and his eyes go
 * up to the fireworks, where `LOOK_GAZE.fireworks` points the live Parky's.
 */
function Parky({ evening }: { evening: boolean }) {
  const gaze = LOOK_GAZE.fireworks ?? { x: 0, y: 0 };
  return (
    <>
      <ParkyWheel />
      <path d={BUBBLE} fill="url(#parky-orlando-ground)" />
      {evening ? (
        <>
          {EYES.map((x) => (
            <g key={x}>
              <ParkyEyeWhite x={x} />
              <ParkyPupil x={x} dx={gaze.x} dy={gaze.y} />
            </g>
          ))}
          <ParkyShades transform="translate(4.8 -9.6) scale(.8)" />
        </>
      ) : (
        <ParkyShades />
      )}
      {CHEEKS.map((x) => (
        <ellipse key={x} cx={x} cy="31" rx="2.4" ry="1.4" fill={blush} opacity=".7" />
      ))}
      <path d={GRIN} fill={ink} />
      <g transform="translate(-15.5 7.5) rotate(-9 24 37.8) translate(24 37.8) scale(.74) translate(-24 -37.8)">
        <ParkyMap still />
      </g>
    </>
  );
}

/** The Orlando scene, filling its box from the right edge (`xMaxYMid slice`). */
export function ParkyOrlandoScene({ className }: TripRegionSceneProps) {
  return (
    <svg
      viewBox="0 0 320 160"
      preserveAspectRatio="xMaxYMid slice"
      className={cn('block', className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="parky-orlando-sky" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            className="[stop-color:oklch(0.74_0.1_232)] dark:[stop-color:oklch(0.24_0.08_285)]"
          />
          <stop
            offset=".6"
            className="[stop-color:oklch(0.86_0.07_215)] dark:[stop-color:oklch(0.42_0.12_335)]"
          />
          <stop
            offset="1"
            className="[stop-color:oklch(0.94_0.06_80)] dark:[stop-color:oklch(0.7_0.14_50)]"
          />
        </linearGradient>
        <linearGradient id="parky-orlando-lake" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            className="[stop-color:oklch(0.74_0.1_220)] dark:[stop-color:oklch(0.36_0.09_310)]"
          />
          <stop
            offset="1"
            className="[stop-color:oklch(0.62_0.11_232)] dark:[stop-color:oklch(0.2_0.05_275)]"
          />
        </linearGradient>
        <linearGradient id="parky-orlando-ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={blue} />
          <stop offset="1" stopColor={green} />
        </linearGradient>
      </defs>

      <rect width="320" height="160" fill="url(#parky-orlando-sky)" />

      {/* Day: the sun and a cloud. Evening: the sun going down behind the far shore, the moon and
          three stars. */}
      <g className="dark:hidden">
        <circle cx="150" cy="30" r="20" fill="white" opacity=".35" />
        <circle cx="150" cy="30" r="15" fill="oklch(0.97 0.09 92)" opacity=".7" />
        <circle cx="150" cy="30" r="11" fill="oklch(0.9 0.14 86)" />
        <g fill="white" opacity=".85">
          <ellipse cx="58" cy="24" rx="14" ry="4.2" />
          <ellipse cx="66" cy="20.5" rx="8" ry="4.6" />
          <ellipse cx="52" cy="21.5" rx="6" ry="3.4" />
        </g>
      </g>
      <g className="hidden dark:inline">
        <circle cx="132" cy="95" r="24" fill="oklch(0.8 0.16 55)" opacity=".35" />
        <circle cx="132" cy="95" r="12.5" fill="oklch(0.84 0.15 65)" />
        <path d={MOON} transform="translate(296 6) scale(1.6)" fill="oklch(0.92 0.1 95)" />
        <g fill={gold}>
          <path d={STAR} transform="translate(210 10) scale(.8) translate(-17 -3)" />
          <path d={STAR} transform="translate(236 4) scale(.6) translate(-17 -3)" />
          <path d={STAR} transform="translate(70 6) scale(.6) translate(-17 -3)" />
        </g>
      </g>

      {/* A launch from the coast: the trail curls up from the far shore, the rocket at its tip. */}
      <g>
        <path
          d="M168 95C170 72 172 50 186 22"
          fill="none"
          strokeLinecap="round"
          strokeWidth="2.6"
          pathLength={1}
          className="parky-orlando-trail stroke-white/85 dark:stroke-[oklch(0.9_0.08_70)]"
        />
        <g className="fill-white dark:fill-[oklch(0.82_0.04_300)]" opacity=".9">
          <circle cx="166" cy="93" r="4.2" />
          <circle cx="171" cy="91" r="3.4" />
          <circle cx="162" cy="92" r="3" />
        </g>
        <g transform="translate(186.6 20.6) rotate(24) scale(1.25)">
          <g className="parky-orlando-rocket">
            <Rocket />
          </g>
        </g>
      </g>

      {/* Evening: fireworks over the lake, the live Parky's bursts at three to four times the size. */}
      <g className="hidden dark:inline" strokeLinecap="round">
        {BURSTS.map((burst) => (
          <g key={burst.x} transform={`translate(${burst.x} ${burst.y}) scale(${burst.scale})`}>
            <g
              className="parky-orlando-burst"
              style={{ animationDelay: `${burst.delay}s` }}
              stroke={burst.colour}
              strokeWidth=".55"
            >
              <path d={BURST} />
              <circle r=".9" fill={burst.colour} stroke="none" />
            </g>
          </g>
        ))}
      </g>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          d={SUPPORTS}
          strokeWidth=".9"
          className="stroke-[oklch(0.62_0.06_245)] dark:stroke-[oklch(0.3_0.05_300)]"
        />
        <path
          d={COASTER}
          strokeWidth="1.8"
          className="stroke-[oklch(0.52_0.11_245)] dark:stroke-[oklch(0.22_0.05_295)]"
        />
      </g>
      <g className="hidden dark:inline" fill={gold}>
        {COASTER_LIGHTS.map(([x, y]) => (
          <circle key={`${x} ${y}`} cx={x} cy={y} r=".9" />
        ))}
      </g>

      {/* The far shore, two palms on it. */}
      <path
        d="M0 96V91q8-4 16-1t14-2 18 1 20-2 16 2 24-1 22 2 18-2 24 1 20-1 26 2 22-1 20 1 24-2 20 1 16-1V96Z"
        className="fill-[oklch(0.64_0.1_160)] dark:fill-[oklch(0.28_0.05_300)]"
      />
      <Palm foot={[214, 94]} crown={[216, 76]} scale={0.55} depth="far" />
      <Palm foot={[150, 94]} crown={[148, 79]} scale={0.45} depth="far" />

      {/* The lake, the sun's or the fireworks' light on it. */}
      <rect y="95.5" width="320" height="40" fill="url(#parky-orlando-lake)" />
      <path
        d="M140 102h10M146 106h16M152 110h7M40 108h12M88 104h9M210 104h12M100 114h10"
        stroke="white"
        strokeOpacity=".75"
        strokeWidth=".9"
        strokeLinecap="round"
        className="dark:hidden"
      />
      <g className="hidden dark:inline" strokeLinecap="round" strokeWidth="1" opacity=".35">
        <path d="M122 100h20M126 104h12M129 108h6" stroke="oklch(0.84 0.15 65)" />
        {BURSTS.map((burst) => (
          <path
            key={burst.x}
            d={`M${burst.x - 2} ${101 + (burst.y % 5)}h4M${burst.x - 4} ${106 + (burst.y % 3)}h3M${burst.x + 2} 108h2`}
            stroke={burst.colour}
          />
        ))}
      </g>

      <Flamingo />

      {/* The near bank. */}
      <path
        d="M0 133C50 126 110 128 160 130S260 126 320 129V160H0Z"
        className="fill-[oklch(0.88_0.07_85)] dark:fill-[oklch(0.33_0.05_330)]"
      />
      <path
        d="M0 141C60 136 120 138 170 140S270 136 320 139V160H0Z"
        className="fill-[oklch(0.84_0.08_80)] dark:fill-[oklch(0.27_0.04_315)]"
      />

      <Suitcase />

      {/* A palm behind him on the right, framing the picture there; the left is the text's. */}
      <Palm foot={[318, 150]} crown={[302, 60]} scale={1.3} depth="near" />
      <Palm foot={[8, 100]} crown={[14, 70]} scale={0.8} depth="far" />

      <g fill="black" opacity=".12">
        <ellipse cx="256" cy="131" rx="38" ry="2.8" />
        <ellipse cx="177" cy="131" rx="13" ry="1.8" />
      </g>

      <g className="dark:hidden" transform="translate(206 38) scale(2)">
        <Parky evening={false} />
      </g>
      <g className="hidden dark:inline" transform="translate(206 38) scale(2)">
        <Parky evening />
      </g>
    </svg>
  );
}
