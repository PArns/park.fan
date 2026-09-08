'use client';

import { useCallback, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { trackShowFollowAdd, trackShowFollowRemove } from '@/lib/analytics/umami';
import { followShow, unfollowShow } from '@/lib/push/push-follows';
import { isShowFollowedLocal } from '@/lib/push/push-follows-store';
import { useLocalPushFollowsValue } from '@/lib/push/use-local-push-follows-value';

interface ShowFollowBellProps {
  showId: string;
  showName?: string;
  className?: string;
  /** Where this bell sits — the show's own card, or a row in the park overview. */
  source: 'card' | 'panel';
}

/**
 * "Notify me 30 minutes before this show starts" — the same interaction
 * shape as `FavoriteStar` (hydration-safe: renders "off" on the server, a
 * mount-only effect reads the real state, a window event keeps every bell on
 * the page in sync with the one that was just clicked), sitting in the same
 * corner. Always rendered rather than hidden while push support is still
 * being checked — it is `position: absolute` and has no sibling whose layout
 * depends on it, so there is nothing to reserve and nothing to shift; an
 * unsupported browser simply finds the click does nothing.
 */
export function ShowFollowBell({ showId, showName, className, source }: ShowFollowBellProps) {
  const [following, setFollowing] = useLocalPushFollowsValue(
    false,
    () => isShowFollowedLocal(showId),
    [showId]
  );
  const [pending, setPending] = useState(false);
  const t = useTranslations('pushAlerts.showBell');

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (pending) return;

      setPending(true);
      if (following) {
        setFollowing(false);
        void unfollowShow(showId).finally(() => setPending(false));
        trackShowFollowRemove();
        return;
      }

      void followShow(showId)
        .then((result) => {
          if (result.ok) {
            setFollowing(true);
            trackShowFollowAdd(source);
          }
        })
        .finally(() => setPending(false));
    },
    [following, pending, showId, setFollowing, source]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        'relative z-10 flex items-center justify-center transition-all hover:scale-110',
        'focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none',
        'disabled:pointer-events-none disabled:opacity-60',
        // Same 44 px hit area over a smaller visual box as FavoriteStar — see
        // that component for the measured reasoning.
        'max-sm:after:absolute max-sm:after:top-1/2 max-sm:after:left-1/2 max-sm:after:h-11',
        'max-sm:after:w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2',
        'max-sm:after:content-[""]',
        className
      )}
      aria-label={
        following ? t('following', { name: showName ?? '' }) : t('follow', { name: showName ?? '' })
      }
      aria-pressed={following}
      title={
        following ? t('following', { name: showName ?? '' }) : t('follow', { name: showName ?? '' })
      }
    >
      {following ? (
        <BellRing className="h-4 w-4 fill-amber-400/30 text-amber-500" />
      ) : (
        <Bell className="text-muted-foreground h-4 w-4" />
      )}
    </button>
  );
}
