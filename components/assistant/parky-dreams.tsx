'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CABIN_COLOURS, STAR, blue, capBlue, gold, ink, rail } from './parky-drawing';

/**
 * What Parky dreams of, in a cloud over his sleeping head: riding a coaster, cheering under
 * confetti, a fairy-tale castle rising under a shooting star, fireworks over the castle, a log boat
 * plunging into a splash, or a Ferris wheel at night with its cabins lit.
 */
export const DREAMS = ['coaster', 'cheer', 'castle', 'fireworks', 'flume', 'wheel'] as const;
/** One of Parky's dreams. */
export type ParkyDream = (typeof DREAMS)[number];
/** How long a dream lasts; the stylesheet reads it as `--parky-dream`. */
export const DREAM_MS = 6_500;

/**
 * The track Parky's dream coaster runs on: in from the left, once round a loop and out to the
 * right, all of it inside the cloud so the train is always in view.
 */
const DREAM_TRACK =
  'M-22.5 -7.5L-16 -7.5C-11 -7.5-8 -10.5-8 -14.5A4.5 4.5 0 0 0-17 -14.5C-17 -10.5-14 -7.5-9 -7.5L-2.5 -7.5';
/**
 * The dream cloud's size and place: half again as large as it is drawn, its lower edge on the last
 * puff and its left edge 34 units off the drawing, which the homepage hero's 80 px margin holds.
 */
const DREAM_CLOUD_SCALE = 'translate(4 -6) scale(1.5) translate(2 6)';
/** One lap of the dream train, and the points along the track its motion is drawn through. */
const TRAIN_LAP_MS = 3_200;
const TRAIN_STEPS = 32;
/** The castle's walls and its roofs, pastel against the night of the cloud. */
const CASTLE_WALL = 'oklch(0.86 0.06 340)';
const CASTLE_ROOF = 'oklch(0.58 0.15 265)';

/** Where the fireworks burst over the castle, each in its own colour. */
const BURSTS = [
  { x: -21, y: -17, colour: CABIN_COLOURS[0] },
  { x: -4.5, y: -16.5, colour: gold },
  { x: -13, y: -19.5, colour: CABIN_COLOURS[2] },
];
/** A burst's rays round its middle: eight short strokes pointing out. */
const RAYS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i * Math.PI) / 4;
  const at = (r: number) =>
    `${(r * Math.cos(angle)).toFixed(2)} ${(r * Math.sin(angle)).toFixed(2)}`;
  return `M${at(1.1)}L${at(3.2)}`;
}).join('');

/** The dream Ferris wheel's hub and radius, and its eight cabins. */
const DREAM_WHEEL = { x: -12.5, y: -14.5, r: 6.5 };
const DREAM_CABINS = Array.from({ length: 8 }, (_, i) => ({
  x: +(DREAM_WHEEL.x + DREAM_WHEEL.r * Math.sin((i * Math.PI) / 4)).toFixed(2),
  y: +(DREAM_WHEEL.y - DREAM_WHEEL.r * Math.cos((i * Math.PI) / 4)).toFixed(2),
}));

/** Where the drops of the dream flume's splash fly to. */
const DREAM_DROPS = [
  { dx: -2.4, dy: -3.4 },
  { dx: -0.6, dy: -4.6 },
  { dx: 1.4, dy: -4 },
  { dx: 3, dy: -2.6 },
];

/** The dream castle, its foot on the cloud's floor. */
function DreamCastle() {
  return (
    <>
      <path d="M-19 -4V-11H-6V-4Z" fill={CASTLE_WALL} />
      <path
        d="M-20.5 -4V-14H-17.5V-4ZM-7.5 -4V-14H-4.5V-4ZM-14.5 -4V-16.5H-10.5V-4Z"
        fill={CASTLE_WALL}
      />
      <path
        d="M-21 -14L-19 -18.5L-17 -14ZM-8 -14L-6 -18.5L-4 -14ZM-15 -16.5L-12.5 -22.5L-10 -16.5Z"
        fill={CASTLE_ROOF}
      />
      <path d="M-12.5 -22.5V-24.5L-11 -24" stroke={rail} strokeWidth=".4" fill={rail} />
      <path d="M-13.8 -4V-6.6A1.3 1.3 0 0 1-11.2 -6.6V-4Z" fill={CASTLE_ROOF} />
    </>
  );
}

/** A night sky filling the cloud, for the dreams that need the dark. */
function DreamNight() {
  return (
    <>
      <rect x="-28" y="-24" width="31" height="20" fill={capBlue} />
      {/* Two stars, the CSS twinkle on the path and the place on its group. */}
      <g fill="oklch(0.92 0.08 95)">
        <g transform="translate(-32.2 -21.8) scale(.6)">
          <path className="parky-dream-sparkle" d={STAR} />
        </g>
        <g transform="translate(-11.5 -12.5) scale(.5)">
          <path className="parky-dream-sparkle" d={STAR} style={{ animationDelay: '.6s' }} />
        </g>
      </g>
    </>
  );
}

/**
 * Parky's dream in a cloud over his sleeping head, led to by three little puffs as his thoughts
 * are (`DREAMS`). The scene stays inside the cloud (`clipPath`); the motion is CSS
 * (`.parky-dream-*`), and the coaster's train a web animation along its track.
 */
export function ParkyDreamCloud({ dream, ground }: { dream: ParkyDream; ground: string }) {
  const clip = `${ground}-dream`;
  const track = useRef<SVGPathElement>(null);
  const train = useRef<SVGGElement>(null);
  // The train runs the track, measured off the path itself, nose along the rail; a web animation,
  // so it keeps the document's clock like the CSS around it.
  useEffect(() => {
    const path = track.current;
    const cars = train.current;
    if (dream !== 'coaster' || !path || !cars) return;
    const length = path.getTotalLength();
    let angle = 0;
    const frames = Array.from({ length: TRAIN_STEPS + 1 }, (_, i) => {
      const at = (i / TRAIN_STEPS) * length;
      const here = path.getPointAtLength(at);
      const ahead = path.getPointAtLength(Math.min(length, at + 0.5));
      const behind = path.getPointAtLength(Math.max(0, at - 0.5));
      const heading = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      // atan2 flips from 180° to -180° upside down at the loop's top; the frames between would
      // spin the car the long way round, so each angle stays within half a turn of the last.
      angle += ((((heading - angle + 180) % 360) + 360) % 360) - 180;
      return {
        transform: `translate(${here.x.toFixed(2)}px, ${here.y.toFixed(2)}px) rotate(${angle.toFixed(1)}deg)`,
      };
    });
    const run = cars.animate(frames, { duration: TRAIN_LAP_MS, iterations: Infinity });
    return () => run.cancel();
  }, [dream]);
  return (
    <g className={cn('parky-dream', `parky-dream--${dream}`)}>
      <g fill="white" stroke={blue} strokeWidth=".8">
        <circle className="parky-dream-puff" cx="7" cy="9" r="1.4" />
        <circle className="parky-dream-puff" cx="3.6" cy="4.4" r="1.9" />
        <circle className="parky-dream-puff" cx="-0.6" cy="-0.6" r="2.5" />
      </g>
      {/* The cloud and its scene are drawn at one size and scaled up from the corner the puffs
          lead to, so the scene reads at a glance; the stroke keeps its width. */}
      <g transform={DREAM_CLOUD_SCALE}>
        <clipPath id={clip}>
          <ellipse cx="-12.5" cy="-14" rx="14.2" ry="9.6" />
        </clipPath>
        <ellipse
          className="parky-dream-cloud"
          cx="-12.5"
          cy="-14"
          rx="15"
          ry="10.4"
          fill="white"
          stroke={blue}
          strokeWidth=".8"
          vectorEffect="non-scaling-stroke"
        />
        <g clipPath={`url(#${clip})`} className="parky-dream-scene">
          {dream === 'coaster' && (
            <>
              <circle cx="-20.5" cy="-17.5" r="1.6" fill={gold} />
              <path d="M-19 -7.5V-4M-6 -7.5V-4" stroke={ink} strokeWidth=".5" opacity=".35" />
              <path
                ref={track}
                d={DREAM_TRACK}
                fill="none"
                stroke={rail}
                strokeWidth="1"
                strokeLinecap="round"
              />
              <g ref={train}>
                {/* A car on the rail, nose ahead, with Parky in it, arms up. */}
                <rect x="-2.6" y="-2.6" width="5.2" height="2.4" rx=".8" fill={CABIN_COLOURS[1]} />
                <circle cx=".2" cy="-3.9" r="1.6" fill={`url(#${ground})`} />
                <path
                  d="M-1.1 -4.9L-2 -6.9M1.5 -4.9L2.4 -6.9"
                  stroke={blue}
                  strokeWidth=".55"
                  strokeLinecap="round"
                />
              </g>
            </>
          )}
          {dream === 'cheer' && (
            <>
              {CABIN_COLOURS.concat(CABIN_COLOURS).map((colour, i) => (
                <rect
                  key={i}
                  className="parky-dream-confetti"
                  x={-24 + i * 3.3}
                  y={-23 + (i % 3) * 1.5}
                  width=".9"
                  height="1.7"
                  rx=".3"
                  fill={colour}
                  style={{ animationDelay: `${(i % 4) * 0.35}s` } as React.CSSProperties}
                />
              ))}
              <g className="parky-dream-hopper">
                <path
                  d="M-16.4 -12.6L-18.6 -17M-8.6 -12.6L-6.4 -17"
                  stroke={blue}
                  strokeWidth=".7"
                  strokeLinecap="round"
                />
                <circle cx="-12.5" cy="-11" r="4.4" fill={`url(#${ground})`} />
                <path
                  d="M-14.6 -12.2q.8-.9 1.6 0M-12 -12.2q.8-.9 1.6 0"
                  fill="none"
                  stroke={ink}
                  strokeWidth=".55"
                  strokeLinecap="round"
                />
                <path d="M-14 -10.2q1.5 2.2 3 0z" fill={ink} />
              </g>
            </>
          )}
          {dream === 'castle' && (
            <>
              <path
                className="parky-dream-shoot"
                d="M-25 -16Q-14 -27 0 -20"
                fill="none"
                stroke={gold}
                strokeWidth=".6"
                strokeLinecap="round"
                pathLength={1}
              />
              {[
                [-22, -10],
                [-3, -9],
                [-6, -21],
              ].map(([x, y], i) => (
                <path
                  key={i}
                  className="parky-dream-sparkle"
                  d={`M${x} ${y - 1.4}L${x + 0.4} ${y - 0.4}L${x + 1.4} ${y}L${x + 0.4} ${y + 0.4}L${x} ${y + 1.4}L${x - 0.4} ${y + 0.4}L${x - 1.4} ${y}L${x - 0.4} ${y - 0.4}Z`}
                  fill={gold}
                  style={{ animationDelay: `${i * 0.5}s` } as React.CSSProperties}
                />
              ))}
              <g className="parky-dream-rise">
                <DreamCastle />
              </g>
            </>
          )}
          {dream === 'fireworks' && (
            <>
              <DreamNight />
              {BURSTS.map((burst, i) => (
                <g key={burst.x} transform={`translate(${burst.x} ${burst.y})`}>
                  <g
                    className="parky-dream-burst"
                    stroke={burst.colour}
                    strokeWidth=".6"
                    strokeLinecap="round"
                    style={{ animationDelay: `${i * 0.55}s` }}
                  >
                    <path d={RAYS} />
                    <circle r=".6" fill={burst.colour} stroke="none" />
                  </g>
                </g>
              ))}
              {/* The castle smaller, so the sky over it has room for the bursts. */}
              <g transform="translate(-12.5 -4) scale(.7) translate(12.5 4)">
                <DreamCastle />
              </g>
            </>
          )}
          {dream === 'flume' && (
            <>
              <path
                d="M-26 -20.5L-8.5 -7.2H3"
                fill="none"
                stroke="oklch(0.56 0.09 60)"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path d="M-9.5 -5.8q3-1.2 6 0t6 0t6 0V-3h-18Z" fill="oklch(0.72 0.12 230)" />
              <g className="parky-dream-boat">
                {/* The log boat with Parky in it, arms up for the drop. */}
                <path d="M-2.8 -1.8h5.6l-.9 1.8h-3.8Z" fill="oklch(0.6 0.1 60)" />
                <circle cx="0" cy="-3.1" r="1.6" fill={`url(#${ground})`} />
                <path
                  d="M-1.2 -4.1L-2.1 -6.1M1.2 -4.1L2.1 -6.1"
                  stroke={blue}
                  strokeWidth=".55"
                  strokeLinecap="round"
                />
              </g>
              <g transform="translate(-7 -7)" fill="oklch(0.85 0.08 225)">
                {DREAM_DROPS.map((drop) => (
                  <circle
                    key={drop.dx}
                    className="parky-dream-drop"
                    r=".7"
                    style={
                      { '--dx': `${drop.dx}px`, '--dy': `${drop.dy}px` } as React.CSSProperties
                    }
                  />
                ))}
              </g>
            </>
          )}
          {dream === 'wheel' && (
            <>
              <DreamNight />
              <path
                d={`M${DREAM_WHEEL.x} ${DREAM_WHEEL.y}L-17.5 -4M${DREAM_WHEEL.x} ${DREAM_WHEEL.y}L-7.5 -4`}
                stroke="oklch(0.75 0.05 250)"
                strokeWidth=".8"
                strokeLinecap="round"
              />
              <g className="parky-dream-wheel">
                <circle
                  cx={DREAM_WHEEL.x}
                  cy={DREAM_WHEEL.y}
                  r={DREAM_WHEEL.r}
                  fill="none"
                  stroke="oklch(0.75 0.05 250)"
                  strokeWidth=".6"
                />
                <path
                  d={DREAM_CABINS.slice(0, 4)
                    .map(
                      ({ x, y }) =>
                        `M${x} ${y}L${+(2 * DREAM_WHEEL.x - x).toFixed(2)} ${+(2 * DREAM_WHEEL.y - y).toFixed(2)}`
                    )
                    .join('')}
                  stroke="oklch(0.75 0.05 250)"
                  strokeOpacity=".6"
                  strokeWidth=".35"
                />
                {DREAM_CABINS.map((cabin, i) => (
                  <g key={`${cabin.x} ${cabin.y}`}>
                    <circle
                      className="parky-dream-sparkle"
                      cx={cabin.x}
                      cy={cabin.y}
                      r="1.9"
                      fill={gold}
                      opacity=".35"
                      style={{ animationDelay: `${(-i * 0.19).toFixed(2)}s` }}
                    />
                    <circle cx={cabin.x} cy={cabin.y} r="1.05" fill={CABIN_COLOURS[i % 4]} />
                  </g>
                ))}
              </g>
              <circle cx="-12.5" cy="-14.5" r=".8" fill="oklch(0.75 0.05 250)" />
            </>
          )}
        </g>
      </g>
    </g>
  );
}
