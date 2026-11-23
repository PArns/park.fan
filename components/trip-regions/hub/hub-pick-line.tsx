'use client';

import { Check, MousePointerClick } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PICK_BADGE } from '@/components/parks/calendar-tile-marks';

/**
 * The line above the hub calendar's grid that says what a press on a tile does. Without a pick:
 * pick a day at a park and the other parks show their quietest free day. With picks: how many days
 * are planned, what the stars mean now, the button that takes the picks into the trip planner and
 * the one that clears them. The buttons stay mounted and fade, out of the flow while hidden. `announced` is what the last press
 * changed, for a screen reader (`aria-live`).
 */
export function HubPickLine({
  count,
  announced,
  onApply,
  onReset,
}: {
  /** The days of the window with a pick. */
  count: number;
  announced: string;
  /** Opens the trip planner on the picks (`picksPlanQuery`). */
  onApply: () => void;
  onReset: () => void;
}) {
  const t = useTranslations('tripHub.calendar');
  const picking = count > 0;
  return (
    <div className="text-muted-foreground relative flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:min-h-8">
      <p className="flex min-w-0 items-center gap-1.5">
        {picking ? (
          <span
            aria-hidden
            className={cn(
              PICK_BADGE,
              'flex size-4 shrink-0 items-center justify-center rounded-full'
            )}
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
      {/* Mounted while hidden and out of the flow, so they fade and hold no empty line on a phone. */}
      <span
        aria-hidden={!picking}
        className={cn(
          'flex items-center gap-3 transition-[opacity,visibility] duration-200',
          !picking && 'invisible absolute right-0 opacity-0'
        )}
      >
        <Button type="button" size="sm" onClick={onApply} tabIndex={picking ? 0 : -1}>
          {t('picksApply')}
        </Button>
        <button
          type="button"
          onClick={onReset}
          tabIndex={picking ? 0 : -1}
          className="text-primary-ink hover:text-foreground min-h-11 text-xs font-medium underline-offset-2 hover:underline sm:min-h-0"
        >
          {t('picksReset')}
        </button>
      </span>
      <p aria-live="polite" className="sr-only">
        {announced}
      </p>
    </div>
  );
}
