'use client';

import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatGridTime } from '@/lib/planner/park-time';
import type { PlannerEntry } from '@/lib/planner/types';

interface PlannerGridActionsProps {
  entry: PlannerEntry | null;
  onToggleDone: (entryId: string, done: boolean) => void;
  onRemove: (entryId: string) => void;
  onClose: () => void;
}

/**
 * Tick-off and remove for the selected block.
 *
 * They are not on the block, and that is forced rather than chosen: a block can
 * legitimately be twenty pixels tall, and two 44 px targets do not fit in twenty
 * pixels. Forcing a `min-h-11` on the block instead would make the box lie about
 * the duration, which is the one thing this view may not do. So tapping selects
 * and the actions dock here.
 *
 * `absolute`, so it costs no layout at all and cannot resize the grid's scroll
 * box — the only arrangement in which the 44 px touch tier and an honest 20 px
 * block can both hold.
 */
export function PlannerGridActions({
  entry,
  onToggleDone,
  onRemove,
  onClose,
}: PlannerGridActionsProps) {
  const t = useTranslations('planner');
  if (!entry) return null;

  const done = Boolean(entry.done);

  return (
    <div className="border-border/60 bg-background/95 absolute inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t px-3 py-1.5 backdrop-blur-sm">
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm', done && 'line-through')}>{entry.attractionName}</p>
        <p className="text-muted-foreground font-mono text-[11px] tabular-nums">
          {formatGridTime(entry.startMinute)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onToggleDone(entry.id, !done)}
        aria-pressed={done}
        aria-label={done ? t('entry.markUndone') : t('entry.markDone')}
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md transition-colors max-sm:size-11',
          done
            ? 'bg-crowd-low/25 text-crowd-low'
            : 'text-muted-foreground/60 hover:bg-accent hover:text-foreground'
        )}
      >
        <Check className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onRemove(entry.id)}
        aria-label={t('removeRide')}
        className="text-muted-foreground/40 hover:bg-destructive/15 hover:text-destructive flex size-9 shrink-0 items-center justify-center rounded-md transition-colors max-sm:size-11"
      >
        <X className="size-4" />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        className="text-muted-foreground/40 hover:text-foreground shrink-0 px-1 text-xs"
      >
        ×
      </button>
    </div>
  );
}
