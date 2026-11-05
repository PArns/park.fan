import type { ParkStatsFindings } from '@/lib/parks/park-stats-derive';
import { formatMonthList, formatWeekdayList, type WeekdayListLabels } from '@/lib/utils/day-runs';
import { roundWaitTo5 } from '@/lib/utils/wait-time';

/**
 * One thing Parky can say about a park: a key in the `assistant` namespace and the values it fills
 * in. Facts from elsewhere (hand-written ones per park) join the same list, so the bubble draws
 * from all of them alike.
 */
export interface ParkyFact {
  key: string;
  values: Record<string, string | number>;
}

/** The sentences for each finding, every one with `{park}`; a finding without its data has none. */
export const FACT_KEYS = {
  longest: ['factLongest1', 'factLongest2', 'factLongest3'],
  gap: ['factGap1', 'factGap2'],
  quietest: ['factQuietest1', 'factQuietest2', 'factQuietest3'],
  busiest: ['factBusiest1', 'factBusiest2', 'factBusiest3'],
  average: ['factAverage1', 'factAverage2', 'factAverage3'],
} as const;

/** A wait the five-minute grid rounds below this is no story, and the sentences say „minutes". */
const MIN_WAIT = 5;

/** The longest queue is compared with the park's typical one only when it beats it by this much. */
const MIN_GAP = 10;

const wait = (minutes: number | null) => {
  const rounded = minutes == null ? 0 : roundWaitTo5(minutes);
  return rounded >= MIN_WAIT ? rounded : null;
};

/**
 * Every fact a park's two-year aggregate supports, each sentence of {@link FACT_KEYS} once: the
 * longest queue, how far it beats the park's typical wait, the quietest weekdays, the busiest
 * months and the typical wait. Waits on the five-minute grid, days and months named the way the
 * park header names them. Empty for a park without findings.
 */
export function parkyFacts(
  findings: ParkStatsFindings,
  park: string,
  locale: string,
  dayLabels: WeekdayListLabels
): ParkyFact[] {
  const facts: ParkyFact[] = [];
  const add = (keys: readonly string[], values: Record<string, string | number>) =>
    keys.forEach((key) => facts.push({ key, values: { park, ...values } }));

  const longest = wait(findings.longestP50);
  const average = wait(findings.parkP50);
  if (findings.longestName && longest) {
    add(FACT_KEYS.longest, { ride: findings.longestName, wait: longest });
    if (average && longest - average >= MIN_GAP) {
      add(FACT_KEYS.gap, { ride: findings.longestName, extra: longest - average });
    }
  }
  const days = formatWeekdayList(findings.quietestDays, locale, dayLabels);
  const quiet = wait(findings.quietestP50);
  if (days && quiet) add(FACT_KEYS.quietest, { days, wait: quiet });
  const months = formatMonthList(findings.busiestMonths, locale);
  const busy = wait(findings.busiestP50);
  if (months && busy) add(FACT_KEYS.busiest, { months, wait: busy });
  if (average) add(FACT_KEYS.average, { wait: average });
  return facts;
}
