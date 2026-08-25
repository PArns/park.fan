import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChapterHeading } from '@/components/common/chapter-heading';

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
   * `chapter` (default): the site-wide chapter header — oversized translucent
   * icon, big title, closing rule (`ChapterHeading`). `plain`: bare tinted
   * icon + semibold title + optional badge — the card/sub-section header
   * (absorbed the former separate `SectionHeader` component).
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

  // The page-level chapter header is `ChapterHeading` — the same component the
  // guide page's section shells and the blog's `##` headings render, so a
  // chapter opens the same way wherever a reader meets one.
  return (
    <ChapterHeading
      icon={Icon}
      title={title}
      hint={hint}
      badge={badge}
      as={As}
      frosted={frosted}
      className={className}
    />
  );
}
