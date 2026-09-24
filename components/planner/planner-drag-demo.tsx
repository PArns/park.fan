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
 * The empty day's drag, acted out (PAR-521: „können wir das animieren? Also
 * ein Drag-&-Drop-Icon", „4–8 Frame Animation", then „man muss nur verstehen,
 * dass man das von links nach rechts droppen kann").
 *
 * The scene is the screen in little: the park page's ride list on the left,
 * the planner's edge, and the planner's time axis on the right with a dashed
 * slot on it. A hand comes down on the middle ride, closes, lifts a copy of it,
 * carries it across the edge and sets it on the slot, where the list row turns
 * into a planner block; the hand opens and draws back, and the block fades out
 * to start again. Seven poses over 3.6 s, keyframes `planner-drag-*` in
 * `app/globals.css`, eased between rather than cut (see
 * `docs/rules/a-fade-is-animated-never-a-cut.md`).
 *
 * Transforms and opacity only, so it runs on the compositor. Under
 * `prefers-reduced-motion` nothing moves and the scene holds the middle pose:
 * the fist carrying the card across the edge, which still says which way.
 */
export function PlannerDragDemo({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('relative h-20 w-52', className)}>
      {/* The park page: three rides. */}
      <div className="absolute top-2 left-1 h-4 w-[84px]">
        <RowLook />
      </div>
      <div className="absolute top-8 left-1 h-4 w-[84px]">
        <RowLook />
      </div>
      <div className="absolute top-14 left-1 h-4 w-[84px]">
        <RowLook />
      </div>

      {/* The planner: its edge, a tinted ground, and a strip of its axis with
          three hour lines and the slot the ride lands in. */}
      <div className="bg-muted/40 border-border absolute inset-y-0 right-0 left-[100px] rounded-r-md border-l" />
      <div className="bg-border absolute inset-y-1 left-[112px] w-px" />
      <div className="border-border absolute top-3 right-1 left-[108px] border-t border-dashed" />
      <div className="border-border absolute top-10 right-1 left-[108px] border-t border-dashed" />
      <div className="border-border absolute top-[68px] right-1 left-[108px] border-t border-dashed" />
      <div className="border-primary/45 absolute top-6 left-[120px] h-4 w-[84px] rounded-[3px] border border-dashed">
        <div className="planner-drag-slot bg-primary/15 absolute inset-0 opacity-0" />
      </div>

      {/* The ride being carried: a copy of the middle row, which turns into a
          block (the block's tint and coloured left edge) where it lands. */}
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
