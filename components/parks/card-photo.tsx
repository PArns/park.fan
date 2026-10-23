'use client';

import { useCallback, useState, type Ref } from 'react';
import Image from 'next/image';
import { PhotoCredit } from '@/components/media/photo-credit';
import { cn } from '@/lib/utils';

// Park & ride cards render in a 1- / 2- / 3-column responsive grid.
const SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

/**
 * Resolves the two keywords to a CSS value, so the keyword and focal-point cases take one path
 * and cannot drift apart.
 */
function toObjectPosition(value: 'top' | 'center' | (string & {})): string {
  return value === 'top' ? '50% 0%' : value === 'center' ? '50% 50%' : value;
}

interface CardPhotoFrameProps {
  src: string;
  alt: string;
  /** Desaturate while the park/ride is not operating (mirrors `pk-photo-closed`). */
  closed?: boolean;
  /** Hide the photo below `sm` and show only the card's gradient — below `sm` park and blog
   *  cards render a row instead, and ride cards collapse onto their panels, so the (decorative)
   *  photo download is skipped there. */
  hideOnMobile?: boolean;
  /** Responsive `sizes` for the underlying next/image. Defaults to the 1/2/3-col grid. */
  sizes?: string;
  /**
   * Where the photo is anchored when `object-fit: cover` has to throw pixels away.
   *
   * `top` and `center` are keywords: park/ride photos frame from the top, portrait
   * editorial covers from the centre. Anything else is passed through
   * as a raw CSS `object-position`, which is how a per-image focal point from the
   * media database reaches every card. See `lib/media/focus.ts`.
   */
  objectPosition?: 'top' | 'center' | (string & {});
  /** Mark the photo as LCP priority (e.g. the blog feature card). */
  priority?: boolean;
}

function CroppedPhoto({
  src,
  alt,
  position,
  sizes,
  closed,
  priority,
  imgRef,
  onLoad,
}: {
  src: string;
  alt: string;
  position: string;
  sizes: string;
  closed?: boolean;
  priority?: boolean;
  imgRef?: Ref<HTMLImageElement>;
  onLoad?: () => void;
}) {
  return (
    <div
      className={cn(
        'pk-photo-zoom relative h-full w-full overflow-hidden',
        closed && 'pk-photo-closed'
      )}
    >
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        className="object-cover"
        style={{ objectPosition: position }}
        sizes={sizes}
        priority={priority}
        onLoad={onLoad}
      />
    </div>
  );
}

/**
 * The card photo, cropped to the strip between the card's two glass panels and mirrored above and
 * below it, so each panel blurs a continuation of exactly what is seen and the seam has nothing to
 * show.
 *
 * Goes inside the card's photo-spacer row, which already is that strip, so nothing needs to know
 * how tall the panels came out; the card clips whatever of a mirror the panels do not cover. A
 * mirror is the same box with the same `object-position`, flipped, so its edge row is the strip's
 * edge row, and the hover zoom keeps that true because each copy scales about its own centre. The
 * framing reference is the strip and never the whole card: see
 * docs/rules/card-photos-are-two-layers.md. The spacer stays at `z-0` so the scrim keeps darkening
 * it. `priority` belongs here when a card is the page's LCP. It also draws the photo's credit when
 * the photo is not ours, so every card that frames a photo carries it.
 */
export function CardPhotoFrame({
  src,
  alt,
  closed,
  hideOnMobile,
  sizes = SIZES,
  objectPosition = 'top',
  priority = false,
}: CardPhotoFrameProps) {
  const [loaded, setLoaded] = useState(false);
  const position = toObjectPosition(objectPosition);

  // A cached image can finish before React attaches `onLoad`; the ref catches that case.
  const captureImg = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setLoaded(true);
  }, []);

  const layer = cn(
    'pointer-events-none absolute inset-x-0 h-full overflow-hidden transition-opacity duration-500',
    loaded ? 'opacity-100' : 'opacity-0',
    hideOnMobile && 'hidden sm:block'
  );

  return (
    <>
      {(['bottom-full', 'top-full'] as const).map((side) => (
        <div key={side} aria-hidden="true" className={cn(layer, side, '-scale-y-100')}>
          <CroppedPhoto src={src} alt="" position={position} sizes={sizes} closed={closed} />
        </div>
      ))}
      <div
        // Stable hook for the render check that asserts this layer's box stays wide
        // — the moment a panelled card's box goes square, the focal point's Y axis
        // is silently dead again. See `scripts/check-card-framing.mjs`.
        data-card-photo="frame"
        className={cn(layer, 'top-0')}
      >
        <CroppedPhoto
          src={src}
          alt={alt}
          position={position}
          sizes={sizes}
          closed={closed}
          priority={priority}
          imgRef={captureImg}
          onLoad={() => setLoaded(true)}
        />
      </div>
      <PhotoCredit src={src} className={cn(hideOnMobile && 'hidden sm:block')} />
    </>
  );
}
