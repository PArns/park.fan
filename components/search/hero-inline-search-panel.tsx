'use client';

import { useEffect, useRef, useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchResults } from '@/lib/hooks/use-search-results';
import { useSearchNavigation } from '@/lib/hooks/use-search-navigation';
import { searchFieldFocusProps } from '@/lib/hooks/use-search-session';
import { heroBrowseRows } from '@/lib/hooks/use-hero-browse-parks';
import { useHeroStatusLabels } from '@/lib/hooks/use-hero-status-labels';
import { ANIMATED_HEIGHT_CLASS, useAnimatedHeight } from '@/lib/hooks/use-animated-height';
import { SearchResultsPanel } from '@/components/search/search-results-panel';
import { HeroBrowseHeader } from '@/components/search/hero-browse-header';
import {
  HERO_SEARCH_INPUT_ROW_CLASS,
  HERO_SEARCH_ICON_CLASS,
  HERO_SEARCH_INPUT_CLASS,
  HERO_SEARCH_LIST_BOX_CLASS,
  HERO_SEARCH_INPUT_KEY_ROOM_CLASS,
  HERO_SEARCH_KEY_CLASS,
} from '@/components/search/hero-search-classes';
import { SearchShortcutKey } from '@/components/search/search-shortcut-key';
import { HeroSearchFrame } from '@/components/search/hero-search-field';
import { HERO_ROW_CLASS, HERO_SKELETON_ROW_CLASS } from '@/components/search/search-skeleton-list';
import {
  SEARCH_SHORTCUT_TARGET_ATTR,
  isPageTypedKey,
  searchShortcutTarget,
} from '@/lib/utils/page-focus';
import type { SearchSession } from '@/lib/analytics/search-session';

/** Space kept between the dropdown's lower edge and the bottom of the viewport. */
const DROPDOWN_GAP_PX = 28;
/** Never squeeze it below this, even on a short viewport — it scrolls instead. */
const DROPDOWN_MIN_PX = 200;

interface HeroInlineSearchPanelProps {
  placeholder: string;
  /** Accessible name — the placeholder is a list of example parks, not a description. */
  label: string;
  /** Text already typed into the static shell before this chunk finished loading. */
  initialQuery?: string;
  /** Focus the input on mount — set when the visitor's own interaction pulled this chunk in. */
  autoFocus?: boolean;
  /** Called once the mount-focus has been dealt with, taken or declined. */
  onFocusHandled?: () => void;
  /** Runs once the panel has started from `initialQuery`. */
  onTextTaken?: () => void;
  /**
   * `false` when the field does not sit on the hero photo. The dropdown is glass at 62 % for the
   * hero, where it lands on the photo; on a flat page the text under it reads through, so off the
   * hero it takes `tile`, more fill and more blur.
   */
  onHero?: boolean;
  /** The field's session (`hero`), which outlives this chunk's mount. */
  session: SearchSession;
}

/**
 * Desktop-only in-place hero search: the input stays in the hero and its list hangs from it, one
 * glass object (`HeroSearchFrame`) that grows downward over the page. Nothing in the hero moves
 * when the list opens, grows or shrinks, which is what an in-flow list could not offer.
 *
 * At rest the field stands alone: what is near the visitor is the hero's card rail under it. Focus
 * opens the browse list, the same the palette shows, from the same hook; three characters swap in
 * the results. A blur or Escape on an empty field closes it again.
 */
export default function HeroInlineSearchPanel({
  placeholder,
  label,
  initialQuery = '',
  autoFocus = false,
  onFocusHandled,
  onTextTaken,
  onHero = true,
  session,
}: HeroInlineSearchPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  /** Focused: the list is open under the field, the browse list until three characters arrive. */
  const [expanded, setExpanded] = useState(false);

  const withStatusLabels = useHeroStatusLabels();
  const fieldFocus = searchFieldFocusProps(session);
  const search = useSearchResults(query);
  const { handleSelect, handleBrowseSelect, handleGlossarySelect, handlePostSelect } =
    useSearchNavigation(session);

  useEffect(() => onTextTaken?.(), [onTextTaken]);

  // Hand-off from the static shell: the visitor clicked or typed before this chunk arrived, so take
  // the focus and put the caret after what they typed. Only if they are still there: by now they
  // may have scrolled past the hero or opened the palette. `preventScroll` avoids the same jump.
  useEffect(() => {
    if (!autoFocus) return;
    onFocusHandled?.();
    const input = inputRef.current;
    if (!input) return;
    const active = document.activeElement;
    if (active && active !== document.body && active !== input) return;
    input.focus({ preventScroll: true });
    input.setSelectionRange(input.value.length, input.value.length);
  }, [autoFocus, onFocusHandled]);

  useAnimatedHeight(boxRef, contentRef);

  // The list is open while the field has focus, and closed at rest and after a blur.
  const closed = !expanded;

  // Cap the opened list at the room left below the field, so a long list scrolls inside itself. The
  // value is written onto the frame as a custom property, so scrolling re-renders nothing. This
  // runs on every scroll frame of the homepage, so the field's box is measured in document space
  // once rather than read per frame, and an IntersectionObserver turns the handler off while the
  // field is off screen, where even reading `scrollY` would flush style.
  useEffect(() => {
    let bottomDoc = 0;
    let written: string | null = null;
    let onScreen = true;

    const measure = () => {
      const input = inputRef.current;
      if (input) bottomDoc = input.getBoundingClientRect().bottom + window.scrollY;
    };

    const update = () => {
      const frame = frameRef.current;
      if (!frame || !onScreen) return;
      const room = window.innerHeight - (bottomDoc - window.scrollY) - DROPDOWN_GAP_PX;
      const next = `${Math.max(DROPDOWN_MIN_PX, room)}px`;
      if (next === written) return;
      written = next;
      frame.style.setProperty('--hero-search-max-h', next);
    };

    measure();
    update();

    let animationFrame = 0;
    const schedule = () => {
      if (animationFrame || !onScreen) return;
      animationFrame = requestAnimationFrame(() => {
        animationFrame = 0;
        update();
      });
    };

    // The gate. A generous margin so the value is already right by the time the field is back in
    // view, rather than one frame late.
    const seen = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) {
          measure();
          update();
        }
      },
      { rootMargin: '200px' }
    );
    if (inputRef.current) seen.observe(inputRef.current);
    // A resize moves the field as well as the viewport, so it re-measures before it updates.
    const onResize = () => {
      measure();
      schedule();
    };
    // The field also moves when the plate above it changes size (a heading wrapping, the rest of
    // the hero streaming in); a ResizeObserver catches that without a scroll.
    const observer = new ResizeObserver(onResize);
    if (inputRef.current?.parentElement) observer.observe(inputRef.current.parentElement);

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      seen.disconnect();
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, []);

  // Type-anywhere: a printable key outside an input focuses the hero search seeded with it. Never
  // Space, which scrolls the page and activates a focused button. The hero's instance only, so a
  // second field on the page adds no second listener. See
  // docs/rules/a-keyboard-shortcut-waits-for-an-unfocused-page.md.
  useEffect(() => {
    if (!onHero) return;
    const onKey = (e: KeyboardEvent) => {
      // Only when nothing is focused: letters on a focused control mean first-letter navigation
      // to a screen reader, not "start searching". And only while the field shows: scrolled away,
      // the letters would go into a field nobody sees.
      if (!isPageTypedKey(e) || !searchShortcutTarget()) return;
      e.preventDefault();
      setQuery((prev) => prev + e.key);
      inputRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onHero]);

  return (
    <CommandPrimitive
      shouldFilter={false}
      className="group/hero-search [&_[cmdk-group-heading]]:text-foreground/70 relative w-full bg-transparent [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group]]:px-1.5 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
      onKeyDown={(e) => {
        // Escape leaves the field in one press, whatever state it is in: the query cleared, the
        // list closed and the focus gone, so no half-open frame stays behind.
        if (e.key !== 'Escape') return;
        setQuery('');
        setExpanded(false);
        inputRef.current?.blur();
      }}
    >
      {/* The field, over the frame's first 56 px — same look as the static shell it replaces. */}
      <div className={HERO_SEARCH_INPUT_ROW_CLASS}>
        <Search className={HERO_SEARCH_ICON_CLASS} />
        <CommandPrimitive.Input
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          placeholder={placeholder}
          aria-label={label}
          onFocus={() => {
            setExpanded(true);
            fieldFocus.onFocus();
          }}
          onBlur={(e) => {
            setExpanded(false);
            fieldFocus.onBlur(e);
          }}
          {...(onHero ? { [SEARCH_SHORTCUT_TARGET_ATTR]: '', 'aria-keyshortcuts': '/' } : {})}
          className={cn(HERO_SEARCH_INPUT_CLASS, onHero && HERO_SEARCH_INPUT_KEY_ROOM_CLASS)}
        />
        {onHero && <SearchShortcutKey className={HERO_SEARCH_KEY_CLASS} />}
      </div>

      {/* `onMouseDown` preventDefault keeps focus in the input, so clicking a result cannot blur
          the field out from under the click. */}
      <HeroSearchFrame ref={frameRef} onHero={onHero} onMouseDown={(e) => e.preventDefault()}>
        {/* Closed, the list stays mounted (cmdk's `aria-controls` points into it) but takes no
            room, and the box eases between nothing and the open list. */}
        <div
          ref={boxRef}
          className={cn(HERO_SEARCH_LIST_BOX_CLASS, ANIMATED_HEIGHT_CLASS, closed && 'border-t-0')}
        >
          {/* Capped to the room below the field. The content carries the cap, not the box: the
              box's height eases, and the list only scrolls inside a box whose height is already
              final. */}
          <div
            ref={contentRef}
            className={cn(
              'flex max-h-[var(--hero-search-max-h,32rem)] flex-col',
              closed && 'hidden'
            )}
          >
            <SearchResultsPanel
              query={query}
              search={search}
              session={session}
              onSelect={handleSelect}
              onBrowseSelect={handleBrowseSelect}
              onGlossarySelect={handleGlossarySelect}
              onPostSelect={handlePostSelect}
              browseItems={withStatusLabels(heroBrowseRows(search.browse))}
              labelFavorites={withStatusLabels}
              browseHeader={<HeroBrowseHeader browse={search.browse} />}
              browseRowClassName={HERO_ROW_CLASS}
              listClassName="min-h-0 flex-1"
              skeletonRowClassName={HERO_SKELETON_ROW_CLASS}
            />
          </div>
        </div>
      </HeroSearchFrame>
    </CommandPrimitive>
  );
}
