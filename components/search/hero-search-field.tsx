'use client';

import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';
import {
  HERO_SKELETON_ROW_CLASS,
  SearchSkeletonList,
} from '@/components/search/search-skeleton-list';

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
 *
 * Its body is the SAME {@link SearchSkeletonList} the real panel renders while its own data is
 * in flight, so mounting the panel changes nothing on screen: this card had drifted to 252 px
 * against the panel's 288 px and the settled list's 270 px, and the swap moved every row by
 * 4 px and the nearby pills below it by 19 px. The footer is not a skeleton at all — the hint is
 * a static string, so the shell can simply say it, and the box is then identical by
 * construction rather than by matching two heights.
 */
export function HeroSearchRestingCard() {
  const tSearch = useTranslations('search');

  return (
    <>
      <div aria-hidden="true" className="hidden h-[var(--hero-search-rest-h)] md:block" />
      <div aria-hidden="true" className="absolute inset-x-0 top-14 z-30 hidden md:block">
        <GlassCard
          variant="heavy"
          // The marker `pnpm check:hero-search-rest` measures — see that script for what drifts.
          data-hero-search-card=""
          className="border-border/60 mt-3 overflow-hidden p-0 shadow-2xl"
        >
          <SearchSkeletonList rows={3} rowClassName={HERO_SKELETON_ROW_CLASS} />
          <div className="border-border/40 bg-muted/30 text-muted-foreground border-t px-4 py-2.5 text-xs">
            {tSearch('heroHint')}
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
 *
 * Below `md` there is no panel to wait for: the shell hands over to the palette trigger
 * (`SearchCommand`) the moment the viewport query resolves. That trigger carries a pulsing ring
 * and keeps the width of its ⌘K badge free, so the shell paints both from the first frame —
 * `md:hidden` on the ring, `md:pr-4` on the padding. Without them the hand-over lit a ring
 * around the field out of nowhere and re-truncated the placeholder mid-word.
 */
export function HeroSearchShell({ placeholder, label, onActivate }: HeroSearchShellProps) {
  return (
    <div className="relative w-full">
      <div
        aria-hidden="true"
        className="border-primary/50 pointer-events-none absolute -inset-[2px] animate-[hero-search-pulse_2.5s_ease-in-out_infinite] rounded-[14px] border motion-reduce:animate-none md:hidden"
      />
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2" />
      <input
        type="text"
        inputMode="search"
        placeholder={placeholder}
        aria-label={label}
        onFocus={(e) => onActivate(e.currentTarget.value)}
        onInput={(e) => onActivate(e.currentTarget.value)}
        className={cn(
          HERO_SEARCH_INPUT_CLASS,
          'focus:border-primary/50 focus:shadow-lg',
          // The trigger it hands over to is a div with `truncate`, so a placeholder too long for
          // the field ends in an ellipsis there and was hard-clipped mid-glyph here.
          'pr-14 text-ellipsis md:pr-4'
        )}
      />
      <HeroSearchRestingCard />
    </div>
  );
}
