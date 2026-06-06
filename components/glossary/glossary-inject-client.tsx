'use client';

import { parseGlossarySegments } from '@/lib/glossary/parse-segments';
import { GlossaryInjectTerm } from './glossary-inject-term';
import { useGlossaryInject } from './glossary-inject-context';

/**
 * Client counterpart to the async server `<GlossaryInject>`. Reads the glossary terms from
 * the surrounding <GlossaryInjectProvider> (seeded server-side via <GlossaryInjectLoader> or a
 * direct provider) instead of awaiting them, so it can run inside a Client Component subtree
 * (e.g. the client FAQ section) and still produce identical term-linked output.
 *
 * No-ops gracefully (renders plain text) when no provider is present.
 */
export function GlossaryInjectClient({
  children,
  noUnderline = false,
}: {
  children: string;
  noUnderline?: boolean;
}) {
  const ctx = useGlossaryInject();

  if (!children || !ctx || ctx.terms.length === 0) {
    return <>{children}</>;
  }

  const segments = parseGlossarySegments(children, ctx.terms);

  if (segments.every((s) => s.type === 'text')) {
    return <>{children}</>;
  }

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
            locale={ctx.locale}
            segment={ctx.segment}
            noUnderline={noUnderline}
          />
        );
      })}
    </>
  );
}
