import { cn } from '@/lib/utils';

/**
 * Temperature (in °C) at or above which we surface a heat warning. The check is
 * always done on the Celsius source value so the threshold is unit-independent;
 * 35 °C is exactly 95 °F.
 */
export const HEAT_WARNING_THRESHOLD_C = 35;

/** True when a Celsius temperature should trigger the heat warning badge. */
export function isHeatWarning(celsius: number): boolean {
  return celsius >= HEAT_WARNING_THRESHOLD_C;
}

interface HeatWarningBadgeProps {
  /** Accessible label / tooltip text. */
  label: string;
  /**
   * Edge length. A number is treated as px; a string is any CSS length. Defaults
   * to `"1em"` so the triangle tracks the surrounding font size (and thus visually
   * matches the temperature it sits next to).
   */
  size?: number | string;
  className?: string;
}

/**
 * A real, road-sign style warning triangle — red border, white background and a
 * black "!". Deliberately not stylised. Shown next to temperatures above
 * {@link HEAT_WARNING_THRESHOLD_C}.
 */
export function HeatWarningBadge({ label, size = '1em', className }: HeatWarningBadgeProps) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 24 24"
      className={cn('inline-block shrink-0 align-middle', className)}
      style={{ width: size, height: size }}
    >
      <title>{label}</title>
      {/* Triangle: white fill, red border, rounded corners. */}
      <path
        d="M12 3 L22.5 21 L1.5 21 Z"
        fill="#ffffff"
        stroke="#dc2626"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Exclamation mark, black. */}
      <line
        x1="12"
        y1="10"
        x2="12"
        y2="15.5"
        stroke="#000000"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="18.6" r="1.25" fill="#000000" />
    </svg>
  );
}
