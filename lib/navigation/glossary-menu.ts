import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { listGlossaryCategories } from '@/lib/glossary/categories';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';

/**
 * What the glossary section of the header's "more" panel shows.
 *
 * The dictionary holds 274 terms and had one link in the whole app — the bare `/glossary` entry —
 * so nothing above a term page said what was in there. The section lists the categories, and stops
 * there: the same rule the parks panel follows with its 144 cities and the blog panel with its 31
 * tags. 274 term links in the chrome of ~35,000 pages would spread the site's own weight over the
 * pages worth the least of it.
 *
 * **Eleven rows, not twelve**, and the difference is not this file's: twelve categories hold terms,
 * and `GLOSSARY_CATEGORY_ORDER` leaves `logistics` out, so the overview does not draw it either
 * (PAR-264). What this returns is what that page renders, which is the whole point — `termCount`
 * below therefore counts 271 of the 274, and the heading it feeds says so.
 *
 * **Resolved on the server because the panel is a Client Component.** A `useTranslations('glossary')`
 * there would put the whole namespace — 2,402 B, ×6 locales — into the chrome every page
 * serializes, for labels that are 358 B of it. Same reason `blog-menu.ts` and
 * `featured-parks-menu.ts` exist, and the header's own comment on `@/lib/media` says it for a
 * third case.
 *
 * **The order is the page's**, alphabetical by translated label, because the overview sorts its
 * groups that way and a menu that lists them in a different order is a second thing to learn.
 */
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
