'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
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
 * „x of y rides ridden" at the end of the title card's location line, once at least one ride is
 * marked; „✓ x/y" below `sm`, where the line has no room for the sentence. That line has a fixed
 * height, so the number appearing after hydration moves nothing, and the card holds no empty line
 * open for it on every park page for the few readers who mark rides. The element stays in the DOM
 * while empty, so the live region exists before the first mark. Marks for rides the park no
 * longer lists are not counted.
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
    <p
      className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-sm tabular-nums"
      aria-live="polite"
    >
      {count > 0 && (
        <>
          <Check className="text-status-operating size-4" aria-hidden="true" />
          <span className="sm:hidden" aria-hidden="true">
            {count}/{rideIds.length}
          </span>
          <span className="max-sm:sr-only">
            {t('riddenProgress', { count, total: rideIds.length })}
          </span>
        </>
      )}
    </p>
  );
}
