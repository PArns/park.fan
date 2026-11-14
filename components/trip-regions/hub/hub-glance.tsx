import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { parkCalendarPath } from '@/lib/parks/calendar-segments';
import { formatClockTime } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import {
  closesEarly,
  dayGuestClose,
  formatHubDate,
  glanceLines,
  parkGeo,
  shortGroupName,
  shortParkName,
  tintLevel,
  type ResortMonthSummary,
} from '@/lib/trip-regions/hub-data';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { requireTripRegion } from '@/lib/trip-regions/registry';
import type { TripCalendarDay, TripRegion, TripRegionPark } from '@/lib/trip-regions/types';

/** The glass the answer stands on, over the hero photo, in both themes. */
const GLANCE_BOX =
  'bg-background/70 border-border/60 max-w-2xl rounded-xl border p-3 backdrop-blur-md sm:p-4';

/** A park's crowd calendar, the link a pick carries: the next question is "and on other days?". */
function calendarHref(park: TripRegionPark, locale: string): string {
  const geo = parkGeo(park);
  return geo
    ? parkCalendarPath(locale, geo.continent, geo.country, geo.city, park.slug)
    : park.path;
}

/**
 * The hub's first answer: on one day, in the region's time, each resort's shortest line with its
 * minutes and its level, and the early close where a ticketed evening follows. The day is named,
 * never "today", because a cached copy outlives midnight in the region. A resort with one park that has a
 * figure has nothing to choose between and is left out ({@link glanceLines}).
 */
export async function HubGlance({
  day,
  region,
  locale,
}: {
  day: TripCalendarDay | null;
  region: TripRegion;
  locale: string;
}) {
  const t = await getTranslations('tripHub.glance');
  const tRegion = await getRegionTranslations(region.slug, 'hub.glance');
  const { timezone } = requireTripRegion(region.slug);
  const lines = day ? glanceLines(day, region) : [];
  if (!day || lines.length === 0) {
    return (
      <p className={cn(GLANCE_BOX, 'text-muted-foreground text-sm')}>
        {day ? t('none', { date: formatHubDate(day.date, locale, 'long') }) : t('noneAtAll')}
      </p>
    );
  }
  return (
    <div className={GLANCE_BOX} data-trip-glance="">
      <p className="text-muted-foreground text-sm">
        {tRegion.rich('title', {
          date: formatHubDate(day.date, locale, 'long'),
          time: (chunks) => <time dateTime={day.date}>{chunks}</time>,
        })}
      </p>
      <ul className="mt-2 space-y-1.5">
        {lines.map(({ group, park, day: parkDay, earlyElsewhere }) => (
          <li key={group.key} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
            <span className="text-muted-foreground">{shortGroupName(group.name)}:</span>
            <Link
              href={calendarHref(park, locale)}
              prefetch={false}
              className="text-foreground font-semibold underline-offset-4 hover:underline"
            >
              {shortParkName(park.name)}
            </Link>
            <span className="tabular-nums">{t('minutes', { minutes: parkDay.headlinerWait })}</span>
            <CrowdLevelBadge level={tintLevel(parkDay.crowdLevel)} />
            {closesEarly(parkDay) && dayGuestClose(parkDay) && (
              <span className="text-muted-foreground text-sm">
                {t('closesEarly', {
                  time: formatClockTime(dayGuestClose(parkDay)!, locale, timezone),
                })}
              </span>
            )}
            {earlyElsewhere && dayGuestClose(earlyElsewhere.day) && (
              <span className="text-muted-foreground text-sm">
                {t('earlyElsewhere', {
                  park: shortParkName(earlyElsewhere.park.name),
                  time: formatClockTime(dayGuestClose(earlyElsewhere.day)!, locale, timezone),
                })}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A month page's first answer: each resort's quietest dates that month, and the park with the
 * shortest lines on the first of them. On a month past the forecast the dates are last year's, said so in the
 * title and never offered as picks.
 */
export async function MonthGlance({
  summaries,
  monthLabel,
  lastYear,
  locale,
}: {
  summaries: ResortMonthSummary[];
  monthLabel: string;
  lastYear: boolean;
  locale: string;
}) {
  const t = await getTranslations('tripHub.glance');
  // The resorts with headliner parks: SeaWorld's one park with a figure has nothing to choose between.
  const rows = summaries.filter(
    (s) => s.quiet.length > 0 && s.group.parks.some((p) => p.headliner)
  );
  if (rows.length === 0) {
    return (
      <p className={cn(GLANCE_BOX, 'text-muted-foreground text-sm')}>
        {t('noneMonth', { month: monthLabel })}
      </p>
    );
  }
  return (
    <div className={GLANCE_BOX} data-trip-glance="">
      <p className="text-muted-foreground text-sm">
        {lastYear
          ? t('monthTitleLastYear', { month: monthLabel })
          : t('monthTitle', { month: monthLabel })}
      </p>
      <ul className="mt-2 space-y-1.5">
        {rows.map(({ group, quiet }) => {
          // One park for every date: say it once; several parks (last year's records): each date
          // names its own.
          const onePark = quiet.every((q) => q.park.slug === quiet[0].park.slug);
          return (
            <li key={group.key} className="text-base">
              <span className="text-muted-foreground">{shortGroupName(group.name)}: </span>
              {quiet.map((q, i) => (
                <span key={`${q.date}-${q.park.slug}`}>
                  {i > 0 && ' · '}
                  <time dateTime={q.date} className="font-semibold">
                    {formatHubDate(q.date, locale)}
                  </time>
                  {!onePark && (
                    <span className="text-muted-foreground text-sm">
                      {' '}
                      {t('quietPark', { park: shortParkName(q.park.name), minutes: q.wait ?? 0 })}
                    </span>
                  )}
                </span>
              ))}
              {onePark && (
                <span className="text-muted-foreground text-sm">
                  {' '}
                  {t('quietPark', {
                    park: shortParkName(quiet[0].park.name),
                    minutes: quiet[0].wait ?? 0,
                  })}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
