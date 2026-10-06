import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The section and tile components the admin's dashboards render with. */

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
