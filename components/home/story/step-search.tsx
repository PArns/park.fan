'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import { SearchResultsPanel } from '@/components/search/search-results-panel';
import { useSearchResults } from '@/lib/hooks/use-search-results';
import { useSearchNavigation } from '@/lib/hooks/use-search-navigation';

/**
 * A working search in step 1 of the story, floating its results the way the hero
 * does.
 *
 * It is NOT `HeroInlineSearch`. That component is welded to the hero: a 14 px-tall
 * glass field, a resting dropdown whose height the hero layout reserves in a CSS
 * variable, `trackHeroSearchClicked`, and a document-level keydown handler. A
 * second instance would register those handlers twice and reserve a height this
 * card does not have.
 *
 * What it reuses is everything below that shell — `useSearchResults`,
 * `useSearchNavigation` and {@link SearchResultsPanel}, the same three the hero
 * dropdown and the ⌘K palette are both built from. So the results, their order,
 * their empty state and where a click lands are identical to the hero's by
 * construction; only the box differs.
 *
 * The list **floats** rather than sitting in flow, for the reason the hero's
 * does: these three step cards are a grid row, and a list growing in the middle
 * one would push the row's height around on every keystroke.
 */
export function StepSearch({ placeholder, label }: { placeholder: string; label: string }) {
  const tSearch = useTranslations('search');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useSearchResults(query);
  // Closing on navigate matters: the router keeps this page mounted while it
  // transitions, so a dropdown left open hangs over the next paint.
  const { handleSelect, handleGlossarySelect } = useSearchNavigation(query.trim().length, () =>
    setOpen(false)
  );

  return (
    <div
      className="relative"
      onFocus={() => {
        if (blurTimer.current) clearTimeout(blurTimer.current);
        setOpen(true);
      }}
      // A click on a result blurs the input before the click lands, so the close
      // is deferred by a tick rather than fired on blur.
      onBlur={() => {
        blurTimer.current = setTimeout(() => setOpen(false), 120);
      }}
    >
      <div className="border-input bg-background focus-within:border-primary/50 flex h-10 items-center gap-2.5 rounded-xl border px-3 transition-colors">
        <Search className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-[13px] outline-none"
        />
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 pt-2">
          <GlassCard variant="heavy" className="border-border/60 overflow-hidden p-0 shadow-2xl">
            <SearchResultsPanel
              query={query}
              search={search}
              onSelect={handleSelect}
              onGlossarySelect={handleGlossarySelect}
              browseLimit={4}
              listClassName="max-h-[min(20rem,50vh)]"
            />
            <div className="border-border/40 bg-muted/30 text-muted-foreground border-t px-3 py-2 text-[11px]">
              {tSearch('heroHint')}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
