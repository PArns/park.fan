'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useGlossaryInject, type GlossaryInjectTerm } from './glossary-inject-context';

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type Segment =
  | { type: 'text'; content: string }
  | { type: 'term'; id: string; matchedText: string; slug: string; shortDefinition: string; name: string };

function parseSegments(text: string, terms: GlossaryInjectTerm[]): Segment[] {
  // Sort longest-first so "Express Pass" matches before "Express"
  const sorted = [...terms].sort((a, b) => b.name.length - a.name.length);
  const pattern = sorted.map((t) => `\\b${escapeRegex(t.name)}\\b`).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');

  const segments: Segment[] = [];
  const used = new Set<string>();
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matched = match[0];
    const term = sorted.find((t) => t.name.toLowerCase() === matched.toLowerCase());
    if (!term || used.has(term.id)) continue;
    used.add(term.id);

    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({
      type: 'term',
      id: term.id,
      matchedText: matched,
      slug: term.slug,
      shortDefinition: term.shortDefinition,
      name: term.name,
    });
    lastIndex = match.index + matched.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

/**
 * Scans a text string for glossary terms and replaces the first occurrence of
 * each with a dashed-underline link that shows a tooltip with the short definition.
 *
 * Requires a <GlossaryInjectLoader> ancestor in the tree.
 * If no provider is found, renders the text as-is.
 */
export function GlossaryInject({ children }: { children: string }) {
  const ctx = useGlossaryInject();

  const segments = useMemo<Segment[]>(() => {
    if (!ctx || !children) return [{ type: 'text', content: children ?? '' }];
    return parseSegments(children, ctx.terms);
  }, [ctx, children]);

  if (!ctx) return <>{children}</>;

  return (
    <>
      {segments.map((seg: Segment) => {
        if (seg.type === 'text') return seg.content;
        return (
          <Tooltip key={seg.id}>
            <TooltipTrigger asChild>
              <Link
                href={`/${ctx.locale}/${ctx.segment}/${seg.slug}`}
                className="border-b border-dashed border-current/40 cursor-help font-[inherit] decoration-0"
              >
                {seg.matchedText}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64">
              <p className="font-semibold">{seg.name}</p>
              <p className="mt-0.5 opacity-80">{seg.shortDefinition}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </>
  );
}
