'use client';

import { Check, MousePointerClick } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/**
 * The line above the hub calendar's grid that says what a press on a tile does. Without a pick:
 * pick a day at a park and the other parks show their quietest free day. With picks: how many days
 * are planned, that the stars now mark the free days, and a button that clears them. The button
 * stays mounted and fades, so the line keeps its height. `announced` is what the last press
 * changed, for a screen reader (`aria-live`).
 */
export function HubPickLine({
  count,
  announced,
  onReset,
}: {
  /** The days of the window with a pick. */
  count: number;
  announced: string;
  onReset: () => void;
}) {
  const t = useTranslations('tripHub.calendar');
  const picking = count > 0;
  return (
    <div className="text-muted-foreground flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:min-h-8">
      <p className="flex min-w-0 items-center gap-1.5">
        {picking ? (
          <span
            aria-hidden
            className="bg-primary text-primary-foreground flex size-4 shrink-0 items-center justify-center rounded-full"
          >
            <Check className="size-3" strokeWidth={3.5} />
          </span>
        ) : (
          <MousePointerClick aria-hidden className="text-primary size-4 shrink-0" />
        )}
        <span>
          {picking ? (
            <>
              <span className="text-foreground font-semibold">{t('picksCount', { count })}</span>{' '}
              {t('picksNote')}
            </>
          ) : (
            t('pickHint')
          )}
        </span>
      </p>
      <button
        type="button"
        onClick={onReset}
        aria-hidden={!picking}
        tabIndex={picking ? 0 : -1}
        className={cn(
          'text-primary-ink hover:text-foreground min-h-11 text-xs font-medium underline-offset-2 transition-[opacity,visibility] duration-200 hover:underline sm:min-h-0',
          !picking && 'invisible opacity-0'
        )}
      >
        {t('picksReset')}
      </button>
      <p aria-live="polite" className="sr-only">
        {announced}
      </p>
    </div>
  );
}
