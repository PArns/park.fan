'use client';

import { useEffect } from 'react';
import { refreshPushTimezone } from '@/lib/push/push-timezone';

/**
 * The one reader of the browser's current time zone, mounted once per page
 * load.
 *
 * Why it sits in the layout rather than beside a bell: the visitor this
 * exists for is the one who travels, and travelling is not an interaction
 * with this site. They arm an alert at home, fly, and open a park page — the
 * bells they pass are already on, so nothing they touch would run the write.
 *
 * Why that is cheap anyway: `refreshPushTimezone` leaves after two
 * `localStorage` reads on a browser with nothing armed, which is almost every
 * browser. It renders `null` and has no state, so it costs the tree nothing
 * beyond this file.
 *
 * On mount only, deliberately. A soft navigation does not remount the layout,
 * so this asks once per hard page load — enough for a phone that changed
 * continents since the last one, and no listener kept alive on every page for
 * a change that happens a handful of times in a subscription's life.
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
