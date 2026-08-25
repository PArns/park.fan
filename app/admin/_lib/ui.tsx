import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HostDisk } from '@/lib/api/admin';
import { EmptyState, ErrorState, LoadingState } from '../_ui/primitives';

/**
 * What the monitoring dashboards render with.
 *
 * Everything here is specific to those pages — an MAE colour ramp, a disk
 * type guard, the crowd-level palette — and belongs beside them. What used to
 * ALSO live here, and no longer does, is the generic half: `Section`,
 * `LoadingPanel`, `ErrorPanel` and `EmptyPanel` were one of three competing
 * definitions of the same four things in this admin (the media panel kit and
 * the blog editor's form fields had the others), which is exactly the drift the
 * reuse rule exists to prevent. They are re-exported from `_ui/primitives` so
 * the dashboards did not need editing, and there is now one implementation.
 */

// ─── formatting ───────────────────────────────────────────────────────────────

/**
 * A person's name as a name.
 *
 * Accounts get created by whoever is at the keyboard and the display name
 * arrives however it was typed, which on this deployment is `patrick` — so the
 * dashboard opened with „Hallo patrick" in 24 px bold. It is fixed on the way
 * out rather than on the way in: rewriting what somebody entered into their own
 * account is not this app's business, and the greeting is.
 *
 * The first letter of each part, and nothing else: a part that already starts
 * with a capital is left exactly as it is, which is what keeps `McMahon` from
 * coming out as `Mcmahon` the way a full title-case pass would.
 */
export function formatDisplayName(name: string): string {
  return name.replace(
    /(^|[\s-])(\p{Ll})/gu,
    (_, lead: string, first: string) => lead + first.toUpperCase()
  );
}

export function formatUptime(hours: number) {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

export function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatAge(age: { days: number; hours: number; minutes: number }) {
  if (age.days > 0) return `${age.days}d ${age.hours}h`;
  if (age.hours > 0) return `${age.hours}h ${age.minutes}m`;
  return `${age.minutes}m`;
}

export function isDisk(d: HostDisk | { error: string }): d is HostDisk {
  return 'usedPct' in d;
}

export function maeColor(mae: number) {
  if (mae < 10) return 'text-emerald-400';
  if (mae < 15) return 'text-amber-400';
  return 'text-red-400';
}

// ─── primitives ─────────────────────────────────────────────────────────────

export function statusDot(ok: boolean) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
  );
}

export function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="text-primary h-4 w-4" />
        <h2 className="text-foreground/70 text-sm font-semibold tracking-wide uppercase">
          {title}
        </h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  valueClass,
}: {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="border-border/60 bg-card/60 space-y-1 rounded-xl border p-4 backdrop-blur-sm">
      <p className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </p>
      <span className={cn('block text-3xl font-bold tabular-nums', valueClass)}>{value}</span>
      {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
    </div>
  );
}

export function KeyVal({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={cn('font-semibold tabular-nums', valueClass)}>{value}</p>
    </div>
  );
}

// ─── badges ───────────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, string> = {
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/15 text-red-400 border-red-500/20',
};

export function SeverityBadge({ severity }: { severity: string }) {
  const style =
    SEVERITY_STYLES[severity.toLowerCase()] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {severity}
    </span>
  );
}

const CROWD_STYLES: Record<string, string> = {
  very_low: 'bg-emerald-500/15 text-emerald-400',
  low: 'bg-emerald-500/15 text-emerald-400',
  moderate: 'bg-amber-500/15 text-amber-400',
  high: 'bg-orange-500/15 text-orange-400',
  very_high: 'bg-red-500/15 text-red-400',
};

export function CrowdBadge({ level }: { level: string }) {
  const style = CROWD_STYLES[level?.toLowerCase()] ?? 'bg-zinc-500/15 text-zinc-400';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {level?.replace(/_/g, ' ') ?? '—'}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const lower = status?.toLowerCase() ?? '';
  const warn = ['warning', 'degraded', 'pending'].some((k) => lower.includes(k));
  const ok =
    !warn &&
    ['healthy', 'connected', 'operational', 'active', 'good', 'online', 'ok'].some((k) =>
      lower.includes(k)
    );
  const style = ok
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
    : warn
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
      : 'bg-red-500/15 text-red-400 border-red-500/20';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {statusDot(ok)} {status}
    </span>
  );
}

// ─── states ───────────────────────────────────────────────────────────────

/**
 * The dashboards' names for the shared state panels.
 *
 * Kept as aliases rather than renamed at ~40 call sites: the rename would be a
 * large diff that changes nothing a person sees, buried in the same commit as
 * the changes that do.
 */
export function LoadingPanel({ label = 'Lädt…' }: { label?: string }) {
  return <LoadingState label={label} />;
}

export function ErrorPanel({ message }: { message: string }) {
  return <ErrorState message={message} />;
}

export function EmptyPanel({ label }: { label: string }) {
  return <EmptyState title={label} />;
}
