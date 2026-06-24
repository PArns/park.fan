'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import { HERO_IMAGES } from '@/lib/hero-images';
import { backgroundImageLoader } from '@/lib/utils/image-loader';
import { useHeroRotation } from '@/components/layout/hero-rotation-context';
import { cn } from '@/lib/utils';

// The three.js amusement-park diorama is heavy (the whole three.js runtime), so
// it's code-split and loaded client-only AFTER first paint. Until it's ready —
// and as a permanent fallback when WebGL is unavailable — the gradient sky below
// stands in. ssr:false keeps three.js out of the SSR payload and the hero's LCP.
const HeroThreePark = nextDynamic(
  () => import('@/components/layout/hero-three-park').then((m) => m.HeroThreePark),
  { ssr: false, loading: () => null }
);

const KEN_BURNS = 'ken-burns 22s ease-in-out infinite alternate';

// All hero source images are ≤1024px wide, so the old 80vw made high-DPR phones request the
// w=1080 srcset candidate — an *upscale* of a 1024px source: more bytes, zero extra detail. 60vw
// pulls the w=828 candidate instead (w=640 on DPR2) — the largest non-upscaled rendition — which
// cuts the mobile LCP image ~28% at the same quality. It's a decorative full-bleed background
// under two gradient overlays + opacity-90 + ken-burns, so the slightly smaller rendition is
// imperceptible. Desktop keeps 115vw. Quality is set per-width in backgroundImageLoader.
const HERO_IMAGE_SIZES = '(max-width: 768px) 60vw, 115vw';

interface RandomHeroImageProps {
  imageSrc?: string;
  noAnimation?: boolean;
}

/**
 * When the user is detected inside a park, rotate through that park's own hero images (crossfade).
 * Driven by {@link useHeroRotation} so it stays in sync with the image attribution. Runs after the
 * nearby lookup resolves — i.e. after LCP — so it never affects the server hero image's load.
 */
function InParkHeroImages({ noAnimation }: { noAnimation?: boolean }) {
  const { parkImages, activeIndex } = useHeroRotation();

  if (parkImages.length === 0) return null;

  // Render every park image as a stacked layer and crossfade by toggling opacity — the handful of
  // images preload so each transition is instant. Every layer animates continuously and in phase
  // (the 0% keyframe is the identity transform), so crossfades never "jump" the ken-burns effect.
  return (
    <>
      {parkImages.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt="Park Background"
          fill
          loader={backgroundImageLoader}
          className={cn(
            'object-cover transition-opacity duration-1000 ease-in-out',
            i === activeIndex ? 'opacity-90' : 'opacity-0'
          )}
          style={noAnimation ? undefined : { animation: KEN_BURNS }}
          sizes={HERO_IMAGE_SIZES}
        />
      ))}
    </>
  );
}

export function RandomHeroImage({ imageSrc, noAnimation }: RandomHeroImageProps) {
  const [randomImage, setRandomImage] = useState<string | null>(null);
  // Defer the ken-burns transform until the image has painted. Animating (transforming)
  // the LCP element during its initial render is a known LCP-delay anti-pattern, so we
  // render it static first and start the effect on load.
  const [animate, setAnimate] = useState(false);

  // Is the user inside a park with its own hero images? If so, those take over (rendered below).
  const { parkImages } = useHeroRotation();
  const hasParkImages = parkImages.length > 0;

  useEffect(() => {
    if (imageSrc) return;
    const timer = setTimeout(() => {
      setRandomImage(HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)]);
    }, 0);
    return () => clearTimeout(timer);
  }, [imageSrc]);

  const finalImage = imageSrc || randomImage;
  const isServerImage = !!imageSrc;

  if (!finalImage) return null;

  const animating = !noAnimation && animate;

  return (
    <>
      {/* Base image: the server-rendered LCP hero (or a client-random fallback). Fades out once the
          in-park park images take over, so it doesn't show through their crossfade. It keeps
          animating while fading so the ken-burns transform never snaps back. */}
      <Image
        src={finalImage}
        alt="Park Background"
        fill
        loader={backgroundImageLoader}
        priority={isServerImage}
        fetchPriority={isServerImage ? 'high' : undefined}
        onLoad={noAnimation ? undefined : () => setAnimate(true)}
        className={cn(
          'object-cover transition-opacity duration-1000',
          hasParkImages ? 'opacity-0' : 'opacity-90',
          animating ? 'will-change-transform' : ''
        )}
        style={animating ? { animation: KEN_BURNS } : undefined}
        sizes={HERO_IMAGE_SIZES}
      />
      <InParkHeroImages noAnimation={noAnimation} />
    </>
  );
}

/**
 * The homepage hero background: an animated three.js amusement park (castle,
 * Ferris wheel, carousel, roller coaster…). A CSS gradient sky paints instantly
 * underneath — it's the pre-load placeholder and the no-WebGL fallback, and its
 * colors match the 3D sky so the canvas fades in seamlessly. When the visitor is
 * inside a real park, that park's photos still crossfade in on top.
 */
export function HeroBackground() {
  return (
    <div className="bg-background absolute inset-0 -z-10 overflow-hidden">
      {/* Instant gradient sky (matches the three.js sky stops in park-scene.ts). */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#5fb4f0_0%,#9fd2f7_55%,#cde6ff_100%)] dark:bg-[linear-gradient(to_bottom,#0b1437_0%,#241a45_55%,#3a2a63_100%)]" />
      {/* three.js amusement-park diorama (client-only, fades in when ready) */}
      <HeroThreePark />
      {/* Real park photos take over when the visitor is detected inside a park */}
      <InParkHeroImages />
      {/* Branded overlays for text legibility. Lighter at the top so the colorful
          scene shows through; stronger toward the bottom-right behind content. */}
      <div className="from-background/45 via-background/5 to-muted/40 dark:from-background/85 dark:via-background/20 dark:to-muted/70 absolute inset-0 bg-gradient-to-br" />
      <div className="from-park-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent" />
    </div>
  );
}
