'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Car, CircleAlert, Lock, MoonStar, Sparkles, Sunrise } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatShortDuration } from '@/lib/utils/duration';
import { formatParkDay } from '@/lib/utils/park-day';
import { formatGridTime } from '@/lib/planner/park-time';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { lockOn, type PlanDay, type TripPlan } from '@/lib/trip-regions/plan';
import { cardWarnings, dayWhy, earlyPerk, parkStreakAt } from '@/lib/trip-regions/plan-copy';
import {
  calendarCell,
  dayRunnerUp,
  parkCode,
  parkMinuteOf,
  planTimeMinute,
  shownDayWait,
} from '@/lib/trip-regions/plan-week';
import { regionOrShared } from '@/lib/trip-regions/region-words';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { useDayMarkerText, useDayParks, useEveningName } from './plan-day-bits';
import { useBaseName } from './plan-place-words';
import { MoveIcon, useMoveWords } from './plan-stay-band';

/** A fact chip on a day card: never a button, and never colour alone, so each carries an icon. */
const CARD_CHIP = 'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs';
/** What the hotel and the evening add to a day: the primary tint. */
const CHIP_PLUS = 'bg-primary/10 text-primary-ink';
/** What costs the day something: the crowd scale's high ink, as the sheet's warnings. */
const CHIP_WARN = 'bg-crowd-high/12 text-crowd-ink-high';

/**
 * A park day as a card, the Days view's unit in every region: the park's photo with the date, its
 * crowd level (`CrowdLevelBadge`) and, for a repeat, which visit it is; under it the peak wait, the
 * way from the hotel, two sentences on why this day (the API's reason, then the runner-up day in
 * the same figure the card shows, `dayRunnerUp`) and chips for what changes the day: the hotel's
 * early slot, the evening, and the warnings in the crowd ink. A press on the photo or the text
 * opens the day's sheet. Without a photo the head is a tinted field with the park's code.
 *
 * Editing goes through two slots, so the card itself stays the plan's picture:
 * - `actions`: the row under the card's text, behind a hairline, for the day's own controls
 *   (Festhalten, Tauschen, Mehr). Each control names the park and the date in its label
 *   („Tokyo DisneySea am Di., 19. Jan. festhalten“) and sits outside the card's main button.
 * - `hint`: one line under the actions, for what somebody suggests about this day (Parky's idea
 *   with its own button). It is not part of the card's name.
 * `added` marks a park the visitor just put on a free day („neu“); a pinned day („fest“, with the
 * lock) is read from the state's pins.
 */
export function PlanDayCard({
  day,
  plan,
  calendar,
  onOpen,
  added = false,
  actions,
  hint,
}: {
  day: PlanDay;
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpen: (date: string) => void;
  added?: boolean;
  actions?: ReactNode;
  hint?: ReactNode;
}) {
  const t = useTranslations('tripPlanner');
  const tRegion = useTranslations('tripRegion.planner');
  const tLevel = useTranslations('parks.crowdLevels');
  const { locale, timeZone, state, photos, parkBySlug, parkName, region } = usePlanContext();
  const parksOf = useDayParks();
  const markerText = useDayMarkerText();
  const eveningOf = useEveningName();
  const moveWords = useMoveWords();
  const baseName = useBaseName();

  const first = day.parks[0];
  const name = parksOf(day);
  const wait = shownDayWait(day, calendar);
  const level = day.crowdLevel ?? first?.crowdLevel ?? null;
  const pinned = lockOn(state, day.date) !== null;
  const photo = first ? photos[first.slug] : undefined;
  const park = first ? parkBySlug.get(first.slug) : undefined;
  const dates = first ? (plan.parks.find((p) => p.slug === first.slug)?.dates ?? []) : [];
  const visit = dates.length > 1 ? [...dates].sort().indexOf(day.date) + 1 : 0;
  const date = formatParkDay(locale, day.date, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const short = (d: string) =>
    formatParkDay(locale, d, { weekday: 'short', day: 'numeric', month: 'short' });

  const why = dayWhy(day, dayRunnerUp(day, plan, calendar, region.bases));
  const reason = why.reason
    ? regionOrShared(tRegion, t, `reason.${why.reason}`, {
        park: first ? parkName(first.slug) : '',
      })
    : null;
  const RUNNER_KEY = {
    more: 'runnerMore',
    less: 'runnerLess',
    same: 'runnerSame',
    close: 'runnerClose',
  } as const;
  const runner = why.runner
    ? t(`result.card.${RUNNER_KEY[why.runner.kind]}`, {
        date: short(why.runner.date),
        delta: why.runner.delta,
      })
    : null;

  const travel = day.kind === 'park' ? day.travel : undefined;
  const way = travel
    ? travel.transferMinutes != null
      ? t('result.card.fromHotelTransfer', {
          duration: formatShortDuration(travel.minutes, locale),
          transfer: formatShortDuration(travel.transferMinutes, locale),
        })
      : t('result.card.fromHotel', { duration: formatShortDuration(travel.minutes, locale) })
    : null;

  const move = day.move;
  const moveLine =
    move?.when === 'morning' && day.startAt
      ? t('result.card.moveMorning', { time: moveWords.time(day.startAt) })
      : move?.when === 'evening'
        ? t('move.then', { city: baseName(move.to), time: moveWords.time(move.departAt) })
        : null;

  const chips: Array<{ key: string; icon: ReactNode; text: string; tone: string }> = [];
  const early = earlyPerk(day.perks);
  const earlyName = early && t.has(`marker.early.${early}`) ? t(`marker.early.${early}`) : null;
  if (earlyName && first) {
    const cell = calendarCell(calendar, first.slug, day.date);
    const opens = cell?.opensAt ? parkMinuteOf(cell.opensAt, day.date, timeZone) : null;
    const earlier = cell?.early ? parkMinuteOf(cell.early.opensAt, day.date, timeZone) : null;
    const minutes = opens !== null && earlier !== null ? opens - earlier : 0;
    chips.push({
      key: 'early',
      icon: <Sunrise className="size-3.5 shrink-0" aria-hidden="true" />,
      text: minutes > 0 ? t('result.card.early', { name: earlyName, minutes }) : earlyName,
      tone: CHIP_PLUS,
    });
  }
  const evening = eveningOf(day);
  if (evening && day.evening) {
    const from = planTimeMinute(day.evening.from, day.date, timeZone);
    chips.push({
      key: 'evening',
      icon: <MoonStar className="size-3.5 shrink-0" aria-hidden="true" />,
      text:
        from === null
          ? t('evening.plus', { name: evening })
          : t('result.card.evening', { name: evening, time: formatGridTime(from) }),
      tone: CHIP_PLUS,
    });
  }
  for (const code of cardWarnings(day)) {
    const text =
      code === 'outside_ticket' || code === 'closes'
        ? markerText(day, calendar)
        : code === 'long_streak'
          ? t('result.card.streak', { count: parkStreakAt(plan.days, day.date) })
          : code === 'long_day_trip'
            ? travel
              ? t('result.card.dayTrip', {
                  mode: moveWords.mode(travel.mode),
                  duration: formatShortDuration(travel.minutes, locale),
                })
              : null
            : code === 'repeat_back_to_back' || code === 'adjacent_repeat'
              ? t('result.card.repeat')
              : code === 'hours_not_published'
                ? t('week.noHours')
                : t('result.card.noForecast');
    if (text)
      chips.push({
        key: code,
        icon: <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />,
        text,
        tone: CHIP_WARN,
      });
  }

  const label = [
    formatParkDay(locale, day.date, { weekday: 'long', day: 'numeric', month: 'long' }),
    name,
    visit > 0 ? t('result.card.visit', { count: visit }) : null,
    wait != null ? t('peakWait', { minutes: wait }) : null,
    level && level !== 'unknown' ? tLevel(level) : null,
    pinned ? t('marker.pinned') : null,
    added ? t('result.card.added') : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <article
      aria-label={[date, name, visit > 0 ? t('result.card.visit', { count: visit }) : null]
        .filter(Boolean)
        .join(', ')}
      data-plan-day-card={day.kind}
      className={cn(
        'bg-card flex flex-col overflow-hidden rounded-2xl border shadow-xs',
        pinned || added ? 'border-primary/60 ring-primary/30 ring-1' : 'border-border/60'
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(day.date)}
        aria-label={`${label}. ${t('result.card.details')}`}
        className={cn(
          'group flex flex-col text-left transition-colors focus-visible:ring-inset',
          PLAN_FOCUS
        )}
      >
        <span className="relative block h-28 w-full overflow-hidden lg:h-32" aria-hidden="true">
          {photo ? (
            <Image
              src={photo.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 420px, 100vw"
              quality={70}
              className="transition-transform duration-300 motion-safe:group-hover:scale-[1.02]"
              style={{ objectFit: 'cover', objectPosition: photo.position }}
            />
          ) : (
            <span className="from-primary/25 to-primary/5 absolute inset-0 flex items-start justify-end bg-gradient-to-b p-3">
              <span className="text-primary-ink/25 text-6xl leading-none font-black">
                {park ? parkCode(park) : ''}
              </span>
            </span>
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" />
          <span className="absolute top-2.5 left-3 flex items-center gap-1.5">
            <span className="rounded-md bg-black/50 px-2 py-0.5 text-xs font-semibold text-white">
              {date}
            </span>
            {pinned && (
              <span
                className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                data-plan-pinned=""
              >
                <Lock className="size-3" />
                {t('marker.pinned')}
              </span>
            )}
            {added && (
              <span className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold">
                <Sparkles className="size-3" />
                {t('result.card.added')}
              </span>
            )}
          </span>
          {level && level !== 'unknown' && (
            <CrowdLevelBadge level={level} className="absolute top-2.5 right-3 shadow-sm" />
          )}
          <span className="absolute inset-x-3 bottom-2 flex items-end gap-2 text-white">
            <span className="min-w-0 flex-1 truncate text-lg leading-tight font-semibold drop-shadow-sm">
              {name}
            </span>
            {visit > 0 && (
              <span className="shrink-0 text-xs opacity-90">
                {t('result.card.visit', { count: visit })}
              </span>
            )}
          </span>
        </span>
        <span className="flex flex-col gap-2 px-4 pt-3 pb-3.5" aria-hidden="true">
          {moveLine && move && (
            <span className="text-primary-ink flex items-center gap-1.5 text-xs font-medium">
              <MoveIcon mode={move.mode} className="size-3.5 shrink-0" />
              {moveLine}
            </span>
          )}
          <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <span className="text-sm tabular-nums">
              {wait != null
                ? t.rich('result.card.peak', {
                    minutes: wait,
                    strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
                  })
                : t('week.noFigure')}
            </span>
            {way && (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs tabular-nums">
                <Car className="size-3.5 shrink-0" />
                {way}
              </span>
            )}
          </span>
          {(reason || runner) && (
            <span className="text-sm leading-relaxed">
              {[reason, runner].filter(Boolean).join(' ')}
            </span>
          )}
          {chips.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <span key={chip.key} className={cn(CARD_CHIP, chip.tone)} data-plan-chip={chip.key}>
                  {chip.icon}
                  <span className="truncate">{chip.text}</span>
                </span>
              ))}
            </span>
          )}
        </span>
      </button>
      {actions && <div className="border-border/60 border-t px-2 py-1">{actions}</div>}
      {hint && <div className="border-border/60 border-t px-3 py-2">{hint}</div>}
    </article>
  );
}
