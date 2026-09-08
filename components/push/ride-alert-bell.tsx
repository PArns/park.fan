'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getRideAlertLocal, PUSH_FOLLOWS_CHANGED_EVENT } from '@/lib/push/push-follows-store';
import { RideAlertQuickDialog } from './ride-alert-quick-dialog';

interface RideAlertBellProps {
  attractionId: string;
  attractionName: string;
  parkName: string;
  className?: string;
}

/**
 * "Notify me when this ride's wait drops below X minutes" — a card corner
 * icon in the same style as `FavoriteStar`/`ShowFollowBell`, opening
 * `RideAlertQuickDialog` rather than toggling anything itself: a threshold
 * needs a number, which a single click cannot supply.
 */
export function RideAlertBell({
  attractionId,
  attractionName,
  parkName,
  className,
}: RideAlertBellProps) {
  const [open, setOpen] = useState(false);
  const [alerted, setAlerted] = useState(false);
  const t = useTranslations('pushAlerts.rideBell');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlerted(!!getRideAlertLocal(attractionId));
  }, [attractionId]);

  useEffect(() => {
    const handleChanged = () => setAlerted(!!getRideAlertLocal(attractionId));
    window.addEventListener(PUSH_FOLLOWS_CHANGED_EVENT, handleChanged);
    return () => window.removeEventListener(PUSH_FOLLOWS_CHANGED_EVENT, handleChanged);
  }, [attractionId]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'relative z-10 flex items-center justify-center transition-all hover:scale-110',
          'focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none',
          'max-sm:after:absolute max-sm:after:top-1/2 max-sm:after:left-1/2 max-sm:after:h-11',
          'max-sm:after:w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2',
          'max-sm:after:content-[""]',
          className
        )}
        aria-label={
          alerted ? t('alerted', { name: attractionName }) : t('setAlert', { name: attractionName })
        }
        aria-pressed={alerted}
        title={
          alerted ? t('alerted', { name: attractionName }) : t('setAlert', { name: attractionName })
        }
      >
        {alerted ? (
          <BellRing className="h-4 w-4 fill-amber-400/30 text-amber-500" />
        ) : (
          // This bell's only home is the glass photo corner of AttractionCard,
          // so it takes FavoriteStar's `glass` colors directly rather than a
          // variant prop nothing else would ever set to `default`.
          <Bell className="fill-black/10 text-black/40 dark:fill-white/20 dark:text-white/45" />
        )}
      </button>
      <RideAlertQuickDialog
        open={open}
        onOpenChange={setOpen}
        attractionId={attractionId}
        attractionName={attractionName}
        parkName={parkName}
        onSaved={setAlerted}
      />
    </>
  );
}
