'use client';

import { useEffect } from 'react';
import { refreshPushTimezone } from '@/lib/push/push-timezone';

/**
 * The one reader of the browser's current time zone, mounted once per page load in the layout:
 * the visitor it exists for travels, and their bells are already on, so nothing they touch would
 * run the write. Cheap: `refreshPushTimezone` returns after two `localStorage` reads on a browser
 * with nothing armed. On mount only, since a zone changes a handful of times in a subscription's
 * life.
 */
export function PushTimezoneSync() {
  useEffect(() => {
    // Fire and forget: the function never throws and never reports to the
    // visitor. There is nothing to say about it — the alerts keep working
    // either way, they are just quiet at the wrong hours until it lands.
    void refreshPushTimezone();
  }, []);

  return null;
}
