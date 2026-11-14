import 'server-only';
import { getTranslations } from 'next-intl/server';
import { regionMessagesPath } from '@/i18n/client-messages';

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
