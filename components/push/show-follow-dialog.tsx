'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, BellRing } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trackShowFollowAdd, trackShowFollowRemove } from '@/lib/analytics/umami';
import { followShow, unfollowShow } from '@/lib/push/push-follows';
import { isShowFollowedLocal } from '@/lib/push/push-follows-store';
import { useLocalPushFollowsValue } from '@/lib/push/use-local-push-follows-value';

interface ShowFollowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showId: string;
  showName: string;
}

/**
 * Opened by tapping any showtime badge on `ShowCard` — previously a tap
 * there did nothing at all. Explains what the corner bell only names: the
 * reminder fires 25–35 minutes before whichever showtime comes next, not
 * the one that was tapped, because `ShowFollow` on the API has no per-
 * showtime scope — a park's schedule shifts by the day and the alert is
 * "watch this show", not "watch this exact clock time".
 */
export function ShowFollowDialog({ open, onOpenChange, showId, showName }: ShowFollowDialogProps) {
  const t = useTranslations('pushAlerts.showDialog');
  const [following, setFollowing] = useLocalPushFollowsValue(
    false,
    () => isShowFollowedLocal(showId),
    [showId]
  );
  const [pending, setPending] = useState(false);

  const handleToggle = async () => {
    setPending(true);
    if (following) {
      setFollowing(false);
      await unfollowShow(showId);
      setPending(false);
      trackShowFollowRemove();
      return;
    }
    const result = await followShow(showId);
    setPending(false);
    if (result.ok) {
      setFollowing(true);
      trackShowFollowAdd('card');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-sm">
        <div className="shrink-0 border-b px-5 py-3 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="size-4 shrink-0" aria-hidden="true" />
            {showName}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs leading-snug">
            {t('explain', { show: showName })}
          </DialogDescription>
        </div>

        <div className="flex shrink-0 justify-end gap-2 px-3 py-3 sm:px-6">
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {t('close')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={following ? 'secondary' : 'default'}
            onClick={handleToggle}
            disabled={pending}
          >
            {following ? (
              <>
                <BellRing className="size-3.5 shrink-0" aria-hidden="true" />
                {t('unfollow')}
              </>
            ) : (
              <>
                <Bell className="size-3.5 shrink-0" aria-hidden="true" />
                {t('follow')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
