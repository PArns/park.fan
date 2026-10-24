'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type {
  ComparisonModel,
  ModelCell,
  ModelCellState,
  ModelCheckState,
  ModelComparisonQuestion,
  ModelComparisonReport,
} from '@/lib/api/admin-model-comparison';
import {
  CELL_STATE_META,
  CHECK_STATE_META,
  diffFavoursModel,
  formatDiff,
  formatError,
  groupQuestions,
  matrixColumns,
  whiskerGeometry,
} from '@/lib/admin/model-comparison';
import { getNumberFormat } from '@/lib/utils/intl-format';
import { formatDay } from '../../../_lib/format';
import { Chip, Meta, Tile } from '../../../_ui/primitives';

const CELL_CLASS: Record<ModelCellState, string> = {
  today: 'bg-card ring-2 ring-inset ring-foreground',
  better: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950',
  worse: 'bg-red-600 text-white dark:bg-red-500 dark:text-red-950',
  unclear: 'bg-muted text-muted-foreground ring-2 ring-inset ring-muted-foreground/60',
  pending: 'bg-amber-500/15 text-amber-700 ring-2 ring-inset ring-amber-500 dark:text-amber-300',
};

const CHECK_CLASS: Record<ModelCheckState, string> = {
  yes: 'text-emerald-600 dark:text-emerald-400',
  no: 'text-red-600 dark:text-red-400',
  running: 'text-amber-600 dark:text-amber-400',
  open: 'text-muted-foreground',
};

/** One matrix circle, sized for the table or for the legend. */
function StateDot({ state, small }: { state: ModelCellState; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-mono font-semibold',
        small ? 'h-4 w-4 text-[9px]' : 'h-8 w-8 text-xs',
        CELL_CLASS[state]
      )}
    >
      {CELL_STATE_META[state].symbol}
    </span>
  );
}

/** The six circle meanings, above the matrix. */
export function MatrixLegend() {
  return (
    <div className="text-muted-foreground border-border/50 flex flex-wrap gap-x-4 gap-y-2 border-b px-4 py-2.5 text-xs">
      {(Object.keys(CELL_STATE_META) as ModelCellState[]).map((state) => (
        <span key={state} className="inline-flex items-center gap-1.5">
          <StateDot state={state} small />
          {state === 'today' ? 'zeigen wir heute' : CELL_STATE_META[state].label.toLowerCase()}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="text-border w-4 text-center">–</span>passt nicht zu dieser Frage
      </span>
    </div>
  );
}

/**
 * Every question the app answers against every model, one circle per cell; a click opens the
 * cell's sentence, its live and offline figures and the three checks below the table.
 */
export function ModelMatrix({ report }: { report: ModelComparisonReport }) {
  const columns = matrixColumns(report);
  const groups = groupQuestions(report);
  const [selected, setSelected] = useState<{ question: string; model: string } | null>(null);

  const question = selected ? report.questions.find((q) => q.id === selected.question) : null;
  const model = selected ? columns.find((m) => m.id === selected.model) : null;
  const cell = question && model ? question.cells[model.id] : null;

  return (
    <>
      <MatrixLegend />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-border/50 border-b">
              <th className="bg-card text-muted-foreground sticky left-0 z-10 min-w-[220px] px-3 py-2 text-left align-bottom text-xs font-semibold">
                Frage in der App
              </th>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className="text-muted-foreground px-1.5 py-2 text-center align-bottom text-[11px] leading-tight font-semibold"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.id}>
              <tr>
                <th
                  colSpan={columns.length + 1}
                  className="bg-muted/40 text-muted-foreground px-3 py-1.5 text-left text-[11px] font-semibold tracking-wider uppercase"
                >
                  {group.label}
                </th>
              </tr>
              {group.questions.map((row) => (
                <tr key={row.id} className="border-border/40 border-b last:border-b-0">
                  <th
                    scope="row"
                    className="bg-card sticky left-0 z-10 px-3 py-2.5 text-left align-middle font-medium"
                  >
                    <span className="block">{row.label}</span>
                    <span className="text-muted-foreground block text-xs font-normal">
                      {row.sub}
                    </span>
                    {row.leadLabel && (
                      <span className="text-primary mt-0.5 block text-[11px] font-normal">
                        {row.leadLabel}
                      </span>
                    )}
                  </th>
                  {columns.map((column) => {
                    const value = row.cells[column.id];
                    if (!value) {
                      return (
                        <td key={column.id} className="text-border px-1.5 py-2.5 text-center">
                          <span aria-hidden="true">–</span>
                        </td>
                      );
                    }
                    const isSelected =
                      selected?.question === row.id && selected.model === column.id;
                    return (
                      <td key={column.id} className="px-1.5 py-2.5 text-center">
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          aria-label={`${column.label}, ${row.label}: ${CELL_STATE_META[value.state].label}`}
                          onClick={() =>
                            setSelected(isSelected ? null : { question: row.id, model: column.id })
                          }
                          className={cn(
                            'focus-visible:ring-primary rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                            isSelected && 'ring-primary ring-offset-card ring-2 ring-offset-2'
                          )}
                        >
                          <StateDot state={value.state} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <div className="border-border/50 border-t px-4 py-3" aria-live="polite">
        {question && model && cell ? (
          <CellDetail question={question} model={model} cell={cell} rule={report.rule} />
        ) : (
          <p className="text-sm">
            <span className="font-medium">Kreis anklicken.</span>{' '}
            <span className="text-muted-foreground">
              Hier steht dann, wie sicher das Ergebnis ist und was noch fehlt.
            </span>
          </p>
        )}
      </div>
    </>
  );
}

function CellDetail({
  question,
  model,
  cell,
  rule,
}: {
  question: ModelComparisonQuestion;
  model: ComparisonModel;
  cell: ModelCell;
  rule: ModelComparisonReport['rule'];
}) {
  const { unit, lowerIsBetter } = question.metric;
  const showExpected = cell.expectedBy && cell.checks.live !== 'yes';

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <StateDot state={cell.state} small />
          {model.label} · {question.label}: {CELL_STATE_META[cell.state].label}
        </p>
        <p className="text-muted-foreground text-sm">{cell.note}</p>
        {showExpected && (
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Ergebnis erwartet: {cell.expectedBy?.label}
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <Tile title="Live">
          {cell.live ? (
            <div className="space-y-2.5">
              {cell.live.since && (
                <p className="text-muted-foreground text-xs">
                  live gemessen seit {formatDay(`${cell.live.since}T12:00:00Z`)}
                </p>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <Meta
                  label="Differenz"
                  value={formatDiff(cell.live.diff, unit)}
                  valueClassName={
                    diffFavoursModel(cell.live.diff, lowerIsBetter)
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                />
                <Meta
                  label={
                    cell.live.ci === 'park_date'
                      ? '95 %-Intervall (Parks × Tage)'
                      : '95 %-Intervall'
                  }
                  value={`${formatDiff(cell.live.ciLow, unit)} bis ${formatDiff(cell.live.ciHigh, unit)}`}
                  className="text-right"
                />
              </div>
              {cell.live.parkCiLow != null && cell.live.parkCiHigh != null && (
                <p className="text-muted-foreground text-right text-xs">
                  Intervall nur über Parks: {formatDiff(cell.live.parkCiLow, unit)} bis{' '}
                  {formatDiff(cell.live.parkCiHigh, unit)}
                </p>
              )}
              <Whisker
                diff={cell.live.diff}
                ciLow={cell.live.ciLow}
                ciHigh={cell.live.ciHigh}
                lowerIsBetter={lowerIsBetter}
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Meta
                  label="Tage"
                  value={`${cell.live.days} von ${rule.minDays}`}
                  valueClassName={
                    cell.live.days >= rule.minDays
                      ? undefined
                      : 'text-amber-600 dark:text-amber-400'
                  }
                />
                <Meta
                  label="Parks"
                  value={`${cell.live.parks} von ${rule.minParks}`}
                  valueClassName={
                    cell.live.parks >= rule.minParks
                      ? undefined
                      : 'text-amber-600 dark:text-amber-400'
                  }
                />
                <Meta label="Messwerte" value={getNumberFormat('de-DE').format(cell.live.n)} />
                <Meta
                  label={
                    unit === 'rate' ? 'Falsch sortiert Modell / heute' : 'Fehler Modell / heute'
                  }
                  value={`${formatError(cell.live.modelMae, unit)} / ${formatError(cell.live.referenceMae, unit)}`}
                />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Noch keine Live-Messung für diese Zelle.
            </p>
          )}
        </Tile>

        <Tile title="Offline">
          {cell.offline ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                {cell.offline.diff !== undefined && (
                  <Meta
                    label="Differenz"
                    value={formatDiff(cell.offline.diff, unit)}
                    valueClassName={
                      diffFavoursModel(cell.offline.diff, lowerIsBetter)
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }
                  />
                )}
                {cell.offline.ciLow !== undefined && cell.offline.ciHigh !== undefined && (
                  <Meta
                    label="95 %-Intervall"
                    value={`${formatDiff(cell.offline.ciLow, unit)} bis ${formatDiff(cell.offline.ciHigh, unit)}`}
                  />
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {cell.offline.source}
                {cell.offline.period ? `, ${cell.offline.period}` : ''}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">Keine Offline-Zahl hinterlegt.</p>
          )}
        </Tile>

        <Tile title="Prüfungen" className="md:min-w-[240px]">
          <ul className="space-y-1.5 text-xs">
            <CheckRow
              letter="O"
              label="Offline übers ganze Jahr besser"
              state={cell.checks.offline}
            />
            <CheckRow
              letter="L"
              label={`Live bestätigt (mind. ${rule.minDays} Tage, ${rule.minParks} Parks)`}
              state={cell.checks.live}
            />
            <CheckRow
              letter="S"
              label="In der App sichtbar"
              state={cell.checks.visible ? 'yes' : 'no'}
            />
          </ul>
        </Tile>
      </div>
    </div>
  );
}

function CheckRow({
  letter,
  label,
  state,
}: {
  letter: string;
  label: string;
  state: ModelCheckState;
}) {
  return (
    <li className="flex items-center gap-2">
      <Chip className="w-6 justify-center font-mono">{letter}</Chip>
      <span className="min-w-0 flex-1">{label}</span>
      <span className={cn('font-mono font-semibold', CHECK_CLASS[state])}>
        {CHECK_STATE_META[state].symbol}
      </span>
      <span className="sr-only">{CHECK_STATE_META[state].label}</span>
    </li>
  );
}

/**
 * The live difference as a small forest plot: zero in the middle, the interval as a line, the
 * estimate as a dot, and the side that favours the model labelled.
 */
function Whisker({
  diff,
  ciLow,
  ciHigh,
  lowerIsBetter,
}: {
  diff: number;
  ciLow: number;
  ciHigh: number;
  lowerIsBetter: boolean;
}) {
  const width = 280;
  const g = whiskerGeometry(diff, ciLow, ciHigh, width);
  const crossesZero = Math.min(ciLow, ciHigh) <= 0 && Math.max(ciLow, ciHigh) >= 0;
  const tone = crossesZero
    ? 'fill-muted-foreground stroke-muted-foreground'
    : diffFavoursModel(diff, lowerIsBetter)
      ? 'fill-emerald-600 stroke-emerald-600 dark:fill-emerald-400 dark:stroke-emerald-400'
      : 'fill-red-600 stroke-red-600 dark:fill-red-400 dark:stroke-red-400';

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} 28`}
        className="h-7 w-full"
        role="img"
        aria-label={`Intervall von ${ciLow} bis ${ciHigh}, Schätzung ${diff}`}
      >
        <line
          x1={g.zero}
          x2={g.zero}
          y1={2}
          y2={26}
          className="stroke-border"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <line x1={g.low} x2={g.high} y1={14} y2={14} className={tone} strokeWidth={2} />
        <line x1={g.low} x2={g.low} y1={9} y2={19} className={tone} strokeWidth={2} />
        <line x1={g.high} x2={g.high} y1={9} y2={19} className={tone} strokeWidth={2} />
        <circle cx={g.point} cy={14} r={4.5} className={tone} />
      </svg>
      <div className="text-muted-foreground flex justify-between text-[10px]">
        <span>{lowerIsBetter ? '← Modell besser' : '← heute besser'}</span>
        <span>0</span>
        <span>{lowerIsBetter ? 'heute besser →' : 'Modell besser →'}</span>
      </div>
    </div>
  );
}
