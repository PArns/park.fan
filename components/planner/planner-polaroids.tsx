'use client';

import Image from 'next/image';
import { usePolaroidReveal } from '@/lib/hooks/use-polaroid-reveal';
import { cn } from '@/lib/utils';

/** One photo for the polaroid stack, resolved on the server. */
export interface PolaroidPhoto {
  src: string;
  /** `object-position` from the image's curated focal point. */
  position?: string;
  /** The caption written on the frame — a park or ride name. */
  label: string;
  /** The photo's authored alt text in the page's language, from the media database, or `""`. */
  alt: string;
}

interface PlannerPolaroidsProps {
  photos: readonly PolaroidPhoto[];
}

/**
 * A handful of park photos, laid out as polaroids: the one place in this app where a photo is
 * decoration rather than data.
 *
 * Photos and alt text are resolved on the server and passed in, because `@/lib/media` and
 * `@/lib/media/text` are too large for a Client Component (see `docs/features/media-database.md`).
 * The alt text is authored, never derived from a file name; a photo without one keeps `alt=""`. The
 * frame is white in both themes: it is the paper of a physical print.
 */
export function PlannerPolaroids({ photos }: PlannerPolaroidsProps) {
  const rootRef = usePolaroidReveal();

  if (photos.length === 0) return null;

  return (
    <div
      ref={rootRef}
      // A fixed height, so the reveal moves ink and never geometry (see `use-polaroid-reveal`).
      // `select-none`, since a drag-select over decoration looks like a bug.
      className="pointer-events-none relative mx-auto h-[210px] w-full max-w-md select-none sm:h-[260px] sm:max-w-2xl"
    >
      {photos.slice(0, SLOTS.length).map((photo, index) => (
        /* Two elements: the wrapper carries the resting angle as CSS, and GSAP tweens only the
           `figure` inside. On one element the tween's absolute transform wipes the CSS rotation,
           for reduced-motion visitors too. */
        <div
          key={photo.src}
          className={cn('absolute top-0', SLOTS[index].box)}
          style={{
            transform: `rotate(${SLOTS[index].rotate}deg)`,
            zIndex: index + 1,
          }}
        >
          <figure
            data-polaroid=""
            className="rounded-sm bg-white p-2 pb-7 shadow-xl ring-1 ring-black/10"
          >
            <span className="relative block aspect-square overflow-hidden bg-neutral-200">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                // A phone card is ~160 px wide, a desktop one ~175 px; doubled for a 2× display.
                sizes="(max-width: 640px) 33vw, 180px"
                quality={60}
                style={{ objectFit: 'cover', objectPosition: photo.position }}
              />
            </span>
            {/* Left-aligned: each card covers the right 40 % of the one before, so only the left
                part of a caption is always visible. */}
            <figcaption className="absolute inset-x-2 bottom-1.5 truncate text-left text-[10px] font-medium text-neutral-700">
              {photo.label}
            </figcaption>
          </figure>
        </div>
      ))}
    </div>
  );
}

/**
 * Where each polaroid sits, per breakpoint, hand-placed so the stack reads as one somebody put down
 * rather than a fan. Full class strings, so Tailwind's scanner sees them. Three on a phone and six
 * above; the extra three are `hidden`, not unrendered, so the reveal animates the same DOM.
 */
const SLOTS: readonly { box: string; rotate: number }[] = [
  { box: 'left-[2%] w-[36%] sm:left-[0%] sm:w-[26%]', rotate: -7 },
  { box: 'left-[32%] w-[36%] sm:left-[15%] sm:w-[26%]', rotate: 4 },
  { box: 'left-[62%] w-[36%] sm:left-[30%] sm:w-[26%]', rotate: -3 },
  { box: 'hidden sm:block sm:left-[45%] sm:w-[26%]', rotate: 7 },
  { box: 'hidden sm:block sm:left-[59%] sm:w-[26%]', rotate: -5 },
  { box: 'hidden sm:block sm:left-[74%] sm:w-[26%]', rotate: 9 },
];
