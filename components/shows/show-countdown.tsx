'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

interface ShowCountdownProps {
  nextShowtime: string;
}

/**
 * Client component that displays a countdown to the next show
 */
export function ShowCountdown({ nextShowtime }: ShowCountdownProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Calculate time until show
  const getCountdownMessage = (): string | null => {
    const showStart = new Date(nextShowtime);

    // Only show countdown if show is in the future
    if (showStart <= currentTime) {
      return null;
    }

    const diffMs = showStart.getTime() - currentTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0 && minutes > 0) {
      return `${t('nextShowIn')} ${hours} ${tCommon('hour', { count: hours })} ${minutes} ${tCommon('minute', { count: minutes })}`;
    } else if (hours > 0) {
      return `${t('nextShowIn')} ${hours} ${tCommon('hour', { count: hours })}`;
    } else if (minutes > 0) {
      return `${t('nextShowIn')} ${minutes} ${tCommon('minute', { count: minutes })}`;
    } else {
      return t('showStartingSoon');
    }
  };

  const countdown = getCountdownMessage();

  if (!countdown) {
    return null;
  }

  return (
    <Badge variant="secondary" className="mt-2 text-xs font-medium">
      {countdown}
    </Badge>
  );
}
