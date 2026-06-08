'use client';

import { Loader2, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocaleTabsProps {
  locales: readonly string[];
  active: string;
  source: string;
  onActive: (l: string) => void;
  onSource: (l: string) => void;
  /** True for each locale that has any non-empty draft content. */
  filled: Record<string, boolean>;
  /** True while a translation is currently being generated for a target locale. */
  translatingTarget: string | null;
  onTranslate: (target: string) => void;
  translateDisabled: boolean;
  translateDisabledReason?: string;
}

/**
 * Notion-style locale switcher: one pill per locale, with a "filled" dot and a
 * source-language star. Clicking a pill flips the editor to that locale; the
 * star button promotes a locale to source. A per-locale "Translate from {src}"
 * button drives the AI fill from the active source locale.
 */
export function LocaleTabs({
  locales,
  active,
  source,
  onActive,
  onSource,
  filled,
  translatingTarget,
  onTranslate,
  translateDisabled,
  translateDisabledReason,
}: LocaleTabsProps) {
  return (
    <div className="border-border/60 bg-card/40 mb-4 flex flex-wrap items-center gap-2 rounded-2xl border p-3 backdrop-blur-sm">
      <span className="text-muted-foreground mr-1 text-[10px] font-semibold uppercase tracking-wider">
        Locales
      </span>
      {locales.map((l) => {
        const isActive = l === active;
        const isSource = l === source;
        const isFilled = filled[l];
        return (
          <div
            key={l}
            className={cn(
              'group inline-flex items-stretch overflow-hidden rounded-full border transition-colors',
              isActive ? 'border-primary/60 bg-primary/10' : 'border-border/60 bg-background/60'
            )}
          >
            <button
              type="button"
              onClick={() => onActive(l)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold transition-colors',
                isActive ? 'text-primary' : 'text-foreground/80 hover:text-foreground'
              )}
            >
              <span className="uppercase tracking-wider">{l}</span>
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isFilled ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                )}
                aria-label={isFilled ? 'filled' : 'empty'}
              />
            </button>
            <button
              type="button"
              onClick={() => onSource(l)}
              title={isSource ? 'Source language' : 'Set as source language'}
              className={cn(
                'inline-flex items-center px-1.5 transition-colors',
                isSource
                  ? 'text-amber-400'
                  : 'text-muted-foreground/40 hover:text-muted-foreground'
              )}
            >
              <Star className={cn('h-3 w-3', isSource && 'fill-current')} />
            </button>
          </div>
        );
      })}
      <div className="ml-auto inline-flex items-center gap-2">
        {active !== source && (
          <button
            type="button"
            onClick={() => onTranslate(active)}
            disabled={translateDisabled || translatingTarget !== null}
            title={translateDisabled ? translateDisabledReason : undefined}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              translateDisabled
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25'
            )}
          >
            {translatingTarget === active ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {translatingTarget === active
              ? 'Translating…'
              : `Translate from ${source.toUpperCase()}`}
          </button>
        )}
      </div>
    </div>
  );
}
