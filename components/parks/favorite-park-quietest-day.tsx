'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import { parkGeoFromUrl } from '@/lib/planner/park-url';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { parkDayOf } from '@/lib/utils/park-day';
import { quietestOpenDay } from '@/lib/utils/quietest-day';

/** Height of the line, which is also the height held for it until the forecast has answered. */
const LINE_HEIGHT_CLASS = 'h-7';

/**
 * The line under a favorite park on `/favorites`: the open day with the lowest forecast crowd
 * level in the next 14 days, as a date and a `CrowdLevelBadge`.
 *
 * The data is the park page's own best-days snapshot, so the request hits the same React Query
 * entry and, behind it, the same CDN-cached `/best-days` response. It goes through
 * `useParkBestDaysCalendar` and with it `useLoadLast` (docs/rules/park-page-loading-priority.md):
 * the favorites list and its live status load first, the forecast after.
 *
 * Until the forecast has answered, an empty box of the line's height stands in its place, and it
 * stays for a park whose snapshot is empty, unrated or failed, so the cards below never move.
 */
export function FavoriteParkQuietestDay({
  slug,
  url,
  timezone,
}: {
  slug: string;
  url: string | undefined;
  timezone: string | undefined;
}) {
  const t = useTranslations('favorites');
  const locale = useLocale();
  const geo = parkGeoFromUrl(url);
  const { data, isError } = useParkBestDaysCalendar({
    continent: geo?.continent ?? '',
    country: geo?.country ?? '',
    city: geo?.city ?? '',
    parkSlug: slug,
    enabled: geo !== null,
  });
  const now = useMinuteNow(data !== undefined);

  const pick = useMemo(() => {
    const zone = data?.meta?.timezone ?? timezone;
    if (!data || now === null || !zone) return null;
    try {
      return quietestOpenDay(data.days, parkDayOf(now, zone));
    } catch {
      // An unusable zone name: no line rather than a wrong day.
      return null;
    }
  }, [data, now, timezone]);

  if (geo === null || isError || !data || !pick) {
    return <div className={LINE_HEIGHT_CLASS} aria-hidden="true" />;
  }

  // The date is a plain calendar day, so it is formatted in UTC from its own midnight.
  const date = getDateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(Date.parse(`${pick.date}T00:00:00Z`));

  return (
    <div
      className={`flex ${LINE_HEIGHT_CLASS} items-center gap-2 px-2 text-xs`}
      title={t('quietestDayTitle')}
    >
      <span className="text-muted-foreground min-w-0 truncate">{t('quietestDay', { date })}</span>
      <CrowdLevelBadge level={pick.level} className="shrink-0" />
    </div>
  );
}
