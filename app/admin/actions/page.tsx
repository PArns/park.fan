'use client';

import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Brain,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  GitCompare,
  Loader2,
  Play,
  RotateCcw,
  Sigma,
  Snowflake,
  Sparkles,
  Spline,
  Trash2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { ADMIN_PASS_HEADER, useAdmin } from '../_lib/admin-context';
import { Section } from '../_lib/ui';

interface ActionDef {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
  description: string;
}

const MAINTENANCE_ACTIONS: ActionDef[] = [
  {
    key: 'flush',
    label: 'Flush Cache',
    icon: Trash2,
    path: 'flush-cache',
    description: 'Clear the Redis response cache.',
  },
  {
    key: 'train',
    label: 'Train ML',
    icon: Play,
    path: 'train-ml-model',
    description: 'Kick off a CatBoost training run.',
  },
  {
    key: 'sync',
    label: 'Sync Parks',
    icon: RotateCcw,
    path: 'sync-parks',
    description: 'Re-sync parks from upstream providers.',
  },
  {
    key: 'enrich',
    label: 'Enrich Parks',
    icon: Sparkles,
    path: 'enrich-parks',
    description: 'Backfill park metadata and geocoding.',
  },
  {
    key: 'validate',
    label: 'Validate & Repair',
    icon: Wrench,
    path: 'validate-and-repair-parks',
    description: 'Validate and repair park records.',
  },
  {
    key: 'gaps',
    label: 'Fill Schedule Gaps',
    icon: CalendarClock,
    path: 'fill-schedule-gaps',
    description: 'Fill missing operating-schedule entries.',
  },
  {
    key: 'holidays',
    label: 'Sync Holidays',
    icon: CalendarCheck,
    path: 'sync-holidays',
    description: 'Refresh public-holiday data.',
  },
  {
    key: 'seasonal',
    label: 'Detect Seasonal',
    icon: Snowflake,
    path: 'detect-seasonal',
    description: 'Re-run seasonal pattern detection.',
  },
  {
    key: 'accuracy',
    label: 'Aggregate Accuracy',
    icon: Sigma,
    path: 'aggregate-accuracy-stats',
    description: 'Recompute ML accuracy aggregates.',
  },
];

// PCN (intraday nowcaster) and Shape (day-curve) shadow models. Triggers enqueue the
// matching shadow job; results land in the ML page's "Shadow model boards" section.
const SHADOW_ACTIONS: ActionDef[] = [
  {
    key: 'pcn-train',
    label: 'PCN · Train',
    icon: Brain,
    path: 'pcn/train',
    description: 'Train per-park PCN intraday models (bring-up trigger).',
  },
  {
    key: 'pcn-forecast',
    label: 'PCN · Forecast',
    icon: Activity,
    path: 'pcn/forecast',
    description: 'Write PCN intraday forecasts.',
  },
  {
    key: 'pcn-score',
    label: 'PCN · Score',
    icon: GitCompare,
    path: 'pcn/score',
    description: 'Score PCN vs CatBoost and refresh the board.',
  },
  {
    key: 'shape-build',
    label: 'Shape · Build',
    icon: Spline,
    path: 'shape/build',
    description: 'Persist the additive + smooth day-curve profiles.',
  },
  {
    key: 'shape-forecast',
    label: 'Shape · Forecast',
    icon: Activity,
    path: 'shape/forecast',
    description: 'Write Shape day-curve forecasts.',
  },
  {
    key: 'shape-score',
    label: 'Shape · Score',
    icon: GitCompare,
    path: 'shape/score',
    description: 'Score Shape vs CatBoost and refresh the board.',
  },
];

export default function ActionsPage() {
  const { pass } = useAdmin();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<Record<string, 'ok' | 'err'>>({});

  async function trigger(action: ActionDef) {
    setLoading((p) => ({ ...p, [action.key]: true }));
    setResult((p) => {
      const next = { ...p };
      delete next[action.key];
      return next;
    });
    try {
      const res = await fetch(`/api/admin/${action.path}`, {
        method: 'POST',
        headers: { [ADMIN_PASS_HEADER]: pass },
      });
      setResult((p) => ({ ...p, [action.key]: res.ok ? 'ok' : 'err' }));
    } catch {
      setResult((p) => ({ ...p, [action.key]: 'err' }));
    } finally {
      setLoading((p) => ({ ...p, [action.key]: false }));
    }
  }

  function renderGrid(actions: ActionDef[]) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const state = result[action.key];
          return (
            <button
              key={action.key}
              onClick={() => trigger(action)}
              disabled={loading[action.key]}
              className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-all ${
                state === 'ok'
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : state === 'err'
                    ? 'border-red-500/40 bg-red-500/10'
                    : 'border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span className="flex items-center gap-2 font-medium">
                {loading[action.key] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : state === 'ok' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : state === 'err' ? (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                ) : (
                  <Icon className="text-primary h-4 w-4" />
                )}
                {action.label}
              </span>
              <span className="text-muted-foreground text-xs">{action.description}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <Section icon={Wrench} title="Maintenance actions">
        <p className="text-muted-foreground text-sm">
          Non-destructive jobs run asynchronously on the backend. Triggering only queues the job.
        </p>
        {renderGrid(MAINTENANCE_ACTIONS)}
      </Section>

      <Section icon={GitCompare} title="Shadow model jobs (PCN / Shape)">
        <p className="text-muted-foreground text-sm">
          Manual triggers for the PCN and Shape shadow pipelines. Each enqueues a job; scores show
          up under ML → Shadow model boards.
        </p>
        {renderGrid(SHADOW_ACTIONS)}
      </Section>
    </>
  );
}
