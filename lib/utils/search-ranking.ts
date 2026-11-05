import { foldText } from '@/lib/utils/text-fold';

/**
 * `foldText` plus punctuation removal — "F.L.Y." becomes "fly". `foldText` folds accents the way
 * the API's matcher does, so the scoring here agrees with the order the API sorted the results into.
 */
const foldAlphanumeric = (value: string): string => foldText(value).replace(/[^a-z0-9]/g, '');

/**
 * How closely `name` matches `query`: 100 for the whole name, 50 for its start, 30 inside it, 0
 * for a hit only the API's fuzzy matcher saw ("phantsialand"). Punctuation is ignored on both
 * sides, so "fly" scores the full 100 against "F.L.Y.".
 */
export function searchMatchScore(name: string, query: string): number {
  const folded = foldText(name);
  const term = foldText(query);
  const plainName = foldAlphanumeric(name);
  const plainQuery = foldAlphanumeric(query);
  const hasPlainQuery = plainQuery.length > 0;

  if (folded === term || (hasPlainQuery && plainName === plainQuery)) return 100;
  if (folded.startsWith(term) || (hasPlainQuery && plainName.startsWith(plainQuery))) return 50;
  if (folded.includes(term) || (hasPlainQuery && plainName.includes(plainQuery))) return 30;
  return 0;
}

/**
 * Search hits in the order the site lists them: by {@link searchMatchScore}, then operating before
 * anything else. The sort is stable, so equal hits keep the order they came in.
 */
export function rankByMatch<T extends { name: string; status?: string }>(
  items: readonly T[],
  query: string
): { item: T; score: number }[] {
  return items
    .map((item) => ({ item, score: searchMatchScore(item.name, query) }))
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      const aOperating = a.item.status === 'OPERATING' ? 0 : 1;
      const bOperating = b.item.status === 'OPERATING' ? 0 : 1;
      return aOperating - bOperating;
    });
}
