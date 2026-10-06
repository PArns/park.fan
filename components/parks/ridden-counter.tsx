'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import {
  getRiddenSnapshot,
  getServerRiddenSnapshot,
  subscribeToRidden,
} from '@/lib/utils/ridden-rides';

interface RiddenCounterProps {
  /** The ids of the rides the park lists today, closed-for-good rides left out. */
  rideIds: readonly string[];
}

/**
 * „x of y rides ridden" in the park header, once at least one ride is marked. The line is always
 * in the layout at its own height (`h-5`), so the number appearing after hydration moves nothing;
 * until then it holds its place hidden. Marks for rides the park no longer lists are not counted.
 */
export function RiddenCounter({ rideIds }: RiddenCounterProps) {
  const t = useTranslations('attractions');
  const count = useSyncExternalStore(
    subscribeToRidden,
    () => {
      const ridden = getRiddenSnapshot();
      let n = 0;
      for (const id of rideIds) if (ridden.has(id)) n++;
      return n;
    },
    () => getServerRiddenSnapshot().size
  );

  return (
    <p className="text-muted-foreground mt-3 h-5 text-sm leading-5 tabular-nums" aria-live="polite">
      {count > 0 ? t('riddenProgress', { count, total: rideIds.length }) : null}
    </p>
  );
}
