'use client';

import type { ReactNode } from 'react';
import { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  getLoadedGlossaryTerms,
  loadGlossaryTerms,
  subscribeGlossaryTerms,
} from '@/lib/glossary/client-data-loader';
import type { Locale } from '@/i18n/config';

/**
 * Subscribes to the lazily loaded glossary data for `locale`: `undefined` on the server and the
 * first client render, so the markup matches, then the term map once the per-locale chunk loads.
 * `useSyncExternalStore` re-reads after subscribing, so a link mounting mid-import cannot miss it.
 */
function useGlossaryTerms(locale: Locale) {
  useEffect(() => {
    loadGlossaryTerms(locale);
  }, [locale]);
  return useSyncExternalStore(
    subscribeGlossaryTerms,
    () => getLoadedGlossaryTerms(locale),
    () => undefined
  );
}

interface GlossaryTermLinkProps {
  /** Glossary term id (from data.ts). */
  termId: string;
  children: ReactNode;
  className?: string;
  /** Show tooltip on hover. Enabled by default. */
  showTooltip?: boolean;
  /**
   * Render as a tooltip-only span (no link). Use inside card links to avoid nested <a> elements.
   */
  tooltipOnly?: boolean;
}

/**
 * Glossary term link with an optional tooltip, for client trees where the async `GlossaryInject`
 * is not available. Until the per-locale term data loads, the children render as plain text.
 */
export function GlossaryTermLink({
  termId,
  children,
  className,
  showTooltip = true,
  tooltipOnly = false,
}: GlossaryTermLinkProps) {
  const locale = useLocale() as Locale;
  const termData = useGlossaryTerms(locale)?.[termId];
  if (!termData) return <>{children}</>;
  const slug = termData.slug;
  const segment = GLOSSARY_SEGMENTS[locale];

  const tooltipName = showTooltip ? termData.name : null;
  const tooltipDefinition = showTooltip ? termData.shortDefinition : null;

  // tooltipOnly mode: render a span with tooltip but no link (use inside card <Link> elements)
  if (tooltipOnly) {
    const trigger = <span className={className ?? 'cursor-help'}>{children}</span>;
    if (tooltipName && tooltipDefinition) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-64">
            <p className="font-semibold">{tooltipName}</p>
            <p className="text-muted-foreground mt-0.5">{tooltipDefinition}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return <>{children}</>;
  }

  const link = (
    <Link
      href={`/${locale}/${segment}/${slug}`}
      prefetch={false}
      className={
        className ??
        'cursor-help border-b border-dashed border-current/40 font-[inherit] no-underline'
      }
    >
      {children}
    </Link>
  );

  if (tooltipName && tooltipDefinition) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-background/80 text-foreground border-border/60 max-w-64 border shadow-lg backdrop-blur-md"
          arrowClassName="bg-background/80 fill-background border-border/60"
        >
          <p className="font-semibold">{tooltipName}</p>
          <p className="text-muted-foreground mt-0.5">{tooltipDefinition}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Fallback: return link without tooltip if data is not available
  return link;
}
