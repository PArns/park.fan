'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { formatClockTime } from '@/lib/utils/intl-format';
import { parkBreakUntil } from '@/lib/utils/park-break';
import { parkDayOf } from '@/lib/utils/park-day';
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
 * on the minute clock) in place of „Geschlossen", and how far off it is („morgen, 10:00 Uhr",
 * „Samstag, 10:00 Uhr") for a row wide enough to show it. A day-away countdown carries the clock
 * time, since „morgen" alone doesn't say when to set off. A park with no opening ahead keeps „Geschlossen".
 * A park opening later today also gets the clock time (`opensTodayAt`), and one whose next opening
 * is a week or more away its break (`parkBreak`), for the card rail.
 * The hero's own hook, not the browse hook's: `parks` ships with the homepage, and the palette,
 * which every page carries, would pull the whole namespace into the chrome.
 */
export function useHeroStatusLabels(): (items: NearbySearchItem[]) => NearbySearchItem[] {
  const tParks = useTranslations('parks');
  const openingLabel = useParkOpeningLabel();
  const nowMs = useMinuteNow();
  const locale = useLocale();
  // The nearby answer carries no coordinates, and its parks lie around the visitor, so the
  // visitor's latitude decides a winter break for them; without a position every break is the
  // season's („Saisonpause"), which a winter break also is.
  const latitude = useGeolocation().position?.lat ?? null;
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
      if (!opening) return item;
      const countdown = formatParkOpeningCountdown(
        opening,
        nowMs,
        countdownStrings,
        item.timezone,
        locale
      );
      const time = formatClockTime(opening.at, locale, item.timezone);
      const parkBreak = opening.today
        ? null
        : parkBreakUntil(
            parkDayOf(nowMs, item.timezone),
            parkDayOf(new Date(opening.at), item.timezone),
            latitude
          );
      return {
        ...item,
        statusLabel: openingLabel(opening, item.timezone),
        statusCountdown: opening.today
          ? countdown
          : tParks('opensCountdownAt', { when: countdown, time }),
        opensTodayAt: opening.today ? time : undefined,
        parkBreak: parkBreak ?? undefined,
      };
    });
}
