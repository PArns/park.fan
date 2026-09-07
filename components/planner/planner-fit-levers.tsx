'use client';

import { useTranslations } from 'next-intl';
import { Check, Lightbulb } from 'lucide-react';
import { PLANNER_BLOCK_ICON_COMPONENTS } from './planner-block-icons';
import { leverKey, type FitLever } from '@/lib/planner/fit';
import { cn } from '@/lib/utils';

/**
 * What the visitor could change so the day holds everything, as things to press.
 *
 * Every row is a measured difference between two plans (`fitLevers`), so the
 * sentence on it is arithmetic rather than advice: „Ohne Mittagspause passt der
 * Plan" is printed on exactly the days where taking the break out makes the
 * whole wish list fit, and „Ohne Mittagspause passen 9 von 10" on the days where
 * it helps and is not enough. Nothing generic is ever shown — a lever that buys
 * no ride is not in the list at all, because an offer that changes no number is
 * worse than silence: somebody presses it and watches nothing happen.
 *
 * A lever is a TOGGLE, not a command. It is applied to the choice the assistant
 * is holding, the counts under it move, and pressing it again puts the break
 * back — which is the difference between an assistant somebody experiments with
 * and a wizard that makes a decision on their behalf.
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
                'flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors max-sm:py-2.5',
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
                {/* What it buys, always as a count and never as an adjective.
                    The two shapes are the two cases the day can be in, and the
                    difference between them is the whole reason the assistant
                    opened: one says the problem is solved, the other says how
                    far it gets and leaves the rest to the list on the next
                    step. */}
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
 * What the lever says it would do, in the visitor's own words for the block.
 *
 * The block's LABEL rather than the word "Pause": a visitor who wrote
 * „Showtime Wasserwelt" into a block gets that back, and the icon beside it is
 * the one they picked. A lever naming a generic break would be describing a
 * different day from the one on the axis.
 */
function leverLabel(t: ReturnType<typeof useTranslations>, lever: FitLever): string {
  if (lever.kind === 'drop-all-blocks') return t('fit.leverDropAll');
  if (lever.kind === 'shorten-block')
    return t('fit.leverShorten', { label: lever.label ?? '', minutes: lever.minutes ?? 0 });
  return t('fit.leverDrop', { label: lever.label ?? '' });
}
