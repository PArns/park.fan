'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { formatClockTime } from '@/lib/utils/intl-format';
import { linkEntityAttributes } from '@/lib/analytics/internal-link';
import {
  closesEarly,
  dayGuestClose,
  dayPick,
  formatHubDate,
  glanceLines,
  parkCalendarHref,
  shortGroupName,
  shortParkName,
  tintLevel,
  type ShortestLine,
} from '@/lib/trip-regions/hub-data';
import { shownWait } from '@/lib/trip-regions/plan-week';
import { requireTripRegion } from '@/lib/trip-regions/registry';
import type { TripCalendarDay, TripRegion } from '@/lib/trip-regions/types';
import { GLANCE_ROW } from './hub-glance-styles';
import { toggleVisited, useVisitedParks, VisitedMark } from './hub-visited';

/**
 * The first answer's rows about one day, in the browser because they follow the parks the visitor
 * has ticked off: the day's one tip (`dayPick`) with how its day compares to a normal one there,
 * then a chip per headliner park to tick off where the visitor has been, then the best park of
 * each resort (`glanceLines`). A tick moves the tip and the resorts' parks on to one not seen yet,
 * the new tip fading in where the old one stood; with every headliner ticked off the tip names the
 * best one for a second visit. The server renders the rows with nothing ticked, so the served
 * page is the same for everybody and a crawler reads the plain answer.
 */
export function HubDayTip({
  day,
  region,
  todayIso,
  zone,
  locale,
}: {
  day: TripCalendarDay;
  region: TripRegion;
  todayIso: string;
  /** "Orlando time", the region's own words after the date; `null` where it has none. */
  zone: string | null;
  locale: string;
}) {
  const t = useTranslations('tripHub.glance');
  const tVisited = useTranslations('tripHub.visited');
  const visited = useVisitedParks(region.slug, todayIso);
  const [popped, setPopped] = useState<string | null>(null);
  const headliners = region.parks.filter((p) => p.headliner);
  const done = headliners.filter((p) => visited.has(p.slug)).length;
  const allDone = headliners.length > 0 && done === headliners.length;
  // With every headliner ticked off, the tip is the best one to see again.
  const pick = dayPick(day, region, allDone ? undefined : visited);
  const lines = glanceLines(day, region, visited);
  const { timezone } = requireTripRegion(region.slug);
  const pickLevel = pick ? tintLevel(pick.day.crowdLevel) : null;

  const minutes = (value: number) => (
    <span className="tabular-nums">{t('minutes', { minutes: value })}</span>
  );
  const dated = (key: 'best' | 'pick') => (
    <>
      {t.rich(key, {
        date: formatHubDate(day.date, locale),
        time: (chunks) => <time dateTime={day.date}>{chunks}</time>,
      })}
      {zone ? `, ${zone}` : ''}
    </>
  );
  const parkLink = (line: ShortestLine, label?: string) => (
    <Link
      href={parkCalendarHref(line.park, locale)}
      prefetch={false}
      className="text-foreground font-semibold underline-offset-4 hover:underline"
      aria-label={label}
      {...linkEntityAttributes(line.park.id)}
    >
      {shortParkName(line.park.name)}
    </Link>
  );
  /** The early close after a park's minutes; after the tip's level phrase, with a comma. */
  const early = (line: ShortestLine, after = ' ') => {
    const close = dayGuestClose(line.day);
    return closesEarly(line.day) && close ? (
      <span className="text-muted-foreground text-sm">
        {after}
        {t('closesEarly', { time: formatClockTime(close, locale, timezone) })}
      </span>
    ) : null;
  };

  return (
    <>
      {pick && (
        <div className={GLANCE_ROW} data-trip-day-pick="">
          <dt className="text-muted-foreground pt-0.5 text-sm">{dated('pick')}</dt>
          {/* Keyed by the park, so a tick fades the next tip in rather than swapping words. */}
          <dd
            key={pick.park.slug}
            aria-live="polite"
            className="transition-[opacity,translate] duration-300 starting:translate-y-1 starting:opacity-0"
          >
            {allDone && (
              <span className="text-muted-foreground block text-sm">
                {tVisited('allDone', { count: headliners.length })}
              </span>
            )}
            {parkLink(pick)} {minutes(shownWait(pick.day)!)}
            {pickLevel && (
              <span className="text-muted-foreground text-sm">
                , {t('pickLevel', { level: pickLevel })}
              </span>
            )}
            {early(pick, pickLevel ? ', ' : ' ')}
          </dd>
        </div>
      )}
      {pick && headliners.length > 1 && (
        <div className={GLANCE_ROW}>
          <dt id="trip-visited-label" className="text-muted-foreground pt-0.5 text-sm">
            {done > 0
              ? tVisited('count', { count: done, total: headliners.length })
              : tVisited('ask')}
          </dt>
          <dd
            role="group"
            aria-labelledby="trip-visited-label"
            className="-mx-3 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-3 pt-0.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          >
            {headliners.map((park) => {
              const on = visited.has(park.slug);
              return (
                <button
                  key={park.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    const ticked = toggleVisited(region.slug, park.slug, todayIso, 'answer');
                    setPopped(ticked ? park.slug : null);
                  }}
                  className={cn(
                    'focus-visible:ring-ring inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border ps-2 pe-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none sm:min-h-9',
                    on
                      ? 'border-status-operating/45 bg-status-operating/12 text-foreground'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <VisitedMark visited={on} pop={popped === park.slug} />
                  {shortParkName(park.name)}
                </button>
              );
            })}
          </dd>
        </div>
      )}
      {lines.length > 0 && (
        <div className={GLANCE_ROW}>
          <dt className="text-muted-foreground pt-0.5 text-sm">
            {pick ? t('perResort') : dated('best')}
          </dt>
          <dd className="flex flex-wrap gap-x-3 gap-y-0.5">
            {lines.map((line) => (
              <span key={line.group.key}>
                {parkLink(
                  line,
                  `${shortGroupName(line.group.name)}: ${shortParkName(line.park.name)}`
                )}{' '}
                {minutes(shownWait(line.day)!)}
                {early(line)}
                {line.earlyElsewhere && dayGuestClose(line.earlyElsewhere.day) && (
                  <span className="text-muted-foreground text-sm">
                    {' '}
                    {t('earlyElsewhere', {
                      park: shortParkName(line.earlyElsewhere.park.name),
                      time: formatClockTime(
                        dayGuestClose(line.earlyElsewhere.day)!,
                        locale,
                        timezone
                      ),
                    })}
                  </span>
                )}
              </span>
            ))}
          </dd>
        </div>
      )}
    </>
  );
}
