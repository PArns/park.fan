import { cn } from '@/lib/utils';
import { backgroundPhotoUrl } from '@/lib/utils/image-loader';

/**
 * How much of a block's photo shows through. Every block that has one gets it, whatever its height,
 * so the photo is the column's texture rather than an accent, and 0.2 keeps it quieter than the
 * numbers.
 */
const PHOTO_OPACITY = 'opacity-[0.2]';

/**
 * A block's photo, inside its clipped ink layer: the day planner's ride blocks and the Orlando
 * trip's park blocks draw the same texture. `background-image`, not `next/image`: the block's size
 * changes with the plan and the crop is already right.
 */
export function PlannerBlockPhoto({ src, position }: { src: string; position: string }) {
  return (
    <div
      className={cn('absolute inset-0', PHOTO_OPACITY)}
      style={{
        backgroundImage: `url(${backgroundPhotoUrl(src)})`,
        backgroundSize: 'cover',
        backgroundPosition: position,
      }}
    />
  );
}

/** Outlook's category bar down a block's left edge, in the colour the caller names. */
export function PlannerBlockBar({ className }: { className: string }) {
  return <div className={cn('absolute inset-y-0 left-0 w-[3px] rounded-l', className)} />;
}
