'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { pickRandom } from '@/lib/utils/pick-random';
import { parkyBoredom } from '@/lib/assistant/parky-boredom';
import { useParkyBoredom } from '@/lib/assistant/use-parky-boredom';

/**
 * Parky's little acts and how long each runs. The stylesheet reads the length as `--parky-act`,
 * so a duration is written here only.
 */
const ACT_MS = {
  hop: 1400,
  tilt: 1600,
  look: 1800,
  spin: 2200,
  wink: 900,
  wiggle: 1100,
  yawn: 2600,
  whistle: 3200,
  gum: 3400,
  roll: 1600,
  twirl: 1400,
  dance: 2400,
  read: 4200,
  nap: 5000,
  doze: 2000,
  startle: 900,
} as const;
type ParkyAct = keyof typeof ACT_MS;

/** With company Parky fidgets and shows off; once nobody moves it yawns, reads and naps. */
const ACTS: Record<'awake' | 'bored', readonly ParkyAct[]> = {
  awake: ['hop', 'tilt', 'look', 'spin', 'wink', 'wiggle', 'roll', 'twirl', 'dance', 'read'],
  bored: ['yawn', 'whistle', 'gum', 'roll', 'look', 'read', 'nap'],
};
/** The rest between two acts, as the shortest wait and a random spread on top. */
const PAUSE_MS: Record<'awake' | 'bored', readonly [number, number]> = {
  awake: [12_000, 8_000],
  bored: [5_000, 4_000],
};
/** The first yawn and the eyes falling shut wait a moment after the boredom sets in. */
const SETTLE_MS = 1_500;

/** How far a pupil may wander inside its eye, in the 48-unit drawing. */
const PUPIL_REACH = 2.2;

/** The eyes' centres on the x axis, left and right. */
const EYES = [17, 31] as const;

const ink = 'oklch(0.25 0.03 240)';
const blue = 'oklch(0.628 0.137 241.275)';
const green = 'oklch(0.752 0.181 146.391)';
const pink = 'oklch(0.8 0.13 355)';

/**
 * The hat, a Ferris wheel set into Parky's head: the lowest cabin goes behind it, and the A-frame's
 * right leg runs down the slope of the head, so the wheel stands in it rather than on top. Cabins
 * are circles, so they need no turning back to hang straight while the wheel spins.
 */
const HUB = { x: 33, y: 0.5 };
const RIM = 6.5;
const CABINS = Array.from({ length: 8 }, (_, i) => ({
  x: +(HUB.x + RIM * Math.sin((i * Math.PI) / 4)).toFixed(2),
  y: +(HUB.y - RIM * Math.cos((i * Math.PI) / 4)).toFixed(2),
}));
const CABIN_COLOURS = ['oklch(0.72 0.17 355)', 'oklch(0.86 0.15 90)', green, 'oklch(0.76 0.16 55)'];
const SPOKES = CABINS.slice(0, 4)
  .map(({ x, y }) => `M${x} ${y}L${+(2 * HUB.x - x).toFixed(2)} ${+(2 * HUB.y - y).toFixed(2)}`)
  .join('');
// The legs end inside the head, which is drawn over them.
const A_FRAME = `M${HUB.x} ${HUB.y}L25.5 13M${HUB.x} ${HUB.y}L41.5 20`;
const frame = 'oklch(0.48 0.1 245)';

/**
 * The pupils' offset towards the pointer, so Parky looks at the mouse. Only for a fine pointer and
 * without reduced motion; one frame at most per pointer move.
 */
function useGaze(svg: React.RefObject<SVGSVGElement | null>) {
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const media = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!media.matches) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = svg.current?.getBoundingClientRect();
        if (!box || box.width === 0) return;
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        const distance = Math.hypot(dx, dy) || 1;
        const pull = Math.min(1, distance / 240);
        setGaze({
          x: (dx / distance) * PUPIL_REACH * pull,
          y: (dy / distance) * PUPIL_REACH * pull,
        });
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, [svg]);
  return gaze;
}

/**
 * Parky's life while nothing happens, from the page-wide {@link parkyBoredom}: a little act now and
 * then with company, more and sleepier ones once bored, then eyes falling shut and sleep until
 * somebody moves, which wakes it with a start. Each act runs once and clears, so the face rests
 * between them.
 */
function useIdleAct(enabled: boolean) {
  const boredom = useParkyBoredom(enabled);
  const [act, setAct] = useState<ParkyAct | null>(null);
  useEffect(() => {
    if (!boredom) return;
    const woke = parkyBoredom.wokeUp();
    // One timer at a time, re-armed from its own callback, so cleanup always reaches it.
    let timer: ReturnType<typeof setTimeout>;
    let previous: ParkyAct | null = null;
    const play = (wait: number, next: ParkyAct) => {
      timer = setTimeout(() => {
        previous = next;
        setAct(next);
        timer = setTimeout(() => {
          setAct(null);
          loop();
        }, ACT_MS[next]);
      }, wait);
    };
    const loop = () => {
      // Asleep, the doze is the last act: the sleeping face takes over until somebody moves.
      if (boredom === 'asleep') return;
      const [shortest, spread] = PAUSE_MS[boredom];
      play(shortest + Math.random() * spread, pickRandom(ACTS[boredom], previous));
    };
    if (boredom === 'asleep') play(SETTLE_MS, 'doze');
    else if (boredom === 'bored') play(SETTLE_MS, 'yawn');
    else if (woke) play(0, 'startle');
    else loop();
    return () => {
      clearTimeout(timer);
      setAct(null);
    };
  }, [boredom]);
  return { act, asleep: boredom === 'asleep' && act === null };
}

/**
 * What Parky is busy with, each with its own look: `thinking` (waiting for the first word) gazes
 * up beside thought bubbles, `looking` (a lookup is running) reads in a little book, its eyes
 * following the lines and a page turning now and then, `talking` (the answer is written) moves its
 * mouth and nods.
 */
export type ParkyMood = 'thinking' | 'looking' | 'talking';

/** Where the pupils rest while Parky reads: down, into the book. */
const READING_GAZE = { x: 0, y: 2.8 };

/** Where the pupils rest while Parky ponders: up and to the side. */
const PONDER_GAZE = { x: 1.8, y: -2.4 };

/**
 * Parky's face: a speech bubble in the brand's blue to green with big eyes that follow the mouse,
 * rosy cheeks and a smile, and for a hat a Ferris wheel with coloured cabins on an A-frame. It
 * blinks, shows its {@link ParkyMood}, and while `idle` fidgets, twirls, dances and reads, gets
 * bored when nobody moves (it yawns, whistles, blows gum, rolls its eyes, naps) and falls asleep
 * after a long quiet spell. The motion lives in `app/globals.css` (`.parky-*`) and only runs
 * without `prefers-reduced-motion`.
 */
export function ParkyLogo({
  className,
  mood,
  talking = false,
  idle = false,
}: {
  className?: string;
  mood?: ParkyMood | null;
  /** Shorthand for `mood="talking"`. */
  talking?: boolean;
  /** A life of its own while nothing happens: acts, boredom and sleep. */
  idle?: boolean;
}) {
  const state: ParkyMood | null = mood ?? (talking ? 'talking' : null);
  // Two marks are on screen at once (button and window header); each needs its own gradient id.
  const ground = useId();
  const svg = useRef<SVGSVGElement>(null);
  const mouseGaze = useGaze(svg);
  // A mood has its own motion; the idle life is for a face with nothing to do.
  const { act, asleep } = useIdleAct(idle && !state);
  const gaze =
    state === 'thinking'
      ? PONDER_GAZE
      : state === 'looking' || act === 'read'
        ? READING_GAZE
        : mouseGaze;
  const sleeping = asleep || act === 'nap';
  return (
    <svg
      ref={svg}
      viewBox="0 0 48 48"
      className={cn('size-8 overflow-visible', className)}
      style={act ? ({ '--parky-act': `${ACT_MS[act]}ms` } as React.CSSProperties) : undefined}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={ground} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={blue} />
          <stop offset="1" stopColor={green} />
        </linearGradient>
      </defs>
      {state === 'thinking' && (
        <g className="parky-thoughts" fill="white" stroke={blue} strokeWidth=".8">
          <circle cx="7" cy="9" r="1.5" />
          <circle cx="3.5" cy="4.5" r="2" />
          <circle cx="-1" cy="-1" r="2.7" />
          {/* The big cloud the small ones lead to, with dots that bob while Parky thinks. */}
          <ellipse className="parky-cloud" cx="-10" cy="-10" rx="10" ry="6.8" />
          <g className="parky-cloud-dots" fill={blue} stroke="none">
            <circle cx="-14.5" cy="-10" r="1.3" />
            <circle cx="-10" cy="-10" r="1.3" />
            <circle cx="-5.5" cy="-10" r="1.3" />
          </g>
        </g>
      )}
      {sleeping && (
        // Three Zs rising over the bubble's top left, away from the hat; once each in a nap.
        <g
          className={cn('parky-zzz', act === 'nap' && 'parky-zzz--nap')}
          fill="none"
          stroke={blue}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.5 6.5h3.4l-3.4 3.8h3.4" />
          <path d="M6.5 6.5h3.4l-3.4 3.8h3.4" />
          <path d="M6.5 6.5h3.4l-3.4 3.8h3.4" />
        </g>
      )}
      {(act === 'whistle' || act === 'dance') && (
        // Two notes drifting up beside the right cheek; outside the body, so they do not sway.
        <g className="parky-notes" strokeWidth=".9" strokeLinecap="round">
          {[
            { x: 42, y: 31, colour: blue },
            { x: 45, y: 26, colour: green },
          ].map((note) => (
            <g key={note.x} transform={`translate(${note.x} ${note.y})`}>
              <g className="parky-note" fill={note.colour} stroke={note.colour}>
                <ellipse rx="1.6" ry="1.15" transform="rotate(-20)" stroke="none" />
                <path d="M1.45-.4V-6.8q2.4.9 2.6 3.2" fill="none" />
              </g>
            </g>
          ))}
        </g>
      )}
      {act === 'startle' && (
        <g className="parky-alarm" fill={blue}>
          <path d="M7.5 0v5.2" stroke={blue} strokeWidth="2" strokeLinecap="round" />
          <circle cx="7.5" cy="8.4" r="1.15" />
        </g>
      )}
      <g
        key={act ?? state ?? (asleep ? 'asleep' : 'still')}
        className={cn(
          'parky-body',
          act && `parky-act-${act}`,
          state && `parky-mood-${state}`,
          asleep && 'parky-asleep'
        )}
      >
        {/* The hat: a Ferris wheel standing on Parky's head. */}
        <g
          className={cn(
            'parky-wheel',
            (state === 'talking' ||
              state === 'looking' ||
              act === 'spin' ||
              act === 'twirl' ||
              act === 'dance') &&
              'parky-wheel--turning'
          )}
        >
          {/* A light edge under the rim keeps the wheel legible on any page. */}
          <circle
            cx={HUB.x}
            cy={HUB.y}
            r={RIM}
            fill="none"
            stroke="white"
            strokeOpacity=".8"
            strokeWidth="2.6"
          />
          <circle cx={HUB.x} cy={HUB.y} r={RIM} fill="none" stroke={blue} strokeWidth="1.3" />
          <path d={SPOKES} stroke={blue} strokeOpacity=".75" strokeWidth=".55" />
          {CABINS.map((cabin, i) => (
            <circle
              key={`${cabin.x} ${cabin.y}`}
              cx={cabin.x}
              cy={cabin.y}
              r="1.45"
              fill={CABIN_COLOURS[i % CABIN_COLOURS.length]}
              stroke="white"
              strokeWidth=".5"
            />
          ))}
        </g>
        <path d={A_FRAME} stroke={frame} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={HUB.x} cy={HUB.y} r="1.3" fill="white" stroke={frame} strokeWidth=".8" />
        {/* The body: a round bubble with its tail at the lower left. */}
        <path
          d="M24 7c11 0 20 8.1 20 18.2S35 43.4 24 43.4c-2.5 0-4.9-.4-7.1-1.1L7.5 46l2.3-8C6.1 34.7 4 30.2 4 25.2 4 15.1 13 7 24 7Z"
          fill={`url(#${ground})`}
        />
        {!asleep && (
          // One group per eye, so a wink closes one and the gum makes them cross.
          <g className="parky-eyes">
            {EYES.map((x) => (
              <g key={x} className="parky-eye">
                <ellipse cx={x} cy="22.5" rx="5.4" ry="6.2" fill="white" />
                {/* A style, not the attribute, so the pupils ease to a new place. */}
                <g
                  className="parky-gaze"
                  style={{ transform: `translate(${gaze.x.toFixed(2)}px, ${gaze.y.toFixed(2)}px)` }}
                >
                  <g className="parky-pupils">
                    <circle cx={x} cy="23" r="3" fill={ink} />
                    <circle cx={x + 1.1} cy="21.7" r="1.05" fill="white" />
                  </g>
                </g>
              </g>
            ))}
          </g>
        )}
        {sleeping && (
          // In a nap the shut eyes cross-fade with the open ones; asleep they are all there is.
          <path
            className="parky-shut"
            d="M12.4 23.2q4.6 3.4 9.2 0M26.4 23.2q4.6 3.4 9.2 0"
            fill="none"
            stroke={ink}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}
        <ellipse cx="10.8" cy="31" rx="2.4" ry="1.4" fill="oklch(0.78 0.12 15)" opacity=".7" />
        <ellipse cx="37.2" cy="31" rx="2.4" ry="1.4" fill="oklch(0.78 0.12 15)" opacity=".7" />
        {state === 'talking' ? (
          <ellipse className="parky-mouth" cx="24" cy="33.5" rx="3" ry="2.2" fill={ink} />
        ) : (
          <path
            className="parky-smile"
            d="M20.5 32.5q3.5 3.2 7 0"
            fill="none"
            stroke={ink}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}
        {act === 'yawn' && (
          <g className="parky-yawn">
            <ellipse cx="24" cy="34" rx="3" ry="3.4" fill={ink} />
            <ellipse cx="24" cy="36.2" rx="1.8" ry="1" fill="oklch(0.7 0.15 15)" />
          </g>
        )}
        {(act === 'whistle' || act === 'gum') && (
          <circle className="parky-purse" cx="24.5" cy="33.3" r="1.4" fill={ink} />
        )}
        {act === 'gum' && (
          <>
            <g className="parky-gum">
              <circle
                cx="24.5"
                cy="39"
                r="7.5"
                fill={pink}
                stroke="oklch(0.68 0.16 355)"
                strokeWidth=".6"
              />
              <ellipse cx="21.6" cy="35.8" rx="2" ry="1.1" fill="white" opacity=".75" />
            </g>
            {/* The pop: short strokes around where the bubble was. */}
            <path
              className="parky-pop"
              d="M24.5 29.5v-2.2M32 32.2l1.6-1.5M17 32.2l-1.6-1.5M34.2 39h2.2M14.8 39h-2.2"
              stroke="white"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </>
        )}
        {(state === 'looking' || act === 'read') && (
          // An open book held below the eyes, where the mouth was; a page turns now and then.
          <g className="parky-book">
            <path d="M24 30 5 26v18.5l19 4Z" fill="white" stroke={blue} strokeWidth="1.1" />
            <path d="M24 30 43 26v18.5l-19 4Z" fill="white" stroke={blue} strokeWidth="1.1" />
            <path
              d="M8.5 30.4l12 2.5M8.5 33.6l12 2.5M8.5 36.8l12 2.5M8.5 40l9 1.9M27.5 32.9l12-2.5M27.5 36.1l12-2.5M27.5 39.3l12-2.5M27.5 42.5l9-1.9"
              stroke={blue}
              strokeOpacity=".45"
              strokeWidth=".8"
              strokeLinecap="round"
            />
            <path
              className="parky-page"
              d="M24 30 43 26v18.5l-19 4Z"
              fill="oklch(0.97 0.01 240)"
              stroke={blue}
              strokeWidth=".9"
            />
            <path d="M24 30v18.5" stroke={blue} strokeWidth="1.3" />
          </g>
        )}
      </g>
    </svg>
  );
}
