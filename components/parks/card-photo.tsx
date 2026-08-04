'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Park & ride cards render in a 1- / 2- / 3-column responsive grid.
const SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

/**
 * Resolves the two historical keywords to a CSS value so the keyword and
 * focal-point cases take the same path — two mechanisms for "where is this
 * cropped from" is how they drift apart.
 */
function toObjectPosition(value: 'top' | 'center' | (string & {})): string {
  return value === 'top' ? '50% 0%' : value === 'center' ? '50% 50%' : value;
}

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
   * media database reaches every card. See `lib/media/focus.ts`.
   */
  objectPosition?: 'top' | 'center' | (string & {});
  /** Mark the main image as LCP priority (e.g. the blog feature card). */
  priority?: boolean;
}

/**
 * The card photo, in two layers — and the split is the whole point.
 *
 * A card is a photo with two sheets of frosted glass laid over it: a header panel
 * at the top and a wait-time panel at the bottom. Only the strip between them is
 * actually _seen_; everything else is 16–18px of backdrop blur under a translucent
 * panel. Painting one image across the whole card therefore frames it against the
 * wrong box — and that is what made the focal point inert on the Y axis:
 *
 *   card box    405 × 404  → aspect 1.00
 *   4:3 photo             → aspect 1.33
 *
 * `object-fit: cover` scales to the larger ratio, so a landscape photo in a
 * near-square box fills the box's **height** exactly and overflows only sideways.
 * With zero vertical overflow there is nothing for `object-position`'s Y component
 * to move, and dragging the focal point up and down rendered byte-identical pixels.
 * (Portrait photos, being the other way round, always did respond — which is why it
 * looked intermittent.)
 *
 * So the framing reference is the visible strip, not the card:
 *
 * - {@link CardPhotoFrame} sits inside the card's photo-spacer row, i.e. exactly
 *   the strip between the panels (405 × 240 → aspect 1.69). A 4:3 photo now
 *   overflows it by ~26% vertically, and the focal point moves the subject through
 *   that range. This is the layer a person sees and the one they tune.
 * - {@link CardPhoto} keeps covering the whole card underneath, so the panels still
 *   have photo to blur and no gradient band shows through the glass. Its crop is
 *   never the reference; it is only ever seen through 16–18px of blur.
 *
 * Both are the same URL, so it is one request and one decode — the second layer
 * costs a composite, not a download. Their seam falls 16px inside each glass panel,
 * where the panel's own backdrop blur smears it away.
 *
 * Both are Client Components purely so the photo can **fade in over a stable
 * gradient placeholder** once it loads — the cards themselves stay dual-use Server
 * Components. Nearby/Favorites cards are client-rendered, so their lazy photos used
 * to pop in and look like they "realigned" seconds after load on uncached views. The
 * placeholder keeps the area stable and the fade smooths the swap; cached images are
 * caught via the ref so they show instantly with no fade-from-transparent flash.
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
 * Goes **inside the card's photo-spacer row**, which already is that strip — that is
 * how it gets the right box without any component needing to know how tall the two
 * panels came out. Sits above {@link CardPhoto} and below the scrim, so the spacer
 * has to stay at `z-0` for the scrim (`z-1`) to keep darkening it.
 *
 * Decorative: the bleed layer already carries the alt text for the same picture, and
 * announcing it twice would be a duplicate to a screen reader.
 */
export function CardPhotoFrame({
  src,
  closed,
  hideOnMobile,
  sizes = SIZES,
  objectPosition = 'top',
}: Omit<CardPhotoProps, 'alt' | 'priority'>) {
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
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
