'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { CalendarPlus, ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { formatClockTime, formatHoursRange } from '@/lib/utils/intl-format';
import { plannerPagePark } from '@/lib/planner/page-park';
import { plannerPageDay } from '@/lib/planner/page-day';
import { plannerUi } from '@/lib/planner/ui-store';
import {
  closesEarly,
  dayGuestClose,
  findLeg,
  formatHubDate,
  isRankable,
  legMinutes,
  parkGeo,
  rankGroupParks,
  regionGroups,
  shortestLines,
  shortParkName,
  tintLevel,
} from '@/lib/trip-regions/hub-data';
import { shownWait } from '@/lib/trip-regions/plan-week';
import { requireTripRegion } from '@/lib/trip-regions/registry';
import { cleanBreakName } from '@/lib/trip-regions/best-time';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import type {
  TripCalendar,
  TripCalendarDay,
  TripParkDay,
  TripRegion,
  TripRegionPark,
  TripSeason,
} from '@/lib/trip-regions/types';
import type { IntegratedCalendarResponse } from '@/lib/api/types';

/** How many big rides a park lists for its day. */
const BIG_RIDES = 5;

/**
 * One day of every park of the region, the hub's level of detail: per resort the parks by shortest line,
 * each with its hours, the hotel guests' early slot, the evening event and when the day guests
 * leave, the seasons, the drive from the chosen hotel area and, on request, its five big rides.
 * The same figure as the square, and no hourly curve: the day planner owns that. A bottom sheet on
 * a phone, a side panel on a desktop; Radix returns focus to the square that opened it.
 */
export function HubDaySheet({
  day,
  region,
  calendar,
  locale,
  todayIso,
  returnFocus,
  onClose,
}: {
  day: TripCalendarDay | null;
  /** The control that opened the sheet; focus goes back to it when the sheet closes. */
  returnFocus?: { current: HTMLElement | null };
  region: TripRegion;
  calendar: TripCalendar;
  locale: string;
  todayIso: string;
  onClose: () => void;
}) {
  const t = useTranslations('tripHub.sheet');
  const tRegion = useTranslations('tripRegion.hub.sheet');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  // Drive times start from the region's usual hotel area until the reader picks one.
  const [area, setArea] = useState(requireTripRegion(region.slug).hub.defaultArea ?? '');
  const groups = regionGroups(region);
  const lines = day ? shortestLines(day, region) : [];
  const areaName = region.hotelAreas.find((a) => a.key === area)?.name ?? '';

  return (
    <Sheet open={day !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        onCloseAutoFocus={(event) => {
          if (!returnFocus?.current?.isConnected) return;
          event.preventDefault();
          returnFocus.current.focus();
        }}
        className={cn(
          'gap-0 p-0',
          isDesktop ? 'w-full sm:max-w-md' : 'max-h-[88dvh] rounded-t-2xl'
        )}
      >
        {day && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="border-border/60 border-b p-4 pr-14">
              {tRegion.has('kicker') && (
                <p className="text-primary-ink text-xs font-semibold tracking-wider uppercase">
                  {tRegion('kicker')}
                </p>
              )}
              <SheetTitle className="mt-1 text-xl font-bold">
                <time dateTime={day.date}>{formatHubDate(day.date, locale, 'long')}</time>
              </SheetTitle>
              <SheetDescription className="mt-1">{t('intro')}</SheetDescription>
              {(day.holidays?.length ?? 0) > 0 && (
                <p className="mt-2 text-sm">
                  {[
                    ...new Set(
                      day.holidays!.map((h) => translateHolidayName(cleanBreakName(h), locale))
                    ),
                  ].join(' · ')}
                </p>
              )}
              <label className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">{t('stayingAt')}</span>
                <select
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  className="border-border bg-background min-h-11 min-w-0 flex-1 rounded-md border px-2 sm:min-h-9"
                >
                  {region.hotelAreas.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-5 p-4">
              {groups.map((group) => (
                <section key={group.key} aria-labelledby={`sheet-${group.key}`}>
                  <h3
                    id={`sheet-${group.key}`}
                    className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase"
                  >
                    {group.name}
                  </h3>
                  <ol className="space-y-2">
                    {rankGroupParks(day, group.parks, group.key).map(
                      ({ park, day: parkDay }, index) => (
                        <SheetPark
                          key={park.slug}
                          rank={isRankable(parkDay) ? index + 1 : null}
                          ahead={
                            index === 0
                              ? lines.find((l) => l.group.key === group.key)?.earlyElsewhere
                              : undefined
                          }
                          park={park}
                          parkDay={parkDay}
                          date={day.date}
                          calendar={calendar}
                          region={region}
                          area={area}
                          areaName={areaName}
                          locale={locale}
                          plannable={
                            day.date >= todayIso &&
                            parkDay?.status === 'OPERATING' &&
                            parkDay.hoursPublished
                          }
                          onPlan={onClose}
                        />
                      )
                    )}
                  </ol>
                </section>
              ))}
              {region.travel.attribution && (
                <p className="text-muted-foreground text-xs">{region.travel.attribution}</p>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** One park on the day: the square's figure and everything that is too much for a square. */
function SheetPark({
  rank,
  ahead,
  park,
  parkDay,
  date,
  calendar,
  region,
  area,
  areaName,
  locale,
  plannable,
  onPlan,
}: {
  rank: number | null;
  /** The park with a shorter wait this one is ahead of, because that one closes early. */
  ahead?: { park: TripRegionPark; day: TripParkDay };
  park: TripRegionPark;
  parkDay: TripParkDay | undefined;
  date: string;
  calendar: TripCalendar;
  region: TripRegion;
  area: string;
  areaName: string;
  locale: string;
  plannable: boolean;
  onPlan: () => void;
}) {
  const t = useTranslations('tripHub.sheet');
  const tRegion = useTranslations('tripRegion.hub.sheet');
  const tCommon = useTranslations('common');
  const { timezone } = requireTripRegion(region.slug);
  const clock = (iso: string) => formatClockTime(iso, locale, timezone);
  const seasonsOf = (ids: string[] | undefined): TripSeason[] =>
    (ids ?? [])
      .map((id) => calendar.seasons.find((s) => s.id === id))
      .filter((s): s is TripSeason => s !== undefined && s.kind !== 'closure');
  const closure = parkDay?.closedBy
    ? calendar.seasons.find((s) => s.id === parkDay.closedBy)
    : undefined;
  const leg = findLeg(region.travel.legs, `hotel:${area}`, park.slug);
  const level = tintLevel(parkDay?.crowdLevel);

  const status =
    !parkDay || parkDay.status === 'UNKNOWN'
      ? isRankable(parkDay)
        ? t('noHoursFigure')
        : t('noHours')
      : parkDay.status === 'CLOSED'
        ? closure?.name
          ? t('closedFor', { name: closure.name })
          : tCommon('closed')
        : parkDay.opensAt && parkDay.closesAt
          ? formatHoursRange(parkDay.opensAt, parkDay.closesAt, locale, timezone)
          : t('noHours');

  return (
    <li className="border-border/60 bg-card/50 rounded-xl border p-3">
      <div className="flex items-start gap-3">
        <span className="text-muted-foreground w-4 shrink-0 pt-0.5 text-sm font-semibold tabular-nums">
          {rank ?? ''}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <Link
              href={park.path}
              prefetch={false}
              className="font-semibold underline-offset-4 hover:underline"
            >
              {shortParkName(park.name)}
            </Link>
            {isRankable(parkDay) ? (
              <span className="flex items-center gap-2">
                <span className="font-semibold tabular-nums">
                  {t('minutes', { minutes: shownWait(parkDay)! })}
                </span>
                <CrowdLevelBadge level={level} />
              </span>
            ) : parkDay?.status === 'OPERATING' ? (
              <span className="text-muted-foreground text-xs">{t('noForecast')}</span>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm tabular-nums">{status}</p>
          {ahead && dayGuestClose(ahead.day) && (
            <p className="mt-0.5 text-sm">
              {t('ahead', {
                park: shortParkName(ahead.park.name),
                time: clock(dayGuestClose(ahead.day)!),
              })}
            </p>
          )}
          {parkDay?.basis === 'last_year' && (
            <p className="text-muted-foreground text-xs">{t('lastYear')}</p>
          )}
          {parkDay?.basis === 'long_range' && (
            <p className="text-muted-foreground text-xs">{t('outlook')}</p>
          )}
          <ul className="mt-1.5 space-y-0.5 text-sm">
            {parkDay?.early && tRegion.has(`early.${parkDay.early.kind}`) && (
              <li>
                {tRegion(`early.${parkDay.early.kind}`, { time: clock(parkDay.early.opensAt) })}
              </li>
            )}
            {closesEarly(parkDay) && dayGuestClose(parkDay) && (
              <li className="font-medium">
                {parkDay?.evening?.kind === 'ticketed_event'
                  ? t('ticketedEvening', {
                      name:
                        seasonsOf(parkDay.seasons).find((s) => s.separateTicket)?.name ??
                        t('eveningEvent'),
                      time: clock(parkDay.evening.opensAt),
                      leave: clock(dayGuestClose(parkDay)!),
                    })
                  : t('shorterDay', { leave: clock(dayGuestClose(parkDay)!) })}
              </li>
            )}
            {parkDay?.evening?.kind === 'extended_evening' && (
              <li>{t('extendedEvening', { time: clock(parkDay.evening.closesAt) })}</li>
            )}
            {seasonsOf(parkDay?.seasons)
              .filter((s) => !s.separateTicket)
              .map((s) => (
                <li key={s.id} className="text-muted-foreground">
                  {s.name}
                  {s.status === 'expected' ? ` · ${t('expected')}` : ''}
                </li>
              ))}
            {leg && parkDay?.status !== 'CLOSED' && (
              <li className="text-muted-foreground">
                {leg.transferMinutes && tRegion.has('travelTransfer')
                  ? tRegion('travelTransfer', {
                      area: areaName,
                      minutes: leg.minutes,
                      transfer: leg.transferMinutes,
                      // Magic Kingdom's rest of the way is the monorail or ferry from the TTC,
                      // Volcano Bay's the shuttle from Universal's garages.
                      via: leg.via === 'ttc' ? 'ttc' : 'other',
                      total: legMinutes(leg),
                    })
                  : // The leg's own way there: a drive, a walk, a train; the select's words for an
                    // unknown mode are empty, so the line ends after the minutes.
                    t('travel', {
                      area: areaName,
                      minutes: legMinutes(leg),
                      mode: leg.mode,
                    }).trim()}
              </li>
            )}
          </ul>
          {isRankable(parkDay) && <BigRides park={park} date={date} />}
          {plannable && (
            <TripPlanDayButton
              region={region.slug}
              park={park}
              date={date}
              onPlan={onPlan}
              className="mt-2"
            />
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * The park's five big rides on that day, each at its busiest, read from the park's own calendar
 * when somebody opens them: sixteen parks' ride lists are no part of a square.
 */
function BigRides({ park, date }: { park: TripRegionPark; date: string }) {
  const t = useTranslations('tripHub.sheet');
  const [open, setOpen] = useState(false);
  const geo = parkGeo(park);
  const { data, isError, isPending } = useQuery<IntegratedCalendarResponse>({
    queryKey: ['calendar', geo?.continent, geo?.country, geo?.city, park.slug, date, date],
    queryFn: async () => {
      const response = await fetch(
        `/api/parks/${geo!.continent}/${geo!.country}/${geo!.city}/${park.slug}/calendar?from=${date}&to=${date}`
      );
      if (!response.ok) throw new Error(`Park calendar ${response.status}`);
      return response.json();
    },
    enabled: open && geo !== null,
    staleTime: 60 * 60 * 1000,
  });
  if (!geo) return null;
  const rides = data?.days?.[0]?.headlinerForecast?.rides?.slice(0, BIG_RIDES) ?? [];
  return (
    <details
      className="group mt-2"
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="text-primary-ink flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-medium sm:min-h-0">
        {t('bigRides')}
        <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      {open &&
        (isPending ? (
          <p className="text-muted-foreground mt-1 text-sm">{t('ridesLoading')}</p>
        ) : isError || rides.length === 0 ? (
          <p className="text-muted-foreground mt-1 text-sm">{t('ridesNone')}</p>
        ) : (
          <>
            <p className="text-muted-foreground mt-1 text-xs">{t('ridesHint')}</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {rides.map((ride) => (
                <li key={ride.attractionId} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">{ride.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {t('minutes', { minutes: ride.waitTime })}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ))}
    </details>
  );
}

/** The park the last "Plan this day" named for the planner, cleared when the hub goes. */
let namedPark: string | null = null;

/**
 * Forgets the park a "Plan this day" named, when the hub unmounts: the page is about no one park
 * and must not keep claiming one on the next route.
 */
export function clearTripPagePark(): void {
  if (namedPark) plannerPagePark.clear(namedPark);
  namedPark = null;
}

/**
 * "Plan this day": the single-day planner's wizard on this park and date, the hand-off the
 * homepage hero and the park calendar use. The hub is about no one park, so the press names the
 * park itself (`plannerPagePark`); `clearTripPagePark` takes it back when the hub goes. The open is
 * counted as the region's hub (`orlando-hub`).
 */
export function TripPlanDayButton({
  region,
  park,
  date,
  onPlan,
  className,
}: {
  region: string;
  park: TripRegionPark;
  date: string;
  onPlan?: () => void;
  className?: string;
}) {
  const t = useTranslations('tripHub.sheet');
  const geo = parkGeo(park);
  if (!geo) return null;
  const plan = () => {
    plannerPagePark.set({ slug: park.slug, name: park.name, geo, timezone: park.timezone });
    namedPark = park.slug;
    plannerPageDay.set({ parkSlug: park.slug, date });
    plannerUi.requestOpen(`${region}-hub`, 'page-park-wizard');
    onPlan?.();
  };
  return (
    <Button type="button" size="sm" variant="outline" onClick={plan} className={className}>
      <CalendarPlus aria-hidden />
      {t('planDay')}
    </Button>
  );
}
