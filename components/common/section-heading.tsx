import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  /** Leading icon — gives each chapter a recognizable visual anchor. */
  icon: LucideIcon;
  /**
   * Icon tint override, e.g. rope-drop's emerald/indigo. Defaults to the
   * primary tint (chapter: applied to the tile, plain: to the icon itself).
   */
  iconClassName?: string;
  /** Node rather than string: some titles wrap a glossary link. */
  title: ReactNode;
  /** Optional muted hint pushed to the right (e.g. a data-window note). */
  hint?: string;
  /** Optional secondary node after the title — pass a ready-made <Badge>. */
  badge?: ReactNode;
  /** Heading level for correct document outline. Defaults to h2. */
  as?: 'h2' | 'h3';
  /**
   * `chapter` (default): icon in a tinted rounded square + bold title — the
   * page-level chapter header. `plain`: bare tinted icon + semibold title +
   * optional badge — the card/sub-section header (absorbed the former
   * separate `SectionHeader` component).
   */
  variant?: 'chapter' | 'plain';
  /**
   * Frosted pill behind the heading — for headings that sit directly on a page
   * background photo (park/ride pages), where bare text is unreadable over the
   * bright parts of an arbitrary image. Same treatment as `GlassSectionTitle`.
   */
  frosted?: boolean;
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
  iconClassName,
  title,
  hint,
  badge,
  as: As = 'h2',
  variant = 'chapter',
  frosted = false,
  className,
}: SectionHeadingProps) {
  const frost = frosted && 'bg-background/70 w-fit rounded-xl px-4 py-3 backdrop-blur-md';

  if (variant === 'plain') {
    return (
      <div className={cn('mb-4 flex flex-wrap items-center gap-2', frost, className)}>
        <Icon
          className={cn('h-5 w-5 shrink-0', iconClassName ?? 'text-primary')}
          aria-hidden="true"
        />
        <As className="text-xl font-semibold">{title}</As>
        {badge}
        {hint && <span className="text-muted-foreground ml-auto text-xs sm:text-sm">{hint}</span>}
      </div>
    );
  }

  return (
    <div className={cn('mb-4 flex flex-wrap items-center gap-3', frost, className)}>
      <span
        className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        aria-hidden="true"
      >
        <Icon className={cn('h-5 w-5', iconClassName)} />
      </span>
      <As className="text-xl font-bold sm:text-2xl">{title}</As>
      {badge}
      {hint && <span className="text-muted-foreground ml-auto text-xs sm:text-sm">{hint}</span>}
    </div>
  );
}
