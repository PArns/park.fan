'use client';

import { useId, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftRight,
  CalendarPlus,
  Car,
  Clock3,
  CloudSun,
  Lock,
  LockOpen,
  PartyPopper,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { usePlanDay } from '@/lib/hooks/use-plan-day';
import { formatClockTime, formatHoursRange } from '@/lib/utils/intl-format';
import { formatParkDay } from '@/lib/utils/park-day';
import { Temp } from '@/components/common/unit-display';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { parkGeoFromUrl } from '@/lib/planner/park-url';
import {
  climateChips,
  closesEarly,
  eveningReasons,
  dayWarnings,
  earlyPerk,
  primaryReason,
  runnerUp,
} from '@/lib/orlando/plan-copy';
import {
  calendarCell,
  daySeasons,
  hoursLessThanUsual,
  partySeason,
  swapPreview,
} from '@/lib/orlando/plan-week';
import {
  dayLockTarget,
  lockOn,
  type PlanDay,
  type PlanEvening,
  type TripPlan,
} from '@/lib/orlando/plan';
import { planTimeMinute } from '@/lib/orlando/plan-week';
import { formatGridTime } from '@/lib/planner/park-time';
import type { TripCalendar } from '@/lib/orlando/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { ClimateChips, dayGuestClose, useDayParks } from './plan-day-bits';
import { useSeasonName } from './use-day-facts';
import { PLAN_WIDE_QUERY } from './plan-setup';

/** How many of a park's headliners the sheet names: the five a day is usually judged by. */
const BIG_RIDES = 5;

/**
 * Level 2: everything about one day, on a press in any view. A bottom sheet on a phone, a panel at
 * the right edge at a desk. The one-line reason, the runner-up day and what it costs, the hours
 * with the hotel's perks, why a short day is short and how many hours it loses, the day's events
 * with their status, the drive from the hotel area, the weather where a forecast reaches, the big
 * rides of that day (the day planner's own `/plan/day`, asked only when the sheet opens), and the
 * three things to do: pin, swap with another day, and "Plan this day", which opens the day planner
 * on that park and date (Level 3).
 */
export function PlanDaySheet({
  day,
  plan,
  calendar,
  onClose,
  onToggleLock,
  onSwap,
  onPlanDay,
  returnFocus,
}: {
  day: PlanDay | null;
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onClose: () => void;
  onToggleLock: (day: PlanDay) => void;
  onSwap: (day: PlanDay, other: PlanDay) => void;
  onPlanDay: (slug: string, date: string) => void;
  /** Where the focus goes back to when the sheet closes: the day the visitor pressed. */
  returnFocus?: () => void;
}) {
  const t = useTranslations('orlandoPlanner');
  const { locale } = usePlanContext();
  const wide = useMediaQuery(PLAN_WIDE_QUERY);
  const parksOf = useDayParks();

  return (
    <Sheet open={day !== null} onOpenChange={(open) => !open && onClose()}>
      {day && (
        <SheetContent
          side={wide ? 'right' : 'bottom'}
          hideClose
          onCloseAutoFocus={(event) => {
            if (!returnFocus) return;
            event.preventDefault();
            returnFocus();
          }}
          className={cn('gap-0 p-0', wide ? 'w-full sm:max-w-md' : 'max-h-[90svh] rounded-t-2xl')}
        >
          <div className="border-border/60 flex items-start gap-2 border-b px-4 py-2">
            <div className="flex min-w-0 flex-1 flex-col py-1.5">
              <SheetDescription className="text-muted-foreground text-xs">
                {formatParkDay(locale, day.date, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </SheetDescription>
              <SheetTitle className="text-base leading-snug">
                {day.kind === 'park' || day.kind === 'hop' ? parksOf(day) : t(`day.${day.kind}`)}
              </SheetTitle>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('setup.close')}
              className={cn(
                'hover:bg-accent flex size-11 shrink-0 items-center justify-center rounded-md',
                PLAN_FOCUS
              )}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <DayDetails
              key={day.date}
              day={day}
              plan={plan}
              calendar={calendar}
              onToggleLock={onToggleLock}
              onSwap={onSwap}
              onPlanDay={onPlanDay}
            />
          </div>
        </SheetContent>
      )}
    </Sheet>
  );
}

function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm leading-snug">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

function DayDetails({
  day,
  plan,
  calendar,
  onToggleLock,
  onSwap,
  onPlanDay,
}: {
  day: PlanDay;
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onToggleLock: (day: PlanDay) => void;
  onSwap: (day: PlanDay, other: PlanDay) => void;
  onPlanDay: (slug: string, date: string) => void;
}) {
  const t = useTranslations('orlandoPlanner');
  const tSeasons = useTranslations('parks.seasons');
  const { locale, timeZone, parkName, region, state } = usePlanContext();
  const seasonName = useSeasonName();
  const [swapOpen, setSwapOpen] = useState(false);
  const swapId = useId();

  const isPark = day.kind === 'park' || day.kind === 'hop';
  const name = parkName;
  const short = (date: string) =>
    formatParkDay(locale, date, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = (iso: string) => formatClockTime(iso, locale, timeZone);
  const first = day.parks[0];
  const runner =
    isPark && day.kind === 'park' && first
      ? runnerUp(
          plan.parks.find((p) => p.slug === first.slug),
          day.headlinerWait
        )
      : null;
  // The runner-up line says the same as `runner_up_close`, with its numbers; one of the two.
  const reason = primaryReason(
    runner ? { ...day, reasons: day.reasons.filter((r) => r !== 'runner_up_close') } : day
  );
  const lock = lockOn(state, day.date);
  const canPin = dayLockTarget(day) !== null;

  const reasonText = reason ? t(`reason.${reason}`, { park: first ? name(first.slug) : '' }) : null;

  const facts: ReactNode[] = [];

  if (isPark) {
    for (const visit of day.parks) {
      const cell = calendarCell(calendar, visit.slug, day.date);
      const prefix = day.parks.length > 1 ? `${name(visit.slug)}: ` : '';
      if (cell?.opensAt && cell.closesAt) {
        const close = dayGuestClose({ ...day, parks: [visit] }, calendar) ?? cell.closesAt;
        facts.push(
          <Fact key={`hours-${visit.slug}`} icon={<Clock3 className="size-4" aria-hidden="true" />}>
            {prefix}
            {t('details.hours', { range: formatHoursRange(cell.opensAt, close, locale, timeZone) })}
            {cell.early && (
              <span className="text-muted-foreground block text-xs">
                {earlyPerk(visit.perks ?? day.perks)
                  ? t(`details.earlyYours.${cell.early.kind}`, { time: time(cell.early.opensAt) })
                  : t(`details.earlyOthers.${cell.early.kind}`, { time: time(cell.early.opensAt) })}
              </span>
            )}
            {cell.evening?.kind === 'extended_evening' && (
              <span className="text-muted-foreground block text-xs">
                {(visit.perks ?? day.perks ?? []).includes('extended_evening')
                  ? t('details.eveningYours', { time: time(cell.evening.closesAt) })
                  : t('details.eveningOthers', { time: time(cell.evening.closesAt) })}
              </span>
            )}
          </Fact>
        );
      } else {
        facts.push(
          <Fact key={`hours-${visit.slug}`} icon={<Clock3 className="size-4" aria-hidden="true" />}>
            {prefix}
            {t('details.noHours')}
          </Fact>
        );
      }

      // An earlier close always counts (owner's decision): say why, and what it costs.
      if (closesEarly(day) || cell?.evening?.kind === 'ticketed_event') {
        const party = partySeason(calendar, visit.slug, day.date);
        const less = hoursLessThanUsual(calendar, visit.slug, day.date, timeZone);
        const close = dayGuestClose({ ...day, parks: [visit] }, calendar);
        if (party || less !== null) {
          facts.push(
            <Fact
              key={`short-${visit.slug}`}
              icon={<PartyPopper className="size-4" aria-hidden="true" />}
            >
              <span className="text-crowd-ink-high font-medium">
                {party
                  ? t(party.separateTicket ? 'details.partyTicket' : 'details.party', {
                      name: seasonName(party),
                    })
                  : t('details.shortDay')}
              </span>
              {(close || less !== null) && (
                <span className="block">
                  {[
                    close ? t('details.leaveAt', { time: time(close) }) : null,
                    less !== null ? t('details.hoursLess', { hours: less }) : null,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                </span>
              )}
            </Fact>
          );
        }
      }

      const events = daySeasons(calendar, visit.slug, day.date).filter((s) => !s.separateTicket);
      if (events.length > 0) {
        facts.push(
          <Fact
            key={`events-${visit.slug}`}
            icon={<Sparkles className="size-4" aria-hidden="true" />}
          >
            {events.map((s, i) => (
              <span key={s.id} className="block">
                {i === 0 ? prefix : ''}
                {seasonName(s)}
                {s.status !== 'confirmed' && (
                  <span className="text-muted-foreground"> · {tSeasons(`status.${s.status}`)}</span>
                )}
              </span>
            ))}
          </Fact>
        );
      }
    }

    const holidays = calendar?.days.find((d) => d.date === day.date)?.holidays ?? [];
    if (holidays.length > 0) {
      facts.push(
        <Fact key="holidays" icon={<CalendarPlus className="size-4" aria-hidden="true" />}>
          {holidays.join(' · ')}
        </Fact>
      );
    }

    if (day.travel) {
      const area = region.hotelAreas.find((a) => `hotel:${a.key}` === day.travel?.from)?.name;
      facts.push(
        <Fact key="travel" icon={<Car className="size-4" aria-hidden="true" />}>
          {t(`details.travel.${day.travel.mode}`, {
            minutes: day.travel.minutes,
            area: area ?? '',
          })}
          {day.travel.transferMinutes != null && (
            <span className="block">
              {t(day.travel.via === 'ttc' ? 'details.transferTtc' : 'details.transfer', {
                minutes: day.travel.transferMinutes,
              })}
            </span>
          )}
          <span className="text-muted-foreground block text-xs">{region.travel.attribution}</span>
        </Fact>
      );
    }
    if (day.between) {
      facts.push(
        <Fact key="between" icon={<ArrowLeftRight className="size-4" aria-hidden="true" />}>
          {t(`details.between.${day.between.mode}`, { minutes: day.between.minutes })}
        </Fact>
      );
    }
  }

  const chips = climateChips(day.warnings);
  const warnings = dayWarnings(day).filter(
    (w) => w !== 'party_night_short_hours' && w !== 'closes_early'
  );

  const candidates = plan.days.filter(
    (other) =>
      other.date !== day.date &&
      dayLockTarget(other) !== null &&
      !(day.kind === 'rest' && other.kind === 'rest')
  );

  return (
    <div className="flex flex-col gap-4">
      {isPark && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {day.headlinerWait != null && (
            <span className="text-2xl font-semibold tabular-nums">
              {t('week.minutes', { minutes: day.headlinerWait })}
            </span>
          )}
          <CrowdLevelBadge level={day.crowdLevel ?? null} />
          <ClimateChips codes={chips} />
          <span className="text-muted-foreground w-full text-xs">
            {t('details.minutesCaption')}
          </span>
        </div>
      )}

      {reasonText && <p className="text-sm font-medium">{reasonText}</p>}
      {runner && (
        <p className="text-sm">
          {t(
            runner.delta > 0
              ? 'details.runnerUp'
              : runner.delta < 0
                ? 'details.runnerUpLess'
                : 'details.runnerUpSame',
            { date: short(runner.date), minutes: runner.wait, delta: Math.abs(runner.delta) }
          )}
        </p>
      )}
      {warnings.length > 0 && (
        <ul className="flex flex-col gap-1">
          {warnings.map((w) => (
            <li key={w} className="text-crowd-ink-high text-sm">
              {t(`warning.${w}`)}
            </li>
          ))}
        </ul>
      )}

      {facts.length > 0 && <ul className="flex flex-col gap-3">{facts}</ul>}

      {day.evening && <EveningSection evening={day.evening} date={day.date} />}

      {isPark && first && <DayRides slug={first.slug} date={day.date} />}

      <div className="flex flex-col gap-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            disabled={!canPin}
            aria-pressed={lock !== null}
            onClick={() => onToggleLock(day)}
          >
            {lock ? <Lock aria-hidden="true" /> : <LockOpen aria-hidden="true" />}
            {lock ? t('details.unpin') : t('details.pin')}
          </Button>
          <Button
            variant="outline"
            disabled={!canPin || candidates.length === 0}
            aria-expanded={swapOpen}
            aria-controls={swapId}
            onClick={() => setSwapOpen((open) => !open)}
          >
            <ArrowLeftRight aria-hidden="true" />
            {t('details.swap')}
          </Button>
        </div>
        <div id={swapId} hidden={!swapOpen}>
          <p className="text-muted-foreground mb-1 text-xs">{t('swap.hint')}</p>
          <ul className="divide-border/60 divide-y">
            {candidates.map((other) => {
              const preview = swapPreview(calendar, day, other, timeZone);
              const what = other.kind === 'rest' ? t('day.rest') : name(other.parks[0]?.slug ?? '');
              const cost =
                preview.kind === 'closed'
                  ? t('swap.closed', { park: name(preview.slug) })
                  : preview.kind === 'no_figure'
                    ? t('swap.noFigure')
                    : preview.delta === 0
                      ? t('swap.same')
                      : preview.delta > 0
                        ? t('swap.more', { minutes: preview.delta })
                        : t('swap.less', { minutes: -preview.delta });
              return (
                <li key={other.date}>
                  <button
                    type="button"
                    disabled={preview.kind === 'closed'}
                    onClick={() => onSwap(day, other)}
                    className={cn(
                      'hover:bg-accent/50 flex min-h-11 w-full flex-wrap items-center gap-x-3 gap-y-0.5 rounded-md px-2 py-2 text-left text-sm transition-colors disabled:opacity-50',
                      PLAN_FOCUS
                    )}
                  >
                    <span className="w-24 shrink-0 tabular-nums">{short(other.date)}</span>
                    <span className="min-w-0 flex-1 truncate">{what}</span>
                    <span className="shrink-0 font-medium tabular-nums">{cost}</span>
                    {preview.kind === 'minutes' && preview.short && (
                      <span className="text-crowd-ink-high w-full pl-27 text-xs">
                        {t('swap.short', {
                          park: name(preview.short.slug),
                          hours: preview.short.hours,
                        })}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {isPark &&
          day.parks.map((visit) => (
            <Button key={visit.slug} onClick={() => onPlanDay(visit.slug, day.date)}>
              <CalendarPlus aria-hidden="true" />
              {day.parks.length > 1
                ? t('details.planPark', { park: name(visit.slug) })
                : t('details.planDay')}
            </Button>
          ))}
      </div>
    </div>
  );
}

/**
 * The big rides of the day, by name only, and the weather, from the day planner's `/plan/day` for
 * that park and date, asked only when the sheet is open. No per-ride minutes: they come from
 * another model than the day's figure, and two numbers for one wait on one sheet read as one wrong; the planner's own cache entry, so "Plan this day" then
 * opens on an answer already there.
 */
function DayRides({ slug, date }: { slug: string; date: string }) {
  const t = useTranslations('orlandoPlanner.details');
  const { parkBySlug } = usePlanContext();
  const geo = parkGeoFromUrl(parkBySlug.get(slug)?.path);
  const { data, isPending } = usePlanDay({
    continent: geo?.continent ?? '',
    country: geo?.country ?? '',
    city: geo?.city ?? '',
    parkSlug: slug,
    date,
    enabled: geo !== null,
  });

  const rides = (data?.rides ?? [])
    .filter((r) => r.isHeadliner)
    .sort((a, b) => b.dayPeak - a.dayPeak)
    .slice(0, BIG_RIDES);
  const weather = data?.context.weather ?? null;

  return (
    <div className="flex flex-col gap-3">
      <p className="flex gap-2.5 text-sm">
        <CloudSun className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          {isPending ? (
            <span className="text-muted-foreground">{t('loading')}</span>
          ) : weather ? (
            <>
              <Temp celsius={weather.tempMin} />–<Temp celsius={weather.tempMax} withUnit />
              {weather.precipitationMm != null && weather.precipitationMm > 0 && (
                <> · {t('rain', { mm: Math.round(weather.precipitationMm) })}</>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">{t('noWeather')}</span>
          )}
        </span>
      </p>
      {rides.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-semibold">{t('rides')}</h3>
          <ol className="flex list-decimal flex-col gap-0.5 pl-5 text-sm">
            {rides.map((ride) => (
              <li key={ride.attractionSlug} className="truncate">
                {ride.attractionName}
              </li>
            ))}
          </ol>
          <p className="text-muted-foreground mt-1 text-xs">{t('ridesCaption')}</p>
        </div>
      )}
    </div>
  );
}

/**
 * The evening after the park: where, from when to when, why, its highlight, how to get there, what
 * else would do, and the venue's own page.
 */
function EveningSection({ evening, date }: { evening: PlanEvening; date: string }) {
  const t = useTranslations('orlandoPlanner.evening');
  const { parkName, venueByKey, timeZone } = usePlanContext();
  const venue = evening.venue ? venueByKey.get(evening.venue) : undefined;
  const name = evening.kind === 'hop' && evening.park ? parkName(evening.park) : venue?.name;
  const clock = (value: string) => {
    const minute = planTimeMinute(value, date, timeZone);
    return minute === null ? value : formatGridTime(minute);
  };
  const reason = eveningReasons(evening)[0];
  const highlight = evening.highlights?.find((h) => h.at) ?? evening.highlights?.[0];
  const others = (evening.alternatives ?? [])
    .map((a) => (a.park ? parkName(a.park) : a.venue ? venueByKey.get(a.venue)?.name : null))
    .filter((n): n is string => Boolean(n));

  return (
    <section className="border-border/60 flex flex-col gap-1.5 rounded-xl border p-3 text-sm">
      <h3 className="font-semibold">
        {t('title')}
        {name ? `: ${name}` : ''}
        <span className="text-muted-foreground font-normal tabular-nums">
          {' '}
          · {clock(evening.from)}–{clock(evening.to)}
        </span>
      </h3>
      {reason && <p>{t(`reason.${reason}`)}</p>}
      {highlight && (
        <p>
          {highlight.name ?? t(`highlight.${highlight.kind}`)}
          {highlight.at ? ` · ${clock(highlight.at)}` : ''}
        </p>
      )}
      {evening.travel && (
        <p className="text-muted-foreground">{t('travel', { minutes: evening.travel.minutes })}</p>
      )}
      {others.length > 0 && (
        <p className="text-muted-foreground">{t('alternatives', { names: others.join(', ') })}</p>
      )}
      {venue?.url && (
        <a
          href={venue.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-ink min-h-11 self-start py-2 font-medium underline-offset-4 hover:underline"
        >
          {t('officialSite', { name: venue.name })}
        </a>
      )}
    </section>
  );
}
