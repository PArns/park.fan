'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { HERO_IMAGES } from '@/lib/hero-images';

// Tiny nature gradient (sky → meadow → forest) shown as blurred placeholder while the hero image loads.
// Generated from: <svg ...><linearGradient sky-blue → mint-green → forest-green></svg>
const HERO_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSI3Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNkI5RkQ0Ii8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiM4Q0M1QTMiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM0QTc4NTYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iNyIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==';

interface RandomHeroImageProps {
  imageSrc?: string;
}

export function RandomHeroImage({ imageSrc }: RandomHeroImageProps) {
  const [randomImage, setRandomImage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (imageSrc) return;
    const timer = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
      setRandomImage(HERO_IMAGES[randomIndex]);
    }, 0);
    return () => clearTimeout(timer);
  }, [imageSrc]);

  const finalImage = imageSrc || randomImage;
  const isServerImage = !!imageSrc;

  return (
    <>
      {/*
       * Blurred nature gradient – always mounted, crossfades OUT as the real image fades IN.
       * Kept as a separate div so the blur is never hidden by the image's own opacity-0 state.
       * scale(1.05) prevents the blur filter from leaving a visible edge.
       */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
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
          src={finalImage}
          alt="Park Background"
          fill
          priority={isServerImage}
          fetchPriority={isServerImage ? 'high' : undefined}
          quality={85}
          className={`object-cover transition-opacity duration-1000 will-change-transform ${
            isLoaded ? 'opacity-90' : 'opacity-0'
          }`}
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
