'use client';

import type { Ref } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DialogTitle } from '@/components/ui/dialog';
import { SceneFade, useRegionScene } from '@/components/layout/planner-region-art';
import { PLAN_FOCUS } from '../planner/plan-controls';

/**
 * The assistant's band: the region's Parky scene on the right, always at its own 2 : 1 and fading
 * into the card's ground on its left, so Parky is never cropped at any width; on the left the line
 * over the question (region, dates or step) and Parky's question in a speech bubble whose tail
 * points at him. The bubble is the dialog's title and takes the focus when the step changes, so a
 * screen reader reads the question. `evening` draws the scene's night version in either theme.
 * docs/features/trip-planner/wizard.md#the-band.
 */
export function WizardGuideBand({
  region,
  kicker,
  ask,
  askId,
  askRef,
  evening = false,
  closeLabel,
  onClose,
}: {
  /** The region's slug, whose scene the registry loads. */
  region: string;
  /** The small line over the bubble: "JAPAN · STEP 1 OF 6", "JAPAN · 14–30 JAN". */
  kicker: string;
  ask: string;
  askId: string;
  askRef: Ref<HTMLHeadingElement>;
  evening?: boolean;
  closeLabel: string;
  onClose: () => void;
}) {
  const Scene = useRegionScene(region);
  return (
    <div className="border-border/60 bg-card relative h-32 shrink-0 overflow-hidden border-b sm:h-40">
      {Scene && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-y-0 right-0 aspect-[2/1] mask-l-from-65% mask-l-to-100%',
            evening && 'dark'
          )}
        >
          <SceneFade Scene={Scene} fallback={null} />
        </span>
      )}
      <div className="relative flex h-full max-w-[68%] flex-col justify-center gap-1.5 pl-4 sm:max-w-[62%] sm:pl-6">
        <p className="text-muted-foreground truncate text-[11px] font-semibold tracking-wide uppercase">
          {kicker}
        </p>
        <div className="relative self-start">
          <DialogTitle
            id={askId}
            ref={askRef}
            tabIndex={-1}
            className={cn(
              'bg-card border-border/70 relative z-10 rounded-2xl border px-3.5 py-2 text-base leading-snug font-semibold text-balance shadow-sm outline-none sm:px-4 sm:py-2.5 sm:text-lg',
              'focus-visible:ring-ring focus-visible:ring-2'
            )}
          >
            {ask}
          </DialogTitle>
          {/* The tail: a square turned on its edge, under the bubble's right side, pointing at Parky. */}
          <span
            aria-hidden="true"
            className="bg-card border-border/70 absolute top-1/2 -right-1.5 size-3 -translate-y-1/2 rotate-45 border-t border-r"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className={cn(
          'bg-background/80 hover:bg-background absolute top-2 right-2 flex size-9 items-center justify-center rounded-full shadow-sm transition-colors max-sm:size-11',
          PLAN_FOCUS
        )}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
