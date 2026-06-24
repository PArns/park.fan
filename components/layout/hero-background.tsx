'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { HERO_IMAGES } from '@/lib/hero-images';
import { backgroundImageLoader } from '@/lib/utils/image-loader';
import { useHeroRotation } from '@/components/layout/hero-rotation-context';
import { cn } from '@/lib/utils';

// The three.js amusement-park scene pulls in the whole three.js runtime, so it's
// code-split and loaded client-only AFTER first paint. Until it's ready — and as
// a permanent fallback when WebGL is unavailable — the CSS gradient sky below
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
 * The homepage hero background: an animated three.js RollerCoaster-Tycoon-style
 * park (entrance arch, coaster, Ferris wheel, carousel, stalls, peeps…) that the
 * camera flies through. A CSS gradient sky paints instantly underneath — the
 * pre-load placeholder and the no-WebGL fallback — with a bright daytime variant
 * and a night variant for dark mode, matching the scene's own day/night look so
 * the canvas fades in seamlessly. When the visitor is inside a real park, that
 * park's photos still crossfade in on top.
 */
export function HeroBackground() {
  // `sceneReady` flips when the 3D park signals it's loaded. The loader lives
  // HERE (always mounted) rather than inside HeroThreePark, so it's visible
  // during the three.js chunk download too — not only after it has mounted.
  const [sceneReady, setSceneReady] = useState(false);
  const onReady = useCallback(() => setSceneReady(true), []);
  // Safety: hide the loader even if the chunk/WebGL never signals ready.
  useEffect(() => {
    const t = setTimeout(() => setSceneReady(true), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-background absolute inset-0 -z-10 overflow-hidden">
      {/* Instant gradient sky — bright by day, deep blue at night (dark mode),
          matching the 3D sky so the canvas fades in seamlessly. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#3b8fe3_0%,#7fc2f3_55%,#cdeeff_100%)] dark:bg-[linear-gradient(to_bottom,#070b1e_0%,#142150_55%,#33508c_100%)]" />
      {/* three.js park scene (client-only, fades in when ready) */}
      <HeroThreePark onReady={onReady} />
      {/* Real park photos take over when the visitor is detected inside a park */}
      <InParkHeroImages />
      {/* Only a very light tint for depth/legibility — kept subtle and
          theme-independent so the bright, colorful scene always shows through. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15" />
      {/* Loader chip near the bottom (clear of the centred content card), fading
          out once the 3D park is ready. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-6 flex justify-center transition-opacity duration-500',
          sceneReady ? 'opacity-0' : 'opacity-100'
        )}
      >
        <span className="bg-background/55 text-foreground/80 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading 3D park…
        </span>
      </div>
    </div>
  );
}
