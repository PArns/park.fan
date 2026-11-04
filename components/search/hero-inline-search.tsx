'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { SearchCommand } from '@/components/search/search-bar';
import { HeroSearchFrame, HeroSearchShell } from '@/components/search/hero-search-field';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { useSearchSession } from '@/lib/hooks/use-search-session';
import type { SearchSession } from '@/lib/analytics/search-session';
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
  onTextTaken?: () => void;
  onHero?: boolean;
  session: SearchSession;
}>;

/**
 * The hero search: one field, whose list opens under it once it has focus. From `md` up the field
 * searches in place (`HeroInlineSearchPanel`, fetched only after load and idle); on a phone it opens
 * the `SearchCommand` palette. Until the panel exists {@link HeroSearchShell} is a working input
 * that hands its focus and typed text to the panel on mount; on a phone the palette opens with that
 * text instead. One search session per field, whichever part the visitor uses. What is near the
 * visitor stands under the hero's text instead, in the card rail (`HeroRail`).
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

  const session = useSearchSession('hero');

  // Every keystroke updates the text (last write wins) — an "only the first call counts" latch
  // would freeze it at the empty string, because `focus` always fires before the first `input`.
  const activate = useCallback((value: string, focused: boolean) => {
    setTyped(value);
    if (focused) setPendingFocus(true);
  }, []);
  /** The panel has started from the shell's text; keeping it would bring it back on a remount. */
  const clearTyped = useCallback(() => setTyped(null), []);
  /** The phone's palette has taken the shell's text and focus; a later desktop panel starts clean. */
  const handedOver = useCallback(() => {
    setTyped(null);
    setPendingFocus(false);
  }, []);

  /**
   * Whether this field is on screen. Mounting the panel scrolls the page: cmdk calls
   * `scrollIntoView({ block: 'nearest' })` on its first item, which drags the document back up to
   * the field for a visitor who has scrolled past it. So the panel waits for its field to be in view,
   * with a 15 % inset so a field grazing the edge does not shift the page either.
   */
  const hostRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setInView(true);
      },
      { rootMargin: '-15% 0px -15% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // Load once the page is idle, or immediately when the visitor has already reached for it.
    if (!isDesktop || Panel || (!afterLoad && typed === null)) return;
    // …but never before it is on screen. `typed` is the exception: somebody who
    // has already typed into the shell is looking straight at it, and the handoff
    // (their text plus the focus) has to happen wherever they are.
    if (!inView && typed === null) return;
    let cancelled = false;
    import('./hero-inline-search-panel').then((m) => {
      if (!cancelled) setPanel(() => m.default);
    });
    return () => {
      cancelled = true;
    };
  }, [isDesktop, Panel, afterLoad, typed, inView]);

  // Until the media query has an answer, render the shell, never the palette trigger: the query
  // is false on the server and the first client render, so the desktop hero would flash the phone
  // field first.
  const showShell = !mounted || (isDesktop && !Panel);

  return (
    <div ref={hostRef} className={cn('w-full', className)}>
      {showShell ? (
        <HeroSearchShell placeholder={placeholder} label={label} onActivate={activate} />
      ) : isDesktop && Panel ? (
        <Panel
          placeholder={placeholder}
          label={label}
          initialQuery={typed ?? undefined}
          autoFocus={pendingFocus}
          onFocusHandled={() => setPendingFocus(false)}
          onTextTaken={clearTyped}
          session={session}
        />
      ) : (
        <div className="group/hero-search relative w-full">
          <SearchCommand
            trigger="hero"
            placeholder={placeholder}
            label={label}
            autoFocusOnType
            searchOpenSource="hero"
            prewarm
            session={session}
            openOnMount={typed ?? undefined}
            onOpenedOnMount={handedOver}
          />
          <HeroSearchFrame aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
