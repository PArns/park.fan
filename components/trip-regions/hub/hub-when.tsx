import { getTranslations } from 'next-intl/server';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { buttonLinkProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { formatWindow, yearLine } from '@/lib/trip-regions/hub-data';
import { tripRegionBestTimePath } from '@/lib/trip-regions/paths';
import { plannerHrefOn } from '@/lib/trip-regions/plan-query';
import { windowReasons } from '@/lib/trip-regions/plan-when';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { regionOrShared } from '@/lib/trip-regions/region-words';
import type { TripWhenWindow } from '@/lib/trip-regions/types';

/** How many windows the teaser names. */
export const HUB_WHEN_WINDOWS = 3;

/** Below this share of the line a month has no room for its name. */
const MONTH_LABEL_MIN_WIDTH = 4;

/** The numbered dot a window carries on its card and on the year line. */
const RANK_DOT =
  'bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums';

/**
 * The year line over the teaser's cards: the months of the searched range as a ruled track and
 * each window as a bar under its numbered dot, so a reader sees where in the year the three trips
 * lie before reading a date. Decoration (`aria-hidden`): every date is on a card.
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
            className="absolute top-0 h-2"
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
        {line.months.map((month) => (
          <span
            key={month.month}
            className="border-foreground/15 text-muted-foreground absolute top-0 overflow-hidden border-l pl-1 text-[11px] leading-4 whitespace-nowrap"
            style={{ left: `${month.left}%`, width: `${month.width}%` }}
          >
            {month.width >= MONTH_LABEL_MIN_WIDTH && (
              <>
                <span className="sm:hidden">
                  {monthName.format(new Date(`${month.month}-01T00:00:00Z`)).slice(0, 1)}
                </span>
                <span className="max-sm:hidden">
                  {monthName.format(new Date(`${month.month}-01T00:00:00Z`))}
                </span>
              </>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * The best-time chapter's body, the teaser of the region's best-time pages: a year line with the
 * quietest trip windows for the headliner parks on it, then a card per window with its place, its
 * dates, its peak wait as the card's large figure, the first reason it was picked (where the cards
 * differ in it) and "Plan this
 * trip", which opens the planner on that window (`?from=&to=#planner`, the query Parky builds).
 * One figure and no second baseline; where a figure comes from is the questions' and the
 * best-time page's to say. The year strip, the weeks and their questions live on the best-time
 * page, linked under the cards in other words than the chapter's title. The page draws the chapter
 * only for a region with best-time pages and its words for them.
 */
export async function HubWhen({
  region,
  windows,
  range,
  pagePath,
  locale,
}: {
  region: string;
  /** The windows to name, quietest first; empty when `/when` gave none. */
  windows: readonly TripWhenWindow[];
  /** The days `/when` searched, for the year line; `null` when it gave no answer. */
  range: { from: string; to: string } | null;
  /** The page the planner is on: the hub or the month page. */
  pagePath: string;
  locale: string;
}) {
  const [t, tHub, tWhen, tWhenOwn] = await Promise.all([
    getTranslations('tripHub.when'),
    getTranslations('tripHub'),
    getTranslations('tripPlanner.when'),
    getRegionTranslations(region, 'planner.when'),
  ]);
  const bestTimeLink = (
    <Link
      href={tripRegionBestTimePath(region, locale)}
      className="text-primary-ink inline-flex min-h-11 items-center gap-1 font-semibold underline-offset-4 hover:underline sm:min-h-0"
    >
      {t('allWeeks')}
      <ArrowRight aria-hidden className="size-4" />
    </Link>
  );
  // One reason on every card is a line said three times; it stands only where the cards differ.
  const sameReason = new Set(windows.map((w) => windowReasons(w)[0])).size === 1;
  if (windows.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">{t('none')}</p>
        {bestTimeLink}
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {range && <YearLine range={range} windows={windows} locale={locale} />}
      <ol className="grid gap-4 sm:grid-cols-3">
        {windows.map((window) => {
          const reason = sameReason ? undefined : windowReasons(window)[0];
          return (
            <li key={window.from} className="flex">
              <Card className="hover:border-primary/40 relative flex w-full flex-col gap-4 overflow-hidden p-5 transition-[border-color,translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <span aria-hidden className={cn(RANK_DOT, 'size-7 text-sm')}>
                    {window.rank}
                  </span>
                  <h3 className="text-xl font-bold">
                    <time dateTime={window.from}>{formatWindow(window, locale)}</time>
                  </h3>
                </div>
                <div>
                  <p className="text-4xl leading-none font-bold tabular-nums">
                    {tHub('glance.minutes', { minutes: window.headlinerWait })}
                  </p>
                  <p className="text-muted-foreground mt-1.5 text-sm">{tHub('dataset.varWait')}</p>
                </div>
                {reason && (
                  <p className="text-sm">{regionOrShared(tWhenOwn, tWhen, `reason.${reason}`)}</p>
                )}
                <Link
                  href={plannerHrefOn(pagePath, { from: window.from, to: window.to })}
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
      {bestTimeLink}
    </div>
  );
}
