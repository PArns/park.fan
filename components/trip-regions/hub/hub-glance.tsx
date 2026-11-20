import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import {
  formatHubDate,
  glanceLines,
  headlinerGroups,
  shortGroupName,
  shortParkName,
  type ResortMonthSummary,
} from '@/lib/trip-regions/hub-data';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { ownWords } from '@/lib/trip-regions/region-words';
import type { TripCalendarDay, TripRegion } from '@/lib/trip-regions/types';
import { HubDayTip } from './hub-day-tip';
import { GLANCE_ROW } from './hub-glance-styles';

/** The glass the answer stands on, over the hero photo, in both themes. */
const GLANCE_BOX =
  'bg-background/70 border-border/60 max-w-2xl rounded-xl border p-3 backdrop-blur-md sm:p-4';

/**
 * The hub's first answer, under its two buttons: the rows about one day (`HubDayTip`: the day's
 * tip, the parks to tick off, each resort's best park), by its date in the region's time and never
 * as "today", because a cached copy outlives midnight there; then the quietest days of the window,
 * a date said once where the resorts share it. The level is said in words beside the tip, which
 * was picked on it, and nowhere else: a badge "high" beside each resort's best park read as a
 * contradiction. The day and the region are the calendar's own objects, so the page's payload
 * carries them once.
 */
export async function HubGlance({
  day,
  region,
  summaries,
  windowTo,
  todayIso,
  locale,
}: {
  /** The day the answer is about, as the calendar's client part gets it (`sliceCalendar`). */
  day: TripCalendarDay | null;
  /** The region as the calendar's client part gets it (`slimRegion`), the same object. */
  region: TripRegion;
  summaries: ResortMonthSummary[];
  /** The window's last day, for "quietest to …". */
  windowTo: string;
  /** The region's today, which decides how long a tick of a visited park counts. */
  todayIso: string;
  locale: string;
}) {
  const t = await getTranslations('tripHub.glance');
  const tRegion = await getRegionTranslations(region.slug, 'hub.glance');
  const lines = day ? glanceLines(day, region) : [];
  const zone = ownWords(tRegion, 'zone');
  const named = new Set(headlinerGroups(region).map((g) => g.key));
  const quiet = summaries
    .filter((s) => named.has(s.group.key))
    .map((s) => s.quiet.find((q) => q.basis !== 'last_year'))
    .filter((q): q is NonNullable<typeof q> => !!q);
  const dates = [...new Set(quiet.map((q) => q.date))].sort();

  if (!day || lines.length === 0) {
    return (
      <p className={cn(GLANCE_BOX, 'text-muted-foreground text-sm')}>
        {day ? t('none', { date: formatHubDate(day.date, locale, 'long') }) : t('noneAtAll')}
      </p>
    );
  }
  const minutes = (value: number) => (
    <span className="tabular-nums">{t('minutes', { minutes: value })}</span>
  );
  return (
    <dl
      className={cn(GLANCE_BOX, 'space-y-2 text-base')}
      data-trip-glance=""
      {...linkBlockAttributes('trip_answer')}
    >
      <HubDayTip day={day} region={region} todayIso={todayIso} zone={zone} locale={locale} />
      {dates.length > 0 && (
        <div className={GLANCE_ROW}>
          <dt className="text-muted-foreground pt-0.5 text-sm">
            {t('quietestTo', { date: formatHubDate(windowTo, locale, 'dayMonth') })}
          </dt>
          <dd className="flex flex-wrap gap-x-3 gap-y-0.5">
            {dates.map((date) => (
              <span key={date}>
                <time dateTime={date}>{formatHubDate(date, locale)}</time>
                {quiet
                  .filter((q) => q.date === date)
                  .map((q, i) => (
                    <span key={q.park.slug}>
                      {i > 0 ? ' ·' : ''}{' '}
                      <span className="font-semibold">{shortParkName(q.park.name)}</span>
                      {q.wait !== null && <> {minutes(q.wait)}</>}
                    </span>
                  ))}
              </span>
            ))}
          </dd>
        </div>
      )}
    </dl>
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
