import type { AttractionKind, AttractionKindSource } from '@/lib/api/types';

/**
 * The kind the site acts on for an attraction: the API's, except a `TRANSPORT` that only the API's
 * rule derived, which reads as unknown. For a minor ride the rule may have read „Express" or
 * „Train" in the name alone, and a railway is a queue the site tells a visitor to discount. A
 * derived `SHOW` or `GAME` and every editor's kind stand. An absent source is an older payload,
 * whose kind is an editor's.
 */
export function statedAttractionKind(
  kind: AttractionKind | null | undefined,
  source: AttractionKindSource | null | undefined
): AttractionKind | null {
  if (!kind) return null;
  return kind === 'TRANSPORT' && source === 'derived' ? null : kind;
}
