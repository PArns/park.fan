'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { useBrowserNow } from '@/lib/hooks/use-mounted';

interface ShowCountdownProps {
  nextShowtime: string;
}

/**
 * Client component that displays a countdown to the next show.
 * Uses the browser clock only (null until mounted): seeding state with `new Date()` baked the
 * server/build clock into the SSR HTML, which almost never matched the client clock and caused
 * a hydration mismatch (text patch or subtree re-render) on every load.
 */
export function ShowCountdown({ nextShowtime }: ShowCountdownProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const currentTime = useBrowserNow(60_000);

  // Calculate time until show
  const getCountdownMessage = (): string | null => {
    if (!currentTime) return null;
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
