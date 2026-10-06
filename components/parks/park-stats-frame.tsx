import { GlassCard } from '@/components/common/glass-card';

/**
 * The standalone shape of a statistics card, with its own glass and padding (the guide page's
 * demo). `BareFrame` is the one inside the stats panel, whose `PANEL_CELL` already draws the box;
 * two components, so the heading-to-table `space-y-2` is written once.
 */
export function CardFrame({ children }: { children: React.ReactNode }) {
  return (
    <GlassCard variant="medium" className="space-y-2 p-4">
      {children}
    </GlassCard>
  );
}

/** `CardFrame` without the glass: only the heading-to-table spacing, for a card inside the stats panel. */
export function BareFrame({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}
