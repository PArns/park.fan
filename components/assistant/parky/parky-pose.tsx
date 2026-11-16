import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { ParkyEmptyKind } from '@/lib/analytics/parky-elements';
import { HANDLE_END, HEART, STAR, ZED, blue, gold, heartRed } from './drawing';
import {
  HolidayGround,
  HolidayMitten,
  HolidayParky,
  type HolidayEyes,
  type HolidayMouth,
} from './holiday-parky';
import { ParkyLensGlass, ParkyMap, ParkyNightcap, ParkyQuery } from './props';
import { ParkyAskButton } from './parky-ask-button';

/**
 * What a still Parky is doing where a page has nothing to show: `lost` (the 404) with his park map
 * upside down, `dizzy` (an error) after one ride too many, `smitten` (no favourites yet) with heart
 * eyes and a heart in his hands, `searching` (no search result) with the glass at his eye, and
 * `asleep` (the API is down) in his nightcap.
 */
export type ParkyPoseName = 'lost' | 'dizzy' | 'smitten' | 'searching' | 'asleep';

/** The three stars round a dizzy head: where each sits and how big, as offsets of `STAR`. */
const DIZZY_STARS = [
  { x: 9, y: 0, s: 1.15 },
  { x: -9, y: 0, s: 1 },
  { x: 0, y: -3, s: 0.8 },
];

/** The Zs of his sleep, rising off to the right, away from the nightcap's bobble. */
const ZEDS = [
  { x: 44, y: 8, s: 0.8 },
  { x: 49, y: 1, s: 1 },
  { x: 54, y: -6, s: 1.2 },
];

/** How each pose draws his eyes and his mouth. */
const FACE: Record<ParkyPoseName, { eyes: HolidayEyes; mouth: HolidayMouth }> = {
  lost: { eyes: { look: { x: 0, y: 1.8 } }, mouth: 'smile' },
  dizzy: { eyes: 'dizzy', mouth: 'woozy' },
  smitten: { eyes: 'hearts', mouth: 'grin' },
  searching: { eyes: { look: { x: 0.8, y: 0 } }, mouth: 'wonder' },
  asleep: { eyes: 'shut', mouth: 'smile' },
};

/** What each pose draws in or over his hands, last. */
function poseHands(pose: ParkyPoseName, ground: string): ReactNode {
  switch (pose) {
    case 'lost':
      return (
        <>
          <g transform="rotate(180 24 37.8)">
            <ParkyMap still />
          </g>
          <ParkyQuery />
        </>
      );
    case 'dizzy':
      return (
        <g fill={gold}>
          {DIZZY_STARS.map(({ x, y, s }) => (
            <path
              key={x}
              d={STAR}
              transform={`translate(${17 + x} ${3 + y}) scale(${s}) translate(-17 -3)`}
            />
          ))}
        </g>
      );
    case 'smitten':
      return (
        <>
          <path d={HEART} transform="translate(40 40) rotate(10) scale(1.15)" fill={heartRed} />
          <HolidayMitten ground={ground} x={34.5} y={42} />
          <HolidayMitten ground={ground} x={45.5} y={41} />
        </>
      );
    case 'searching':
      return (
        <>
          <ParkyLensGlass />
          <HolidayMitten ground={ground} x={HANDLE_END.x} y={HANDLE_END.y} />
          <ParkyQuery />
        </>
      );
    case 'asleep':
      return (
        <g
          fill="none"
          stroke={blue}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:stroke-[oklch(0.82_0.09_235)]"
        >
          {ZEDS.map(({ x, y, s }) => (
            <path
              key={x}
              d={ZED}
              transform={`translate(${x} ${y}) scale(${s}) translate(-8.2 -8.4)`}
            />
          ))}
        </g>
      );
  }
}

/**
 * A still Parky for an empty or error state, in one of his {@link ParkyPoseName} poses, with his
 * one line under him when `line` is given. Built from the live drawing's pieces (`HolidayParky`,
 * the map, the glass, the nightcap), and entirely still: these states are read, not watched. The
 * picture is decorative (`aria-hidden`); the line is real text. With `ask`, a „Frag Parky“ button
 * under them opens the chat with `ask.question` and counts as the empty state `ask.kind`
 * ({@link ParkyAskButton}). `className` sizes the picture.
 */
export function ParkyPose({
  pose,
  line,
  ask,
  className,
}: {
  pose: ParkyPoseName;
  line?: string;
  ask?: { question: string; kind: ParkyEmptyKind };
  className?: string;
}) {
  const ground = `${useId()}ground`;
  const figure = (
    <HolidayParky
      ground={ground}
      {...FACE[pose]}
      hat={pose === 'asleep' ? <ParkyNightcap still /> : undefined}
      hands={poseHands(pose, ground)}
    />
  );
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="-8 -12 64 64"
        className={cn('block size-28', className)}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <HolidayGround id={ground} />
        </defs>
        <ellipse cx="24" cy="48.6" rx="15" ry="2" className="fill-foreground/10" />
        {/* Dizzy, he leans a little off his feet. */}
        {pose === 'dizzy' ? <g transform="rotate(-6 24 46)">{figure}</g> : figure}
      </svg>
      {line && <p className="text-muted-foreground mt-2 max-w-xs text-sm text-balance">{line}</p>}
      {ask && <ParkyAskButton question={ask.question} kind={ask.kind} />}
    </div>
  );
}
