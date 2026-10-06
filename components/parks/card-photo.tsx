'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
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

interface CardPhotoProps {
  src: string;
  alt: string;
  /** Desaturate while the park/ride is not operating (mirrors `pk-photo-closed`). */
  closed?: boolean;
  /** Hide the photo below `sm` and show only the gradient placeholder — below `sm` park and
   *  blog cards render a row instead, and ride cards collapse onto their panels, so the
   *  (decorative) photo download is skipped there. */
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
  /** Mark the main image as LCP priority (e.g. the blog feature card). */
  priority?: boolean;
}

/**
 * The card photo, in two layers, and the split is the whole point.
 *
 * Only the strip between a card's two glass panels is actually seen, and an image framed against
 * the whole near-square card has no vertical overflow for `object-position` to move.
 * {@link CardPhotoFrame} sits in that strip and is the layer a person sees and tunes; this one
 * covers the whole card underneath, so the panels have photo to blur. Same URL, so one request.
 * Client Components only so the photo fades in over a stable gradient placeholder; a cached image
 * is caught via the ref and shows without a fade. See docs/rules/card-photos-are-two-layers.md.
 */
export function CardPhoto({
  src,
  alt,
  closed,
  hideOnMobile,
  sizes = SIZES,
  objectPosition = 'top',
  priority = false,
}: CardPhotoProps) {
  const [loaded, setLoaded] = useState(false);
  const position = toObjectPosition(objectPosition);

  // A cached image can finish before React attaches `onLoad`; the ref catches that case.
  const captureImg = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setLoaded(true);
  }, []);

  return (
    <>
      {/* Visible while the photo loads and wherever it is hidden, like the no-image fallback. */}
      <div className="from-muted to-card absolute inset-0 bg-gradient-to-br" />

      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500',
          loaded ? 'opacity-100' : 'opacity-0',
          hideOnMobile && 'hidden sm:block'
        )}
      >
        <div
          className={cn(
            'pk-photo-zoom relative h-full w-full overflow-hidden',
            closed && 'pk-photo-closed'
          )}
        >
          <div className="absolute inset-x-0 bottom-0" style={{ top: '50px' }}>
            {/* Bleed photo — top edge at the glass-header seam, fills downward. Lives
                behind the panels and behind CardPhotoFrame; only ever seen blurred. */}
            <Image
              ref={captureImg}
              src={src}
              alt={alt}
              fill
              className="object-cover"
              style={{ objectPosition: position }}
              sizes={sizes}
              priority={priority}
              onLoad={() => setLoaded(true)}
            />
            {/* Reflection — same image flipped around the container top (= seam), masked to
                fade out quickly. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                transform: 'scaleY(-1)',
                transformOrigin: 'center top',
                maskImage: 'linear-gradient(to bottom, black 0%, transparent 16%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 16%)',
              }}
            >
              <Image
                src={src}
                alt=""
                aria-hidden="true"
                fill
                className="object-cover"
                style={{ objectPosition: position }}
                sizes={sizes}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * The photo as it is actually seen: cropped to the strip between the glass panels.
 *
 * Goes inside the card's photo-spacer row, which already is that strip, so nothing needs to know
 * how tall the panels came out. The spacer stays at `z-0` so the scrim keeps darkening it.
 * Decorative, because the bleed layer carries the alt text. `priority` belongs here when a card is
 * the page's LCP: this is the layer whose paint the reader waits for.
 */
export function CardPhotoFrame({
  src,
  closed,
  hideOnMobile,
  sizes = SIZES,
  objectPosition = 'top',
  priority = false,
}: Omit<CardPhotoProps, 'alt'>) {
  const [loaded, setLoaded] = useState(false);
  const position = toObjectPosition(objectPosition);

  const captureImg = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setLoaded(true);
  }, []);

  return (
    <div
      aria-hidden="true"
      // Stable hook for the render check that asserts this layer's box stays wide
      // — the moment a panelled card's box goes square, the focal point's Y axis
      // is silently dead again. See `scripts/check-card-framing.mjs`.
      data-card-photo="frame"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-500',
        loaded ? 'opacity-100' : 'opacity-0',
        hideOnMobile && 'hidden sm:block'
      )}
    >
      <div
        className={cn(
          'pk-photo-zoom relative h-full w-full overflow-hidden',
          closed && 'pk-photo-closed'
        )}
      >
        <Image
          ref={captureImg}
          src={src}
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: position }}
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
