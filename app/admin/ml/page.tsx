'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Activity, ArrowRight, Grid3x3, ListChecks, Wrench } from 'lucide-react';
import type { MlComponent, MlDecision, MlOverview } from '@/lib/api/admin-ml-overview';
import {
  componentRoleLabel,
  componentStatusMeta,
  decisionStateMeta,
  formatLastRun,
  noProgressLabel,
  progressDaysLabel,
  progressParksLabel,
  progressPercent,
  sortComponentsProblemsFirst,
  sortDecisionsReadyFirst,
} from '@/lib/admin/ml-overview';
import { FIXTURE_OVERVIEW } from '@/lib/admin/ml-overview-fixture';
import { cn } from '@/lib/utils';
import { adminKeys, useAdminQuery } from '../_lib/api';
import { formatDay } from '../_lib/format';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelHeader,
  ToneDot,
} from '../_ui/primitives';
import { MatrixSummary } from './_components/matrix-summary';
import { MlDetails } from './_components/ml-details';

const OVERVIEW_PATH = '/api/admin/ml-overview';

/**
 * The ML-Zentrale: what is up for a decision, where which model is better, whether every model
 * and job ran, and the troubleshooting folds below. `?beispiel=1` shows the sample data.
 */
export default function MlOverviewPage() {
  const fixture = useSearchParams().get('beispiel') === '1';
  const query = useAdminQuery<MlOverview>(
    adminKeys.raw(OVERVIEW_PATH),
    fixture ? null : OVERVIEW_PATH
  );
  const overview = fixture ? FIXTURE_OVERVIEW : query.data;

  return (
    <AdminPage width="wide">
      <header className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">ML-Zentrale</h1>
          {fixture && (
            <Chip tone="warning">
              Beispieldaten ·{' '}
              <Link href="/admin/ml" className="underline underline-offset-2">
                echte Daten laden
              </Link>
            </Chip>
          )}
          {overview && (
            <span className="text-muted-foreground text-xs">
              Stand {formatLastRun(overview.generatedAt)} UTC
            </span>
          )}
        </div>
        <p className="text-muted-foreground max-w-prose text-sm">
          Drei Fragen, in dieser Reihenfolge: Was muss ich entscheiden? Wo ist welches Modell
          besser? Läuft alles? Zum Nachsehen bei Fehlern stehen unten die Details.
        </p>
      </header>

      {!fixture && query.isLoading ? (
        <Panel>
          <LoadingState label="Übersicht wird geladen…" />
        </Panel>
      ) : !fixture && query.error ? (
        <Panel>
          <ErrorState
            message={
              query.error.status === 404
                ? 'Der Server kennt diese Übersicht noch nicht.'
                : query.error.message
            }
            onRetry={() => query.refetch()}
          />
          <p className="text-muted-foreground px-4 pb-4 text-xs">
            Zum Ansehen der Seite gibt es{' '}
            <Link href="/admin/ml?beispiel=1" className="text-primary underline">
              Beispieldaten
            </Link>
            .
          </p>
        </Panel>
      ) : overview ? (
        <>
          <DecisionsPanel decisions={overview.decisions} />
          <Panel>
            <PanelHeader
              icon={Grid3x3}
              title="Wer ist besser?"
              hint="Jedes Modell gegen das, was die App heute an derselben Stelle zeigt."
            />
            <div className="p-4">
              <MatrixSummary summary={overview.matrixSummary} />
            </div>
            <Link
              href="/admin/ml/vergleich"
              className="border-border/50 text-primary hover:bg-muted/30 flex items-center gap-1.5 border-t px-4 py-3 text-sm font-semibold"
            >
              Matrix und Tagesvergleich öffnen <ArrowRight className="h-4 w-4" />
            </Link>
          </Panel>
          <ComponentsPanel components={overview.components} />
        </>
      ) : null}

      <Panel>
        <PanelHeader
          icon={Wrench}
          title="Details"
          hint="Zur Fehlersuche, nicht für Entscheidungen. Lädt erst beim Aufklappen."
        />
        <MlDetails />
      </Panel>
    </AdminPage>
  );
}

function DecisionsPanel({ decisions }: { decisions: MlDecision[] }) {
  return (
    <Panel>
      <PanelHeader
        icon={ListChecks}
        title="Was ansteht"
        hint="Jede Umstellung braucht drei grüne Prüfungen: offline übers Jahr besser, 14 Tage live bestätigt, in der App sichtbar."
      />
      {decisions.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nichts zu entscheiden"
          description="Gerade wartet keine Umstellung auf dich."
        />
      ) : (
        <ul className="divide-border/40 divide-y">
          {sortDecisionsReadyFirst(decisions).map((decision) => (
            <DecisionRow key={decision.id} decision={decision} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function DecisionRow({ decision }: { decision: MlDecision }) {
  const state = decisionStateMeta(decision.state);
  const ready = decision.state === 'ready';
  const pct = decision.progress ? progressPercent(decision.progress) : null;

  return (
    <li
      className={cn(
        'grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_14rem_9.5rem] md:items-center',
        ready && 'border-l-4 border-l-emerald-500 bg-emerald-500/10'
      )}
    >
      <div className="min-w-0">
        <p className={cn('text-sm font-semibold', ready && 'text-base')}>{decision.title}</p>
        <p className="text-muted-foreground text-xs">{decision.detail}</p>
        {decision.cells.length > 0 && (
          <Link
            href="/admin/ml/vergleich"
            className="text-primary mt-1 inline-block text-xs underline-offset-2 hover:underline"
          >
            In der Matrix ansehen
          </Link>
        )}
      </div>
      <div className="text-muted-foreground space-y-1 text-xs">
        {decision.progress && pct != null ? (
          <>
            <p>
              {progressDaysLabel(decision.progress)}
              <span className="block">{progressParksLabel(decision.progress)}</span>
            </p>
            <div
              className="bg-muted h-2 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn('h-full rounded-full', ready ? 'bg-emerald-500' : 'bg-amber-500')}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          </>
        ) : (
          <p>{noProgressLabel(decision.state)}</p>
        )}
        {decision.earliest && <p className="text-foreground/80">{decision.earliest.label}</p>}
        {decision.evaluateOn && (
          <p className="text-foreground/80">
            {decision.evaluated ? 'Am' : 'Wird am'} {formatDay(`${decision.evaluateOn}T12:00:00Z`)}{' '}
            entschieden
          </p>
        )}
      </div>
      <div className="md:text-right">
        <Chip tone={state.tone} className={cn(ready && 'px-3 py-1 text-xs font-semibold')}>
          {state.label}
        </Chip>
      </div>
    </li>
  );
}

function ComponentsPanel({ components }: { components: MlComponent[] }) {
  const sorted = sortComponentsProblemsFirst(components);
  return (
    <Panel>
      <PanelHeader
        icon={Activity}
        title="Läuft alles?"
        hint="Eine Zeile je Modell oder Job: was es liefert und wann es zuletzt gelaufen ist. Zeiten in UTC wie die Takte, Probleme stehen oben."
      />
      {sorted.length === 0 ? (
        <EmptyState icon={Activity} title="Keine Modelle gemeldet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="text-muted-foreground border-border/50 border-b text-left text-[11px] font-semibold tracking-wider uppercase">
                <th className="px-4 py-2.5 font-semibold">Modell</th>
                <th className="px-4 py-2.5 font-semibold">Was es liefert</th>
                <th className="px-4 py-2.5 font-semibold">Zuletzt</th>
                <th className="px-4 py-2.5 font-semibold">Erwartet</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-border/40 divide-y">
              {sorted.map((component) => (
                <ComponentRow key={component.id} component={component} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function ComponentRow({ component }: { component: MlComponent }) {
  const status = componentStatusMeta(component.status);
  const role = componentRoleLabel(component.role);
  return (
    <tr
      className={cn(
        status.tone === 'danger' && 'bg-red-500/5',
        status.tone === 'warning' && 'bg-amber-500/5'
      )}
    >
      <td className="px-4 py-3 align-top font-semibold whitespace-nowrap">{component.name}</td>
      <td className="px-4 py-3 align-top">
        {component.delivers}
        {role && <span className="text-muted-foreground block text-xs">{role}</span>}
      </td>
      <td className="px-4 py-3 align-top font-mono text-xs whitespace-nowrap tabular-nums">
        {formatLastRun(component.lastRunAt)}
      </td>
      <td className="text-muted-foreground px-4 py-3 align-top whitespace-nowrap">
        {component.expected}
      </td>
      <td className="px-4 py-3 align-top">
        <span className="flex items-center gap-2 whitespace-nowrap">
          <ToneDot tone={status.tone} />
          {status.label}
        </span>
        {component.note && (
          <span className="text-muted-foreground block pl-4 text-xs">{component.note}</span>
        )}
      </td>
    </tr>
  );
}
