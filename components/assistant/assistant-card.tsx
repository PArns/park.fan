'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import Image from 'next/image';
import NextLink from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, Clock } from 'lucide-react';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { LiveWaitPill } from '@/components/parks/live-wait-pill';
import { cn } from '@/lib/utils';
import type { AssistantCard } from '@/lib/assistant/actions';
import { localizedPath } from '@/lib/i18n/localized-path';
import type { CrowdLevel, ParkStatus } from '@/lib/api/types';
import { loadCardImageMap, rideCardImageKey, type CardImageMap } from '@/lib/media/card-images';
import {
  calendarWeeks,
  parkHours,
  presentTiles,
  type AssistantCalendarCard,
  type AssistantTile,
  type AssistantTilesCard,
} from '@/lib/assistant/cards';
import { PARK_CALENDAR_CANONICAL_SEGMENT } from '@/lib/parks/calendar-segments';
import { CROWD_CHIP_CLASS, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { DAY_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';
import {
  formatTime,
  getDateTimeFormat,
  weekdayName,
  WEEKDAYS_MONDAY_FIRST,
} from '@/lib/utils/intl-format';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { Temp } from '@/components/common/unit-display';

/** The park and ride slugs of a park.fan page path: `/parks/<c>/<c>/<c>/<park>[/<ride>]`. */
function slugsOf(url: string | null): { park: string; ride?: string } | null {
  const parts = url?.split('/').filter(Boolean) ?? [];
  const at = parts.indexOf('parks');
  const park = at >= 0 ? parts[at + 4] : undefined;
  return park ? { park, ride: parts[at + 5] } : null;
}

/** The site's card-image map, the one park and ride cards use; null until it has loaded. */
function useCardImageMap(): CardImageMap | null {
  const [map, setMap] = useState<CardImageMap | null>(null);
  useEffect(() => {
    let live = true;
    void loadCardImageMap().then((loaded) => {
      if (live) setMap(loaded);
    });
    return () => {
      live = false;
    };
  }, []);
  return map;
}

/** `[src, objectPosition]` of the photo for a park or ride page, or null. */
function photoFor(map: CardImageMap | null, url: string | null): [string, string] | null {
  const slugs = slugsOf(url);
  if (!map || !slugs) return null;
  const table = slugs.ride ? map.rides : map.parks;
  const key = slugs.ride ? rideCardImageKey(slugs.park, slugs.ride) : slugs.park;
  return Object.hasOwn(table, key) ? table[key] : null;
}

/** An instant as "HH:MM" in the reader's own clock, the one every time in Parky is given in. */
function clock(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  return Number.isNaN(at.getTime())
    ? null
    : at.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/** A link to a park.fan page in the reader's language, or its children unlinked. */
function MaybeLink({
  url,
  className,
  children,
}: {
  url: string | null | undefined;
  className?: string;
  children: ReactNode;
}) {
  const locale = useLocale();
  return url ? (
    <NextLink href={localizedPath(url, locale)} className={className}>
      {children}
    </NextLink>
  ) : (
    <div className={className}>{children}</div>
  );
}

/** One ride with its wait, in the chips the site's in-park lists use; a link to it when it has one. */
function RideRow({
  name,
  waitMinutes,
  url,
}: {
  name: string;
  waitMinutes: number;
  url?: string | null;
}) {
  return (
    <li>
      <MaybeLink
        url={url}
        className={cn(
          '-mx-1.5 flex items-center justify-between gap-2 rounded-md px-1.5 py-0.5',
          url && 'hover:bg-muted/60'
        )}
      >
        <span className="truncate">{name}</span>
        <LiveWaitPill minutes={waitMinutes} className="shrink-0 px-2 py-0.5 text-[11px]" />
      </MaybeLink>
    </li>
  );
}

/** The park a card is about, as its heading; a link to the park when it has one. */
function CardHeading({ park, url }: { park: string; url: string | null }) {
  return (
    <MaybeLink
      url={url}
      className="group flex items-center justify-between gap-2 text-sm font-semibold"
    >
      <span className="truncate">{park}</span>
      {url && (
        <ChevronRight className="text-muted-foreground group-hover:text-primary size-4 shrink-0" />
      )}
    </MaybeLink>
  );
}

/** A park-local `YYYY-MM-DD` as „Sa., 7. Nov.", read in UTC so no zone moves it a day. */
function dayLabel(date: string, locale: string): string {
  return formatTime(Date.parse(date), locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

const FRAME =
  'border-border/60 bg-background/70 mt-2 overflow-hidden rounded-xl border text-xs transition-colors';

/**
 * A park's next days as a small month grid in the crowd colours. A day is a button: tapping,
 * hovering or focusing it writes its hours and level under the grid, where a phone can read them.
 */
function CalendarCard({ card }: { card: AssistantCalendarCard }) {
  const locale = useLocale();
  const t = useTranslations('assistant');
  const tCrowd = useTranslations('parks.crowdLevels');
  const tCommon = useTranslations('common');
  const detailId = useId();
  const [picked, setPicked] = useState<string | null>(null);
  const day = card.days.find((d) => d.date === picked);
  const span = getDateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).formatRange(Date.parse(card.days[0].date), Date.parse(card.days[card.days.length - 1].date));
  const hours = day && day.status !== 'CLOSED' ? parkHours(day.opens, day.closes, locale) : null;

  return (
    <div className={cn(FRAME, 'p-3')}>
      <CardHeading park={card.park} url={card.url} />
      <p className="text-muted-foreground">{span}</p>
      <table className="mt-2 w-full table-fixed border-separate border-spacing-0.5">
        <thead>
          <tr>
            {WEEKDAYS_MONDAY_FIRST.map((weekday) => (
              <th
                key={weekday}
                scope="col"
                className="text-muted-foreground pb-0.5 text-[10px] font-medium"
              >
                {weekdayName(weekday, locale, 'short')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calendarWeeks(card.days).map((week) => (
            <tr key={week.find(Boolean)?.date}>
              {week.map((cell, index) => {
                if (!cell) return <td key={index} />;
                const closed = cell.status === 'CLOSED';
                const level = cell.crowdLevel;
                const colored = !closed && level && isColoredCrowdLevel(level) ? level : null;
                const state = closed ? tCommon('closed') : tCrowd(colored ?? 'unknown');
                const holiday = cell.holiday ? `, ${t('cardHoliday')}` : '';
                return (
                  <td key={cell.date}>
                    <button
                      type="button"
                      aria-pressed={picked === cell.date}
                      aria-controls={detailId}
                      aria-label={`${dayLabel(cell.date, locale)}: ${state}${holiday}`}
                      onClick={() => setPicked(picked === cell.date ? null : cell.date)}
                      onMouseEnter={() => setPicked(cell.date)}
                      onFocus={() => setPicked(cell.date)}
                      className={cn(
                        'relative flex h-8 w-full items-center justify-center rounded-md border text-[11px] tabular-nums transition-colors',
                        colored
                          ? cn(CROWD_CHIP_CLASS[colored], 'font-semibold')
                          : closed
                            ? 'bg-muted/40 text-muted-foreground/60 border-transparent'
                            : 'border-border/60 text-muted-foreground',
                        picked === cell.date && 'ring-primary ring-2'
                      )}
                    >
                      {cell.holiday && (
                        <span
                          aria-hidden
                          className={cn(
                            'absolute inset-x-1.5 top-0.5 h-0.5 rounded-full',
                            DAY_SIGNAL_CLASS.holiday
                          )}
                        />
                      )}
                      {Number(cell.date.slice(8))}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p
        id={detailId}
        aria-live="polite"
        className="mt-2 flex min-h-5 flex-wrap items-center gap-1.5"
      >
        {day ? (
          <>
            <span className="font-medium">{dayLabel(day.date, locale)}</span>
            {day.status === 'CLOSED' ? (
              <span className="text-muted-foreground">{tCommon('closed')}</span>
            ) : (
              <>
                {hours && (
                  <span className="text-muted-foreground inline-flex items-center gap-1 tabular-nums">
                    <Clock className="size-3" />
                    {hours}
                  </span>
                )}
                <CrowdLevelBadge level={(day.crowdLevel ?? 'unknown') as CrowdLevel} />
              </>
            )}
            {day.holiday && <span className="text-muted-foreground">{t('cardHoliday')}</span>}
          </>
        ) : (
          <span className="text-muted-foreground">{t('cardCalendarHint')}</span>
        )}
      </p>
      {card.url && (
        <NextLink
          href={localizedPath(`${card.url}/${PARK_CALENDAR_CANONICAL_SEGMENT}`, locale)}
          className="text-primary mt-2 inline-flex items-center gap-1 font-medium hover:underline"
        >
          {t('cardCalendarLink')}
          <ChevronRight className="size-3.5" />
        </NextLink>
      )}
    </div>
  );
}

/** A park's day in a few stat tiles, now or as a forecast; a stat without a value has no tile. */
function TilesCard({ card }: { card: AssistantTilesCard }) {
  const locale = useLocale();
  const t = useTranslations('assistant');
  const { weather } = card;
  const minutes = (value: number | null) => t('cardWait', { minutes: roundWaitTo5(value ?? 0) });

  const tile: Record<AssistantTile, { label: string; value: ReactNode }> = {
    crowd: {
      label: t('cardCrowd'),
      value: <CrowdLevelBadge level={card.crowdLevel as CrowdLevel} />,
    },
    avgWait: { label: t('cardAvgWait'), value: minutes(card.avgWaitMinutes) },
    peakWait: {
      label: t(card.live ? 'cardPeakSoFar' : 'cardPeakExpected'),
      value: minutes(card.peakWaitMinutes),
    },
    rides: {
      label: t('cardRidesOpen'),
      value:
        card.totalRides != null ? `${card.openRides} / ${card.totalRides}` : `${card.openRides}`,
    },
    hours: { label: t('cardHours'), value: parkHours(card.opens, card.closes, locale) },
    weather: {
      label: weather?.climateNormal ? t('cardSeasonal') : t('cardWeather'),
      value: weather && (
        <>
          {weather.condition && <span className="block truncate">{weather.condition}</span>}
          {weather.tempMin != null && <Temp celsius={weather.tempMin} />}
          {weather.tempMin != null && weather.tempMax != null && ' – '}
          {weather.tempMax != null && <Temp celsius={weather.tempMax} />}
        </>
      ),
    },
  };

  return (
    <div className={cn(FRAME, 'p-3')}>
      <CardHeading park={card.park} url={card.url} />
      <p className="text-muted-foreground">
        {card.live ? t('cardNow') : t('cardForecastFor', { date: dayLabel(card.date, locale) })}
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-1.5">
        {presentTiles(card).map((key) => (
          <div key={key} className="bg-muted/40 min-w-0 rounded-lg px-2 py-1.5">
            <dt className="text-muted-foreground truncate text-[10px]">{tile[key].label}</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">{tile[key].value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const KNOWN_KINDS = new Set(['park', 'ride', 'rides', 'parks', 'calendar', 'tiles']);

/**
 * A park, a ride, a park's rides, a few parks, a park's next days or its day in stat tiles as a
 * card in Parky's chat: the site's own status, crowd and wait chips and photos on live data. A
 * single park or ride is one link; in a list every row links its own page. The API builds the
 * data; nothing here is model text. A kind this widget does not know draws nothing.
 */
export function AssistantCardView({ card }: { card: AssistantCard }) {
  if (!KNOWN_KINDS.has(card.kind)) return null;
  if (card.kind === 'calendar') return <CalendarCard card={card} />;
  if (card.kind === 'tiles') return <TilesCard card={card} />;
  return <LiveCard card={card} />;
}

/** The park, ride, rides and parks cards. */
function LiveCard({
  card,
}: {
  card: Exclude<AssistantCard, AssistantCalendarCard | AssistantTilesCard>;
}) {
  const locale = useLocale();
  const map = useCardImageMap();

  if (card.kind === 'parks') {
    return (
      <ul className={cn(FRAME, 'divide-border/50 divide-y')}>
        {card.parks.map((park) => {
          const photo = photoFor(map, park.url);
          return (
            <li key={park.name}>
              <MaybeLink
                url={park.url}
                className="group hover:bg-muted/50 flex items-center gap-3 p-2"
              >
                <div className="bg-muted relative h-10 w-16 shrink-0 overflow-hidden rounded-lg">
                  {photo && (
                    <Image
                      src={photo[0]}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                      style={{ objectPosition: photo[1] }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{park.name}</p>
                  {park.place && <p className="text-muted-foreground truncate">{park.place}</p>}
                  {(park.status || park.crowdLevel || park.avgWaitMinutes != null) && (
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {park.status && <ParkStatusBadge status={park.status as ParkStatus} />}
                      {park.crowdLevel && <CrowdLevelBadge level={park.crowdLevel as CrowdLevel} />}
                      {park.avgWaitMinutes != null && park.status === 'OPERATING' && (
                        <LiveWaitPill
                          minutes={park.avgWaitMinutes}
                          className="px-1.5 py-0 text-[10px]"
                        />
                      )}
                    </div>
                  )}
                </div>
                {park.url && (
                  <ChevronRight className="text-muted-foreground group-hover:text-primary size-4 shrink-0" />
                )}
              </MaybeLink>
            </li>
          );
        })}
      </ul>
    );
  }

  if (card.kind === 'rides') {
    return (
      <div className={cn(FRAME, 'p-3')}>
        <CardHeading park={card.park} url={card.url} />
        <ul className="mt-2 space-y-1">
          {card.rides.map((ride) => (
            <RideRow key={ride.name} {...ride} />
          ))}
        </ul>
      </div>
    );
  }

  const opens = card.kind === 'park' ? clock(card.opens, locale) : null;
  const closes = card.kind === 'park' ? clock(card.closes, locale) : null;
  const subtitle = card.kind === 'park' ? card.place : card.park;
  const photo = photoFor(map, card.url);

  return (
    <MaybeLink url={card.url} className={cn(FRAME, 'group hover:border-primary/40 block')}>
      {photo && (
        <div className="relative h-24 w-full">
          <Image
            src={photo[0]}
            alt=""
            fill
            sizes="480px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ objectPosition: photo[1] }}
          />
          <div className="from-background/90 absolute inset-0 bg-gradient-to-t to-transparent" />
        </div>
      )}
      <div className={cn('p-3', photo && 'relative -mt-6')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{card.name}</p>
            {subtitle && <p className="text-muted-foreground truncate">{subtitle}</p>}
          </div>
          {card.url && (
            <ChevronRight className="text-muted-foreground group-hover:text-primary mt-0.5 size-4 shrink-0" />
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {card.status && <ParkStatusBadge status={card.status as ParkStatus} />}
          {card.crowdLevel && <CrowdLevelBadge level={card.crowdLevel as CrowdLevel} />}
          {card.kind === 'ride' && card.waitMinutes != null && (
            <LiveWaitPill minutes={card.waitMinutes} className="px-2 py-0.5 text-[11px]" />
          )}
          {opens && closes && (
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <Clock className="size-3" />
              {opens}–{closes}
            </span>
          )}
        </div>
        {card.kind === 'park' && card.waits.length > 0 && (
          <ul className="border-border/60 mt-2 space-y-1 border-t pt-2">
            {card.waits.map((ride) => (
              <RideRow key={ride.name} name={ride.name} waitMinutes={ride.waitMinutes} />
            ))}
          </ul>
        )}
      </div>
    </MaybeLink>
  );
}
