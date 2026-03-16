'use client';

import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GlossaryInjectTermProps {
  matchedText: string;
  name: string;
  slug: string;
  shortDefinition: string;
  locale: string;
  segment: string;
  /** When true, suppress the dashed underline (e.g. inside headings). */
  noUnderline?: boolean;
}

export function GlossaryInjectTerm({
  matchedText,
  name,
  slug,
  shortDefinition,
  locale,
  segment,
  noUnderline = false,
}: GlossaryInjectTermProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={`/${locale}/${segment}/${slug}`}
          className={
            noUnderline
              ? 'cursor-help font-[inherit] decoration-0'
              : 'border-b border-dashed border-current/40 cursor-help font-[inherit] decoration-0'
          }
        >
          {matchedText}
        </Link>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-64 bg-background/80 text-foreground backdrop-blur-md border border-border/60 shadow-lg"
        arrowClassName="bg-background/80 fill-background border-border/60"
      >
        <p className="font-semibold">{name}</p>
        <p className="mt-0.5 text-muted-foreground">{shortDefinition}</p>
      </TooltipContent>
    </Tooltip>
  );
}
