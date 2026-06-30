import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  /** Leading icon — gives each chapter a recognizable visual anchor. */
  icon: LucideIcon;
  title: string;
  /** Optional muted hint shown to the right (e.g. a data-window note). */
  hint?: string;
  /** Heading level for correct document outline. Defaults to h2. */
  as?: 'h2' | 'h3';
  className?: string;
}

/**
 * Labeled section header used to split the attraction page into clear chapters
 * ("Jetzt im Park", "Beste Besuchszeit", …) instead of anonymous `<Separator>`
 * dividers. Server-compatible (no client hooks) so it renders into the static
 * shell for SEO + instant paint.
 */
export function SectionHeading({
  icon: Icon,
  title,
  hint,
  as: As = 'h2',
  className,
}: SectionHeadingProps) {
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
