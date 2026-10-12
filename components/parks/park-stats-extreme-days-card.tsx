import { TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { BareFrame } from '@/components/parks/park-stats-frame';
import {
  parkCalendarMonthIndex,
  parkCalendarMonthsBack,
  parkCalendarPath,
} from '@/lib/parks/calendar-segments';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { PHONE_HIT_AREA } from '@/lib/utils/touch-target';
import { cn } from '@/lib/utils';
import type { ExtremeDayStat } from '@/lib/api/types';

/** A park-local `yyyy-MM-dd` as an instant that stays on that day in UTC, which the formatters use. */
const noon = (date: string) => new Date(`${date}T12:00:00Z`);

interface ParkStatsExtremeDaysCardProps {
  busiest: readonly ExtremeDayStat[];
  quietest: readonly ExtremeDayStat[];
  busiestTitle: string;
  quietestTitle: string;
  /** Label for the day's peak (P90) wait, e.g. "Peak". */
  labelP90: string;
  locale: string;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * The fullest and the quietest measured days of a park, five each, every date a link to the
 * crowd calendar of its month. Renders in the stats panel's bare frame; an empty list drops its
 * column, so a park with too few measured days shows nothing here.
 */
export function ParkStatsExtremeDaysCard({
  busiest,
  quietest,
  busiestTitle,
  quietestTitle,
  labelP90,
  locale,
  continent,
  country,
  city,
  parkSlug,
}: ParkStatsExtremeDaysCardProps) {
  // The weekday is the first thing to go when the list is narrow: a phone row holds the date, the
  // badge and the peak wait on one line only without it.
  // A month the calendar no longer serves 308s to the hub, so such a day links to the hub itself.
  // Until the clock is read (server render, hydration) every day does, which is also where a
  // crawler lands without a redirect hop.
  const now = useBrowserNow();
  const nowMonth = now && { year: now.getFullYear(), month: now.getMonth() + 1 };
  const oldestMonthIndex =
    nowMonth && parkCalendarMonthIndex(nowMonth) - parkCalendarMonthsBack(nowMonth);
  const dayOptions = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' } as const;
  const dateFormat = getDateTimeFormat(locale, dayOptions);
  const dateWithWeekday = getDateTimeFormat(locale, { ...dayOptions, weekday: 'short' });
  const lists = [
    { key: 'busiest', title: busiestTitle, days: busiest, Icon: TrendingUp },
    { key: 'quietest', title: quietestTitle, days: quietest, Icon: TrendingDown },
  ].filter((list) => list.days.length > 0);

  return (
    <div className={cn('grid gap-x-6 gap-y-4', lists.length === 2 && 'sm:grid-cols-2')}>
      {lists.map(({ key, title, days, Icon }) => (
        <BareFrame key={key}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="text-primary h-4 w-4" aria-hidden="true" />
            {title}
          </h3>
          <ul className="@container max-w-xl space-y-0.5">
            {days.map((day) => {
              const [year, month] = day.date.split('-').map(Number);
              return (
                <li
                  key={day.date}
                  className="hover:bg-primary/5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-2 py-1.5 text-sm transition-colors"
                >
                  <Link
                    href={parkCalendarPath(
                      locale,
                      continent,
                      country,
                      city,
                      parkSlug,
                      oldestMonthIndex != null &&
                        parkCalendarMonthIndex({ year, month }) >= oldestMonthIndex
                        ? { year, month }
                        : undefined
                    )}
                    className={cn(
                      'min-w-0 flex-1 font-medium whitespace-nowrap hover:underline',
                      PHONE_HIT_AREA
                    )}
                  >
                    <span className="@min-[26rem]:hidden">{dateFormat.format(noon(day.date))}</span>
                    <span className="hidden @min-[26rem]:inline">
                      {dateWithWeekday.format(noon(day.date))}
                    </span>
                  </Link>
                  <CrowdLevelBadge level={day.avgCrowdLevel} className="shrink-0 text-xs" />
                  <span className="text-muted-foreground/70 shrink-0 text-xs tabular-nums">
                    <span className="text-muted-foreground/50 hidden @min-[26rem]:inline">
                      {labelP90}{' '}
                    </span>
                    <span className="text-foreground/70 font-medium">
                      {roundWaitTo5(day.avgWaitP90)} min
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </BareFrame>
      ))}
    </div>
  );
}
