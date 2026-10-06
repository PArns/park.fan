'use client';

import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, CalendarPlus, ChevronRight, Clock } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { PlannerPageParkBeacon } from '@/components/planner/planner-page-park-beacon';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannerUi } from '@/lib/planner/ui-store';
import { plannerPageDay } from '@/lib/planner/page-day';
import { todayInZone } from '@/lib/planner/park-time';
import { useMinuteNowDate } from '@/lib/hooks/use-minute-now';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
import { parkCalendarPath } from '@/lib/parks/calendar-segments';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { formatHoursRange, getDateTimeFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import type { PlannerGeo } from '@/lib/planner/types';
import type { ScheduleSummary } from '@/lib/api/types';

/** What the hero knows about the park the visitor is in or next to, from `/api/nearby`. */
export interface HeroPark {
  slug: string;
  name: string;
  /**
   * The park's four path slugs, or `null` where the answer carries no URL to read them from. The
   * `in_park` answer never carries the park's own URL, so the caller reads them off a ride's —
   * see `parkGeoFromUrl`.
   */
  geo: PlannerGeo | null;
  timezone: string;
  status: string;
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
  operatingAttractions: number | null;
  backgroundImage?: string | null;
  backgroundPosition?: string;
}

const TILE =
  'border-border/60 bg-background/40 hover:border-primary/40 hover:bg-background/60 focus-visible:ring-ring flex min-w-0 flex-col justify-center gap-1 rounded-xl border px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none';

/**
 * The part of the homepage hero for somebody standing in a park, or right next to one: two things
 * to press and two to read.
 *
 * - **„Heute planen"** opens the planner's wizard with this park and today already answered (the
 *   calendar's hand-off: `plannerPageDay` plus a `page-park-wizard` request). If today is already
 *   planned it opens that day; if the park is shut or closed today it asks for the date.
 * - **„Zum Park"**: the wait times, with how many rides are running.
 * - **Öffnungszeiten**: today's hours, with a dot for open now, to the crowd calendar.
 * - **Wetter**: the nowcast's condition and temperature, to the weather chapter.
 *
 * The weather is the only request of its own (`useWeatherNowcast`). The block renders after mount,
 * so it may read the clock and the plan in render; late values sit in fixed-height lines with
 * static placeholders, since an endless animation under the plate's `backdrop-filter` flickers.
 */
export function HeroParkActions({ park, className }: { park: HeroPark; className?: string }) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { state, openDay } = usePlanner();
  const now = useMinuteNowDate();
  const { geo } = park;
  const parkPath = geo ? `/parks/${geo.continent}/${geo.country}/${geo.city}/${park.slug}` : null;

  const { data: nowcast, isPending: weatherPending } = useWeatherNowcast({
    continent: geo?.continent ?? '',
    country: geo?.country ?? '',
    city: geo?.city ?? '',
    parkSlug: park.slug,
    enabled: geo !== null,
  });

  const schedule = park.todaySchedule;
  const hours =
    schedule?.scheduleType === 'OPERATING' && schedule.openingTime && schedule.closingTime
      ? { open: schedule.openingTime, close: schedule.closingTime }
      : null;
  // No schedule at all says nothing about today, so it plans today like an open day would — the
  // same reading `isParkDayOver` gives a park without published hours.
  const todayPlannable = !schedule
    ? true
    : hours !== null && (!now || now.getTime() < new Date(hours.close).getTime());
  const today = now ? todayInZone(park.timezone, now.getTime()) : null;
  const todayPlanned = today !== null && Boolean(state.parks[park.slug]?.days[today]);
  const mode = !todayPlannable ? 'visit' : todayPlanned ? 'open' : 'today';

  const dayLabel = (iso: string | number) =>
    getDateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: park.timezone,
    }).format(new Date(iso));
  const planTitle =
    mode === 'visit'
      ? t('heroPlanVisit')
      : mode === 'open'
        ? t('heroOpenTodayPlan')
        : t('heroPlanToday');
  // The second line answers „for when": today's date, or when the park opens next. A
  // non-breaking space holds the line until the clock is there, so the button does not grow.
  const planSub =
    mode !== 'visit'
      ? now
        ? dayLabel(now.getTime())
        : ' '
      : park.nextSchedule?.openingTime
        ? `${t('opensOn')} ${getDateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: park.timezone }).format(new Date(park.nextSchedule.openingTime))}`
        : t('heroPlanVisitSub');

  const plan = () => {
    if (!geo || !parkPath) return;
    const date = today ?? todayInZone(park.timezone);
    if (mode === 'open') {
      openDay({ slug: park.slug, name: park.name, geo, timezone: park.timezone }, date);
      plannerUi.requestOpen('home-hero');
      // The park's own page, where the ride cards are — what the calendar's „diesen Tag planen"
      // does for the same reason.
      router.push(parkPath as '/parks/europe/germany/rust/europa-park');
      return;
    }
    // Nothing is filed here: the wizard files the day at its last step, and somebody may still
    // cancel out of it.
    if (mode === 'today') plannerPageDay.set({ parkSlug: park.slug, date });
    plannerUi.requestOpen('home-hero', 'page-park-wizard');
  };

  const isOpenNow = park.status === 'OPERATING';
  const temperature = nowcast?.currentTemperatureC ?? null;
  const weather =
    nowcast && temperature !== null
      ? getWeatherConfig(nowcast.currentWeatherCode ?? 0, nowcast.isDay)
      : null;

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {geo && (
        <PlannerPageParkBeacon
          slug={park.slug}
          name={park.name}
          geo={geo}
          timezone={park.timezone}
          backgroundImage={park.backgroundImage}
          backgroundPosition={park.backgroundPosition}
        />
      )}

      {geo && parkPath && (
        <>
          <button
            type="button"
            onClick={plan}
            data-hero-plan-today=""
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring group col-span-2 flex min-h-13 min-w-0 items-center gap-3 rounded-xl px-3.5 py-2 text-left shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:col-span-1"
          >
            <span className="bg-primary-foreground/15 flex size-9 shrink-0 items-center justify-center rounded-lg">
              <CalendarPlus className="size-5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] leading-5 font-semibold">{planTitle}</span>
              <span className="truncate text-xs leading-4 opacity-85">{planSub}</span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>

          <Link
            href={parkPath as '/parks/europe/germany/rust/europa-park'}
            prefetch={false}
            className={cn(
              TILE,
              'group col-span-2 min-h-13 flex-row items-center gap-3 sm:col-span-1'
            )}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[15px] leading-5 font-semibold">
                {t('heroParkLink')}
              </span>
              <span className="text-muted-foreground truncate text-xs leading-4">
                {isOpenNow && park.operatingAttractions != null
                  ? t('heroWelcomeAttractions', { count: park.operatingAttractions })
                  : t('h1Suffix')}
              </span>
            </span>
            <ChevronRight
              className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </>
      )}

      <InfoTile
        href={
          geo ? parkCalendarPath(locale, geo.continent, geo.country, geo.city, park.slug) : null
        }
        caption={t('heroHours')}
        // Alone in the row where there is no weather tile beside it.
        className={geo ? undefined : 'col-span-2'}
      >
        {hours ? (
          <>
            <span
              aria-hidden="true"
              className={cn(
                'size-2 shrink-0 rounded-full',
                isOpenNow ? 'bg-status-operating' : 'bg-muted-foreground/50'
              )}
            />
            <span className="truncate">
              {formatHoursRange(hours.open, hours.close, locale, park.timezone)}
            </span>
            <span className="sr-only">{isOpenNow ? tCommon('open') : tCommon('closed')}</span>
          </>
        ) : (
          <>
            <Clock className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{schedule ? t('status.CLOSED') : '—'}</span>
          </>
        )}
      </InfoTile>

      {geo && (
        <InfoTile href={`/${locale}${parkPath}#weather`} plain caption={t('weatherLabel')}>
          {weather && temperature !== null ? (
            <>
              <weather.icon className={cn('size-4 shrink-0', weather.color)} aria-hidden="true" />
              <span className="truncate">{Math.round(temperature)} °C</span>
            </>
          ) : weatherPending ? (
            <span aria-hidden="true" className="bg-muted-foreground/15 h-3.5 w-14 rounded" />
          ) : (
            <span className="truncate">—</span>
          )}
        </InfoTile>
      )}
    </div>
  );
}

/**
 * A caption and a value, as a link to where the value is given in full.
 *
 * `plain` renders a bare `<a>` for a fragment on the park page: its tab router listens for
 * `hashchange`, which next-intl's `pushState` navigation never fires on arrival — a plain anchor
 * to another document is an ordinary navigation, and the router reads the hash on mount.
 */
function InfoTile({
  href,
  plain = false,
  caption,
  className,
  children,
}: {
  href: string | null;
  plain?: boolean;
  caption: string;
  className?: string;
  children: React.ReactNode;
}) {
  const body = (
    <>
      <span className="text-muted-foreground truncate text-xs leading-4">{caption}</span>
      <span className="flex h-5 min-w-0 items-center gap-1.5 text-sm leading-5 font-semibold tabular-nums">
        {children}
      </span>
    </>
  );
  if (!href) return <div className={cn(TILE, className)}>{body}</div>;
  if (plain) {
    return (
      <a href={href} className={cn(TILE, className)}>
        {body}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={false} className={cn(TILE, className)}>
      {body}
    </Link>
  );
}
