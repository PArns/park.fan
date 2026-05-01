'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';

interface HistoryPoint {
  timestamp: string;
  waitTime: number;
}

interface WaitTimeSparklineCardProps {
  history: HistoryPoint[];
  timezone?: string;
  className?: string;
  fallbackWaitTime?: number;
}

export function WaitTimeSparklineCard({
  history,
  timezone,
  className,
  fallbackWaitTime,
}: WaitTimeSparklineCardProps) {
  const locale = useLocale();
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNowMs(Date.now());
    const timeout = setTimeout(update, 0);
    const interval = setInterval(update, 60_000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const rawData = history
    .map((p) => ({ time: new Date(p.timestamp).getTime(), value: p.waitTime }))
    .filter((p) => Number.isFinite(p.time));

  const data =
    rawData.length > 0
      ? rawData
      : fallbackWaitTime !== undefined && nowMs !== null
        ? [{ time: nowMs - 60 * 60 * 1000, value: fallbackWaitTime }]
        : null;

  if (!data) return null;

  const minTime = data[0].time;
  const lastPoint = data[data.length - 1];
  // Extend the x-axis to "now" so the chart always reaches the right edge.
  // Use lastPoint.time during SSR (nowMs is null) to match server/client output.
  const maxTime = nowMs !== null ? Math.max(lastPoint.time, nowMs) : lastPoint.time;
  const range = maxTime - minTime;
  if (range <= 0) return null;

  const maxWait = Math.max(...data.map((p) => p.value), 10);
  const getX = (time: number) => ((time - minTime) / range) * 100;
  const getY = (value: number) => 10 + (1 - value / maxWait) * 80;

  // Smooth curve through the real data points, then a flat tail to "now".
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
  if (nowMs !== null && nowMs > lastPoint.time) {
    const x = getX(nowMs);
    const y = getY(lastPoint.value);
    pathD += ` L ${x.toFixed(2)},${y.toFixed(2)}`;
  }

  const fmt = (ms: number) =>
    new Date(ms).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...(timezone ? { timeZone: timezone } : {}),
    });

  // Show ~4 evenly spaced time labels across the axis — start, two interior
  // ticks, and the current time on the right.
  const TICK_COUNT = 4;
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const t = minTime + (range * i) / (TICK_COUNT - 1);
    const x = (i / (TICK_COUNT - 1)) * 100;
    return { label: fmt(t), x };
  });

  return (
    <div className={`relative h-full w-full ${className ?? ''}`}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-[calc(100%-20px)] w-full overflow-visible"
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
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-1 text-[10px] leading-none font-medium tabular-nums opacity-60">
        {ticks.map((tick, i) => (
          <span
            key={i}
            className="absolute"
            style={{
              left: `${tick.x}%`,
              transform:
                i === 0
                  ? 'translateX(0)'
                  : i === ticks.length - 1
                    ? 'translateX(-100%)'
                    : 'translateX(-50%)',
            }}
          >
            {tick.label}
          </span>
        ))}
      </div>
    </div>
  );
}
