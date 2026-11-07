'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { ModelComparisonReport } from '@/lib/api/admin-model-comparison';
import {
  formatDaysAway,
  formatGain,
  formatShortDay,
  nearDecisions,
  readyDecisions,
  resultDates,
  type CellRef,
  type ResultDate,
} from '@/lib/admin/model-comparison';
import { Panel } from '../../../_ui/primitives';
import { CheckDot, StateDot } from './state-dot';

/** Opens a cell's detail; the clicked element gets the focus back when it closes. */
export type OpenCell = (ref: CellRef, trigger: HTMLElement) => void;

const VISIBLE_DATES = 4;

/**
 * The three cards above the matrix, all derived from the report: what can be switched now, what
 * live has confirmed and only waits for the offline year, and when the next results are due.
 */
export function DecisionCards({
  report,
  labels,
  today,
  onOpen,
}: {
  report: ModelComparisonReport;
  labels: Map<string, string>;
  today: string;
  onOpen: OpenCell;
}) {
  return (
    <section
      aria-label="Entscheidungen"
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,0.9fr)]"
    >
      <Ready report={report} labels={labels} onOpen={onOpen} />
      <Near report={report} labels={labels} onOpen={onOpen} />
      <Upcoming report={report} today={today} />
    </section>
  );
}

function Card({
  title,
  icon,
  tint,
  className,
  children,
}: {
  title: string;
  icon?: ReactNode;
  tint?: 'ready' | 'near';
  className?: string;
  children: ReactNode;
}) {
  return (
    <Panel
      className={cn(
        'flex min-w-0 flex-col gap-3 p-4',
        tint === 'ready' &&
          'border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.1] to-transparent to-70%',
        tint === 'near' && 'bg-gradient-to-b from-amber-500/[0.1] to-transparent to-70%',
        className
      )}
    >
      <h2 className="text-muted-foreground flex items-center gap-2 text-[13px] font-semibold">
        {icon}
        {title}
      </h2>
      {children}
    </Panel>
  );
}

function Headline({ children, sub }: { children: ReactNode; sub: ReactNode }) {
  return (
    <p className="text-xl leading-tight font-semibold tracking-tight text-balance">
      {children}
      <span className="text-muted-foreground mt-1 block text-[13px] font-normal tracking-normal">
        {sub}
      </span>
    </p>
  );
}

const open = (onOpen: OpenCell, ref: CellRef) => (event: MouseEvent<HTMLButtonElement>) =>
  onOpen(ref, event.currentTarget);

function Ready({
  report,
  labels,
  onOpen,
}: {
  report: ModelComparisonReport;
  labels: Map<string, string>;
  onOpen: OpenCell;
}) {
  const ready = readyDecisions(report);
  const groupLabel = (id: string) => report.groups.find((group) => group.id === id)?.label ?? id;
  return (
    <Card title="Jetzt umstellbar" icon={<StateDot state="better" size="sm" />} tint="ready">
      {ready.length === 0 ? (
        <Headline sub="Kein Modell ist bisher in einer Frage besser als das, was die App zeigt.">
          Noch nichts.
        </Headline>
      ) : (
        ready.map(({ question, options }) => (
          <div key={question.id} className="space-y-2">
            <Headline
              sub={`${groupLabel(question.group)}, ${question.sub}. Heute zeigt die App „${labels.get(question.servedModel) ?? question.servedModel}“.`}
            >
              {question.label}
            </Headline>
            {options.map((ref) => (
              <button
                key={ref.modelId}
                type="button"
                onClick={open(onOpen, ref)}
                className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-left transition-colors hover:border-white/[0.14]"
              >
                <StateDot state="better" />
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {labels.get(ref.modelId) ?? ref.modelId}
                  </span>
                  <span className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <CheckDot state={ref.cell.checks.offline} /> Offline übers Jahr
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckDot state={ref.cell.checks.live} />
                      Live{' '}
                      {ref.cell.live
                        ? `${ref.cell.live.days} Tage, ${ref.cell.live.parks} Parks`
                        : ''}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckDot state={ref.cell.checks.visible ? 'yes' : 'no'} /> In der App
                      sichtbar
                    </span>
                  </span>
                </span>
                {ref.cell.live && (
                  <span className="text-[15px] font-semibold whitespace-nowrap text-emerald-400 tabular-nums">
                    {formatGain(ref.cell.live.diff, question.metric)}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))
      )}
    </Card>
  );
}

function Near({
  report,
  labels,
  onOpen,
}: {
  report: ModelComparisonReport;
  labels: Map<string, string>;
  onOpen: OpenCell;
}) {
  const [first, ...rest] = nearDecisions(report);
  const label = (id: string) => labels.get(id) ?? id;
  return (
    <Card title="Fast so weit" icon={<StateDot state="pending" size="sm" />} tint="near">
      {!first ? (
        <Headline sub="Kein Modell ist live sicher besser und wartet nur noch auf die Messung übers Jahr.">
          Nichts.
        </Headline>
      ) : (
        <>
          <Headline sub="Es fehlt nur noch die Messung übers ganze Jahr (offline).">
            {label(first.modelId)} ist live in{' '}
            {first.items.length === 1 ? 'einer Frage' : `${first.items.length} Fragen`} sicher
            genauer
          </Headline>
          <ul className="text-sm">
            {first.items.map((ref) => (
              <li key={ref.question.id}>
                <button
                  type="button"
                  onClick={open(onOpen, ref)}
                  className="flex min-h-10 w-full items-baseline justify-between gap-3 border-t border-white/[0.06] py-2 text-left hover:underline hover:underline-offset-3"
                >
                  <span>{ref.question.label}</span>
                  {ref.cell.live && (
                    <span className="font-semibold whitespace-nowrap text-amber-400 tabular-nums">
                      {formatGain(ref.cell.live.diff, ref.question.metric)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {rest.length > 0 && (
            <p className="text-muted-foreground text-xs">
              Außerdem:{' '}
              {rest
                .map(({ modelId, items }) =>
                  items.length === 1
                    ? `${label(modelId)} in „${items[0].question.label}“`
                    : `${label(modelId)} in ${items.length} Fragen`
                )
                .join(', ')}
              .
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function Upcoming({ report, today }: { report: ModelComparisonReport; today: string }) {
  const { overdue, upcoming } = resultDates(report, today);
  const [all, setAll] = useState(false);
  const shown = all ? upcoming : upcoming.slice(0, VISIBLE_DATES);
  const last = upcoming.at(-1);
  return (
    <Card title="Nächste Ergebnisse" className="md:col-span-2 xl:col-span-1">
      {overdue.length === 0 && upcoming.length === 0 ? (
        <Headline sub="Für kein Ergebnis steht ein Termin aus.">Keine Termine.</Headline>
      ) : (
        <>
          {overdue.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-amber-400">Überfällig</h3>
              <DateList dates={overdue} today={today} />
            </div>
          )}
          {shown.length > 0 && <DateList dates={shown} today={today} />}
          {!all && last && upcoming.length > VISIBLE_DATES && (
            <button
              type="button"
              onClick={() => setAll(true)}
              className="text-primary-ink min-h-6 self-start text-xs hover:underline"
            >
              Alle {upcoming.length} Termine bis {formatShortDay(last.date, today)} zeigen
            </button>
          )}
        </>
      )}
    </Card>
  );
}

function DateList({ dates, today }: { dates: ResultDate[]; today: string }) {
  return (
    <ol className="text-sm">
      {dates.map((entry) => (
        <li
          key={entry.date}
          className="grid grid-cols-[56px_minmax(0,1fr)] gap-2.5 border-t border-white/[0.06] py-2 first:border-t-0"
        >
          <span className="font-semibold tabular-nums">
            {formatShortDay(entry.date, today)}
            <span className="text-muted-foreground block text-[11px] font-normal">
              {formatDaysAway(entry.days)}
            </span>
          </span>
          <span className="text-muted-foreground min-w-0">
            <span className="text-foreground font-medium">{entry.questions.join(', ')}</span>
            <span className="block">{entry.models.join(', ')}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
