import type { GlossarySegment } from '@/lib/glossary/parse-segments';
import { GlossaryInjectTerm } from './glossary-inject-term';

/** Renders parsed glossary segments as text with tooltip links, from a server or a client tree. */
export function GlossarySegments({
  segments,
  locale,
  segment,
  noUnderline = false,
}: {
  segments: GlossarySegment[];
  locale: string;
  segment: string;
  noUnderline?: boolean;
}) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return seg.content;
        return (
          <GlossaryInjectTerm
            key={`${seg.id}-${i}`}
            matchedText={seg.matchedText}
            name={seg.name}
            slug={seg.slug}
            shortDefinition={seg.shortDefinition}
            locale={locale}
            segment={segment}
            noUnderline={noUnderline}
          />
        );
      })}
    </>
  );
}
