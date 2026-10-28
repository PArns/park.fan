'use client';

import { Radio } from 'lucide-react';
import { deltaOf, formatCount, formatDecimal, type TrafficDays } from '@/lib/admin/site-analytics';
import type { AnalyticsTotals, TrafficOverview } from '@/lib/api/admin-site-analytics';
import { CATEGORICAL, DeltaChip, Sparkline } from '../../_ui/charts';
import { Tile } from '../../_ui/primitives';

/** The five figures, in the order a visit happens, with how to read each. */
const KPIS: {
  key: keyof AnalyticsTotals;
  label: string;
  hint: string;
  format: (value: number) => string;
}[] = [
  {
    key: 'visitors',
    label: 'Besucher',
    hint: 'Summe der Tageswerte: wer an einem anderen Tag wiederkommt, zählt erneut',
    format: formatCount,
  },
  {
    key: 'visits',
    label: 'Besuche',
    hint: 'Ein Besuch endet nach 30 Minuten ohne Aufruf',
    format: formatCount,
  },
  {
    key: 'pageviews',
    label: 'Aufrufe',
    hint: 'Jede Seite, auch beim Wechsel im Tab',
    format: formatCount,
  },
  {
    key: 'viewsPerVisit',
    label: 'Aufrufe je Besuch',
    hint: 'Aufrufe geteilt durch Besuche',
    format: formatDecimal,
  },
  {
    key: 'events',
    label: 'Ereignisse',
    hint: 'Klicks und Funktionen aus der festen Liste, ohne Seitenaufrufe',
    format: formatCount,
  },
];

/** What the change is measured against, in words. */
function previousLabel(days: TrafficDays): string {
  return days === 1 ? 'gegenüber dem Vortag' : `gegenüber den ${days} Tagen davor`;
}

/**
 * The five headline figures of the window, each with its change against the window before, and
 * the realtime tile beside them: visitors in the last five minutes and a line of the pageviews of
 * each of the last thirty.
 */
export function KpiTiles({
  overview,
  realtime,
  days,
}: {
  overview: TrafficOverview;
  realtime: TrafficOverview['realtime'] | undefined;
  days: TrafficDays;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {KPIS.map((kpi) => (
        <Tile key={kpi.key} className="space-y-1.5">
          <p
            className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase"
            title={kpi.hint}
          >
            {kpi.label}
          </p>
          <span className="block text-3xl font-bold tabular-nums">
            {kpi.format(overview.totals[kpi.key])}
          </span>
          <DeltaChip
            delta={deltaOf(overview.totals[kpi.key], overview.previous[kpi.key])}
            title={`${previousLabel(days)}: ${kpi.format(overview.previous[kpi.key])}`}
          />
        </Tile>
      ))}

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
