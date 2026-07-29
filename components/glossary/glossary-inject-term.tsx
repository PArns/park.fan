'use client';

// A client component on purpose, like its sibling GlossaryTermLink. Rendered from the *server*,
// `next/link` reaches `<TooltipTrigger asChild>` as a lazy client reference, and Radix's Slot only
// unwraps a lazy child while its payload is still pending — once another `next/link` on the page
// has already resolved that chunk, the payload is settled, Slot sees a non-element and throws
// "Primitive.button failed to slot onto its children", taking the whole post's client tree into the
// error boundary. Long posts hit it reliably (more links resolve the chunk sooner), short ones look
// fine, which is what made it read as content-dependent. Keeping the tooltip and the link inside
// one client boundary means no lazy wrapper ever reaches the Slot.

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
          prefetch={false}
          className={
            noUnderline
              ? 'cursor-help font-[inherit] decoration-0'
              : 'cursor-help border-b border-dashed border-current/40 font-[inherit] decoration-0'
          }
        >
          {matchedText}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64">
        <p className="font-semibold">{name}</p>
        <p className="text-muted-foreground mt-0.5">{shortDefinition}</p>
      </TooltipContent>
    </Tooltip>
  );
}
