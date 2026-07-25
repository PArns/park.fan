import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  /** Leading icon — gives each chapter a recognizable visual anchor. */
  icon: LucideIcon;
  title: string;
  /** Optional muted hint shown to the right (e.g. a data-window note). Chapter variant only. */
  hint?: string;
  /** Optional secondary Badge after the title. Plain variant only. */
  badge?: ReactNode;
  /** Heading level for correct document outline. Defaults to h2. */
  as?: 'h2' | 'h3';
  /**
   * `chapter` (default): icon in a tinted rounded square + bold title — the
   * attraction-page chapter header. `plain`: bare primary icon + semibold
   * title + optional badge — the lighter list/section header (absorbed the
   * former separate `SectionHeader` component).
   */
  variant?: 'chapter' | 'plain';
  className?: string;
}

/**
 * Labeled section header used to split pages into clear chapters
 * ("Jetzt im Park", "Beste Besuchszeit", city sections on country pages, …)
 * instead of anonymous `<Separator>` dividers. Server-compatible (no client
 * hooks) so it renders into the static shell for SEO + instant paint.
 */
export function SectionHeading({
  icon: Icon,
  title,
  hint,
  badge,
  as: As = 'h2',
  variant = 'chapter',
  className,
}: SectionHeadingProps) {
  if (variant === 'plain') {
    return (
      <div className={cn('mb-4 flex items-center gap-2', className)}>
        <Icon className="text-primary h-5 w-5" />
        <As className="text-xl font-semibold">{title}</As>
        {badge && <Badge variant="secondary">{badge}</Badge>}
      </div>
    );
  }

  return (
    <div className={cn('mb-4 flex items-center gap-3', className)}>
      <span
        className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </span>
      <As className="text-xl font-bold sm:text-2xl">{title}</As>
      {hint && <span className="text-muted-foreground ml-auto text-xs sm:text-sm">{hint}</span>}
    </div>
  );
}
