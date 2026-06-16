'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { HERO_IMAGES } from '@/lib/hero-images';
import { getParkHeroImages } from '@/lib/hero-images-park';
import { backgroundImageLoader } from '@/lib/utils/image-loader';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { cn } from '@/lib/utils';
import type { NearbyAttractionsData } from '@/types/nearby';

const KEN_BURNS = 'ken-burns 22s ease-in-out infinite alternate';
/** How long each park image stays before crossfading to the next (only when >1 image). */
const PARK_ROTATE_MS = 8000;

interface RandomHeroImageProps {
  imageSrc?: string;
  noAnimation?: boolean;
}

/**
 * When the user is detected inside a park, rotate through that park's own hero images (crossfade).
 * Runs entirely after the nearby lookup resolves — i.e. after LCP — so it never affects the
 * server-rendered hero image's load. Returns null when there's nothing park-specific to show.
 */
function InParkHeroImages({ noAnimation }: { noAnimation?: boolean }) {
  const { data: nearbyData } = useHomeNearbyParks();
  const parkSlug =
    nearbyData?.type === 'in_park'
      ? (nearbyData.data as NearbyAttractionsData).park?.slug
      : undefined;

  const parkImages = useMemo(() => getParkHeroImages(parkSlug), [parkSlug]);

  // A monotonically increasing counter; the active image is `step % parkImages.length`, so it stays
  // in range across park changes without needing to reset state inside the effect.
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (parkImages.length <= 1) return;
    const id = setInterval(() => setStep((s) => s + 1), PARK_ROTATE_MS);
    return () => clearInterval(id);
  }, [parkImages]);

  if (parkImages.length === 0) return null;

  const index = step % parkImages.length;

  // Render every park image as a stacked layer and crossfade by toggling opacity — the handful of
  // images preload so each transition is instant. Only the active layer runs the ken-burns effect.
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
            i === index ? 'opacity-90' : 'opacity-0'
          )}
          style={i === index && !noAnimation ? { animation: KEN_BURNS } : undefined}
          sizes="(max-width: 768px) 80vw, 115vw"
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
  const { data: nearbyData } = useHomeNearbyParks();
  const inParkSlug =
    nearbyData?.type === 'in_park'
      ? (nearbyData.data as NearbyAttractionsData).park?.slug
      : undefined;
  const hasParkImages = useMemo(() => getParkHeroImages(inParkSlug).length > 0, [inParkSlug]);

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
      {/* Base image: the server-rendered LCP hero (or a client-random fallback). Hidden once the
          in-park park images have taken over, so it doesn't show through their crossfade. */}
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
        style={animating && !hasParkImages ? { animation: KEN_BURNS } : undefined}
        // Decorative full-bleed background under two gradient overlays + opacity-90 + ken-burns,
        // so a slightly smaller (upscaled) image is imperceptible. Under-declaring the mobile
        // width pulls a smaller srcset candidate (lighter LCP on slow connections); desktop
        // keeps the full 115vw rendition untouched.
        sizes="(max-width: 768px) 80vw, 115vw"
      />
      <InParkHeroImages noAnimation={noAnimation} />
    </>
  );
}

interface HeroBackgroundProps {
  imageSrc?: string;
}

export function HeroBackground({ imageSrc }: HeroBackgroundProps) {
  return (
    <div className="bg-background absolute inset-0 -z-10 overflow-hidden">
      <RandomHeroImage imageSrc={imageSrc} />
      {/* Branded overlay — from-background is navy in dark mode, near-white in light mode */}
      <div className="from-background/60 via-background/10 to-muted/40 dark:from-background dark:via-background/20 dark:to-muted/70 absolute inset-0 bg-gradient-to-br" />
      <div className="from-park-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent" />
    </div>
  );
}
