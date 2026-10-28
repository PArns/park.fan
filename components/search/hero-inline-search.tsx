'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { SearchCommand } from '@/components/search/search-bar';
import {
  HeroSearchFrame,
  HeroSearchShell,
  type HeroSearchRest,
} from '@/components/search/hero-search-field';
import { HeroPhoneList } from '@/components/search/hero-phone-list';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import {
  HERO_REST_ROWS_DESKTOP,
  HERO_REST_ROWS_PHONE,
  STEP_REST_ROWS_DESKTOP,
  type HeroReading,
} from '@/lib/home/hero-search';
import { cn } from '@/lib/utils';

/** The hero's resting list: parks, then the two posts, on both viewports. */
const HERO_REST: HeroSearchRest = {
  phoneRows: HERO_REST_ROWS_PHONE,
  desktopRows: HERO_REST_ROWS_DESKTOP,
  reading: true,
  spacerClass: 'h-[var(--hero-search-rest-h)]',
};

/** The step card's: no list on a phone, where the field only opens the palette. */
const STEP_REST: HeroSearchRest = {
  phoneRows: 0,
  desktopRows: STEP_REST_ROWS_DESKTOP,
  reading: false,
  spacerClass: 'hidden h-[var(--step-search-rest-h)] md:block',
};

interface HeroInlineSearchProps {
  /** Example park/ride names shown in the empty field. */
  placeholder: string;
  /** What the field is for — the accessible name, since the placeholder is only examples. */
  label: string;
  className?: string;
  /**
   * `false` for a second instance of this field on the same page (the step card). The type-anywhere
   * shortcut (a `document` listener) must exist once per page, and the ⌘K handler is the header's.
   * It also picks the list (see `STEP_REST`), the glass (the hero's 62 % lands on the photo,
   * anywhere else on page text that reads through it) and the search surface its events count as,
   * `hero` or `home_steps`.
   */
  primary?: boolean;
  /** The two posts under the hero's resting list, resolved on the server (`getHeroReading`). */
  reading?: HeroReading | null;
}

type PanelComponent = ComponentType<{
  placeholder: string;
  label: string;
  rest: HeroSearchRest;
  reading?: HeroReading | null;
  initialQuery?: string;
  autoFocus?: boolean;
  onFocusHandled?: () => void;
  onHero?: boolean;
}>;

/**
 * The hero search: a field with its resting list attached, one glass object on every viewport.
 * From `md` up the field searches in place (`HeroInlineSearchPanel`, fetched only after load and
 * idle); on a phone it opens the `SearchCommand` palette, and the list's rows are links. Until the
 * panel exists {@link HeroSearchShell} is a working input that hands its focus and typed text to
 * the panel on mount.
 */
export function HeroInlineSearch({
  placeholder,
  label,
  className,
  primary = true,
  reading,
}: HeroInlineSearchProps) {
  const rest = primary ? HERO_REST : STEP_REST;
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

  /**
   * Whether this field is on screen. Mounting the panel scrolls the page: cmdk calls
   * `scrollIntoView({ block: 'nearest' })` on its first item, which drags the document to a panel
   * mounted far down (the homepage's step card). So the panel waits for its field to be in view,
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
        <HeroSearchShell
          placeholder={placeholder}
          label={label}
          rest={rest}
          onHero={primary}
          onActivate={activate}
        />
      ) : isDesktop && Panel ? (
        <Panel
          placeholder={placeholder}
          label={label}
          rest={rest}
          reading={reading}
          initialQuery={typed ?? undefined}
          autoFocus={pendingFocus}
          onFocusHandled={() => setPendingFocus(false)}
          onHero={primary}
        />
      ) : (
        <div className="group/hero-search relative w-full">
          <SearchCommand
            trigger="hero"
            placeholder={placeholder}
            label={label}
            autoFocusOnType={primary}
            searchOpenSource={primary ? 'hero' : 'home_steps'}
            prewarm={primary}
          />
          <div aria-hidden="true" className={rest.spacerClass} />
          {rest.phoneRows > 0 ? (
            <HeroPhoneList rows={rest.phoneRows} reading={rest.reading ? reading : null} />
          ) : (
            <HeroSearchFrame onHero={primary} state="settled" />
          )}
        </div>
      )}
    </div>
  );
}
