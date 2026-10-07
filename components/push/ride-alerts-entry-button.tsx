'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PHONE_HIT_AREA } from '@/lib/utils/touch-target';
import { listRideAlertsLocal } from '@/lib/push/push-follows-store';
import { useLocalPushFollowsValue } from '@/lib/push/use-local-push-follows-value';
import { RideAlertDialog, type RideAlertDialogAttraction } from './ride-alert-dialog';

interface RideAlertsEntryButtonProps {
  parkName: string;
  attractions: RideAlertDialogAttraction[];
  /**
   * `link` is the text link in `ParkTodayPanel`. `heading` is the button at the end of the
   * attraction list's headliner heading (`LandSection`'s `action`), for a visitor who arrived
   * from search and has not met the bell on a ride card; it carries what an alert does as its
   * `title`. Both open the same dialog, so there is one way to set an alert.
   */
  variant?: 'link' | 'heading';
  /** `hasReadableWaitTimes(park)` — see `RideAlertDialog`. */
  reopenAvailable: boolean;
}

/**
 * The central "manage wait-time alerts" entry point for this park, in two places: beside
 * `allAttractionsLink` in `ParkTodayPanel`'s headliner column rather than in the panel's own
 * tightly-measured header strip (see that file's own comment on why nothing new goes there), and
 * at the end of the attraction list's headliner heading.
 */
export function RideAlertsEntryButton({
  parkName,
  attractions,
  variant = 'link',
  reopenAvailable,
}: RideAlertsEntryButtonProps) {
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

  const label = count > 0 ? t('entryWithCount', { count }) : t('entry');

  return (
    <>
      {variant === 'heading' ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          title={t('nudge')}
          // `max-sm:h-8` takes the button off the scale's 44 px phone tier to fit the heading's
          // 50 px phone line, where only the bell and the count are shown; `PHONE_HIT_AREA` keeps
          // the reach at 44.
          className={cn('bg-transparent max-sm:h-8 dark:bg-transparent', PHONE_HIT_AREA)}
          onClick={() => setOpen(true)}
        >
          {count > 0 ? (
            <BellRing className="fill-amber-400/30 text-amber-500" aria-hidden="true" />
          ) : (
            <Bell aria-hidden="true" />
          )}
          <span className="max-sm:sr-only">{label}</span>
          {count > 0 && (
            <span aria-hidden="true" className="tabular-nums sm:hidden">
              {count}
            </span>
          )}
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'text-primary flex items-center gap-1 text-xs whitespace-nowrap hover:underline',
            PHONE_HIT_AREA
          )}
        >
          <Bell className="size-3 shrink-0" aria-hidden="true" />
          {label}
        </button>
      )}
      <RideAlertDialog
        open={open}
        onOpenChange={setOpen}
        parkName={parkName}
        attractions={attractions}
        reopenAvailable={reopenAvailable}
      />
    </>
  );
}
