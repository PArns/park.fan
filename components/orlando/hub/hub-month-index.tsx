import { getTranslations } from 'next-intl/server';
import { ParkCalendarMonthIndexChip } from '@/components/parks/park-calendar-month-index-chip';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import { isSameMonth, orlandoMonthHref, orlandoMonths } from '@/lib/orlando/paths';
import type { OrlandoMonth } from '@/lib/orlando/types';

/**
 * Every month the hub serves, as links, on the hub and on every month page, so each month is one
 * hop from every other. Navigation, not a chapter: a labelled `<nav>` with no heading, as the park
 * calendar's month index. The chips are the park calendar's own.
 */
export async function HubMonthIndex({
  current,
  active,
  locale,
  className,
}: {
  /** Orlando's current month, the hub's own. */
  current: OrlandoMonth;
  /** The month this page shows, `null` on the hub. */
  active: OrlandoMonth | null;
  locale: string;
  className?: string;
}) {
  const t = await getTranslations('orlando');
  const format = getDateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' });
  return (
    <nav aria-label={t('monthIndexLabel')} className={cn(className)}>
      <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
        {t('monthIndexLabel')}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {orlandoMonths(current).map((month) => (
          <li key={`${month.year}-${month.month}`}>
            <ParkCalendarMonthIndexChip
              href={orlandoMonthHref(month, current)}
              active={active ? isSameMonth(month, active) : isSameMonth(month, current)}
            >
              {format.format(new Date(Date.UTC(month.year, month.month - 1, 1)))}
            </ParkCalendarMonthIndexChip>
          </li>
        ))}
      </ul>
    </nav>
  );
}
