'use client';

import { useTranslations } from 'next-intl';
import { Crown, Pin } from 'lucide-react';
import { PlannerRideThumb } from './planner-ride-thumb';
import type { FitWish } from '@/lib/planner/fit';
import { cn } from '@/lib/utils';

/**
 * The rides the day is being decided over, in the order they are given up in. The checkbox says
 * whether a ride is wanted at all; the pin moves it up the order the engine reads as
 * `OptimizeInput.priority`. The list renders `fitOrder(...)`, never a sort of its own, so the
 * bottom of the screen is what the engine gives up first. The marks recompute on every change
 * against the engine that runs on the press.
 */
export function PlannerFitList({
  wishes,
  dropped,
  missed,
  pinned,
  onToggle,
  onPin,
}: {
  /** In plan order — `fitOrder`, never a sort made here. */
  wishes: readonly FitWish[];
  /** Keys the visitor switched off. */
  dropped: ReadonlySet<string>;
  /** Keys that, as things stand, find no minute before closing. */
  missed: ReadonlySet<string>;
  /** Keys the visitor pinned to the top. */
  pinned: ReadonlySet<string>;
  onToggle: (key: string) => void;
  onPin: (key: string) => void;
}) {
  const t = useTranslations('planner');

  return (
    <ul data-planner-fit-list="" className="flex flex-col gap-0.5">
      {wishes.map((wish) => {
        const off = dropped.has(wish.key);
        const isPinned = pinned.has(wish.key);
        const falls = !off && missed.has(wish.key);
        return (
          <li key={wish.key}>
            {/* A `<label>` around the row, so name and photo are part of the hit area. The pin is a
                button inside it that stops the click, or pinning would untick. */}
            <label
              data-planner-fit-row={wish.key}
              className={cn(
                'hover:bg-accent/60 planner-phone:py-2.5 flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 transition',
                off && 'opacity-55'
              )}
            >
              <input
                type="checkbox"
                checked={!off}
                onChange={() => onToggle(wish.key)}
                className="accent-primary size-4 shrink-0"
              />
              <PlannerRideThumb
                src={wish.ride?.backgroundImage}
                position={wish.ride?.backgroundPosition}
                size={8}
              />
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="min-w-0 truncate text-sm">{wish.attractionName}</span>
                {/* The park's own curation, which the pin argues with. */}
                {wish.headliner && (
                  <Crown
                    className="text-primary/70 size-3 shrink-0"
                    aria-label={t('fit.headliner')}
                  />
                )}
              </span>

              {/* Which ones will not make it, on the rides themselves: the count says how many,
                  this says which. */}
              {falls && (
                <span
                  data-planner-fit-drops=""
                  className="bg-crowd-high/15 text-crowd-high shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                >
                  {t('fit.drops')}
                </span>
              )}

              {typeof wish.ride?.dayPeak === 'number' && wish.ride.dayPeak > 0 && (
                <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                  {t('fit.peak', { minutes: wish.ride.dayPeak })}
                </span>
              )}

              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onPin(wish.key);
                }}
                disabled={off}
                aria-pressed={isPinned}
                data-planner-fit-pin={wish.key}
                title={t('fit.pinHint')}
                className={cn(
                  'planner-phone:size-11 flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors',
                  isPinned
                    ? 'border-primary/50 bg-primary/15 text-primary'
                    : 'border-border/60 text-muted-foreground hover:bg-accent',
                  off && 'invisible'
                )}
              >
                <Pin className={cn('size-3.5', isPinned && 'fill-current')} aria-hidden="true" />
                <span className="sr-only">{t('fit.pin')}</span>
              </button>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
