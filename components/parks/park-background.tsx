'use client';

import Image from 'next/image';
import { backgroundImageLoader } from '@/lib/utils/image-loader';
import { BACKGROUND_BLUR_DATA_URL } from '@/lib/utils/image-placeholder';
import { cn } from '@/lib/utils';

// Hero sources are at most 1024px wide, so `100vw` made high-DPR phones fetch the upscaled w=1080
// candidate. 60vw picks w=828, the largest non-upscaled rendition; under the overlays the slight
// upscale on display does not show.
const PARK_BG_SIZES = '(max-width: 768px) 60vw, 100vw';

interface ParkBackgroundProps {
  imageSrc: string | null;
  alt: string;
  /** Fix the background so it stays in place while content scrolls over it. */
  fixed?: boolean;
  /**
   * CSS `object-position` for the crop, from the image's focal point. The server caller resolves
   * it: looking it up in this client file would ship the whole media manifest to the browser.
   */
  objectPosition?: string;
  /**
   * Render inside the nearest positioned ancestor instead of the viewport. Both normal modes are
   * `fixed` + `-z-10` and escape every container, so the admin's focal-point preview needs this.
   */
  contained?: boolean;
}

/**
 * Park or ride photo behind the page: a full-screen backdrop when `fixed`, otherwise a strip under
 * the header that fades into the page. `contained` keeps it inside its parent (admin preview).
 */
export function ParkBackground({
  imageSrc,
  alt,
  fixed = false,
  objectPosition,
  contained = false,
}: ParkBackgroundProps) {
  if (!imageSrc) return null;

  // The two layouts crop differently, so they keep different defaults: the fixed
  // full-screen backdrop centres, the scrolling strip anchors to the top. A focal
  // point overrides whichever applies.
  const position = objectPosition ?? (fixed ? '50% 50%' : '50% 0%');
  const shell = contained ? 'absolute inset-0' : 'fixed inset-0 -z-10';

  if (fixed) {
    return (
      <div className={cn('pointer-events-none select-none', shell)}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          loader={backgroundImageLoader}
          priority
          placeholder="blur"
          blurDataURL={BACKGROUND_BLUR_DATA_URL}
          className="object-cover"
          style={{ objectPosition: position }}
          sizes={PARK_BG_SIZES}
          fetchPriority="high"
        />
        <div className="bg-background/70 absolute inset-0" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'pointer-events-none overflow-hidden select-none',
        contained
          ? 'absolute inset-0'
          : // `position: fixed` resolves against the viewport, so the page wrapper's
            // padding inset cannot reach this layer: it follows `--planner-inset` itself, or the
            // photo shows through the glass planner panel. No transition: animating the width
            // re-rasterizes the blurred photo. `planner-wide:` rather than `sm:` because the panel
            // is a bottom sheet on a landscape phone, the same pair as in `app/globals.css`.
            'planner-wide:right-[var(--planner-inset,0px)] fixed top-0 right-0 left-0 -z-10 h-[calc(75vh+4rem)] max-h-[850px]'
      )}
    >
      <div className="relative h-full w-full">
        <Image
          src={imageSrc}
          alt={alt}
          fill
          loader={backgroundImageLoader}
          priority
          placeholder="blur"
          blurDataURL={BACKGROUND_BLUR_DATA_URL}
          // Top-anchored by default: the strip is shorter than the scaled image, and a centred crop
          // cut off the top of the picture. A focal point overrides it, see lib/media/focus.ts.
          className="object-cover"
          style={{ objectPosition: position }}
          sizes={PARK_BG_SIZES}
          fetchPriority="high"
        />
        {/* Transparent for the top 80% so the photo shows; the fade sits low, not mid-image. */}
        <div className="via-background/70 to-background absolute inset-0 bg-gradient-to-b from-transparent from-80% via-90%" />
        <div className="to-background absolute inset-0 bg-gradient-to-b from-transparent from-90%" />
      </div>
    </div>
  );
}
