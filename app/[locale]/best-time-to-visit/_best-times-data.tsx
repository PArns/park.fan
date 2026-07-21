import { getGlobalBestTimes, type BestTimeBucket } from '@/lib/api/best-times';
import type { CrowdLevel } from '@/lib/api/types';

export interface BestTimesLabels {
  weekdaysTitle: string;
  weekdaysBody: string;
  monthsTitle: string;
  monthsBody: string;
  /** suffix for a below-average bucket, e.g. "quieter than average" */
  quieter: string;
  /** suffix for an above-average bucket, e.g. "busier than average" */
  busier: string;
  /** "≈ typical" label for a bucket within ±3 % of the average */
  typical: string;
  /** e.g. "Based on {days} park-days across {parks} parks, last {months} months." */
  footnote: string;
}

// Crowd colours (match CrowdLevelBadge / the Fancast spectrum).
const CROWD_HEX: Record<string, string> = {
  very_low: '#0d9488',
  low: '#10b981',
  moderate: '#22c55e',
  high: '#f97316',
  very_high: '#f43f5e',
  extreme: '#dc2626',
  unknown: '#94a3b8',
};

function BarList({
  buckets,
  name,
  labels,
}: {
  buckets: BestTimeBucket[];
  name: (key: number) => string;
  labels: BestTimesLabels;
}) {
  const maxIndex = Math.max(...buckets.map((b) => b.relativeIndex), 1);
  const quietestKey = buckets.reduce(
    (min, b) => (b.relativeIndex < min.relativeIndex ? b : min),
    buckets[0]
  )?.key;

  return (
    <div className="space-y-2">
      {buckets.map((b) => {
        const pct = Math.round((b.relativeIndex - 1) * 100);
        const width = Math.round((b.relativeIndex / maxIndex) * 100);
        const suffix =
          Math.abs(pct) <= 3 ? labels.typical : pct < 0 ? labels.quieter : labels.busier;
        const pctText =
          Math.abs(pct) <= 3 ? labels.typical : `${Math.abs(pct)} % ${suffix}`;
        return (
          <div key={b.key} className="flex items-center gap-3">
            <span
              className={
                'w-20 shrink-0 text-sm sm:w-28' +
                (b.key === quietestKey ? ' text-primary font-semibold' : ' font-medium')
              }
            >
              {name(b.key)}
            </span>
            <div className="bg-muted h-6 flex-1 overflow-hidden rounded">
              <div
                className="h-full rounded"
                style={{
                  width: `${Math.max(width, 4)}%`,
                  backgroundColor: CROWD_HEX[b.crowdLevel] ?? CROWD_HEX.unknown,
                }}
                aria-hidden
              />
            </div>
            <span className="text-muted-foreground w-28 shrink-0 text-right text-xs tabular-nums sm:w-36">
              {pctText}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Global best-time charts: relative busyness by weekday and by month, live from
 * `/v1/analytics/best-times`. Weekday/month names are localised via `Intl`.
 * Renders nothing (the page keeps its evergreen sections) if the aggregate is
 * unreachable or not yet displayable.
 */
export async function BestTimesData({
  locale,
  labels,
}: {
  locale: string;
  labels: BestTimesLabels;
}) {
  const data = await getGlobalBestTimes().catch(() => null);
  if (!data || !data.meta.displayable) return null;

  const weekdayName = (dow: number) =>
    new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(
      new Date(Date.UTC(2023, 0, 1 + dow))
    );
  const monthName = (m: number) =>
    new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(Date.UTC(2023, m - 1, 1)));

  // Weekdays Monday-first (dow 1..6 then 0=Sunday).
  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
  const byDow = new Map(data.byDayOfWeek.map((b) => [b.key, b]));
  const weekdays = weekdayOrder.map((d) => byDow.get(d)).filter(Boolean) as BestTimeBucket[];
  const months = [...data.byMonth].sort((a, b) => a.key - b.key);

  const footnote = labels.footnote
    .replace('{days}', new Intl.NumberFormat(locale).format(data.meta.totalSampleDays))
    .replace('{parks}', String(data.meta.parkCount))
    .replace('{months}', String(data.meta.windowMonths));

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h2 className="text-xl font-bold sm:text-2xl">{labels.weekdaysTitle}</h2>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">{labels.weekdaysBody}</p>
        <BarList buckets={weekdays} name={weekdayName} labels={labels} />
      </div>
      <div className="space-y-3">
        <h2 className="text-xl font-bold sm:text-2xl">{labels.monthsTitle}</h2>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">{labels.monthsBody}</p>
        <BarList buckets={months} name={monthName} labels={labels} />
      </div>
      <p className="text-muted-foreground text-xs">{footnote}</p>
    </div>
  );
}

// Re-export so page/content can reference the crowd type if needed.
export type { CrowdLevel };
