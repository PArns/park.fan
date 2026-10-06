import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { listGlossaryCategories } from '@/lib/glossary/categories';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';

/**
 * What the glossary section of the header's "more" panel shows: one row per category that holds a
 * term, and no term links, for the same link-graph reason as the parks and blog panels. Resolved
 * on the server because the panel is a Client Component, and a `useTranslations('glossary')` there
 * would put the whole namespace into every page's chrome. Ordered like the overview, alphabetical
 * by translated label.
 */

/** One category row in the glossary section of the "more" panel. */
export interface GlossaryMenuCategory {
  /** The category id, which is also its anchor on the overview. */
  id: string;
  label: string;
  /** Locale-prefixed by the i18n `Link`, so this is `/glossar#coasters` and not `/de/…`. */
  href: string;
  termCount: number;
}

export interface GlossaryMenu {
  categories: GlossaryMenuCategory[];
  /** Every term in a listed category — the number beside the section's own heading. */
  termCount: number;
}

/**
 * Builds the glossary section of the header's "more" panel: each category with its translated
 * label, `#category` link and term count, sorted by label.
 */
export async function getGlossaryMenu(locale: Locale): Promise<GlossaryMenu> {
  const t = await getTranslations({ locale, namespace: 'glossary' });
  const segment = GLOSSARY_SEGMENTS[locale] ?? 'glossary';

  const categories = listGlossaryCategories()
    .map(({ category, termCount }) => ({
      id: category,
      label: t(`category.${category}`),
      // A fragment, not a filtered view: the overview's category filter is client state with no
      // URL of its own, so the anchor is what the page can actually be linked into. It costs the
      // link graph nothing — a crawler reads `/glossar#coasters` as `/glossar`.
      href: `/${segment}#${category}`,
      termCount,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));

  return {
    categories,
    termCount: categories.reduce((sum, category) => sum + category.termCount, 0),
  };
}
