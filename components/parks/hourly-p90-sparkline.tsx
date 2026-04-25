'use client';

import { useMemo } from 'react';
import type { AttractionHistoryDay } from '@/lib/api/types';
import { Sparkline, type SparklinePoint } from './sparkline';

interface HourlyP90SparklineProps {
  hourlyP90: AttractionHistoryDay['hourlyP90'];
  className?: string;
}

export function HourlyP90Sparkline({ hourlyP90, className }: HourlyP90SparklineProps) {
  const points: SparklinePoint[] = useMemo(() => {
    if (!hourlyP90 || hourlyP90.length === 0) return [];

    return [...hourlyP90]
      .map((point) => {
        const [hStr, mStr] = point.hour.split(':');
        const hourNum = parseInt(hStr, 10) + parseInt(mStr || '0', 10) / 60;
        return { x: hourNum, label: point.hour, value: point.value };
      })
      .sort((a, b) => a.x - b.x);
  }, [hourlyP90]);

  return (
    <Sparkline
      points={points}
      className={className}
      formatTooltip={(p) => ({ label: p.label, value: `${p.value} min` })}
    />
  );
}
