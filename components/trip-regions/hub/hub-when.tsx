import { getTranslations } from 'next-intl/server';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { buttonLinkProps } from '@/components/ui/button';
import { formatWindow } from '@/lib/trip-regions/hub-data';
import { tripRegionBestTimePath } from '@/lib/trip-regions/paths';
import { plannerHrefOn } from '@/lib/trip-regions/plan-query';
import type { TripWhenWindow } from '@/lib/trip-regions/types';

/** How many windows the teaser names. */
export const HUB_WHEN_WINDOWS = 3;

/**
 * The best-time chapter's body, the teaser of the region's best-time pages: the quietest trip
 * windows for the headliner parks as cards, each with its place as a numbered dot, its dates, its
 * peak wait and "Plan this trip", which opens the planner on that window (`?from=&to=#planner`,
 * the query Parky builds). One figure and no second baseline; where a figure comes from is the
 * questions' and the best-time page's to say. The year strip, the weeks and their questions live
 * on the best-time page, linked under the cards in other words than the chapter's title. The page
 * draws the chapter only for a region with best-time pages and its words for them.
 */
export async function HubWhen({
  region,
  windows,
  pagePath,
  locale,
}: {
  region: string;
  /** The windows to name, quietest first; empty when `/when` gave none. */
  windows: readonly TripWhenWindow[];
  /** The page the planner is on: the hub or the month page. */
  pagePath: string;
  locale: string;
}) {
  const t = await getTranslations('tripHub.when');
  const bestTimeLink = (
    <Link
      href={tripRegionBestTimePath(region, locale)}
      className="text-primary-ink inline-flex min-h-11 items-center gap-1 font-semibold underline-offset-4 hover:underline sm:min-h-0"
    >
      {t('allWeeks')}
      <ArrowRight aria-hidden className="size-4" />
    </Link>
  );
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
      <ol className="grid gap-4 sm:grid-cols-3">
        {windows.map((window) => (
          <li key={window.from} className="flex">
            <Card className="flex w-full flex-col gap-4 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums"
                >
                  {window.rank}
                </span>
                <h3 className="text-xl font-bold">
                  <time dateTime={window.from}>{formatWindow(window, locale)}</time>
                </h3>
              </div>
              <p className="text-muted-foreground text-sm tabular-nums">
                {t('figure', { minutes: window.headlinerWait })}
              </p>
              <Link
                href={plannerHrefOn(pagePath, { from: window.from, to: window.to })}
                rel="nofollow"
                prefetch={false}
                {...buttonLinkProps({
                  variant: 'outline',
                  size: 'sm',
                  withIcon: true,
                  className: 'mt-auto self-start max-sm:min-h-11',
                })}
              >
                <CalendarPlus aria-hidden />
                {t('plan')}
              </Link>
            </Card>
          </li>
        ))}
      </ol>
      {bestTimeLink}
    </div>
  );
}
