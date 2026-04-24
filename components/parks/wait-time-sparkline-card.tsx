import { useLocale, useTranslations } from 'next-intl';

interface HistoryPoint {
  timestamp: string;
  waitTime: number;
}

interface WaitTimeSparklineCardProps {
  history: HistoryPoint[];
  timezone?: string;
  className?: string;
}

/**
 * Non-interactive, card-sized sparkline showing wait-time history with:
 *   - a "now" vertical line with label
 *   - start / end time labels
 *
 * Server-rendered — no client JS, no hydration, no timers. The `now` marker is
 * frozen to the server render timestamp; the surrounding page revalidates
 * frequently enough that the line stays roughly current.
 */
export function WaitTimeSparklineCard({
  history,
  timezone,
  className,
}: WaitTimeSparklineCardProps) {
  const locale = useLocale();
  const t = useTranslations('attractions');

  if (!history || history.length < 2) return null;

  const data = history
    .map((p) => ({ time: new Date(p.timestamp).getTime(), value: p.waitTime }))
    .filter((p) => Number.isFinite(p.time));
  if (data.length < 2) return null;

  const minTime = data[0].time;
  const maxTime = data[data.length - 1].time;
  const range = maxTime - minTime;
  if (range <= 0) return null;

  const maxWait = Math.max(...data.map((p) => p.value), 10);
  const getX = (time: number) => ((time - minTime) / range) * 100;
  const getY = (value: number) => 10 + (1 - value / maxWait) * 80; // 10% padding top/bottom

  let pathD = '';
  data.forEach((p, i) => {
    const x = getX(p.time);
    const y = getY(p.value);
    if (i === 0) {
      pathD += `M ${x.toFixed(2)},${y.toFixed(2)}`;
    } else {
      const prev = data[i - 1];
      const midX = ((x - getX(prev.time)) / 2 + getX(prev.time)).toFixed(2);
      const prevY = getY(prev.value).toFixed(2);
      pathD += ` C ${midX},${prevY} ${midX},${y.toFixed(2)} ${x.toFixed(2)},${y.toFixed(2)}`;
    }
  });

  // Server render time — page revalidation keeps this fresh enough for the
  // "now" marker. No client-side updating.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const nowX = nowMs >= minTime && nowMs <= maxTime ? getX(nowMs) : null;
  const showNowLabel = nowX !== null && nowX > 15 && nowX < 85;

  const fmt = (ms: number) =>
    new Date(ms).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...(timezone ? { timeZone: timezone } : {}),
    });

  const startLabel = fmt(minTime);
  const endLabel = fmt(maxTime);

  return (
    <div className={`relative h-full w-full ${className ?? ''}`}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-[calc(100%-14px)] w-full overflow-visible"
        aria-hidden="true"
      >
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-70"
        />
        {nowX !== null && (
          <line
            x1={nowX}
            x2={nowX}
            y1="6"
            y2="94"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
            className="opacity-30"
          />
        )}
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between text-[10px] font-medium tabular-nums opacity-60">
        <span>{startLabel}</span>
        {showNowLabel && nowX !== null && (
          <span className="absolute -translate-x-1/2" style={{ left: `${nowX}%` }}>
            {t('now')}
          </span>
        )}
        <span>{endLabel}</span>
      </div>
    </div>
  );
}
