import { AlertTriangle, Loader2, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { HostDisk } from '@/lib/api/admin';

// ─── formatting ───────────────────────────────────────────────────────────────

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
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
          {Icon && <Icon className="h-3.5 w-3.5" />} {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <span className={cn('text-3xl font-bold tabular-nums', valueClass)}>{value}</span>
        {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
      </CardContent>
    </Card>
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

// ─── states ─────────────────────────────────────────────────────────────────

export function LoadingPanel({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="text-muted-foreground border-border/40 bg-card/40 flex items-center justify-center gap-2 rounded-lg border py-12 text-sm">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

export function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="text-muted-foreground border-border/40 bg-card/40 rounded-lg border py-8 text-center text-sm">
      {label}
    </div>
  );
}
