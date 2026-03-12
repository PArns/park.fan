'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { HERO_IMAGES } from '@/lib/hero-images';

// Brand-matched blur placeholder: deep park-primary blue → teal → forest green → dark ground.
// Colors mirror the park.fan logo (blue orbit ring, green chart bars, dark background).
// Generated from: <svg gradient #1a3f6f → #1e5f78 → #1e5a3a → #0f1e0f>
const HERO_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PSc3Jz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9J2cnIHgxPScwJyB5MT0nMCcgeDI9JzAnIHkyPScxJz48c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMWEzZjZmJy8+PHN0b3Agb2Zmc2V0PSc0MCUnIHN0b3AtY29sb3I9JyMxZTVmNzgnLz48c3RvcCBvZmZzZXQ9Jzc1JScgc3RvcC1jb2xvcj0nIzFlNWEzYScvPjxzdG9wIG9mZnNldD0nMTAwJScgc3RvcC1jb2xvcj0nIzBmMWUwZicvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPScxMCcgaGVpZ2h0PSc3JyBmaWxsPSd1cmwoI2cpJy8+PC9zdmc+';

interface RandomHeroImageProps {
  imageSrc?: string;
}

export function RandomHeroImage({ imageSrc }: RandomHeroImageProps) {
  const [randomImage, setRandomImage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  // When the image is already in browser cache we skip the fade animation entirely.
  const [skipFade, setSkipFade] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageSrc) return;
    const timer = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
      setRandomImage(HERO_IMAGES[randomIndex]);
    }, 0);
    return () => clearTimeout(timer);
  }, [imageSrc]);

  const finalImage = imageSrc || randomImage;

  // After the <img> element mounts (or finalImage changes), check whether the browser
  // already has the image in cache. If so, `complete` is true and onLoad won't fire —
  // we mark it loaded immediately without playing the fade-in transition.
  useEffect(() => {
    if (imgRef.current?.complete) {
      setSkipFade(true);
      setIsLoaded(true);
    }
  }, [finalImage]);

  const isServerImage = !!imageSrc;

  return (
    <>
      {/*
       * Blurred brand-gradient backdrop – always mounted, crossfades OUT as the real image fades IN.
       * Kept as a separate div so the blur is never hidden by the image's own opacity-0 state.
       * scale(1.05) prevents the blur filter from leaving a visible hard edge.
       */}
      <div
        className={`absolute inset-0 ${isLoaded ? 'opacity-0' : 'opacity-100'} ${skipFade ? '' : 'transition-opacity duration-1000'}`}
        style={{
          backgroundImage: `url("${HERO_BLUR_DATA_URL}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(24px)',
          transform: 'scale(1.05)',
        }}
        aria-hidden="true"
      />

      {finalImage && (
        <Image
          ref={imgRef}
          src={finalImage}
          alt="Park Background"
          fill
          priority={isServerImage}
          fetchPriority={isServerImage ? 'high' : undefined}
          quality={85}
          className={`object-cover will-change-transform ${isLoaded ? 'opacity-90' : 'opacity-0'} ${skipFade ? '' : 'transition-opacity duration-1000'}`}
          style={{ animation: 'ken-burns 22s ease-in-out infinite alternate' }}
          onLoad={() => setIsLoaded(true)}
          sizes="100vw"
        />
      )}
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
      <div className="from-background via-background/20 to-muted/70 absolute inset-0 bg-gradient-to-br opacity-30 dark:opacity-100" />
      <div className="from-park-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent" />
    </div>
  );
}
