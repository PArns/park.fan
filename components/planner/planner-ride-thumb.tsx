import Image from 'next/image';
import { RollerCoaster } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A ride's picture in a fixed box — or the mark that stands in for one.
 *
 * The fallback used to be a `+`, which reads as "add this" rather than as "no
 * photo" and put an action glyph where every neighbouring row shows a subject.
 * 198 of the 212 parks have no picture in the media database at all, so the
 * fallback is the COMMON case here, not the exception: it has to look like a
 * ride, and it has to fill the same box the photo would, or a list of rides
 * changes its rhythm depending on which ones we happen to have shot.
 *
 * `next/image` with a fixed box rather than the CSS background the blocks use:
 * that loader is tuned for full-bleed photos at q50 and turns a 32 px thumbnail
 * to mush. The focal point the admin set travels with the photo, so a picture
 * framed for a card is framed here too.
 */
export function PlannerRideThumb({
  src,
  position,
  size,
  className,
}: {
  src?: string | null;
  position?: string;
  /** The box, in Tailwind units. `4` is a chip's, `8` a list row's. */
  size: 4 | 8;
  className?: string;
}) {
  const box = cn(
    'bg-muted relative shrink-0 overflow-hidden',
    size === 4 ? 'size-4 rounded-full' : 'size-8 rounded',
    className
  );

  if (!src) {
    return (
      <span className={cn(box, 'text-muted-foreground/70 flex items-center justify-center')}>
        <RollerCoaster className={size === 4 ? 'size-2.5' : 'size-4'} aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className={box}>
      <Image
        src={src}
        alt=""
        fill
        sizes={size === 4 ? '32px' : '96px'}
        quality={size === 4 ? 60 : 75}
        style={{ objectFit: 'cover', objectPosition: position }}
      />
    </span>
  );
}
