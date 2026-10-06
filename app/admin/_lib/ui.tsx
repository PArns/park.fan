import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HostDisk } from '@/lib/api/admin';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { EmptyState, ErrorState, LoadingState } from '../_ui/primitives';

/**
 * Formatters and the section, tile and badge components the admin's dashboards
 * render with. The loading, error and empty panels at the end are aliases of
 * the ones in `_ui/primitives`, the kit the rest of the admin uses.
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

/** Formats an uptime given in hours as `3d 4h` from one day up, otherwise as `5h 12m`. */
export function formatUptime(hours: number) {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

/** A timestamp as a German calendar day for admin lists, `—` when there is none. */
export function formatDay(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return getDateTimeFormat('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    parsed
  );
}

/** Formats a `{ days, hours, minutes }` age as its two largest units: `2d 5h`, `3h 10m`, `45m`. */
export function formatAge(age: { days: number; hours: number; minutes: number }) {
  if (age.days > 0) return `${age.days}d ${age.hours}h`;
  if (age.hours > 0) return `${age.hours}h ${age.minutes}m`;
  return `${age.minutes}m`;
}

/** Type guard: true when a host disk entry carries usage figures rather than an `{ error }`. */
export function isDisk(d: HostDisk | { error: string }): d is HostDisk {
  return 'usedPct' in d;
}

/** Returns the text colour class for a model's MAE: green below 10, amber below 15, red above. */
export function maeColor(mae: number) {
  if (mae < 10) return 'text-emerald-400';
  if (mae < 15) return 'text-amber-400';
  return 'text-red-400';
}

// ─── primitives ─────────────────────────────────────────────────────────────

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

/** Small label above a bold tabular value, for figures inside a dashboard card. */
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

/** Dashboard name for `ErrorState`, showing the given error message. */
export function ErrorPanel({ message }: { message: string }) {
  return <ErrorState message={message} />;
}

/** Dashboard name for `EmptyState`, with the label as its title. */
export function EmptyPanel({ label }: { label: string }) {
  return <EmptyState title={label} />;
}
