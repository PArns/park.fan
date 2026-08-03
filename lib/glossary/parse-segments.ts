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

export function parseGlossarySegments(text: string, terms: GlossaryMatchTerm[]): GlossarySegment[] {
  const entries = buildMatchEntries(terms);
  if (entries.length === 0) return [{ type: 'text', content: text }];

  const entryByPattern = new Map(entries.map((e) => [e.pattern.toLowerCase(), e]));
  const pattern = entries.map((e) => buildPatternFragment(e.pattern)).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');

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
 * Narrow a term list to the ones that can possibly match anywhere in `corpus`.
 *
 * Same purpose as `leanParkForShell` in `lib/api/parks.ts`: `<GlossaryInjectProvider>` is a CLIENT
 * boundary, so whatever it is handed is serialized into the page. The park page was passing the
 * whole dictionary — 61.2 KB (18.0 KB brotli, 25 % of the park page) — so that a FAQ of a few
 * paragraphs could link the handful of terms it happens to mention.
 *
 * Uses the exact matching rules of {@link parseGlossarySegments} (same alternation, same word
 * boundaries, same ≤4-char exact-case rule), so a term survives this filter if and only if the
 * client could have linked it. The one thing it does NOT model is first-occurrence-only — that is
 * per-string state at render time and would only ever drop MORE terms, never keep fewer.
 *
 * Pass a corpus that is a superset of what will be rendered. Text the client interpolates later
 * (park name, weekday names, hours) has to be included by the caller.
 */
export function filterMatchableTerms<T extends GlossaryMatchTerm>(corpus: string, terms: T[]): T[] {
  const entries = buildMatchEntries(terms);
  if (entries.length === 0 || !corpus) return [];

  const entryByPattern = new Map(entries.map((e) => [e.pattern.toLowerCase(), e]));
  const regex = new RegExp(
    `(${entries.map((e) => buildPatternFragment(e.pattern)).join('|')})`,
    'gi'
  );

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
