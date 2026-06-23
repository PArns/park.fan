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
 * Subscribe to the lazily-loaded glossary data for `locale`. Returns the term map once it
 * resolves (or `undefined` until then). The data is client-only, so SSR and the first client
 * render both return `undefined` (matching markup → no hydration mismatch); the links/tooltips
 * "highlight in" right after the per-locale chunk loads. Only the mounted term-link instances
 * re-render — never the whole page.
 *
 * `useSyncExternalStore` re-reads the snapshot immediately after subscribing, so a term link
 * that mounts while the import is in-flight can't miss the resolution that lands in the
 * render→effect gap (which a manual effect+subscribe would). The effect only kicks the
 * (deduplicated) load off after first paint.
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
 * Lightweight client component for rendering a glossary term link with optional tooltip.
 * Use this in client component trees where async GlossaryInject is not available.
 *
 * The term data (name/definition/slug) is loaded lazily per locale (see client-data-loader),
 * so until it arrives the children render as plain text and then upgrade to a link + tooltip.
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

  // Get tooltip data if available and enabled
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

  // If we have tooltip data, wrap in Tooltip component
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
