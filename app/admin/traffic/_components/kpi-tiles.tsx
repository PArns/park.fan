'use client';

import { Radio } from 'lucide-react';
import { VISITOR_FILTER_HINT, figureDelta, formatCount } from '@/lib/admin/site-analytics';
import { formatMetric, metricOf, metricValue, type MetricKey } from '@/lib/admin/traffic-series';
import type { TrafficOverview } from '@/lib/api/admin-site-analytics';
import { CATEGORICAL, DeltaChip, Sparkline } from '../../_ui/charts';
import { Tile } from '../../_ui/primitives';

/** The headline figures in the order a visit happens: who, how many times, how long, how it ended. */
const KPI_ORDER: readonly MetricKey[] = [
  'visitors',
  'visits',
  'pageviews',
  'viewsPerVisit',
  'bounceRate',
  'avgVisitSeconds',
  'avgTimeOnPageSeconds',
  'events',
];

/**
 * What a dash means for a figure that can be missing: visitors under a filter they do not exist
 * for, a filter on how a visit began (no page views, no events), or nothing to average yet.
 */
function missingText(key: MetricKey, byVisitsOnly: boolean): { text: string; title: string } {
  if (
    byVisitsOnly &&
    ['pageviews', 'events', 'viewsPerVisit', 'avgTimeOnPageSeconds'].includes(key)
  ) {
    return {
      text: 'Nur Besuchswerte',
      title:
        'Unter einem Filter nach Einstieg, Herkunft oder Kanal zählt der Zähler nur Besuche: Aufrufe und Ereignisse gehören zu keinem Besuch.',
    };
  }
  return key === 'visitors'
    ? {
        text: 'Mit diesem Filter nicht zählbar',
        title: VISITOR_FILTER_HINT,
      }
    : {
        text: 'Noch keine Messung',
        title:
          'Die Zeit wird gemessen, seit die Seite sie meldet. Ohne Besuche im Zeitraum gibt es nichts zu mitteln.',
      };
}

/**
 * The headline figures of the window, each with its change against the window before, and the
 * realtime tile beside them: visitors in the last five minutes and a line of the pageviews of each
 * of the last thirty. Today is not over, so it is not set against all of yesterday as a percentage:
 * that would read as a collapse every morning. The tile names yesterday's full-day figure instead.
 * A window of more than 180 days has no window before, which the tiles say once and do not hide.
 */
export function KpiTiles({
  overview,
  realtime,
  today,
}: {
  overview: TrafficOverview;
  realtime: TrafficOverview['realtime'] | undefined;
  /** The UTC day the page counts as today. */
  today: string;
}) {
  const runningDay = overview.days === 1 && overview.to === today;
  // Page views are null only under a filter on how a visit began, where visits are all there is.
  const byVisitsOnly = overview.totals.pageviews === null;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
      {KPI_ORDER.map((key) => {
        const metric = metricOf(key);
        // A bounce rate over no visits is no rate, and `0 %` would claim one.
        const noData = key === 'bounceRate' && overview.totals.visits === 0;
        const value = noData ? null : metricValue(overview.totals, key);
        const before = overview.previous ? metricValue(overview.previous, key) : null;
        const delta = figureDelta(value, before);
        const missing = missingText(key, byVisitsOnly);
        return (
          <Tile key={key} className="space-y-1.5">
            <p
              className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase"
              title={metric.hint}
            >
              {metric.label}
            </p>
            <span className="block text-3xl font-bold tabular-nums">
              {formatMetric(metric.unit, value)}
            </span>
            {value === null ? (
              <p className="text-muted-foreground text-xs" title={missing.title}>
                {noData ? 'Keine Besuche' : missing.text}
              </p>
            ) : overview.previous === null ? (
              <p
                className="text-muted-foreground text-xs"
                title="Über 180 Tage gibt es keinen Vergleichszeitraum."
              >
                Kein Vergleich
              </p>
            ) : runningDay ? (
              <p className="text-muted-foreground text-xs tabular-nums">
                Gestern ganztags {formatMetric(metric.unit, before)}
              </p>
            ) : delta ? (
              <DeltaChip
                lowerIsBetter={metric.lowerIsBetter}
                delta={delta}
                title={`gegenüber den ${overview.days} Tagen davor: ${formatMetric(metric.unit, before)}`}
              />
            ) : (
              <p className="text-muted-foreground text-xs">Davor nicht gemessen</p>
            )}
          </Tile>
        );
      })}

      <Tile className="col-span-2 space-y-1.5 md:col-span-1">
        <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
          <Radio className="text-primary h-3.5 w-3.5" aria-hidden="true" />
          Jetzt aktiv
        </p>
        <span className="block text-3xl font-bold tabular-nums">
          {realtime ? formatCount(realtime.activeVisitors) : '–'}
        </span>
        {realtime ? (
          <div
            title="Aufrufe pro Minute, letzte 30 Minuten, alle Sprachen"
            className="flex items-center gap-2"
          >
            <Sparkline
              values={realtime.perMinute.map((minute) => minute.pageviews)}
              color={CATEGORICAL[2]}
              className="w-full flex-1"
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">lädt</p>
        )}
        <p className="text-muted-foreground text-[11px]">letzte 5 Minuten, alle Sprachen</p>
      </Tile>
    </div>
  );
}
