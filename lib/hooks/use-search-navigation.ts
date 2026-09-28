'use client';

import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { searchResultHref } from '@/lib/utils/url-utils';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { trackSearchResultClicked } from '@/lib/analytics/umami';
import type { SearchResultItem } from '@/lib/api/types';
import type { GlossarySearchItem } from '@/lib/hooks/use-search-results';
import type { Locale } from '@/i18n/config';

/**
 * Shared "a search result was picked" behavior: analytics + URL resolution + navigation.
 * Used by both the search palette (SearchDialog) and the hero's in-place result list, so a
 * result always routes the same way no matter which surface it was clicked in. `/search` links
 * through the same `searchResultHref`.
 */
export function useSearchNavigation(queryLength: number, onNavigate?: () => void) {
  const router = useRouter();
  const locale = useLocale() as Locale;

  const handleSelect = (result: SearchResultItem, position?: number) => {
    // A result that resolves to no route at all is refused BEFORE `onNavigate`. That matters for
    // the hero's dropdown, which closes on that callback: it would otherwise shut on a click that
    // goes nowhere, and since focus stays in the input (the dropdown swallows mousedown) nothing
    // would reopen it.
    const href = searchResultHref(result, locale);
    if (!href) return;

    onNavigate?.();

    // Track the result click (NOT the search query content)
    trackSearchResultClicked({
      resultType: result.type,
      position,
      queryLength,
    });

    // A show or restaurant of the park the visitor is already on is only a new fragment, and
    // `router.push` writes that with `pushState`, which fires no `hashchange` — the one event the
    // park page's tab router listens for (`useTabHashRouting`). The palette closed and nothing else
    // happened. Setting the fragment on `location` is what a plain `<a href="#shows">` does, and it
    // fires the event. The same fragment again fires nothing either, so that case dispatches it.
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

  const handleGlossarySelect = (item: GlossarySearchItem) => {
    onNavigate?.();
    trackSearchResultClicked({
      resultType: 'glossary',
      term_id: item.id,
      queryLength,
    });
    const seg = GLOSSARY_SEGMENTS[locale] ?? 'glossary';
    router.push(`/${seg}/${item.slug}` as '/parks/europe');
  };

  return { handleSelect, handleGlossarySelect };
}
