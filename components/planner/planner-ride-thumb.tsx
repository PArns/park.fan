import Image from 'next/image';
import { RollerCoaster } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A ride's picture in a fixed box, or the coaster mark that stands in for one. The fallback is the
 * common case, so it has to look like a ride and fill the same box, or a list changes rhythm with
 * the photos we happen to have. `next/image` rather than the blocks' CSS background, whose loader
 * is tuned for full-bleed photos and blurs a 32 px thumbnail; the curated focal point travels
 * along.
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
