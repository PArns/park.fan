import { GLOSSARY_TERMS } from '@/lib/glossary/data';
import type { GlossaryCategory } from '@/lib/glossary/types';

/**
 * The order the glossary overview groups its terms in, and the one list of categories the site
 * renders: the page and the header's "more" panel both read it, so the menu never offers an
 * anchor the page lacks. A curated order, not the type's member list (`ai` holds no term), but
 * every category that holds a term must be listed or its terms fall out of the overview and its
 * search; `pnpm check:glossary-slugs` fails then.
 */
export const GLOSSARY_CATEGORY_ORDER: GlossaryCategory[] = [
  'wait-times',
  'crowd-levels',
  'park-operations',
  'planning',
  'attractions',
  'manufacturers',
  'coasters',
  'coaster-elements',
  'ride-experience',
  'dining',
  'shopping',
  'logistics',
];

/**
 * Categories that hold at least one term, in the order above, with the size of each. Counted from
 * the untranslated `GLOSSARY_TERMS`, since a category holds the same terms in every language.
 */
export function listGlossaryCategories(): { category: GlossaryCategory; termCount: number }[] {
  const counts = new Map<GlossaryCategory, number>();
  for (const term of GLOSSARY_TERMS) {
    counts.set(term.category, (counts.get(term.category) ?? 0) + 1);
  }

  return GLOSSARY_CATEGORY_ORDER.flatMap((category) => {
    const termCount = counts.get(category) ?? 0;
    return termCount === 0 ? [] : [{ category, termCount }];
  });
}
