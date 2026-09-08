'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { PUSH_FOLLOWS_CHANGED_EVENT, listRideAlertsLocal } from '@/lib/push/push-follows-store';
import { RideAlertDialog, type RideAlertDialogAttraction } from './ride-alert-dialog';

interface RideAlertsEntryButtonProps {
  parkName: string;
  attractions: RideAlertDialogAttraction[];
}

/**
 * The central "manage wait-time alerts" entry point for this park — sits
 * beside `allAttractionsLink` in `ParkTodayPanel`'s headliner column rather
 * than in the panel's own tightly-measured header strip (see that file's own
 * comment on why nothing new goes there).
 */
export function RideAlertsEntryButton({ parkName, attractions }: RideAlertsEntryButtonProps) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const t = useTranslations('pushAlerts.rideDialog');

  useEffect(() => {
    const ids = new Set(attractions.map((a) => a.id));
    const recompute = () =>
      setCount(listRideAlertsLocal().filter((a) => ids.has(a.attractionId)).length);
    recompute();
    window.addEventListener(PUSH_FOLLOWS_CHANGED_EVENT, recompute);
    return () => window.removeEventListener(PUSH_FOLLOWS_CHANGED_EVENT, recompute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attractions.map((a) => a.id).join(',')]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-primary flex items-center gap-1 text-xs whitespace-nowrap hover:underline"
      >
        <Bell className="size-3 shrink-0" aria-hidden="true" />
        {count > 0 ? t('entryWithCount', { count }) : t('entry')}
      </button>
      <RideAlertDialog
        open={open}
        onOpenChange={setOpen}
        parkName={parkName}
        attractions={attractions}
      />
    </>
  );
}
