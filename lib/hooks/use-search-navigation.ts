'use client';

import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { searchResultHref } from '@/lib/utils/url-utils';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import type { SearchSession } from '@/lib/analytics/search-session';
import type { SearchBrowseItem } from '@/lib/analytics/site-analytics';
import type { SearchResultItem } from '@/lib/api/types';
import type { GlossarySearchItem } from '@/lib/hooks/use-search-results';
import type { NearbySearchItem } from '@/lib/hooks/use-hero-browse-parks';
import type { Locale } from '@/i18n/config';

/**
 * Shared "a search result was picked" behavior: the session's event, URL resolution and
 * navigation. Used by both the search palette (SearchDialog) and the hero's in-place result list,
 * so a result always routes the same way no matter which surface it was clicked in. `/search`
 * links through the same `searchResultHref`. Every `index` is the row's 0-based place in its group.
 */
export function useSearchNavigation(session: SearchSession, onNavigate?: () => void) {
  const router = useRouter();
  const locale = useLocale() as Locale;

  /**
   * Opens a park, ride, show, restaurant or place. `count` sends its event, and runs only once the
   * row is known to lead somewhere.
   */
  const open = (result: SearchResultItem, count: () => void) => {
    // A result that resolves to no route at all is refused BEFORE `onNavigate`. That matters for
    // the hero's dropdown, which closes on that callback: it would otherwise shut on a click that
    // goes nowhere, and since focus stays in the input (the dropdown swallows mousedown) nothing
    // would reopen it.
    const href = searchResultHref(result, locale);
    if (!href) return;

    // Counted before `onNavigate`: closing the palette ends its opening, and a click counted
    // after it would open a new one under the trigger's default surface.
    count();
    onNavigate?.();

    // A show or restaurant of the park already open is only a new fragment, and `router.push`
    // writes it with `pushState`, which fires no `hashchange` for the tab router
    // (`useTabHashRouting`). Setting `location.hash` fires it; the same fragment again needs the
    // event dispatched.
    const [path, hash] = href.split('#');
    if (hash && window.location.pathname === `/${locale}${path}`) {
      if (window.location.hash === `#${hash}`) {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } else {
        window.location.hash = hash;
      }
      return;
    }

    router.push(href as '/parks/europe');
  };

  const handleSelect = (result: SearchResultItem, index = 0) =>
    open(result, () => session.resultClicked(result.type, index, result.id));

  /** A row of the list shown before anything is typed (nearby, in-park or popular). */
  const handleBrowseSelect = (item: NearbySearchItem, index: number) =>
    open(item, () => session.browseClicked(item.browseItem, index, item.id));

  const handleGlossarySelect = (item: GlossarySearchItem, index = 0) => {
    session.resultClicked('glossary', index);
    onNavigate?.();
    const seg = GLOSSARY_SEGMENTS[locale] ?? 'glossary';
    router.push(`/${seg}/${item.slug}` as '/parks/europe');
  };

  const handlePostSelect = (post: { path: string; news?: boolean }, index: number) => {
    session.resultClicked(post.news ? 'news' : 'guide', index);
    onNavigate?.();
    router.push(post.path as '/parks/europe');
  };

  /** One of the posts the hero lists before anything is typed. */
  const handleBrowsePostSelect = (
    post: { path: string },
    item: Extract<SearchBrowseItem, 'news' | 'guide'>,
    index: number
  ) => {
    session.browseClicked(item, index);
    onNavigate?.();
    router.push(post.path as '/parks/europe');
  };

  return {
    handleSelect,
    handleBrowseSelect,
    handleGlossarySelect,
    handlePostSelect,
    handleBrowsePostSelect,
  };
}
