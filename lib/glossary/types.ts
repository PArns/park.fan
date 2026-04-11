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
