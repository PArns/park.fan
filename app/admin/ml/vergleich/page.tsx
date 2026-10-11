'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Grid3x3, Info } from 'lucide-react';
import type { ModelComparisonReport } from '@/lib/api/admin-model-comparison';
import { measuredDays } from '@/lib/admin/model-comparison';
import { FIXTURE_REPORT } from '@/lib/admin/model-comparison-fixture';
import { adminKeys, useAdminQuery } from '../../_lib/api';
import { formatDay } from '../../_lib/format';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
  StatTile,
} from '../../_ui/primitives';
import { ModelMatrix } from './_components/model-matrix';
import { DayComparison } from './_components/day-comparison';

const REPORT_PATH = '/api/admin/model-comparison?days=28&region=ALL';

/**
 * Which model answers which question in the app better than the one shown today, as one circle
 * per cell, with one stored day to check the curves against. `?beispiel=1` shows the sample data.
 */
export default function ModelComparisonPage() {
  const fixture = useSearchParams().get('beispiel') === '1';
  const query = useAdminQuery<ModelComparisonReport>(
    adminKeys.raw(REPORT_PATH),
    fixture ? null : REPORT_PATH
  );
  const report = fixture ? FIXTURE_REPORT : query.data;

  return (
    <AdminPage width="wide">
      <header className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Modell-Vergleich</h1>
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
          Für jede Frage, die die App beantwortet: Welches Modell trifft besser als das, was wir
          heute zeigen? Darunter ein echter Tag zum Nachsehen.
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

      <DayComparison fixture={fixture} />

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

function ReportView({ report }: { report: ModelComparisonReport }) {
  const days = measuredDays(report.window);
  const young = days < report.rule.minDays;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Besser als heute"
          value={
            <span className="text-emerald-600 dark:text-emerald-400">{report.summary.better}</span>
          }
          sub="warten auf Live-Bestätigung"
        />
        <StatTile
          label="Messung läuft"
          value={
            <span className="text-amber-600 dark:text-amber-400">{report.summary.pending}</span>
          }
          sub="Ergebnis kommt noch"
        />
        <StatTile
          label="Kein sicherer Unterschied"
          value={<span className="text-muted-foreground">{report.summary.unclear}</span>}
          sub="weder klar besser noch schlechter"
        />
        <StatTile
          label="Schlechter als heute"
          value={<span className="text-red-600 dark:text-red-400">{report.summary.worse}</span>}
          sub="bleibt, wie es ist"
        />
      </div>

      <Panel>
        <PanelHeader
          icon={Grid3x3}
          title="Wo ist welches Modell besser?"
          hint="Jede Zeile ist eine Frage aus der App, jede Spalte ein Modell. Der Kreis sagt, ob das Modell besser trifft als das, was wir heute an dieser Stelle zeigen. Ein Klick zeigt Zahlen und Begründung."
        />
        {young && (
          <PanelBody className="border-border/50 flex items-start gap-2 border-b py-2.5 text-xs">
            <Info className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="text-muted-foreground">
              {days === 0
                ? 'Live wird noch nichts gemessen.'
                : `Live wird seit ${formatDay(`${report.window.firstDate}T12:00:00Z`)} gemessen, also seit ${days} ${days === 1 ? 'Tag' : 'Tagen'}.`}{' '}
              Grün oder rot wird ein Kreis live erst nach {report.rule.minDays} Tagen in mindestens{' '}
              {report.rule.minParks} Parks. Bis dahin stehen viele Kreise auf „Messung läuft“ oder
              „kein sicherer Unterschied“, und das ist so gewollt.
            </p>
          </PanelBody>
        )}
        {report.questions.length === 0 ? (
          <EmptyState
            icon={Grid3x3}
            title="Noch keine Fragen ausgewertet"
            description="Der Server hat für diesen Zeitraum keine Auswertung geliefert."
          />
        ) : (
          <ModelMatrix report={report} />
        )}
      </Panel>
    </>
  );
}
