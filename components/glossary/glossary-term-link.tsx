'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { GLOSSARY_TERMS } from '@/lib/glossary/data';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CLIENT_GLOSSARY_TERMS } from '@/lib/glossary/client-data';
import type { Locale } from '@/i18n/config';

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
 */
export function GlossaryTermLink({
  termId,
  children,
  className,
  showTooltip = true,
  tooltipOnly = false,
}: GlossaryTermLinkProps) {
  const locale = useLocale() as Locale;
  const termData = GLOSSARY_TERMS.find((t) => t.id === termId);
  if (!termData) return <>{children}</>;
  const slug = termData.slugs[locale];
  const segment = GLOSSARY_SEGMENTS[locale];

  // Get tooltip data if available and enabled
  const clientTerm = showTooltip ? CLIENT_GLOSSARY_TERMS[termId] : null;
  const tooltipName = clientTerm?.name[locale];
  const tooltipDefinition = clientTerm?.shortDefinition[locale];

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
