'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Shared look of the hero search input — the lazy panel's real input mirrors these classes. */
export const HERO_SEARCH_INPUT_CLASS =
  'border-primary/20 bg-background/77 placeholder:text-foreground/40 dark:placeholder:text-muted-foreground/50 h-14 w-full rounded-xl border pr-4 pl-12 text-base shadow-md backdrop-blur-lg transition-all outline-none dark:bg-[oklch(0.12_0.025_241_/_0.55)]';

interface HeroSearchShellProps {
  placeholder: string;
  /** What the field is FOR, for screen readers — the placeholder is a list of examples. */
  label: string;
  /** Fires on focus and on every keystroke — the cue to pull in the real search panel. */
  onActivate: (typed: string) => void;
}

/**
 * The hero search field before the search chunk exists: a REAL input, not a placeholder div.
 *
 * The panel behind it (cmdk + the result tree + the live queries) is deliberately not part of
 * the initial page load, so for a moment there is a field with nothing behind it. Making the
 * shell a working input means that moment costs the visitor nothing: focus and keystrokes are
 * captured here and handed to the panel — with the text they already typed — the instant it
 * mounts, instead of being swallowed.
 */
export function HeroSearchShell({ placeholder, label, onActivate }: HeroSearchShellProps) {
  return (
    <div className="relative w-full">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2" />
      <input
        type="text"
        inputMode="search"
        placeholder={placeholder}
        aria-label={label}
        onFocus={(e) => onActivate(e.currentTarget.value)}
        onInput={(e) => onActivate(e.currentTarget.value)}
        className={cn(HERO_SEARCH_INPUT_CLASS, 'focus:border-primary/50 focus:shadow-lg')}
      />
    </div>
  );
}
