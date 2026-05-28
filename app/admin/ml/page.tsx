'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Brain,
  GitCompare,
  Play,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useAdminFetch } from '../_lib/admin-context';
import { TrainingStatusBadge, type TrainingState } from '@/components/common/training-status-badge';
import type { SystemHealthResponse } from '@/lib/api/admin';
import {
  EmptyPanel,
  ErrorPanel,
  KeyVal,
  LoadingPanel,
  Section,
  SeverityBadge,
  StatCard,
  StatusBadge,
  formatAge,
  maeColor,
} from '../_lib/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  MlAlert,
  MlAnomalyStats,
  MlDashboard,
  MlMetrics,
  MlPerformer,
} from '@/lib/api/admin-stats';

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
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const remaining = Math.max(TYPICAL_TRAINING_SECONDS - elapsed, 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-blue-400">
          Elapsed {m}m {s}s
        </span>
        {remaining > 0 && (
          <span className="text-muted-foreground">
            ~{Math.floor(remaining / 60)}m {remaining % 60}s left
          </span>
        )}
      </div>
      <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MetricsRow({ label, m }: { label: string; m: MlMetrics }) {
  return (
    <div className="grid grid-cols-5 gap-2 border-b border-border/40 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right font-mono tabular-nums ${maeColor(m.mae)}`}>{m.mae.toFixed(2)}</span>
      <span className="text-right font-mono tabular-nums">{m.rmse.toFixed(2)}</span>
      <span className="text-right font-mono tabular-nums">{m.mape.toFixed(1)}%</span>
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
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
          <Icon className="h-3.5 w-3.5" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {performers.map((p) => (
          <div key={p.attractionId} className="flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0">
              <p className="truncate">{p.attractionName}</p>
              <p className="text-muted-foreground truncate text-xs">{p.parkName}</p>
            </div>
            <span className={`shrink-0 font-mono tabular-nums ${maeColor(p.mae)}`}>
              {p.mae.toFixed(1)} MAE
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function MlPage() {
  const dash = useAdminFetch<MlDashboard>('/api/ml/dashboard');
  const alerts = useAdminFetch<MlAlert[]>('/api/ml/monitoring/alerts');
  const anomalies = useAdminFetch<MlAnomalyStats>('/api/ml/monitoring/anomalies/stats');
  const health = useAdminFetch<SystemHealthResponse>('/api/admin/system-health', true);

  if (dash.error) return <ErrorPanel message={`ML dashboard: ${dash.error}`} />;
  if (!dash.data) return <LoadingPanel label="Loading ML metrics…" />;

  const d = dash.data;
  const { model, performance: perf, insights } = d;
  const activeAlerts = (alerts.data ?? []).filter((a) => a.status === 'active');

  const catboost = health.data?.ml.catboost;
  const tft = health.data?.ml.tft;
  const cbState: TrainingState = catboost?.training.is_training ? 'training' : 'idle';
  const tftState: TrainingState = tft?.training.is_training
    ? 'training'
    : tft?.training.error
      ? 'error'
      : 'idle';

  return (
    <>
      {health.data && (
        <Section icon={Play} title="Training jobs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  CatBoost
                  <TrainingStatusBadge state={cbState} label={catboost?.activeModel?.version} />
                </CardTitle>
              </CardHeader>
              {catboost?.training.is_training && catboost.training.started_at && (
                <CardContent>
                  <TrainingProgress startedAt={catboost.training.started_at} />
                </CardContent>
              )}
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  TFT
                  <TrainingStatusBadge state={tftState} label={tft?.activeModel?.version} />
                </CardTitle>
              </CardHeader>
              {tft?.training.error && (
                <CardContent>
                  <p className="text-xs text-red-400">{tft.training.error}</p>
                </CardContent>
              )}
            </Card>
          </div>
        </Section>
      )}

      <Section icon={Brain} title="Active model">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Version" value={<span className="text-xl">{model.current.version}</span>} sub={model.current.modelType} />
          <StatCard label="Model age" value={formatAge(d.system.modelAge)} sub={`${model.current.fileSizeMB.toFixed(1)} MB`} />
          <StatCard
            label="Live MAE"
            value={perf.live.mae.toFixed(2)}
            valueClass={maeColor(perf.live.mae)}
            sub={
              <span className={perf.improvement.isImproving ? 'text-emerald-400' : 'text-red-400'}>
                {perf.improvement.maePercentChange > 0 ? '+' : ''}
                {perf.improvement.maePercentChange.toFixed(1)}% vs prev
              </span>
            }
          />
          <StatCard
            label="Coverage"
            value={`${perf.live.coveragePercent.toFixed(1)}%`}
            sub={`${perf.live.matchedPredictions.toLocaleString('en-GB')} matched`}
          />
          <StatCard label="Features" value={model.configuration.featureCount} sub="inputs used" />
        </div>
      </Section>

      <Section icon={GitCompare} title="Accuracy (training vs live)">
        <Card className="border-border/60">
          <CardContent className="pt-5">
            <div className="grid grid-cols-5 gap-2 border-b border-border/60 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <span />
              <span className="text-right">MAE</span>
              <span className="text-right">RMSE</span>
              <span className="text-right">MAPE</span>
              <span className="text-right">R²</span>
            </div>
            <MetricsRow label="Training" m={perf.training} />
            <MetricsRow
              label="Live"
              m={{ mae: perf.live.mae, rmse: perf.live.rmse, mape: perf.live.mape, r2Score: perf.live.r2Score }}
            />
            <div className="grid grid-cols-2 gap-3 pt-3 text-sm sm:grid-cols-4">
              <KeyVal label="Predictions" value={perf.live.totalPredictions.toLocaleString('en-GB')} />
              <KeyVal label="Unique parks" value={perf.live.uniqueParks} />
              <KeyVal label="Unique rides" value={perf.live.uniqueAttractions} />
              <KeyVal label="Train samples" value={model.trainingData.trainSamples.toLocaleString('en-GB')} />
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section icon={TrendingDown} title="Drift">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="border-border/60 sm:col-span-1">
            <CardContent className="space-y-1 pt-5">
              <StatusBadge status={perf.drift.status} />
              <p className="text-muted-foreground pt-1 text-xs">
                drift {perf.drift.currentDrift.toFixed(2)} / threshold {perf.drift.threshold}
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-3 sm:col-span-3 sm:grid-cols-3">
            <Card className="border-border/60">
              <CardContent className="pt-5">
                <KeyVal label="Training MAE" value={perf.drift.trainingMae.toFixed(2)} valueClass={maeColor(perf.drift.trainingMae)} />
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-5">
                <KeyVal label="Live MAE" value={perf.drift.liveMae.toFixed(2)} valueClass={maeColor(perf.drift.liveMae)} />
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-5">
                <KeyVal label="Tracked days" value={perf.drift.dailyMetrics.length} />
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      {/* TFT model + comparison */}
      {health.data?.ml.tft && (
        <Section icon={GitCompare} title="TFT (NeuralForecast) — near-term daily">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* TFT model info */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Active model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {health.data.ml.tft.activeModel ? (
                  <>
                    <p className="font-mono text-base">{health.data.ml.tft.activeModel.version}</p>
                    {health.data.ml.tft.activeModel.trainedAt && (
                      <p className="text-muted-foreground text-xs">
                        trained {new Date(health.data.ml.tft.activeModel.trainedAt).toLocaleString('en-GB')}
                      </p>
                    )}
                    {health.data.ml.tft.activeModel.horizon && (
                      <p className="text-muted-foreground text-xs">horizon {health.data.ml.tft.activeModel.horizon}d · scope {health.data.ml.tft.activeModel.parkScope ?? 'all'}</p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-xs">No model trained yet</p>
                )}
              </CardContent>
            </Card>

            {/* TFT vs CatBoost scoreboard */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">vs CatBoost scoreboard</CardTitle>
              </CardHeader>
              <CardContent>
                {health.data.ml.comparison?.rows?.length > 0 ? (
                  <div className="space-y-0">
                    <div className="grid grid-cols-4 gap-1 border-b border-border/60 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <span>Date</span><span className="text-right">Model</span><span className="text-right">MAE</span><span className="text-right">Bias</span>
                    </div>
                    {health.data.ml.comparison.rows.slice(0, 10).map((r, i) => (
                      <div key={i} className="grid grid-cols-4 gap-1 border-b border-border/40 py-1 text-xs last:border-0">
                        <span className="text-muted-foreground">{r.targetDate?.slice(5, 10)}</span>
                        <span className={`text-right font-mono ${r.model === 'tft' ? 'text-blue-400' : 'text-orange-400'}`}>{r.model}</span>
                        <span className={`text-right font-mono tabular-nums ${maeColor(Number(r.mae))}`}>{Number(r.mae).toFixed(1)}</span>
                        <span className="text-right font-mono tabular-nums text-muted-foreground">{Number(r.bias).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">{health.data.ml.comparison?.note ?? 'No comparison data yet'}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </Section>
      )}

      <Section icon={Sparkles} title="Per-attraction accuracy">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PerformerList title="Best predictions" icon={TrendingUp} performers={insights.topPerformers} />
          <PerformerList title="Worst predictions" icon={TrendingDown} performers={insights.bottomPerformers} />
        </div>
      </Section>

      <Section icon={Bell} title="Monitoring">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {anomalies.data ? (
                <>
                  <span className="text-3xl font-bold tabular-nums">{anomalies.data.totalAnomalies}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(anomalies.data.bySeverity).map(([sev, n]) => (
                      <span key={sev} className="flex items-center gap-1">
                        <SeverityBadge severity={sev} />
                        <span className="text-muted-foreground text-xs tabular-nums">{n}</span>
                      </span>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    avg score {anomalies.data.avgAnomalyScore.toFixed(2)}
                  </p>
                </>
              ) : (
                <span className="text-muted-foreground text-sm">…</span>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                <AlertTriangle className="h-3.5 w-3.5" /> Active alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeAlerts.length === 0 ? (
                <EmptyPanel label="No active alerts." />
              ) : (
                activeAlerts.map((a) => (
                  <div key={a.id} className="rounded-lg border border-border/60 bg-card px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{a.title}</span>
                      <SeverityBadge severity={a.severity} />
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">{a.message}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </Section>

      <p className="text-muted-foreground text-center text-xs">
        Trained {new Date(model.current.trainedAt).toLocaleString('en-GB')} · next training{' '}
        {new Date(d.system.nextTraining).toLocaleString('en-GB')} ·{' '}
        {model.trainingData.totalSamples.toLocaleString('en-GB')} samples over{' '}
        {model.trainingData.dataDurationDays} days
      </p>
    </>
  );
}
