'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, BookOpen, X, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { GlossaryTermCard } from './glossary-term-card';
import type { GlossaryTermWithEnName, GlossaryCategory } from '@/lib/glossary/types';
import type { Locale } from '@/i18n/config';
import type { Breadcrumb } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface CategoryGroup {
  category: GlossaryCategory;
  categoryLabel: string;
  terms: GlossaryTermWithEnName[];
}

interface GlossaryOverviewClientProps {
  groupedTerms: CategoryGroup[];
  locale: Locale;
  segment: string;
  title: string;
  h1: string;
  description: string;
  breadcrumbs: Breadcrumb[];
}

export function GlossaryOverviewClient({
  groupedTerms,
  locale,
  segment,
  title,
  h1,
  description,
  breadcrumbs,
}: GlossaryOverviewClientProps) {
  const t = useTranslations('glossary');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupedTerms
      .filter((group) => !activeCategory || group.category === activeCategory)
      .map((group) => ({
        ...group,
        terms: !q
          ? group.terms
          : group.terms.filter(
              (term) =>
                term.name.toLowerCase().includes(q) ||
                term.shortDefinition.toLowerCase().includes(q) ||
                term.enName.toLowerCase().includes(q)
            ),
      }))
      .filter((group) => group.terms.length > 0);
  }, [query, activeCategory, groupedTerms]);

  const filteredCount = filtered.reduce((acc, g) => acc + g.terms.length, 0);
  const hasFilter = query.trim() || activeCategory;

  return (
    <div>
      {/* Breadcrumb outside panel */}
      <div className="mb-4">
        <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={title} variant="pill" />
      </div>

      {/* ── Glass panel: title + description + search ── */}
      <div className="bg-background/60 border-primary/15 mb-10 rounded-xl border shadow-sm backdrop-blur-md">
        {/* Title + description */}
        <div className="px-6 pt-5 pb-6">
          <h1 className="mb-2 text-3xl font-bold">{h1}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {/* Divider */}
        <div className="border-primary/10 border-t" />

        {/* Search + filters */}
        <div className="px-6 py-5">
          {/* Centered, constrained search input */}
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
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Stats + category pills */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Tag className="h-3 w-3" />
              {hasFilter ? `${filteredCount} / ${totalCount}` : `${totalCount}`}
            </span>

            <span className="bg-border h-3.5 w-px" aria-hidden />

            {groupedTerms.map(({ category, categoryLabel }) => (
              <button
                key={category}
                onClick={() => setActiveCategory((prev) => (prev === category ? null : category))}
                aria-pressed={activeCategory === category}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
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

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <div aria-live="polite" aria-atomic="false">
        {filtered.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="bg-background/60 border-primary/15 flex flex-col items-center gap-3 rounded-xl border px-10 py-10 text-center shadow-sm backdrop-blur-md">
              <BookOpen className="text-muted-foreground h-10 w-10 opacity-40" />
              <p className="text-foreground font-medium">
                {t('noResults', { query: query || activeCategory || '' })}
              </p>
              <p className="text-muted-foreground text-sm">{t('noResultsHint')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {filtered.map(({ category, categoryLabel, terms }) => (
              <section key={category}>
                <h2 className="mb-4 text-xl font-semibold">{categoryLabel}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {terms.map((term) => (
                    <GlossaryTermCard key={term.id} term={term} locale={locale} segment={segment} />
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
