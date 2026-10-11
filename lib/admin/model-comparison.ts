import type {
  ComparisonModel,
  ModelCellState,
  ModelCheckState,
  ModelComparisonReport,
} from '@/lib/api/admin-model-comparison';
import { getNumberFormat } from '@/lib/utils/intl-format';

/**
 * The pure half of the admin model comparison (`app/admin/ml/vergleich`): wording, column order,
 * number formatting and chart geometry, kept apart from the page so they can be tested.
 */

/** How each matrix state reads: the label in the legend and detail panel, the symbol in the circle. */
export const CELL_STATE_META: Record<ModelCellState, { label: string; symbol: string }> = {
  today: { label: 'Zeigen wir heute', symbol: '' },
  better: { label: 'Besser als heute', symbol: '✓' },
  worse: { label: 'Schlechter als heute', symbol: '✕' },
  unclear: { label: 'Kein sicherer Unterschied', symbol: '≈' },
  pending: { label: 'Messung läuft', symbol: '…' },
};

/** How each check state reads beside O, L and S. */
export const CHECK_STATE_META: Record<ModelCheckState, { label: string; symbol: string }> = {
  yes: { label: 'erfüllt', symbol: '✓' },
  no: { label: 'nicht erfüllt', symbol: '✕' },
  running: { label: 'läuft', symbol: '…' },
  open: { label: 'noch offen', symbol: '–' },
};

/**
 * The matrix columns: the report's models in its order, then any model a cell names that the
 * report forgot to list, labelled with its id so a new backend model still shows up.
 */
export function matrixColumns(report: ModelComparisonReport): ComparisonModel[] {
  const columns = [...report.models];
  const known = new Set(columns.map((model) => model.id));
  for (const question of report.questions) {
    for (const id of Object.keys(question.cells)) {
      if (known.has(id)) continue;
      known.add(id);
      columns.push({ id, label: id, oneLiner: '' });
    }
  }
  return columns;
}

/** The questions under each group, in the report's group order; a group with none is left out. */
export function groupQuestions(
  report: ModelComparisonReport
): { id: string; label: string; questions: ModelComparisonReport['questions'] }[] {
  const groups = [...report.groups];
  for (const question of report.questions) {
    if (!groups.some((group) => group.id === question.group)) {
      groups.push({ id: question.group, label: question.group });
    }
  }
  return groups
    .map((group) => ({
      ...group,
      questions: report.questions.filter((question) => question.group === group.id),
    }))
    .filter((group) => group.questions.length > 0);
}

/** Calendar days from the first to the last live day, both included; 0 when nothing was measured. */
export function measuredDays(window: ModelComparisonReport['window']): number {
  if (!window.firstDate || !window.lastDate) return 0;
  const first = Date.parse(`${window.firstDate}T12:00:00Z`);
  const last = Date.parse(`${window.lastDate}T12:00:00Z`);
  if (Number.isNaN(first) || Number.isNaN(last) || last < first) return 0;
  return Math.round((last - first) / 86_400_000) + 1;
}

/** A difference with its sign, in German: `−0,42 min`, `+0,026`. A rate gets three decimals. */
export function formatDiff(value: number, unit: 'min' | 'rate'): string {
  const digits = unit === 'rate' ? 3 : 2;
  const text = getNumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: 'exceptZero',
  })
    .format(value)
    .replace('-', '−');
  return unit === 'min' ? `${text} min` : text;
}

/** A plain figure in German with `digits` decimals: `12,4`. */
export function formatFigure(value: number, digits = 1): string {
  return getNumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Whether a difference favours the model, given which direction of the metric is good. */
export function diffFavoursModel(diff: number, lowerIsBetter: boolean): boolean {
  return lowerIsBetter ? diff < 0 : diff > 0;
}

/**
 * Horizontal positions, in a box `width` wide, for a difference and its interval drawn around a
 * centred zero. The scale is symmetric so the zero line never moves between cells.
 */
export function whiskerGeometry(
  diff: number,
  ciLow: number,
  ciHigh: number,
  width: number,
  pad = 8
): { zero: number; low: number; high: number; point: number } {
  const extent = Math.max(Math.abs(ciLow), Math.abs(ciHigh), Math.abs(diff), 1e-6) * 1.15;
  const half = width / 2 - pad;
  const x = (value: number) => width / 2 + (value / extent) * half;
  return {
    zero: width / 2,
    low: x(Math.min(ciLow, ciHigh)),
    high: x(Math.max(ciLow, ciHigh)),
    point: x(diff),
  };
}

/**
 * Runs of consecutive non-null values as `[index, value]` pairs, so a line can break where the
 * ride was down instead of bridging the outage.
 */
export function splitSegments(values: (number | null)[]): Array<Array<[number, number]>> {
  const segments: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];
  values.forEach((value, index) => {
    if (value === null || !Number.isFinite(value)) {
      if (current.length) segments.push(current);
      current = [];
      return;
    }
    current.push([index, value]);
  });
  if (current.length) segments.push(current);
  return segments;
}

/** Indexes of the slots that fall on a full hour, for the time axis. */
export function hourTickIndexes(slots: string[]): number[] {
  return slots.flatMap((slot, index) => (slot.endsWith(':00') ? [index] : []));
}

/** The y-axis top: the largest value rounded up to a multiple of 20, at least 60. */
export function chartTop(values: Array<number | null>): number {
  const max = Math.max(60, ...values.filter((v): v is number => v !== null && Number.isFinite(v)));
  return Math.ceil(max / 20) * 20;
}

/**
 * Stroke and swatch classes for a model's line. The models the matrix knows keep one colour
 * everywhere; any other model takes the next free fallback in the order it appears.
 */
const MODEL_COLORS: Record<string, { stroke: string; swatch: string }> = {
  served: { stroke: 'stroke-sky-500 dark:stroke-sky-400', swatch: 'bg-sky-500 dark:bg-sky-400' },
  h5: {
    stroke: 'stroke-emerald-600 dark:stroke-emerald-400',
    swatch: 'bg-emerald-600 dark:bg-emerald-400',
  },
  tfth5: {
    stroke: 'stroke-violet-600 dark:stroke-violet-400',
    swatch: 'bg-violet-600 dark:bg-violet-400',
  },
  peak: {
    stroke: 'stroke-amber-600 dark:stroke-amber-400',
    swatch: 'bg-amber-600 dark:bg-amber-400',
  },
  chronos: {
    stroke: 'stroke-rose-600 dark:stroke-rose-400',
    swatch: 'bg-rose-600 dark:bg-rose-400',
  },
  pcn: { stroke: 'stroke-cyan-600 dark:stroke-cyan-400', swatch: 'bg-cyan-600 dark:bg-cyan-400' },
  tft: {
    stroke: 'stroke-indigo-600 dark:stroke-indigo-400',
    swatch: 'bg-indigo-600 dark:bg-indigo-400',
  },
  catboost: {
    stroke: 'stroke-orange-600 dark:stroke-orange-400',
    swatch: 'bg-orange-600 dark:bg-orange-400',
  },
  wkd: {
    stroke: 'stroke-stone-500 dark:stroke-stone-400',
    swatch: 'bg-stone-500 dark:bg-stone-400',
  },
  persist: {
    stroke: 'stroke-slate-500 dark:stroke-slate-300',
    swatch: 'bg-slate-500 dark:bg-slate-300',
  },
};

const FALLBACK_COLORS = [
  { stroke: 'stroke-pink-600 dark:stroke-pink-400', swatch: 'bg-pink-600 dark:bg-pink-400' },
  { stroke: 'stroke-lime-600 dark:stroke-lime-400', swatch: 'bg-lime-600 dark:bg-lime-400' },
  { stroke: 'stroke-teal-600 dark:stroke-teal-400', swatch: 'bg-teal-600 dark:bg-teal-400' },
  {
    stroke: 'stroke-fuchsia-600 dark:stroke-fuchsia-400',
    swatch: 'bg-fuchsia-600 dark:bg-fuchsia-400',
  },
];

/** One colour per model id for the given ids, stable for known models and distinct for the rest. */
export function modelColors(ids: string[]): Map<string, { stroke: string; swatch: string }> {
  const colors = new Map<string, { stroke: string; swatch: string }>();
  let fallback = 0;
  for (const id of ids) {
    if (colors.has(id)) continue;
    colors.set(id, MODEL_COLORS[id] ?? FALLBACK_COLORS[fallback++ % FALLBACK_COLORS.length]);
  }
  return colors;
}

/**
 * Mean absolute error of a series against the measured waits, over the slots where both exist.
 * Null when no slot has both.
 */
export function dayMae(
  values: (number | null)[],
  truth: (number | null)[]
): { mae: number; n: number } | null {
  let sum = 0;
  let n = 0;
  truth.forEach((actual, index) => {
    const predicted = values[index];
    if (actual === null || predicted === null || predicted === undefined) return;
    sum += Math.abs(predicted - actual);
    n++;
  });
  return n > 0 ? { mae: sum / n, n } : null;
}
