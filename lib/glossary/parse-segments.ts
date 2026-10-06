import type { GlossaryTerm } from '@/lib/glossary/types';

/**
 * Pure (no server/client-only APIs) glossary text-matching used by both the server
 * `<GlossaryInject>` and its client counterpart. Splits a string into plain-text and
 * term segments, linking the FIRST occurrence of each term name/alias.
 */

/** Minimal term shape needed for matching + rendering (server passes the full GlossaryTerm). */
export interface GlossaryMatchTerm {
  id: string;
  name: string;
  shortDefinition: string;
  slug: string;
  aliases?: string[];
}

export type GlossarySegment =
  | { type: 'text'; content: string }
  | {
      type: 'term';
      id: string;
      matchedText: string;
      slug: string;
      shortDefinition: string;
      name: string;
    };

interface MatchEntry {
  /** The string pattern to match (term name or alias). */
  pattern: string;
  term: GlossaryMatchTerm;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build a flat list of all matchable patterns (names + aliases), sorted longest-first. */
function buildMatchEntries(terms: GlossaryMatchTerm[]): MatchEntry[] {
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

interface Matcher {
  entryByPattern: Map<string, MatchEntry>;
  /** Global, so it carries `lastIndex` between calls: reset it before every scan. */
  regex: RegExp;
}

/**
 * The compiled matcher for one term list, built once per list: compiling several hundred names and
 * aliases costs far more than matching the one sentence it then runs over. `getGlossaryTerms`
 * hands every caller the same array, so this builds once per locale; a `WeakMap` because the
 * client builds its own lists. A list mutated after it was handed out would keep its old matcher.
 */
const matchers = new WeakMap<GlossaryMatchTerm[], Matcher | null>();

function getMatcher(terms: GlossaryMatchTerm[]): Matcher | null {
  let matcher = matchers.get(terms);
  if (matcher === undefined) {
    const entries = buildMatchEntries(terms);
    matcher =
      entries.length === 0
        ? null
        : {
            entryByPattern: new Map(entries.map((e) => [e.pattern.toLowerCase(), e])),
            regex: new RegExp(
              `(${entries.map((e) => buildPatternFragment(e.pattern)).join('|')})`,
              'gi'
            ),
          };
    matchers.set(terms, matcher);
  }
  if (matcher) matcher.regex.lastIndex = 0;
  return matcher;
}

/**
 * Splits text into plain-text and glossary-term segments, linking only the first occurrence of each
 * term name or alias; a name or alias of four characters or less must match its exact case.
 */
export function parseGlossarySegments(text: string, terms: GlossaryMatchTerm[]): GlossarySegment[] {
  const matcher = getMatcher(terms);
  if (!matcher) return [{ type: 'text', content: text }];
  const { entryByPattern, regex } = matcher;

  const segments: GlossarySegment[] = [];
  /** Track which term IDs have already been linked (first-occurrence-only). */
  const used = new Set<string>();
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matched = match[0];
    const entry = entryByPattern.get(matched.toLowerCase());
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
 * Narrows a term list to the ones that can match anywhere in `corpus`, because
 * `<GlossaryInjectProvider>` is a client boundary and serializes what it is handed. Same matching
 * rules as {@link parseGlossarySegments} except first-occurrence-only, which could only drop more.
 * Pass a corpus that is a superset of what will render, including text the client interpolates.
 */
export function filterMatchableTerms<T extends GlossaryMatchTerm>(corpus: string, terms: T[]): T[] {
  if (!corpus) return [];
  const matcher = getMatcher(terms);
  if (!matcher) return [];
  const { entryByPattern, regex } = matcher;

  const keep = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(corpus)) !== null) {
    const matched = match[0];
    const entry = entryByPattern.get(matched.toLowerCase());
    if (!entry) continue;
    // Mirrors parseGlossarySegments: short acronym aliases must match case-exactly, so a German
    // article "das" never drags the "DAS" term into the payload.
    if (entry.pattern.length <= 4 && entry.pattern !== matched) continue;
    keep.add(entry.term.id);
  }

  return terms.filter((t) => keep.has(t.id));
}

/** Type bridge: the server passes the richer GlossaryTerm; matching only needs a subset. */
export type { GlossaryTerm };
