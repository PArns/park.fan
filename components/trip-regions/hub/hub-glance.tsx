import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { formatClockTime } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import { linkBlockAttributes, linkEntityAttributes } from '@/lib/analytics/internal-link';
import {
  closesEarly,
  dayGuestClose,
  formatHubDate,
  glanceLines,
  headlinerGroups,
  parkCalendarHref,
  shortGroupName,
  shortParkName,
  type ResortMonthSummary,
} from '@/lib/trip-regions/hub-data';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { ownWords } from '@/lib/trip-regions/region-words';
import { requireTripRegion } from '@/lib/trip-regions/registry';
import type { TripCalendarDay, TripRegion } from '@/lib/trip-regions/types';

/** The glass the answer stands on, over the hero photo, in both themes. */
const GLANCE_BOX =
  'bg-background/70 border-border/60 max-w-2xl rounded-xl border p-3 backdrop-blur-md sm:p-4';

/** One row of the answer: its label over the parks on a phone, beside them from `sm`. */
const ROW = 'grid gap-x-4 gap-y-0.5 sm:grid-cols-[minmax(0,11rem)_1fr]';

/**
 * The hub's first answer, under its two buttons: the best park of each group with a headliner on
 * one day, by its date in the region's time and never as "today", because a cached copy outlives
 * midnight there; then the quietest days of the window, a date said once where the resorts share
 * it. Minutes only, no crowd badge: the badge compares a park with its own normal day, and beside
 * "best park" it read as a contradiction.
 */
export async function HubGlance({
  day,
  region,
  summaries,
  windowTo,
  locale,
}: {
  day: TripCalendarDay | null;
  region: TripRegion;
  summaries: ResortMonthSummary[];
  /** The window's last day, for "quietest to …". */
  windowTo: string;
  locale: string;
}) {
  const t = await getTranslations('tripHub.glance');
  const tRegion = await getRegionTranslations(region.slug, 'hub.glance');
  const { timezone } = requireTripRegion(region.slug);
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
      <div className={ROW}>
        <dt className="text-muted-foreground pt-0.5 text-sm">
          {t.rich('best', {
            date: formatHubDate(day.date, locale),
            time: (chunks) => <time dateTime={day.date}>{chunks}</time>,
          })}
          {zone ? `, ${zone}` : ''}
        </dt>
        <dd className="flex flex-wrap gap-x-3 gap-y-0.5">
          {lines.map(({ group, park, day: parkDay, earlyElsewhere }) => (
            <span key={group.key}>
              <Link
                href={parkCalendarHref(park, locale)}
                prefetch={false}
                className="text-foreground font-semibold underline-offset-4 hover:underline"
                aria-label={`${shortGroupName(group.name)}: ${shortParkName(park.name)}`}
                {...linkEntityAttributes(park.id)}
              >
                {shortParkName(park.name)}
              </Link>{' '}
              {minutes(parkDay.headlinerWait)}
              {closesEarly(parkDay) && dayGuestClose(parkDay) && (
                <span className="text-muted-foreground text-sm">
                  {' '}
                  {t('closesEarly', {
                    time: formatClockTime(dayGuestClose(parkDay)!, locale, timezone),
                  })}
                </span>
              )}
              {earlyElsewhere && dayGuestClose(earlyElsewhere.day) && (
                <span className="text-muted-foreground text-sm">
                  {' '}
                  {t('earlyElsewhere', {
                    park: shortParkName(earlyElsewhere.park.name),
                    time: formatClockTime(dayGuestClose(earlyElsewhere.day)!, locale, timezone),
                  })}
                </span>
              )}
            </span>
          ))}
        </dd>
      </div>
      {dates.length > 0 && (
        <div className={ROW}>
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
