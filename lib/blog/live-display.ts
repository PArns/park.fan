import { CROWD_BADGE_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';

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
