'use client';

import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { formatDuration } from '@/lib/i18n/time';
import { useTranslations, useLocale } from 'next-intl';
import { Clock, Calendar, DoorOpen, Snowflake, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import type { ParkStatus } from '@/lib/api/types';
import { ParkTimeRange } from '@/components/common/park-time';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import type { ScheduleItem, NextScheduleItem, InfluencingHoliday } from '@/lib/api/types';

interface ParkTimeInfoProps {
  timezone: string;
  /** Full park schedule (day-stable, lives in the static shell). Today's entry is picked
   *  CLIENT-side from the browser clock + park timezone, so the shell stays time-independent. */
  schedule?: ScheduleItem[] | null;
  nextSchedule?: NextScheduleItem | null;
  status?: ParkStatus | null;
  hasOperatingSchedule?: boolean;
  /** Geo-routing params — when provided, the card subscribes to the live park query (shared key
   *  with LiveParkData → no extra fetch) so the status badge + schedule reflect the live state
   *  instead of the up-to-1-day-stale server snapshot baked into the data-cache. Omitted by the
   *  demo/mock showcases, which keep the static props. */
  continent?: string;
  country?: string;
  city?: string;
  parkSlug?: string;
  className?: string;
}

/**
 * Client component that displays:
 * 1. Current time in the park's timezone (live updating)
 * 2. Opening hours for today
 * 3. "Opens in" / "Closes in" messages
 */
export function ParkTimeInfo({
  timezone,
  schedule: scheduleProp,
  nextSchedule: nextScheduleProp,
  status: statusProp,
  hasOperatingSchedule: hasOperatingScheduleProp = true,
  continent,
  country,
  city,
  parkSlug,
  className,
}: ParkTimeInfoProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const tNearby = useTranslations('nearby');
  const locale = useLocale();
  const currentTime = useBrowserNow(60_000);

  // The park structure (incl. `status` and `schedule`) is baked into the 1-day data-cache snapshot,
  // so the server-rendered props can be up to a day stale — which previously left this badge showing
  // GESCHLOSSEN while the park was actually open. Subscribe to the same live park query LiveParkData
  // polls (shared React Query key → no extra fetch) and prefer its fresh values; fall back to the
  // props until the live poll lands (and for the demo/mock usages that pass no geo params), so SSR and
  // the first client render still agree.
  const hasParams = !!(continent && country && city && parkSlug);
  const { data: livePark, dataUpdatedAt } = useLiveParkData({
    continent: continent ?? '',
    country: country ?? '',
    city: city ?? '',
    parkSlug: parkSlug ?? '',
    enabled: hasParams,
  });
  const status = (hasParams ? livePark?.status : null) ?? statusProp;
  const schedule = (hasParams ? livePark?.schedule : null) ?? scheduleProp;
  const nextSchedule = (hasParams ? livePark?.nextSchedule : null) ?? nextScheduleProp;
  const hasOperatingSchedule =
    (hasParams ? livePark?.hasOperatingSchedule : undefined) ?? hasOperatingScheduleProp;

  // Pick today's schedule entry CLIENT-side (from the browser clock in the park's timezone) so the
  // static shell never reads the server clock. Before mount we fall back to the first entry — same
  // graceful seed the server used previously — and the real "today" fills in after hydration.
  const todaySchedule: ScheduleItem | null = (() => {
    if (!schedule || schedule.length === 0) return null;
    if (!currentTime) return schedule[0];
    const todayInParkTz = currentTime.toLocaleDateString('en-CA', { timeZone: timezone });
    return schedule.find((s) => s.date === todayInParkTz) ?? schedule[0];
  })();

  // Format current time in park timezone
  const formatCurrentTime = () => {
    if (!currentTime) return '—';
    try {
      return currentTime.toLocaleTimeString(locale, {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  // Calculate time until opening/closing
  const getTimeUntilMessage = (): {
    message: string;
    variant: 'opening' | 'closing' | null;
  } | null => {
    if (!todaySchedule || todaySchedule.scheduleType !== 'OPERATING') {
      return null;
    }

    const { openingTime, closingTime } = todaySchedule;
    if (!openingTime || !closingTime) return null;

    // Use the mounted-gated browser clock so the static prerender never reads the current time.
    if (!currentTime) return null;
    const now = currentTime;
    const opening = new Date(openingTime);
    const closing = new Date(closingTime);

    // Guard: opening must be today in the park's timezone (not tomorrow's schedule entry)
    const openingDateInParkTz = opening.toLocaleDateString('en-CA', { timeZone: timezone });
    const todayInParkTz = now.toLocaleDateString('en-CA', { timeZone: timezone });
    if (openingDateInParkTz !== todayInParkTz) return null;

    // If park hasn't opened yet
    if (now < opening) {
      return {
        message: `${t('opensIn')} ${formatDuration(opening.getTime() - now.getTime(), tCommon)}`,
        variant: 'opening',
      };
    }

    // If park is open and will close soon
    if (now >= opening && now < closing) {
      return {
        message: `${t('closesIn')} ${formatDuration(closing.getTime() - now.getTime(), tCommon)}`,
        variant: 'closing',
      };
    }

    return null;
  };

  const timeUntil = getTimeUntilMessage();

  // Format opening/closing times

  // Don't show the card if park is not operating today or no schedule data,
  // UNLESS we have a nextSchedule to show (OffSeason case) or we are in UNKNOWN state
  const isOperatingToday = todaySchedule && todaySchedule.scheduleType === 'OPERATING';
  const isUnknown = status === 'UNKNOWN' || (!isOperatingToday && !hasOperatingSchedule);

  // Badge value + visibility. The full-park live poll (which the badge previously gated on) also
  // computes best-visit-times and is the page's slowest dependency, so waiting on it left the badge
  // blank long after the opening hours had rendered. Instead, derive the open/closed state from
  // today's operating hours + the browser clock — the exact inputs the "öffnet/schließt in"
  // countdown already uses — so the badge appears TOGETHER with the opening hours, with no extra
  // request and no stale-snapshot flash. The live status still wins once the poll lands (it can
  // surface an unscheduled DOWN/REFURBISHMENT/closure the schedule can't predict).
  const liveStatus = hasParams && dataUpdatedAt > 0 ? (livePark?.status ?? null) : null;
  const scheduledStatus: ParkStatus | null = (() => {
    if (!isOperatingToday || !currentTime) return null;
    const { openingTime, closingTime } = todaySchedule!;
    if (!openingTime || !closingTime) return null;
    const opening = new Date(openingTime);
    const closing = new Date(closingTime);
    // Only trust the entry if it's actually today in the park tz (mirrors getTimeUntilMessage).
    const todayInParkTz = currentTime.toLocaleDateString('en-CA', { timeZone: timezone });
    if (opening.toLocaleDateString('en-CA', { timeZone: timezone }) !== todayInParkTz) return null;
    return currentTime >= opening && currentTime < closing ? 'OPERATING' : 'CLOSED';
  })();
  const badgeStatus = liveStatus ?? scheduledStatus ?? status;
  // Show once we have a trustworthy value: the resolved live poll, the clock-derived schedule
  // status, or an UNKNOWN park (whose snapshot status is stable). On the server and the first client
  // render — before the clock mounts and before the poll resolves — this is false for normal parks,
  // so the badge stays hidden (hydration-safe) instead of flashing the up-to-1-day-stale snapshot.
  const showStatusBadge =
    !hasParams || liveStatus !== null || scheduledStatus !== null || isUnknown;

  if (!isOperatingToday && !isUnknown) {
    // API may send nextSchedule with only openingTime/closingTime (no date)
    const nextOpeningRaw = nextSchedule?.date ?? nextSchedule?.openingTime;
    if (!nextOpeningRaw || !hasOperatingSchedule) return null;

    const nextOpening = new Date(nextOpeningRaw);
    if (Number.isNaN(nextOpening.getTime())) return null;

    // Mounted-gated clock (cacheComponents-safe); the offseason card fills in on the client.
    if (!currentTime) return null;
    const now = currentTime;
    const dayDiff = Math.ceil((nextOpening.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = dayDiff / 7;

    const dateFormatted = nextOpening.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      timeZone: timezone,
    });

    // If > 7 days – same icon/logic as nearby cards (offseason)
    if (totalWeeks >= 1) {
      const weeks = Math.ceil(totalWeeks);
      return (
        <Card className={className}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              {t('schedule')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-amber-500">
              <Snowflake className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">
                <GlossaryTermLink
                  termId="offseason"
                  className="cursor-help border-b border-dashed border-current/40 font-[inherit]"
                >
                  {t('offseason')}
                </GlossaryTermLink>{' '}
                ({t('opensOn')} {dateFormatted} - {tCommon('in')} {weeks}{' '}
                {tNearby('week', { count: weeks })})
              </span>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      // < 1 week, but not today – same icon as nearby (opening)
      return (
        <Card className={className}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              {t('schedule')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5">
              <DoorOpen className="text-muted-foreground h-4 w-4 flex-shrink-0" />
              <span className="font-medium">
                {t('opensOn')} {dateFormatted}
              </span>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          {isUnknown ? t('schedule') : t('todaySchedule')}
          {showStatusBadge && status && <ParkStatusBadge status={status} className="ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Opening Hours with Countdown FIRST */}
        {!isUnknown && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">{t('openingHours')}</span>
              {todaySchedule?.openingTime && todaySchedule?.closingTime ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-semibold">
                    <ParkTimeRange
                      openingTime={todaySchedule.openingTime}
                      closingTime={todaySchedule.closingTime}
                      parkTimezone={timezone}
                      locale={locale}
                      showSuffix
                    />
                  </span>
                  {todaySchedule.isInferred && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="text-muted-foreground/60 h-3.5 w-3.5 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tNearby('estimatedHours')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              ) : (
                <span className="text-lg font-semibold tabular-nums">—</span>
              )}
            </div>
            {/* Inline Countdown Badge */}
            {timeUntil && (
              <div className="flex items-center justify-end overflow-hidden">
                <Badge
                  variant={timeUntil.variant === 'opening' ? 'default' : 'secondary'}
                  className="max-w-full text-xs font-medium"
                >
                  <span className="min-w-0 truncate">{timeUntil.message}</span>
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Current Time - Below opening hours */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm font-medium">{t('currentTime')}</span>
          <div className="flex items-center gap-1.5">
            <Clock className="text-primary h-4 w-4" />
            <time
              dateTime={currentTime?.toISOString() ?? ''}
              className="text-lg font-bold tabular-nums"
              suppressHydrationWarning
            >
              {formatCurrentTime()}
            </time>
          </div>
        </div>

        {/* Timezone */}
        {timezone && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-medium">{t('timezone')}</span>
            <span className="font-mono text-sm font-medium">{timezone}</span>
          </div>
        )}

        {/* Holiday/Bridge Day/School Vacation Badges */}
        {(todaySchedule?.isHoliday ||
          todaySchedule?.isBridgeDay ||
          todaySchedule?.isSchoolVacation ||
          todaySchedule?.influencingHolidays) &&
          (() => {
            const shownNames = new Set<string>();
            const publicHolidayName = todaySchedule.isHoliday ? todaySchedule.holidayName : null;
            if (publicHolidayName) shownNames.add(publicHolidayName.toLowerCase());
            const uniqueInfluencing = (todaySchedule.influencingHolidays ?? []).filter(
              (h: InfluencingHoliday) => {
                const key = h.name.toLowerCase();
                if (shownNames.has(key)) return false;
                shownNames.add(key);
                return true;
              }
            );
            return (
              <div className="flex flex-wrap gap-2">
                {publicHolidayName && (
                  <Badge
                    variant="outline"
                    className="border-orange-300 bg-orange-50 text-xs dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300"
                  >
                    🎉 {publicHolidayName}
                  </Badge>
                )}
                {todaySchedule.isBridgeDay && (
                  <Badge
                    variant="outline"
                    className="border-blue-300 bg-blue-50 text-xs dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                  >
                    🌉 {t('bridgeDay')}
                  </Badge>
                )}
                {todaySchedule.isSchoolVacation && (
                  <Badge
                    variant="outline"
                    className="border-yellow-300 bg-yellow-50 text-xs dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300"
                  >
                    🎒 {t('schoolVacation')}
                  </Badge>
                )}
                {uniqueInfluencing.slice(0, 2).map((holiday: InfluencingHoliday) => (
                  <Badge
                    key={holiday.name}
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-xs dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                  >
                    🎄 {holiday.name}
                  </Badge>
                ))}
              </div>
            );
          })()}
      </CardContent>
    </Card>
  );
}
