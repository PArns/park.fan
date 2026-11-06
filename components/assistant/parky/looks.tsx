import { cn } from '@/lib/utils';
import type { ParkyHat, ParkyOutfit, ParkyWeather } from '@/lib/assistant/parky/look';

/**
 * Parky's outfits and the acts that come with them, drawn in the 48-unit space of
 * `parky-logo.tsx`. Each piece has its own anchor, so a season's and a weather's combine: the hat
 * where the Ferris wheel stands, the scarf round his middle, the umbrella in his right hand beyond
 * the wheel, the weather and the scenes around him. Nothing reaches the eyes. The motion is CSS
 * (`.parky-look-*` in `app/parky.css`); without it every piece and scene stands finished.
 */

const coal = 'oklch(0.24 0.02 250)';
const snow = 'white';
/** An icy outline, so white snow still shows on a white page. */
const ice = 'oklch(0.7 0.08 235)';
const scarfRed = 'oklch(0.58 0.19 22)';
const gold = 'oklch(0.85 0.15 88)';
const pine = 'oklch(0.55 0.14 150)';
const pumpkin = 'oklch(0.72 0.17 55)';
const glow = 'oklch(0.9 0.15 95)';

/** Where the pupils go during a scene: at the ghost, the fireworks, the snowman, the globe. */
export const LOOK_GAZE: Partial<Record<string, { x: number; y: number }>> = {
  ghost: { x: -1.8, y: -2.2 },
  fireworks: { x: -1.8, y: -2.4 },
  snowman: { x: -2.2, y: 1.2 },
  snowglobe: { x: 0, y: 2.8 },
  brolly: { x: 1.8, y: -2.2 },
};

/** A six-armed snowflake about four units across, round the origin. */
const FLAKE = 'M0-2V2M-1.7-1L1.7 1M-1.7 1L1.7-1';

/** The season's hat, drawn in the Ferris wheel's place and, like it, behind the head. */
export function ParkyLookHat({ hat }: { hat: ParkyHat }) {
  return (
    <g className={cn('parky-look-hat', `parky-look-hat--${hat}`)}>
      {hat === 'pumpkin' && (
        // A jack-o'-lantern, tipped to the right, its grin above the head's edge.
        <g transform="rotate(10 31.5 3)">
          <ellipse cx="27.6" cy="2.6" rx="4.4" ry="5.8" fill={pumpkin} />
          <ellipse cx="35.4" cy="2.6" rx="4.4" ry="5.8" fill={pumpkin} />
          <ellipse cx="31.5" cy="2.6" rx="4.6" ry="6.3" fill="oklch(0.76 0.17 60)" />
          <path
            d="M29.4-3.4q-1 6 0 12M33.6-3.4q1 6 0 12"
            stroke="oklch(0.6 0.15 45)"
            strokeWidth=".6"
            fill="none"
          />
          <path
            d="M31.5-3.4q.2-2 1.6-3"
            stroke="oklch(0.45 0.08 120)"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M27.4 1.8l1.6-2.8 1.6 2.8ZM32.4 1.8l1.6-2.8 1.6 2.8Z"
            fill={glow}
            stroke={coal}
            strokeWidth=".4"
          />
          <path
            d="M27 3.8q4.5 4 9 0l-1.4.5-.8 1-.9-.9-1.4.9-1.4-.9-.9.9-.8-1Z"
            fill={glow}
            stroke={coal}
            strokeWidth=".4"
          />
        </g>
      )}
      {hat === 'tree' && (
        // A little Christmas tree: three tiers, baubles, and the star on top clear of everything.
        <g transform="rotate(8 31 9)">
          <path
            d="M22.5 9.5 31 1l8.5 8.5ZM24.5 4.5 31-3l6.5 7.5ZM26.5-.5 31-5.6l4.5 5.1Z"
            fill={pine}
            stroke="oklch(0.45 0.12 150)"
            strokeWidth=".5"
            strokeLinejoin="round"
          />
          <circle cx="27.4" cy="6.4" r="1.1" fill="oklch(0.6 0.21 25)" />
          <circle cx="34.8" cy="6.8" r="1.1" fill={gold} />
          <circle cx="29" cy="2.2" r="1" fill="oklch(0.62 0.15 250)" />
          <circle cx="33.6" cy="1.6" r="1" fill="oklch(0.6 0.21 25)" />
          <circle cx="31.2" cy="-1.8" r=".9" fill={gold} />
          <path
            className="parky-look-star"
            d="M31-8.6l.8 1.9 2 .2-1.5 1.3.5 2-1.8-1-1.8 1 .5-2-1.5-1.3 2-.2Z"
            fill={gold}
            stroke="oklch(0.65 0.13 75)"
            strokeWidth=".35"
          />
        </g>
      )}
      {hat === 'party' && (
        // A party hat with gold dots and a pompom, tipped to the right like the wheel stands.
        <g>
          <path
            d="M24.5 9.4 33.4-5 39.6 10.2Z"
            fill="oklch(0.6 0.17 300)"
            stroke="oklch(0.48 0.15 300)"
            strokeWidth=".5"
            strokeLinejoin="round"
          />
          <g fill={gold}>
            <circle cx="30.4" cy="4.4" r="1" />
            <circle cx="35.4" cy="5.6" r="1" />
            <circle cx="33" cy="-.2" r=".9" />
            <circle cx="28.2" cy="8.4" r=".9" />
          </g>
          <circle
            className="parky-look-pompom"
            cx="33.4"
            cy="-5.4"
            r="2"
            fill={gold}
            stroke="white"
            strokeWidth=".5"
          />
        </g>
      )}
      {hat === 'beanie' && (
        // A woolly hat pulled over the top of the head; its brim is drawn in front, with the scarf.
        <g>
          <path d="M8.6 15C8.6 4.5 15.5-1 24-1s15.4 5.5 15.4 16Z" fill={scarfRed} />
          <path d="M11.4 7.6Q24 1.6 36.6 7.6" stroke="white" strokeWidth="1.6" fill="none" />
          <circle
            className="parky-look-pompom"
            cx="24"
            cy="-2.4"
            r="3"
            fill="white"
            stroke={ice}
            strokeWidth=".5"
          />
        </g>
      )}
    </g>
  );
}

/** The umbrella in Parky's right hand, beyond the wheel, its canopy above his shoulder. */
function Umbrella({ ground }: { ground: string }) {
  return (
    <g className="parky-look-umbrella">
      <path
        d="M49 5.2 45 38.6a1.7 1.7 0 0 1-3.4.3"
        stroke={coal}
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <g className="parky-look-canopy">
        <path
          d="M39 5.2a10 9 0 0 1 20 0q-2.5-1.8-5 0-2.5-1.8-5 0-2.5-1.8-5 0-2.5-1.8-5 0Z"
          fill={scarfRed}
          stroke="oklch(0.48 0.17 22)"
          strokeWidth=".5"
          strokeLinejoin="round"
        />
        {/* One white panel, so a twirl reads as the canopy turning. */}
        <path d="M49-3.8q-3.4 4-5 9 2.5-1.8 5 0Z" fill="white" opacity=".85" />
        <path d="M49-3.8v-1.8" stroke={coal} strokeWidth=".9" strokeLinecap="round" />
      </g>
      {/* A mitten in Parky's own colours round the handle. */}
      <circle cx="44" cy="33" r="2.3" fill={`url(#${ground})`} />
    </g>
  );
}

/**
 * The pieces Parky wears under his face, drawn right after the bubble: the scarf, the woolly hat's
 * brim, the umbrella, the sweat of a hot day.
 */
export function ParkyLookWear({ outfit, ground }: { outfit: ParkyOutfit; ground: string }) {
  return (
    <>
      {outfit.scarf && (
        <g className="parky-look-scarf">
          <path d="M9.4 36.2Q24 43.4 38.6 36.2L37.4 40.6Q24 47 10.6 40.6Z" fill={scarfRed} />
          <path d="M31.4 41.6l1.4 6.4h3.6l-1.2-7.4Z" fill={scarfRed} />
          <path
            d="M14 38.6l-.6 3.4M19 40l-.3 3.6M29 40l.3 3.6M34 38.6l.6 3.4M33.4 48v1.4M34.8 48v1.4M36.2 48v1.4"
            stroke="white"
            strokeOpacity=".7"
            strokeWidth=".8"
            strokeLinecap="round"
          />
        </g>
      )}
      {outfit.hat === 'beanie' && (
        <path
          d="M9.2 14.6Q24 3.6 38.8 14.6"
          stroke="oklch(0.5 0.16 22)"
          strokeWidth="3.8"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {outfit.umbrella && <Umbrella ground={ground} />}
      {outfit.sky === 'hot' && (
        <path
          className="parky-look-sweat"
          d="M9.6 12.8q-1.6 2.3-1.6 3.2a1.6 1.6 0 0 0 3.2 0q0-.9-1.6-3.2Z"
          fill="oklch(0.85 0.07 230)"
          stroke="white"
          strokeWidth=".4"
        />
      )}
    </>
  );
}

/** Rain, falling onto the umbrella and splashing off it; with the umbrella away, past him. */
function Rain({ sheltered }: { sheltered: boolean }) {
  return (
    <g
      className={cn('parky-look-rain', sheltered && 'parky-look-rain--sheltered')}
      stroke={ice}
      strokeWidth=".9"
      strokeLinecap="round"
    >
      {[42, 46, 51, 55, 2, 7].map((x, i) => (
        <g key={x} transform={`translate(${x} ${x > 40 ? -12 : 2})`}>
          <path
            className={cn('parky-look-drop', x > 40 && 'parky-look-drop--canopy')}
            d="M0-1.4v2.8"
            style={{ animationDelay: `${i * 0.23}s` }}
          />
        </g>
      ))}
    </g>
  );
}

/**
 * The weather round Parky, behind him: rain, a storm cloud, snowflakes, gusts, the sun. Fog is
 * drawn in front ({@link ParkyLookFog}).
 */
function Sky({ sky, sheltered }: { sky: ParkyWeather; sheltered: boolean }) {
  if (sky === 'rain') return <Rain sheltered={sheltered} />;
  if (sky === 'storm') {
    return (
      <g>
        <Rain sheltered={sheltered} />
        <g className="parky-look-storm">
          <path
            className="parky-look-bolt"
            d="M51-13l-2.4 4.2h2.2L48.6-4l4.4-6h-2.4l1.6-3Z"
            fill={gold}
          />
          <g fill="oklch(0.6 0.02 250)">
            <circle cx="45.5" cy="-15" r="3.2" />
            <circle cx="50" cy="-17" r="4" />
            <circle cx="54.6" cy="-15" r="3" />
            <rect x="45.5" y="-15" width="9" height="3.2" rx="1.6" />
          </g>
        </g>
      </g>
    );
  }
  if (sky === 'snow') {
    return (
      <g
        className="parky-look-snow"
        fill="none"
        stroke={ice}
        strokeWidth=".7"
        strokeLinecap="round"
      >
        {[
          [-2, 10],
          [5, -2],
          [14, 3],
          [40, -6],
          [47, 8],
          [52, 22],
          [-3, 30],
          [50, 36],
        ].map(([x, y], i) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <path
              className="parky-look-flake"
              d={FLAKE}
              style={{ animationDelay: `${-i * 0.7}s` }}
            />
          </g>
        ))}
      </g>
    );
  }
  if (sky === 'windy') {
    return (
      <g
        className="parky-look-wind"
        fill="none"
        stroke={ice}
        strokeWidth=".9"
        strokeLinecap="round"
      >
        <path d="M-5 13h7.5q2.4 0 2.4-2.1t-2-1.9" pathLength={1} />
        <path
          d="M42.5 27h8.5q2 0 2-1.8t-1.8-1.6"
          pathLength={1}
          style={{ animationDelay: '.4s' }}
        />
        <path d="M44 36h7" pathLength={1} style={{ animationDelay: '.8s' }} />
      </g>
    );
  }
  if (sky === 'hot') {
    return (
      <g className="parky-look-sun">
        <path
          d="M2.5-3.3v1.8M2.5 8.5v1.8M-4.3 3.5h1.8M7.5 3.5h1.8M-2.3-1.3l1.3 1.3M6 7l1.3 1.3M-2.3 8.3 -1 7M6 0l1.3-1.3"
          stroke={gold}
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="2.5" cy="3.5" r="3.4" fill={gold} />
      </g>
    );
  }
  return null;
}

/** Fog drifting in front of Parky's lower half, below the mouth. */
export function ParkyLookFog() {
  return (
    <g
      className="parky-look-fog"
      stroke="oklch(0.86 0.015 240)"
      strokeOpacity=".85"
      strokeLinecap="round"
    >
      <path d="M-4 41.5h20M24 41.5h28" strokeWidth="2.6" />
      <path d="M0 45.8h46" strokeWidth="2.2" style={{ animationDelay: '-2s' }} />
    </g>
  );
}

/** A friendly little ghost floating up from behind Parky's left side. */
function Ghost() {
  return (
    <g transform="translate(1 3)">
      <g className="parky-look-ghost">
        <path
          d="M-4 5V-1a4 4 0 0 1 8 0v6l-1.3-1.1L1.3 5 0 3.9-1.3 5l-1.4-1.1Z"
          fill={snow}
          stroke="oklch(0.62 0.08 280)"
          strokeWidth=".6"
          strokeLinejoin="round"
        />
        <ellipse cx="-1.4" cy="-.6" rx=".6" ry=".9" fill={coal} />
        <ellipse cx="1.4" cy="-.6" rx=".6" ry=".9" fill={coal} />
        <ellipse cx="0" cy="1.6" rx=".7" ry=".9" fill={coal} />
      </g>
    </g>
  );
}

/** Three bursts over Parky's head, one after another. */
function Fireworks() {
  const bursts = [
    { x: -3, y: -8, colour: 'oklch(0.72 0.17 355)' },
    { x: 10, y: -16, colour: gold },
    { x: 20, y: -9, colour: 'oklch(0.7 0.15 200)' },
  ];
  return (
    <g strokeLinecap="round">
      {bursts.map((burst, i) => (
        <g key={burst.x} transform={`translate(${burst.x} ${burst.y})`}>
          <g
            className="parky-look-burst"
            stroke={burst.colour}
            strokeWidth=".9"
            style={{ animationDelay: `${i * 0.6}s` }}
          >
            <path d="M0-2v-3M0 2v3M-2 0h-3M2 0h3M-1.4-1.4-3.5-3.5M1.4 1.4l2.1 2.1M-1.4 1.4-3.5 3.5M1.4-1.4l2.1-2.1" />
            <circle r=".9" fill={burst.colour} stroke="none" />
          </g>
        </g>
      ))}
    </g>
  );
}

/**
 * The snowman Parky builds beside him: three snowballs stacked, coal eyes and buttons, the carrot
 * nose last and a tiny Ferris wheel for a hat, then he melts away.
 */
function Snowman() {
  return (
    <g className="parky-look-snowman">
      <g fill={snow} stroke={ice} strokeWidth=".6">
        <circle
          className="parky-look-build"
          cx="-7"
          cy="43.4"
          r="5"
          style={{ animationDelay: '0s' }}
        />
        <circle
          className="parky-look-build"
          cx="-7"
          cy="35.6"
          r="3.8"
          style={{ animationDelay: '.6s' }}
        />
        <circle
          className="parky-look-build"
          cx="-7"
          cy="29.4"
          r="2.9"
          style={{ animationDelay: '1.2s' }}
        />
      </g>
      <g className="parky-look-build" fill={coal} style={{ animationDelay: '1.8s' }}>
        <circle cx="-8.1" cy="28.8" r=".5" />
        <circle cx="-5.9" cy="28.8" r=".5" />
        <circle cx="-7" cy="34.6" r=".5" />
        <circle cx="-7" cy="36.8" r=".5" />
      </g>
      <path
        className="parky-look-build"
        d="M-6.8 29.6l3.2.7-3.2.7Z"
        fill="oklch(0.7 0.17 50)"
        style={{ animationDelay: '2.4s' }}
      />
      {/* Parky's own hat in miniature, a wink. */}
      <g className="parky-look-build" style={{ animationDelay: '3s' }}>
        <circle cx="-7" cy="24.6" r="2" fill="none" stroke={ice} strokeWidth=".5" />
        <circle cx="-7" cy="22.6" r=".55" fill={gold} />
        <circle cx="-5" cy="24.6" r=".55" fill={scarfRed} />
        <circle cx="-9" cy="24.6" r=".55" fill={pine} />
      </g>
    </g>
  );
}

/**
 * What stands behind Parky: the weather round him and the scenes of the acts that go beyond him
 * (the ghost, the fireworks, the snowman). Drawn first, so every act and mood paints over it.
 */
export function ParkyLookBack({ outfit, act }: { outfit: ParkyOutfit; act: string | null }) {
  return (
    <>
      {outfit.sky && <Sky sky={outfit.sky} sheltered={outfit.umbrella} />}
      {act === 'ghost' && <Ghost />}
      {act === 'fireworks' && <Fireworks />}
      {act === 'snowman' && <Snowman />}
    </>
  );
}

/**
 * What Parky holds over his face during an act, drawn last in the body: the snow globe, the fan,
 * the chattering teeth of a shiver.
 */
export function ParkyLookHands({ act, ground }: { act: string | null; ground: string }) {
  if (act === 'snowglobe') {
    return (
      <g className="parky-book parky-look-globe">
        <path d="M17.6 43.4h12.8l-1.4 4.2H19Z" fill="oklch(0.5 0.08 50)" />
        <circle
          cx="24"
          cy="37.4"
          r="6.8"
          fill="oklch(0.9 0.05 230)"
          fillOpacity=".9"
          stroke="white"
          strokeWidth=".8"
        />
        <path d="M21.4 42 24 36.6l2.6 5.4Z" fill={pine} />
        <circle cx="24" cy="36" r=".7" fill={gold} />
        <g className="parky-look-swirl" fill="white">
          <circle cx="20.6" cy="35" r=".55" />
          <circle cx="27.2" cy="34.2" r=".55" />
          <circle cx="22.4" cy="40.6" r=".5" />
          <circle cx="27" cy="39.4" r=".5" />
          <circle cx="24.6" cy="32.6" r=".5" />
        </g>
        <circle cx="17" cy="41.6" r="2.2" fill={`url(#${ground})`} />
        <circle cx="31" cy="41.6" r="2.2" fill={`url(#${ground})`} />
      </g>
    );
  }
  if (act === 'fan') {
    return (
      <g transform="translate(43 38) rotate(20)">
        <g className="parky-look-fan">
          <path
            d="M0 0-4.2-8.8a9.6 9.6 0 0 1 8.4 0Z"
            fill="oklch(0.85 0.09 355)"
            stroke="oklch(0.65 0.14 355)"
            strokeWidth=".5"
            strokeLinejoin="round"
          />
          <path
            d="M0 0-2.2-9.4M0 0V-9.6M0 0l2.2-9.4"
            stroke="oklch(0.65 0.14 355)"
            strokeWidth=".4"
          />
        </g>
        <circle r="2.2" fill={`url(#${ground})`} />
      </g>
    );
  }
  if (act === 'shiver') {
    return (
      <g className="parky-look-chatter">
        <rect
          x="20.4"
          y="31.6"
          width="7.2"
          height="3.4"
          rx="1.2"
          fill="white"
          stroke={coal}
          strokeWidth="1.1"
        />
        <path d="M20.6 33.3h6.8M22.8 31.8v3M25.2 31.8v3" stroke={coal} strokeWidth=".5" />
      </g>
    );
  }
  return null;
}
