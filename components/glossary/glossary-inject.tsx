import { getLocale } from 'next-intl/server';
import { getGlossaryTerms, GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';
import type { Locale } from '@/i18n/config';
import type { GlossaryTerm } from '@/lib/glossary/types';
import { GlossaryInjectTerm } from './glossary-inject-term';

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type Segment =
  | { type: 'text'; content: string }
  | { type: 'term'; id: string; matchedText: string; slug: string; shortDefinition: string; name: string };

function parseSegments(text: string, terms: GlossaryTerm[]): Segment[] {
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
 * Async server component — fetches glossary terms for the current locale and
 * replaces the first occurrence of each term with a dashed-underline tooltip link.
 *
 * No provider or wrapper needed. Works in any server component.
 */
export async function GlossaryInject({ children }: { children: string }) {
  if (!children) return <>{children}</>;

  const locale = (await getLocale()) as Locale;
  const terms = await getGlossaryTerms(locale);
  const segment = GLOSSARY_SEGMENTS[locale];

  const segments = parseSegments(children, terms);

  // If no terms matched, return plain text
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
            locale={locale}
            segment={segment}
          />
        );
      })}
    </>
  );
}
