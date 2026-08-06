'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { Search } from 'lucide-react';
import { SearchCommand } from '@/components/search/search-bar';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { trackHeroSearchClicked } from '@/lib/analytics/umami';
import { cn } from '@/lib/utils';

/** Shared look of the hero search input — the lazy panel's real input mirrors these classes. */
export const HERO_SEARCH_INPUT_CLASS =
  'border-primary/20 bg-background/77 placeholder:text-foreground/40 dark:placeholder:text-muted-foreground/50 h-14 w-full rounded-xl border pr-4 pl-12 text-base shadow-md backdrop-blur-lg transition-all outline-none dark:bg-[oklch(0.12_0.025_241_/_0.55)]';

/** Non-interactive lookalike shown while the inline panel chunk loads. */
export function HeroSearchShell({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative w-full">
      <Search className="text-muted-foreground absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2" />
      <div className={cn(HERO_SEARCH_INPUT_CLASS, 'flex items-center')}>
        <span className="text-foreground/40 dark:text-muted-foreground/50 truncate">
          {placeholder}
        </span>
      </div>
    </div>
  );
}

interface HeroInlineSearchProps {
  placeholder: string;
  className?: string;
}

type PanelComponent = ComponentType<{ placeholder: string }>;

/**
 * The hero search with in-place results on desktop, palette popup on mobile.
 *
 * Mobile (< md) keeps the proven `SearchCommand` flow — tap opens the full-screen palette,
 * no inline list. From `md` up, the lazy in-place panel takes over: the input stays in the
 * hero and the result list renders directly beneath it (see hero-inline-search-panel.tsx).
 * The panel chunk (cmdk + result rendering) loads only on desktop viewports, and SSR always
 * renders the mobile trigger — visually identical to the shell — so nothing jumps.
 */
export function HeroInlineSearch({ placeholder, className }: HeroInlineSearchProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [Panel, setPanel] = useState<PanelComponent | null>(null);

  useEffect(() => {
    if (!isDesktop || Panel) return;
    let cancelled = false;
    import('./hero-inline-search-panel').then((m) => {
      if (!cancelled) setPanel(() => m.default);
    });
    return () => {
      cancelled = true;
    };
  }, [isDesktop, Panel]);

  return (
    <div className={cn('w-full', className)}>
      {isDesktop ? (
        Panel ? (
          <Panel placeholder={placeholder} />
        ) : (
          <HeroSearchShell placeholder={placeholder} />
        )
      ) : (
        <div onClick={() => trackHeroSearchClicked()}>
          <SearchCommand
            trigger="input"
            size="lg"
            placeholder={placeholder}
            autoFocusOnType={true}
            searchOpenSource="hero"
            prewarm={true}
          />
        </div>
      )}
    </div>
  );
}
