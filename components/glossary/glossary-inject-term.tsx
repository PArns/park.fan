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
}

export function GlossaryInjectTerm({
  matchedText,
  name,
  slug,
  shortDefinition,
  locale,
  segment,
}: GlossaryInjectTermProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={`/${locale}/${segment}/${slug}`}
          className="border-b border-dashed border-current/40 cursor-help font-[inherit] decoration-0"
        >
          {matchedText}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64">
        <p className="font-semibold">{name}</p>
        <p className="mt-0.5 opacity-80">{shortDefinition}</p>
      </TooltipContent>
    </Tooltip>
  );
}
