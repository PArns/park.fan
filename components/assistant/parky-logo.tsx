'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { pickRandom } from '@/lib/utils/pick-random';
import { parkyBoredom } from '@/lib/assistant/parky-boredom';
import { useParkyBoredom } from '@/lib/assistant/use-parky-boredom';
import { useSearchOpen } from '@/lib/analytics/search-presence';
import { onSiteEvent } from '@/lib/analytics/site-analytics';
import type { ParkyReactionAct } from '@/lib/assistant/reactions';
import {
  REST,
  RIDE_MOTION,
  RIDES,
  rideKeyframe,
  type ParkyRide,
} from '@/lib/assistant/parky-rides';

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
  coaster: 3600,
  launch: 4400,
  hills: 4800,
  tower: 4200,
  dizzy: 2700,
  plan: 4200,
  cheer: 2400,
  love: 2600,
  bell: 2200,
  shades: 3000,
  lights: 3400,
} as const satisfies Record<string, number> &
  Record<ParkyRide, number> &
  Record<ParkyReactionAct, number>;
type ParkyAct = keyof typeof ACT_MS;

/** An act that always comes straight after another: off any ride, Parky is dizzy. */
const FOLLOW_UP: Partial<Record<ParkyAct, ParkyAct>> = {
  coaster: 'dizzy',
  launch: 'dizzy',
  hills: 'dizzy',
  tower: 'dizzy',
};

/**
 * An act asked for from outside, to play at once: the ride an easter egg ends with (`ride` for any
 * of them), or Parky's answer to something the visitor did. A new `id` plays it again.
 */
export interface ParkyCue {
  act: ParkyRide | ParkyReactionAct | 'ride';
  id: number;
}

/** An act by name, or a random ride for `ride`. */
function actFor(act: ParkyAct | 'ride'): ParkyAct {
  return act === 'ride' ? pickRandom(RIDES) : act;
}

/** With company Parky fidgets and shows off; once nobody moves it yawns, reads and naps. */
const ACTS: Record<'awake' | 'bored', readonly (ParkyAct | 'ride')[]> = {
  // Now and then a ride, any of the four, as one act among the rest.
  awake: [
    'hop',
    'tilt',
    'look',
    'spin',
    'wink',
    'wiggle',
    'roll',
    'twirl',
    'dance',
    'read',
    'ride',
  ],
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

/**
 * The coaster's loop: Parky turns about its centre, so the car's wheels, 33 units below it, run
 * round the inner rail. The stylesheet's `.parky-act-coaster` turns about the same point.
 */
const LOOP = { x: 24, y: 16, r: 33 };
const rail = 'oklch(0.6 0.19 25)';

/**
 * The magnifying glass Parky holds to its right eye while a search is open: the lens round the eye,
 * the handle running off down to the right. It swings in from the handle's end.
 */
const LENS = { x: EYES[1], y: 22.5, r: 7.6 };
const onHandle = (distance: number) => ({
  x: +(LENS.x + distance * Math.SQRT1_2).toFixed(2),
  y: +(LENS.y + distance * Math.SQRT1_2).toFixed(2),
});
const handlePart = (from: number, to: number) =>
  `M${onHandle(from).x} ${onHandle(from).y}L${onHandle(to).x} ${onHandle(to).y}`;
const HANDLE_LENGTH = 10.5;
const FERRULE = handlePart(LENS.r, LENS.r + 2.8);
const HANDLE = handlePart(LENS.r + 2.8, LENS.r + HANDLE_LENGTH);
const HANDLE_END = onHandle(LENS.r + HANDLE_LENGTH);
/** How long the glass takes to go once the search has closed; the stylesheet reads `--parky-act`. */
const LENS_OUT_MS = 400;
/** How long a question mark hangs over Parky after a search found nothing. */
const PUZZLED_MS = 1800;

/** A heart about 10 units wide round the origin, for heart eyes and the ones floating up. */
const HEART =
  'M0 4C-1.4 2.9-5 .6-5-2.3-5-4.2-3.6-5.3-2.2-5.2-1.2-5.1-.4-4.4 0-3.6.4-4.4 1.2-5.1 2.2-5.2 3.6-5.3 5-4.2 5-2.3 5 .6 1.4 2.9 0 4Z';
const heartRed = 'oklch(0.64 0.22 15)';

/**
 * Confetti for a cheer: pieces shot up and out from behind the head, fanned from right to left,
 * each with its own reach and spin, then falling away.
 */
const CONFETTI = Array.from({ length: 14 }, (_, i) => {
  const angle = Math.PI * (0.06 + (0.88 * i) / 13);
  const reach = 14 + (i % 3) * 6;
  return {
    dx: +(Math.cos(angle) * reach).toFixed(1),
    dy: +(-Math.sin(angle) * reach).toFixed(1),
    spin: (i % 2 ? 1 : -1) * (200 + i * 35),
    round: i % 3 === 0,
  };
});

/** Where the two notes, or hearts, float up beside the right cheek. */
const FLOATERS = [
  { x: 42, y: 31, colour: blue },
  { x: 45, y: 26, colour: green },
];

/** Where the night's two stars sit, as offsets of {@link STAR}: left of the moon, above the head. */
const NIGHT_STARS = [
  { x: -18.5, y: 6 },
  { x: -2.5, y: -5.5 },
];

/** The rows of the checklist Parky ticks off for a day plan. */
const CHECKLIST_ROWS = [35, 39, 43];

/** A four-pointed star at the centre of the orbit dizzy stars run round, above the left eye. */
const STAR = 'M17 .2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z';
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
function useIdleAct(enabled: boolean, cue: ParkyCue | null) {
  const boredom = useParkyBoredom(enabled);
  const [act, setAct] = useState<ParkyAct | null>(null);
  // A cue already there when the face mounts (the button back after the window closed) is old.
  const played = useRef(cue?.id);
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
          const after = FOLLOW_UP[next];
          if (after) play(0, after);
          else loop();
        }, ACT_MS[next]);
      }, wait);
    };
    const loop = () => {
      // Asleep, the doze is the last act: the sleeping face takes over until somebody moves.
      if (boredom === 'asleep') return;
      const [shortest, spread] = PAUSE_MS[boredom];
      const next = pickRandom(ACTS[boredom], previous);
      play(shortest + Math.random() * spread, actFor(next));
    };
    if (cue && cue.id !== played.current) {
      played.current = cue.id;
      play(0, actFor(cue.act));
    } else if (boredom === 'asleep') play(SETTLE_MS, 'doze');
    else if (boredom === 'bored') play(SETTLE_MS, 'yawn');
    else if (woke) play(0, 'startle');
    else loop();
    return () => {
      clearTimeout(timer);
      setAct(null);
    };
  }, [boredom, cue]);
  return { act, asleep: boredom === 'asleep' && act === null };
}

/**
 * Parky searching along while a search is open on the page ({@link useSearchOpen}): `searching`
 * while one is, `done` for the moment the glass takes to go after it closed, `null` otherwise;
 * `puzzled` for a moment after the search found nothing.
 */
function useSearchAlong(enabled: boolean) {
  const open = useSearchOpen() && enabled;
  const [puzzled, setPuzzled] = useState(false);
  useEffect(() => {
    if (!open) return;
    let timer: ReturnType<typeof setTimeout>;
    const stop = onSiteEvent((name) => {
      if (name !== 'search_no_results') return;
      clearTimeout(timer);
      setPuzzled(true);
      timer = setTimeout(() => setPuzzled(false), PUZZLED_MS);
    });
    return () => {
      stop();
      clearTimeout(timer);
    };
  }, [open]);
  const [wasOpen, setWasOpen] = useState(open);
  const [leaving, setLeaving] = useState(false);
  if (wasOpen !== open) {
    setWasOpen(open);
    setLeaving(!open);
  }
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setLeaving(false), LENS_OUT_MS);
    return () => clearTimeout(timer);
  }, [leaving]);
  return {
    search: open ? ('searching' as const) : leaving ? ('done' as const) : null,
    puzzled: open && puzzled,
  };
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

/** Where the pupils rest while Parky searches: a little down, at the page, scanning across it. */
const SEARCH_GAZE = { x: 0, y: 0.8 };

/** Where the pupils rest while a bell rings: up, at it, over the left eye. */
const BELL_GAZE = { x: -1.8, y: -2.2 };

/**
 * Parky's face: a speech bubble in the brand's blue to green with big eyes that follow the mouse,
 * rosy cheeks and a smile, and for a hat a Ferris wheel with coloured cabins on an A-frame. It
 * blinks, shows its {@link ParkyMood}, and while `idle` fidgets, twirls, dances and reads, gets
 * bored when nobody moves (it yawns, whistles, blows gum, rolls its eyes, naps) and falls asleep
 * after a long quiet spell. While a search is open on the page it searches along, a magnifying
 * glass to its eye, leaning in at each keystroke. The motion lives in `app/globals.css`
 * (`.parky-*`) and only runs without `prefers-reduced-motion`.
 */
export function ParkyLogo({
  className,
  mood,
  talking = false,
  idle = false,
  cue = null,
}: {
  className?: string;
  mood?: ParkyMood | null;
  /** Shorthand for `mood="talking"`. */
  talking?: boolean;
  /** A life of its own while nothing happens: acts, boredom and sleep. */
  idle?: boolean;
  /** An act to play at once, with `idle`. */
  cue?: ParkyCue | null;
}) {
  const state: ParkyMood | null = mood ?? (talking ? 'talking' : null);
  // Two marks are on screen at once (button and window header); each needs its own gradient id.
  const ground = useId();
  const svg = useRef<SVGSVGElement>(null);
  const mouseGaze = useGaze(svg);
  // A mood has its own motion; the idle life is for a face with nothing to do, and a search open
  // on the page is something to do.
  const { search, puzzled } = useSearchAlong(idle && !state);
  const { act, asleep } = useIdleAct(idle && !state && !search, cue);
  const searching = search === 'searching';
  const gaze =
    state === 'thinking' || act === 'lights'
      ? PONDER_GAZE
      : state === 'looking' || act === 'read' || act === 'plan'
        ? READING_GAZE
        : act === 'bell'
          ? BELL_GAZE
          : searching
            ? SEARCH_GAZE
            : mouseGaze;
  // Heart eyes and the cheer's happy squint take the place of the open eyes.
  const eyesOpen = !asleep && act !== 'love' && act !== 'cheer';
  const sleeping = asleep || act === 'nap';
  const ride =
    act !== null && (RIDES as readonly string[]).includes(act) ? (act as ParkyRide) : null;
  const motion = ride && ride !== 'coaster' ? RIDE_MOTION[ride] : null;
  // The rides beyond the loop move the whole face along their track, played from the same
  // geometry the rails are drawn from; the hat lifts off its head in the free fall.
  const body = useRef<SVGGElement>(null);
  const hat = useRef<SVGGElement>(null);
  useEffect(() => {
    if (!motion || !ride || !body.current) return;
    const timing = { duration: ACT_MS[ride], fill: 'both' as const };
    const runs = [body.current.animate(motion.stops.map(rideKeyframe), timing)];
    if (motion.hat && hat.current) {
      const lifts = motion.hat.map(({ at, lift }) => ({
        offset: at,
        transform: `translateY(${-lift}px)`,
      }));
      runs.push(hat.current.animate(lifts, timing));
    }
    return () => runs.forEach((run) => run.cancel());
  }, [motion, ride]);
  // Each keystroke in the search, Parky leans the glass in for a closer look.
  const lens = useRef<SVGGElement>(null);
  useEffect(() => {
    if (!searching || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let run: Animation | undefined;
    const onInput = () => {
      run?.cancel();
      run = lens.current?.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }, { transform: 'scale(1)' }],
        { duration: 280, easing: 'ease-out' }
      );
    };
    document.addEventListener('input', onInput, true);
    return () => {
      document.removeEventListener('input', onInput, true);
      run?.cancel();
    };
  }, [searching]);
  const length = act ? ACT_MS[act] : search === 'done' ? LENS_OUT_MS : puzzled ? PUZZLED_MS : null;
  return (
    <svg
      ref={svg}
      viewBox="0 0 48 48"
      className={cn('size-8 overflow-visible', className)}
      style={length ? ({ '--parky-act': `${length}ms` } as React.CSSProperties) : undefined}
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
      {act === 'cheer' && (
        // Behind the body, so the pieces come out from behind the head.
        <g className="parky-confetti" transform="translate(24 14)">
          {CONFETTI.map((piece, i) => {
            const style = {
              '--dx': `${piece.dx}px`,
              '--dy': `${piece.dy}px`,
              '--spin': `${piece.spin}deg`,
            } as React.CSSProperties;
            const fill = [...CABIN_COLOURS, blue][i % 5];
            return piece.round ? (
              <circle key={i} r="1.3" fill={fill} style={style} />
            ) : (
              <rect key={i} x="-1.6" y="-.8" width="3.2" height="1.6" fill={fill} style={style} />
            );
          })}
        </g>
      )}
      {act === 'lights' && (
        // Night over the top left: a crescent moon and two stars that twinkle.
        <g className="parky-night">
          <path d="M6 -2a4 4 0 1 0 4.2 5.3 3.2 3.2 0 1 1-4.2-5.3Z" fill="oklch(0.9 0.1 95)" />
          <g fill="oklch(0.92 0.08 95)">
            {NIGHT_STARS.map((star) => (
              <g key={star.x} transform={`translate(${star.x} ${star.y})`}>
                <path className="parky-twinkle" d={STAR} />
              </g>
            ))}
          </g>
        </g>
      )}
      {puzzled && (
        // A question mark over the top left: the search found nothing.
        <g className="parky-alarm parky-query">
          <path
            d="M5.1 3.4a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.1.9-1.1 1.8"
            fill="none"
            stroke={blue}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle cx="7.5" cy="10.2" r="1.1" fill={blue} />
        </g>
      )}
      {act === 'bell' && (
        // A bell over the top left, swinging from its top, with the ring on either side.
        <g className="parky-alarm parky-bell">
          <g className="parky-bell-swing">
            <path
              d="M7.5.6c-2.5 0-3.8 1.9-3.8 4.4v2.6l-1.3 1.7h10.2l-1.3-1.7V5c0-2.5-1.3-4.4-3.8-4.4Z"
              fill="oklch(0.85 0.15 88)"
              stroke="oklch(0.6 0.13 70)"
              strokeWidth=".6"
            />
            <circle cx="7.5" cy="10.4" r="1.1" fill="oklch(0.6 0.13 70)" />
          </g>
          <path
            className="parky-ring"
            d="M1.2 2.2q-1.6 2.8 0 5.6M13.8 2.2q1.6 2.8 0 5.6"
            fill="none"
            stroke={blue}
            strokeWidth=".9"
            strokeLinecap="round"
          />
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
      {(act === 'whistle' || act === 'dance' || act === 'love') && (
        // Two notes, or two hearts, drifting up beside the right cheek; outside the body, so they
        // do not sway.
        <g className="parky-notes" strokeWidth=".9" strokeLinecap="round">
          {FLOATERS.map((note) => (
            <g key={note.x} transform={`translate(${note.x} ${note.y})`}>
              {act === 'love' ? (
                <g className="parky-note">
                  <path d={HEART} transform="scale(.6)" fill={heartRed} />
                </g>
              ) : (
                <g className="parky-note" fill={note.colour} stroke={note.colour}>
                  <ellipse rx="1.6" ry="1.15" transform="rotate(-20)" stroke="none" />
                  <path d="M1.45-.4V-6.8q2.4.9 2.6 3.2" fill="none" />
                </g>
              )}
            </g>
          ))}
        </g>
      )}
      {act === 'coaster' && (
        // Two rails with ties between them, outside the body, so they stand while Parky turns.
        <g className="parky-track" fill="none" stroke={rail}>
          <circle cx={LOOP.x} cy={LOOP.y} r={LOOP.r} strokeWidth="1" />
          <circle cx={LOOP.x} cy={LOOP.y} r={LOOP.r + 2.4} strokeWidth="1" />
          <circle
            cx={LOOP.x}
            cy={LOOP.y}
            r={LOOP.r + 1.2}
            strokeWidth="2.2"
            strokeDasharray=".6 2.4"
            strokeOpacity=".7"
          />
        </g>
      )}
      {motion && ride === 'tower' && (
        // The tower: a mast behind Parky with rungs, up which the seat is pulled.
        <g className="parky-track" fill="none" stroke={rail}>
          <path d={motion.track} strokeWidth="3.2" strokeOpacity=".85" />
          <path d={motion.track} stroke="white" strokeOpacity=".5" strokeDasharray=".6 4" />
        </g>
      )}
      {motion && ride !== 'tower' && (
        <g className="parky-track" fill="none" stroke={rail} strokeLinejoin="round">
          <path d={motion.track} strokeWidth="2.6" />
          <path
            d={motion.track}
            stroke="white"
            strokeOpacity=".55"
            strokeWidth=".7"
            strokeDasharray=".5 2.2"
          />
        </g>
      )}
      {act === 'startle' && (
        <g className="parky-alarm" fill={blue}>
          <path d="M7.5 0v5.2" stroke={blue} strokeWidth="2" strokeLinecap="round" />
          <circle cx="7.5" cy="8.4" r="1.15" />
        </g>
      )}
      <g
        key={act ?? state ?? (search ? 'search' : asleep ? 'asleep' : 'still')}
        ref={body}
        className={cn(
          'parky-body',
          act && `parky-act-${act}`,
          state && `parky-mood-${state}`,
          asleep && 'parky-asleep',
          searching && 'parky-searching'
        )}
      >
        {/* The hat: a Ferris wheel standing on Parky's head. */}
        <g ref={hat}>
          <g
            className={cn(
              'parky-wheel',
              (state === 'talking' ||
                state === 'looking' ||
                act === 'spin' ||
                act === 'twirl' ||
                ride ||
                act === 'dance' ||
                act === 'cheer' ||
                act === 'lights' ||
                searching) &&
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
            {act === 'lights' &&
              // Lit up for the night: a glow round every cabin, twinkling one after another.
              CABINS.map((cabin, i) => (
                <circle
                  key={`glow ${cabin.x} ${cabin.y}`}
                  className="parky-glow"
                  cx={cabin.x}
                  cy={cabin.y}
                  r="2.8"
                  fill="oklch(0.92 0.16 95)"
                  style={{ animationDelay: `${(-i * 0.15).toFixed(2)}s` }}
                />
              ))}
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
        </g>
        {/* The body: a round bubble with its tail at the lower left. */}
        <path
          d="M24 7c11 0 20 8.1 20 18.2S35 43.4 24 43.4c-2.5 0-4.9-.4-7.1-1.1L7.5 46l2.3-8C6.1 34.7 4 30.2 4 25.2 4 15.1 13 7 24 7Z"
          fill={`url(#${ground})`}
        />
        {eyesOpen && (
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
        {act === 'love' && (
          // Heart eyes, beating.
          <g fill={heartRed}>
            {EYES.map((x) => (
              <g key={x} transform={`translate(${x} 23)`}>
                <path className="parky-heart" d={HEART} />
              </g>
            ))}
          </g>
        )}
        {act === 'cheer' && (
          // A happy squint, the eyes turned up into arcs.
          <path
            d="M12.6 24.2q4.4-5 8.8 0M26.6 24.2q4.4-5 8.8 0"
            fill="none"
            stroke={ink}
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
        {act === 'shades' && (
          // Sunglasses, slid down from the hat onto the eyes.
          <g className="parky-shades">
            <path d="M10 17h28" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
            <path d="M10.6 17H23v6.2c0 3.2-2.6 5.4-6.2 5.4s-6.2-2.2-6.2-5.4Z" fill={ink} />
            <path d="M25 17h12.4v6.2c0 3.2-2.6 5.4-6.2 5.4S25 26.4 25 23.2Z" fill={ink} />
            <path
              d="M13 19.4h3.2M27.4 19.4h3.2"
              stroke="white"
              strokeOpacity=".55"
              strokeWidth=".9"
              strokeLinecap="round"
            />
          </g>
        )}
        <ellipse cx="10.8" cy="31" rx="2.4" ry="1.4" fill="oklch(0.78 0.12 15)" opacity=".7" />
        <ellipse cx="37.2" cy="31" rx="2.4" ry="1.4" fill="oklch(0.78 0.12 15)" opacity=".7" />
        {state === 'talking' ? (
          <ellipse className="parky-mouth" cx="24" cy="33.5" rx="3" ry="2.2" fill={ink} />
        ) : searching ? (
          // Concentrating: the mouth pulled to one side, the tip of the tongue out.
          <g className="parky-focus">
            <ellipse cx="25.9" cy="34.5" rx="1.4" ry="1.1" fill="oklch(0.7 0.15 15)" />
            <path
              d="M21.2 33.2q2.6 1.5 5.6.2"
              fill="none"
              stroke={ink}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </g>
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
        {act === 'dizzy' && (
          <>
            <path
              className="parky-woozy"
              d="M19.5 33.5q1.25-1.6 2.5 0t2.5 0 2.5 0"
              fill="none"
              stroke={ink}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Three stars round the head, each a third of the way behind the one before. */}
            <g className="parky-stars" fill="oklch(0.86 0.15 90)">
              <path d={STAR} />
              <path d={STAR} />
              <path d={STAR} />
            </g>
          </>
        )}
        {(ride || act === 'cheer') && (
          <path className="parky-grin" d="M20 31.5h8q0 5.5-4 5.5t-4-5.5Z" fill={ink} />
        )}
        {ride && (
          <>
            {/* The car Parky rides in, its wheels on the rail at the resting point. */}
            <g className="parky-car">
              <path d="M7 38h34l-2.5 7.5h-29Z" fill={rail} />
              <path d="M7 38h34" stroke="white" strokeOpacity=".6" strokeWidth=".8" />
              <circle cx="14" cy={REST.y - 2} r="2" fill={ink} />
              <circle cx="34" cy={REST.y - 2} r="2" fill={ink} />
            </g>
          </>
        )}
        {search && (
          // The glass over the right eye, which the stylesheet makes big behind it.
          <g
            className={cn('parky-lens', !searching && 'parky-lens--out')}
            style={{
              transformBox: 'view-box',
              transformOrigin: `${HANDLE_END.x}px ${HANDLE_END.y}px`,
            }}
          >
            <g
              ref={lens}
              style={{ transformBox: 'view-box', transformOrigin: `${LENS.x}px ${LENS.y}px` }}
            >
              <path
                d={HANDLE}
                stroke="oklch(0.56 0.12 55)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path d={FERRULE} stroke={ink} strokeWidth="3.8" />
              <circle
                cx={LENS.x}
                cy={LENS.y}
                r={LENS.r}
                fill="oklch(0.92 0.04 230)"
                fillOpacity=".22"
                stroke={ink}
                strokeWidth="1.7"
              />
              <circle
                cx={LENS.x}
                cy={LENS.y}
                r={LENS.r - 1}
                fill="none"
                stroke="white"
                strokeOpacity=".5"
                strokeWidth=".5"
              />
              {/* The glint, top left in the glass. */}
              <path
                d={`M${LENS.x - 4.8} ${LENS.y - 2.9}a5.4 5.4 0 0 1 3.2-3`}
                fill="none"
                stroke="white"
                strokeOpacity=".85"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </g>
          </g>
        )}
        {act === 'plan' && (
          // A clipboard with a checklist, held below the eyes; the rows are ticked off one by one.
          <g className="parky-book parky-clipboard">
            <rect x="12" y="29" width="24" height="19.5" rx="2" fill="oklch(0.62 0.1 60)" />
            <rect x="14" y="31.4" width="20" height="15.6" rx="1" fill="white" />
            <rect x="21.5" y="27.4" width="5" height="3.4" rx="1.1" fill={ink} />
            {CHECKLIST_ROWS.map((y) => (
              <g key={y}>
                <rect
                  x="16"
                  y={y - 1.4}
                  width="2.8"
                  height="2.8"
                  rx=".5"
                  fill="none"
                  stroke={blue}
                  strokeWidth=".7"
                />
                <path
                  d={`M20.8 ${y}h10.6`}
                  stroke={blue}
                  strokeOpacity=".45"
                  strokeWidth=".9"
                  strokeLinecap="round"
                />
                <path
                  className="parky-tick"
                  d={`M16.1 ${y}l1.3 1.3 2.6-3.4`}
                  pathLength={1}
                  fill="none"
                  stroke="oklch(0.6 0.17 146)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ))}
          </g>
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
