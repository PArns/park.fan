'use client';

import { useState, useMemo, useRef, useEffect, useDeferredValue } from 'react';
import { useTranslations } from 'next-intl';
import { Search, BookOpen, X, Rotate3d } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChapterHeading } from '@/components/common/chapter-heading';
import {
  FILTER_PILL_ROW_CLASS,
  filterPillClass,
  LISTING_SEARCH_INPUT_CLASS,
} from '@/components/blog/post-stream';
import { GlossaryTermCard } from './glossary-term-card';
import { GLOSSARY_CATEGORY_ICONS } from './glossary-category-icons';
import type { GlossaryTermListItem, GlossaryCategory } from '@/lib/glossary/types';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';
import { nothingFocused } from '@/lib/utils/page-focus';
import { trackGlossaryCategoryFiltered, trackGlossarySearched } from '@/lib/analytics/umami';

interface CategoryGroup {
  category: GlossaryCategory;
  categoryLabel: string;
  terms: GlossaryTermListItem[];
}

interface GlossaryOverviewClientProps {
  groupedTerms: CategoryGroup[];
  /** Term id → number of curated rides featuring it. Missing means none. */
  rideCounts: Record<string, number>;
  locale: Locale;
  segment: string;
}

/**
 * The glossary overview: term cards grouped by category under a chapter heading each, with the
 * listings' search field, a 3-D filter beside it and the category pills under it. Typing with
 * nothing focused moves into the search.
 */
export function GlossaryOverviewClient({
  groupedTerms,
  rideCounts,
  locale,
  segment,
}: GlossaryOverviewClientProps) {
  const t = useTranslations('glossary');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory | null>(null);
  const [playerOnly, setPlayerOnly] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track search queries (debounced, min 3 chars, privacy-safe — only length).
  // No `locale` property: it is already in the event's own URL (/de/glossar/…) and Umami bills
  // every property as another event.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) return;
    const timer = setTimeout(() => {
      trackGlossarySearched({ queryLength: trimmed.length });
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);

  // Only with nothing focused, and never Space: a letter on a focused pill or link belongs to it,
  // and an Escape that closes a dialog must not clear the search behind it. The field handles its
  // own Escape. See docs/rules/a-keyboard-shortcut-waits-for-an-unfocused-page.md.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!nothingFocused(document.activeElement)) return;
      if (e.key === 'Escape') {
        setQuery('');
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1 || e.key === ' ') return;
      inputRef.current?.focus();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const totalCount = groupedTerms.reduce((acc, g) => acc + g.terms.length, 0);
  const playerCount = useMemo(
    () => groupedTerms.reduce((acc, g) => acc + g.terms.filter((term) => term.player).length, 0),
    [groupedTerms]
  );

  // The field and the pills read the live state; the grid reads deferred copies, so a keystroke
  // does not rebuild up to ~270 cards in its own commit. See
  // docs/rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md.
  const listQuery = useDeferredValue(query);
  const listCategory = useDeferredValue(activeCategory);
  const listPlayerOnly = useDeferredValue(playerOnly);

  const filtered = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    return groupedTerms
      .filter((group) => !listCategory || group.category === listCategory)
      .map((group) => ({
        ...group,
        terms: group.terms.filter((term) => {
          if (listPlayerOnly && !term.player) return false;
          if (!q) return true;
          return (
            term.name.toLowerCase().includes(q) ||
            term.shortDefinition.toLowerCase().includes(q) ||
            term.enName.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((group) => group.terms.length > 0);
  }, [listQuery, listCategory, listPlayerOnly, groupedTerms]);

  const filteredCount = filtered.reduce((acc, g) => acc + g.terms.length, 0);
  const hasFilter = listQuery.trim() || listCategory || listPlayerOnly;
  const listCategoryLabel = groupedTerms.find((g) => g.category === listCategory)?.categoryLabel;

  // Once per page, not once per card per render.
  const rideCountLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const [id, count] of Object.entries(rideCounts)) {
      if (count) labels[id] = t('rideCount', { count });
    }
    return labels;
  }, [rideCounts, t]);

  const chooseCategory = (next: GlossaryCategory | null) => {
    setActiveCategory(next);
    trackGlossaryCategoryFiltered({ category: next ?? 'none' });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-3">
        <div role="search" className="relative w-full sm:max-w-md">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            type="text"
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            autoComplete="off"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setQuery('');
                inputRef.current?.blur();
              }
            }}
            className={cn(LISTING_SEARCH_INPUT_CLASS, 'pr-11')}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-0 flex size-11 -translate-y-1/2 items-center justify-center rounded-full transition-colors"
              aria-label={t('clearSearch')}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* A toggle that stacks on the category, not one of the categories, so it stands apart
            from their row. */}
        {playerCount > 0 && (
          <button
            type="button"
            onClick={() => setPlayerOnly((v) => !v)}
            aria-pressed={playerOnly}
            className={filterPillClass(playerOnly)}
          >
            <Rotate3d className="size-4" aria-hidden="true" />
            {t('player.title')}
            <span className="tabular-nums opacity-70">{playerCount}</span>
          </button>
        )}

        {hasFilter && (
          <span className="text-muted-foreground text-sm tabular-nums">
            {filteredCount} / {totalCount}
          </span>
        )}
      </div>

      <div role="group" aria-label={t('filter.label')} className={FILTER_PILL_ROW_CLASS}>
        <button
          type="button"
          onClick={() => chooseCategory(null)}
          aria-pressed={activeCategory === null}
          className={filterPillClass(activeCategory === null)}
        >
          {t('filter.all')}
          <span className="tabular-nums opacity-70">{totalCount}</span>
        </button>
        {groupedTerms.map(({ category, categoryLabel, terms }) => (
          <button
            key={category}
            type="button"
            onClick={() => chooseCategory(activeCategory === category ? null : category)}
            aria-pressed={activeCategory === category}
            className={filterPillClass(activeCategory === category)}
          >
            {categoryLabel}
            <span className="tabular-nums opacity-70">{terms.length}</span>
          </button>
        ))}
      </div>

      <div aria-live="polite" aria-atomic="false">
        {filtered.length === 0 ? (
          <div className="border-border flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center">
            <BookOpen className="text-muted-foreground size-10 opacity-40" aria-hidden="true" />
            <p className="text-foreground font-medium">
              {t('noResults', { query: listQuery.trim() || listCategoryLabel || '' })}
            </p>
            <p className="text-muted-foreground text-sm">{t('noResultsHint')}</p>
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-16">
            {/* `id` is the category, which the header's "more" panel links into: the filter is
                client state with no URL, so a fragment is the only way in from outside. It stays
                while a filter is active. `scroll-mt-24` clears the floating header. */}
            {filtered.map(({ category, categoryLabel, terms }) => (
              <section key={category} id={category} className="scroll-mt-24">
                {/* Unnumbered: a filter drops groups, and a number must not skip. */}
                <ChapterHeading
                  icon={GLOSSARY_CATEGORY_ICONS[category]}
                  title={categoryLabel}
                  badge={<Badge variant="secondary">{terms.length}</Badge>}
                />
                {/* A definition list: each card is a term and its definition (`GlossaryTermCard`). */}
                <dl className="grid gap-3 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
                  {terms.map((term) => (
                    <GlossaryTermCard
                      key={term.id}
                      term={term}
                      locale={locale}
                      segment={segment}
                      playerLabel={t('player.title')}
                      rideCount={rideCounts[term.id]}
                      rideCountLabel={rideCountLabels[term.id]}
                    />
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
