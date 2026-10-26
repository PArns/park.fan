'use client';

import { TrendingUp } from 'lucide-react';
import type { MlDriftModel, MlDriftWatch, MlDriftWindow } from '@/lib/api/admin-ml-overview';
import { driftStatusMeta, formatLastRun, formatShare } from '@/lib/admin/ml-overview';
import { formatFigure } from '@/lib/admin/model-comparison';
import { cn } from '@/lib/utils';
import { Chip, Panel, PanelHeader, ToneDot } from '../../_ui/primitives';

const figure = (value: number | null, digits = 1) =>
  value == null ? '—' : formatFigure(value, digits);

/**
 * Whether a served model's error moved: one row per model, the last 7 days beside the 28 before,
 * each as its error, the weekday median's error on the same slots and how often reality stayed
 * under q0.8 and q0.95, with the crossed thresholds in plain German.
 */
export function DriftPanel({ drift }: { drift: MlDriftWatch }) {
  const status = driftStatusMeta(drift.status);
  return (
    <Panel>
      <PanelHeader
        icon={TrendingUp}
        title="Wird ein Modell schlechter?"
        hint={`Letzte 7 Tage gegen die 28 davor. Verhältnis = Fehler geteilt durch den des Wochentag-Medians, unter 1 ist besser. Stand ${formatLastRun(drift.computedAt)} UTC.`}
        action={<Chip tone={status.tone}>{status.label}</Chip>}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-sm">
          <thead>
            <tr className="text-muted-foreground border-border/50 border-b text-left text-[11px] font-semibold tracking-wider uppercase">
              <th className="px-4 py-2.5 font-semibold">Modell</th>
              <th className="px-4 py-2.5 font-semibold">Letzte 7 Tage</th>
              <th className="px-4 py-2.5 font-semibold">28 Tage davor</th>
              <th className="px-4 py-2.5 font-semibold">Warum</th>
            </tr>
          </thead>
          <tbody className="divide-border/40 divide-y">
            {drift.models.map((model) => (
              <DriftRow key={model.model} model={model} />
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function DriftRow({ model }: { model: MlDriftModel }) {
  const status = driftStatusMeta(model.status);
  return (
    <tr className={cn(status.tone === 'danger' && 'bg-red-500/5')}>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <span className="flex items-center gap-2 font-semibold">
          <ToneDot tone={status.tone} />
          {model.label}
        </span>
        <span className="text-muted-foreground block pl-4 text-xs">{status.label}</span>
      </td>
      <td className="px-4 py-3 align-top">
        <WindowFigures stats={model.recent} />
      </td>
      <td className="px-4 py-3 align-top">
        <WindowFigures stats={model.previous} />
      </td>
      <td className="px-4 py-3 align-top text-xs">
        {model.reasons.length > 0 ? (
          <ul className="space-y-0.5">
            {model.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : (
          <span className="text-muted-foreground">nichts auffällig</span>
        )}
      </td>
    </tr>
  );
}

function WindowFigures({ stats }: { stats: MlDriftWindow }) {
  return (
    <div className="space-y-0.5 text-xs tabular-nums">
      <p>
        <span className="text-sm font-semibold">{figure(stats.mae)} min</span> Fehler
        <span className="text-muted-foreground"> · Median {figure(stats.baselineMae)} min</span>
      </p>
      <p className="text-muted-foreground">
        Verhältnis {figure(stats.skill, 2)}
        {(stats.coverageQ80 != null || stats.coverageQ95 != null) &&
          ` · unter q0.8 ${formatShare(stats.coverageQ80)}, unter q0.95 ${formatShare(stats.coverageQ95)}`}
      </p>
      <p className="text-muted-foreground">{formatFigure(stats.n, 0)} Werte</p>
    </div>
  );
}
