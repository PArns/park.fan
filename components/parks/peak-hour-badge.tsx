'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface PeakHourBadgeProps {
  peakHour: string;
}

export function PeakHourBadge({ peakHour }: PeakHourBadgeProps) {
  const tCommon = useTranslations('common');
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const getTargetDate = () => {
      // If peakHour contains 'T', assume it's a full ISO string
      if (peakHour.includes('T')) {
        return new Date(peakHour);
      }

      // Assume HH:mm string in UTC (as established by the user task context)
      const [h, m] = peakHour.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) return null;

      const d = new Date();
      d.setUTCHours(h, m, 0, 0);

      // Handle day wrap-around for UTC times (e.g. 00:00 UTC might be tomorrow)
      const now = new Date();
      if (d.getTime() < now.getTime() - 12 * 60 * 60 * 1000) {
        d.setDate(d.getDate() + 1);
      }

      return d;
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
  }, [peakHour, tCommon]);

  if (!shouldShow || !timeRemaining) return null;

  return (
    <Badge variant="outline" className="ml-2 gap-1 px-1.5 py-0 font-normal">
      <Clock className="h-3 w-3" />
      <span className="text-xs">
        {tCommon('in')} {timeRemaining}
      </span>
    </Badge>
  );
}
