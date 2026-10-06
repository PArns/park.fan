'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';
import { trackHeroSearchClicked } from '@/lib/analytics/umami';
import { useSearchResults } from '@/lib/hooks/use-search-results';
import { useSearchNavigation } from '@/lib/hooks/use-search-navigation';
import { SearchResultsPanel } from '@/components/search/search-results-panel';
import { HERO_SEARCH_INPUT_CLASS } from '@/components/search/hero-search-field';
import { HERO_SKELETON_ROW_CLASS } from '@/components/search/search-skeleton-list';

/**
 * How many parks the resting dropdown lists. The hero reserves the height of exactly this many
 * rows (`--hero-search-rest-h`), so the two must be changed together.
 */
const HERO_BROWSE_LIMIT = 3;

/** The card's own `mt-3` — part of the box the spacer has to reserve. */
const DROPDOWN_TOP_GAP_PX = 12;
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
  /**
   * `false` when the field does not sit on the hero photo. The dropdown is glass at 62 % for the
   * hero, where it lands on the photo; on a flat page the text under it reads through, so off the
   * hero it takes `tile`, more fill and more blur.
   */
  onHero?: boolean;
}

/**
 * Desktop-only in-place hero search: the input stays in the hero and the results FLOAT below it
 * — an absolutely positioned dropdown that expands downward over the page. Nothing in the hero
 * moves when the list opens, grows or shrinks, which is what an in-flow list could not offer:
 * the hero is vertically centred, so every change in result count shifted the headline.
 *
 * The dropdown is open while the field has focus and shows the nearby/popular browse list
 * before the first keystroke — the same list the palette shows on mobile, from the same hook.
 */
export default function HeroInlineSearchPanel({
  placeholder,
  label,
  initialQuery = '',
  autoFocus = false,
  onFocusHandled,
  onHero = true,
}: HeroInlineSearchPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  /** Measured height of the RESTING card — what the spacer below reserves. */
  const [restHeight, setRestHeight] = useState<number | null>(null);
  /**
   * Focused: the list grows from the three resting rows to everything the browse hook has.
   * At rest three rows are an answer at a glance; once the visitor is actually in the field,
   * showing more of what is nearby beats making them type.
   */
  const [expanded, setExpanded] = useState(false);
  /** The card's height just before a row count change — the tween's starting point. */
  const heightBeforeChange = useRef<number | null>(null);
  /** True while GSAP is tweening the card's height. See the ResizeObserver below. */
  const tweening = useRef(false);

  const trackedFocus = useRef(false);

  const search = useSearchResults(query);
  const { handleSelect, handleGlossarySelect } = useSearchNavigation(query.trim().length);

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

  // Animate the row-count change. The card is absolutely positioned and its content swaps in
  // one render, so there is nothing for CSS to interpolate — capture the height before React
  // commits, then tween from it to the new natural height. GSAP handles `height: auto` for the
  // target, which a CSS transition cannot.
  useLayoutEffect(() => {
    const card = cardRef.current;
    const from = heightBeforeChange.current;
    heightBeforeChange.current = null;
    if (!card || from == null || from === card.offsetHeight) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    import('gsap')
      .then(({ gsap }) => {
        if (cancelled || !cardRef.current) return;
        ctx = gsap.context(() => {
          tweening.current = true;
          gsap.from(cardRef.current, {
            height: from,
            duration: 0.34,
            ease: 'power2.out',
            clearProps: 'height',
            onComplete: () => {
              tweening.current = false;
            },
          });
        }, cardRef);
      })
      .catch(() => {
        // Without the tween the list simply snaps to its new size.
      });

    return () => {
      cancelled = true;
      tweening.current = false;
      ctx?.revert();
    };
  }, [expanded]);

  // Reserve exactly the resting card's height in the flow, measured rather than assumed, so the
  // pills below never drift as names wrap or the language changes. Only at rest, and only off the
  // real list: a grown list is meant to expand over the pills, and a height taken off the skeleton
  // would move them twice.
  const atRest = query.trim().length < 3 && !expanded && !search.browse.isPending;
  useEffect(() => {
    const card = cardRef.current;
    if (!card || !atRest) return;
    // Never while GSAP is mid-tween: the tween writes an inline height every frame, and the
    // spacer and the pills would animate along with it.
    const measure = () => {
      if (tweening.current) return;
      setRestHeight(card.getBoundingClientRect().height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, [atRest]);

  // Cap the dropdown at the room left below the field, so a long list scrolls inside itself. The
  // value is written onto the node as a custom property, so scrolling re-renders nothing. This
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
      const dropdown = dropdownRef.current;
      if (!dropdown || !onScreen) return;
      const room = window.innerHeight - (bottomDoc - window.scrollY) - DROPDOWN_GAP_PX;
      const next = `${Math.max(DROPDOWN_MIN_PX, room)}px`;
      if (next === written) return;
      written = next;
      dropdown.style.setProperty('--hero-search-max-h', next);
    };

    measure();
    update();

    let frame = 0;
    const schedule = () => {
      if (frame || !onScreen) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
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
      if (frame) cancelAnimationFrame(frame);
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
      const active = document.activeElement;
      if (active && active !== document.body && active !== document.documentElement) return;
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

  return (
    <CommandPrimitive
      shouldFilter={false}
      className="[&_[cmdk-group-heading]]:text-muted-foreground/60 relative w-full bg-transparent [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group]]:px-1.5 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
      onKeyDown={(e) => {
        // Escape steps back one level and KEEPS focus on the field: a query is cleared first,
        // and only an already-empty field collapses to the three resting rows. There is no
        // closed state to fall back to — blurring to <body> dropped a keyboard user out of the
        // hero with nothing announced and no defined place to tab on from.
        if (e.key !== 'Escape') return;
        if (query) {
          setQuery('');
        } else if (expanded) {
          heightBeforeChange.current = cardRef.current?.offsetHeight ?? null;
          setExpanded(false);
        }
      }}
    >
      {/* Input — same look as the static shell it replaces */}
      <div className="relative w-full">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2" />
        <CommandPrimitive.Input
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          placeholder={placeholder}
          aria-label={label}
          onFocus={() => {
            heightBeforeChange.current = cardRef.current?.offsetHeight ?? null;
            setExpanded(true);
            if (onHero && !trackedFocus.current) {
              trackedFocus.current = true;
              trackHeroSearchClicked();
            }
          }}
          onBlur={() => {
            heightBeforeChange.current = cardRef.current?.offsetHeight ?? null;
            setExpanded(false);
          }}
          className={cn(HERO_SEARCH_INPUT_CLASS, 'focus:border-primary/50 focus:shadow-lg')}
        />
      </div>

      {/* Reserves the dropdown's resting height in the hero's flow, so the nearby pills sit below
          the open list; a query that grows the list grows it over the pills instead. The CSS
          variable is the estimate that matches the shell's skeleton; from mount on, the measured
          height takes over. */}
      <div
        aria-hidden="true"
        className="h-[var(--hero-search-rest-h)]"
        // The measured height replaces the CSS estimate on the hero only: `--hero-search-rest-h` is
        // calibrated for the hero's column, and in the narrower step card replacing it would pull
        // every chapter below up when this chunk mounts. Off the hero the floating dropdown may
        // overhang its reservation a little.
        style={
          onHero && restHeight != null ? { height: restHeight + DROPDOWN_TOP_GAP_PX } : undefined
        }
      />

      {/* The dropdown itself: always open (the hero's default state is an open list of the
          nearest parks), floating over the page. `onMouseDown` preventDefault keeps focus in
          the input so clicking a result cannot blur the field out from under the click. */}
      <div
        ref={dropdownRef}
        onMouseDown={(e) => e.preventDefault()}
        className="absolute inset-x-0 top-14 z-40"
      >
        {/* Real glass, not a near-opaque sheet: what it lands on is the hero photo, the scrim
            and the panel plate — all smooth, all beautiful under blur. The nearby pills would
            have ruined that (their text ghosts through the blur), so the panel fades them out
            while the field has focus instead of the dropdown going opaque. */}
        <GlassCard
          ref={cardRef}
          // Off the hero, `tile`: 75 % fill and `backdrop-blur-2xl`, so the card's own prose
          // under the dropdown stops reading through. Going opaque would fix the ghosting by
          // deleting the glass.
          variant={onHero ? 'heavy' : 'tile'}
          // Same marker the shell's skeleton carries, so `pnpm check:hero-search-rest` measures
          // the two against each other.
          data-hero-search-card=""
          className="border-border/60 mt-3 flex max-h-[var(--hero-search-max-h,32rem)] flex-col overflow-hidden p-0 shadow-2xl"
        >
          <SearchResultsPanel
            query={query}
            search={search}
            onSelect={handleSelect}
            onGlossarySelect={handleGlossarySelect}
            browseLimit={expanded ? undefined : HERO_BROWSE_LIMIT}
            listClassName="min-h-0 flex-1"
            skeletonRowClassName={HERO_SKELETON_ROW_CLASS}
          />
        </GlassCard>
      </div>
    </CommandPrimitive>
  );
}
