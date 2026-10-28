'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatOpensOn } from '@/lib/utils/schedule-utils';
import type { NearbySearchItem } from '@/lib/hooks/use-hero-browse-parks';

/**
 * The hero's rows with the status pill of a shut park reading its next opening, „Öffnet am 31.
 * Oktober" (`formatOpensOn`, the hero's park block's wording), in place of „Geschlossen". A park
 * whose next opening nobody knows keeps „Geschlossen". The hero's own hook, not the browse hook's:
 * `parks` ships with the homepage, and the palette, which every page carries, would pull the whole
 * namespace into the chrome.
 */
export function useHeroStatusLabels(): (items: NearbySearchItem[]) => NearbySearchItem[] {
  const tParks = useTranslations('parks');
  const locale = useLocale();
  return (items) =>
    items.map((item) =>
      item.nextOpeningTime && item.timezone
        ? {
            ...item,
            statusLabel: formatOpensOn(
              tParks('opensOn'),
              item.nextOpeningTime,
              item.timezone,
              locale
            ),
          }
        : item
    );
}
