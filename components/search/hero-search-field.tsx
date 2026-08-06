'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';
import { Skeleton } from '@/components/ui/skeleton';

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
 * The resting dropdown, drawn as a skeleton, in exactly the box the real one will occupy.
 *
 * Without it the desktop hero painted an empty gap under the field and then a whole card
 * dropped into it once the search chunk arrived — the pop that read as flicker. Both the
 * spacer and the card are `hidden md:block`, i.e. decided in CSS rather than by a media-query
 * hook, so the server already renders the right thing for either viewport and there is nothing
 * to correct after hydration.
 */
export function HeroSearchRestingCard() {
  return (
    <>
      <div aria-hidden="true" className="hidden h-[var(--hero-search-rest-h)] md:block" />
      <div aria-hidden="true" className="absolute inset-x-0 top-14 z-30 hidden md:block">
        <GlassCard variant="heavy" className="border-border/60 mt-3 overflow-hidden p-0 shadow-2xl">
          <div className="p-1">
            <div className="px-3 pt-3.5 pb-1">
              <Skeleton className="h-2 w-16 rounded-full" />
            </div>
            {['55%', '72%', '48%'].map((width) => (
              <div key={width} className="flex items-center gap-4 px-3 py-2.5">
                <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 rounded-full" style={{ width }} />
                  <Skeleton className="h-2.5 w-28 rounded-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="border-border/40 bg-muted/30 border-t px-4 py-2.5">
            <Skeleton className="h-3 w-64 rounded-full" />
          </div>
        </GlassCard>
      </div>
    </>
  );
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
      <HeroSearchRestingCard />
    </div>
  );
}
