import { cn } from '@/lib/utils';
import type {
  ComparisonModel,
  ModelCell,
  ModelCellLive,
  ModelCheckState,
  ModelComparisonQuestion,
  ModelComparisonReport,
} from '@/lib/api/admin-model-comparison';
import {
  CELL_STATE_META,
  CHECK_STATE_META,
  daysBetween,
  formatDaysAway,
  formatDiff,
  formatError,
  formatWeekdayDay,
  isOverdue,
  progressLabel,
  whiskerGeometry,
} from '@/lib/admin/model-comparison';
import { getNumberFormat } from '@/lib/utils/intl-format';
import { Chip, Meta } from '../../../_ui/primitives';
import { CheckDot, STATE_TONE, StateDot } from './state-dot';

/**
 * The inspector body for one cell: its state and sentence, when the result is due or how late it
 * is, the live difference against what the app shows, the progress toward the rule, the three
 * checks and the model in one sentence.
 */
export function CellDetail({
  question,
  model,
  served,
  cell,
  rule,
  today,
}: {
  question: ModelComparisonQuestion;
  model: ComparisonModel;
  served: string;
  cell: ModelCell;
  rule: ModelComparisonReport['rule'];
  today: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Chip tone={STATE_TONE[cell.state]} className="py-1 pl-1">
          <StateDot state={cell.state} size="sm" />
          {CELL_STATE_META[cell.state].label}
        </Chip>
        <p className="text-sm text-pretty">{cell.note}</p>
      </div>

      {cell.state === 'today' ? (
        <p className="text-muted-foreground text-xs">
          Gegen dieses Modell werden alle anderen in dieser Zeile gemessen.
        </p>
      ) : (
        <>
          {cell.expectedBy && (
            <Expected
              expectedBy={cell.expectedBy}
              live={cell.checks.live !== 'yes'}
              today={today}
            />
          )}
          {cell.live ? (
            <LiveBlock question={question} served={served} live={cell.live} rule={rule} />
          ) : (
            <Section title="Live">
              <p className="text-muted-foreground text-xs">
                Noch keine Live-Messung zu diesem Modell.
              </p>
            </Section>
          )}
          <Section title="Prüfungen">
            <ul className="space-y-2 text-sm">
              <CheckItem
                state={cell.checks.offline}
                label="Offline übers ganze Jahr"
                hint={
                  cell.offline
                    ? [
                        cell.offline.source,
                        cell.offline.period && formatPeriod(cell.offline.period),
                      ]
                        .filter(Boolean)
                        .join(', ')
                    : undefined
                }
              />
              <CheckItem
                state={cell.checks.live}
                label="Live sicher besser"
                hint={`${rule.minDays} Tage je Park in mindestens ${rule.minParks} Parks`}
              />
              <CheckItem
                state={cell.checks.visible ? 'yes' : 'no'}
                label="Unterschied in der App sichtbar"
                value={cell.checks.visible ? 'ja' : 'nein'}
              />
            </ul>
          </Section>
        </>
      )}

      {model.oneLiner && (
        <p className="text-muted-foreground border-t border-white/[0.06] pt-3 text-xs">
          <span className="text-foreground font-medium">{model.label}:</span> {model.oneLiner}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-muted-foreground text-xs font-medium">{title}</h3>
      {children}
    </section>
  );
}

/** A benchmark period: `2025-10-11..2026-10-10` reads `11.10.2025 bis 10.10.2026`, prose stays. */
function formatPeriod(period: string): string {
  const parts = period.split('..');
  if (parts.length !== 2 || !parts.every((part) => /^\d{4}-\d{2}-\d{2}$/.test(part))) return period;
  return parts.map((part) => part.split('-').reverse().join('.')).join(' bis ');
}

function Expected({
  expectedBy,
  live,
  today,
}: {
  expectedBy: NonNullable<ModelCell['expectedBy']>;
  live: boolean;
  today: string;
}) {
  const days = daysBetween(today, expectedBy.date);
  const when = formatWeekdayDay(expectedBy.date, today);
  if (isOverdue(expectedBy, today)) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
        <p className="font-semibold">
          Überfällig seit {when}
          {days < 0 ? `, ${formatDaysAway(days)}` : ''}
        </p>
        <p className="text-xs text-amber-200/80">
          {expectedBy.label.replace(/^überfällig seit [^:]*:\s*/i, '')}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm">
      <p className="text-muted-foreground text-xs">
        {live ? 'Live-Ergebnis' : 'Offline-Ergebnis'} erwartet am
      </p>
      <p className="font-semibold tabular-nums">
        {when}, {formatDaysAway(days)}
      </p>
    </div>
  );
}

function LiveBlock({
  question,
  served,
  live,
  rule,
}: {
  question: ModelComparisonQuestion;
  served: string;
  live: ModelCellLive;
  rule: ModelComparisonReport['rule'];
}) {
  const { unit } = question.metric;
  const unitLabel = unit === 'rate' ? '%' : 'Min.';
  return (
    <>
      <Section title={`Live-Unterschied zu „${served}“`}>
        <Whisker live={live} lowerIsBetter={question.metric.lowerIsBetter} />
        <p className="text-muted-foreground text-xs tabular-nums">
          {formatDiff(live.diff, unit)}, sichere Spanne {formatDiff(live.ciLow, unit)} bis{' '}
          {formatDiff(live.ciHigh, unit)}
          {live.ci === 'park_date' ? ' (Parks × Tage)' : ''}
        </p>
      </Section>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        <Meta
          label="Fehler dieses Modells"
          value={`${formatError(live.modelMae, unit)} ${unitLabel}`}
        />
        <Meta
          label="Fehler heute in der App"
          value={`${formatError(live.referenceMae, unit)} ${unitLabel}`}
        />
        <Meta
          label="Gemessen seit"
          value={live.since ? formatWeekdayDay(live.since) : 'noch nicht'}
        />
        <Meta
          label="Messwerte"
          value={live.n ? getNumberFormat('de-DE').format(live.n) : 'noch keine'}
        />
      </div>
      <Section title="Bis zur Live-Entscheidung">
        <Progress label="Tage je Park" have={live.days} need={rule.minDays} live={live} />
        <Progress label="Parks" have={live.parks} need={rule.minParks} live={live} />
      </Section>
    </>
  );
}

function Progress({
  label,
  have,
  need,
  live,
}: {
  label: string;
  have: number;
  need: number;
  live: ModelCellLive;
}) {
  const share = Math.min(1, have / need);
  return (
    <div className="space-y-1 text-xs">
      <div className="text-muted-foreground flex justify-between gap-3">
        <span>{label}</span>
        <span className="text-foreground text-right font-medium tabular-nums">
          {progressLabel(have, need, live)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn('h-full rounded-full', share >= 1 ? 'bg-emerald-500' : 'bg-amber-500')}
          style={{ width: `${Math.max(share * 100, 2)}%` }}
        />
      </div>
    </div>
  );
}

function CheckItem({
  state,
  label,
  hint,
  value,
}: {
  state: ModelCheckState;
  label: string;
  hint?: string;
  value?: string;
}) {
  return (
    <li className="grid grid-cols-[14px_minmax(0,1fr)] gap-2.5">
      <span className="mt-[3px]">
        <CheckDot state={state} />
      </span>
      <span>
        {label}: {value ?? CHECK_STATE_META[state].label}
        {hint && <span className="text-muted-foreground block text-xs">{hint}</span>}
      </span>
    </li>
  );
}

/**
 * The live difference as a small forest plot around a centred zero: the gate's interval over all
 * days, and below it the parks-only interval when the backend sends one, both on one scale.
 */
function Whisker({ live, lowerIsBetter }: { live: ModelCellLive; lowerIsBetter: boolean }) {
  const width = 280;
  const perPark = live.parkCiLow != null && live.parkCiHigh != null;
  const extra = perPark ? [live.parkCiLow as number, live.parkCiHigh as number] : [];
  const rows = [
    { label: 'alle Tage', y: 14, low: live.ciLow, high: live.ciHigh, r: 5 },
    ...(perPark ? [{ label: 'je Park', y: 34, low: extra[0], high: extra[1], r: 3.5 }] : []),
  ];
  const height = perPark ? 46 : 26;
  const crossesZero =
    Math.min(live.ciLow, live.ciHigh) <= 0 && Math.max(live.ciLow, live.ciHigh) >= 0;
  const favours = lowerIsBetter ? live.diff < 0 : live.diff > 0;
  const tone = crossesZero
    ? 'fill-muted-foreground stroke-muted-foreground'
    : favours
      ? 'fill-emerald-400 stroke-emerald-400'
      : 'fill-red-400 stroke-red-400';

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full"
        role="img"
        aria-label={`Unterschied ${live.diff}, Spanne ${live.ciLow} bis ${live.ciHigh}`}
      >
        {rows.map((row, index) => {
          const g = whiskerGeometry(live.diff, row.low, row.high, width, 8, [
            live.ciLow,
            live.ciHigh,
            ...extra,
          ]);
          return (
            <g key={row.label} opacity={index === 0 ? 1 : 0.7}>
              {index === 0 && (
                <line
                  x1={g.zero}
                  x2={g.zero}
                  y1={0}
                  y2={height}
                  className="stroke-foreground/40"
                  strokeDasharray="2 3"
                />
              )}
              <line
                x1={g.low}
                x2={g.high}
                y1={row.y}
                y2={row.y}
                className={tone}
                strokeWidth={index === 0 ? 3 : 2}
                strokeLinecap="round"
              />
              <circle cx={g.point} cy={row.y} r={row.r} className={tone} />
              <text x={2} y={row.y - 6} className="fill-muted-foreground text-[10px]">
                {row.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="text-muted-foreground grid grid-cols-[1fr_auto_1fr] text-[10px]">
        <span>{lowerIsBetter ? '← genauer als heute' : '← ungenauer als heute'}</span>
        <span>0</span>
        <span className="text-right">{lowerIsBetter ? 'ungenauer →' : 'genauer →'}</span>
      </div>
    </div>
  );
}
