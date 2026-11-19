'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { buttonLinkProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { daysBetween } from '@/lib/utils/park-day';
import { BEST_TIME_WINDOWS, whenQueryFor } from '@/lib/trip-regions/best-time';
import { formatWindow, yearLine } from '@/lib/trip-regions/hub-data';
import { fetchTripWhen } from '@/lib/trip-regions/plan-fetch';
import { plannerHrefOn } from '@/lib/trip-regions/plan-query';
import { trackTripEvent } from '@/lib/trip-regions/plan-analytics';
import { climateChips } from '@/lib/trip-regions/plan-copy';
import { aheadForWeather, windowReasons, type WhenReasonCode } from '@/lib/trip-regions/plan-when';
import type { TripWhenWindow } from '@/lib/trip-regions/types';
import { ClimateChips } from '@/components/trip-regions/planner/plan-day-bits';
import { HubFilterChip } from './hub-filter-chip';

/** Below this share of the line a month has no room for its name. */
const MONTH_LABEL_MIN_WIDTH = 4;

/** The numbered dot a window carries on its card and on the year line. */
const RANK_DOT =
  'bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums';

/** One choice of the teaser's first switch: a best-time page of the region and the parks it plans. */
export interface HubWhenScope {
  /** The best-time page's id (`region`, `disney-world`). */
  id: string;
  /** The resorts by their short words, "Disney and Universal". */
  label: string;
  /** The headliner parks the trip visits, by slug. */
  parks: string[];
  /** The trip lengths offered for these parks, the page's own first. */
  lengths: number[];
  /** The scope's best-time page, locale-relative. */
  href: string;
  /** Whether the planner needs the parks named: not for the region's own headliners. */
  namesParks: boolean;
}

/** What the teaser shows for one choice: its windows, or that the read failed. */
type Answer = readonly TripWhenWindow[] | 'failed';

/**
 * The place of the year line and the three cards while the served answer streams in, per
 * breakpoint, as Orlando's answer draws them (docs/features/orlando-hub.md).
 */
const PENDING_ANSWER = 'h-[924px] sm:h-[492px] md:h-[444px] lg:h-[386px]';

/**
 * The year line over the teaser's cards: the months of the searched range as a ruled track and
 * each window as a bar under its numbered dot, so a reader sees where in the year the trips lie
 * before reading a date. Decoration (`aria-hidden`): every date is on a card.
 */
function YearLine({
  range,
  windows,
  locale,
}: {
  range: { from: string; to: string };
  windows: readonly TripWhenWindow[];
  locale: string;
}) {
  const line = yearLine(range, windows);
  const monthName = getDateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  return (
    <div aria-hidden className="border-border/60 bg-muted/30 rounded-2xl border px-4 pt-9 pb-3">
      <div className="relative">
        <div className="bg-foreground/10 h-2 rounded-full" />
        {line.windows.map((span, i) => (
          <div
            key={windows[i].from}
            className="absolute top-0 h-2 transition-[left,width] duration-300 ease-out motion-reduce:transition-none"
            style={{ left: `${span.left}%`, width: `${span.width}%` }}
          >
            <div className="bg-primary h-full min-w-1.5 rounded-full" />
            <span
              className={cn(
                RANK_DOT,
                'absolute bottom-full left-1/2 mb-1.5 size-5 -translate-x-1/2 text-[11px]'
              )}
            >
              {windows[i].rank}
            </span>
          </div>
        ))}
      </div>
      <div className="relative mt-2 h-4">
        {line.months.map((month) => {
          const name = monthName.format(new Date(`${month.month}-01T00:00:00Z`));
          return (
            <span
              key={month.month}
              className="border-foreground/15 text-muted-foreground absolute top-0 overflow-hidden border-l pl-1 text-[11px] leading-4 whitespace-nowrap"
              style={{ left: `${month.left}%`, width: `${month.width}%` }}
            >
              {month.width >= MONTH_LABEL_MIN_WIDTH && (
                <>
                  <span className="sm:hidden">{name.slice(0, 1)}</span>
                  <span className="max-sm:hidden">{name}</span>
                </>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The best-time chapter's body on a hub: two switches, then a year line and a card per trip. The
 * first switch picks the parks (the region's best-time pages: every big resort, or one), the
 * second the trip's length, which starts at a day per park plus arrival and departure. The
 * served HTML holds the region's own answer; another choice is read through the relay once and
 * kept, the cards dimmed while it loads. Each card has its place, its dates and their length, its
 * peak wait as the large figure, the first reason it was picked (where the cards differ in it),
 * why it stands above a trip with a shorter wait (`aheadForWeather`), the storm season or heat
 * as chips
 * and "Plan this trip", which opens the planner on those dates and parks. The link under the
 * cards goes to the chosen parks' best-time page. Without `initial` it is the chapter's
 * `<Suspense>` fallback: the switches and the link, and the cards' place held.
 */
export function HubWhenTeaser({
  region,
  scopes,
  initial,
  range,
  reasons,
  pagePath,
  locale,
}: {
  region: string;
  /** The choices of the first switch, the region's own page first; never empty. */
  scopes: readonly HubWhenScope[];
  /** The served answer: the first scope at its own length; `null` while it streams in. */
  initial: readonly TripWhenWindow[] | null;
  /** The days `/when` searches. */
  range: { from: string; to: string };
  /** Why a window was picked, in the region's words, by the API's code. */
  reasons: Readonly<Record<WhenReasonCode, string>>;
  /** The page the planner is on: the hub or the month page. */
  pagePath: string;
  locale: string;
}) {
  const t = useTranslations('tripHub.when');
  const tGlance = useTranslations('tripHub.glance');
  const tData = useTranslations('tripHub.dataset');
  const firstKey = `${scopes[0].id}:${scopes[0].lengths[0]}`;
  // `held` is the last choice with an answer: its cards stay under one that is still loading.
  const [choice, setChoice] = useState({
    scope: scopes[0].id,
    days: scopes[0].lengths[0],
    held: firstKey,
  });
  const key = `${choice.scope}:${choice.days}`;
  const [answers, setAnswers] = useState<Record<string, Answer>>(
    initial ? { [firstKey]: initial } : {}
  );
  const pending = initial === null;
  const scope = scopes.find((s) => s.id === choice.scope) ?? scopes[0];
  const answer = answers[key];
  const pick = (scopeId: string, days: number) => {
    if (scopeId === choice.scope && days === choice.days) return;
    trackTripEvent(region, 'trip_best_time_switch', {
      scope: scopeId,
      days,
      changed: scopeId === choice.scope ? 'days' : 'parks',
    });
    setChoice({ scope: scopeId, days, held: answer ? key : choice.held });
  };

  useEffect(() => {
    if (answer || pending) return;
    const controller = new AbortController();
    fetchTripWhen(region, whenQueryFor(scope.parks, range, choice.days), controller.signal)
      .then((when) =>
        setAnswers((all) => ({
          ...all,
          [key]: when.windows.slice(0, initial?.length || BEST_TIME_WINDOWS),
        }))
      )
      .catch((error: unknown) => {
        if ((error as Error)?.name === 'AbortError') return;
        setAnswers((all) => ({ ...all, [key]: 'failed' }));
      });
    return () => controller.abort();
  }, [answer, pending, choice.days, initial?.length, key, range, region, scope.parks]);

  const shown = answer ?? answers[choice.held] ?? initial ?? [];
  const windows = shown === 'failed' ? [] : shown;
  const loading = !answer;
  // One reason on every card is a line said three times; it stands only where the cards differ.
  const sameReason = new Set(windows.map((w) => windowReasons(w)[0])).size === 1;
  const ahead = aheadForWeather(windows);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {scopes.length > 1 && (
          <div
            role="group"
            aria-label={t('scopeLabel')}
            className="-mr-4 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto pr-4 sm:mr-0 sm:flex-wrap sm:overflow-visible sm:pr-0"
          >
            {scopes.map((s) => (
              <HubFilterChip
                key={s.id}
                pressed={s.id === scope.id}
                onClick={() => pick(s.id, s.lengths[0])}
              >
                {t('scope', { resorts: s.label, count: s.parks.length })}
              </HubFilterChip>
            ))}
          </div>
        )}
        {scope.lengths.length > 1 && (
          <div
            role="group"
            aria-label={t('lengthLabel')}
            className="flex flex-wrap items-center gap-2"
          >
            {scope.lengths.map((days) => (
              <HubFilterChip
                key={days}
                pressed={days === choice.days}
                onClick={() => pick(scope.id, days)}
              >
                {t('length', { days })}
              </HubFilterChip>
            ))}
          </div>
        )}
      </div>

      <div
        aria-busy={loading}
        aria-live="polite"
        className={cn(
          'space-y-5 transition-opacity duration-200',
          loading && 'opacity-50 motion-reduce:opacity-100'
        )}
      >
        {pending ? (
          <div className={PENDING_ANSWER} />
        ) : windows.length === 0 ? (
          <p className="text-muted-foreground">{t('none')}</p>
        ) : (
          <>
            <YearLine range={range} windows={windows} locale={locale} />
            <ol className="grid gap-4 sm:grid-cols-3">
              {windows.map((window) => {
                const reason = sameReason ? undefined : windowReasons(window)[0];
                const before = ahead.get(window.rank);
                const climate = climateChips(window.warnings);
                return (
                  <li key={window.rank} className="flex">
                    <Card className="hover:border-primary/40 relative flex w-full flex-col gap-4 overflow-hidden p-5 transition-[border-color,translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <span aria-hidden className={cn(RANK_DOT, 'size-7 text-sm')}>
                          {window.rank}
                        </span>
                        <h3 className="text-xl font-bold">
                          <time dateTime={window.from}>{formatWindow(window, locale)}</time>
                        </h3>
                        <Badge variant="outline" className="ml-auto shrink-0 tabular-nums">
                          {t('length', { days: daysBetween(window.from, window.to) + 1 })}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-4xl leading-none font-bold tabular-nums">
                          {tGlance('minutes', { minutes: window.headlinerWait })}
                        </p>
                        <p className="text-muted-foreground mt-1.5 text-sm">{tData('varWait')}</p>
                      </div>
                      {(reason || before || climate.length > 0) && (
                        <div className="space-y-2 text-sm">
                          {reason && <p>{reasons[reason]}</p>}
                          {before && <p>{t('ahead', before)}</p>}
                          <ClimateChips codes={climate} />
                        </div>
                      )}
                      <Link
                        href={plannerHrefOn(pagePath, {
                          from: window.from,
                          to: window.to,
                          ...(scope.namesParks ? { parks: scope.parks } : {}),
                        })}
                        rel="nofollow"
                        prefetch={false}
                        {...buttonLinkProps({
                          variant: 'outline',
                          withIcon: true,
                          className: 'mt-auto w-full',
                        })}
                      >
                        <CalendarPlus aria-hidden />
                        {t('plan')}
                      </Link>
                    </Card>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>

      <Link
        href={scope.href}
        className="text-primary-ink inline-flex min-h-11 items-center gap-1 font-semibold underline-offset-4 hover:underline sm:min-h-0"
      >
        {t('allWeeks')}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}
