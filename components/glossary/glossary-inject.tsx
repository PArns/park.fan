import { getLocale } from 'next-intl/server';
import { getGlossaryTerms, GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';
import type { Locale } from '@/i18n/config';
import type { GlossaryTerm } from '@/lib/glossary/types';
import { GlossaryInjectTerm } from './glossary-inject-term';

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface MatchEntry {
  /** The string pattern to match (term name or alias). */
  pattern: string;
  term: GlossaryTerm;
}

/** Build a flat list of all matchable patterns (names + aliases), sorted longest-first. */
function buildMatchEntries(terms: GlossaryTerm[]): MatchEntry[] {
  const entries: MatchEntry[] = [];
  for (const term of terms) {
    entries.push({ pattern: term.name, term });
    for (const alias of term.aliases ?? []) {
      entries.push({ pattern: alias, term });
    }
  }
  return entries.sort((a, b) => b.pattern.length - a.pattern.length);
}

/**
 * Build a regex fragment for a single pattern.
 * - Leading `\b` anchors the start (pattern always begins with a word char).
 * - Trailing boundary: use `\b` when the pattern ends with a word char (\w),
 *   otherwise use `(?=\W|$)` — needed for patterns like "R²" where the
 *   superscript `²` is not a \w character and `\b` would never match after it.
 */
function buildPatternFragment(pattern: string): string {
  const escaped = escapeRegex(pattern);
  const lastChar = pattern[pattern.length - 1];
  const trailingBoundary = /\w/.test(lastChar) ? '\\b' : '(?=\\W|$)';
  return `\\b${escaped}${trailingBoundary}`;
}

type Segment =
  | { type: 'text'; content: string }
  | {
      type: 'term';
      id: string;
      matchedText: string;
      slug: string;
      shortDefinition: string;
      name: string;
    };

function parseSegments(text: string, terms: GlossaryTerm[]): Segment[] {
  const entries = buildMatchEntries(terms);
  if (entries.length === 0) return [{ type: 'text', content: text }];

  const pattern = entries.map((e) => buildPatternFragment(e.pattern)).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');

  const segments: Segment[] = [];
  /** Track which term IDs have already been linked (first-occurrence-only). */
  const used = new Set<string>();
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matched = match[0];
    const entry = entries.find((e) => e.pattern.toLowerCase() === matched.toLowerCase());
    if (!entry || used.has(matched.toLowerCase())) continue;

    // Short patterns (≤ 4 chars) must match exactly — avoids matching common words
    // as acronym aliases (e.g. alias "DAS" case-insensitively matching article "das")
    if (entry.pattern.length <= 4 && entry.pattern !== matched) continue;
    used.add(matched.toLowerCase());

    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({
      type: 'term',
      id: entry.term.id,
      matchedText: matched,
      slug: entry.term.slug,
      shortDefinition: entry.term.shortDefinition,
      name: entry.term.name,
    });
    lastIndex = match.index + matched.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

/**
 * Async server component — fetches glossary terms for the given (or current) locale and
 * replaces the first occurrence of each term (or alias) with a dashed-underline
 * tooltip link. No provider or wrapper needed.
 *
 * @param locale  Optional: the locale to use. If not provided, uses getLocale().
 * @param noUnderline  When true, suppress the dashed underline (e.g. inside headings).
 */
export async function GlossaryInject({
  children,
  locale: providedLocale,
  noUnderline = false,
}: {
  children: string;
  locale?: Locale;
  noUnderline?: boolean;
}) {
  if (!children) return <>{children}</>;

  const locale = (providedLocale ?? ((await getLocale()) as Locale)) as Locale;
  const terms = await getGlossaryTerms(locale);
  const segment = GLOSSARY_SEGMENTS[locale];

  const segments = parseSegments(children, terms);

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
            noUnderline={noUnderline}
          />
        );
      })}
    </>
  );
}
