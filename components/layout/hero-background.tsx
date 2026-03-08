'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { HERO_IMAGES } from '@/lib/hero-images';

interface RandomHeroImageProps {
  imageSrc?: string;
}

export function RandomHeroImage({ imageSrc }: RandomHeroImageProps) {
  // Pick random image on client-side mount for true randomization
  const [randomImage, setRandomImage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (imageSrc) return; // Don't randomize if provided

    // Random selection happens once on mount
    // Use setTimeout to avoid synchronous state updates in effect
    const timer = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
      setRandomImage(HERO_IMAGES[randomIndex]);
    }, 0);
    return () => clearTimeout(timer);
  }, [imageSrc]);

  const finalImage = imageSrc || randomImage;

  if (!finalImage) {
    return null;
  }

  // If provided from server (imageSrc), we can load with priority and no fade-in
  const isServerImage = !!imageSrc;

  return (
    <Image
      src={finalImage}
      alt="Park Background"
      fill
      priority={isServerImage}
      fetchPriority={isServerImage ? 'high' : undefined}
      quality={85}
      className={`object-cover transition-opacity duration-1000 will-change-transform ${
        isServerImage || isLoaded ? 'opacity-90' : 'opacity-0'
      }`}
      style={{ animation: 'ken-burns 22s ease-in-out infinite alternate' }}
      onLoad={() => setIsLoaded(true)}
      sizes="100vw"
    />
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
