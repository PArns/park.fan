import type { ElementType } from 'react';
import { getLocale } from 'next-intl/server';
import { Award, GitBranch, Database, CalendarClock, TrendingDown } from 'lucide-react';
import { getMLDashboard } from '@/lib/api/ml';
import { stripNewPrefix } from '@/lib/utils';
import { Reveal } from './_fancast-motion';

export interface FancastLiveLabels {
  /** e.g. "Aktuelle Edition" */
  edition: string;
  /** e.g. "Trainiert" */
  trained: string;
  /** e.g. "Trainingsbasis" */
  basis: string;
  /** e.g. "{n} Datenpunkte" — literal "{n}" replaced with the number */
  datapoints: string;
  /** e.g. "über {d} Tage" — literal "{d}" replaced */
  days: string;
  /** e.g. "Gegenüber {v}" — literal "{v}" replaced with the previous version */
  vsPrevious: string;
  /** e.g. "min genauer" (suffix after the delta) */
  moreAccurate: string;
  /** e.g. "Wo Fancast zuletzt am treffsichersten war" */
  topTitle: string;
  /** intro sentence under the top-performers heading */
  topIntro: string;
  colAttraction: string;
  colPark: string;
  colError: string;
  /** e.g. "Min." unit shown after the average error */
  minUnit: string;
}

/**
 * Almanac-style "edition + revision + scorecard" block, live from
 * `/v1/ml/dashboard`. Complements the reused {@link MLStatsSection} (which shows
 * the aggregate MAE/RMSE/R²) with the current model edition, how it compares to
 * the previous version, and the attractions Fancast currently predicts best —
 * real parks, real numbers. Renders nothing if the dashboard is unreachable.
 */
export async function FancastLive({ labels }: { labels: FancastLiveLabels }) {
  const [locale, dashboard] = await Promise.all([getLocale(), getMLDashboard().catch(() => null)]);
  if (!dashboard) return null;

  const { model, performance, insights } = dashboard;
  const current = model?.current;
  const previous = model?.previous;
  const improvement = performance?.improvement;
  const training = model?.trainingData;

  const fmtDate = (iso?: string) => {
    if (!iso) return null;
    try {
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };
  const fmtCompact = (n?: number | null) =>
    n != null && isFinite(n)
      ? new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
      : '—';
  const fmt1 = (n?: number | null) => (n != null && isFinite(n) ? n.toFixed(1) : null);

  const top = (insights?.topPerformers ?? []).filter((p) => p && isFinite(p.mae)).slice(0, 6);
  const deltaAbs =
    improvement?.isImproving && improvement.maeDelta != null
      ? Math.abs(improvement.maeDelta)
      : null;

  const tiles: Array<{ icon: ElementType; label: string; value: string }> = [];
  if (current?.version) {
    tiles.push({ icon: Award, label: labels.edition, value: current.version });
  }
  const trainedOn = fmtDate(current?.trainedAt);
  if (trainedOn) {
    tiles.push({ icon: CalendarClock, label: labels.trained, value: trainedOn });
  }
  if (training?.totalSamples) {
    tiles.push({
      icon: Database,
      label: labels.basis,
      value: `${labels.datapoints.replace('{n}', fmtCompact(training.totalSamples))} · ${labels.days.replace('{d}', fmtCompact(training.dataDurationDays))}`,
    });
  }
  if (previous?.version && deltaAbs != null) {
    tiles.push({
      icon: TrendingDown,
      label: labels.vsPrevious.replace('{v}', previous.version),
      value: `−${fmt1(deltaAbs)} ${labels.minUnit} ${labels.moreAccurate}`,
    });
  }

  if (tiles.length === 0 && top.length === 0) return null;

  return (
    <div className="space-y-8">
      {tiles.length > 0 && (
        <Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((t) => (
              <div key={t.label} className="bg-card rounded-xl border p-4">
                <div className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </div>
                <div className="text-lg font-bold tabular-nums">{t.value}</div>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {top.length > 0 && (
        <Reveal>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GitBranch className="text-primary h-4 w-4" />
              <h3 className="font-semibold">{labels.topTitle}</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{labels.topIntro}</p>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">{labels.colAttraction}</th>
                    <th className="hidden px-4 py-2.5 text-left font-medium sm:table-cell">
                      {labels.colPark}
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium">{labels.colError}</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {top.map((p) => (
                    <tr key={p.attractionId} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">
                        {stripNewPrefix(p.attractionName)}
                        <span className="text-muted-foreground block text-xs sm:hidden">
                          {stripNewPrefix(p.parkName)}
                        </span>
                      </td>
                      <td className="text-muted-foreground hidden px-4 py-2.5 sm:table-cell">
                        {stripNewPrefix(p.parkName)}
                      </td>
                      <td className="text-status-operating px-4 py-2.5 text-right font-semibold tabular-nums">
                        ±{fmt1(p.mae)} {labels.minUnit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
