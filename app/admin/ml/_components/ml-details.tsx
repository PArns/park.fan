'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import type { SystemHealthResponse, TftTrainingProgress as TftProgress } from '@/lib/api/admin';
import type {
  MlAlert,
  MlAnomalyStats,
  MlDashboard,
  MlMetrics,
  MlPerformer,
} from '@/lib/api/admin-stats';
import { useAdminFetch } from '../../_lib/admin-context';
import { formatDay, maeColor } from '../../_lib/format';
import {
  Chip,
  ErrorState,
  LoadingState,
  Meta,
  Tile,
  severityTone,
  statusTone,
} from '../../_ui/primitives';

const TYPICAL_TRAINING_SECONDS = 850;

function TrainingProgress({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const pct = Math.min(Math.round((elapsed / TYPICAL_TRAINING_SECONDS) * 100), 99);
  const remaining = Math.max(TYPICAL_TRAINING_SECONDS - elapsed, 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-blue-400">
          läuft seit {Math.floor(elapsed / 60)} Min. {elapsed % 60} s
        </span>
        {remaining > 0 && (
          <span className="text-muted-foreground">noch etwa {Math.ceil(remaining / 60)} Min.</span>
        )}
      </div>
      <ProgressBar pct={pct} />
    </div>
  );
}

function TftTrainingProgress({ p }: { p: TftProgress }) {
  const pct = Math.min(Math.max(Math.round(p.pct), 0), 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-blue-400">
          Teil {p.chunk} von {p.n_chunks} · Schritt {p.step} von {p.max_steps}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {pct} %{p.loss != null ? ` · Loss ${p.loss.toFixed(3)}` : ''}
        </span>
      </div>
      <ProgressBar pct={pct} />
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
      <div
        className="h-full rounded-full bg-blue-500 transition-all duration-1000"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function MetricsRow({ label, m }: { label: string; m: MlMetrics }) {
  return (
    <div className="border-border/40 grid min-w-[22rem] grid-cols-5 gap-2 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right font-mono tabular-nums ${maeColor(m.mae)}`}>
        {m.mae.toFixed(2)}
      </span>
      <span className="text-right font-mono tabular-nums">{m.rmse.toFixed(2)}</span>
      <span className="text-right font-mono tabular-nums">{m.mape.toFixed(1)} %</span>
      <span className="text-right font-mono tabular-nums">{m.r2Score.toFixed(3)}</span>
    </div>
  );
}

function PerformerList({
  title,
  icon: Icon,
  performers,
}: {
  title: string;
  icon: typeof TrendingUp;
  performers: MlPerformer[];
}) {
  return (
    <Tile icon={Icon} title={title}>
      <div className="space-y-1.5">
        {performers.map((p) => (
          <div key={p.attractionId} className="flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0">
              <p className="truncate">{p.attractionName}</p>
              <p className="text-muted-foreground truncate text-xs">{p.parkName}</p>
            </div>
            <span className={`shrink-0 font-mono tabular-nums ${maeColor(p.mae)}`}>
              {p.mae.toFixed(1)} Min.
            </span>
          </div>
        ))}
      </div>
    </Tile>
  );
}

/**
 * One collapsed section. Its content mounts only while it is open, so the fetches behind it run
 * when somebody looks and not on every page load.
 */
function Fold({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="group border-border/50 border-t"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="hover:bg-muted/30 flex cursor-pointer list-none items-start gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="text-muted-foreground block text-xs">{hint}</span>
        </span>
      </summary>
      {open && <div className="space-y-3 px-4 pb-4">{children}</div>}
    </details>
  );
}

function TrainingDetails() {
  const dash = useAdminFetch<MlDashboard>('/api/ml/dashboard');
  const health = useAdminFetch<SystemHealthResponse>('/api/admin/system-health');

  const catboost = health.data?.ml.catboost;
  const tft = health.data?.ml.tft;
  const cbTraining = !!(catboost?.training.is_training && catboost.training.started_at);
  const tftTraining = !!tft?.training.is_training;
  const tftError = tft?.training.error;

  return (
    <>
      <Tile title="Läuft gerade ein Training?">
        {health.error ? (
          <p className="text-xs text-red-400">{health.error}</p>
        ) : !health.data ? (
          <p className="text-muted-foreground text-xs">Lädt…</p>
        ) : !cbTraining && !tftTraining && !tftError ? (
          <p className="text-muted-foreground text-sm">Nein, gerade trainiert kein Modell.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cbTraining && catboost?.training.started_at && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium">CatBoost</p>
                <TrainingProgress startedAt={catboost.training.started_at} />
              </div>
            )}
            {tftTraining && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium">TFT</p>
                {tft?.training.progress ? (
                  <TftTrainingProgress p={tft.training.progress} />
                ) : (
                  <p className="text-muted-foreground text-xs">startet, Daten werden geladen…</p>
                )}
              </div>
            )}
            {tftError && !tftTraining && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium">TFT, letztes Training fehlgeschlagen</p>
                <p className="text-xs text-red-400">{tftError}</p>
              </div>
            )}
          </div>
        )}
      </Tile>

      {dash.error ? (
        <ErrorState message={`ML-Dashboard: ${dash.error}`} />
      ) : !dash.data ? (
        <LoadingState />
      ) : (
        <Tile
          title="CatBoost: Fehler im Training und live"
          hint="Live misst hier CatBoost allein, nicht das, was die App ausliefert. Was die App zeigt, vergleicht die Matrix."
        >
          <div className="overflow-x-auto">
            <div className="border-border/60 text-muted-foreground grid min-w-[22rem] grid-cols-5 gap-2 border-b pb-2 text-xs font-medium tracking-wide uppercase">
              <span />
              <span className="text-right">MAE</span>
              <span className="text-right">RMSE</span>
              <span className="text-right">MAPE</span>
              <span className="text-right">R²</span>
            </div>
            <MetricsRow label="Training" m={dash.data.performance.training} />
            <MetricsRow
              label="Live"
              m={{
                mae: dash.data.performance.live.mae,
                rmse: dash.data.performance.live.rmse,
                mape: dash.data.performance.live.mape,
                r2Score: dash.data.performance.live.r2Score,
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">
            <Meta label="Version" value={dash.data.model.current.version} />
            <Meta label="Trainiert" value={formatDay(dash.data.model.current.trainedAt)} />
            <Meta label="Nächstes Training" value={formatDay(dash.data.system.nextTraining)} />
            <Meta
              label="Drift"
              value={
                <Chip tone={statusTone(dash.data.performance.drift.status)}>
                  {dash.data.performance.drift.status}
                </Chip>
              }
            />
          </div>
        </Tile>
      )}
    </>
  );
}

function PerformerDetails() {
  const dash = useAdminFetch<MlDashboard>('/api/ml/dashboard');
  const tft = useAdminFetch<{ topPerformers: MlPerformer[]; bottomPerformers: MlPerformer[] }>(
    '/api/ml/monitoring/tft/performers'
  );

  if (dash.error) return <ErrorState message={`ML-Dashboard: ${dash.error}`} />;
  if (!dash.data) return <LoadingState />;

  return (
    <>
      <p className="text-muted-foreground text-xs">
        Durchschnittlich so viele Minuten lag die Prognose daneben.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PerformerList
          title="CatBoost, Stundenwerte: trifft gut"
          icon={TrendingUp}
          performers={dash.data.insights.topPerformers}
        />
        <PerformerList
          title="CatBoost, Stundenwerte: trifft schlecht"
          icon={TrendingDown}
          performers={dash.data.insights.bottomPerformers}
        />
      </div>
      {tft.data && tft.data.topPerformers.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PerformerList
            title="TFT, Tageswerte: trifft gut"
            icon={TrendingUp}
            performers={tft.data.topPerformers}
          />
          <PerformerList
            title="TFT, Tageswerte: trifft schlecht"
            icon={TrendingDown}
            performers={tft.data.bottomPerformers}
          />
        </div>
      )}
    </>
  );
}

function WarningDetails() {
  const alerts = useAdminFetch<MlAlert[]>('/api/ml/monitoring/alerts');
  const anomalies = useAdminFetch<MlAnomalyStats>('/api/ml/monitoring/anomalies/stats');
  const active = (alerts.data ?? []).filter((alert) => alert.status === 'active');

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <Tile title="Ausreißer">
        {anomalies.data ? (
          <>
            <span className="text-3xl font-bold tabular-nums">{anomalies.data.totalAnomalies}</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(anomalies.data.bySeverity).map(([severity, count]) => (
                <span key={severity} className="flex items-center gap-1">
                  <Chip tone={severityTone(severity)}>{severity}</Chip>
                  <span className="text-muted-foreground text-xs tabular-nums">{count}</span>
                </span>
              ))}
            </div>
          </>
        ) : (
          <span className="text-muted-foreground text-sm">
            {anomalies.error ? anomalies.error : 'Lädt…'}
          </span>
        )}
      </Tile>

      <Tile title="Aktive Warnungen" className="lg:col-span-2">
        {alerts.error ? (
          <p className="text-xs text-red-400">{alerts.error}</p>
        ) : !alerts.data ? (
          <p className="text-muted-foreground text-sm">Lädt…</p>
        ) : active.length === 0 ? (
          <p className="text-muted-foreground text-sm">Keine aktiven Warnungen.</p>
        ) : (
          active.map((alert) => (
            <div key={alert.id} className="border-border/60 bg-card rounded-lg border px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{alert.title}</span>
                <Chip tone={severityTone(alert.severity)}>{alert.severity}</Chip>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{alert.message}</p>
            </div>
          ))
        )}
      </Tile>
    </div>
  );
}

/**
 * The ML page's three folds for troubleshooting: training, single rides, warnings. Each loads its
 * data only while open.
 */
export function MlDetails() {
  return (
    <div>
      <Fold
        title="Training: CatBoost und TFT im Detail"
        hint="Laufender Trainingsfortschritt, Fehler im Training gegen live, Drift."
      >
        <TrainingDetails />
      </Fold>
      <Fold
        title="Einzelne Fahrgeschäfte: wo wir gut treffen und wo schlecht"
        hint="Die besten und schlechtesten Fahrgeschäfte je Modell."
      >
        <PerformerDetails />
      </Fold>
      <Fold title="Warnungen und Ausreißer" hint="Aktive Warnungen und Ausreißer nach Schwere.">
        <WarningDetails />
      </Fold>
    </div>
  );
}
