'use client';

import { useMemo } from 'react';
import { parseGlossarySegments } from '@/lib/glossary/parse-segments';
import { GlossaryInjectTerm } from './glossary-inject-term';
import { useGlossaryInject } from './glossary-inject-context';

/**
 * Client counterpart to the async server `<GlossaryInject>`. Reads the glossary terms from
 * the surrounding <GlossaryInjectProvider> (seeded server-side) instead of awaiting them,
 * so it can run inside a Client Component subtree
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
  const terms = ctx?.terms;

  // Memoized: matching the text against the full term/alias list is the expensive part,
  // and it must not re-run on unrelated re-renders of the surrounding client tree.
  const segments = useMemo(
    () => (children && terms && terms.length > 0 ? parseGlossarySegments(children, terms) : null),
    [children, terms]
  );

  if (!ctx || !segments) {
    return <>{children}</>;
  }

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
