'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fromZonedTime } from 'date-fns-tz';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface PeakHourBadgeProps {
  peakHour: string;
  timezone: string;
}

export function PeakHourBadge({ peakHour, timezone }: PeakHourBadgeProps) {
  const tCommon = useTranslations('common');
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const getTargetDate = () => {
      // If peakHour contains 'T', assume it's a full ISO string
      if (peakHour.includes('T')) {
        return new Date(peakHour);
      }

      // peakHour is HH:mm in the park's LOCAL timezone
      const [h, m] = peakHour.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) return null;

      const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
      return fromZonedTime(`${today}T${peakHour}:00`, timezone);
    };

    const calculateTimeRemaining = () => {
      const now = new Date();
      const target = getTargetDate();

      if (!target) {
        setShouldShow(false);
        return;
      }

      const diffMs = target.getTime() - now.getTime();

      // Ensure we don't show the badge if the peak hour has passed
      if (diffMs <= 0) {
        setShouldShow(false);
        return;
      }

      setShouldShow(true);

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0 && minutes > 0) {
        setTimeRemaining(
          `${hours} ${tCommon('hour', { count: hours })} ${minutes} ${tCommon('minute', { count: minutes })}`
        );
      } else if (hours > 0) {
        setTimeRemaining(`${hours} ${tCommon('hour', { count: hours })}`);
      } else {
        setTimeRemaining(`${minutes} ${tCommon('minute', { count: minutes })}`);
      }
    };

    calculateTimeRemaining();
    // Update every minute
    const interval = setInterval(calculateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [peakHour, timezone, tCommon]);

  if (!shouldShow || !timeRemaining) return null;

  return (
    <Badge className="bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40 ml-2 border font-bold tracking-wide text-white uppercase backdrop-blur-md">
      <Clock className="h-3 w-3 text-inherit" />
      {tCommon('in')} {timeRemaining}
    </Badge>
  );
}
