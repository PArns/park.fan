'use client';

import { useCallback, useMemo, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { GLASS_CIRCLE_HIT_AREA, GlassCircle } from '@/components/common/glass-circle';
import { getRideAlertLocal } from '@/lib/push/push-follows-store';
import { useLocalPushFollowsValue } from '@/lib/push/use-local-push-follows-value';
import { hasUsableThresholdRange } from '@/lib/push/threshold-minutes';
import { rideAlertKindsFor } from '@/lib/push/ride-alert-picker';
import { RideAlertDialog, type RideAlertDialogAttraction } from './ride-alert-dialog';
import {
  useRideAlertParkAttractions,
  useRideAlertReopenAvailable,
} from './ride-alert-park-context';

interface RideAlertBellProps {
  attractionId: string;
  attractionName: string;
  parkName: string;
  /** The card's own photo, if it has one — this ride's thumbnail in the dialog's list. */
  backgroundImage?: string | null;
  objectPosition?: string;
  /** The card's own current reading, if any — seeds the dialog's slider off the park page. */
  currentWaitTime?: number | null;
  /**
   * The card's live status. A ride that stands keeps its bell where the reopening can be told
   * about, because that alert has no queue to fit under.
   */
  status?: string | null;
}

/**
 * "Notify me when this ride's wait drops below X minutes": a card corner icon like
 * `FavoriteStar`, opening `RideAlertDialog` with this ride picked, since a threshold needs a number
 * a click cannot supply. The other rides come from `RideAlertParkProvider` on the park page;
 * elsewhere the dialog lists this one ride. It draws its own {@link GlassCircle}, because only it
 * knows whether there is an alert to offer, and a wrapped disc would stay behind empty.
 */
export function RideAlertBell({
  attractionId,
  attractionName,
  parkName,
  backgroundImage,
  objectPosition,
  currentWaitTime,
  status,
}: RideAlertBellProps) {
  const [open, setOpen] = useState(false);
  const [alerted] = useLocalPushFollowsValue(false, () => !!getRideAlertLocal(attractionId), [
    attractionId,
  ]);
  // Mounted on the first press and kept, so the close animation still plays. Until then the
  // dialog's own hooks (fetch effect, sorted picker rows) do not run once per card on the page.
  const [dialogMounted, setDialogMounted] = useState(false);
  const t = useTranslations('pushAlerts.rideBell');
  // A constant context, set once per park page, so reading it here re-renders nothing on a poll.
  const reopenAvailable = useRideAlertReopenAvailable();

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDialogMounted(true);
    setOpen(true);
  }, []);

  // A queue this short has no alert left to offer: the threshold may not go under ten minutes,
  // nor within ten of the current reading. An alert already set keeps its bell, the only way to
  // take it off, and so does an open dialog, which would otherwise unmount with it. A stopped ride
  // that offers the reopen alert keeps its bell too.
  const offersReopen = rideAlertKindsFor({ status }, reopenAvailable).includes('reopen');
  if (!alerted && !open && !offersReopen && !hasUsableThresholdRange(currentWaitTime)) return null;

  return (
    <>
      <GlassCircle>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            'relative z-10 flex h-full w-full items-center justify-center transition-all hover:scale-110',
            'focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none',
            GLASS_CIRCLE_HIT_AREA
          )}
          aria-label={
            alerted
              ? t('alerted', { name: attractionName })
              : t('setAlert', { name: attractionName })
          }
          aria-pressed={alerted}
          title={
            alerted
              ? t('alerted', { name: attractionName })
              : t('setAlert', { name: attractionName })
          }
        >
          {alerted ? (
            <BellRing className="h-4 w-4 fill-amber-400/30 text-amber-500" />
          ) : (
            // This bell's only home is the glass photo corner of AttractionCard,
            // so it takes FavoriteStar's `glass` colors directly rather than a
            // variant prop nothing else would ever set to `default`.
            <Bell className="h-4 w-4 fill-black/10 text-black/40 dark:fill-white/20 dark:text-white/45" />
          )}
        </button>
      </GlassCircle>
      {/* The bell's icon follows the dialog's writes through the local mirror: `setRideAlert` and
          `removeRideAlert` update it, and `useLocalPushFollowsValue` re-reads on its event. */}
      {dialogMounted && (
        <RideAlertBellDialog
          open={open}
          onOpenChange={setOpen}
          parkName={parkName}
          attractionId={attractionId}
          attractionName={attractionName}
          backgroundImage={backgroundImage}
          objectPosition={objectPosition}
          currentWaitTime={currentWaitTime}
          status={status}
        />
      )}
    </>
  );
}

/**
 * The bell's dialog, and the only part that reads the park's ride list, which changes with every
 * live poll: only bells somebody has pressed subscribe to it.
 */
function RideAlertBellDialog({
  open,
  onOpenChange,
  parkName,
  attractionId,
  attractionName,
  backgroundImage,
  objectPosition,
  currentWaitTime,
  status,
}: RideAlertBellProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const parkAttractions = useRideAlertParkAttractions();
  const reopenAvailable = useRideAlertReopenAvailable();

  // The park's list when there is one. This ride's own entry is the card's: its reading is the
  // one the bell's visibility rule just read, where the list counts a wait only while the ride is
  // `OPERATING`. Added when the list does not carry the ride, so the dialog can always pick it.
  const dialogAttractions = useMemo((): RideAlertDialogAttraction[] => {
    const self: RideAlertDialogAttraction = {
      id: attractionId,
      name: attractionName,
      currentWaitTime,
      status,
      backgroundImage,
      backgroundPosition: objectPosition,
    };
    if (!parkAttractions) return [self];
    if (!parkAttractions.some((a) => a.id === attractionId)) return [...parkAttractions, self];
    return parkAttractions.map((a) =>
      a.id === attractionId
        ? {
            ...a,
            currentWaitTime,
            status: status ?? a.status,
            backgroundImage: backgroundImage ?? a.backgroundImage,
            backgroundPosition: objectPosition ?? a.backgroundPosition,
          }
        : a
    );
  }, [
    parkAttractions,
    attractionId,
    attractionName,
    currentWaitTime,
    status,
    backgroundImage,
    objectPosition,
  ]);

  return (
    <RideAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      parkName={parkName}
      attractions={dialogAttractions}
      initialAttractionId={attractionId}
      reopenAvailable={reopenAvailable}
    />
  );
}
