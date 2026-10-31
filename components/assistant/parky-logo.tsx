import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Parky's face: a speech bubble in the brand's blue to green with big eyes, rosy cheeks and a
 * smile, and a small Ferris wheel for a hat. It blinks now and then; with `talking` the wheel
 * turns and the mouth opens. The motion lives in `app/globals.css` (`.parky-*`) and only runs
 * without `prefers-reduced-motion`.
 */
export function ParkyLogo({
  className,
  talking = false,
}: {
  className?: string;
  talking?: boolean;
}) {
  // Two marks are on screen at once (button and window header); each needs its own gradient id.
  const ground = useId();
  const ink = 'oklch(0.25 0.03 240)';
  const blue = 'oklch(0.628 0.137 241.275)';
  return (
    <svg
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
      {/* The hat: a small Ferris wheel on the bubble's top right. */}
      <g className={cn('parky-wheel', talking && 'parky-wheel--turning')}>
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
        <ellipse cx="17.5" cy="23" rx="4.2" ry="4.8" fill="white" />
        <ellipse cx="30.5" cy="23" rx="4.2" ry="4.8" fill="white" />
        <circle cx="18.3" cy="24" r="2.3" fill={ink} />
        <circle cx="31.3" cy="24" r="2.3" fill={ink} />
        <circle cx="19.1" cy="23" r="0.8" fill="white" />
        <circle cx="32.1" cy="23" r="0.8" fill="white" />
      </g>
      <ellipse cx="12.5" cy="30" rx="2.4" ry="1.4" fill="oklch(0.78 0.12 15)" opacity=".7" />
      <ellipse cx="35.5" cy="30" rx="2.4" ry="1.4" fill="oklch(0.78 0.12 15)" opacity=".7" />
      {talking ? (
        <ellipse className="parky-mouth" cx="24" cy="32" rx="3" ry="2.2" fill={ink} />
      ) : (
        <path
          d="M20 30.5q4 3.6 8 0"
          fill="none"
          stroke={ink}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
