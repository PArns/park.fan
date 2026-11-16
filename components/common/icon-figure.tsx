import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * One figure with its icon in a tinted square, a small label and the value: the tiles of the
 * developer dashboard and of a visitor's account.
 */
export function IconFigure({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border/60 bg-background/40 flex items-center gap-3 rounded-2xl border p-4',
        className
      )}
    >
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground truncate text-xs">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
