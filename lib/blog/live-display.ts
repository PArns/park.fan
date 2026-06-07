import type { CrowdLevel } from '@/lib/api/types';

/**
 * Tailwind text-color class for a crowd level, matching the project-wide
 * `--crowd-*` palette used by CrowdLevelBadge and the calendar. Keeps the
 * inline blog annotations colour-consistent with the rest of the app.
 */
export function crowdTextColorClass(level: CrowdLevel | undefined): string {
  switch (level) {
    case 'very_low':
      return 'text-crowd-very-low';
    case 'low':
      return 'text-crowd-low';
    case 'moderate':
      return 'text-crowd-moderate';
    case 'high':
      return 'text-crowd-high';
    case 'very_high':
      return 'text-crowd-very-high';
    case 'extreme':
      return 'text-crowd-extreme';
    default:
      return 'text-muted-foreground';
  }
}

/** True when a park/attraction status string means "not currently operating". */
export function isNotOperating(status: string | undefined): boolean {
  return !!status && status !== 'OPERATING' && status !== 'UNKNOWN';
}

/**
 * Severity-coloured badge class for a wait time in minutes, mirroring the
 * thresholds in `WaitTimeValue` (the canonical wait-time display) so an inline
 * blog wait badge is green at 20 min and red past an hour — the same palette
 * as CrowdLevelBadge, not a flat primary blue.
 */
export function waitTimeBadgeClass(minutes: number): string {
  if (minutes <= 5) return 'badge-crowd-very-low';
  if (minutes <= 15) return 'badge-crowd-low';
  if (minutes <= 30) return 'badge-crowd-moderate';
  if (minutes <= 40) return 'badge-crowd-high';
  if (minutes <= 60) return 'badge-crowd-very-high';
  return 'badge-crowd-extreme';
}
