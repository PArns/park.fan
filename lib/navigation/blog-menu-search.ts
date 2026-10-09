import type { BlogMenuSearchEntry } from '@/lib/navigation/blog-menu';
import { foldText } from '@/lib/utils/text-fold';

/** Below this many characters a query matches half the list and says nothing. */
const BLOG_MENU_SEARCH_MIN_CHARS = 2;

/** Rows the panel shows for a query: its two columns of four, the height the newest posts take. */
export const BLOG_MENU_SEARCH_LIMIT = 8;

/**
 * How much a word found in each field counts. A word in the title is what the visitor meant far
 * more often than the same word in a teaser, so a title hit outranks any number of teaser hits
 * for that word.
 */
const FIELD_WEIGHTS = { title: 8, category: 4, terms: 4, excerpt: 1 } as const;

type Field = keyof typeof FIELD_WEIGHTS;
const FIELDS = Object.keys(FIELD_WEIGHTS) as Field[];

/** Each index folded once, not once per keystroke; keyed by the array the query cache holds. */
const FOLDED = new WeakMap<readonly BlogMenuSearchEntry[], Record<Field, string>[]>();

function foldedFields(entries: readonly BlogMenuSearchEntry[]): Record<Field, string>[] {
  let folded = FOLDED.get(entries);
  if (!folded) {
    folded = entries.map((entry) => ({
      title: foldText(entry.title),
      category: foldText(entry.category ?? ''),
      terms: foldText(entry.terms ?? ''),
      excerpt: foldText(entry.excerpt ?? ''),
    }));
    FOLDED.set(entries, folded);
  }
  return folded;
}

/**
 * How well `word` sits in `text`, both folded: 1 where it starts a word ("dis" in "Disneyland"),
 * half inside one from four letters on, so German compounds answer ("karte" in "Jahreskarte")
 * while a short fragment does not drag in every word that happens to contain it ("dis" in
 * "Paradis"), and 0 elsewhere.
 */
function matchStrength(text: string, word: string): number {
  let from = text.indexOf(word);
  if (from === -1) return 0;
  while (from !== -1) {
    if (from === 0 || !/[\p{L}\p{N}]/u.test(text[from - 1])) return 1;
    from = text.indexOf(word, from + 1);
  }
  return word.length >= 4 ? 0.5 : 0;
}

/** The words of a query, folded; the panel and the search split it the same way. */
function queryWords(query: string): string[] {
  return foldText(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Whether `query` is long enough to search for, rather than to keep showing the newest posts. */
export function isBlogMenuQuery(query: string): boolean {
  return queryWords(query).join('').length >= BLOG_MENU_SEARCH_MIN_CHARS;
}

/**
 * The articles that match every word of `query`, best first, and how many there are in all.
 * A word matches in the title, category, tags or teaser, accents and case folded, weighted by
 * `FIELD_WEIGHTS` and `matchStrength`. Equal scores keep the index's order, which is the panel's:
 * most recently touched first.
 */
export function searchBlogMenu(
  entries: readonly BlogMenuSearchEntry[],
  query: string,
  limit: number = BLOG_MENU_SEARCH_LIMIT
): { matches: BlogMenuSearchEntry[]; total: number } {
  if (!isBlogMenuQuery(query)) return { matches: [], total: 0 };
  const words = queryWords(query);

  const folded = foldedFields(entries);
  const scored: { entry: BlogMenuSearchEntry; score: number }[] = [];
  entries.forEach((entry, index) => {
    const fields = folded[index];
    let score = 0;
    for (const word of words) {
      let best = 0;
      for (const field of FIELDS) {
        best = Math.max(best, FIELD_WEIGHTS[field] * matchStrength(fields[field], word));
      }
      if (best === 0) {
        score = 0;
        break;
      }
      score += best;
    }
    if (score > 0) scored.push({ entry, score });
  });

  // `sort` is stable, so equal scores stay in recency order.
  scored.sort((a, b) => b.score - a.score);
  return { matches: scored.slice(0, limit).map(({ entry }) => entry), total: scored.length };
}
