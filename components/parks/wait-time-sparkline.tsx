'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import type { AttractionStatistics } from '@/lib/api/types';
import { Sparkline, type SparklinePoint } from './sparkline';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { formatTime } from '@/lib/utils/intl-format';

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
      if (last.x < now) {
        data.push({ x: now, label: '', value: last.value });
      }
    }

    return data;
  }, [history, now]);

  // Cached formatter — this runs from `formatTooltip`, i.e. on every pointer move across the
  // sparkline, and `toLocaleTimeString` builds a fresh Intl formatter on each call.
  const fmtTime = (ms: number) =>
    formatTime(ms, locale, {
      hour: '2-digit',
      minute: '2-digit',
      ...(timezone ? { timeZone: timezone } : {}),
    });

  return (
    <Sparkline
      points={points}
      className={className}
      formatTooltip={(p) => ({ label: fmtTime(p.x), value: `${p.value} min` })}
    />
  );
}
