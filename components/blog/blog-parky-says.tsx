import { useId, type ReactNode } from 'react';
import { GlassCard } from '@/components/common/glass-card';
import { ParkyStill } from '@/components/assistant/parky/parky-still';
import { ParkyStamp } from '@/components/assistant/parky/parky-stamp';
import { BlogParkyAsk } from './blog-parky-ask';

const CARD_CLASS =
  'border-primary/30 from-primary/10 bg-linear-to-br to-[oklch(0.752_0.181_146.391)]/10 px-4 py-3';
const LABEL_CLASS = 'text-primary text-xs font-bold tracking-wider uppercase';
const TEXT_CLASS = 'text-foreground text-base leading-relaxed [&>p]:my-1.5';

/**
 * A post's `> [!PARKY]` callout: one tip in Parky's voice on a glass card. The card is
 * server-rendered; only `ask`, the button that hands Parky a question about the tip, and the stamp
 * are client code. On the plain card the button sits in the label's row, so the card keeps its
 * height when it appears.
 *
 * Without `stamp` the still Parky stands beside the tip as the one who says it („Parky sagt“).
 * With it (the verdict from the marker line, `[!PARKY] Lohnt sich`) the caller labels the card
 * „Parkys Tipp“ and the verdict opens it as his green stamp, top left, with Parky looking over its
 * edge; he is already there, so the still one is left out and the tip gets the card's full width.
 */
export function BlogParkySays({
  label,
  ask,
  stamp,
  children,
}: {
  label: string;
  ask: { label: string; question: string };
  stamp?: string;
  children: ReactNode;
}) {
  const ground = useId();
  const askButton = <BlogParkyAsk label={ask.label} question={ask.question} />;
  if (stamp) {
    return (
      <aside data-callout="parky" className="not-prose clear-both my-6">
        <GlassCard variant="medium" className={CARD_CLASS}>
          {/* The room above the row is Parky's, who stands about his own height over the stamp. */}
          <div className="flex items-center gap-4 pt-11">
            <ParkyStamp tone="good" label={stamp} size="md" className="ml-1" />
            <span className={LABEL_CLASS}>{label}</span>
          </div>
          <div className={`${TEXT_CLASS} mt-3`}>{children}</div>
          {/* Under the tip rather than beside the stamp, where a phone has no room for both. Its
              row is held before the button decides to show, so the card does not grow then. */}
          <div className="mt-4 flex min-h-7 items-center">{askButton}</div>
        </GlassCard>
      </aside>
    );
  }
  return (
    <aside data-callout="parky" className="not-prose clear-both my-6">
      <GlassCard variant="medium" className={`${CARD_CLASS} flex items-start gap-3 sm:gap-4`}>
        <ParkyStill ground={ground} className="mt-0.5 size-12 shrink-0 sm:size-14" />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className={LABEL_CLASS}>{label}</span>
            {askButton}
          </div>
          <div className={TEXT_CLASS}>{children}</div>
        </div>
      </GlassCard>
    </aside>
  );
}
