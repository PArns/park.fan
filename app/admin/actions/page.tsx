'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Brain,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  GitCompare,
  Gauge,
  Layers,
  Loader2,
  Play,
  Redo2,
  RotateCcw,
  Ruler,
  Sigma,
  Snowflake,
  Sparkles,
  Spline,
  Trash2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Section } from '../_lib/ui';
import { useCan } from '../_app/session';
import { AdminPage, Chip } from '../_ui/primitives';

/**
 * The job triggers, with what came back.
 *
 * Every one of these enqueues work and answers with a message and a job id,
 * and the page used to throw both away — a green tile said "accepted", and
 * whether the job then ran, died or is still queued was a different screen's
 * problem. Now the answer is kept and the failing queues are one click away on
 * the data-quality page.
 *
 * Three of them take a parameter, which is the reason a trigger is not just a
 * button here: `import-ride-stats` without a limit walks the whole catalogue,
 * and the first run of anything should be small.
 */

interface ActionDef {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
  description: string;
  /** `owner` for the ones that delete or rewrite rather than compute. */
  minRole?: 'editor' | 'owner';
  /** A single numeric parameter the trigger accepts, with its query key. */
  param?: { name: string; label: string; placeholder: string };
  /** Endpoints that refuse without `?confirm=true`. */
  needsConfirm?: boolean;
}

const MAINTENANCE_ACTIONS: ActionDef[] = [
  {
    key: 'sync',
    label: 'Parks synchronisieren',
    icon: RotateCcw,
    path: 'sync-parks',
    description: 'Parks neu von den Upstream-Quellen holen.',
  },
  {
    key: 'enrich',
    label: 'Parks anreichern',
    icon: Sparkles,
    path: 'enrich-parks',
    description: 'Metadaten und Geokodierung nachziehen.',
  },
  {
    key: 'attraction-details',
    label: 'Bahndetails holen',
    icon: Layers,
    path: 'sync-attraction-details',
    description: 'Land, Typ und Mindestgröße je Fahrgeschäft nachladen.',
  },
  {
    key: 'six-flags',
    label: 'Six-Flags-Größen',
    icon: Ruler,
    path: 'sync-six-flags-heights',
    description: 'Mindestgrößen von den Six-Flags-Parkseiten.',
  },
  {
    key: 'ride-stats',
    label: 'Ride-Stats importieren',
    icon: Gauge,
    path: 'import-ride-stats',
    description: 'Geschwindigkeit, Höhe, Länge und Dauer aus Wikidata.',
    param: { name: 'limit', label: 'Limit', placeholder: 'z. B. 25 für einen Probelauf' },
  },
  {
    key: 'publish-profiles',
    label: 'Ride-Profile publizieren',
    icon: Redo2,
    path: 'publish-ride-profiles',
    description: 'Caches der zuletzt kuratierten Profile leeren.',
    param: { name: 'sinceHours', label: 'Seit (Stunden)', placeholder: 'Standard: 24' },
  },
  {
    key: 'gaps',
    label: 'Kalenderlücken füllen',
    icon: CalendarClock,
    path: 'fill-schedule-gaps',
    description: 'Fehlende Öffnungszeiten nachtragen.',
  },
  {
    key: 'holidays',
    label: 'Feiertage holen',
    icon: CalendarCheck,
    path: 'sync-holidays',
    description: 'Feiertagsdaten auffrischen.',
  },
  {
    key: 'seasonal',
    label: 'Saisonalität erkennen',
    icon: Snowflake,
    path: 'detect-seasonal',
    description: 'Saisonmuster neu bestimmen.',
  },
  {
    key: 'train',
    label: 'ML trainieren',
    icon: Play,
    path: 'train-ml-model',
    description: 'Einen CatBoost-Lauf anstoßen.',
  },
  {
    key: 'accuracy',
    label: 'Treffgenauigkeit aggregieren',
    icon: Sigma,
    path: 'aggregate-accuracy-stats',
    description: 'Kennzahlen der Vorhersagegüte neu rechnen.',
  },
];

/** Everything that deletes, rewrites or repairs. Owner only, and it shows. */
const DESTRUCTIVE_ACTIONS: ActionDef[] = [
  {
    key: 'flush',
    label: 'Cache leeren',
    icon: Trash2,
    path: 'flush-cache',
    description: 'Den Redis-Antwortcache verwerfen.',
    minRole: 'owner',
  },
  {
    key: 'cache-reset',
    label: 'Redis komplett zurücksetzen',
    icon: AlertTriangle,
    path: 'cache/reset?confirm=true',
    description: 'FLUSHALL. Trifft auch Sitzungen und Rate-Limits.',
    minRole: 'owner',
    needsConfirm: true,
  },
  {
    key: 'validate',
    label: 'Parks prüfen und reparieren',
    icon: Wrench,
    path: 'validate-and-repair-parks',
    description: 'Parkzeilen validieren und Offensichtliches richten.',
    minRole: 'owner',
  },
  {
    key: 'dedupe-aggregates',
    label: 'Perzentil-Aggregate entdoppeln',
    icon: GitCompare,
    path: 'dedupe-percentile-aggregates',
    description: 'Doppelte Aggregatzeilen entfernen.',
    minRole: 'owner',
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
    description: 'PCN-Intraday-Modelle je Park trainieren.',
  },
  {
    key: 'pcn-forecast',
    label: 'PCN · Forecast',
    icon: Brain,
    path: 'pcn/forecast',
    description: 'Intraday-Prognosen für heute erzeugen.',
  },
  {
    key: 'pcn-score',
    label: 'PCN · Score',
    icon: Brain,
    path: 'pcn/score',
    description: 'PCN gegen CatBoost bewerten.',
  },
  {
    key: 'shape-build',
    label: 'Shape · Build',
    icon: Spline,
    path: 'shape/build',
    description: 'Tageskurven aus der Historie bauen.',
  },
  {
    key: 'shape-forecast',
    label: 'Shape · Forecast',
    icon: Spline,
    path: 'shape/forecast',
    description: 'Kurvenprognosen erzeugen.',
  },
  {
    key: 'shape-score',
    label: 'Shape · Score',
    icon: Spline,
    path: 'shape/score',
    description: 'Shape gegen CatBoost bewerten.',
  },
];

interface Outcome {
  ok: boolean;
  message: string;
  jobId?: string | number | null;
}

export default function ActionsPage() {
  const isOwner = useCan('owner');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [outcome, setOutcome] = useState<Record<string, Outcome>>({});
  const [params, setParams] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<string | null>(null);

  async function trigger(action: ActionDef) {
    setLoading((previous) => ({ ...previous, [action.key]: true }));
    setOutcome((previous) => {
      const next = { ...previous };
      delete next[action.key];
      return next;
    });

    const value = params[action.key]?.trim();
    const separator = action.path.includes('?') ? '&' : '?';
    const path =
      action.param && value
        ? `${action.path}${separator}${action.param.name}=${encodeURIComponent(value)}`
        : action.path;

    try {
      const response = await fetch(`/api/admin/${path}`, { method: 'POST' });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        jobId?: string | number | null;
        error?: string;
      };
      setOutcome((previous) => ({
        ...previous,
        [action.key]: {
          ok: response.ok,
          message:
            payload.message ??
            payload.error ??
            (response.ok ? 'Angestoßen.' : `HTTP ${response.status}`),
          jobId: payload.jobId ?? null,
        },
      }));
    } catch (error) {
      setOutcome((previous) => ({
        ...previous,
        [action.key]: {
          ok: false,
          message: error instanceof Error ? error.message : 'Anfrage fehlgeschlagen',
        },
      }));
    } finally {
      setLoading((previous) => ({ ...previous, [action.key]: false }));
      setConfirming(null);
    }
  }

  function renderGrid(actions: ActionDef[]) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const state = outcome[action.key];
          const locked = action.minRole === 'owner' && !isOwner;
          const isConfirming = confirming === action.key;

          return (
            <div
              key={action.key}
              className={`flex flex-col gap-2 rounded-lg border p-4 transition-all ${
                state?.ok === true
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : state?.ok === false
                    ? 'border-red-500/40 bg-red-500/10'
                    : 'border-border/60 bg-card'
              } ${locked ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {loading[action.key] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : state?.ok === true ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : state?.ok === false ? (
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  ) : (
                    <Icon className="text-primary h-4 w-4" />
                  )}
                  {action.label}
                </span>
                {action.minRole === 'owner' && <Chip tone="warning">owner</Chip>}
              </div>

              <span className="text-muted-foreground text-xs">{action.description}</span>

              {action.param && !locked && (
                <input
                  value={params[action.key] ?? ''}
                  onChange={(event) =>
                    setParams((previous) => ({ ...previous, [action.key]: event.target.value }))
                  }
                  inputMode="numeric"
                  placeholder={action.param.placeholder}
                  aria-label={action.param.label}
                  className="border-border/60 bg-background focus:border-primary/60 w-full rounded-md border px-2 py-1 text-xs outline-none"
                />
              )}

              {isConfirming ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirming(null)}
                    className="text-muted-foreground hover:text-foreground text-xs"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => trigger(action)}
                    className="bg-destructive hover:bg-destructive/90 rounded-md px-2 py-1 text-xs font-medium text-white"
                  >
                    Wirklich ausführen
                  </button>
                </div>
              ) : (
                <button
                  onClick={() =>
                    action.needsConfirm ? setConfirming(action.key) : trigger(action)
                  }
                  disabled={loading[action.key] || locked}
                  className="border-border/60 hover:border-primary/40 hover:bg-primary/5 self-start rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {locked ? 'Nur für Owner' : 'Ausführen'}
                </button>
              )}

              {state && (
                <p
                  className={`text-xs break-words ${state.ok ? 'text-muted-foreground' : 'text-destructive'}`}
                >
                  {state.message}
                  {state.jobId ? (
                    <>
                      {' '}
                      <span className="font-mono">#{String(state.jobId)}</span>
                    </>
                  ) : null}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <AdminPage width="wide">
      <Section icon={Wrench} title="Jobs anstoßen">
        <p className="text-muted-foreground text-sm">
          Alles hier läuft asynchron: der Klick stellt den Job in die Queue und die Antwort sagt,
          unter welcher Nummer. Was daraus geworden ist, steht unter Datenqualität.
        </p>
        {renderGrid(MAINTENANCE_ACTIONS)}
      </Section>

      <Section icon={AlertTriangle} title="Eingriffe">
        <p className="text-muted-foreground text-sm">
          Diese vier verwerfen oder schreiben Daten um, statt etwas zu berechnen. Owner-Rolle
          vorausgesetzt, und das Zurücksetzen von Redis fragt nach.
        </p>
        {renderGrid(DESTRUCTIVE_ACTIONS)}
      </Section>

      <Section icon={GitCompare} title="Schattenmodelle (PCN / Shape)">
        <p className="text-muted-foreground text-sm">
          Manuelle Auslöser für die Schattenpipelines. Die Bewertungen landen unter ML →
          Schattenmodelle.
        </p>
        {renderGrid(SHADOW_ACTIONS)}
      </Section>
    </AdminPage>
  );
}
