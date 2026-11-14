import { ParkCalendarMonthIndexChip } from '@/components/parks/park-calendar-month-index-chip';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import { isSameMonth, tripRegionMonthHref, tripRegionMonths } from '@/lib/trip-regions/paths';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import type { TripMonth } from '@/lib/trip-regions/types';

/**
 * Every month the hub serves, as links, on the hub and on every month page, so each month is one
 * hop from every other. Navigation, not a chapter: a labelled `<nav>` with no heading, as the park
 * calendar's month index. The chips are the park calendar's own.
 */
export async function HubMonthIndex({
  region,
  current,
  active,
  locale,
  className,
}: {
  region: string;
  /** The region's current month, the hub's own. */
  current: TripMonth;
  /** The month this page shows, `null` on the hub. */
  active: TripMonth | null;
  locale: string;
  className?: string;
}) {
  const t = await getRegionTranslations(region, 'hub');
  const format = getDateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' });
  return (
    <nav aria-label={t('monthIndexLabel')} className={cn(className)}>
      <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
        {t('monthIndexLabel')}
      </p>
      <ul className="flex flex-wrap gap-1.5 max-sm:gap-2">
        {tripRegionMonths(current).map((month) => (
          <li key={`${month.year}-${month.month}`}>
            <ParkCalendarMonthIndexChip
              href={tripRegionMonthHref(region, locale, month, current)}
              active={active ? isSameMonth(month, active) : isSameMonth(month, current)}
              // Twelve chips may take the phone's 44 px: the box is this list's own, so it grows
              // rather than borrowing a pseudo-element that would overlap the next row.
              className="max-sm:min-h-11 max-sm:px-3"
            >
              {format.format(new Date(Date.UTC(month.year, month.month - 1, 1)))}
            </ParkCalendarMonthIndexChip>
          </li>
        ))}
      </ul>
    </nav>
  );
}
