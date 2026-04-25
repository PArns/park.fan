'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import type { AttractionStatistics } from '@/lib/api/types';
import { Sparkline, type SparklinePoint } from './sparkline';
import { useBrowserNow } from '@/lib/hooks/use-mounted';

interface WaitTimeSparklineProps {
  history: AttractionStatistics['history'];
  timezone?: string;
  className?: string;
}

export function WaitTimeSparkline({ history, timezone, className }: WaitTimeSparklineProps) {
  const locale = useLocale();
  const browserNow = useBrowserNow(null);
  const now = browserNow ? browserNow.getTime() : 0;

  const points: SparklinePoint[] = useMemo(() => {
    if (!history || history.length === 0) return [];

    const data = history.map((point) => ({
      x: new Date(point.timestamp).getTime(),
      label: '',
      value: point.waitTime,
    }));

    if (data.length > 0 && now > 0) {
      const last = data[data.length - 1];
      if (now - last.x > 15 * 60 * 1000) {
        data.push({ x: now, label: '', value: last.value });
      }
    }

    return data;
  }, [history, now]);

  const formatTime = (ms: number) =>
    new Date(ms).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      ...(timezone ? { timeZone: timezone } : {}),
    });

  return (
    <Sparkline
      points={points}
      className={className}
      formatTooltip={(p) => ({ label: formatTime(p.x), value: `${p.value} min` })}
    />
  );
}
