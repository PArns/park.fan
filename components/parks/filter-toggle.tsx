'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterToggleProps {
  icon: LucideIcon;
  /** Icon for the pressed state, where a different glyph says more than a colour. */
  activeIcon?: LucideIcon;
  label: string;
  /**
   * Every label this button can carry, for one that cycles through more than two
   * states.
   *
   * All of them are rendered into the same grid cell with the inactive ones
   * `invisible`, so the box is as wide as the widest — in every locale, without a
   * number typed anywhere. A pill that resized as it was pressed would slide its
   * neighbours out from under the finger that pressed it, and these sit in a
   * wrapping row where that can cost a whole line. Same reasoning as the header's
   * °C/°F button, which fixes its box for the same reason.
   *
   * Its presence is also what says this is a cycle rather than a switch: a button
   * whose label never changes is the two-state one.
   */
  labels?: readonly string[];
  /** Whether the filter is doing something — the pill's lit state. */
  pressed: boolean;
  onToggle: () => void;
  /**
   * `sm` is the loose control the shows tab still puts above its grid.
   *
   * `md` is the filter panel's, where these sit in a cell of their own beside the
   * search box and the height slider: they take the `h-9` those two resolve to,
   * because controls in one row that are three different heights read as three
   * things that happen to be near each other — and below `sm`, where the panel
   * stacks and that row no longer exists, the 44 px phone tier from
   * `components/ui/button.tsx`. A filter pill is a thing people poke at while
   * walking through a park.
   */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * The park page's glass filter pill — an icon, a label, and a lit state.
 *
 * One component because the panel holds four of them ("N off season", "open now",
 * the wet-ride cycle and the queue-jump product) and they are the same object: a
 * filter over the same list, in the same row, on the same glass. They were about
 * to be four hand-styled buttons, which is how the border colour of the pressed
 * state ends up meaning something slightly different in each.
 *
 * `aria-pressed` on the two-state ones: it is a button that stays down, and the
 * label already says what it filters for. The cycling one gets **none** — a
 * three-state control is not pressed or unpressed, and saying it is would report
 * "hide the wet rides" as "not pressed". What it has instead is a label that
 * changes with the state, which is its accessible name.
 */
export function FilterToggle({
  icon: Icon,
  activeIcon: ActiveIcon,
  label,
  labels,
  pressed,
  onToggle,
  size = 'sm',
  className,
}: FilterToggleProps) {
  const Glyph = pressed ? (ActiveIcon ?? Icon) : Icon;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={labels ? undefined : pressed}
      className={cn(
        'flex shrink-0 touch-manipulation items-center rounded-md border text-xs shadow-md backdrop-blur-md transition-colors',
        size === 'md' ? 'h-9 gap-2 px-3 max-sm:h-11' : 'gap-1.5 px-2 py-1',
        pressed
          ? 'border-primary/30 bg-primary/15 text-primary dark:bg-primary/10'
          : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground dark:bg-[oklch(0.12_0.025_241_/_0.55)]',
        className
      )}
    >
      <Glyph className={size === 'md' ? 'h-4 w-4' : 'h-3 w-3'} aria-hidden="true" />
      {labels ? (
        <span className="grid">
          {labels.map((candidate) => (
            <span
              key={candidate}
              aria-hidden={candidate === label ? undefined : true}
              className={cn(
                'col-start-1 row-start-1 whitespace-nowrap',
                candidate !== label && 'invisible'
              )}
            >
              {candidate}
            </span>
          ))}
        </span>
      ) : (
        label
      )}
    </button>
  );
}
