import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlassSectionTitleProps {
  icon: LucideIcon;
  /** Icon tint, e.g. `text-park-primary` / `text-muted-foreground`. */
  iconClassName?: string;
  className?: string;
  /** `h3` where the band stands inside a chapter that already has its `h2` (homepage nearby). */
  as?: 'h2' | 'h3';
  children: ReactNode;
}

/**
 * Frosted-glass section title pill (`bg-background/70` + backdrop blur). It is not a chapter
 * header: since PAR-688 its one remaining use is the nearby-parks card on the homepage, where
 * `NearbyChapter` opens the chapter with a `ChapterHeading` and this labels the list inside it,
 * as an `<h3>`. Under editorial pages the same card opens with `ChapterHeading` instead.
 */
export function GlassSectionTitle({
  icon: Icon,
  iconClassName,
  className,
  as: As = 'h2',
  children,
}: GlassSectionTitleProps) {
  return (
    <As
      className={cn(
        'bg-background/70 mb-2 flex w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-xl font-bold backdrop-blur-md',
        className
      )}
    >
      <Icon className={cn('h-5 w-5', iconClassName)} />
      {children}
    </As>
  );
}
