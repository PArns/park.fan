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
import { HeroReadingGroup } from '@/components/search/hero-reading-group';
import {
  HERO_SEARCH_INPUT_ROW_CLASS,
  HERO_SEARCH_ICON_CLASS,
  HERO_SEARCH_INPUT_CLASS,
  HERO_SEARCH_LIST_BOX_CLASS,
} from '@/components/search/hero-search-classes';
import { HeroSearchFrame, type HeroSearchRest } from '@/components/search/hero-search-field';
import {
  HERO_ROW_CLASS,
  HERO_SKELETON_ROW_CLASS,
  HeroReadingSkeleton,
} from '@/components/search/search-skeleton-list';
import { nothingFocused } from '@/lib/utils/page-focus';
import type { HeroReading } from '@/lib/home/hero-search';
import type { SearchSession } from '@/lib/analytics/search-session';

/** Space kept between the dropdown's lower edge and the bottom of the viewport. */
const DROPDOWN_GAP_PX = 28;
/** Never squeeze it below this, even on a short viewport — it scrolls instead. */
const DROPDOWN_MIN_PX = 200;

interface HeroInlineSearchPanelProps {
  placeholder: string;
  /** Accessible name — the placeholder is a list of example parks, not a description. */
  label: string;
  /** How many rows the resting list holds, and whether the posts follow them. */
  rest: HeroSearchRest;
  /** The two posts, where `rest.reading` asks for them. */
  reading?: HeroReading | null;
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
  /** The field's session (`hero` or `home_steps`), which outlives this chunk's mount. */
  session: SearchSession;
}

/**
 * Desktop-only in-place hero search: the input stays in the hero and its list hangs from it, one
 * glass object (`HeroSearchFrame`) that grows downward over the page. Nothing in the hero moves
 * when the list opens, grows or shrinks, which is what an in-flow list could not offer: the hero
 * is vertically centred, so every change in result count shifted the headline.
 *
 * At rest the list shows the first rows of the browse list and, on the hero, two posts; focus
 * opens the whole browse list; three characters swap in the results. The browse list is the same
 * the palette shows, from the same hook.
 */
export default function HeroInlineSearchPanel({
  placeholder,
  label,
  rest,
  reading,
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
  /** Measured height of the RESTING list under the field — what the spacer below reserves. */
  const [restHeight, setRestHeight] = useState<number | null>(null);
  /**
   * Focused: the list grows from the resting rows to everything the browse hook has. At rest a
   * few rows are an answer at a glance; once the visitor is actually in the field, showing more
   * of what is nearby beats making them type.
   */
  const [expanded, setExpanded] = useState(false);

  const withStatusLabels = useHeroStatusLabels();
  const fieldFocus = searchFieldFocusProps(session);
  const search = useSearchResults(query);
  const {
    handleSelect,
    handleBrowseSelect,
    handleGlossarySelect,
    handlePostSelect,
    handleBrowsePostSelect,
  } = useSearchNavigation(session);

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

  // Reserve exactly the resting list's height in the flow, measured rather than assumed, so the
  // plate below never drifts as a locale's strings change. Only at rest, and only off the real
  // list: a grown list is meant to expand over the page, and a height taken off the skeleton
  // would move the plate twice.
  const resting = query.trim().length < 3 && !expanded;
  const atRest = resting && !search.browse.isPending;
  useEffect(() => {
    const frame = frameRef.current;
    const box = boxRef.current;
    const content = contentRef.current;
    if (!frame || !box || !content || !atRest) return;
    // Off the content, which the box eases towards, plus the hairline above it and the frame's
    // lower border: the box is mid-ease when the list collapses back to rest, and the spacer and
    // the plate would follow it down and up again.
    const borders =
      box.offsetHeight - box.clientHeight + parseFloat(getComputedStyle(frame).borderBottomWidth);
    const measure = () => {
      const height = content.getBoundingClientRect().height;
      setRestHeight(height + borders);
      // The floor of the list's cap below: opening the list never makes it shorter than at rest.
      frame.style.setProperty('--hero-search-rest-content', `${height}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [atRest]);

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
      // to a screen reader, not "start searching".
      if (!nothingFocused(document.activeElement)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Space stays with the page: it scrolls, and it activates a focused control.
      if (e.key.length !== 1 || e.key === ' ') return;
      e.preventDefault();
      setQuery((prev) => prev + e.key);
      inputRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onHero]);

  // The resting rows' height, held when the list is shorter, so the frame keeps its box: rows of
  // 3.75 rem (`HERO_ROW_CLASS`) inside the group's own 4 px top and bottom.
  const rowsStyle = { minHeight: `calc(${rest.desktopRows} * 3.75rem + 0.5rem)` };

  return (
    <CommandPrimitive
      shouldFilter={false}
      className="group/hero-search [&_[cmdk-group-heading]]:text-foreground/70 relative w-full bg-transparent [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group]]:px-1.5 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
      onKeyDown={(e) => {
        // Escape steps back one level and KEEPS focus on the field: a query is cleared first,
        // and only an already-empty field collapses to the resting rows. There is no closed
        // state to fall back to — blurring to <body> dropped a keyboard user out of the hero
        // with nothing announced and no defined place to tab on from.
        if (e.key !== 'Escape') return;
        if (query) {
          setQuery('');
        } else if (expanded) {
          setExpanded(false);
        }
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
          className={HERO_SEARCH_INPUT_CLASS}
        />
      </div>

      {/* Reserves the list's resting height in the hero's flow; a query that grows the list grows
          it over the page instead. The CSS variable is the estimate that matches the shell's
          skeleton; from mount on, the measured height takes over. */}
      <div
        aria-hidden="true"
        className={rest.spacerClass}
        // The measured height replaces the CSS estimate on the hero only: off the hero the step
        // card's estimate stays, because replacing it would pull every chapter below up when this
        // chunk mounts, and the floating list may overhang its reservation a little there.
        style={onHero && restHeight != null ? { height: restHeight } : undefined}
      />

      {/* `onMouseDown` preventDefault keeps focus in the input, so clicking a result cannot blur
          the field out from under the click. */}
      <HeroSearchFrame
        ref={frameRef}
        onHero={onHero}
        state={search.browse.isPending ? 'pending' : 'settled'}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div ref={boxRef} className={cn(HERO_SEARCH_LIST_BOX_CLASS, ANIMATED_HEIGHT_CLASS)}>
          {/* Capped to the room below the field once it is opened, never below its resting
              height: at rest it is reserved in the flow and the page scrolls to it. The content
              carries the cap, not the box: the box's height eases, and the list only scrolls
              inside a box whose height is already final. */}
          <div
            ref={contentRef}
            className={cn(
              'flex flex-col',
              !resting &&
                'max-h-[max(var(--hero-search-max-h,32rem),var(--hero-search-rest-content,0px))]'
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
              browseLimit={expanded ? undefined : rest.desktopRows}
              browseItems={withStatusLabels(heroBrowseRows(search.browse))}
              browseHeader={<HeroBrowseHeader browse={search.browse} />}
              browseStyle={rowsStyle}
              browseRowClassName={HERO_ROW_CLASS}
              browseExtra={
                rest.reading && reading ? (
                  <HeroReadingGroup reading={reading} onSelect={handleBrowsePostSelect} />
                ) : null
              }
              browseExtraPending={rest.reading && reading ? <HeroReadingSkeleton /> : null}
              emptyBrowse={<div aria-hidden="true" style={rowsStyle} />}
              listClassName="min-h-0 flex-1"
              skeletonRowClassName={HERO_SKELETON_ROW_CLASS}
            />
          </div>
        </div>
      </HeroSearchFrame>
    </CommandPrimitive>
  );
}
