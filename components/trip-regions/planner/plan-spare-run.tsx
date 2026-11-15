'use client';

import { useId } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Plus, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatShortDuration } from '@/lib/utils/duration';
import { formatParkDay, formatParkDayRange } from '@/lib/utils/park-day';
import { findLeg } from '@/lib/trip-regions/hub-data';
import type { PlanDay, TripPlan } from '@/lib/trip-regions/plan';
import { parkCode, spareSuggestions, type SpareSuggestion } from '@/lib/trip-regions/plan-week';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanDayGlow } from './plan-day-glow';
import { useBaseName } from './plan-place-words';
import { useMoveWords } from './plan-stay-band';

/**
 * A run of free days (`spare`, consecutive, in one city) as one card: the dates and how many, the
 * days as small tiles, „Hier braucht der Plan keinen Park“ and up to three parks to add
 * (`spareSuggestions`): a park the visitor did not choose from the API's `spareDayParks`, else one
 * more day of a planned park the city reaches. „Dazu“ hands the suggestion to `onFill`, which puts
 * the park in the plan on that date. A tile, or the head of a single free day, opens the day's
 * sheet. `compact` is the Week view's panel: the same card without its frame.
 */
export function PlanSpareRun({
  days,
  plan,
  calendar,
  onOpenDay,
  onFill,
  compact = false,
}: {
  days: readonly PlanDay[];
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string) => void;
  onFill: (suggestion: SpareSuggestion) => void;
  compact?: boolean;
}) {
  const t = useTranslations('tripPlanner.spare');
  const { locale, region } = usePlanContext();
  const baseName = useBaseName();
  const id = useId();
  const first = days[0];
  if (!first) return null;
  const last = days.at(-1) ?? first;
  const city = (region.bases?.length ?? 0) > 0 && first.base ? baseName(first.base) : null;
  const single = days.length === 1;
  const when = single
    ? formatParkDay(locale, first.date, { weekday: 'short', day: 'numeric', month: 'short' })
    : formatParkDayRange(locale, first.date, last.date, { day: 'numeric', month: 'short' });
  const title = single
    ? t(city ? 'titleIn' : 'title', { date: when, city: city ?? '' })
    : t(city ? 'runTitleIn' : 'runTitle', { range: when, count: days.length, city: city ?? '' });
  const suggestions = spareSuggestions(days, plan, calendar, region.bases);

  return (
    <section
      aria-labelledby={id}
      data-plan-spare-run={days.length}
      className={cn(
        'flex flex-col gap-3',
        compact
          ? 'h-full overflow-y-auto p-2'
          : 'border-border/60 bg-muted/20 relative rounded-2xl border p-4'
      )}
    >
      <h4 id={id} className={cn('font-semibold', compact ? 'text-sm' : 'text-base')}>
        {single ? (
          <button
            type="button"
            onClick={() => onOpenDay(first.date)}
            className={cn(
              'hover:text-primary-ink -m-1 flex min-h-11 items-center gap-2 rounded-md p-1 text-left lg:min-h-0',
              PLAN_FOCUS
            )}
          >
            <Sun className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
            {title}
          </button>
        ) : (
          <span className="flex items-center gap-2">
            <Sun className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
            {title}
          </span>
        )}
      </h4>
      {!single && (
        <ol className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
          {days.map((day) => (
            <li key={day.date}>
              <button
                type="button"
                onClick={() => onOpenDay(day.date)}
                aria-label={`${formatParkDay(locale, day.date, { weekday: 'long', day: 'numeric', month: 'long' })}, ${t('day')}`}
                className={cn(
                  'border-border/60 bg-background hover:bg-accent/40 flex min-h-11 w-full flex-col items-center justify-center rounded-lg border text-xs leading-tight tabular-nums transition-colors',
                  PLAN_FOCUS
                )}
              >
                <span className="text-muted-foreground">
                  {formatParkDay(locale, day.date, { weekday: 'short' })}
                </span>
                <span className="font-semibold">
                  {formatParkDay(locale, day.date, { day: 'numeric' })}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
      <PlanSpareSuggestions
        days={days}
        suggestions={suggestions}
        onFill={onFill}
        compact={compact}
      />
      {!compact && <PlanDayGlow date={days.map((d) => d.date)} />}
    </section>
  );
}

/**
 * What free days could take, as a list: „Hier braucht der Plan keinen Park“, then each suggestion
 * with the park's photo, its day, its minutes, the way from the city and „Dazu“. The free day's
 * sheet shows the same list for its one date.
 */
export function PlanSpareSuggestions({
  days,
  suggestions,
  onFill,
  compact = false,
}: {
  days: readonly Pick<PlanDay, 'date' | 'base'>[];
  suggestions: readonly SpareSuggestion[];
  onFill: (suggestion: SpareSuggestion) => void;
  compact?: boolean;
}) {
  const t = useTranslations('tripPlanner.spare');
  const { locale, parkName, parkBySlug, photos, region, state, live } = usePlanContext();
  const moveWords = useMoveWords();
  const tMove = useTranslations('tripPlanner.move');
  const base = region.bases?.find((b) => b.key === days[0]?.base);
  const way = (slug: string) => {
    const leg =
      base?.parks.find((p) => p.slug === slug) ??
      (state.area ? findLeg(region.travel.legs, `hotel:${state.area}`, slug) : null);
    if (!leg) return null;
    const duration = formatShortDuration(leg.minutes, locale);
    if (leg.mode === 'walk') return t('walk', { duration });
    return tMove.has(`mode.${leg.mode}`)
      ? t('way', { mode: moveWords.mode(leg.mode), duration })
      : duration;
  };

  if (suggestions.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('leadNone')}</p>;
  }
  return (
    <>
      <p className="text-muted-foreground text-sm">{t('lead', { count: days.length })}</p>
      <ul className="flex flex-col gap-2">
        {suggestions.map((s) => {
          const name = parkName(s.slug);
          const shown = s.planned > 0 ? t('more', { park: name }) : name;
          const date = formatParkDay(locale, s.date, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          });
          const line = [s.wait != null ? t('at', { date, minutes: s.wait }) : date, way(s.slug)]
            .filter(Boolean)
            .join(' · ');
          const photo = photos[s.slug];
          const park = parkBySlug.get(s.slug);
          return (
            <li
              key={`${s.slug}@${s.date}`}
              className="border-border/60 bg-background flex items-center gap-3 rounded-xl border p-2"
              data-plan-spare-suggestion={s.slug}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'bg-primary/10 text-primary-ink relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold',
                  compact ? 'size-9' : 'size-12'
                )}
              >
                {photo ? (
                  <Image
                    src={photo.src}
                    alt=""
                    fill
                    sizes="48px"
                    quality={60}
                    style={{ objectFit: 'cover', objectPosition: photo.position }}
                  />
                ) : park ? (
                  parkCode(park)
                ) : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-medium">{shown}</span>
                <span className="text-muted-foreground truncate text-xs tabular-nums">{line}</span>
              </span>
              <button
                type="button"
                disabled={!live}
                onClick={() => onFill(s)}
                aria-label={t('addLabel', { park: name, date })}
                className={cn(
                  'border-border/70 hover:bg-accent inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50 lg:min-h-9',
                  PLAN_FOCUS
                )}
              >
                <Plus className="size-4" aria-hidden="true" />
                {t('add')}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
