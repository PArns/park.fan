import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Parky's mark: a Ferris wheel whose gondolas are a speech bubble's dots, on the brand's blue to
 * green. With `talking`, the wheel turns slowly while Parky writes; still for reduced motion.
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
  return (
    <svg viewBox="0 0 48 48" className={cn('size-8', className)} aria-hidden="true">
      <defs>
        <linearGradient id={ground} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.628 0.137 241.275)" />
          <stop offset="1" stopColor="oklch(0.752 0.181 146.391)" />
        </linearGradient>
      </defs>
      {/* The bubble: a round body with a tail at the lower left. */}
      <path
        d="M24 3c11.6 0 21 8.7 21 19.5S35.6 42 24 42c-2.6 0-5.1-.4-7.4-1.2L7 45l2.4-8.4C5.4 33 3 28 3 22.5 3 11.7 12.4 3 24 3Z"
        fill={`url(#${ground})`}
      />
      <g
        className={cn(
          'origin-[24px_22px]',
          talking && 'animate-[spin_6s_linear_infinite] motion-reduce:animate-none'
        )}
      >
        <circle cx="24" cy="22" r="11" fill="none" stroke="white" strokeWidth="2" />
        <path
          d="M24 11v22M13 22h22M16.2 14.2l15.6 15.6M31.8 14.2 16.2 29.8"
          stroke="white"
          strokeOpacity=".75"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {[
          [24, 11],
          [35, 22],
          [24, 33],
          [13, 22],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.6" fill="white" />
        ))}
      </g>
      <circle cx="24" cy="22" r="2.2" fill="white" />
    </svg>
  );
}
