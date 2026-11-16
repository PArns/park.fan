import { useId, type ReactNode } from 'react';
import { GlassCard } from '@/components/common/glass-card';
import { ParkyStill } from '@/components/assistant/parky/parky-still';
import { BlogParkyAsk } from './blog-parky-ask';

/**
 * A post's `> [!PARKY]` callout: one tip in Parky's voice on a glass card, the still Parky beside
 * it as the one who says it. The card is server-rendered; only `ask`, the button that hands Parky
 * a question about the tip, is client code. It sits in the label's row, so the card keeps its
 * height when the button appears.
 */
export function BlogParkySays({
  label,
  ask,
  children,
}: {
  label: string;
  ask: { label: string; question: string };
  children: ReactNode;
}) {
  const ground = useId();
  return (
    <aside data-callout="parky" className="not-prose clear-both my-6">
      <GlassCard
        variant="medium"
        className="border-primary/30 from-primary/10 flex items-start gap-3 bg-linear-to-br to-[oklch(0.752_0.181_146.391)]/10 px-4 py-3 sm:gap-4"
      >
        <ParkyStill ground={ground} className="mt-0.5 size-12 shrink-0 sm:size-14" />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-primary text-xs font-bold tracking-wider uppercase">{label}</span>
            <BlogParkyAsk label={ask.label} question={ask.question} />
          </div>
          <div className="text-foreground/85 text-[0.95rem] leading-relaxed [&>p]:my-1.5">
            {children}
          </div>
        </div>
      </GlassCard>
    </aside>
  );
}
