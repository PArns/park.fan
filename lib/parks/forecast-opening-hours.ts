import type { ScheduleItem } from '@/lib/api/types';

const rank = (item: ScheduleItem): number =>
  item.scheduleType === 'CLOSED' ? 0 : item.openingTime && item.closingTime ? 2 : 1;

/**
 * One public opening or closure per date, keyed `YYYY-MM-DD`. The API sends `EXTRA_HOURS` (early
 * entry) beside `OPERATING` for the same date, and `OPERATING` wins over `CLOSED` whatever the
 * order. Among several `OPERATING` rows the one with both times wins. Empty without a schedule or when the park's hours are calculated, not published.
 */
export function forecastOpeningByDate(
  schedule: readonly ScheduleItem[] | null | undefined,
  hasOperatingSchedule?: boolean
): Map<string, ScheduleItem> {
  const byDate = new Map<string, ScheduleItem>();
  if (hasOperatingSchedule === false || !schedule) return byDate;
  for (const item of schedule) {
    if (item.scheduleType !== 'OPERATING' && item.scheduleType !== 'CLOSED') continue;
    const date = item.date.slice(0, 10);
    const seen = byDate.get(date);
    if (!seen || rank(item) > rank(seen)) {
      byDate.set(date, item);
    }
  }
  return byDate;
}
