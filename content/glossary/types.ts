export type GlossaryCategory =
  | 'coaster-elements'
  | 'coaster-physics'
  | 'coaster-types'
  | 'coaster-manufacturers'
  | 'wait-times'
  | 'crowd-management'
  | 'park-operations'
  | 'planning'
  | 'parkfan'; // park.fan-specific features

export interface GlossaryTerm {
  slug: string;
  term: string;
  shortDef: string;
  definition: string;
  category: GlossaryCategory;
  aliases?: string[];
  relatedTerms?: string[];
  manufacturer?: string;
  exampleParks?: string[]; // park slugs
}
