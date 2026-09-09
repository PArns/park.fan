'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { listRideAlertsLocal } from '@/lib/push/push-follows-store';
import { useLocalPushFollowsValue } from '@/lib/push/use-local-push-follows-value';
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
  const t = useTranslations('pushAlerts.rideDialog');

  // Keyed on the id list rather than `attractions` itself — a fresh array
  // reference every render would otherwise re-run the effect on every
  // render of the panel around it, not just when the ride set changes.
  // Memoized too: `open` toggling (or any other local state here) re-renders
  // this component on its own, and that must not re-join every id on a park
  // with dozens of attractions just to arrive at the same string.
  const idsKey = useMemo(() => attractions.map((a) => a.id).join(','), [attractions]);
  const [count] = useLocalPushFollowsValue(
    0,
    () => {
      const ids = new Set(attractions.map((a) => a.id));
      return listRideAlertsLocal().filter((a) => ids.has(a.attractionId)).length;
    },
    [idsKey]
  );

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
