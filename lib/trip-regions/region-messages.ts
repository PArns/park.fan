import 'server-only';
import { getTranslations } from 'next-intl/server';
import { regionMessagesPath } from '@/i18n/client-messages';
import type { TripRegionWords } from './trip-links';

/**
 * A region's own copy on the server: `tripRegions.<slug>.<part>` (the hub's intro and FAQ, the
 * best-time pages' titles, the planner's hotel names). A Client Component reads the same copy as
 * `tripRegion.<part>`, which `<RouteMessages region>` ships; the shared words of every region are
 * `tripHub`, `tripBestTime` and `tripPlanner`.
 */
export function getRegionTranslations(region: string, part: string, locale?: string) {
  const namespace = `${regionMessagesPath(region)}.${part}`;
  return locale ? getTranslations({ locale, namespace }) : getTranslations(namespace);
}

/**
 * What a link into a region calls it (`tripRegions.<slug>.nav`): its name, its area, the name
 * with its preposition and the hub's name. The header band, the park tile, the bands and the
 * links the browser asks for (`/api/nav/trip-regions`) all read it here.
 */
export async function getTripRegionWords(
  region: string,
  locale?: string
): Promise<TripRegionWords> {
  const t = await getRegionTranslations(region, 'nav', locale);
  return { name: t('name'), area: t('area'), inRegion: t('inRegion'), calendar: t('calendar') };
}
