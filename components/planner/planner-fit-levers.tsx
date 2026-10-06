'use client';

import { useTranslations } from 'next-intl';
import { Check, Lightbulb } from 'lucide-react';
import { PLANNER_BLOCK_ICON_COMPONENTS } from './planner-block-icons';
import { leverKey, type FitLever } from '@/lib/planner/fit';
import { cn } from '@/lib/utils';

/**
 * What the visitor could change so the day holds everything, as things to press. Every row is a
 * measured difference between two plans (`fitLevers`): „Ohne Mittagspause passt der Plan" only
 * where that is true, „passen 9 von 10" where it only helps, and no row for a lever that buys
 * nothing. A lever is a toggle on the assistant's choice; pressing it again undoes it.
 */
export function PlannerFitLevers({
  levers,
  applied,
  onToggle,
}: {
  levers: readonly FitLever[];
  /** Which levers are currently pulled, by the same key {@link leverKey} makes. */
  applied: ReadonlySet<string>;
  onToggle: (lever: FitLever) => void;
}) {
  const t = useTranslations('planner');
  if (levers.length === 0) return null;

  return (
    <ul data-planner-fit-levers="" className="flex flex-col gap-1.5">
      {levers.map((lever) => {
        const key = leverKey(lever);
        const on = applied.has(key);
        const Icon = lever.icon ? PLANNER_BLOCK_ICON_COMPONENTS[lever.icon] : Lightbulb;
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => onToggle(lever)}
              aria-pressed={on}
              data-planner-fit-lever={key}
              className={cn(
                'planner-phone:py-2.5 flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors',
                on
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-border/60 bg-background/60 hover:bg-accent'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center',
                  on ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-hidden="true"
              >
                {on ? <Check className="size-4" /> : <Icon className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium">{leverLabel(t, lever)}</span>
                {/* What it buys, always as a count: solved, or how far it gets. */}
                <span className="text-muted-foreground mt-0.5 block text-[11px] leading-snug">
                  {lever.solves
                    ? t('fit.leverSolves')
                    : t('fit.leverHelps', { fits: lever.fits, total: lever.wanted })}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * What the lever says it would do, using the block's own label and icon, so it describes the day on
 * the axis rather than a generic break.
 */
function leverLabel(t: ReturnType<typeof useTranslations>, lever: FitLever): string {
  if (lever.kind === 'drop-all-blocks') return t('fit.leverDropAll');
  if (lever.kind === 'shorten-block')
    return t('fit.leverShorten', { label: lever.label ?? '', minutes: lever.minutes ?? 0 });
  return t('fit.leverDrop', { label: lever.label ?? '' });
}
