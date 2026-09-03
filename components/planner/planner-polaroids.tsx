'use client';

import Image from 'next/image';
import { usePolaroidReveal } from '@/lib/hooks/use-polaroid-reveal';
import { cn } from '@/lib/utils';

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
 * A handful of park photos, laid out as polaroids.
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
      className="pointer-events-none relative mx-auto h-[210px] w-full max-w-md select-none sm:h-[260px] sm:max-w-2xl"
      aria-hidden="true"
    >
      {photos.slice(0, SLOTS.length).map((photo, index) => (
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
                alt=""
                fill
                // A phone card is 36 % of a 448 px column, a desktop one 26 %
                // of a 672 px band — ~160 and ~175 px, doubled for a 2× display.
                sizes="(max-width: 640px) 33vw, 180px"
                quality={60}
                style={{ objectFit: 'cover', objectPosition: photo.position }}
              />
            </span>
            {/* LEFT, not centred, and that is about the overlap rather than
                about taste: each card covers the right 40 % of the one before
                it, so a centred caption came out as "Phanta…", "Toverl…",
                "Walibi H…" — every park in the stack unnamed except the last.
                The left third is the part of a card that is never covered, and
                a caption written into the corner reads as handwriting anyway. */}
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
 * Where each polaroid sits, per breakpoint.
 *
 * Hand-placed rather than evenly spread: cards at equal angles read as a fan,
 * and a fan reads as a widget. These overlap the way a stack somebody put down
 * does.
 *
 * FULL class strings and not an interpolated `left-[${n}%]`, because Tailwind's
 * scanner has to see them — the same rule the crowd palette states. It is also
 * why the breakpoint lives in classes at all: the positions differ between a
 * phone and a desktop and an inline style has no `sm:`.
 *
 * Three on a phone and six above it. Not a taste call: a 358 px column cannot
 * hold six overlapping cards and still leave a caption readable, and the extra
 * three are `hidden` rather than unrendered so the reveal always animates the
 * same DOM.
 */
const SLOTS: readonly { box: string; rotate: number }[] = [
  { box: 'left-[2%] w-[36%] sm:left-[0%] sm:w-[26%]', rotate: -7 },
  { box: 'left-[32%] w-[36%] sm:left-[15%] sm:w-[26%]', rotate: 4 },
  { box: 'left-[62%] w-[36%] sm:left-[30%] sm:w-[26%]', rotate: -3 },
  { box: 'hidden sm:block sm:left-[45%] sm:w-[26%]', rotate: 7 },
  { box: 'hidden sm:block sm:left-[59%] sm:w-[26%]', rotate: -5 },
  { box: 'hidden sm:block sm:left-[74%] sm:w-[26%]', rotate: 9 },
];
