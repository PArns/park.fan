'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import {
  formatParkOpening,
  formatParkOpeningCountdown,
  nextParkOpening,
  type ParkOpening,
  type ParkOpeningCountdownStrings,
} from '@/lib/utils/schedule-utils';
import type { NearbySearchItem } from '@/lib/hooks/use-hero-browse-parks';

/**
 * „Öffnet um 09:00 Uhr" or „Öffnet am 15. März" for a park's next opening, in the park's zone
 * (`formatParkOpening`): the hero's park block and its lists word it alike.
 */
export function useParkOpeningLabel(): (opening: ParkOpening, timeZone: string) => string {
  const tParks = useTranslations('parks');
  const locale = useLocale();
  const strings = {
    opensOn: tParks('opensOn'),
    opensAt: (time: string) => tParks('opensAt', { time }),
  };
  return (opening, timeZone) => formatParkOpening(opening, strings, timeZone, locale);
}

/**
 * The hero's rows with the status pill of a shut park reading its next opening (`nextParkOpening`
 * on the minute clock) in place of „Geschlossen", and how far off it is („in 2 Tagen") for a row
 * wide enough to show it. A park with no opening ahead keeps „Geschlossen".
 * The hero's own hook, not the browse hook's: `parks` ships with the homepage, and the palette,
 * which every page carries, would pull the whole namespace into the chrome.
 */
export function useHeroStatusLabels(): (items: NearbySearchItem[]) => NearbySearchItem[] {
  const tParks = useTranslations('parks');
  const openingLabel = useParkOpeningLabel();
  const nowMs = useMinuteNow();
  const countdownStrings: ParkOpeningCountdownStrings = {
    inDays: (count) => tParks('opensInDays', { count }),
    inHours: (time) => tParks('opensInHours', { time }),
    inMinutes: (count) => tParks('opensInMinutes', { count }),
  };
  return (items) =>
    items.map((item) => {
      if (!item.schedules || !item.timezone || nowMs === null) return item;
      const opening = nextParkOpening(
        item.schedules.today,
        item.schedules.next,
        item.timezone,
        nowMs
      );
      return opening
        ? {
            ...item,
            statusLabel: openingLabel(opening, item.timezone),
            statusCountdown: formatParkOpeningCountdown(
              opening,
              nowMs,
              countdownStrings,
              item.timezone
            ),
          }
        : item;
    });
}
