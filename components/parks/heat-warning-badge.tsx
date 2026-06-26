import { cn } from '@/lib/utils';

/**
 * Temperature (in °C) at or above which we surface a heat warning. The check is
 * always done on the Celsius source value so the threshold is unit-independent;
 * 30 °C is exactly 86 °F.
 */
export const HEAT_WARNING_THRESHOLD_C = 30;

/** True when a Celsius temperature should trigger the heat warning badge. */
export function isHeatWarning(celsius: number): boolean {
  return celsius > HEAT_WARNING_THRESHOLD_C;
}

interface HeatWarningBadgeProps {
  /** Accessible label / tooltip text. */
  label: string;
  /** Edge length in px (square badge). Defaults to 16. */
  size?: number;
  className?: string;
}

/**
 * A deliberately non-stylised "caution" mark — a real warning sign: red border,
 * white background, black exclamation mark. Shown next to temperatures above
 * {@link HEAT_WARNING_THRESHOLD_C}.
 */
export function HeatWarningBadge({ label, size = 16, className }: HeatWarningBadgeProps) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-sm border-2 border-red-600 bg-white font-bold text-black',
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.7), lineHeight: 1 }}
    >
      !
    </span>
  );
}
