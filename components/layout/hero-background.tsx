'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { HERO_IMAGES } from '@/lib/hero-images';
import { backgroundImageLoader } from '@/lib/utils/image-loader';
import { useHeroRotation } from '@/components/layout/hero-rotation-context';
import { HERO_3D_ENABLED } from '@/lib/config/features';
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

interface HeroBackgroundProps {
  imageSrc?: string;
}

/**
 * The homepage hero background, behind the {@link HERO_3D_ENABLED} feature flag
 * (default OFF): when off it's the classic rotating park photo; when on it's the
 * animated three.js park the camera flies through. Either way, when the visitor
 * is inside a real park that park's own photos crossfade in on top.
 */
export function HeroBackground({ imageSrc }: HeroBackgroundProps) {
  return HERO_3D_ENABLED ? <HeroBackground3D /> : <HeroBackgroundClassic imageSrc={imageSrc} />;
}

/** Classic hero: a rotating, ken-burns park photo under a branded overlay. */
function HeroBackgroundClassic({ imageSrc }: HeroBackgroundProps) {
  return (
    <div className="bg-background absolute inset-0 -z-10 overflow-hidden">
      <RandomHeroImage imageSrc={imageSrc} />
      {/* Branded overlay — from-background is navy in dark mode, near-white in light mode */}
      <div className="from-background/60 via-background/10 to-muted/40 dark:from-background dark:via-background/20 dark:to-muted/70 absolute inset-0 bg-gradient-to-br" />
      <div className="from-park-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent" />
    </div>
  );
}

/**
 * The animated three.js RollerCoaster-Tycoon-style park (entrance arch, coaster,
 * Ferris wheel, carousel, stalls, peeps…) that the camera flies through. A CSS
 * gradient sky paints instantly underneath — the pre-load placeholder and the
 * no-WebGL fallback — with a bright daytime variant and a night variant for dark
 * mode, matching the scene's own day/night look so the canvas fades in seamlessly.
 */
function HeroBackground3D() {
  // `sceneReady` flips when the 3D park signals it's loaded. The loader lives
  // HERE (always mounted) rather than inside HeroThreePark, so it's visible
  // during the three.js chunk download too — not only after it has mounted.
  const [sceneReady, setSceneReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const onReady = useCallback(() => {
    setSceneReady(true);
    setProgress(1);
  }, []);
  // Real asset-load progress (textures/logos) maps to [0, 0.9]; the bar only
  // reaches 100% on ready (onLoad). Never let it go backwards.
  const onProgress = useCallback((p: number) => {
    setProgress((prev) => Math.max(prev, p * 0.9));
  }, []);
  // While loading, ease the bar forward so it always feels alive even before the
  // first real progress event (the three.js chunk download isn't tracked). Plus
  // a safety net that reveals the scene if nothing ever signals ready.
  useEffect(() => {
    if (sceneReady) return;
    const id = setInterval(() => {
      setProgress((p) => (p < 0.9 ? p + (0.9 - p) * 0.05 : p));
    }, 120);
    const safety = setTimeout(() => {
      setSceneReady(true);
      setProgress(1);
    }, 8000);
    return () => {
      clearInterval(id);
      clearTimeout(safety);
    };
  }, [sceneReady]);

  return (
    <div className="bg-background absolute inset-0 -z-10 overflow-hidden">
      {/* Instant gradient sky — bright by day, deep blue at night (dark mode),
          matching the 3D sky so the canvas fades in seamlessly. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#3b8fe3_0%,#7fc2f3_55%,#cdeeff_100%)] dark:bg-[linear-gradient(to_bottom,#070b1e_0%,#142150_55%,#33508c_100%)]" />
      {/* three.js park scene (client-only, fades in when ready) */}
      <HeroThreePark onReady={onReady} onProgress={onProgress} />
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
        <span className="bg-background/55 inline-flex flex-col items-center gap-1.5 rounded-2xl px-4 py-2.5 shadow-sm backdrop-blur-md">
          <span className="text-foreground/80 inline-flex items-center gap-2 text-xs font-medium">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading 3D park… {Math.round(progress * 100)}%
          </span>
          <span className="bg-foreground/15 block h-1.5 w-44 overflow-hidden rounded-full">
            <span
              className="bg-foreground/70 block h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </span>
        </span>
      </div>
    </div>
  );
}
