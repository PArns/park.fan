'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Gauge,
  GitCompare,
  Layers,
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
  ShadowComparisonRow,
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

// A single cell in the top status strip: small uppercase label above a value block.
function StripCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

// One card in the serving map: model name + the horizon it serves, with its live accuracy body.
function ServingCard({
  name,
  role,
  children,
}: {
  name: string;
  role: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-baseline justify-between gap-2 text-sm font-semibold">
          <span>{name}</span>
          <span className="text-muted-foreground text-[11px] font-normal">{role}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-foreground/70 text-xs font-semibold tracking-wide uppercase">{children}</h3>
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
const SEGMENT_ORDER: Record<string, number> = { busy: 0, all: 1, mid: 2, quiet: 3 };
// Lead buckets differ per board (PCN is hourly, Shape daily); 'all' (the aggregate) sorts last.
const LEAD_ORDER: Record<string, number> = {
  '<=3h': 0,
  '3-6h': 1,
  '>6h': 2,
  '<=3d': 0,
  '4-7d': 1,
  '>7d': 2,
  all: 9,
};
// Lead-curve horizons (§7.7): the forced forecast lead the origin was picked for.
const LEADCURVE_ORDER: Record<string, number> = { '1h': 0, '3h': 1, '6h': 2 };

// Postgres numerics arrive as strings; coerce defensively.
const num = (v: string | number) => (typeof v === 'number' ? v : parseFloat(v));

// Compact win/loss chips summarising a challenger's per-segment verdict at lead 'all'.
// delta > 0 ⇒ challenger beats CatBoost (green); the API returns these, we don't compute them.
type VerdictItem = { segment: string; delta: number; wins: boolean };

function VerdictBar({ label, items }: { label: string; items: VerdictItem[] }) {
  const sorted = [...items].sort(
    (a, b) => (SEGMENT_ORDER[a.segment] ?? 9) - (SEGMENT_ORDER[b.segment] ?? 9)
  );
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {sorted.map((v) => (
          <span
            key={v.segment}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${
              v.wins
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                : 'border-red-500/20 bg-red-500/10 text-red-400'
            }`}
          >
            <span className="font-mono uppercase">{SEGMENT_LABELS[v.segment] ?? v.segment}</span>
            <span className="tabular-nums">
              {v.delta > 0 ? '+' : ''}
              {v.delta.toFixed(1)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

type ShadowCell = {
  segment: string;
  leadBucket: string;
  n: number;
  actual: number;
  catboostMae: number | null;
  challengerMae: number | null;
  challengerBias: number | null;
  challengerPred: number | null;
  delta: number | null; // catMae − challengerMae (>0 ⇒ challenger better)
};

type ModelAcc = { n: number; maeW: number; biasW: number; actW: number; predW: number };

// Pool the per-date board rows into one n-weighted cell per (segment, lead bucket), holding
// CatBoost and the challenger side by side. The matched population is identical across models
// by construction, so n / mean-actual are comparable.
function aggregateShadowRows(rows: ShadowComparisonRow[], challengerModel: string): ShadowCell[] {
  const cells = new Map<string, { catboost?: ModelAcc; challenger?: ModelAcc }>();
  for (const r of rows) {
    const key = `${r.segment}|${r.leadBucket}`;
    const cell = cells.get(key) ?? {};
    const slot = r.model === challengerModel ? 'challenger' : 'catboost';
    const acc = (cell[slot] ??= { n: 0, maeW: 0, biasW: 0, actW: 0, predW: 0 });
    const n = num(r.n);
    acc.n += n;
    acc.maeW += num(r.mae) * n;
    acc.biasW += num(r.bias) * n;
    acc.actW += num(r.meanActual) * n;
    acc.predW += num(r.meanPred) * n;
    cells.set(key, cell);
  }
  const out: ShadowCell[] = [];
  for (const [key, { catboost, challenger }] of cells) {
    const [segment, leadBucket] = key.split('|');
    const cat = catboost?.n ? catboost.maeW / catboost.n : null;
    const ch = challenger?.n ? challenger.maeW / challenger.n : null;
    const src = challenger?.n ? challenger : catboost; // mean-actual is shared; use whichever exists
    out.push({
      segment,
      leadBucket,
      n: Math.min(challenger?.n ?? Infinity, catboost?.n ?? Infinity),
      actual: src?.n ? src.actW / src.n : 0,
      catboostMae: cat,
      challengerMae: ch,
      challengerBias: challenger?.n ? challenger.biasW / challenger.n : null,
      challengerPred: challenger?.n ? challenger.predW / challenger.n : null,
      delta: cat != null && ch != null ? cat - ch : null,
    });
  }
  return out.sort(
    (a, b) =>
      (SEGMENT_ORDER[a.segment] ?? 9) - (SEGMENT_ORDER[b.segment] ?? 9) ||
      (LEAD_ORDER[a.leadBucket] ?? 5) - (LEAD_ORDER[b.leadBucket] ?? 5)
  );
}

function biasColor(bias: number) {
  const m = Math.abs(bias);
  return m < 3 ? 'text-emerald-400' : m < 8 ? 'text-amber-400' : 'text-red-400';
}

function ShadowBoard({
  challengerLabel,
  challengerModel,
  rows,
  note,
  error,
}: {
  challengerLabel: string;
  challengerModel: string;
  rows?: ShadowComparisonRow[];
  note?: string;
  error?: string;
}) {
  const cells = aggregateShadowRows(rows ?? [], challengerModel);
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {challengerLabel} vs CatBoost · by segment × lead
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : cells.length === 0 ? (
          <p className="text-muted-foreground text-xs">{note ?? 'No comparison data yet'}</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[34rem]">
              <div className="border-border/60 text-muted-foreground grid grid-cols-9 gap-1 border-b pb-1 text-[11px] font-medium tracking-wide uppercase">
                <span>Seg</span>
                <span>Lead</span>
                <span className="text-right">n</span>
                <span className="text-right">Act</span>
                <span className="text-right">Pred</span>
                <span className="text-right">Bias</span>
                <span className="text-right">CatB</span>
                <span className="text-right">{challengerLabel}</span>
                <span className="text-right">Δ</span>
              </div>
              {cells.map((c) => {
                const wins = c.delta != null && c.delta > 0;
                const isSummary = c.leadBucket === 'all';
                return (
                  <div
                    key={`${c.segment}|${c.leadBucket}`}
                    className={`border-border/40 grid grid-cols-9 gap-1 border-b py-1 text-xs last:border-0 ${
                      isSummary ? 'bg-muted/30 font-medium' : ''
                    }`}
                  >
                    <span className="font-mono">{SEGMENT_LABELS[c.segment] ?? c.segment}</span>
                    <span className="text-muted-foreground font-mono">{c.leadBucket}</span>
                    <span className="text-muted-foreground text-right font-mono tabular-nums">
                      {c.n.toLocaleString('en-GB')}
                    </span>
                    <span className="text-right font-mono tabular-nums">{c.actual.toFixed(1)}</span>
                    <span className="text-right font-mono tabular-nums">
                      {c.challengerPred != null ? c.challengerPred.toFixed(1) : '—'}
                    </span>
                    <span
                      className={`text-right font-mono tabular-nums ${
                        c.challengerBias == null
                          ? 'text-muted-foreground'
                          : biasColor(c.challengerBias)
                      }`}
                    >
                      {c.challengerBias == null
                        ? '—'
                        : `${c.challengerBias > 0 ? '+' : ''}${c.challengerBias.toFixed(1)}`}
                    </span>
                    <span
                      className={`text-right font-mono tabular-nums ${
                        c.catboostMae != null ? maeColor(c.catboostMae) : 'text-muted-foreground'
                      }`}
                    >
                      {c.catboostMae != null ? c.catboostMae.toFixed(1) : '—'}
                    </span>
                    <span
                      className={`text-right font-mono tabular-nums ${
                        c.challengerMae == null
                          ? 'text-muted-foreground'
                          : wins
                            ? 'font-semibold text-blue-400'
                            : maeColor(c.challengerMae)
                      }`}
                    >
                      {c.challengerMae != null ? c.challengerMae.toFixed(1) : '—'}
                    </span>
                    <span
                      className={`text-right font-mono tabular-nums ${
                        c.delta == null
                          ? 'text-muted-foreground'
                          : wins
                            ? 'text-emerald-400'
                            : 'text-red-400'
                      }`}
                    >
                      {c.delta == null ? '—' : `${c.delta > 0 ? '+' : ''}${c.delta.toFixed(1)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type LeadCurveCell = {
  leadBucket: string;
  segment: string;
  n: number;
  actual: number;
  pcnMae: number | null;
  persistMae: number | null;
  delta: number | null; // persistMae − pcnMae (>0 ⇒ PCN beats persistence)
};

// Pool the lead-curve rows into one n-weighted cell per (horizon, segment), holding PCN
// and the persistence baseline side by side. Each horizon has its own matched population
// (fewer targets have a 6h-back origin), so n is per-cell.
function aggregateLeadCurve(rows: ShadowComparisonRow[]): LeadCurveCell[] {
  const cells = new Map<string, { pcn?: ModelAcc; persist?: ModelAcc }>();
  for (const r of rows) {
    const key = `${r.leadBucket}|${r.segment}`;
    const cell = cells.get(key) ?? {};
    const slot = r.model === 'pcn' ? 'pcn' : 'persist';
    const acc = (cell[slot] ??= { n: 0, maeW: 0, biasW: 0, actW: 0, predW: 0 });
    const n = num(r.n);
    acc.n += n;
    acc.maeW += num(r.mae) * n;
    acc.actW += num(r.meanActual) * n;
    cells.set(key, cell);
  }
  const out: LeadCurveCell[] = [];
  for (const [key, { pcn, persist }] of cells) {
    const [leadBucket, segment] = key.split('|');
    const pcnMae = pcn?.n ? pcn.maeW / pcn.n : null;
    const persistMae = persist?.n ? persist.maeW / persist.n : null;
    const src = pcn?.n ? pcn : persist; // mean-actual is shared; use whichever exists
    out.push({
      leadBucket,
      segment,
      n: Math.min(pcn?.n ?? Infinity, persist?.n ?? Infinity),
      actual: src?.n ? src.actW / src.n : 0,
      pcnMae,
      persistMae,
      delta: pcnMae != null && persistMae != null ? persistMae - pcnMae : null,
    });
  }
  return out.sort(
    (a, b) =>
      (LEADCURVE_ORDER[a.leadBucket] ?? 9) - (LEADCURVE_ORDER[b.leadBucket] ?? 9) ||
      (SEGMENT_ORDER[a.segment] ?? 9) - (SEGMENT_ORDER[b.segment] ?? 9)
  );
}

// PCN@{1h,3h,6h} vs a persistence baseline. Measures the longer leads the UI serves for
// rest-of-day, which the main intraday board (freshest ~15-min origin) never scores (§7.7).
function LeadCurveBoard({
  rows,
  note,
  error,
}: {
  rows?: ShadowComparisonRow[];
  note?: string;
  error?: string;
}) {
  const cells = aggregateLeadCurve(rows ?? []);
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          PCN vs persistence · by forecast horizon
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : cells.length === 0 ? (
          <p className="text-muted-foreground text-xs">{note ?? 'No lead-curve data yet'}</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[28rem]">
              <div className="border-border/60 text-muted-foreground grid grid-cols-7 gap-1 border-b pb-1 text-[11px] font-medium tracking-wide uppercase">
                <span>Lead</span>
                <span>Seg</span>
                <span className="text-right">n</span>
                <span className="text-right">Act</span>
                <span className="text-right">PCN</span>
                <span className="text-right">Persist</span>
                <span className="text-right">Δ</span>
              </div>
              {cells.map((c) => {
                const wins = c.delta != null && c.delta > 0;
                return (
                  <div
                    key={`${c.leadBucket}|${c.segment}`}
                    className="border-border/40 grid grid-cols-7 gap-1 border-b py-1 text-xs last:border-0"
                  >
                    <span className="font-mono">{c.leadBucket}</span>
                    <span className="text-muted-foreground font-mono">
                      {SEGMENT_LABELS[c.segment] ?? c.segment}
                    </span>
                    <span className="text-muted-foreground text-right font-mono tabular-nums">
                      {c.n.toLocaleString('en-GB')}
                    </span>
                    <span className="text-right font-mono tabular-nums">{c.actual.toFixed(1)}</span>
                    <span
                      className={`text-right font-mono tabular-nums ${
                        c.pcnMae == null
                          ? 'text-muted-foreground'
                          : wins
                            ? 'font-semibold text-blue-400'
                            : maeColor(c.pcnMae)
                      }`}
                    >
                      {c.pcnMae != null ? c.pcnMae.toFixed(1) : '—'}
                    </span>
                    <span
                      className={`text-right font-mono tabular-nums ${
                        c.persistMae != null ? maeColor(c.persistMae) : 'text-muted-foreground'
                      }`}
                    >
                      {c.persistMae != null ? c.persistMae.toFixed(1) : '—'}
                    </span>
                    <span
                      className={`text-right font-mono tabular-nums ${
                        c.delta == null
                          ? 'text-muted-foreground'
                          : wins
                            ? 'text-emerald-400'
                            : 'text-red-400'
                      }`}
                    >
                      {c.delta == null ? '—' : `${c.delta > 0 ? '+' : ''}${c.delta.toFixed(1)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// TFT active-model identity card (near-term daily serving model). Kept alongside the
// scoreboard in the challenger section per the serving-map ↔ head-to-head split.
function TftModelCard({ model }: { model: SystemHealthResponse['ml']['tft']['activeModel'] }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Active model
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {model ? (
          <>
            <p className="font-mono text-base">{model.version}</p>
            {model.trainedAt && (
              <p className="text-muted-foreground text-xs">
                trained {new Date(model.trainedAt).toLocaleString('en-GB')}
              </p>
            )}
            {model.horizon && (
              <p className="text-muted-foreground text-xs">
                horizon {model.horizon}d · scope {model.parkScope ?? 'all'}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-xs">No model trained yet</p>
        )}
      </CardContent>
    </Card>
  );
}

// TFT-vs-CatBoost daily scoreboard. Pivots the flat rows → one entry per (date, segment)
// holding both models side by side (TFT's edge lives on busy/hdlnr). Logic kept verbatim.
function TftScoreboard({ comparison }: { comparison: SystemHealthResponse['ml']['comparison'] }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          vs CatBoost scoreboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {comparison?.rows?.length > 0 ? (
          (() => {
            type Pivot = {
              date: string;
              segment: string;
              n: number;
              cat?: ComparisonRow;
              tft?: ComparisonRow;
            };
            const groups = new Map<string, Pivot>();
            for (const r of comparison.rows) {
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
            {comparison?.note ?? 'No comparison data yet'}
          </p>
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

  // Serving-map ↔ challenger verdicts (returned by the API; not recomputed here).
  const intradayVerdict = comparison.data?.intraday.verdict?.map<VerdictItem>((v) => ({
    segment: v.segment,
    delta: v.delta,
    wins: v.pcnWins,
  }));
  const shapeVerdict = comparison.data?.shape.verdict?.map<VerdictItem>((v) => ({
    segment: v.segment,
    delta: v.delta,
    wins: v.challengerWins,
  }));

  const cbTraining = !!(catboost?.training.is_training && catboost.training.started_at);
  const tftTraining = !!tft?.training.is_training;
  const tftError = tft?.training.error;

  return (
    <>
      {/* ── Status strip: one-glance health, serving models, training ───────── */}
      <div className="space-y-3">
        <Card className="border-border/60">
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            <StripCell label="Health">
              <StatusBadge status={perf.drift.status} />
            </StripCell>
            <StripCell label="CatBoost">
              <div className="space-y-0.5">
                <TrainingStatusBadge state={cbState} label={model.current.version} />
                <p className="text-muted-foreground text-xs">{formatAge(d.system.modelAge)} old</p>
              </div>
            </StripCell>
            <StripCell label="TFT">
              {tft ? (
                <div className="space-y-0.5">
                  <TrainingStatusBadge state={tftState} label={tft.activeModel?.version} />
                  {tft.activeModel?.horizon != null && (
                    <p className="text-muted-foreground text-xs">
                      ≤{tft.activeModel.horizon}d daily
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground text-xs">
                  {health.data ? 'no model' : 'loading…'}
                </span>
              )}
            </StripCell>
            <StripCell label="Last accuracy check">
              <div className="space-y-0.5">
                <p className="tabular-nums">
                  {new Date(d.system.lastAccuracyCheck.completedAt).toLocaleString('en-GB')}
                </p>
                <p className="text-muted-foreground text-xs">
                  +{d.system.lastAccuracyCheck.newComparisonsAdded} comparisons
                </p>
              </div>
            </StripCell>
          </CardContent>
        </Card>

        {(cbTraining || tftTraining || tftError) && (
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                <Play className="h-3.5 w-3.5" /> Training in progress
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
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
                    <p className="text-muted-foreground text-xs">Starting… (building panel)</p>
                  )}
                </div>
              )}
              {tftError && !tftTraining && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">TFT</p>
                  <p className="text-xs text-red-400">{tftError}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Serving map: which model serves which horizon + live accuracy ───── */}
      <Section icon={Layers} title="Serving map">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <ServingCard name="CatBoost" role="far-daily 31–365d · fallback">
            <div className="flex items-end justify-between gap-2">
              <div>
                <span className={`text-3xl font-bold tabular-nums ${maeColor(perf.live.mae)}`}>
                  {perf.live.mae.toFixed(2)}
                </span>
                <p className="text-muted-foreground text-xs">Live MAE</p>
              </div>
              <span
                className={`text-xs font-medium ${
                  perf.improvement.isImproving ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {perf.improvement.maePercentChange > 0 ? '+' : ''}
                {perf.improvement.maePercentChange.toFixed(1)}% vs prev
              </span>
            </div>
            <div className="border-border/40 flex items-center justify-between border-t pt-2 text-xs">
              <span className="text-muted-foreground">Coverage</span>
              <span className="font-mono tabular-nums">
                {perf.live.coveragePercent.toFixed(1)}% ·{' '}
                {perf.live.matchedPredictions.toLocaleString('en-GB')} matched
              </span>
            </div>
          </ServingCard>

          <ServingCard name="TFT" role="near-term daily ≤30d">
            {tft?.activeModel ? (
              <div className="space-y-1">
                <p className="font-mono text-lg">{tft.activeModel.version}</p>
                {tft.activeModel.horizon != null && (
                  <p className="text-muted-foreground text-xs">
                    horizon {tft.activeModel.horizon}d · scope {tft.activeModel.parkScope ?? 'all'}
                  </p>
                )}
                {tft.activeModel.trainedAt && (
                  <p className="text-muted-foreground text-xs">
                    trained {new Date(tft.activeModel.trainedAt).toLocaleDateString('en-GB')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                {health.data ? 'No model trained yet' : 'Loading…'}
              </p>
            )}
          </ServingCard>

          {/* Served intraday = what users actually get (PCN champion-swap). The CatBoost
              "Live MAE" is the fallback/system-wide number. Guarded: absent when not serving. */}
          <ServingCard name="PCN" role="intraday 15-min · champion-swap">
            {perf.servedIntraday ? (
              <>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <span
                      className={`text-3xl font-bold tabular-nums ${maeColor(perf.servedIntraday.mae)}`}
                    >
                      {perf.servedIntraday.mae.toFixed(2)}
                    </span>
                    <p className="text-muted-foreground text-xs">Served MAE</p>
                  </div>
                  {perf.servedIntraday.delta != null ? (
                    <span
                      className={`text-xs font-medium ${
                        perf.servedIntraday.delta >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {perf.servedIntraday.delta >= 0 ? '-' : '+'}
                      {Math.abs(perf.servedIntraday.delta).toFixed(1)} vs CatBoost
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">vs CatBoost n/a</span>
                  )}
                </div>
                <div className="border-border/40 flex items-center justify-between border-t pt-2 text-xs">
                  <span className="text-muted-foreground">Window</span>
                  <span className="font-mono tabular-nums">
                    {perf.servedIntraday.n.toLocaleString('en-GB')} preds ·{' '}
                    {perf.servedIntraday.days}d
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-xs">Shadow only — not currently serving</p>
            )}
          </ServingCard>
        </div>

        {/* Model identity (CatBoost champion) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
          <StatCard label="Features" value={model.configuration.featureCount} sub="inputs used" />
        </div>
      </Section>

      {/* ── Model health: training-vs-live accuracy + drift ─────────────────── */}
      <Section icon={Gauge} title="Model health">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="border-border/60 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Accuracy · training vs live
              </CardTitle>
            </CardHeader>
            <CardContent>
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

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                <TrendingDown className="h-3.5 w-3.5" /> Drift
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <StatusBadge status={perf.drift.status} />
                <p className="text-muted-foreground text-xs">
                  drift {perf.drift.currentDrift.toFixed(2)} / threshold {perf.drift.threshold}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <KeyVal
                  label="Train MAE"
                  value={perf.drift.trainingMae.toFixed(2)}
                  valueClass={maeColor(perf.drift.trainingMae)}
                />
                <KeyVal
                  label="Live MAE"
                  value={perf.drift.liveMae.toFixed(2)}
                  valueClass={maeColor(perf.drift.liveMae)}
                />
                <KeyVal label="Tracked days" value={perf.drift.dailyMetrics.length} />
              </div>
              {perf.drift.byHorizon && (
                <div className="border-border/40 space-y-1 border-t pt-2 text-xs">
                  {perf.drift.byHorizon.map((h) => (
                    <div key={h.horizon} className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground capitalize">{h.horizon}</span>
                      {h.tracked && h.currentDrift != null ? (
                        <span className="font-mono tabular-nums">
                          {h.currentDrift.toFixed(1)}%
                          {h.liveMae != null && (
                            <span className="text-muted-foreground">
                              {' '}
                              · MAE {h.liveMae.toFixed(2)}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">n/a · unscored</span>
                      )}
                    </div>
                  ))}
                  <p className="text-muted-foreground/70">
                    Intraday drift tracks the CatBoost fallback (PCN serves intraday); far-daily is
                    unscored.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ── Challenger boards: verdict-forward shadow comparisons ───────────── */}
      <Section icon={GitCompare} title="Challenger boards">
        <p className="text-muted-foreground text-sm">
          n-weighted MAE per segment × lead bucket (highlighted row = lead &ldquo;all&rdquo;
          aggregate). <span className="font-medium">Act</span>/
          <span className="font-medium">Pred</span> are mean realised vs predicted minutes;{' '}
          <span className="font-medium">Bias</span> is the challenger&rsquo;s signed mean error
          (Pred − Act). Δ &gt; 0 (green) means the challenger beats CatBoost. PCN serves intraday
          behind a server flag; Shape is shadow-only.
        </p>

        <div className="space-y-2">
          {intradayVerdict && intradayVerdict.length > 0 && (
            <VerdictBar label="Intraday verdict (lead all)" items={intradayVerdict} />
          )}
          <ShadowBoard
            challengerLabel="PCN"
            challengerModel="pcn"
            rows={comparison.data?.intraday.rows}
            note={comparison.data?.intraday.note}
            error={comparison.data?.intraday.error}
          />
        </div>

        <div className="space-y-2">
          {shapeVerdict && shapeVerdict.length > 0 && (
            <VerdictBar label="Day-curve verdict (lead all)" items={shapeVerdict} />
          )}
          <ShadowBoard
            challengerLabel="Shape"
            challengerModel="shape"
            rows={comparison.data?.shape.rows}
            note={comparison.data?.shape.note}
            error={comparison.data?.shape.error}
          />
        </div>

        {comparison.data?.leadCurve && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              <span className="font-medium">Lead curve (§7.7):</span> PCN&rsquo;s forecast at a
              forced 1h/3h/6h horizon vs a persistence baseline (the wait that many hours ago). Δ
              &gt; 0 (green) means PCN beats persistence — expected to flip from negative at 1h to
              positive at longer leads (the rest-of-day the UI serves).
            </p>
            <LeadCurveBoard
              rows={comparison.data.leadCurve.rows}
              note={comparison.data.leadCurve.note}
              error={comparison.data.leadCurve.error}
            />
          </div>
        )}

        {health.data?.ml.tft && (
          <div className="space-y-2">
            <SubLabel>Daily forecast · TFT vs CatBoost (≤30d)</SubLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TftModelCard model={health.data.ml.tft.activeModel} />
              <TftScoreboard comparison={health.data.ml.comparison} />
            </div>
          </div>
        )}
      </Section>

      {/* ── Per-attraction accuracy: CatBoost hourly + TFT daily ────────────── */}
      <Section icon={Sparkles} title="Per-attraction accuracy">
        <div className="space-y-4">
          <div className="space-y-2">
            <SubLabel>CatBoost · hourly</SubLabel>
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
          </div>

          {tftPerformers.data && tftPerformers.data.topPerformers.length > 0 && (
            <div className="space-y-2">
              <SubLabel>TFT · daily</SubLabel>
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
            </div>
          )}
        </div>
      </Section>

      {/* ── Monitoring: anomalies + active alerts ───────────────────────────── */}
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
