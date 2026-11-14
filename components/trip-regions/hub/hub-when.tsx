import { getTranslations } from 'next-intl/server';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { buttonLinkProps } from '@/components/ui/button';
import { getListFormat } from '@/lib/utils/intl-format';
import { bestTimeYear } from '@/lib/trip-regions/best-time';
import { formatWindow } from '@/lib/trip-regions/hub-data';
import { TRIP_PLANNER_ID, tripRegionBestTimePath } from '@/lib/trip-regions/paths';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import type { TripWhen } from '@/lib/trip-regions/types';

/** How many windows the teaser names. */
const WINDOWS_SHOWN = 3;

/**
 * The best-time chapter's body, the teaser of the region's best-time pages: the three quietest trip windows for
 * the headliner parks as one sentence and three cards, each with "Plan these dates", which opens
 * the planner on that window (`?from=&to=#planner`, the query Parky builds). A window past the
 * forecast is last year's measured crowds and says so. The year strip, the weeks and their
 * questions live on the best-time page this links to, so the two do not compete for one query.
 */
export async function HubWhen({
  region,
  when,
  pagePath,
  locale,
}: {
  region: string;
  when: TripWhen | null;
  /** The page the planner is on: the hub or the month page. */
  pagePath: string;
  locale: string;
}) {
  const t = await getTranslations('tripHub.when');
  const tRegion = await getRegionTranslations(region, 'hub.when');
  const windows = (when?.windows ?? []).slice(0, WINDOWS_SHOWN);
  const year = when ? bestTimeYear(when.meta.from) : null;
  const bestTimeLink = (
    <Link
      href={tripRegionBestTimePath(region, locale)}
      className="text-primary-ink inline-flex min-h-11 items-center gap-1 font-semibold underline-offset-4 hover:underline sm:min-h-0"
    >
      {year ? tRegion('pageLink', { year }) : tRegion('pageLinkNoYear')}
      <ArrowRight aria-hidden className="size-4" />
    </Link>
  );
  if (!when || windows.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">{t('none')}</p>
        {bestTimeLink}
      </div>
    );
  }
  const list = getListFormat(locale, { type: 'conjunction' });
  const lastYear = windows.some((w) => w.basis !== 'forecast');
  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-lg leading-relaxed">
        {tRegion('sentence', {
          days: when.meta.days,
          windows: list.format(windows.map((w) => formatWindow(w, locale))),
        })}
        {lastYear ? ` ${t('lastYearNote')}` : ''}
      </p>
      <ol className="grid gap-4 sm:grid-cols-3">
        {windows.map((window) => (
          <li key={window.from} className="flex">
            <Card className="flex w-full flex-col gap-2 p-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {t('rank', { rank: window.rank })}
              </p>
              <h3 className="text-xl font-bold">
                <time dateTime={window.from}>{formatWindow(window, locale)}</time>
              </h3>
              <p className="text-sm tabular-nums">
                {t('figure', { minutes: window.headlinerWait })}
              </p>
              <p className="text-muted-foreground text-sm tabular-nums">
                {t('average', { minutes: window.rangeAverageWait })}
              </p>
              {window.basis !== 'forecast' && (
                <p className="text-muted-foreground text-xs">
                  {window.basis === 'last_year' ? t('basisLastYear') : t('basisMixed')}
                </p>
              )}
              <Link
                href={`${pagePath}?from=${window.from}&to=${window.to}#${TRIP_PLANNER_ID}`}
                rel="nofollow"
                prefetch={false}
                {...buttonLinkProps({
                  variant: 'outline',
                  size: 'sm',
                  withIcon: true,
                  className: 'mt-auto self-start',
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
