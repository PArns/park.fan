'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Park & ride cards render in a 1- / 2- / 3-column responsive grid.
const SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

interface CardPhotoProps {
  src: string;
  alt: string;
  /** Desaturate while the park/ride is not operating (mirrors `pk-photo-closed`). */
  closed?: boolean;
  /** Hide the photo below `sm` and show only the gradient placeholder — park cards collapse
   *  on phones, so the (decorative) photo download is skipped there. */
  hideOnMobile?: boolean;
  /** Responsive `sizes` for the underlying next/image. Defaults to the 1/2/3-col grid. */
  sizes?: string;
  /**
   * Where the photo is anchored when `object-fit: cover` has to throw pixels away.
   *
   * `top` and `center` are the historical defaults — park/ride photos frame from the
   * top, portrait editorial covers from the centre. Anything else is passed through
   * as a raw CSS `object-position`, which is how a per-image focal point from the
   * media database reaches every card: one value, applied identically to the main
   * photo and its reflection, so the subject survives the crop instead of being
   * sliced off. See `lib/media/focus.ts`.
   */
  objectPosition?: 'top' | 'center' | (string & {});
  /** Mark the main image as LCP priority (e.g. the blog feature card). */
  priority?: boolean;
}

/**
 * Background photo (main image + masked reflection) for ParkCard / AttractionCard.
 *
 * A tiny Client Component purely so the photo can **fade in over a stable gradient
 * placeholder** once it loads — the cards themselves stay dual-use Server Components.
 * Nearby/Favorites cards are client-rendered, so their lazy photos used to pop in and look
 * like they "realigned" a few seconds after load on uncached views (cached = no jump). The
 * placeholder keeps the area stable and the fade smooths the swap; cached images are caught
 * via the ref so they show instantly with no fade-from-transparent flash.
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
  // Resolved to a CSS value so the keyword and focal-point cases take the same path
  // — two mechanisms for "where is this cropped from" is how they drift apart.
  const position =
    objectPosition === 'top' ? '50% 0%' : objectPosition === 'center' ? '50% 50%' : objectPosition;

  // A cached image can finish before React attaches `onLoad`; the ref catches that case.
  const captureImg = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setLoaded(true);
  }, []);

  return (
    <>
      {/* Stable gradient placeholder — visible while the photo loads (and on mobile when the
          photo is hidden). Matches the no-image card fallback. */}
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
            {/* Main photo — top edge at the glass-header seam, fills downward. */}
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
