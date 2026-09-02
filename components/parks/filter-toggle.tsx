'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterToggleProps {
  icon: LucideIcon;
  /** Icon for the pressed state, where a different glyph says more than a colour. */
  activeIcon?: LucideIcon;
  label: string;
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
 * The park page's glass filter pill — an icon, a label, and a pressed state.
 *
 * One component because the panel now holds three of them ("N off season", "open
 * now", "you may get wet") and they are the same object: a switch over the same
 * list, in the same row, on the same glass. They were about to be three
 * hand-styled buttons, which is how the border colour of the pressed state ends
 * up meaning something slightly different in each.
 *
 * `aria-pressed` rather than a checkbox: it is a button that stays down, and the
 * label already says what it filters for.
 */
export function FilterToggle({
  icon: Icon,
  activeIcon: ActiveIcon,
  label,
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
      aria-pressed={pressed}
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
      {label}
    </button>
  );
}
