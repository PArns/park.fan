'use client';

import { useTranslations } from 'next-intl';
import { Crown, Pin } from 'lucide-react';
import { PlannerRideThumb } from './planner-ride-thumb';
import type { FitWish } from '@/lib/planner/fit';
import { cn } from '@/lib/utils';

/**
 * The rides the day is being decided over, in the order they are given up in.
 *
 * Two answers per row and they are different questions. The **checkbox** says
 * whether the ride is wanted at all — unticking one is the visitor taking it
 * out of the day, and on a ride they already had that is the only way it ever
 * leaves. The **pin** says it is one they are here for: a pinned ride moves to
 * the top of the list and the engine reads that order as `OptimizeInput.priority`,
 * so it is the last thing given up rather than the first.
 *
 * The list renders `fitOrder(...)` and never a sort of its own. That is the one
 * rule this component has: what is at the bottom of the screen is what the
 * engine gives up first, so a list ordered any other way would be a promise the
 * plan does not keep.
 *
 * The mark on the rides that will not make it is recomputed on every change,
 * against the same engine that will run on the press — which is what makes this
 * something to experiment with rather than a form. Pin the flagship and watch a
 * different name take the mark.
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
            {/* A `<label>` around the row so the name and the photo are part of
                the hit area — ten rides at 20 px of checkbox each is a target
                list nobody wants on a phone. The pin is a real button inside
                it and stops the click there, or pinning would untick. */}
            <label
              data-planner-fit-row={wish.key}
              className={cn(
                'hover:bg-accent/60 flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 transition-colors max-sm:py-2.5',
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
                {/* The park's own curation, on the rides it applies to. It is
                    what the pin argues WITH: the app knows which rides a park
                    is known for and cannot know which one somebody drove four
                    hours for. */}
                {wish.headliner && (
                  <Crown
                    className="text-primary/70 size-3 shrink-0"
                    aria-label={t('fit.headliner')}
                  />
                )}
              </span>

              {/* Which ones will not make it, on the rides themselves. The line
                  above says how many fit; this says which, and that is the
                  difference between a number and a decision somebody can act
                  on. */}
              {falls && (
                <span className="bg-crowd-high/15 text-crowd-high shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
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
                  'flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors max-sm:size-9',
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
