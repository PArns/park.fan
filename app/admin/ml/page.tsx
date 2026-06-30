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
import type {
  SystemHealthResponse,
  TftTrainingProgress,
  ComparisonRow,
  MlComparisonBoard,
  IntradayVerdict,
  ChallengerVerdict,
} from '@/lib/api/admin';
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

function TftTrainingProgress({ p }: { p: TftTrainingProgress }) {
  const pct = Math.min(Math.max(Math.round(p.pct), 0), 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-blue-400">
          Chunk {p.chunk}/{p.n_chunks} · step {p.step}/{p.max_steps}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {pct}%{p.loss != null ? ` · loss ${p.loss.toFixed(3)}` : ''}
        </span>
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
    <div className="border-border/40 grid grid-cols-5 gap-2 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right font-mono tabular-nums ${maeColor(m.mae)}`}>
        {m.mae.toFixed(2)}
      </span>
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

// Shadow boards report segments at a finer grain than the live dashboard (busy/mid/quiet).
const SEGMENT_LABELS: Record<string, string> = {
  all: 'all',
  busy: 'busy',
  mid: 'mid',
  quiet: 'quiet',
  headliner: 'hdlnr',
};

type NormalizedVerdict = {
  segment: string;
  n: number;
  challengerMae: number;
  catboostMae: number;
  delta: number;
  wins: boolean;
};

// PCN and Shape verdicts carry the same numbers under different field names; normalize so
// one board component renders both.
function normalizeVerdict(v: IntradayVerdict | ChallengerVerdict): NormalizedVerdict {
  const isPcn = 'pcnMae' in v;
  return {
    segment: v.segment,
    n: v.n,
    challengerMae: isPcn ? v.pcnMae : v.challengerMae,
    catboostMae: v.catboostMae,
    delta: v.delta,
    wins: isPcn ? v.pcnWins : v.challengerWins,
  };
}

function ShadowVerdictBoard({
  challengerLabel,
  verdict,
  note,
  error,
}: {
  challengerLabel: string;
  verdict?: (IntradayVerdict | ChallengerVerdict)[];
  note?: string;
  error?: string;
}) {
  const rows = (verdict ?? []).map(normalizeVerdict);
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {challengerLabel} vs CatBoost
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-xs">{note ?? 'No comparison data yet'}</p>
        ) : (
          <div className="space-y-0">
            <div className="border-border/60 text-muted-foreground grid grid-cols-5 gap-1 border-b pb-1 text-xs font-medium tracking-wide uppercase">
              <span>Seg</span>
              <span className="text-right">n</span>
              <span className="text-right">CatB</span>
              <span className="text-right">{challengerLabel}</span>
              <span className="text-right">Δ</span>
            </div>
            {rows.map((r) => (
              <div
                key={r.segment}
                className="border-border/40 grid grid-cols-5 gap-1 border-b py-1 text-xs last:border-0"
              >
                <span className="font-mono">{SEGMENT_LABELS[r.segment] ?? r.segment}</span>
                <span className="text-muted-foreground text-right font-mono tabular-nums">
                  {r.n.toLocaleString('en-GB')}
                </span>
                <span className={`text-right font-mono tabular-nums ${maeColor(r.catboostMae)}`}>
                  {r.catboostMae.toFixed(1)}
                </span>
                <span
                  className={`text-right font-mono tabular-nums ${
                    r.wins ? 'font-semibold text-blue-400' : maeColor(r.challengerMae)
                  }`}
                >
                  {r.challengerMae.toFixed(1)}
                </span>
                <span
                  className={`text-right font-mono tabular-nums ${
                    r.wins ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {r.delta > 0 ? '+' : ''}
                  {r.delta.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MlPage() {
  const dash = useAdminFetch<MlDashboard>('/api/ml/dashboard');
  const alerts = useAdminFetch<MlAlert[]>('/api/ml/monitoring/alerts');
  const anomalies = useAdminFetch<MlAnomalyStats>('/api/ml/monitoring/anomalies/stats');
  const tftPerformers = useAdminFetch<{
    topPerformers: MlPerformer[];
    bottomPerformers: MlPerformer[];
  }>('/api/ml/monitoring/tft/performers');
  const health = useAdminFetch<SystemHealthResponse>('/api/admin/system-health', true);
  const comparison = useAdminFetch<MlComparisonBoard>('/api/admin/ml-comparison', true);

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
              {tft?.training.is_training && tft.training.progress && (
                <CardContent>
                  <TftTrainingProgress p={tft.training.progress} />
                </CardContent>
              )}
              {tft?.training.is_training && !tft.training.progress && (
                <CardContent>
                  <p className="text-muted-foreground text-xs">Starting… (building panel)</p>
                </CardContent>
              )}
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
          <StatCard
            label="Version"
            value={<span className="text-xl">{model.current.version}</span>}
            sub={model.current.modelType}
          />
          <StatCard
            label="Model age"
            value={formatAge(d.system.modelAge)}
            sub={`${model.current.fileSizeMB.toFixed(1)} MB`}
          />
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
            <div className="border-border/60 text-muted-foreground grid grid-cols-5 gap-2 border-b pb-2 text-xs font-medium tracking-wide uppercase">
              <span />
              <span className="text-right">MAE</span>
              <span className="text-right">RMSE</span>
              <span className="text-right">MAPE</span>
              <span className="text-right">R²</span>
            </div>
            <MetricsRow label="Training" m={perf.training} />
            <MetricsRow
              label="Live"
              m={{
                mae: perf.live.mae,
                rmse: perf.live.rmse,
                mape: perf.live.mape,
                r2Score: perf.live.r2Score,
              }}
            />
            <div className="grid grid-cols-2 gap-3 pt-3 text-sm sm:grid-cols-4">
              <KeyVal
                label="Predictions"
                value={perf.live.totalPredictions.toLocaleString('en-GB')}
              />
              <KeyVal label="Unique parks" value={perf.live.uniqueParks} />
              <KeyVal label="Unique rides" value={perf.live.uniqueAttractions} />
              <KeyVal
                label="Train samples"
                value={model.trainingData.trainSamples.toLocaleString('en-GB')}
              />
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
                <KeyVal
                  label="Training MAE"
                  value={perf.drift.trainingMae.toFixed(2)}
                  valueClass={maeColor(perf.drift.trainingMae)}
                />
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-5">
                <KeyVal
                  label="Live MAE"
                  value={perf.drift.liveMae.toFixed(2)}
                  valueClass={maeColor(perf.drift.liveMae)}
                />
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
                <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Active model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {health.data.ml.tft.activeModel ? (
                  <>
                    <p className="font-mono text-base">{health.data.ml.tft.activeModel.version}</p>
                    {health.data.ml.tft.activeModel.trainedAt && (
                      <p className="text-muted-foreground text-xs">
                        trained{' '}
                        {new Date(health.data.ml.tft.activeModel.trainedAt).toLocaleString('en-GB')}
                      </p>
                    )}
                    {health.data.ml.tft.activeModel.horizon && (
                      <p className="text-muted-foreground text-xs">
                        horizon {health.data.ml.tft.activeModel.horizon}d · scope{' '}
                        {health.data.ml.tft.activeModel.parkScope ?? 'all'}
                      </p>
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
                <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  vs CatBoost scoreboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {health.data.ml.comparison?.rows?.length > 0 ? (
                  (() => {
                    // Pivot rows → one entry per (date, segment) holding both models,
                    // so CatBoost vs TFT sit side by side (TFT's edge lives on busy/hdlnr).
                    type Pivot = {
                      date: string;
                      segment: string;
                      n: number;
                      cat?: ComparisonRow;
                      tft?: ComparisonRow;
                    };
                    const groups = new Map<string, Pivot>();
                    for (const r of health.data.ml.comparison.rows) {
                      const segment = r.segment ?? 'all';
                      const key = `${r.targetDate}|${segment}`;
                      const g = groups.get(key) ?? { date: r.targetDate, segment, n: r.n };
                      if (r.model === 'tft') g.tft = r;
                      else g.cat = r;
                      groups.set(key, g);
                    }
                    const order: Record<string, number> = { all: 0, busy: 1, headliner: 2 };
                    const list = [...groups.values()]
                      .sort((a, b) =>
                        a.date < b.date
                          ? 1
                          : a.date > b.date
                            ? -1
                            : (order[a.segment] ?? 9) - (order[b.segment] ?? 9)
                      )
                      .slice(0, 12);
                    const segLabel: Record<string, string> = {
                      all: 'all',
                      busy: 'busy',
                      headliner: 'hdlnr',
                    };
                    const segClass: Record<string, string> = {
                      all: 'text-muted-foreground',
                      busy: 'text-amber-400',
                      headliner: 'text-violet-400',
                    };
                    return (
                      <div className="space-y-0">
                        <div className="border-border/60 text-muted-foreground grid grid-cols-5 gap-1 border-b pb-1 text-xs font-medium tracking-wide uppercase">
                          <span>Date</span>
                          <span>Seg</span>
                          <span className="text-right">n</span>
                          <span className="text-right">CatB</span>
                          <span className="text-right">TFT</span>
                        </div>
                        {list.map((g, i) => {
                          const cm = g.cat ? Number(g.cat.mae) : NaN;
                          const tm = g.tft ? Number(g.tft.mae) : NaN;
                          const tftWins = Number.isFinite(cm) && Number.isFinite(tm) && tm < cm;
                          return (
                            <div
                              key={i}
                              className="border-border/40 grid grid-cols-5 gap-1 border-b py-1 text-xs last:border-0"
                            >
                              <span className="text-muted-foreground">{g.date?.slice(5, 10)}</span>
                              <span className={`font-mono ${segClass[g.segment] ?? ''}`}>
                                {segLabel[g.segment] ?? g.segment}
                              </span>
                              <span className="text-muted-foreground text-right font-mono tabular-nums">
                                {g.n}
                              </span>
                              <span
                                className={`text-right font-mono tabular-nums ${Number.isFinite(cm) ? maeColor(cm) : 'text-muted-foreground'}`}
                              >
                                {Number.isFinite(cm) ? cm.toFixed(1) : '—'}
                              </span>
                              <span
                                className={`text-right font-mono tabular-nums ${
                                  !Number.isFinite(tm)
                                    ? 'text-muted-foreground'
                                    : tftWins
                                      ? 'font-semibold text-blue-400'
                                      : maeColor(tm)
                                }`}
                              >
                                {Number.isFinite(tm) ? tm.toFixed(1) : '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-muted-foreground text-xs">
                    {health.data.ml.comparison?.note ?? 'No comparison data yet'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </Section>
      )}

      {comparison.data && (
        <Section icon={GitCompare} title="Shadow model boards (vs CatBoost)">
          <p className="text-muted-foreground text-sm">
            Per-segment MAE at lead &ldquo;all&rdquo;, n-weighted. Δ &gt; 0 (blue/green) means the
            challenger beats CatBoost. PCN serves intraday behind a server flag; Shape is
            shadow-only.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ShadowVerdictBoard
              challengerLabel="PCN"
              verdict={comparison.data.intraday.verdict}
              note={comparison.data.intraday.note}
              error={comparison.data.intraday.error}
            />
            <ShadowVerdictBoard
              challengerLabel="Shape"
              verdict={comparison.data.shape.verdict}
              note={comparison.data.shape.note}
              error={comparison.data.shape.error}
            />
          </div>
        </Section>
      )}

      <Section icon={Sparkles} title="Per-attraction accuracy (CatBoost hourly)">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PerformerList
            title="Best predictions"
            icon={TrendingUp}
            performers={insights.topPerformers}
          />
          <PerformerList
            title="Worst predictions"
            icon={TrendingDown}
            performers={insights.bottomPerformers}
          />
        </div>
      </Section>

      {tftPerformers.data && tftPerformers.data.topPerformers.length > 0 && (
        <Section icon={Sparkles} title="Per-attraction accuracy (TFT daily)">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PerformerList
              title="Best predictions"
              icon={TrendingUp}
              performers={tftPerformers.data.topPerformers}
            />
            <PerformerList
              title="Worst predictions"
              icon={TrendingDown}
              performers={tftPerformers.data.bottomPerformers}
            />
          </div>
        </Section>
      )}

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
                  <span className="text-3xl font-bold tabular-nums">
                    {anomalies.data.totalAnomalies}
                  </span>
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
                  <div key={a.id} className="border-border/60 bg-card rounded-lg border px-3 py-2">
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
