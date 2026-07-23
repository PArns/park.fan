import { getGlobalBestTimes, type BestTimeBucket } from '@/lib/api/best-times';
import type { CrowdLevel } from '@/lib/api/types';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { Clock } from 'lucide-react';

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
  /** Shown while the live aggregate has not built up enough data yet. */
  pending: string;
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
        const pctText = Math.abs(pct) <= 3 ? labels.typical : `${Math.abs(pct)} % ${suffix}`;
        const isQuietest = b.key === quietestKey;
        return (
          <div
            key={b.key}
            className="group flex items-center gap-3"
            title={`${name(b.key)}: ${pctText}`}
          >
            <span
              className={
                'w-20 shrink-0 text-sm sm:w-28' +
                (isQuietest ? ' text-primary font-semibold' : ' font-medium')
              }
            >
              {name(b.key)}
            </span>
            <div className="bg-muted h-7 flex-1 overflow-hidden rounded-lg">
              <div
                className="h-full rounded-lg transition-[width,filter] duration-700 group-hover:brightness-110"
                style={{
                  width: `${Math.max(width, 4)}%`,
                  backgroundColor: CROWD_HEX[b.crowdLevel] ?? CROWD_HEX.unknown,
                }}
                aria-hidden
              />
            </div>
            <span className="text-muted-foreground group-hover:text-foreground w-28 shrink-0 text-right text-xs tabular-nums transition-colors sm:w-36">
              {pctText}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Non-empty fallback while the live aggregate is still warming up. */
function PendingPanel({ text }: { text: string }) {
  return (
    <Reveal>
      <div className="bg-card flex items-start gap-3 rounded-2xl border border-dashed p-5 shadow-sm sm:p-6">
        <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Clock className="text-primary h-5 w-5" />
        </div>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">{text}</p>
      </div>
    </Reveal>
  );
}

/**
 * Global best-time charts: relative busyness by weekday and by month, live from
 * `/v1/analytics/best-times`. Weekday/month names are localised via `Intl`.
 * While the aggregate is unreachable or not yet displayable, a compact "warming
 * up" panel is shown instead so the section never renders empty.
 */
export async function BestTimesData({
  locale,
  labels,
}: {
  locale: string;
  labels: BestTimesLabels;
}) {
  const data = await getGlobalBestTimes().catch(() => null);
  if (!data || !data.meta.displayable) return <PendingPanel text={labels.pending} />;

  const weekdayName = (dow: number) =>
    new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(
      new Date(Date.UTC(2023, 0, 1 + dow))
    );
  const monthName = (m: number) =>
    new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(Date.UTC(2023, m - 1, 1)));

  // Drop buckets the aggregate couldn't rank (no samples) — a grey "average" bar
  // in a busyness chart is misleading, so only real-data buckets are shown.
  const hasData = (b?: BestTimeBucket): b is BestTimeBucket =>
    !!b && b.sampleDays > 0 && b.crowdLevel !== 'unknown';

  // Weekdays Monday-first (dow 1..6 then 0=Sunday).
  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
  const byDow = new Map(data.byDayOfWeek.map((b) => [b.key, b]));
  const weekdays = weekdayOrder.map((d) => byDow.get(d)).filter(hasData);
  const months = data.byMonth.filter(hasData).sort((a, b) => a.key - b.key);

  const footnote = labels.footnote
    .replace('{days}', new Intl.NumberFormat(locale).format(data.meta.totalSampleDays))
    .replace('{parks}', String(data.meta.parkCount))
    .replace('{months}', String(data.meta.windowMonths));

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="bg-card space-y-3 rounded-2xl border p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-bold sm:text-xl">{labels.weekdaysTitle}</h3>
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            {labels.weekdaysBody}
          </p>
          <BarList buckets={weekdays} name={weekdayName} labels={labels} />
        </div>
      </Reveal>
      <Reveal delay={80}>
        <div className="bg-card space-y-3 rounded-2xl border p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-bold sm:text-xl">{labels.monthsTitle}</h3>
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            {labels.monthsBody}
          </p>
          <BarList buckets={months} name={monthName} labels={labels} />
        </div>
      </Reveal>
      <p className="text-muted-foreground text-xs">{footnote}</p>
    </div>
  );
}

// Re-export so page/content can reference the crowd type if needed.
export type { CrowdLevel };
