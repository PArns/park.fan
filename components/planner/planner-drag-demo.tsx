import { Grab, Hand } from 'lucide-react';
import { cn } from '@/lib/utils';

/** One ride row of the park page, in little: a photo and two lines of text. */
function RowLook({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-muted ring-border absolute inset-0 rounded-[3px] ring-1 ring-inset',
        className
      )}
    >
      <div className="bg-primary/30 absolute top-0.5 left-0.5 size-3 rounded-[2px]" />
      <div className="bg-foreground/35 absolute top-1 left-[18px] h-[3px] w-10 rounded-full" />
      <div className="bg-muted-foreground/30 absolute top-[9px] left-[18px] h-[2px] w-6 rounded-full" />
    </div>
  );
}

/**
 * The empty day's drag, acted out: a hand lifts a ride from the park page's list on the left,
 * carries it across the planner's edge and sets it on a slot of the axis, where it becomes a block.
 * Keyframes `planner-drag-*` in `app/globals.css`, eased rather than cut (see
 * docs/rules/a-fade-is-animated-never-a-cut.md). Transforms and opacity only; under
 * `prefers-reduced-motion` it holds the pose that carries the card across the edge.
 */
export function PlannerDragDemo({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('relative h-20 w-52', className)}>
      <div className="absolute top-2 left-1 h-4 w-[84px]">
        <RowLook />
      </div>
      <div className="absolute top-8 left-1 h-4 w-[84px]">
        <RowLook />
      </div>
      <div className="absolute top-14 left-1 h-4 w-[84px]">
        <RowLook />
      </div>

      <div className="bg-muted/40 border-border absolute inset-y-0 right-0 left-[100px] rounded-r-md border-l" />
      <div className="bg-border absolute inset-y-1 left-[112px] w-px" />
      <div className="border-border absolute top-3 right-1 left-[108px] border-t border-dashed" />
      <div className="border-border absolute top-10 right-1 left-[108px] border-t border-dashed" />
      <div className="border-border absolute top-[68px] right-1 left-[108px] border-t border-dashed" />
      <div className="border-primary/45 absolute top-6 left-[120px] h-4 w-[84px] rounded-[3px] border border-dashed">
        <div className="planner-drag-slot bg-primary/15 absolute inset-0 opacity-0" />
      </div>

      {/* The carried ride, a copy of the middle row that takes the block's look where it lands. */}
      <div className="planner-drag-card absolute top-8 left-1 h-4 w-[84px]">
        <RowLook className="planner-drag-rowlook shadow-sm" />
        <div className="planner-drag-blocklook bg-primary/25 border-primary absolute inset-0 rounded-[3px] border-l-2 opacity-0">
          <div className="bg-primary/70 absolute top-1 left-1.5 h-[3px] w-10 rounded-full" />
        </div>
      </div>

      {/* The hand, over the card's right part, so the card reads as held. */}
      <div className="planner-drag-hand text-primary absolute top-[30px] left-[58px] size-5">
        <Hand className="planner-drag-open absolute inset-0 size-5 opacity-0" strokeWidth={2} />
        <Grab className="planner-drag-closed absolute inset-0 size-5" strokeWidth={2} />
      </div>
    </div>
  );
}
