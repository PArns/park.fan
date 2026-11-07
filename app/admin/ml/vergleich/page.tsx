'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Grid3x3 } from 'lucide-react';
import type { ModelComparisonReport } from '@/lib/api/admin-model-comparison';
import {
  CELL_STATE_META,
  formatShortDay,
  inAppModelIds,
  matrixColumns,
  measuredDays,
  reportDay,
  reportTime,
  type CellRef,
} from '@/lib/admin/model-comparison';
import { FIXTURE_REPORT } from '@/lib/admin/model-comparison-fixture';
import { useInspector } from '../../_app/inspector';
import { adminKeys, useAdminQuery } from '../../_lib/api';
import { ShareBar } from '../../_ui/charts';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
} from '../../_ui/primitives';
import { CellDetail } from './_components/cell-detail';
import { DayComparison } from './_components/day-comparison';
import { DecisionCards } from './_components/decision-cards';
import { ModelMatrix } from './_components/model-matrix';
import { STATE_FILL } from './_components/state-dot';

const REPORT_PATH = '/api/admin/model-comparison?days=28&region=ALL';

/**
 * Which model answers which question in the app better than the one shown today: the decisions
 * up for the owner, one bar over every comparison, the matrix in blocks with each cell's detail in
 * the inspector, and one stored day to check the curves against. `?beispiel=1` shows sample data.
 */
export default function ModelComparisonPage() {
  const fixture = useSearchParams().get('beispiel') === '1';
  const query = useAdminQuery<ModelComparisonReport>(
    adminKeys.raw(REPORT_PATH),
    fixture ? null : REPORT_PATH
  );
  const report = fixture ? FIXTURE_REPORT : query.data;
  const inApp = useMemo(() => (report ? inAppModelIds(report) : new Set<string>()), [report]);

  return (
    <AdminPage width="wide">
      <header className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Modellvergleich</h1>
          {fixture && (
            <Chip tone="warning">
              Beispieldaten ·{' '}
              <Link href="/admin/ml/vergleich" className="underline underline-offset-2">
                echte Daten laden
              </Link>
            </Chip>
          )}
        </div>
        <p className="text-muted-foreground max-w-prose text-sm">
          {report
            ? standLine(report)
            : 'Für jede Frage, die die App beantwortet: Welches Modell trifft besser als das, was wir heute zeigen?'}
        </p>
      </header>

      {!fixture && query.isLoading ? (
        <Panel>
          <LoadingState label="Vergleich wird berechnet…" />
        </Panel>
      ) : !fixture && query.error ? (
        <Panel>
          <ErrorState
            message={
              query.error.status === 404
                ? 'Der Server kennt diese Auswertung noch nicht.'
                : query.error.message
            }
            onRetry={() => query.refetch()}
          />
          <p className="text-muted-foreground px-4 pb-4 text-xs">
            Zum Ansehen der Seite gibt es{' '}
            <Link href="/admin/ml/vergleich?beispiel=1" className="text-primary underline">
              Beispieldaten
            </Link>
            .
          </p>
        </Panel>
      ) : report ? (
        <ReportView report={report} />
      ) : null}

      <DayComparison fixture={fixture} inApp={inApp} />

      {report && report.models.some((model) => model.oneLiner) && (
        <Panel>
          <PanelHeader title="Die Modelle in einem Satz" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3">
            {report.models
              .filter((model) => model.oneLiner)
              .map((model) => (
                <div key={model.id} className="border-border/40 border-t px-4 py-3 text-sm">
                  <p className="font-medium">{model.label}</p>
                  <p className="text-muted-foreground text-xs">{model.oneLiner}</p>
                </div>
              ))}
          </div>
        </Panel>
      )}

      {report && (
        <p className="text-muted-foreground text-xs">
          Regel: Umgestellt wird erst, wenn ein Modell offline über das ganze Jahr besser ist, live
          mindestens {report.rule.minDays} Tage in {report.rule.minParks} Parks bestätigt ist und
          der Unterschied in der App sichtbar ist.
        </p>
      )}
    </AdminPage>
  );
}

function standLine(report: ModelComparisonReport): string {
  const today = reportDay(report.generatedAt);
  const stand = `Stand ${formatShortDay(today)} um ${reportTime(report.generatedAt)} Uhr.`;
  const { firstDate, lastDate } = report.window;
  if (!firstDate || !lastDate) return `${stand} Live wird noch nichts gemessen.`;
  const days = measuredDays(report.window);
  return `${stand} Live gemessen vom ${formatShortDay(firstDate, today)} bis ${formatShortDay(lastDate, today)}, also ${days} ${days === 1 ? 'Tag' : 'Tage'}.`;
}

function ReportView({ report }: { report: ModelComparisonReport }) {
  const inspector = useInspector();
  const { show, clear } = inspector;
  const [selected, setSelected] = useState<{ question: string; model: string } | null>(null);
  const today = reportDay(report.generatedAt);
  const columns = useMemo(() => matrixColumns(report), [report]);
  const labels = useMemo(() => new Map(columns.map((m) => [m.id, m.label])), [columns]);

  // The inspector outlives the page; leaving takes the detail and the topbar toggle with it.
  useEffect(() => clear, [clear]);

  const openCell = useCallback(
    ({ question, modelId, cell }: CellRef, trigger: HTMLElement) => {
      const model = columns.find((m) => m.id === modelId) ?? {
        id: modelId,
        label: modelId,
        oneLiner: '',
      };
      setSelected({ question: question.id, model: modelId });
      show(
        {
          title: model.label,
          subtitle: `${question.label}, ${question.sub}`,
          body: (
            <CellDetail
              question={question}
              model={model}
              served={labels.get(question.servedModel) ?? question.servedModel}
              cell={cell}
              rule={report.rule}
              today={today}
            />
          ),
        },
        trigger
      );
    },
    [columns, labels, report.rule, show, today]
  );

  const { summary, rule } = report;
  const total = summary.better + summary.pending + summary.worse + summary.unclear;
  const mostOpen = (summary.pending + summary.unclear) * 2 > total;
  const young = measuredDays(report.window) < rule.minDays;

  return (
    <>
      <DecisionCards report={report} labels={labels} today={today} onOpen={openCell} />

      <Panel>
        <PanelBody className="space-y-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-sm font-semibold">{total} Vergleiche</h2>
            {(young || mostOpen) && (
              <p className="text-muted-foreground text-xs">
                {mostOpen ? 'Die meisten sind noch offen. Das ist so gewollt: grün' : 'Grün'} oder
                rot wird ein Kreis erst nach {rule.minDays} Tagen in {rule.minParks} Parks.
              </p>
            )}
          </div>
          <ShareBar
            parts={(['better', 'pending', 'worse', 'unclear'] as const).map((state) => ({
              key: state,
              label: CELL_STATE_META[state].short,
              value: summary[state],
              color: STATE_FILL[state],
            }))}
          />
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          icon={Grid3x3}
          title="Wo ist welches Modell besser?"
          hint="Eine Zeile je Frage in der App, ein Kreis je Modell, verglichen mit dem, was die App dort heute zeigt. Ein Klick erklärt den Kreis."
        />
        {report.questions.length === 0 ? (
          <EmptyState
            icon={Grid3x3}
            title="Noch keine Fragen ausgewertet"
            description="Der Server hat für diesen Zeitraum keine Auswertung geliefert."
          />
        ) : (
          <ModelMatrix
            report={report}
            selected={inspector.open ? selected : null}
            onOpen={openCell}
          />
        )}
      </Panel>
    </>
  );
}
