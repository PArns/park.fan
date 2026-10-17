import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';
import { CROWD_CHIP_CLASS, CROWD_DOT_CLASS } from '@/lib/utils/crowd-level-styles';
import {
  getDateTimeFormat,
  getListFormat,
  weekdayName,
  WEEKDAYS_MONDAY_FIRST,
} from '@/lib/utils/intl-format';
import type { BestDaysTier, ParkBestDays } from '@/lib/parks/park-stats-derive';

const MONTHS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Three or more neighbours read as a span („Di.–Fr."), two as a pair. */
const MIN_RUN = 3;

/**
 * The keys grouped into runs of neighbours in `order`, where the last entry neighbours the first:
 * Saturday to Monday is one stretch of the week, December to February one winter.
 */
function cyclicRuns(keys: readonly number[], order: readonly number[]): number[][] {
  const positions = keys.map((k) => order.indexOf(k)).sort((a, b) => a - b);
  const runs: number[][] = [];
  for (const p of positions) {
    const last = runs.at(-1);
    if (last && last.at(-1) === p - 1) last.push(p);
    else runs.push([p]);
  }
  if (runs.length > 1 && runs[0][0] === 0 && runs.at(-1)!.at(-1) === order.length - 1) {
    runs[0] = [...runs.pop()!, ...runs[0]];
  }
  return runs.map((run) => run.map((p) => order[p]));
}

function formatRuns(
  keys: readonly number[],
  order: readonly number[],
  locale: string,
  name: (key: number, inRange: boolean) => string
): string {
  const parts = cyclicRuns(keys, order).flatMap((run) =>
    run.length >= MIN_RUN
      ? [`${name(run[0], true)}–${name(run.at(-1)!, true)}`]
      : run.map((k) => name(k, false))
  );
  return getListFormat(locale, { type: 'conjunction' }).format(parts);
}

function EndColumn({
  label,
  days,
  months,
}: {
  label: string;
  days: string | null;
  months: string | null;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground mb-1.5 text-xs">{label}</dt>
      {days && <dd className="font-medium">{days}</dd>}
      {months && <dd className="font-medium">{months}</dd>}
    </div>
  );
}

/** Chip per tier: the crowd scale's two ends for the quiet and busy days, a neutral chip between. */
const TIER_CHIP_CLASS: Record<BestDaysTier, string> = {
  quiet: CROWD_CHIP_CLASS.low,
  middle: 'border-border/60 bg-muted/40 text-foreground/80 border',
  busy: CROWD_CHIP_CLASS.high,
};

/**
 * The park header's answer to „when is it quiet": seven weekday chips tiered against the park's
 * own other days, and from `sm` up the quietest and busiest weekdays and months beside them, from
 * the two-year aggregate. On a phone the columns are hidden by CSS only, so the HTML still carries
 * them. Server-only and clock-free, so hydration has nothing to compare. Always renders; the caller
 * gates on `deriveParkBestDays` returning a value.
 */
export async function ParkBestDaysSummary({
  bestDays,
  locale,
  className,
}: {
  bestDays: ParkBestDays;
  locale: string;
  className?: string;
}) {
  const t = await getTranslations('parkBestDays');
  const tierLabel = { quiet: t('quieter'), middle: t('middle'), busy: t('busier') };

  // Three or more months go short, so a column holds them on one line.
  const monthName = (keys: number[]) => {
    const format = getDateTimeFormat(locale, {
      month: keys.length > 2 ? 'short' : 'long',
      timeZone: 'UTC',
    });
    return (m: number) => format.format(Date.UTC(2024, m - 1, 12));
  };
  const dayName = (d: number, inRange: boolean) =>
    weekdayName(d, locale, inRange ? 'short' : 'long');

  const days = (keys: number[]) =>
    keys.length ? formatRuns(keys, WEEKDAYS_MONDAY_FIRST, locale, dayName) : null;
  const months = (keys: number[]) =>
    keys.length ? formatRuns(keys, MONTHS, locale, monthName(keys)) : null;

  const quiet = { days: days(bestDays.quietDays), months: months(bestDays.quietMonths) };
  const busy = { days: days(bestDays.busyDays), months: months(bestDays.busyMonths) };
  const tiered = bestDays.quietDays.length + bestDays.busyDays.length > 0;

  return (
    <div data-park-best-days className={cn('mt-4 flex flex-col sm:flex-row sm:gap-10', className)}>
      <div className="sm:w-96 sm:shrink-0">
        {/* Caption and key share one line, which is the phone's whole budget beside the chips; the
          window is left out of that line by CSS, not markup, so the HTML still states it. */}
        <div className="text-muted-foreground mb-1.5 flex flex-wrap items-center justify-between gap-x-3 text-xs">
          <p>
            {t('caption')}
            <span className="max-sm:hidden">, {t('period', { count: bestDays.windowYears })}</span>
          </p>
          {tiered && (
            <p className="flex items-center gap-3" aria-hidden="true">
              <span className="inline-flex items-center gap-1">
                <span className={cn('size-2 rounded-full', CROWD_DOT_CLASS.low)} />
                {tierLabel.quiet}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className={cn('size-2 rounded-full', CROWD_DOT_CLASS.high)} />
                {tierLabel.busy}
              </span>
            </p>
          )}
        </div>
        <ol className="grid grid-cols-7 gap-1">
          {WEEKDAYS_MONDAY_FIRST.map((d) => {
            const tier = bestDays.days[d];
            return (
              <li
                key={d}
                className={cn(
                  'flex h-7 items-center justify-center rounded-md text-xs font-medium',
                  tier
                    ? TIER_CHIP_CLASS[tier]
                    : 'border-border text-muted-foreground border border-dashed'
                )}
              >
                <span aria-hidden="true">{weekdayName(d, locale, 'short')}</span>
                <span className="sr-only">
                  {weekdayName(d, locale)}: {tier ? tierLabel[tier] : t('thin')}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <dl className="hidden text-sm sm:flex sm:gap-10">
        {(quiet.days || quiet.months) && (
          <EndColumn label={t('quietest')} days={quiet.days} months={quiet.months} />
        )}
        {(busy.days || busy.months) && (
          <EndColumn label={t('busiest')} days={busy.days} months={busy.months} />
        )}
      </dl>
    </div>
  );
}
