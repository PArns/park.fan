import type { Locale } from '@/i18n/config';

export type GlossaryCategory =
  | 'wait-times'
  | 'crowd-levels'
  | 'park-operations'
  | 'planning'
  | 'attractions'
  | 'manufacturers'
  | 'coasters'
  | 'coaster-elements'
  | 'ride-experience'
  | 'shopping'
  | 'dining'
  | 'logistics'
  | 'ai';

export interface GlossaryTermData {
  id: string;
  category: GlossaryCategory;
  slugs: Record<Locale, string>;
  /**
   * When set, the term renders an interactive 3-D coaster player. `element`
   * keys into the coaster-element registry (lib/three/coaster/elements.ts).
   * Locale-independent: the geometry is the same in every language.
   */
  player?: { element: string };
}

export interface GlossaryTermTranslation {
  id: string;
  name: string;
  shortDefinition: string;
  definition: string;
  relatedTermIds?: string[];
  /** Additional strings (plural forms, alternate names) that should also link to this term. */
  aliases?: string[];
  /** Genuinely different names for this term — displayed as "Also known as". Excludes inflections/plurals. */
  alternateNames?: string[];
}

export interface GlossaryTerm extends GlossaryTermData {
  name: string;
  shortDefinition: string;
  definition: string;
  slug: string;
  relatedTermIds?: string[];
  /** Additional strings (plural forms, alternate names) that also match this term. */
  aliases?: string[];
  /** Genuinely different names for this term — displayed as "Also known as". Excludes inflections/plurals. */
  alternateNames?: string[];
}

export interface GlossaryTermWithEnName extends GlossaryTerm {
  /** English name for cross-language search (always English regardless of locale). */
  enName: string;
}

/**
 * What the overview's CLIENT tree reads, and nothing else.
 *
 * `/{locale}/glossar` handed `GlossaryOverviewClient` a full `GlossaryTermWithEnName` per term —
 * 274 of them, each carrying `definition`, `relatedTermIds`, `aliases`, `alternateNames` and a
 * `slugs` record with all six locales in it. The client reads six fields: `id` and `name` and
 * `enName` for the filter, `shortDefinition`, `slug` and `player` for the card. Measured on the
 * serialized payload: 325,979 B raw / 84,799 B brotli against 70,186 / 17,450 for what is
 * actually used, so about 256 KB of every visit was JSON nobody would ever read.
 *
 * `category` is deliberately NOT in here: the page groups by it server-side, off the source term,
 * and the client only ever sees the group's own `category`/`categoryLabel`.
 *
 * Keep the projection in ONE place — the copy in `app/[locale]/glossary/page.tsx` that already
 * had to happen for `enName` — so there is a single spot where a field can slip back in.
 */
export type GlossaryTermListItem = Pick<
  GlossaryTerm,
  'id' | 'name' | 'shortDefinition' | 'slug' | 'player'
> & {
  /** English name for cross-language search (always English regardless of locale). */
  enName: string;
};
