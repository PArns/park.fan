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
