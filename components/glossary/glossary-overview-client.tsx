'use client';

import { useState, useMemo, useRef, useEffect, useDeferredValue } from 'react';
import { useTranslations } from 'next-intl';
import { Search, BookOpen, X, Tag, Rotate3d } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { GlossaryTermCard } from './glossary-term-card';
import type { GlossaryTermListItem, GlossaryCategory } from '@/lib/glossary/types';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';
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
 * The glossary overview: term cards grouped by category, with a search field, category pills and a
 * filter for terms that have a 3-D player. Typing anywhere focuses the search.
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

  // Type anywhere to focus search; Escape to clear + blur
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQuery('');
        inputRef.current?.blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return; // skip non-printable
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement
      )
        return;
      inputRef.current?.focus();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const totalCount = groupedTerms.reduce((acc, g) => acc + g.terms.length, 0);

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

  // Once per page, not once per card per render.
  const rideCountLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const [id, count] of Object.entries(rideCounts)) {
      if (count) labels[id] = t('rideCount', { count });
    }
    return labels;
  }, [rideCounts, t]);

  return (
    <div>
      <div className="bg-background/60 border-primary/15 mb-10 rounded-xl border shadow-sm backdrop-blur-md">
        <div className="px-6 py-5">
          <div className="relative mx-auto max-w-2xl">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setQuery('');
                  inputRef.current?.blur();
                }
              }}
              className="h-12 rounded-lg pr-10 pl-10 text-base shadow-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 flex size-11 -translate-y-1/2 items-center justify-center transition-colors sm:right-3.5 sm:size-auto"
                aria-label={t('clearSearch')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Tag className="h-3 w-3" />
              {hasFilter ? `${filteredCount} / ${totalCount}` : `${totalCount}`}
            </span>

            <span className="bg-border h-3.5 w-px" aria-hidden />

            <button
              onClick={() => setPlayerOnly((v) => !v)}
              aria-pressed={playerOnly}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors max-sm:min-h-9 max-sm:px-3',
                playerOnly
                  ? 'border-primary/60 bg-primary/10 text-primary font-medium'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              <Rotate3d className="h-3 w-3" />
              {t('player.title')}
            </button>

            <span className="bg-border h-3.5 w-px" aria-hidden />

            {groupedTerms.map(({ category, categoryLabel }) => (
              <button
                key={category}
                onClick={() => {
                  const next = activeCategory === category ? null : category;
                  setActiveCategory(next);
                  trackGlossaryCategoryFiltered({ category: next ?? 'none' });
                }}
                aria-pressed={activeCategory === category}
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors max-sm:min-h-9 max-sm:px-3',
                  activeCategory === category
                    ? 'border-primary/60 bg-primary/10 text-primary font-medium'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {categoryLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div aria-live="polite" aria-atomic="false">
        {filtered.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="bg-background/60 border-primary/15 flex flex-col items-center gap-3 rounded-xl border px-10 py-10 text-center shadow-sm backdrop-blur-md">
              <BookOpen className="text-muted-foreground h-10 w-10 opacity-40" />
              <p className="text-foreground font-medium">
                {t('noResults', { query: listQuery || listCategory || '' })}
              </p>
              <p className="text-muted-foreground text-sm">{t('noResultsHint')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* `id` is the category, which the header's "more" panel links into: the filter is
                client state with no URL, so a fragment is the only way in from outside. It stays
                while a filter is active. `scroll-mt-24` clears the floating header. */}
            {filtered.map(({ category, categoryLabel, terms }) => (
              <section key={category} id={category} className="scroll-mt-24">
                {/* Unnumbered: a filter drops groups, and a number must not skip. */}
                <ChapterHeading title={categoryLabel} className="mb-4" />
                <div className="grid gap-4 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
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
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
