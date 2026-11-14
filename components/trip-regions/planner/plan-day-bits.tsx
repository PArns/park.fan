'use client';

import { useTranslations } from 'next-intl';
import { BedDouble, CircleAlert, Clock3, History, MoonStar, Sunrise } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatClockTime } from '@/lib/utils/intl-format';
import { dayMarker, earlyPerk } from '@/lib/trip-regions/plan-copy';
import { calendarCell } from '@/lib/trip-regions/plan-week';
import { ticketDayOf } from '@/lib/trip-regions/plan-tickets';
import type { PlanDay, PlanMeta } from '@/lib/trip-regions/plan';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext } from './plan-context';
import { useResortWord } from './plan-ticket-words';

/** The park or parks of a day, as one label ("Universal Studios Florida + Islands of Adventure"). */
export function useDayParks(): (day: PlanDay) => string {
  const { parkName } = usePlanContext();
  return (day) => day.parks.map((p) => parkName(p.slug)).join(' + ');
}

/** When the day guests leave a park day: the plan's own figure, else the calendar's close. */
export function dayGuestClose(day: PlanDay, calendar: TripCalendar | undefined): string | null {
  const last = day.parks.at(-1);
  if (!last) return null;
  return (
    last.dayGuestCloseAt ??
    day.dayGuestCloseAt ??
    calendarCell(calendar, last.slug, day.date)?.closesAt ??
    null
  );
}

/**
 * The words of a day's one overview marker (`dayMarker`): "closes 6 pm", rest day, the hotel's
 * early slot, its extended evening, or "last year"; `null` for none. For a label that has to carry
 * them where the marker is only an icon.
 */
export function useDayMarkerText(): (
  day: PlanDay,
  calendar: TripCalendar | undefined
) => string | null {
  const t = useTranslations('tripPlanner.marker');
  const { locale, timeZone } = usePlanContext();
  return (day, calendar) => {
    const marker = dayMarker(day);
    if (!marker) return null;
    if (marker === 'closes') {
      const close = dayGuestClose(day, calendar);
      return close
        ? t('closesAt', { time: formatClockTime(close, locale, timeZone) })
        : t('closesEarly');
    }
    if (marker === 'early') {
      // An early slot this client has no name for yet (a new region's) draws no marker.
      const key = `early.${earlyPerk(day.perks)}`;
      return t.has(key) ? t(key) : null;
    }
    return t(marker);
  };
}

const MARKER_ICON = {
  outside_ticket: CircleAlert,
  closes: Clock3,
  rest: BedDouble,
  early: Sunrise,
  evening: MoonStar,
  last_year: History,
} as const;

/**
 * The one marker a day wears in the overview: an icon with words, never colour alone. `compact`
 * keeps the icon and moves the words into a tooltip, for the Month view's cells, whose own label
 * carries them.
 */
export function PlanDayMarker({
  day,
  calendar,
  compact = false,
  className,
}: {
  day: PlanDay;
  calendar: TripCalendar | undefined;
  compact?: boolean;
  className?: string;
}) {
  const markerText = useDayMarkerText();
  const marker = dayMarker(day);
  const text = markerText(day, calendar);
  if (!marker || !text) return null;
  const Icon = MARKER_ICON[marker];

  return (
    <span
      data-plan-marker={marker}
      title={compact ? text : undefined}
      className={cn(
        'inline-flex min-w-0 items-center gap-1 text-xs',
        marker === 'closes' || marker === 'outside_ticket'
          ? 'text-crowd-ink-high'
          : 'text-muted-foreground',
        className
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {!compact && <span className="truncate">{text}</span>}
    </span>
  );
}

/**
 * The name of a day's evening: the second park's (short) name or the venue's; `null` without an
 * evening or for a venue the region does not list.
 */
export function useEveningName(): (day: PlanDay) => string | null {
  const { parkName, venueByKey } = usePlanContext();
  return (day) => {
    const evening = day.evening;
    if (!evening) return null;
    if (evening.kind === 'hop') return evening.park ? parkName(evening.park) : null;
    return evening.venue ? (venueByKey.get(evening.venue)?.name ?? null) : null;
  };
}

/**
 * The season's facts as short chips ("hot", "hurricane season", "peak hurricane season"), shared by
 * the day sheet and the When mode's cards.
 */
export function ClimateChips({ codes }: { codes: readonly string[] }) {
  const t = useTranslations('tripPlanner.climate');
  // A season this client has no words for yet (a new region's) is not drawn.
  const said = codes.filter((code) => t.has(code));
  if (said.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {said.map((code) => (
        <span
          key={code}
          className="border-crowd-high/40 text-crowd-ink-high rounded-full border px-2 py-0.5 text-xs"
        >
          {t(code)}
        </span>
      ))}
    </span>
  );
}

/**
 * A day's place on its owned ticket, "Disney day 2 of 4", or with `short` "day 2 of 4" for the
 * phone's narrow Week columns. An every-day ticket counts the day of its window. `null` for a
 * suggested ticket (nothing is bought yet), a pass, a water-park visit on the allowance and a day
 * without a ticket.
 */
export function useTicketDayLabel(): (
  day: PlanDay,
  meta: Pick<PlanMeta, 'tickets' | 'ticketSuggestion'>,
  short?: boolean
) => string | null {
  const t = useTranslations('tripPlanner.tickets.day');
  const { tickets: catalog } = usePlanContext();
  const resortWord = useResortWord();
  return (day, meta, short = false) => {
    const info = ticketDayOf(day, meta, catalog);
    if (!info || info.kind !== 'owned' || info.pass || info.of === null) return null;
    return short
      ? t('short', { day: info.day, of: info.of })
      : t('long', { resort: resortWord(info.resort), day: info.day, of: info.of });
  };
}
