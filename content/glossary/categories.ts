import type { GlossaryCategory } from './types';

export interface CategoryMeta {
  slug: GlossaryCategory;
  icon: string;
  /** park slugs shown in "Popular Parks" section for this category */
  featuredParkSlugs: string[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: 'coaster-elements',
    icon: '🔄',
    featuredParkSlugs: [
      'europa-park',
      'phantasialand',
      'portaventura-world',
      'alton-towers',
      'heide-park',
      'walibi-belgium',
    ],
  },
  {
    slug: 'coaster-physics',
    icon: '⚡',
    featuredParkSlugs: [
      'phantasialand',
      'europa-park',
      'cedar-point',
      'heide-park',
      'portaventura-world',
      'alton-towers',
    ],
  },
  {
    slug: 'coaster-types',
    icon: '🎢',
    featuredParkSlugs: [
      'europa-park',
      'phantasialand',
      'efteling',
      'heide-park',
      'walibi-belgium',
      'portaventura-world',
    ],
  },
  {
    slug: 'coaster-manufacturers',
    icon: '🏭',
    featuredParkSlugs: [
      'europa-park',
      'phantasialand',
      'heide-park',
      'portaventura-world',
      'walibi-belgium',
      'efteling',
    ],
  },
  {
    slug: 'wait-times',
    icon: '⏱️',
    featuredParkSlugs: [
      'disneyland-park',
      'magic-kingdom-park',
      'universal-studios-florida',
      'europa-park',
      'phantasialand',
      'tokyo-disneyland',
    ],
  },
  {
    slug: 'crowd-management',
    icon: '👥',
    featuredParkSlugs: [
      'disneyland-park',
      'magic-kingdom-park',
      'europa-park',
      'phantasialand',
      'universal-studios-florida',
      'tokyo-disneyland',
    ],
  },
  {
    slug: 'park-operations',
    icon: '🔧',
    featuredParkSlugs: [
      'disneyland-park',
      'magic-kingdom-park',
      'europa-park',
      'universal-studios-florida',
      'phantasialand',
      'efteling',
    ],
  },
  {
    slug: 'planning',
    icon: '📅',
    featuredParkSlugs: [
      'disneyland-park',
      'magic-kingdom-park',
      'europa-park',
      'universal-studios-florida',
      'phantasialand',
      'tokyo-disneyland',
    ],
  },
  {
    slug: 'parkfan',
    icon: '⭐',
    featuredParkSlugs: [
      'europa-park',
      'phantasialand',
      'disneyland-park',
      'efteling',
      'portaventura-world',
      'heide-park',
    ],
  },
];

export function getCategoryMeta(slug: GlossaryCategory): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
