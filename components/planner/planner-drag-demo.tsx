import { Grab, Hand } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The empty day's drag, acted out (PAR-521: „können wir das animieren? Also
 * ein Drag-&-Drop-Icon", then „4–8 Frame Animation").
 *
 * A still `Grab` said "hand" and nothing about where it goes. This plays the
 * gesture the sentence under it describes, in seven poses over 3.2 s: an open
 * hand comes down on a ride card, closes, lifts it, carries it onto a dashed
 * slot on a strip of axis, lets go and draws back, and the card fades out to
 * start again. The poses are keyframes in `app/globals.css`
 * (`planner-drag-*`), eased between rather than cut (see
 * `docs/rules/a-fade-is-animated-never-a-cut.md`); the open and the closed
 * hand crossfade.
 *
 * Transforms and opacity only, so it runs on the compositor. Under
 * `prefers-reduced-motion` nothing moves and the scene holds one pose: the fist
 * on the card.
 */
export function PlannerDragDemo({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('relative h-11 w-16', className)}>
      {/* A strip of the axis, and the slot on it the card lands in. */}
      <div className="border-border absolute inset-x-0 bottom-1 border-t border-dashed" />
      <div className="border-primary/40 absolute right-1 bottom-1 h-3 w-6 rounded-[3px] border border-dashed">
        <div className="planner-drag-slot bg-primary/20 absolute inset-0 rounded-[2px] opacity-0" />
      </div>
      {/* The ride: a block in little, with the block's coloured left edge. */}
      <div className="planner-drag-card bg-primary/25 border-primary absolute top-3 left-1 h-3 w-6 rounded-[3px] border-l-2 shadow-sm" />
      {/* The hand, over the card's right half, so the card reads as held. */}
      <div className="planner-drag-hand text-primary absolute top-2 left-3 size-4">
        <Hand className="planner-drag-open absolute inset-0 size-4 opacity-0" strokeWidth={2.25} />
        <Grab className="planner-drag-closed absolute inset-0 size-4" strokeWidth={2.25} />
      </div>
    </div>
  );
}
