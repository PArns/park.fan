'use client';

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import {
  RefreshCw,
  ShieldCheck,
  LogOut,
  Cpu,
  HardDrive,
  Database,
  Zap,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Server,
  Clock,
  Activity,
  Loader2,
  MemoryStick,
  KeyRound,
  Gauge,
  BarChart3,
  Play,
  Trash2,
  RotateCcw,
  ListChecks,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MetricBar } from '@/components/common/metric-bar';
import { TrainingStatusBadge, type TrainingState } from '@/components/common/training-status-badge';
import type {
  SystemHealthResponse,
  HostDisk,
  QueueStatusResponse,
  QueueEntry,
} from '@/lib/api/admin';

const SESSION_KEY = 'parkfan_admin_pass';
const REFRESH_INTERVAL = 5;
// Typical CatBoost training duration in seconds (from historical data)
const TYPICAL_TRAINING_SECONDS = 850;

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatUptime(hours: number) {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function isDisk(d: HostDisk | { error: string }): d is HostDisk {
  return 'usedPct' in d;
}

function statusDot(ok: boolean) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
  );
}

function maeColor(mae: number) {
  if (mae < 10) return 'text-emerald-400';
  if (mae < 15) return 'text-amber-400';
  return 'text-red-400';
}

// ─── training progress ────────────────────────────────────────────────────────

function TrainingProgress({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const pct = Math.min(Math.round((elapsed / TYPICAL_TRAINING_SECONDS) * 100), 99);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const elapsedStr = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  const remaining = Math.max(TYPICAL_TRAINING_SECONDS - elapsed, 0);
  const remM = Math.floor(remaining / 60);
  const remS = remaining % 60;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-blue-400">Elapsed: {elapsedStr}</span>
        {remaining > 0 && (
          <span className="text-muted-foreground">
            ~{remM}m {remS}s left
          </span>
        )}
      </div>
      <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-muted-foreground text-right text-xs">{pct}% estimated</p>
    </div>
  );
}

// ─── password gate ─────────────────────────────────────────────────────────────

function LoginScreen({
  onLogin,
  error,
  loading,
}: {
  onLogin: (pass: string) => void;
  error: string | null;
  loading: boolean;
}) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onLogin(value.trim());
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="bg-primary/15 border-primary/20 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border">
            <ShieldCheck className="text-primary h-7 w-7" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
              park.fan
            </p>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
        </div>

        <Card className="border-border/60">
          <CardContent className="space-y-4 pt-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <KeyRound className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  type="password"
                  placeholder="Admin password"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="pl-9"
                  autoFocus
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !value.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {error && (
              <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── status bar ───────────────────────────────────────────────────────────────

function StatusBar({
  data,
  lastUpdated,
  refreshing,
}: {
  data: SystemHealthResponse;
  lastUpdated: Date | null;
  refreshing: boolean;
}) {
  const pgOk = data.postgres.status === 'connected';
  const redisOk = data.redis.status === 'connected';
  const cbTraining = data.ml.catboost.training.is_training;
  const tftHealthy = data.ml.tft.health?.status === 'healthy';

  const items = [
    { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />, label: 'API', ok: true },
    { icon: statusDot(pgOk), label: 'PostgreSQL', ok: pgOk },
    { icon: statusDot(redisOk), label: 'Redis', ok: redisOk },
    {
      icon: cbTraining ? (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
      ) : (
        statusDot(true)
      ),
      label: 'CatBoost',
      ok: true,
    },
    { icon: statusDot(tftHealthy), label: 'TFT', ok: tftHealthy },
  ];

  return (
    <div className="border-border/40 bg-card/40 flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-6 py-2.5 backdrop-blur-sm">
      {items.map(({ icon, label, ok }) => (
        <span
          key={label}
          className={`flex items-center gap-1.5 text-xs font-medium ${ok ? 'text-foreground/80' : 'text-red-400'}`}
        >
          {icon}
          {label}
        </span>
      ))}
      <span className="text-muted-foreground ml-auto flex items-center gap-2 text-xs">
        {refreshing && (
          <span className="bg-primary inline-block h-1.5 w-1.5 animate-pulse rounded-full" />
        )}
        {lastUpdated && (
          <span className="tabular-nums">Updated {lastUpdated.toLocaleTimeString('en-GB')}</span>
        )}
      </span>
    </div>
  );
}

// ─── section heading ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="text-primary h-4 w-4" />
        <h2 className="text-foreground/70 text-sm font-semibold tracking-wide uppercase">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

// ─── dashboard ────────────────────────────────────────────────────────────────

function QueueBadge({
  count,
  variant,
}: {
  count: number;
  variant: 'active' | 'pending' | 'failed' | 'delayed';
}) {
  if (count === 0) return null;
  const colors: Record<typeof variant, string> = {
    active: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    pending: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    failed: 'bg-red-500/15 text-red-400 border-red-500/20',
    delayed: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-xs tabular-nums ${colors[variant]}`}
    >
      {count} {variant}
    </span>
  );
}

function QueueRow({ q }: { q: QueueEntry }) {
  const hasActivity = q.active + q.pending + q.failed + q.delayed > 0;
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${hasActivity ? 'border-border/60 bg-card' : 'border-border/30 bg-card/40'}`}
    >
      <span
        className={`font-mono text-xs ${hasActivity ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {q.name}
      </span>
      <div className="flex items-center gap-1">
        {q.active === 0 && q.pending === 0 && q.failed === 0 && q.delayed === 0 ? (
          <span className="text-muted-foreground text-xs">idle</span>
        ) : (
          <>
            <QueueBadge count={q.active} variant="active" />
            <QueueBadge count={q.pending} variant="pending" />
            <QueueBadge count={q.failed} variant="failed" />
            <QueueBadge count={q.delayed} variant="delayed" />
          </>
        )}
      </div>
    </div>
  );
}

function Dashboard({
  data,
  queueData,
  savedPass,
  onLogout,
  onRefresh,
  loading,
  refreshing,
  lastUpdated,
}: {
  data: SystemHealthResponse;
  queueData: QueueStatusResponse | null;
  savedPass: string;
  onLogout: () => void;
  onRefresh: () => void;
  loading: boolean;
  refreshing: boolean;
  lastUpdated: Date | null;
}) {
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionResult, setActionResult] = useState<Record<string, 'ok' | 'err'>>({});

  async function triggerAction(key: string, path: string) {
    setActionLoading((p) => ({ ...p, [key]: true }));
    setActionResult((p) => ({ ...p, [key]: undefined as unknown as 'ok' | 'err' }));
    try {
      const res = await fetch(`/api/admin/${path}?pass=${encodeURIComponent(savedPass)}`, {
        method: 'POST',
      });
      setActionResult((p) => ({ ...p, [key]: res.ok ? 'ok' : 'err' }));
    } catch {
      setActionResult((p) => ({ ...p, [key]: 'err' }));
    } finally {
      setActionLoading((p) => ({ ...p, [key]: false }));
    }
  }

  const disk = data.host.disk;
  const diskValid = isDisk(disk);

  const cbTraining = data.ml.catboost.training.is_training;
  const cbState: TrainingState = cbTraining ? 'training' : 'idle';
  const tftState: TrainingState = data.ml.tft.training.is_training
    ? 'training'
    : data.ml.tft.training.error
      ? 'error'
      : 'idle';

  const maxLoad = data.host.cpu.cores;

  const actions = [
    { key: 'flush', label: 'Flush Cache', icon: Trash2, path: 'flush-cache' },
    { key: 'train', label: 'Train ML', icon: Play, path: 'train-ml-model' },
    { key: 'sync', label: 'Sync Parks', icon: RotateCcw, path: 'sync-parks' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-border/40 bg-background/80 sticky top-0 z-10 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/15 border-primary/20 flex h-8 w-8 items-center justify-center rounded-lg border">
              <ShieldCheck className="text-primary h-4 w-4" />
            </div>
            <span className="font-semibold">
              <span className="text-primary">park.fan</span>
              <span className="text-muted-foreground mx-1.5">/</span>
              <span>Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-8 gap-1.5 px-3"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="text-muted-foreground hover:text-foreground h-8 w-8"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <StatusBar data={data} lastUpdated={lastUpdated} refreshing={refreshing} />
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-6 py-8">
        {/* System Resources */}
        <Section icon={Server} title="System">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* CPU */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                  <Cpu className="h-3.5 w-3.5" /> CPU
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span
                    className={`text-3xl font-bold tabular-nums ${(data.host.cpu.loadPct ?? 0) >= 80 ? 'text-red-400' : (data.host.cpu.loadPct ?? 0) >= 60 ? 'text-amber-400' : 'text-foreground'}`}
                  >
                    {data.host.cpu.loadPct ?? '—'}%
                  </span>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {data.host.cpu.cores} Cores
                  </p>
                  <p className="text-muted-foreground truncate text-xs" title={data.host.cpu.model}>
                    {data.host.cpu.model.split(' ').slice(0, 3).join(' ')}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <MetricBar
                    label="1m"
                    value={data.host.cpu.load['1m']}
                    max={maxLoad}
                    unit=""
                    thresholds={[60, 80]}
                  />
                  <MetricBar
                    label="5m"
                    value={data.host.cpu.load['5m']}
                    max={maxLoad}
                    unit=""
                    thresholds={[60, 80]}
                  />
                  <MetricBar
                    label="15m"
                    value={data.host.cpu.load['15m']}
                    max={maxLoad}
                    unit=""
                    thresholds={[60, 80]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Memory */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                  <MemoryStick className="h-3.5 w-3.5" /> Memory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-3xl font-bold tabular-nums">
                    {data.host.memory.usedGB.toFixed(1)}
                    <span className="text-muted-foreground text-lg font-normal"> GB</span>
                  </span>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    of {data.host.memory.totalGB.toFixed(1)} GB
                  </p>
                </div>
                <MetricBar
                  label="Usage"
                  value={data.host.memory.usedGB}
                  max={data.host.memory.totalGB}
                  unit=" GB"
                  pct={data.host.memory.usedPct}
                />
              </CardContent>
            </Card>

            {/* Disk */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                  <HardDrive className="h-3.5 w-3.5" /> Disk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {diskValid ? (
                  <>
                    <div>
                      <span className="text-3xl font-bold tabular-nums">
                        {(disk.totalGB - disk.freeGB).toFixed(0)}
                        <span className="text-muted-foreground text-lg font-normal"> GB</span>
                      </span>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        of {disk.totalGB.toFixed(0)} GB · {disk.freeGB.toFixed(0)} GB free
                      </p>
                    </div>
                    <MetricBar
                      label="Used"
                      value={disk.totalGB - disk.freeGB}
                      max={disk.totalGB}
                      unit=" GB"
                      pct={disk.usedPct}
                      thresholds={[75, 90]}
                    />
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">N/A</p>
                )}
              </CardContent>
            </Card>

            {/* Uptime */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                  <Clock className="h-3.5 w-3.5" /> Uptime
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <span className="text-3xl font-bold tabular-nums">
                  {formatUptime(data.host.uptimeHours)}
                </span>
                <p className="text-muted-foreground text-xs">
                  API v4 · {data.host.cpu.cores}-core server
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Database */}
        <Section icon={Database} title="Database">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* PostgreSQL */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Database className="text-primary h-4 w-4" />
                    PostgreSQL
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-normal">
                    {statusDot(data.postgres.status === 'connected')}
                    <span
                      className={
                        data.postgres.status === 'connected' ? 'text-emerald-400' : 'text-red-400'
                      }
                    >
                      {data.postgres.status === 'connected' ? 'Connected' : data.postgres.status}
                    </span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetricBar
                  label={`Connections (active: ${data.postgres.activeQueries})`}
                  value={data.postgres.connections}
                  max={data.postgres.maxConnections}
                  unit=""
                  pct={data.postgres.connectionsPct ?? undefined}
                  thresholds={[60, 80]}
                />
                <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">DB Size</p>
                    <p className="font-semibold tabular-nums">
                      {data.postgres.dbSizeGB.toFixed(2)} GB
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Cache Hit</p>
                    <p
                      className={`font-semibold tabular-nums ${(data.postgres.cacheHitPct ?? 0) >= 99 ? 'text-emerald-400' : 'text-amber-400'}`}
                    >
                      {data.postgres.cacheHitPct?.toFixed(1) ?? '—'}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Redis */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Zap className="text-primary h-4 w-4" />
                    Redis
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-normal">
                    {statusDot(data.redis.status === 'connected')}
                    <span
                      className={
                        data.redis.status === 'connected' ? 'text-emerald-400' : 'text-red-400'
                      }
                    >
                      {data.redis.status === 'connected' ? 'Connected' : data.redis.status}
                    </span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetricBar
                  label="Memory"
                  value={data.redis.usedMemoryMB}
                  max={data.redis.maxMemoryMB ?? data.redis.usedMemoryMB * 2}
                  unit=" MB"
                  thresholds={[60, 80]}
                />
                <div className="grid grid-cols-3 gap-3 pt-1 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Keys</p>
                    <p className="font-semibold tabular-nums">{formatCompact(data.redis.keys)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Clients</p>
                    <p className="font-semibold tabular-nums">{data.redis.connectedClients}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Hit Rate</p>
                    <p
                      className={`font-semibold tabular-nums ${(data.redis.hitRatePct ?? 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}
                    >
                      {data.redis.hitRatePct?.toFixed(1) ?? '—'}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ML Models */}
        <Section icon={Brain} title="ML Models">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* CatBoost */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Activity className="text-primary h-4 w-4" />
                    CatBoost
                  </span>
                  <TrainingStatusBadge state={cbState} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cbTraining && data.ml.catboost.training.started_at && (
                  <div className="space-y-3 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-400">
                        Training: {data.ml.catboost.training.current_version}
                      </span>
                    </div>
                    <TrainingProgress startedAt={data.ml.catboost.training.started_at} />
                  </div>
                )}
                {data.ml.catboost.activeModel && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Active Model
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {data.ml.catboost.activeModel.version}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-card border-border/40 rounded-lg border px-3 py-2">
                        <p className="text-muted-foreground text-xs">MAE</p>
                        <p className="font-bold tabular-nums">
                          {data.ml.catboost.activeModel.mae?.toFixed(2) ?? '—'}
                          <span className="text-muted-foreground ml-0.5 text-xs font-normal">
                            min
                          </span>
                        </p>
                      </div>
                      <div className="bg-card border-border/40 rounded-lg border px-3 py-2">
                        <p className="text-muted-foreground text-xs">RMSE</p>
                        <p className="font-bold tabular-nums">
                          {data.ml.catboost.activeModel.rmse?.toFixed(2) ?? '—'}
                        </p>
                      </div>
                      <div className="bg-card border-border/40 rounded-lg border px-3 py-2">
                        <p className="text-muted-foreground text-xs">R²</p>
                        <p
                          className={`font-bold tabular-nums ${(data.ml.catboost.activeModel.r2 ?? 0) >= 0.75 ? 'text-emerald-400' : 'text-amber-400'}`}
                        >
                          {data.ml.catboost.activeModel.r2?.toFixed(4) ?? '—'}
                        </p>
                      </div>
                      <div className="bg-card border-border/40 rounded-lg border px-3 py-2">
                        <p className="text-muted-foreground text-xs">Samples</p>
                        <p className="font-bold tabular-nums">
                          {formatCompact(data.ml.catboost.activeModel.trainSamples)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TFT */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Gauge className="text-primary h-4 w-4" />
                    TFT
                    <span className="text-muted-foreground text-xs font-normal">
                      NeuralForecast
                    </span>
                  </span>
                  <TrainingStatusBadge state={tftState} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground font-mono text-xs">
                  {data.ml.tft.training.version ?? '—'}
                </p>
                {data.ml.tft.training.error && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                    <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                    {data.ml.tft.training.error}
                  </div>
                )}
                {data.ml.tft.training.is_training && data.ml.tft.training.started_at && (
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-3">
                    <TrainingProgress startedAt={data.ml.tft.training.started_at} />
                  </div>
                )}
                {data.ml.tft.health && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-card border-border/40 rounded-lg border px-3 py-2">
                      <p className="text-muted-foreground text-xs">Status</p>
                      <p
                        className={`font-medium ${data.ml.tft.health.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {data.ml.tft.health.status}
                      </p>
                    </div>
                    <div className="bg-card border-border/40 rounded-lg border px-3 py-2">
                      <p className="text-muted-foreground text-xs">Model trained</p>
                      <p
                        className={`font-medium ${data.ml.tft.health.model_trained ? 'text-emerald-400' : 'text-muted-foreground'}`}
                      >
                        {data.ml.tft.health.model_trained ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-card border-border/40 rounded-lg border px-3 py-2">
                      <p className="text-muted-foreground text-xs">Scope</p>
                      <p className="font-medium">{data.ml.tft.health.park_scope}</p>
                    </div>
                    <div className="bg-card border-border/40 rounded-lg border px-3 py-2">
                      <p className="text-muted-foreground text-xs">Horizon</p>
                      <p className="font-medium tabular-nums">{data.ml.tft.health.horizon}d</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Prediction Accuracy */}
        {data.ml.comparison.rows.length > 0 && (
          <Section icon={BarChart3} title="Prediction Accuracy">
            <Card className="border-border/60">
              <CardContent className="px-0 pt-4 pb-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-border/40 border-b">
                        <th className="text-muted-foreground px-4 pb-2 text-left text-xs font-medium tracking-wide uppercase">
                          Date
                        </th>
                        <th className="text-muted-foreground px-4 pb-2 text-left text-xs font-medium tracking-wide uppercase">
                          Model
                        </th>
                        <th className="text-muted-foreground px-4 pb-2 text-right text-xs font-medium tracking-wide uppercase">
                          n
                        </th>
                        <th className="text-muted-foreground px-4 pb-2 text-right text-xs font-medium tracking-wide uppercase">
                          MAE
                        </th>
                        <th className="text-muted-foreground px-4 pb-2 text-right text-xs font-medium tracking-wide uppercase">
                          Bias
                        </th>
                        <th className="text-muted-foreground px-4 pb-2 text-right text-xs font-medium tracking-wide uppercase">
                          Lead
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ml.comparison.rows.map((row, i) => {
                        const mae = parseFloat(String(row.mae));
                        const bias = parseFloat(String(row.bias));
                        return (
                          <tr
                            key={i}
                            className="border-border/20 hover:bg-muted/30 border-b transition-colors last:border-0"
                          >
                            <td className="text-muted-foreground px-4 py-2 font-mono text-xs tabular-nums">
                              {new Date(row.targetDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-2">
                              <Badge variant="secondary" className="font-mono text-xs">
                                {row.model}
                              </Badge>
                            </td>
                            <td className="text-muted-foreground px-4 py-2 text-right font-mono text-xs tabular-nums">
                              {row.n}
                            </td>
                            <td
                              className={`px-4 py-2 text-right font-mono text-xs font-medium tabular-nums ${maeColor(mae)}`}
                            >
                              {mae.toFixed(1)}
                              <span className="text-muted-foreground ml-0.5">min</span>
                            </td>
                            <td
                              className={`px-4 py-2 text-right font-mono text-xs tabular-nums ${bias < 0 ? 'text-amber-400' : 'text-emerald-400'}`}
                            >
                              {bias > 0 ? '+' : ''}
                              {bias.toFixed(1)}
                            </td>
                            <td className="text-muted-foreground px-4 py-2 text-right font-mono text-xs tabular-nums">
                              {row.avgLeadDays}d
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </Section>
        )}

        {/* Queue Status */}
        {queueData && queueData.queues.length > 0 && (
          <Section icon={ListChecks} title="Queues">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {queueData.queues.map((q) => (
                <QueueRow key={q.name} q={q} />
              ))}
            </div>
          </Section>
        )}

        {/* Quick Actions */}
        <Section icon={Activity} title="Quick Actions">
          <div className="flex flex-wrap gap-3">
            {actions.map(({ key, label, icon: Icon, path }) => (
              <button
                key={key}
                onClick={() => triggerAction(key, path)}
                disabled={actionLoading[key]}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  actionResult[key] === 'ok'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : actionResult[key] === 'err'
                      ? 'border-red-500/40 bg-red-500/10 text-red-400'
                      : 'border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 hover:text-primary text-foreground/80'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {actionLoading[key] ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : actionResult[key] === 'ok' ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : actionResult[key] === 'err' ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                {label}
              </button>
            ))}
          </div>
        </Section>
      </main>

      <footer className="border-border/20 text-muted-foreground border-t px-6 py-4 text-center text-xs">
        park.fan Admin · {new Date(data.timestamp).toLocaleString('en-GB')}
      </footer>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [savedPass, setSavedPass] = useState<string | null>(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) : null
  );
  const [data, setData] = useState<SystemHealthResponse | null>(null);
  const [queueData, setQueueData] = useState<QueueStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (pass: string, background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    if (!background) setError(null);

    try {
      const passParam = encodeURIComponent(pass);
      const [healthRes, queueRes] = await Promise.all([
        fetch(`/api/admin/system-health?pass=${passParam}`),
        fetch(`/api/admin/queue-status?pass=${passParam}`),
      ]);

      if (healthRes.status === 401 || healthRes.status === 403) {
        sessionStorage.removeItem(SESSION_KEY);
        setSavedPass(null);
        setData(null);
        setError('Wrong password.');
        return;
      }
      if (!healthRes.ok) {
        if (!background) setError(`API error: ${healthRes.status}`);
        return;
      }
      const [healthJson, queueJson] = await Promise.all([
        healthRes.json() as Promise<SystemHealthResponse>,
        queueRes.ok ? (queueRes.json() as Promise<QueueStatusResponse>) : Promise.resolve(null),
      ]);
      setData(healthJson);
      setQueueData(queueJson);
      setLastUpdated(new Date());
    } catch {
      if (!background) setError('Connection error.');
    } finally {
      if (background) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  // Initial fetch when savedPass available (deferred to avoid sync setState-in-effect)
  useEffect(() => {
    if (!savedPass) return;
    const id = setTimeout(() => void fetchData(savedPass), 0);
    return () => clearTimeout(id);
  }, [savedPass, fetchData]);

  // Auto-refresh every REFRESH_INTERVAL seconds (silent background)
  useEffect(() => {
    if (!savedPass) return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!document.hidden) void fetchData(savedPass, true);
    }, REFRESH_INTERVAL * 1000);

    const handleVisibility = () => {
      if (!document.hidden) void fetchData(savedPass, true);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [savedPass, fetchData]);

  function handleLogin(pass: string) {
    sessionStorage.setItem(SESSION_KEY, pass);
    setSavedPass(pass);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setSavedPass(null);
    setData(null);
    setQueueData(null);
    setError(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function handleRefresh() {
    if (savedPass) void fetchData(savedPass);
  }

  if (!savedPass || (!data && !loading)) {
    return <LoginScreen onLogin={handleLogin} error={error} loading={loading} />;
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <Dashboard
      data={data}
      queueData={queueData}
      savedPass={savedPass}
      onLogout={handleLogout}
      onRefresh={handleRefresh}
      loading={loading}
      refreshing={refreshing}
      lastUpdated={lastUpdated}
    />
  );
}
