import type {
  ComparisonModel,
  ModelCell,
  ModelCellLive,
  ModelCellState,
  ModelCheckState,
  ModelComparisonDay,
  ModelComparisonDayOptions,
  ModelComparisonQuestion,
  ModelComparisonReport,
} from '@/lib/api/admin-model-comparison';
import { getDateTimeFormat, getNumberFormat } from '@/lib/utils/intl-format';

/**
 * The pure half of the admin model comparison (`app/admin/ml/vergleich`): wording, column order,
 * number formatting and chart geometry, kept apart from the page so they can be tested.
 */

/**
 * How each matrix state reads: the label in the detail panel, the short one in the legend and the
 * phone chips' order, the symbol in the circle (pending and unclear are drawn, not written).
 */
export const CELL_STATE_META: Record<
  ModelCellState,
  { label: string; short: string; symbol: string }
> = {
  today: { label: 'Heute in der App', short: 'heute in der App', symbol: 'App' },
  better: { label: 'Besser als heute', short: 'besser', symbol: '✓' },
  pending: { label: 'Messung läuft noch', short: 'läuft noch', symbol: '' },
  worse: { label: 'Schlechter als heute', short: 'schlechter', symbol: '×' },
  unclear: { label: 'Kein sicherer Unterschied', short: 'unklar', symbol: '' },
};

/** The states in the order the legend lists them and a phone row shows its chips. */
export const CELL_STATE_ORDER = Object.keys(CELL_STATE_META) as ModelCellState[];

/** How each check state reads. */
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

/**
 * A difference with its sign, in German: `−0,42 min`, `+2,6 pp`. A rate arrives in percentage
 * points (share of wrongly ordered day pairs), never as a fraction, so it gets one decimal.
 */
export function formatDiff(value: number, unit: 'min' | 'rate'): string {
  const digits = unit === 'rate' ? 1 : 2;
  const text = getNumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: 'exceptZero',
  })
    .format(value)
    .replace('-', '−');
  return `${text} ${unit === 'rate' ? 'pp' : 'min'}`;
}

/** A cell's own error, without sign: `12,4` minutes, or `31,2 %` of day pairs for a rate. */
export function formatError(value: number, unit: 'min' | 'rate'): string {
  return unit === 'rate' ? `${formatFigure(value)} %` : formatFigure(value);
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
  pad = 8,
  alsoFit: number[] = []
): { zero: number; low: number; high: number; point: number } {
  // `alsoFit` widens the scale, so two intervals drawn one above the other share one zero and unit.
  const extent =
    Math.max(Math.abs(ciLow), Math.abs(ciHigh), Math.abs(diff), ...alsoFit.map(Math.abs), 1e-6) *
    1.15;
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

/**
 * Centre-to-centre distance two hour labels need, in px: `00:00` in 11 px mono is about 34 px
 * wide, and the rest keeps neighbours from reading as one string.
 */
export const HOUR_LABEL_MIN_SPACING = 46;

const HOUR_STEPS = [1, 2, 3, 4, 6, 12];

/**
 * The hour labels that fit a plot `plotWidth` px wide: every hour if they fit, else every 2nd,
 * 3rd, … hour of the clock, the smallest step whose neighbours stay `minSpacing` apart. Positions
 * come from the slot index, so a window past midnight reads 23:00, 00:00, 01:00 in order.
 */
export function hourTicks(
  slots: string[],
  plotWidth: number,
  minSpacing = HOUR_LABEL_MIN_SPACING
): number[] {
  const hours = hourTickIndexes(slots);
  if (slots.length < 2 || hours.length < 2) return hours;
  const perSlot = plotWidth / (slots.length - 1);
  for (const step of HOUR_STEPS) {
    const picked = hours.filter((index) => Number(slots[index].slice(0, 2)) % step === 0);
    if (picked.length === 0) continue;
    if (picked.every((index, k) => k === 0 || (index - picked[k - 1]) * perSlot >= minSpacing)) {
      return picked;
    }
  }
  return [hours[0]];
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
const MODEL_COLORS: Record<string, { stroke: string; fill: string; swatch: string }> = {
  served: {
    stroke: 'stroke-sky-500 dark:stroke-sky-400',
    fill: 'fill-sky-500 dark:fill-sky-400',
    swatch: 'bg-sky-500 dark:bg-sky-400',
  },
  h5: {
    stroke: 'stroke-emerald-600 dark:stroke-emerald-400',
    fill: 'fill-emerald-600 dark:fill-emerald-400',
    swatch: 'bg-emerald-600 dark:bg-emerald-400',
  },
  tfth5: {
    stroke: 'stroke-violet-600 dark:stroke-violet-400',
    fill: 'fill-violet-600 dark:fill-violet-400',
    swatch: 'bg-violet-600 dark:bg-violet-400',
  },
  peak: {
    stroke: 'stroke-amber-600 dark:stroke-amber-400',
    fill: 'fill-amber-600 dark:fill-amber-400',
    swatch: 'bg-amber-600 dark:bg-amber-400',
  },
  chronos: {
    stroke: 'stroke-rose-600 dark:stroke-rose-400',
    fill: 'fill-rose-600 dark:fill-rose-400',
    swatch: 'bg-rose-600 dark:bg-rose-400',
  },
  pcn: {
    stroke: 'stroke-cyan-600 dark:stroke-cyan-400',
    fill: 'fill-cyan-600 dark:fill-cyan-400',
    swatch: 'bg-cyan-600 dark:bg-cyan-400',
  },
  tft: {
    stroke: 'stroke-indigo-600 dark:stroke-indigo-400',
    fill: 'fill-indigo-600 dark:fill-indigo-400',
    swatch: 'bg-indigo-600 dark:bg-indigo-400',
  },
  catboost: {
    stroke: 'stroke-orange-600 dark:stroke-orange-400',
    fill: 'fill-orange-600 dark:fill-orange-400',
    swatch: 'bg-orange-600 dark:bg-orange-400',
  },
  wkd: {
    stroke: 'stroke-stone-500 dark:stroke-stone-400',
    fill: 'fill-stone-500 dark:fill-stone-400',
    swatch: 'bg-stone-500 dark:bg-stone-400',
  },
  persist: {
    stroke: 'stroke-slate-500 dark:stroke-slate-300',
    fill: 'fill-slate-500 dark:fill-slate-300',
    swatch: 'bg-slate-500 dark:bg-slate-300',
  },
};

const FALLBACK_COLORS = [
  {
    stroke: 'stroke-pink-600 dark:stroke-pink-400',
    fill: 'fill-pink-600 dark:fill-pink-400',
    swatch: 'bg-pink-600 dark:bg-pink-400',
  },
  {
    stroke: 'stroke-lime-600 dark:stroke-lime-400',
    fill: 'fill-lime-600 dark:fill-lime-400',
    swatch: 'bg-lime-600 dark:bg-lime-400',
  },
  {
    stroke: 'stroke-teal-600 dark:stroke-teal-400',
    fill: 'fill-teal-600 dark:fill-teal-400',
    swatch: 'bg-teal-600 dark:bg-teal-400',
  },
  {
    stroke: 'stroke-fuchsia-600 dark:stroke-fuchsia-400',
    fill: 'fill-fuchsia-600 dark:fill-fuchsia-400',
    swatch: 'bg-fuchsia-600 dark:bg-fuchsia-400',
  },
];

/** One colour per model id for the given ids, stable for known models and distinct for the rest. */
export function modelColors(
  ids: string[]
): Map<string, { stroke: string; fill: string; swatch: string }> {
  const colors = new Map<string, { stroke: string; fill: string; swatch: string }>();
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

/**
 * Share of slots with a measured wait. The backend's `truthCoverage` wins; an older response
 * without it is counted here.
 */
export function truthCoverage(day: Pick<ModelComparisonDay, 'truth' | 'truthCoverage'>): number {
  if (typeof day.truthCoverage === 'number' && Number.isFinite(day.truthCoverage)) {
    return day.truthCoverage;
  }
  if (day.truth.length === 0) return 0;
  return (
    day.truth.filter((value) => value !== null && Number.isFinite(value)).length / day.truth.length
  );
}

/** Below this coverage the day view says the comparison rests on few measurements. */
export const LOW_TRUTH_COVERAGE = 0.5;

/** What the user picked in the day view; null means "not picked yet". */
export interface DayChoice {
  date: string | null;
  parkId: string | null;
  rideId: string | null;
}

type DayPark = ModelComparisonDayOptions['parks'][number];
type DayRide = DayPark['rides'][number];

/**
 * The date the options must be fetched for before anything is picked: the suggested day when the
 * backend suggests one other than the day it answered for, else none (the answer stands).
 */
export function suggestedOptionsDate(
  options: ModelComparisonDayOptions | undefined
): string | null {
  const suggested = options?.suggested;
  if (!options || !suggested || suggested.date === options.date) return null;
  return options.dates.includes(suggested.date) ? suggested.date : null;
}

/**
 * The day, park and ride the view shows. A pick that is still on offer stands; with nothing
 * picked the backend's suggestion is used; otherwise the first park and its first ride.
 */
export function resolveDaySelection(
  options: ModelComparisonDayOptions,
  choice: DayChoice
): { date: string | null; park: DayPark | null; ride: DayRide | null } {
  const suggested = options.suggested ?? null;
  const fallbackDate = options.dates.includes(options.date)
    ? options.date
    : (options.dates[0] ?? options.date ?? null);
  const date =
    choice.date && options.dates.includes(choice.date)
      ? choice.date
      : suggested && options.dates.includes(suggested.date)
        ? suggested.date
        : fallbackDate;
  // The suggestion names a park and ride of its own day; the parks on offer belong to `options.date`.
  const suggestion = suggested && suggested.date === options.date ? suggested : null;
  const park =
    options.parks.find((p) => p.id === choice.parkId) ??
    (choice.parkId === null && suggestion
      ? options.parks.find((p) => p.id === suggestion.parkId)
      : undefined) ??
    options.parks[0] ??
    null;
  const rides = park ? headlinersFirst(park.rides) : [];
  const ride =
    rides.find((r) => r.id === choice.rideId) ??
    (choice.rideId === null && suggestion && suggestion.parkId === park?.id
      ? rides.find((r) => r.id === suggestion.attractionId)
      : undefined) ??
    rides[0] ??
    null;
  return { date, park, ride };
}

/** A park's rides with headliners first, otherwise in the order the backend sent them. */
export function headlinersFirst(rides: DayRide[]): DayRide[] {
  return [...rides].sort((a, b) => Number(b.isHeadliner) - Number(a.isHeadliner));
}

// The admin reads the report on German time, so "today" and "Stand … Uhr" follow Berlin.
const REPORT_ZONE = 'Europe/Berlin';

/** The report's day (`YYYY-MM-DD`, Berlin): what "overdue" and "in N Tagen" count from. */
export function reportDay(generatedAt: string): string {
  return getDateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: REPORT_ZONE,
  }).format(new Date(generatedAt));
}

/** The report's time of day in Berlin, `10:04`. */
export function reportTime(generatedAt: string): string {
  return getDateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: REPORT_ZONE,
  }).format(new Date(generatedAt));
}

/** Calendar days from `from` to `to` (`YYYY-MM-DD`), negative when `to` lies before. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

/** A day as `07.11.`, with the year only when it differs from `today`'s. */
export function formatShortDay(date: string, today?: string): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${today && today.slice(0, 4) !== year ? year : ''}`;
}

/** A day as `Di, 22.12.`, with the year only when it differs from `today`'s. */
export function formatWeekdayDay(date: string, today?: string): string {
  const weekday = getDateTimeFormat('de-DE', { weekday: 'short', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`))
    .replace('.', '');
  return `${weekday}, ${formatShortDay(date, today)}`;
}

/** „in 3 Tagen“, „morgen“, „heute“, „seit 2 Tagen“ for a day count from the report's day. */
export function formatDaysAway(days: number): string {
  if (days === 0) return 'heute';
  if (days === 1) return 'morgen';
  if (days > 1) return `in ${days} Tagen`;
  return days === -1 ? 'seit gestern' : `seit ${-days} Tagen`;
}

/**
 * Whether a result is late: the backend's `overdue` flag, or, from a backend without it, a date
 * before the report's day.
 */
export function isOverdue(
  expectedBy: NonNullable<ModelCell['expectedBy']>,
  today: string
): boolean {
  return expectedBy.overdue === true || expectedBy.date < today;
}

/**
 * A live difference as the decision cards say it: `0,4 Min. genauer`, `2,6 Pp. ungenauer`. Two
 * decimals below 0.1, so a small gain does not read as zero.
 */
export function formatGain(diff: number, metric: ModelComparisonQuestion['metric']): string {
  const size = Math.abs(diff);
  const unit = metric.unit === 'rate' ? 'Pp.' : 'Min.';
  const word = diffFavoursModel(diff, metric.lowerIsBetter) ? 'genauer' : 'ungenauer';
  return `${formatFigure(size, size < 0.1 ? 2 : 1)} ${unit} ${word}`;
}

/** One model's cell in one question, as the decision cards and the detail panel pass it on. */
export interface CellRef {
  question: ModelComparisonQuestion;
  modelId: string;
  cell: ModelCell;
}

function cellRefs(questions: ModelComparisonQuestion[]): CellRef[] {
  return questions.flatMap((question) =>
    Object.entries(question.cells).map(([modelId, cell]) => ({ question, modelId, cell }))
  );
}

/**
 * „Jetzt umstellbar“: per question, in report order, the cells that are `better`, the largest
 * live gain first and a cell without live figures last.
 */
export function readyDecisions(
  report: ModelComparisonReport
): { question: ModelComparisonQuestion; options: CellRef[] }[] {
  return report.questions
    .map((question) => {
      const gain = ({ cell }: CellRef) =>
        cell.live
          ? question.metric.lowerIsBetter
            ? cell.live.diff
            : -cell.live.diff
          : Number.POSITIVE_INFINITY;
      const options = cellRefs([question])
        .filter((ref) => ref.cell.state === 'better')
        .sort((a, b) => gain(a) - gain(b));
      return { question, options };
    })
    .filter((entry) => entry.options.length > 0);
}

/**
 * „Fast so weit“: the cells still pending although live already confirmed them, grouped by model,
 * the model with the most such questions first and ties in column order.
 */
export function nearDecisions(
  report: ModelComparisonReport
): { modelId: string; items: CellRef[] }[] {
  const order = matrixColumns(report).map((model) => model.id);
  const byModel = new Map<string, CellRef[]>();
  for (const ref of cellRefs(report.questions)) {
    if (ref.cell.state !== 'pending' || ref.cell.checks.live !== 'yes') continue;
    byModel.set(ref.modelId, [...(byModel.get(ref.modelId) ?? []), ref]);
  }
  return [...byModel.entries()]
    .map(([modelId, items]) => ({ modelId, items }))
    .sort(
      (a, b) =>
        b.items.length - a.items.length || order.indexOf(a.modelId) - order.indexOf(b.modelId)
    );
}

/** One date in „Nächste Ergebnisse“: which questions and models expect a result then. */
export interface ResultDate {
  date: string;
  /** Days from the report's day; negative for an overdue date. */
  days: number;
  questions: string[];
  models: string[];
  refs: CellRef[];
}

/**
 * „Nächste Ergebnisse“: every cell with an `expectedBy`, one entry per date. A cell live has
 * confirmed stays in, since its date is then the offline run it waits for. Overdue dates (oldest
 * first) are kept apart from the coming ones (soonest first).
 */
export function resultDates(
  report: ModelComparisonReport,
  today: string
): { overdue: ResultDate[]; upcoming: ResultDate[] } {
  const labels = new Map(matrixColumns(report).map((model) => [model.id, model.label]));
  const overdue = new Map<string, CellRef[]>();
  const upcoming = new Map<string, CellRef[]>();
  for (const ref of cellRefs(report.questions)) {
    const expected = ref.cell.expectedBy;
    if (!expected) continue;
    const target = isOverdue(expected, today) ? overdue : upcoming;
    target.set(expected.date, [...(target.get(expected.date) ?? []), ref]);
  }
  const entries = (byDate: Map<string, CellRef[]>): ResultDate[] =>
    [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, refs]) => ({
        date,
        days: daysBetween(today, date),
        questions: [...new Set(refs.map((ref) => ref.question.label))],
        models: [...new Set(refs.map((ref) => labels.get(ref.modelId) ?? ref.modelId))],
        refs,
      }));
  return { overdue: entries(overdue), upcoming: entries(upcoming) };
}

/**
 * How the matrix is cut into blocks: the live and today rows share one, since the same models
 * answer both. A group not named here gets a block of its own after these.
 */
export const MATRIX_BLOCKS: { id: string; label: string; groups: string[] }[] = [
  { id: 'live-today', label: 'Live und heute', groups: ['live', 'today'] },
  { id: 'planner', label: 'Tagesplaner', groups: ['planner'] },
  { id: 'calendar', label: 'Kalender', groups: ['calendar'] },
];

/** A run of neighbouring columns of one family, for the header above them. */
export interface FamilyRun {
  id: string;
  label: string;
  span: number;
}

/** One block of the matrix: its questions by group, and only the models that answer one of them. */
export interface MatrixBlock {
  id: string;
  label: string;
  sections: { id: string; label: string; questions: ModelComparisonQuestion[] }[];
  columns: ComparisonModel[];
  /** Empty when the report names no families. */
  families: FamilyRun[];
}

/**
 * The models the app shows today: the `in_app` family, or, from a backend without families, every
 * model some question serves.
 */
export function inAppModelIds(report: ModelComparisonReport): Set<string> {
  if (report.families) {
    return new Set(report.models.filter((m) => m.family === 'in_app').map((m) => m.id));
  }
  return new Set(report.questions.map((question) => question.servedModel));
}

/**
 * The matrix blocks. Columns follow the report's family order and the report's model order within
 * a family; without families the in-app models come first, then the report's order.
 */
export function matrixBlocks(report: ModelComparisonReport): MatrixBlock[] {
  const all = matrixColumns(report);
  const inApp = inAppModelIds(report);
  const families = report.families;
  const rank = (model: ComparisonModel) => {
    if (!families) return inApp.has(model.id) ? 0 : 1;
    const index = families.findIndex((family) => family.id === model.family);
    return index === -1 ? families.length : index;
  };
  const groups = groupQuestions(report);
  const named = new Set(MATRIX_BLOCKS.flatMap((block) => block.groups));
  const blocks = [
    ...MATRIX_BLOCKS,
    ...groups
      .filter((group) => !named.has(group.id))
      .map((group) => ({ id: group.id, label: group.label, groups: [group.id] })),
  ];

  return blocks.flatMap((block) => {
    const sections = groups.filter((group) => block.groups.includes(group.id));
    const questions = sections.flatMap((section) => section.questions);
    if (questions.length === 0) return [];
    const columns = all
      .map((model, index) => ({ model, index }))
      .filter(({ model }) => questions.some((question) => question.cells[model.id]))
      .sort((a, b) => rank(a.model) - rank(b.model) || a.index - b.index)
      .map(({ model }) => model);
    const runs: FamilyRun[] = [];
    if (families) {
      for (const model of columns) {
        const id = model.family ?? '';
        const last = runs.at(-1);
        if (last && last.id === id) last.span++;
        else {
          const label = families.find((family) => family.id === id)?.label ?? 'Weitere';
          runs.push({ id, label, span: 1 });
        }
      }
    }
    return [{ id: block.id, label: block.label, sections, columns, families: runs }];
  });
}

/**
 * How far a pending cell is toward the live rule, 0 to 1: the scarcer of days and parks, full once
 * live has confirmed it.
 */
export function liveProgress(cell: ModelCell, rule: ModelComparisonReport['rule']): number {
  if (cell.checks.live === 'yes') return 1;
  if (!cell.live) return 0;
  return Math.max(0, Math.min(1, cell.live.days / rule.minDays, cell.live.parks / rule.minParks));
}

/**
 * The figure beside a progress bar: `5 von 14`, or, while measurements exist but the longest lead
 * has none yet (so days and parks read 0), that sentence instead of a misleading zero.
 */
export function progressLabel(have: number, need: number, live: ModelCellLive): string {
  if (have === 0 && live.n > 0) return 'längste Vorlaufzeit noch ohne Daten';
  return `${getNumberFormat('de-DE').format(have)} von ${need}`;
}
