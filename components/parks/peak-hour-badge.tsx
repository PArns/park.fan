'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useMinuteNowDate } from '@/lib/hooks/use-minute-now';
import { formatDuration } from '@/lib/i18n/time';

interface PeakHourBadgeProps {
  /** ISO 8601 timestamp with offset */
  peakHour: string;
}

export function PeakHourBadge({ peakHour }: PeakHourBadgeProps) {
  const tCommon = useTranslations('common');
  const now = useMinuteNowDate();

  if (!now) return null;

  const target = new Date(peakHour);
  if (isNaN(target.getTime())) return null;

  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const timeRemaining = formatDuration(diffMs, tCommon);

  return (
    <Badge className="bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40 ml-2 border font-bold tracking-wide text-white uppercase backdrop-blur-md">
      <Clock className="h-3 w-3 text-inherit" />
      {tCommon('in')} {timeRemaining}
    </Badge>
  );
}
