'use client';

import { useTranslations } from 'next-intl';
import { fromZonedTime } from 'date-fns-tz';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { formatDuration } from '@/lib/i18n/time';

interface PeakHourBadgeProps {
  peakHour: string;
  timezone: string;
}

function getPeakHourTarget(peakHour: string, timezone: string): Date | null {
  if (peakHour.includes('T')) return new Date(peakHour);
  const [h, m] = peakHour.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  return fromZonedTime(`${today}T${peakHour}:00`, timezone);
}

export function PeakHourBadge({ peakHour, timezone }: PeakHourBadgeProps) {
  const tCommon = useTranslations('common');
  const now = useBrowserNow(60_000);

  if (!now) return null;

  const target = getPeakHourTarget(peakHour, timezone);
  if (!target) return null;

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
