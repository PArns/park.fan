import { getLocale, getTranslations } from 'next-intl/server';
import { ShieldAlert } from 'lucide-react';
import { ChapterPanel } from '@/components/common/chapter-panel';
import { PANEL_CELL, PanelGrid, PanelMetric } from '@/components/parks/park-panel-cell';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { formatShortDuration } from '@/lib/utils/duration';
import type { DowntimeBlock } from '@/lib/api/types';

/**
 * How often this ride has been REPORTED down, or one sentence saying why we do not say.
 *
 * A chapter only where there are numbers: on most rides nothing publishes, and a heading over a
 * sentence taking it back would be noise, so that case is one inline line. Four of the five
 * refusals (`not_down_capable`, `artefact_regime`, `no_schedule`, `outside_window`) are about our
 * data, not the ride, and the wording keeps them apart from "no outages". Every figure says
 * "reported", because only ThemeParks.wiki emits the status and our own merge can overwrite it.
 * `data-nosnippet` keeps the outage counts out of search snippets for a wait-time query.
 */
export async function AttractionDowntimeSection({
  downtime,
  attractionName,
}: {
  downtime: DowntimeBlock | undefined;
  attractionName: string;
}) {
  if (!downtime) return null;
  const t = await getTranslations('attractions.downtime');
  const locale = await getLocale();

  if (downtime.kind === 'withheld') {
    return (
      <p className="text-muted-foreground mt-2 text-xs">
        <span data-nosnippet>
          {t(`withheld.${downtime.reason}`, {
            name: attractionName,
            days: downtime.windowDays,
            count: downtime.outages,
          })}
        </span>
      </p>
    );
  }

  const sharePercent = Math.round(downtime.downShare * 1000) / 10;

  return (
    <ChapterPanel icon={ShieldAlert} title={t('title')} id="downtime" hint={t('hint')}>
      <PanelGrid columnCount={3}>
        <div className={PANEL_CELL}>
          <PanelMetric caption={t('reportedCaption', { days: downtime.windowDays })}>
            <span className="text-3xl leading-none font-bold tabular-nums">{downtime.outages}</span>
          </PanelMetric>
          <p className="text-muted-foreground mt-2 text-xs">
            <span data-nosnippet>
              {t('reportedDetail', {
                days: downtime.windowDays,
                count: downtime.outages,
                observedDays: downtime.observedDays,
              })}
            </span>
          </p>
        </div>

        <div className={PANEL_CELL}>
          <PanelMetric caption={t('medianCaption')}>
            <span className="text-3xl leading-none font-bold tabular-nums">
              {/* Every displayed minute figure is a multiple of five: parks post them that way. */}
              {roundWaitTo5(downtime.medianMinutes)}
            </span>
          </PanelMetric>
          <p className="text-muted-foreground mt-2 text-xs">
            <span data-nosnippet>
              {/* Names the observed set, never "davon" over a total that
                  includes the censored ones — the sentence has to be checkable
                  against the count beside it. */}
              {t('medianDetail', {
                usable: downtime.usableDurations,
                minutes: roundWaitTo5(downtime.medianMinutes),
              })}
            </span>
          </p>
        </div>

        <div className={PANEL_CELL}>
          <PanelMetric caption={t('longestCaption')}>
            {/* Hours, not raw minutes: the longest outages run past a thousand minutes, a number
                nobody converts in their head. */}
            <span className="text-3xl leading-none font-bold tabular-nums">
              {formatShortDuration(roundWaitTo5(downtime.longestMinutes), locale)}
            </span>
          </PanelMetric>
          <p className="text-muted-foreground mt-2 text-xs">
            {/* Describes the number above it: a maximum is the most sampling-sensitive
                statistic there is, so what belongs here is the set it was taken over. */}
            <span data-nosnippet>{t('longestDetail', { count: downtime.outages })}</span>
          </p>
        </div>
      </PanelGrid>

      {/* The one denominator on the card, and it describes the chapter rather
          than any single tile, so it sits under the grid instead of borrowing a
          cell that belongs to another figure. */}
      <p className="text-muted-foreground mt-3 text-xs">
        <span data-nosnippet>{t('shareDetail', { percent: sharePercent })}</span>
      </p>
    </ChapterPanel>
  );
}
