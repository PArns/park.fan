import { getTranslations } from 'next-intl/server';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CROWD_TEXT_CLASS, CROWD_TILE_CLASS } from '@/lib/utils/crowd-level-styles';
import { formatClockTime } from '@/lib/utils/intl-format';
import { parkCalendarPath } from '@/lib/parks/calendar-segments';
import {
  closesEarly,
  dayGuestClose,
  formatHubDate,
  parkGeo,
  regionGroups,
  shortGroupName,
  shortParkName,
  tintLevel,
} from '@/lib/orlando/hub-data';
import { ORLANDO_TIMEZONE } from '@/lib/orlando/types';
import type {
  TripBestDay,
  TripBestDays,
  TripCalendar,
  TripParkBestDays,
  TripRegion,
  TripRegionPark,
} from '@/lib/orlando/types';
import { HUB_CELL, HUB_CELL_LAST_YEAR } from './hub-cell-styles';

/** How many quiet days a card shows before "more". */
const QUIET_SHOWN = 3;

/** The reason codes the hub has words for; an unknown code is left out, never shown raw. */
const REASONS = new Set([
  'quietest_in_window',
  'weekday',
  'holiday_ends',
  'school_break',
  'party_night_short_hours',
  'closes_early',
  'extended_evening',
  'early_entry',
  'long_range',
  'estimate_last_year',
]);

/** A park's crowd calendar, with "Crowd Calendar" in the anchor: the query that page ranks for. */
export function parkCalendarHref(park: TripRegionPark, locale: string): string {
  const geo = parkGeo(park);
  return geo
    ? parkCalendarPath(locale, geo.continent, geo.country, geo.city, park.slug)
    : park.path;
}

/**
 * The best-days chapter's body: per park its quiet days as three chips, from `/best-days`, which ranks them
 * on the unrounded figure and weighs a short day by its hours, so the chips are a set and a short
 * day never stands without its close time. "More" opens why each day is there and the busiest days.
 * Last year's days say so and are never offered as picks. Each card ends with the park's own crowd
 * calendar.
 */
export async function HubBestDays({
  region,
  bestDays,
  calendar,
  locale,
}: {
  region: TripRegion;
  bestDays: TripBestDays | null;
  calendar: TripCalendar | null;
  locale: string;
}) {
  const t = await getTranslations('orlando.bestDays');
  const tReason = await getTranslations('orlando.reasons');
  const byPark = new Map((bestDays?.parks ?? []).map((p) => [p.slug, p]));
  const cards = regionGroups(region).flatMap((group) =>
    group.parks
      .map((park) => ({ group, park, days: byPark.get(park.slug) }))
      .filter(
        (c): c is typeof c & { days: TripParkBestDays } =>
          !!c.days && c.days.basis !== 'none' && (c.days.quiet.length > 0 || !!c.days.flat)
      )
  );
  if (cards.length === 0) {
    return <p className="text-muted-foreground">{t('none')}</p>;
  }

  const closeOf = (slug: string, date: string) => {
    const day = calendar?.days.find((d) => d.date === date)?.parks[slug];
    const close = closesEarly(day) ? dayGuestClose(day) : undefined;
    return close ? formatClockTime(close, locale, ORLANDO_TIMEZONE) : null;
  };
  const reasonLine = (day: TripBestDay, slug: string) => {
    const close = closeOf(slug, day.date);
    return day.reasons
      .filter((code) => REASONS.has(code))
      .map((code) =>
        code === 'party_night_short_hours' || code === 'closes_early'
          ? tReason('closes_early', { time: close ?? '' })
          : tReason(code)
      )
      .join(' · ');
  };

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ group, park, days }) => {
        const lastYear = days.basis === 'last_year';
        return (
          <li key={park.slug} className="flex">
            <Card className="flex w-full flex-col gap-3 p-4">
              <div>
                <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                  {shortGroupName(group.name)}
                </p>
                <h3 className="text-lg font-bold">{shortParkName(park.name)}</h3>
                <p className="text-muted-foreground text-sm">
                  {lastYear ? t('quietLastYear') : t('quiet')}
                </p>
              </div>

              {days.flat ? (
                <p className="text-sm">{t('flat', { min: days.flat.min, max: days.flat.max })}</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {days.quiet.slice(0, QUIET_SHOWN).map((day) => {
                    const level = tintLevel(day.crowdLevel);
                    const close = closeOf(park.slug, day.date);
                    return (
                      <li
                        key={day.date}
                        className={cn(
                          HUB_CELL,
                          'flex-col items-start gap-1 px-2.5 py-1.5 text-left font-normal',
                          level ? cn(CROWD_TILE_CLASS[level]) : 'bg-muted/30',
                          day.basis === 'last_year' && HUB_CELL_LAST_YEAR
                        )}
                      >
                        <time dateTime={day.date} className="text-sm font-semibold">
                          {formatHubDate(day.date, locale)}
                        </time>
                        <span
                          className={cn('text-xs tabular-nums', level && CROWD_TEXT_CLASS[level])}
                        >
                          {t('minutes', { minutes: day.headlinerWait ?? 0 })}
                          {close ? ` · ${t('closes', { time: close })}` : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <details className="group text-sm">
                <summary className="text-primary-ink flex min-h-11 cursor-pointer list-none items-center gap-1 font-medium sm:min-h-0">
                  {t('more')}
                  <ChevronDown
                    aria-hidden
                    className="size-4 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="mt-2 space-y-2">
                  {!days.flat && days.quiet.length > 0 && (
                    <ul className="space-y-1">
                      {days.quiet.map((day) => (
                        <li key={day.date}>
                          <time dateTime={day.date} className="font-medium">
                            {formatHubDate(day.date, locale)}
                          </time>
                          {': '}
                          {t('minutes', { minutes: day.headlinerWait ?? 0 })}
                          {reasonLine(day, park.slug) ? `, ${reasonLine(day, park.slug)}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                  {days.busy.length > 0 && (
                    <p className="text-muted-foreground">
                      {t('busy', {
                        days: days.busy
                          .map(
                            (day) =>
                              `${formatHubDate(day.date, locale)} (${t('minutes', {
                                minutes: day.headlinerWait ?? 0,
                              })})`
                          )
                          .join(', '),
                      })}
                    </p>
                  )}
                </div>
              </details>

              <Link
                href={parkCalendarHref(park, locale)}
                prefetch={false}
                className="text-primary-ink mt-auto inline-flex min-h-11 items-center gap-1 text-sm font-medium underline-offset-4 hover:underline sm:min-h-0"
              >
                {t('calendarLink', { park: shortParkName(park.name) })}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
