import { getLocale, getTranslations } from 'next-intl/server';
import { ShieldAlert } from 'lucide-react';
import { ChapterPanel } from '@/components/common/chapter-panel';
import { PANEL_CELL, PanelGrid, PanelMetric } from '@/components/parks/park-panel-cell';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { formatShortDuration } from '@/lib/utils/duration';
import type { DowntimeBlock } from '@/lib/api/types';

/**
 * How often this ride has been REPORTED down — or one sentence saying why we do
 * not say.
 *
 * ## It is a chapter only where there are numbers
 *
 * On the large majority of roughly 7000 rides there is nothing to publish, and a
 * `ChapterPanel` there would be a heading promising outages over a sentence
 * taking it back, six languages deep, on the second-highest-cardinality route in
 * the app. Where nothing publishes this renders one inline line instead.
 *
 * ## Four refusals, and three of them are about us
 *
 * `not_down_capable`, `artefact_regime` and `no_schedule` say something about our
 * data and nothing about the ride. Collapsing them into "no outages" would turn
 * a park we cannot read into a park with a flawless safety record, which is the
 * single worst thing this feature could do. The wording keeps them apart.
 *
 * ## Every figure attributes the source
 *
 * "gemeldet", never "die Bahn war kaputt". Only ThemeParks.wiki emits the status
 * at all and our own merge can overwrite it, so what is counted is reports —
 * and saying so is not a hedge, it is what the number is.
 *
 * `data-nosnippet` on a `<span>`, one of the three elements Google honours it
 * on: a result answering "Taron Wartezeit" with "34 Störungen in 90 Tagen" is
 * both the most quotable prose on the page and the least useful answer to the
 * question that was asked.
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
              {/* Every displayed minute figure on this site is a multiple of
                  five, because parks post them that way and the resolution
                  genuinely is five minutes. */}
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
            {/* Hours, not raw minutes. The longest outages measured in
                production run to 1450, 1055 and 950 minutes, and "1450" under
                a caption reading "in Minuten" is a number nobody converts in
                their head. */}
            <span className="text-3xl leading-none font-bold tabular-nums">
              {formatShortDuration(roundWaitTo5(downtime.longestMinutes), locale)}
            </span>
          </PanelMetric>
          <p className="text-muted-foreground mt-2 text-xs">
            {/* Describes the number ABOVE it. This used to carry `shareDetail`,
                which talks about the share of time the ride ran — a true
                sentence sitting under an unrelated figure. A maximum is the
                most sampling-sensitive statistic there is, so what belongs here
                is the set it was taken over. */}
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
