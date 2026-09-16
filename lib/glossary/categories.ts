import { GLOSSARY_TERMS } from '@/lib/glossary/data';
import type { GlossaryCategory } from '@/lib/glossary/types';

/**
 * The order the glossary overview groups its terms in, and the only list of categories the site
 * renders anywhere.
 *
 * It lived in `app/[locale]/glossary/page.tsx` while the page was its one reader. The header's
 * "more" panel is the second, and a menu that offers a category the page does not draw sends its
 * reader to an anchor that is not in the document — so both read this array rather than each
 * keeping a copy.
 *
 * **It is a curated order and not the type's member list**, which is what makes it a list at all:
 * `GlossaryCategory` has 13 members, `ai` currently holds no term, and `logistics` holds three and
 * is missing here. That omission is a defect on the overview rather than a decision (the three
 * terms fall out of the page and its search alike) and is filed as PAR-264 — fixing it there adds
 * the category to the menu with no change on this side, which is the point of one list.
 *
 * **What the two readers share is this order, and they drop an empty category by asking different
 * questions.** The page groups the terms it loaded for one locale and skips a category its own map
 * has nothing under; the menu has no locale-specific set and reads `listGlossaryCategories()`
 * below, which counts `GLOSSARY_TERMS`. The two answers agree wherever a category is translated at
 * all, and where they could not — a category whose terms are missing in one language — the page is
 * the one that must decide, because it is the page that would render an empty heading.
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
];

/**
 * Categories that hold at least one term, in the order above, with the size of each.
 *
 * The count comes from `GLOSSARY_TERMS` — the untranslated source — because a category holds the
 * same terms in every language, so this needs no locale and loads no translation file. The labels
 * do, and they are resolved by whoever renders them.
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
