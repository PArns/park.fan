import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { PANEL_FLAT, TILE_GLASS } from '@/components/common/glass-card';
import { cn } from '@/lib/utils';

interface ChapterPanelProps {
  icon: LucideIcon;
  title: ReactNode;
  /** Muted line under the title — a data window, a sample size. */
  hint?: ReactNode;
  /** Node beside the title: a badge, a glossary link. */
  badge?: ReactNode;
  /** A control the chapter owns, pushed to the right of the title row. */
  action?: ReactNode;
  /** Anchor id; brings the repo's sticky-header scroll offset with it. */
  id?: string;
  /**
   * `glass` (default) is the park photo's material. `flat` is for a page with no backdrop, where
   * a fill of `--background` over `--background` sinks into the page — see {@link PANEL_FLAT}.
   */
  surface?: 'glass' | 'flat';
  /** Body padding. Pass `p-0` when the body is a {@link PanelGrid}, whose cells bring their own. */
  bodyClassName?: string;
  className?: string;
  children: ReactNode;
}

/**
 * A chapter whose heading is the lid of the box under it.
 *
 * The band's lower edge is the body's first rule: `rounded-b-none` over `rounded-t-none
 * border-t-0`, one object rather than a title floating above a card with a strip of park
 * photograph between them. Three chapters on the park's pages were already built this way by
 * hand — the crowd calendar, „Beste Reisezeit" and „Historische Wartezeit-Statistiken" — each
 * spelling the same four classes slightly differently; this is that shape with one home.
 *
 * The alternative, `PageSection`, is the other legitimate arrangement: a band that stands on its
 * own above content that is a GRID of cards with a gap over it. The line between them is whether
 * the chapter's body is one surface. When it is, glue it here.
 *
 * `bodyClassName="p-0"` plus a `PanelGrid` inside is what „Heute im Park" and the statistics
 * panel do: hairline-ruled columns instead of separate cards, with each card rendered bare —
 * a `GlassCard` inside a `PANEL_CELL` is a second frame around the same content.
 *
 * Server-compatible (no client hooks), so chapters render into the served HTML.
 */
export function ChapterPanel({
  icon,
  title,
  hint,
  badge,
  action,
  id,
  surface = 'glass',
  bodyClassName,
  className,
  children,
}: ChapterPanelProps) {
  return (
    <section id={id} className={cn('mt-10', id && 'scroll-mt-24', className)}>
      <ChapterHeading
        icon={icon}
        title={title}
        hint={hint}
        badge={badge}
        action={action}
        frosted={surface === 'glass'}
        className="mb-0 rounded-b-none"
      />
      <div
        className={cn(
          surface === 'glass' ? TILE_GLASS : PANEL_FLAT,
          // `overflow-hidden` is what clips a `PanelGrid`'s trailing hairlines — the grid bleeds
          // its last row and column by a pixel and relies on the box to cut them off.
          'border-border/50 overflow-hidden rounded-b-xl border border-t-0',
          'p-4 @min-[768px]/page:p-6',
          bodyClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
