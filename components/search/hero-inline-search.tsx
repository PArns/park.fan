'use client';

import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { SearchCommand } from '@/components/search/search-bar';
import { HeroSearchShell } from '@/components/search/hero-search-field';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { trackHeroSearchClicked } from '@/lib/analytics/umami';
import { cn } from '@/lib/utils';

interface HeroInlineSearchProps {
  /** Example park/ride names shown in the empty field. */
  placeholder: string;
  /** What the field is for — the accessible name, since the placeholder is only examples. */
  label: string;
  className?: string;
}

type PanelComponent = ComponentType<{
  placeholder: string;
  label: string;
  initialQuery?: string;
  autoFocus?: boolean;
  onFocusHandled?: () => void;
}>;

/**
 * The hero search: in-place floating results on desktop, palette popup on mobile.
 *
 * Mobile (< md) keeps the proven `SearchCommand` flow — tap opens the full-screen palette, no
 * inline list. From `md` up the in-place panel takes over: the input stays in the hero and the
 * results float below it.
 *
 * **Nothing here is on the critical path.** The panel chunk (cmdk + the result tree) is fetched
 * only after the page has loaded and gone idle, and only on viewports that will render it; the
 * live queries behind it (`useHomeNearbyParks`, popular parks) are gated the same way. Until it
 * arrives, {@link HeroSearchShell} is a working input that hands its focus and typed text over
 * on mount — so a visitor who is faster than the chunk loses nothing, and one who never touches
 * the field never pays for it.
 */
export function HeroInlineSearch({ placeholder, label, className }: HeroInlineSearchProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const mounted = useMounted();
  const afterLoad = useAfterLoad();
  const [Panel, setPanel] = useState<PanelComponent | null>(null);
  /** What the visitor typed into the shell before the chunk arrived. */
  const [typed, setTyped] = useState<string | null>(null);
  /** Whether the panel still owes them the focus the shell had. Cleared once it has acted. */
  const [pendingFocus, setPendingFocus] = useState(false);

  // Every keystroke updates the text (last write wins) — an "only the first call counts" latch
  // would freeze it at the empty string, because `focus` always fires before the first `input`.
  const activate = useCallback((value: string) => {
    setTyped(value);
    setPendingFocus(true);
  }, []);

  useEffect(() => {
    // Load once the page is idle, or immediately when the visitor has already reached for it.
    if (!isDesktop || Panel || (!afterLoad && typed === null)) return;
    let cancelled = false;
    import('./hero-inline-search-panel').then((m) => {
      if (!cancelled) setPanel(() => m.default);
    });
    return () => {
      cancelled = true;
    };
  }, [isDesktop, Panel, afterLoad, typed]);

  // Until the media query has an answer, render the SHELL — never the palette trigger.
  // `useMediaQuery` is false on the server and on the first client render, so the desktop hero
  // used to paint the mobile trigger first: a field carrying a ⌘K badge and a pulsing ring that
  // vanished a moment later. That swap was the flicker.
  const showShell = !mounted || (isDesktop && !Panel);

  return (
    <div className={cn('w-full', className)}>
      {showShell ? (
        <HeroSearchShell placeholder={placeholder} label={label} onActivate={activate} />
      ) : isDesktop && Panel ? (
        <Panel
          placeholder={placeholder}
          label={label}
          initialQuery={typed ?? undefined}
          autoFocus={pendingFocus}
          onFocusHandled={() => setPendingFocus(false)}
        />
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
