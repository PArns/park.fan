import { getTranslations } from 'next-intl/server';
import { getListFormat } from '@/lib/utils/intl-format';
import {
  eventLanes,
  formatHubDate,
  meanWait,
  shortGroupName,
  shortParkName,
  type ResortMonthSummary,
} from '@/lib/orlando/hub-data';
import type { TripCalendar, TripRegion } from '@/lib/orlando/types';

/**
 * The window in sentences, per resort: its quietest dates with the park that has the shortest
 * lines, its busiest, and the events that run in it. What makes one month's HTML differ from the
 * next, as the park calendar's month summary does; built from `/best-days` and `/calendar`. On last
 * year's days every sentence says "last year".
 */
export async function HubMonthSummary({
  summaries,
  calendar,
  region,
  locale,
}: {
  summaries: ResortMonthSummary[];
  calendar: TripCalendar | null;
  region: TripRegion;
  locale: string;
}) {
  const t = await getTranslations('orlando.summary');
  const list = getListFormat(locale, { type: 'conjunction' });
  const lanes = calendar
    ? eventLanes(
        calendar,
        region.parks.map((p) => p.slug)
      ).filter((l) => l.kind !== 'break')
    : [];
  if (summaries.length === 0 && lanes.length === 0) return null;
  return (
    <div className="max-w-3xl space-y-2 leading-relaxed">
      {summaries.map(({ group, quiet, busy }) => {
        const lastYear = [...quiet, ...busy].some((d) => d.basis === 'last_year');
        const quietText = list.format(
          quiet.map((q) =>
            t('quietDay', {
              date: formatHubDate(q.date, locale),
              park: shortParkName(q.park.name),
              minutes: q.wait ?? 0,
            })
          )
        );
        const busyText = list.format(busy.map((b) => formatHubDate(b.date, locale)));
        const busyMinutes = meanWait(busy.map((b) => b.wait)) ?? 0;
        return (
          <p key={group.key}>
            <strong>{shortGroupName(group.name)}</strong>{' '}
            {quiet.length > 0 &&
              (lastYear
                ? t('quietLastYear', { days: quietText })
                : t('quiet', { days: quietText }))}{' '}
            {busy.length > 0 &&
              (lastYear
                ? t('busyLastYear', { days: busyText, minutes: busyMinutes })
                : t('busy', { days: busyText, minutes: busyMinutes }))}
          </p>
        );
      })}
      {lanes.length > 0 && (
        <p>
          <strong>{t('eventsLabel')}</strong>{' '}
          {list.format(
            lanes.map((lane) =>
              lane.kind === 'party'
                ? t('eventNights', { name: lane.name ?? '', count: lane.dates.length })
                : lane.status === 'expected'
                  ? t('eventExpected', { name: lane.name ?? '' })
                  : (lane.name ?? '')
            )
          )}
          .
        </p>
      )}
    </div>
  );
}
