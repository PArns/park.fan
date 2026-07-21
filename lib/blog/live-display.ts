import type { CrowdLevel } from '@/lib/api/types';
import {
  CROWD_BADGE_CLASS,
  CROWD_TEXT_CLASS,
  waitTimeCrowdTier,
} from '@/lib/utils/crowd-level-styles';

/**
 * Tailwind text-color class for a crowd level, matching the project-wide
 * `--crowd-*` palette used by CrowdLevelBadge and the calendar. Keeps the
 * inline blog annotations colour-consistent with the rest of the app.
 */
export function crowdTextColorClass(level: CrowdLevel | undefined): string {
  return level && level !== 'unknown' ? CROWD_TEXT_CLASS[level] : 'text-muted-foreground';
}

/** True when a park/attraction status string means "not currently operating". */
export function isNotOperating(status: string | undefined): boolean {
  return !!status && status !== 'OPERATING' && status !== 'UNKNOWN';
}

/**
 * Severity-coloured badge class for a wait time in minutes, sharing the
 * canonical `waitTimeCrowdTier` thresholds with `WaitTimeValue` so an inline
 * blog wait badge is green at 20 min and red past an hour — the same palette
 * as CrowdLevelBadge, not a flat primary blue.
 */
export function waitTimeBadgeClass(minutes: number): string {
  return CROWD_BADGE_CLASS[waitTimeCrowdTier(minutes)];
}
