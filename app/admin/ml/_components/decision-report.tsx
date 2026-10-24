'use client';

import { AlertTriangle } from 'lucide-react';
import type { MlDecision, MlDecisionReport } from '@/lib/api/admin-ml-overview';
import {
  decisionStateMeta,
  formatInterval,
  formatShare,
  formatSigned,
  reportCellTone,
} from '@/lib/admin/ml-overview';
import { CELL_STATE_META, formatFigure } from '@/lib/admin/model-comparison';
import type { ModelCellState } from '@/lib/api/admin-model-comparison';
import { formatDay } from '../../_lib/format';
import { Chip } from '../../_ui/primitives';

const day = (value: string | null) => (value ? formatDay(`${value}T12:00:00Z`) : '—');
const count = (value: number | null) => (value == null ? '—' : formatFigure(value, 0));

/**
 * The verdict a decision was frozen with on its evaluation day and what it rested on: the window,
 * each matrix cell with both intervals, and the weekday, holiday and season mix of the paired days.
 * A failed check is spelled out above the figures, so a green verdict is never read as a silent one.
 */
export function DecisionReport({
  report,
  cells = [],
}: {
  report: MlDecisionReport;
  /** The decision's own cells, for their `expect`. */
  cells?: MlDecision['cells'];
}) {
  const expectOf = (questionId: string, modelId: string) =>
    cells.find((ref) => ref.questionId === questionId && ref.modelId === modelId)?.expect;
  const verdict = decisionStateMeta(report.verdict);
  const topShare = Math.max(...report.weekdays.map((entry) => entry.share), 0);

  return (
    <div className="border-border/50 bg-muted/20 space-y-3 rounded-lg border p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">Ergebnis vom {day(report.evaluateOn)}:</span>
        <Chip tone={verdict.tone}>{verdict.label}</Chip>
        {report.warning && (
          <Chip tone="warning">
            <AlertTriangle className="h-3 w-3" /> mit Vorbehalt
          </Chip>
        )}
        <span className="text-muted-foreground">
          gemessen {day(report.window.firstDate)} bis {day(report.window.lastDate)} · {report.parks}{' '}
          Parks · {report.days} Tage
        </span>
      </div>

      {report.warnings.length > 0 && (
        <ul className="space-y-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300">
          {report.warnings.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      {report.cells.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem]">
            <thead>
              <tr className="text-muted-foreground border-border/50 border-b text-left text-[11px]">
                <th className="py-1.5 pr-3 font-semibold">Frage · Modell</th>
                <th className="py-1.5 pr-3 font-semibold">Ergebnis</th>
                <th className="py-1.5 pr-3 text-right font-semibold">Abstand</th>
                <th className="py-1.5 pr-3 text-right font-semibold">Spanne fürs Urteil</th>
                <th className="py-1.5 pr-3 text-right font-semibold">Spanne nur Parks</th>
                <th className="py-1.5 pr-3 text-right font-semibold">Parks</th>
                <th className="py-1.5 pr-3 text-right font-semibold">Tage</th>
                <th className="py-1.5 text-right font-semibold">Zeilen</th>
              </tr>
            </thead>
            <tbody className="divide-border/40 divide-y tabular-nums">
              {report.cells.map((cell) => {
                const expect = expectOf(cell.questionId, cell.modelId);
                return (
                  <tr key={`${cell.questionId}/${cell.modelId}`}>
                    <td className="py-1.5 pr-3 font-mono">
                      {cell.questionId} · {cell.modelId}
                    </td>
                    <td className="py-1.5 pr-3">
                      <Chip tone={reportCellTone(cell.state, expect)}>
                        {CELL_STATE_META[cell.state as ModelCellState]?.label ?? cell.state}
                      </Chip>
                      {expect === 'not_better' && (
                        <span className="text-muted-foreground block text-[11px]">
                          darf nicht besser sein
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 pr-3 text-right font-semibold">
                      {formatSigned(cell.diff)}
                    </td>
                    <td className="py-1.5 pr-3 text-right">
                      {formatInterval(cell.ciLow, cell.ciHigh)}
                    </td>
                    <td className="text-muted-foreground py-1.5 pr-3 text-right">
                      {formatInterval(cell.parkCiLow, cell.parkCiHigh)}
                    </td>
                    <td className="py-1.5 pr-3 text-right">{cell.parks}</td>
                    <td className="py-1.5 pr-3 text-right">{cell.days}</td>
                    <td className="py-1.5 text-right">{count(cell.cellRows ?? cell.n)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-muted-foreground mt-1">
            Abstand = Modell minus heute in der Einheit der Frage (Minuten, bei einer Quote
            Prozentpunkte). Negativ ist besser.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-6">
        {report.weekdays.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1">Wochentage der Messung</p>
            <div className="flex items-end gap-1.5" aria-label="Anteil je Wochentag">
              {report.weekdays.map((entry) => (
                <div key={entry.weekday} className="flex w-7 flex-col items-center gap-0.5">
                  <span className="text-muted-foreground text-[10px]">
                    {formatShare(entry.share)}
                  </span>
                  <div className="bg-muted flex h-10 w-full items-end overflow-hidden rounded-sm">
                    <div
                      className="bg-primary/70 w-full"
                      style={{ height: `${topShare > 0 ? (entry.share / topShare) * 100 : 0}%` }}
                    />
                  </div>
                  <span>{entry.weekday}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-muted-foreground">Ferien und Feiertage</p>
          <p className="text-sm font-semibold">{formatShare(report.holidayShare)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Jahreszeit</p>
          <p className="text-sm font-semibold">{report.season || '—'}</p>
        </div>
      </div>
    </div>
  );
}
