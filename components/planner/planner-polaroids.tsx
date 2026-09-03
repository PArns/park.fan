'use client';

import Image from 'next/image';
import { usePolaroidReveal } from '@/lib/hooks/use-polaroid-reveal';

export interface PolaroidPhoto {
  src: string;
  /** `object-position` from the image's curated focal point. */
  position?: string;
  /** The caption written on the frame — a park or ride name. */
  label: string;
}

interface PlannerPolaroidsProps {
  photos: readonly PolaroidPhoto[];
}

/**
 * Three park photos, laid out as polaroids.
 *
 * The page had no picture on it at all, which for a page about days out is a
 * strange thing to be. Polaroids rather than a grid of cards because the page's
 * subject is a day somebody is about to have — a stack of snapshots is the
 * shape that says that, and it is the one place in this app where the photo is
 * allowed to be decoration rather than data. Everywhere else the picture sits
 * under a figure and has to keep out of its way.
 *
 * The photos are resolved on the SERVER and passed in. `@/lib/media` is the
 * 107 KB catalogue and this is a Client Component — importing it here would ship
 * the catalogue to every visitor of the page, which is the trap
 * `docs/features/media-database.md` names.
 *
 * The frame is white in both themes on purpose. A polaroid is a physical object
 * and its border is the paper; a `bg-card` version reads as a card with a
 * caption, which is what the rest of the site already has plenty of.
 */
export function PlannerPolaroids({ photos }: PlannerPolaroidsProps) {
  const rootRef = usePolaroidReveal();

  if (photos.length === 0) return null;

  return (
    <div
      ref={rootRef}
      // The height is fixed so the reveal moves ink and never geometry — see
      // `use-polaroid-reveal`. `select-none` because these are decoration and a
      // drag-select over them looks like a bug.
      className="pointer-events-none relative mx-auto h-[210px] w-full max-w-md select-none sm:h-[250px]"
      aria-hidden="true"
    >
      {photos.slice(0, 3).map((photo, index) => (
        /* TWO elements, and that is the whole reason this works. The wrapper
           carries the resting angle as CSS and GSAP never touches it; the
           `figure` inside is what gets tweened. One element could not do both:
           `fromTo(..., { rotation: 0 })` writes an absolute transform on the
           element and wipes whatever CSS rotation was there, so the first
           version animated three cards into a flat row — every angle gone the
           moment the tween landed, and gone for reduced-motion visitors too
           because the CSS was being overwritten rather than respected. */
        <div
          key={photo.src}
          className="absolute top-0"
          style={{
            // Hand-placed rather than evenly spread: three cards at equal
            // angles read as a fan, and a fan reads as a widget. These overlap
            // the way a stack somebody put down does.
            left: `${[2, 32, 62][index]}%`,
            width: '36%',
            transform: `rotate(${[-6, 3, 8][index]}deg)`,
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
                alt=""
                fill
                // Three cards at 36 % of a 448 px column is ~160 px, doubled for
                // a 2× display.
                sizes="(max-width: 640px) 33vw, 170px"
                quality={70}
                style={{ objectFit: 'cover', objectPosition: photo.position }}
              />
            </span>
            <figcaption className="absolute inset-x-2 bottom-1.5 truncate text-center text-[10px] font-medium text-neutral-700">
              {photo.label}
            </figcaption>
          </figure>
        </div>
      ))}
    </div>
  );
}
