'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/** What Parky does while it thinks, one picked at random every couple of seconds. */
const THINKING = ['parky-act-hop', 'parky-act-tilt', 'parky-act-look', 'parky-act-spin'] as const;
const THINKING_MS = 2200;
/** How far a pupil may wander inside its eye, in the 48-unit drawing. */
const PUPIL_REACH = 2.2;
/** Now and then, while idle, a little act anyway: every 15 to 25 seconds. */
const IDLE_MIN_MS = 15_000;
const IDLE_SPREAD_MS = 10_000;

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
 * A random little act: every couple of seconds while `thinking`, now and then while `idle`, none
 * otherwise. An idle act runs once and clears, so the face rests between them.
 */
function useAct(thinking: boolean, idle: boolean) {
  const [act, setAct] = useState<(typeof THINKING)[number] | null>(null);
  useEffect(() => {
    if (!thinking && !idle) return;
    const pick = () => setAct(THINKING[Math.floor(Math.random() * THINKING.length)]);
    // One timer at a time, re-armed from its own callback, so cleanup always reaches it.
    let timer: ReturnType<typeof setTimeout>;
    if (thinking) {
      const loop = (wait: number) => {
        timer = setTimeout(() => {
          pick();
          loop(THINKING_MS);
        }, wait);
      };
      loop(0);
    } else {
      const loop = () => {
        timer = setTimeout(
          () => {
            pick();
            timer = setTimeout(() => {
              setAct(null);
              loop();
            }, THINKING_MS);
          },
          IDLE_MIN_MS + Math.random() * IDLE_SPREAD_MS
        );
      };
      loop();
    }
    return () => clearTimeout(timer);
  }, [thinking, idle]);
  return thinking || idle ? act : null;
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
 * rosy cheeks and a smile, and a small Ferris wheel for a hat. It blinks now and then, acts at
 * random while `idle`, and shows its {@link ParkyMood}. The motion lives in `app/globals.css`
 * (`.parky-*`) and only runs without `prefers-reduced-motion`.
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
  /** Now and then a little act while nothing happens, for the closed button. */
  idle?: boolean;
}) {
  const state: ParkyMood | null = mood ?? (talking ? 'talking' : null);
  // Two marks are on screen at once (button and window header); each needs its own gradient id.
  const ground = useId();
  const svg = useRef<SVGSVGElement>(null);
  const mouseGaze = useGaze(svg);
  const gaze = state === 'thinking' ? PONDER_GAZE : state === 'looking' ? READING_GAZE : mouseGaze;
  // A mood has its own motion; the random acts are for an idle face only.
  const act = useAct(false, idle && !state);
  const ink = 'oklch(0.25 0.03 240)';
  const blue = 'oklch(0.628 0.137 241.275)';
  return (
    <svg
      ref={svg}
      viewBox="0 0 48 48"
      className={cn('size-8 overflow-visible', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={ground} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={blue} />
          <stop offset="1" stopColor="oklch(0.752 0.181 146.391)" />
        </linearGradient>
      </defs>
      {state === 'thinking' && (
        <g
          className="parky-thoughts"
          fill="white"
          stroke="oklch(0.628 0.137 241.275)"
          strokeWidth=".8"
        >
          <circle cx="7" cy="9" r="1.5" />
          <circle cx="3.5" cy="4.5" r="2" />
          <circle cx="-1" cy="-1" r="2.7" />
          {/* The big cloud the small ones lead to, with dots that bob while Parky thinks. */}
          <ellipse className="parky-cloud" cx="-10" cy="-10" rx="10" ry="6.8" />
          <g className="parky-cloud-dots" fill="oklch(0.628 0.137 241.275)" stroke="none">
            <circle cx="-14.5" cy="-10" r="1.3" />
            <circle cx="-10" cy="-10" r="1.3" />
            <circle cx="-5.5" cy="-10" r="1.3" />
          </g>
        </g>
      )}
      <g
        key={act ?? state ?? 'still'}
        className={cn('parky-body', act, state && `parky-mood-${state}`)}
      >
        {/* The hat: a small Ferris wheel on the bubble's top right. */}
        <g
          className={cn(
            'parky-wheel',
            (state === 'talking' || state === 'looking' || act === 'parky-act-spin') &&
              'parky-wheel--turning'
          )}
        >
          <circle cx="36" cy="9" r="7" fill="white" stroke={blue} strokeWidth="1.6" />
          <path
            d="M36 2.5v13M29.5 9h13M31.4 4.4l9.2 9.2M40.6 4.4l-9.2 9.2"
            stroke={blue}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <circle cx="36" cy="9" r="1.6" fill="oklch(0.752 0.181 146.391)" />
        </g>
        {/* The body: a round bubble with its tail at the lower left. */}
        <path
          d="M24 7c11 0 20 8.1 20 18.2S35 43.4 24 43.4c-2.5 0-4.9-.4-7.1-1.1L7.5 46l2.3-8C6.1 34.7 4 30.2 4 25.2 4 15.1 13 7 24 7Z"
          fill={`url(#${ground})`}
        />
        <g className="parky-eyes">
          <ellipse cx="17" cy="22.5" rx="5.4" ry="6.2" fill="white" />
          <ellipse cx="31" cy="22.5" rx="5.4" ry="6.2" fill="white" />
          <g transform={`translate(${gaze.x.toFixed(2)} ${gaze.y.toFixed(2)})`}>
            <g className="parky-pupils">
              <circle cx="17" cy="23" r="3" fill={ink} />
              <circle cx="31" cy="23" r="3" fill={ink} />
              <circle cx="18.1" cy="21.7" r="1.05" fill="white" />
              <circle cx="32.1" cy="21.7" r="1.05" fill="white" />
            </g>
          </g>
        </g>
        <ellipse cx="10.8" cy="31" rx="2.4" ry="1.4" fill="oklch(0.78 0.12 15)" opacity=".7" />
        <ellipse cx="37.2" cy="31" rx="2.4" ry="1.4" fill="oklch(0.78 0.12 15)" opacity=".7" />
        {state === 'talking' ? (
          <ellipse className="parky-mouth" cx="24" cy="33.5" rx="3" ry="2.2" fill={ink} />
        ) : (
          <path
            d="M20.5 32.5q3.5 3.2 7 0"
            fill="none"
            stroke={ink}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}
        {state === 'looking' && (
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
