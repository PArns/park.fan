import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The section, tile and badge components the admin's dashboards render with. */

/** Renders a small round dot, green when `ok` and red otherwise. */
export function statusDot(ok: boolean) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
  );
}

/** Dashboard section: icon, uppercase heading, an optional action on the right, content below. */
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

/** Dashboard tile: an uppercase label, one large tabular figure and an optional line beneath. */
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

const SEVERITY_STYLES: Record<string, string> = {
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/15 text-red-400 border-red-500/20',
};

/** Pill coloured by severity (low, medium, high, critical); any other value is grey. */
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

/**
 * Pill coloured by crowd level (`very_low` to `very_high`) for the monitoring dashboards, with
 * underscores shown as spaces. The public site uses `CrowdLevelBadge`.
 */
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

/**
 * Pill with a status dot: green for statuses like healthy, ok or online, amber for warning,
 * degraded or pending, red for anything else.
 */
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
