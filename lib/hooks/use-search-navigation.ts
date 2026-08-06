'use client';

import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { trackSearchResultClicked } from '@/lib/analytics/umami';
import type { SearchResultItem } from '@/lib/api/types';
import type { GlossarySearchItem } from '@/lib/hooks/use-search-results';
import type { Locale } from '@/i18n/config';

/**
 * Shared "a search result was picked" behavior: analytics + URL resolution + navigation.
 * Used by both the search palette (SearchDialog) and the hero's in-place result list, so a
 * result always routes the same way no matter which surface it was clicked in.
 */
export function useSearchNavigation(queryLength: number, onNavigate?: () => void) {
  const router = useRouter();
  const locale = useLocale();

  const handleSelect = (result: SearchResultItem, position?: number) => {
    // A result with no `url` and no continent/country resolves to no route at all. Bailing
    // BEFORE `onNavigate` matters for the hero's dropdown, which closes on that callback: it
    // would otherwise shut on a click that goes nowhere, and since focus stays in the input
    // (the dropdown swallows mousedown) nothing would reopen it.
    const canResolve =
      Boolean(result.url) ||
      (result.type === 'park' && Boolean(result.continent) && Boolean(result.country)) ||
      result.type === 'glossary' ||
      Boolean(result.parentPark?.url);
    if (!canResolve) return;

    onNavigate?.();

    // Track the result click (NOT the search query content)
    trackSearchResultClicked({
      resultType: result.type,
      position,
      queryLength,
    });

    if (result.url) {
      // Use centralized utility for URL conversion
      const cleanUrl = convertApiUrlToFrontendUrl(result.url);
      router.push(cleanUrl as '/parks/europe');
    } else if (result.type === 'park' && result.continent && result.country) {
      // Build URL from available data
      const citySlug = result.city?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
      router.push(
        `/parks/${result.continent.toLowerCase()}/${result.country.toLowerCase()}/${citySlug}/${result.slug}` as '/parks/europe/germany/rust/europa-park'
      );
    } else if (result.type === 'glossary') {
      // Navigate to glossary term page — next-intl router adds locale prefix automatically
      const seg = GLOSSARY_SEGMENTS[locale as Locale] ?? 'glossary';
      router.push(`/${seg}/${result.slug}` as '/parks/europe');
    } else if (result.parentPark && result.parentPark.url) {
      // Fallback for attractions/shows/restaurants without explicit URL
      const parkUrl = convertApiUrlToFrontendUrl(result.parentPark.url);

      if (result.type === 'restaurant') {
        router.push(`${parkUrl}#restaurants` as '/parks/europe');
      } else if (result.type === 'show') {
        router.push(`${parkUrl}#shows` as '/parks/europe');
      } else {
        router.push(`${parkUrl}/${result.slug}` as '/parks/europe');
      }
    }
  };

  const handleGlossarySelect = (item: GlossarySearchItem) => {
    onNavigate?.();
    trackSearchResultClicked({
      resultType: 'glossary',
      term_id: item.id,
      queryLength,
    });
    const seg = GLOSSARY_SEGMENTS[locale as Locale] ?? 'glossary';
    router.push(`/${seg}/${item.slug}` as '/parks/europe');
  };

  return { handleSelect, handleGlossarySelect };
}
