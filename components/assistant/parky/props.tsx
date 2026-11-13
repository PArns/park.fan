'use client';

import { useEffect, useRef } from 'react';
import { LOOP, REST, RIDE_MOTION, TURNTABLE, type ParkyRide } from '@/lib/assistant/parky/rides';
import { animateParky } from '@/lib/assistant/parky/motion';
import {
  GRIN,
  HAPPY_EYES,
  HEART,
  STAR,
  blue,
  frame,
  gold,
  heartRed,
  ink,
  pink,
  rail,
} from './drawing';

const wood = 'oklch(0.6 0.1 60)';
const water = 'oklch(0.72 0.12 230)';
const spray = 'oklch(0.93 0.05 225)';
const teacupPink = 'oklch(0.78 0.13 355)';
const curtain = 'oklch(0.52 0.19 25)';
const curtainFold = 'oklch(0.4 0.15 22)';

/** The left curtain's edge, a drape with a wavy hem; the right one is its mirror image. */
const CURTAIN = 'M-1-6H5q-2 7 0 14t0 14 0 14 0 14H-1Z';
/** Where the sparkles round a show twinkle, as offsets from {@link STAR}'s own centre. */
const SPARKLES = [
  { x: 5, y: 3 },
  { x: 43, y: 14 },
  { x: 6, y: 27 },
];

/**
 * Where the drops of the flume's splash fly to from where the boat hits the water, out past both
 * ends of the boat so they read at button size.
 */
const SPLASH = [
  { dx: -24, dy: -16 },
  { dx: -15, dy: -26 },
  { dx: -4, dy: -30 },
  { dx: 8, dy: -28 },
  { dx: 18, dy: -22 },
  { dx: 25, dy: -12 },
];
/** The wall of water the splash throws up on both sides of the boat. */
const SPLASH_CROWN = 'M-27 0-25-11-21-4-18-17-14-6-10-14 0-4 10-14 14-6 18-17 21-4 25-11 27 0Z';

/**
 * The rails a ride runs on, drawn behind Parky so they stand while he moves: the loop's two rails
 * with ties between them, the tower's mast, the flume's water channel with its splash, the
 * teacups' turntable, or the track a ride's geometry gives (`lib/assistant/parky/rides.ts`).
 */
export function ParkyRideTrack({ ride }: { ride: ParkyRide }) {
  if (ride === 'coaster')
    return (
      <g className="parky-track" fill="none" stroke={rail}>
        <circle cx={LOOP.x} cy={LOOP.y} r={LOOP.r} strokeWidth="1" />
        <circle cx={LOOP.x} cy={LOOP.y} r={LOOP.r + LOOP.gauge} strokeWidth="1" />
        <circle
          cx={LOOP.x}
          cy={LOOP.y}
          r={LOOP.r + LOOP.gauge / 2}
          strokeWidth="2.2"
          strokeDasharray=".6 2.4"
          strokeOpacity=".7"
        />
      </g>
    );
  const motion = RIDE_MOTION[ride];
  if (ride === 'tower')
    return (
      <g className="parky-track" fill="none" stroke={rail}>
        <path d={motion.track} strokeWidth="3.2" strokeOpacity=".85" />
        <path d={motion.track} stroke="white" strokeOpacity=".5" strokeDasharray=".6 4" />
      </g>
    );
  if (ride === 'teacups')
    return (
      <g className="parky-track">
        <path d={motion.track} fill={pink} fillOpacity=".35" stroke={rail} strokeWidth="1.4" />
        <path
          className="parky-turntable"
          d={motion.track}
          fill="none"
          stroke="white"
          strokeOpacity=".7"
          strokeWidth=".9"
          strokeDasharray="1 3"
        />
        <ellipse cx={TURNTABLE.x} cy={TURNTABLE.y} rx="2.4" ry="1.1" fill={rail} />
      </g>
    );
  return (
    <g
      className="parky-track"
      fill="none"
      stroke={ride === 'flume' ? wood : rail}
      strokeLinejoin="round"
    >
      <path d={motion.track} strokeWidth="2.6" />
      <path
        d={motion.track}
        stroke={ride === 'flume' ? water : 'white'}
        strokeOpacity={ride === 'flume' ? 1 : 0.55}
        strokeWidth=".7"
        strokeDasharray={ride === 'flume' ? undefined : '.5 2.2'}
      />
    </g>
  );
}

/**
 * The splash where the boat hits the water, timed by the ride's own clock (its `splash`): a wall
 * of water up both sides of the boat and drops flying off. Drawn with the boat, over Parky, so it
 * reads at button size.
 */
function Splash({ at }: { at: number }) {
  return (
    <g
      className="parky-splash"
      transform={`translate(${REST.x} ${REST.y - 3})`}
      fill={spray}
      stroke={water}
      strokeWidth=".7"
      style={{ '--parky-splash-at': at } as React.CSSProperties}
    >
      <path className="parky-splash-crown" d={SPLASH_CROWN} />
      {SPLASH.map((drop) => (
        <circle
          key={drop.dx}
          r="2.4"
          style={{ '--dx': `${drop.dx}px`, '--dy': `${drop.dy}px` } as React.CSSProperties}
        />
      ))}
    </g>
  );
}

/**
 * What Parky rides in, its foot on the rail at the resting point: the red car, the flume's log
 * boat or a pink teacup. In the airtime of a ride (a stop's `lift`) Parky floats up off his seat:
 * the whole figure is lifted, and this sinks back by as much, so it stays on the rail.
 */
export function ParkyVehicle({ ride, ms }: { ride: ParkyRide; ms: number }) {
  const seat = useRef<SVGGElement>(null);
  useEffect(() => {
    if (ride === 'coaster' || !seat.current) return;
    const stops = RIDE_MOTION[ride].stops;
    if (!stops.some((stop) => stop.lift)) return;
    const run = animateParky(
      seat.current,
      stops.map((stop) => ({ offset: stop.at, transform: `translateY(${stop.lift ?? 0}px)` })),
      { duration: ms, fill: 'both' }
    );
    return () => run.cancel();
  }, [ride, ms]);
  return (
    <g ref={seat} className="parky-car">
      {ride === 'flume' ? (
        <>
          <path d="M6 38.5h36l-3.5 8h-29Z" fill={wood} />
          <path
            d="M10 41.5h28M11.5 44h25"
            stroke="oklch(0.45 0.08 55)"
            strokeOpacity=".6"
            strokeWidth=".7"
            strokeLinecap="round"
          />
          <ellipse cx="6.6" cy="42.5" rx="2" ry="4" fill="oklch(0.72 0.1 70)" />
          <ellipse cx="6.6" cy="42.5" rx=".9" ry="2" fill="none" stroke={wood} strokeWidth=".5" />
          <path d="M8 48.2q4-1.4 8 0t8 0 8 0 8 0" fill="none" stroke={water} strokeWidth="1.2" />
          {RIDE_MOTION.flume.splash !== undefined && <Splash at={RIDE_MOTION.flume.splash} />}
        </>
      ) : ride === 'teacups' ? (
        <>
          <path d="M40 40q4.2.2 4.2 3.2t-4.6 3" fill="none" stroke={teacupPink} strokeWidth="1.8" />
          <path d="M7.5 37.5h33q-1 10-10 11h-13q-9-1-10-11Z" fill={teacupPink} />
          <path d="M7.5 37.5h33" stroke="white" strokeOpacity=".7" strokeWidth=".9" />
          <path
            d="M11 41.5q13 2.4 26 0"
            fill="none"
            stroke="white"
            strokeOpacity=".55"
            strokeWidth="1"
            strokeDasharray="1.6 1.6"
          />
          <ellipse cx="24" cy="48.6" rx="11" ry="1.3" fill="oklch(0.92 0.03 355)" />
        </>
      ) : (
        <>
          <path d="M7 38h34l-2.5 7.5h-29Z" fill={rail} />
          <path d="M7 38h34" stroke="white" strokeOpacity=".6" strokeWidth=".8" />
          <circle cx="14" cy={REST.y - 2} r="2" fill={ink} />
          <circle cx="34" cy={REST.y - 2} r="2" fill={ink} />
        </>
      )}
    </g>
  );
}

/** Grumpy's folded arms, from each side across the belly to a fist on the other. */
const ARMS = [
  { d: 'M5.5 33 27.5 41.5', fist: 28 },
  { d: 'M42.5 33 20.5 41.5', fist: 20 },
];

/** A mouth that opens and shuts on each bite, in place of the smile. */
function Chomp() {
  return <ellipse className="parky-chomp" cx="24" cy="33.6" rx="2.6" ry="2.1" fill={ink} />;
}

/**
 * The stage a show puts behind Parky for `applause`: a spotlight cone from above with its pool of
 * light at his feet, a red curtain's edge on either side and a few sparkles. Drawn behind the
 * body, so he stands in the light.
 */
export function ParkySpotlight() {
  return (
    <g className="parky-stage">
      {[0, 1].map((side) => (
        <g key={side} transform={side ? 'matrix(-1 0 0 1 48 0)' : undefined}>
          <path d={CURTAIN} fill={curtain} />
          <path d="M1.5-6v56M3.5-6v56" stroke={curtainFold} strokeWidth=".6" />
        </g>
      ))}
      <path d="M20-8h8l18 58H2Z" fill={gold} fillOpacity=".38" />
      <path d="M20-8 2 50M28-8l18 58" stroke={gold} strokeOpacity=".7" strokeWidth=".6" />
      <ellipse cx="24" cy="48.5" rx="19" ry="2.6" fill={gold} fillOpacity=".45" />
      <rect x="19.5" y="-11" width="9" height="4" rx="1.5" fill={ink} />
      <g fill={gold} stroke="oklch(0.6 0.13 70)" strokeWidth=".4">
        {SPARKLES.map((spot) => (
          <g key={spot.x} transform={`translate(${spot.x - 17} ${spot.y - 3})`}>
            <path className="parky-sparkle" d={STAR} />
          </g>
        ))}
      </g>
    </g>
  );
}

/**
 * A park map held low in front of Parky: three panels, the middle one with a lake and a dot where
 * he is. In the `map` moment the side panels unfold and the dot pulses; `still` draws it unfolded
 * and quiet, for a picture rather than an act.
 */
export function ParkyMap({ still = false }: { still?: boolean }) {
  return (
    <g className={still ? undefined : 'parky-book parky-map'}>
      <g className={still ? undefined : 'parky-map-left'}>
        <path d="M17.6 29 5 30.6v16l12.6-1.6Z" fill="oklch(0.93 0.04 95)" />
        <circle cx="9.5" cy="36" r="2" fill="oklch(0.72 0.14 146)" />
        <circle cx="12.6" cy="40.6" r="1.6" fill="oklch(0.72 0.14 146)" />
        <path d="M5.5 43.6q5-2.6 12.1-3" fill="none" stroke={rail} strokeWidth=".8" />
      </g>
      <g>
        <path d="M17.6 29h12.8v16H17.6Z" fill="oklch(0.97 0.03 95)" />
        <ellipse cx="24" cy="34" rx="3.6" ry="2" fill={water} />
        <path d="M17.6 40.6q4-.8 6.4 0t6.4-2" fill="none" stroke={rail} strokeWidth=".8" />
        {!still && <circle className="parky-here-ring" cx="24" cy="40.6" r="1.8" fill={heartRed} />}
        <circle cx="24" cy="40.6" r="1.3" fill={heartRed} stroke="white" strokeWidth=".5" />
      </g>
      <g className={still ? undefined : 'parky-map-right'}>
        <path d="M30.4 29 43 30.6v16l-12.6-1.6Z" fill="oklch(0.93 0.04 95)" />
        <circle cx="36.8" cy="36.2" r="3" fill="none" stroke={rail} strokeWidth="1" />
        <path d="M30.4 38.6q3.6-.4 6.4 0.6" fill="none" stroke={rail} strokeWidth=".8" />
      </g>
      <path d="M17.6 29v16M30.4 29v16" stroke={ink} strokeOpacity=".15" strokeWidth=".5" />
    </g>
  );
}

/**
 * What Parky holds or wears for a moment of a park day, drawn over his face; `null` for an act
 * without one. The motion is the stylesheet's (`.parky-act-<act>`); under reduced motion the prop
 * simply shows for the act.
 *
 * - `candy`: cotton candy at his right cheek, a bite gone each chomp.
 * - `churro`: a churro slid in from the right, two bites, a happy squint and a heart.
 * - `balloon`: a red balloon on a string that bobs, slips away and floats off while he watches.
 * - `map`: a park map unfolding panel by panel, a dot pulsing where he is.
 * - `photo`: a camera over his right eye, the left one shut, a click and a flash.
 * - `slurp`: a clear cup with a straw to his pursed mouth, the drink going down, bubbles rising.
 * - `grumpy`: arms crossed, brows down, a frown and a small cloud of steam.
 * - `airtime`: the open grin and streaks under him as he floats up for joy.
 * - `applause`: two little white gloves clapping in front of him, a spark where they meet; the stage
 *   behind him is {@link ParkySpotlight}.
 */
export function ParkyMoment({ act }: { act: string | null }) {
  switch (act) {
    case 'candy':
      return (
        <>
          <Chomp />
          <g className="parky-candy">
            <path d="M43 47.5 40.6 33" stroke="oklch(0.78 0.06 75)" strokeWidth="1.5" />
            <g fill="oklch(0.85 0.11 350)" stroke="oklch(0.72 0.14 350)" strokeWidth=".6">
              <circle cx="45" cy="29.5" r="4.8" />
              <circle cx="45.5" cy="24" r="3.8" />
              <circle className="parky-bite parky-bite--3" cx="42" cy="22.5" r="4" />
              <circle className="parky-bite parky-bite--2" cx="38.6" cy="32.4" r="3.4" />
              <circle className="parky-bite parky-bite--1" cx="38.4" cy="26.8" r="3.6" />
            </g>
            <circle cx="44" cy="22.6" r="1.1" fill="white" opacity=".6" />
          </g>
        </>
      );
    case 'churro':
      return (
        <>
          <Chomp />
          <g transform="translate(25.6 34) rotate(18)">
            <g className="parky-churro">
              <rect x="6" y="-1.9" width="18" height="3.8" rx="1.9" fill="oklch(0.72 0.13 65)" />
              <rect
                className="parky-bite parky-bite--2"
                x="3"
                y="-1.9"
                width="4"
                height="3.8"
                rx="1"
                fill="oklch(0.72 0.13 65)"
              />
              <rect
                className="parky-bite parky-bite--1"
                x="0"
                y="-1.9"
                width="4"
                height="3.8"
                rx="1.6"
                fill="oklch(0.72 0.13 65)"
              />
              <path
                d="M.8-.7H23M.8.7H23"
                stroke="oklch(0.52 0.11 55)"
                strokeWidth=".55"
                strokeLinecap="round"
              />
              <g fill="white" opacity=".85">
                <circle cx="9" cy="-1" r=".35" />
                <circle cx="13" cy=".9" r=".35" />
                <circle cx="17.5" cy="-.9" r=".35" />
                <circle cx="21" cy=".8" r=".35" />
              </g>
            </g>
          </g>
          <path
            className="parky-happy"
            d={HAPPY_EYES}
            fill="none"
            stroke={ink}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <g transform="translate(42 12)">
            <g className="parky-treat">
              <path d={HEART} transform="scale(.6)" fill={heartRed} />
            </g>
          </g>
        </>
      );
    case 'balloon':
      return (
        <>
          <ellipse className="parky-oh" cx="24" cy="33.8" rx="1.5" ry="1.8" fill={ink} />
          <g className="parky-balloon">
            <path
              d="M42.5 33q2.6-5.4.2-10.6t2.3-10"
              fill="none"
              stroke={ink}
              strokeOpacity=".6"
              strokeWidth=".6"
            />
            <path d="M44.2 12.2h1.8l-.9-1.6Z" fill={heartRed} />
            <ellipse cx="45.1" cy="5" rx="5" ry="6" fill={heartRed} />
            <ellipse cx="43.2" cy="2.8" rx="1.2" ry="2" fill="white" opacity=".5" />
          </g>
        </>
      );
    case 'map':
      return <ParkyMap />;
    case 'photo':
      return (
        <>
          <path
            d="M12.6 22.6q4.4 3 8.8 0"
            fill="none"
            stroke={ink}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <g className="parky-camera">
            <rect
              className="parky-shutter"
              x="35.5"
              y="13"
              width="4"
              height="2.2"
              rx=".6"
              fill={ink}
            />
            <rect x="21.6" y="15" width="21.4" height="14.6" rx="2.6" fill="oklch(0.34 0.03 250)" />
            <rect x="23.6" y="16.6" width="4.4" height="2.6" rx=".6" fill="oklch(0.94 0.04 95)" />
            <circle
              cx="31"
              cy="22.5"
              r="5.6"
              fill="oklch(0.5 0.03 250)"
              stroke="white"
              strokeOpacity=".5"
              strokeWidth=".7"
            />
            <circle cx="31" cy="22.5" r="3.4" fill="oklch(0.22 0.05 260)" />
            <circle cx="29.7" cy="21.2" r="1.1" fill="white" opacity=".75" />
          </g>
          <g transform="translate(25.8 17.9)">
            <g className="parky-flash">
              <circle r="7" fill="white" opacity=".7" />
              <path
                d="M0-5.5V-9M5.5 0H9M-5.5 0H-9M3.9-3.9l2.5-2.5M-3.9-3.9l-2.5-2.5"
                stroke={gold}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </g>
          </g>
        </>
      );
    case 'slurp':
      return (
        <>
          <circle className="parky-purse" cx="24.5" cy="33.3" r="1.4" fill={ink} />
          <g className="parky-cup">
            <path
              d="M24.6 33.6 29 38.4V46"
              fill="none"
              stroke="white"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M24.6 33.6 29 38.4V46"
              fill="none"
              stroke={rail}
              strokeWidth="1.3"
              strokeDasharray="1 1"
            />
            <rect
              className="parky-drink"
              x="26.9"
              y="39.4"
              width="9.2"
              height="8.2"
              rx="1"
              fill="oklch(0.66 0.2 20)"
            />
            <g className="parky-bubbles" fill="white" opacity=".8">
              <circle cx="29" cy="46" r=".55" />
              <circle cx="32" cy="46" r=".7" />
              <circle cx="34.4" cy="46" r=".5" />
            </g>
            <path
              d="M26 37h11v9.6q0 1.6-1.6 1.6h-7.8q-1.6 0-1.6-1.6Z"
              fill="white"
              fillOpacity=".3"
              stroke={frame}
              strokeOpacity=".8"
              strokeWidth=".8"
            />
            <path d="M27.4 38.6v7" stroke="white" strokeOpacity=".6" strokeWidth=".7" />
          </g>
        </>
      );
    case 'grumpy':
      return (
        <>
          <path
            className="parky-brows"
            d="M11.4 14.8 21 18.4M36.6 14.8 27 18.4"
            stroke={ink}
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            className="parky-frown"
            d="M20.4 35.2q3.6-3 7.2 0"
            fill="none"
            stroke={ink}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* The arms folded over the belly, outlined so the one on top reads over the other. */}
          <g className="parky-arms" strokeLinecap="round">
            {ARMS.map((arm) => (
              <g key={arm.d}>
                <path d={arm.d} fill="none" stroke={ink} strokeWidth="4.6" />
                <path d={arm.d} fill="none" stroke={frame} strokeWidth="3" />
                <circle
                  cx={arm.fist}
                  cy="41.6"
                  r="2.1"
                  fill={frame}
                  stroke={ink}
                  strokeWidth=".8"
                />
              </g>
            ))}
          </g>
          <g className="parky-steam" fill="white" stroke={blue} strokeWidth=".7">
            <circle cx="7.5" cy="8.5" r="2.2" />
            <circle cx="4.2" cy="4.4" r="2.8" />
            <circle cx="8.6" cy="1.4" r="2" />
          </g>
        </>
      );
    case 'airtime':
      return (
        <>
          <path className="parky-grin" d={GRIN} fill={ink} />
          <path
            className="parky-streaks"
            d="M16 47.5v4M24 48.5v5M32 47.5v4"
            stroke={blue}
            strokeOpacity=".7"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </>
      );
    case 'applause':
      return (
        <>
          {[0, 1].map((side) => (
            <g key={side} transform={side ? 'matrix(-1 0 0 1 48 0)' : undefined}>
              <g className="parky-clap">
                <ellipse
                  cx="21.3"
                  cy="40"
                  rx="2.7"
                  ry="3.3"
                  fill="white"
                  stroke={ink}
                  strokeWidth=".9"
                />
                <circle cx="19.5" cy="37.7" r="1.1" fill="white" stroke={ink} strokeWidth=".7" />
              </g>
            </g>
          ))}
          <g transform="translate(7 33.4)">
            <path className="parky-clap-spark" d={STAR} fill={gold} />
          </g>
        </>
      );
    default:
      return null;
  }
}
