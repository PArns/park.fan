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
  /**
   * `none` where the body brings its own padding — a {@link PanelGrid}, whose cells carry both
   * the padding and the hairlines.
   *
   * A prop rather than a `p-0` in {@link ChapterPanelProps.bodyClassName}, because a class cannot
   * cancel the default: `twMerge('p-4 @min-[768px]/page:p-6', 'p-0')` keeps the container variant
   * (it drops only the unprefixed `p-4`), so every `p-0` call site still had 24 px of padding from
   * a 768 px container up. There the grid's `-mr-px -mb-px` no longer reaches the box's edge, and
   * its trailing hairlines stood inside the panel with 24 px of nothing under them.
   */
  bodyPadding?: 'default' | 'none';
  /**
   * Extra classes for the body. A body that wants NO padding says so with
   * {@link ChapterPanelProps.bodyPadding} rather than with a `p-0` here; a body that wants a
   * different padding (`RideProfileSection`'s `p-5 sm:p-6`) still sets it here, because both of
   * its classes outrank the default at every width where the default's container variant fires.
   */
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
 * `bodyPadding="none"` plus a `PanelGrid` inside is what „Heute im Park" and the statistics
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
  bodyPadding = 'default',
  bodyClassName,
  className,
  children,
}: ChapterPanelProps) {
  return (
    // `mt-6` below `sm`, `mt-10` above: the same step the heading takes (PAR-433), and the same
    // pair `PageSection` and `AttractionHistoryPanel` carry, so the rhythm between chapters does
    // not depend on which of the three opened one.
    <section id={id} className={cn('mt-6 sm:mt-10', id && 'scroll-mt-24', className)}>
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
          bodyPadding === 'default' && 'p-4 @min-[768px]/page:p-6',
          bodyClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
