'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  getRiddenSnapshot,
  getServerRiddenSnapshot,
  subscribeToRidden,
  toggleRidden,
} from '@/lib/utils/ridden-rides';

interface RiddenToggleProps {
  /** The ride's `id`; the mark is kept per id. */
  id: string;
}

/**
 * The card corner's „ridden" switch. It reads one boolean off the ridden store, so marking a ride
 * re-renders this button and the park header's counter and nothing else, and it sits inside the
 * card's link, so the press does not navigate.
 */
export function RiddenToggle({ id }: RiddenToggleProps) {
  const t = useTranslations('attractions');
  const ridden = useSyncExternalStore(
    subscribeToRidden,
    () => getRiddenSnapshot().has(id),
    () => getServerRiddenSnapshot().has(id)
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleRidden(id);
    },
    [id]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'relative z-10 flex h-full w-full items-center justify-center transition-all hover:scale-110',
        'focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none',
        // Same 44 px touch target as the star: a near miss on a phone would open the ride's page.
        'max-sm:after:absolute max-sm:after:top-1/2 max-sm:after:left-1/2 max-sm:after:h-11',
        'max-sm:after:w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2',
        'max-sm:after:content-[""]'
      )}
      aria-label={ridden ? t('riddenUnmark') : t('riddenMark')}
      aria-pressed={ridden}
      title={ridden ? t('riddenUnmark') : t('riddenMark')}
    >
      <Check
        className={cn(
          'h-4 w-4 transition-all',
          ridden ? 'text-emerald-500 dark:text-emerald-400' : 'text-black/40 dark:text-white/45'
        )}
        strokeWidth={ridden ? 3 : 2}
        aria-hidden="true"
      />
    </button>
  );
}
