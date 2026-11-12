'use client';

import { useTranslations } from 'next-intl';
import { BedDouble, Clock3, History, MoonStar, Sunrise } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatClockTime } from '@/lib/utils/intl-format';
import { dayMarker, earlyPerk } from '@/lib/orlando/plan-copy';
import { calendarCell } from '@/lib/orlando/plan-week';
import type { PlanDay } from '@/lib/orlando/plan';
import type { TripCalendar } from '@/lib/orlando/types';
import { usePlanContext } from './plan-context';

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
  const t = useTranslations('orlandoPlanner.marker');
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
      return t(earlyPerk(day.perks) === 'early_park_admission' ? 'earlyPark' : 'earlyEntry');
    }
    return t(marker);
  };
}

const MARKER_ICON = {
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
        marker === 'closes' ? 'text-crowd-ink-high' : 'text-muted-foreground',
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
  const t = useTranslations('orlandoPlanner.climate');
  if (codes.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {codes.map((code) => (
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
