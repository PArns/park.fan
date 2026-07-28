'use client';

import Image from 'next/image';
import { backgroundImageLoader } from '@/lib/utils/image-loader';
import { BACKGROUND_BLUR_DATA_URL } from '@/lib/utils/image-placeholder';

// Park/attraction hero sources are ≤1024px (the on-disk background.jpg / attraction images), so a
// plain `100vw` made high-DPR phones request the upscaled w=1080 srcset candidate — more bytes,
// zero extra detail. Under-declaring the mobile width to 60vw pulls the w=828 candidate instead
// (the largest non-upscaled rendition); under the gradient / bg-background overlays the slight
// upscale-on-display is imperceptible. Desktop keeps 100vw — the loader clamps the oversized
// srcset candidates it resolves to. Quality is set in the loader.
const PARK_BG_SIZES = '(max-width: 768px) 60vw, 100vw';

interface ParkBackgroundProps {
  imageSrc: string | null;
  alt: string;
  /** Fix the background so it stays in place while content scrolls over it. */
  fixed?: boolean;
}

export function ParkBackground({ imageSrc, alt, fixed = false }: ParkBackgroundProps) {
  if (!imageSrc) return null;

  if (fixed) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 select-none">
        <Image
          src={imageSrc}
          alt={alt}
          fill
          loader={backgroundImageLoader}
          priority
          placeholder="blur"
          blurDataURL={BACKGROUND_BLUR_DATA_URL}
          className="object-cover object-center"
          sizes={PARK_BG_SIZES}
          fetchPriority="high"
        />
        <div className="bg-background/70 absolute inset-0" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed top-0 right-0 left-0 -z-10 h-[calc(75vh+4rem)] max-h-[850px] overflow-hidden select-none">
      <div className="relative h-full w-full">
        <Image
          src={imageSrc}
          alt={alt}
          fill
          loader={backgroundImageLoader}
          priority
          placeholder="blur"
          blurDataURL={BACKGROUND_BLUR_DATA_URL}
          // Anchor the image to its top edge instead of centering it: the strip is shorter than the
          // scaled image, so `object-cover` has to crop somewhere. Centered cropping ate into the top
          // of the picture (sky / the ride itself); anchoring to the top keeps that visible and lets
          // the excess fall off the bottom — which the gradient below already fades into the page.
          className="object-cover object-top"
          sizes={PARK_BG_SIZES}
          fetchPriority="high"
        />
        {/* Gradient overlay to fade into the background color. Kept fully transparent for the top
            ~80% of the strip so as much of the image shows as possible, then ramped to the solid
            background only over the bottom portion — the fade lives low instead of starting mid-image. */}
        <div className="via-background/70 to-background absolute inset-0 bg-gradient-to-b from-transparent from-80% via-90%" />
        <div className="to-background absolute inset-0 bg-gradient-to-b from-transparent from-90%" />
      </div>
    </div>
  );
}
