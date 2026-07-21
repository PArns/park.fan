import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlassSectionTitleProps {
  icon: LucideIcon;
  /** Icon tint, e.g. `text-park-primary` / `text-muted-foreground`. */
  iconClassName?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Frosted-glass section title pill (`bg-background/70` + backdrop blur) used
 * over hero/background imagery where a bare heading would be illegible —
 * nearby-parks card and favorites section. Was copy-pasted six times before.
 */
export function GlassSectionTitle({
  icon: Icon,
  iconClassName,
  className,
  children,
}: GlassSectionTitleProps) {
  return (
    <h2
      className={cn(
        'bg-background/70 mb-2 flex w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-xl font-bold backdrop-blur-md',
        className
      )}
    >
      <Icon className={cn('h-5 w-5', iconClassName)} />
      {children}
    </h2>
  );
}
