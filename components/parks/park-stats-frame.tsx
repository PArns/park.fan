import { GlassCard } from '@/components/common/glass-card';

/**
 * The two shapes a statistics card can take.
 *
 * `CardFrame` is the standalone one — its own glass and padding, which is what the guide page's
 * anatomy demo and any future single use need. `BareFrame` is for the stats panel, where the
 * enclosing `PANEL_CELL` already draws the box, the padding and the hairline rules; a `GlassCard`
 * inside that is a second frame around the same content and reads as a card floating in a card.
 *
 * Two components rather than a conditional wrapper at each call site, so the `space-y-2` that
 * separates a card's heading from its table is written down once and cannot drift between the two.
 */
export function CardFrame({ children }: { children: React.ReactNode }) {
  return (
    <GlassCard variant="medium" className="space-y-2 p-4">
      {children}
    </GlassCard>
  );
}

export function BareFrame({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}
