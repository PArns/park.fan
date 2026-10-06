import { CROWD_BADGE_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';

/** True when a park/attraction status string means "not currently operating". */
export function isNotOperating(status: string | undefined): boolean {
  return !!status && status !== 'OPERATING' && status !== 'UNKNOWN';
}

/**
 * Severity-coloured badge class for a wait time in minutes, on the same `waitTimeCrowdTier`
 * thresholds and palette as `WaitTimeValue` and CrowdLevelBadge.
 */
export function waitTimeBadgeClass(minutes: number): string {
  return CROWD_BADGE_CLASS[waitTimeCrowdTier(minutes)];
}
